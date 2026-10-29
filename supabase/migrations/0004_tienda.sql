-- masquePadel: tienda (catálogo con stock por talla y pedidos para recoger en el club).
-- Ejecutar en el SQL Editor después de 0003_torneos.sql.

-- Productos ----------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  brand text not null check (char_length(brand) between 1 and 40),
  category text not null check (category in ('palas', 'zapatillas', 'ropa', 'accesorios')),
  description_es text not null default '' check (char_length(description_es) <= 600),
  description_en text not null default '' check (char_length(description_en) <= 600),
  -- Precio en céntimos.
  price integer not null check (price between 0 and 500000),
  -- Stock por talla: [{"size": "M", "stock": 3}, …]. Talla "" si no hay tallas.
  variants jsonb not null check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) between 1 and 12),
  shape text check (shape in ('redonda', 'lagrima', 'diamante')),
  level text check (level in ('iniciacion', 'intermedio', 'avanzado')),
  image_url text check (image_url ~ '^https://'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Catálogo público (activos); admin ve todo"
  on public.products for select
  to anon, authenticated
  using (active or public.is_admin());

create policy "Solo admin gestiona productos"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Pedidos ------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text not null,
  user_email text not null,
  items jsonb not null,
  total integer not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'ready', 'collected', 'cancelled')),
  created_at timestamptz not null default now()
);

create index orders_user on public.orders (user_id);

alter table public.orders enable row level security;

create policy "Ver pedidos propios; admin todos"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

-- Los pedidos solo se crean con place_order() y se cancelan con cancel_order().
create policy "Admin cambia el estado (listo, entregado)"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin() and status <> 'cancelled');

-- Crea un pedido comprobando y descontando stock de forma atómica.
-- p_items: [{"productId": "...", "size": "M", "quantity": 2}, …]
create or replace function public.place_order(p_items jsonb)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prof record;
  item jsonb;
  prod products%rowtype;
  idx int;
  qty int;
  current_stock int;
  lines jsonb := '[]'::jsonb;
  order_total int := 0;
begin
  if uid is null then
    raise exception 'auth' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 10 then
    raise exception 'invalid' using errcode = 'P0002';
  end if;
  select name, email into prof from profiles where id = uid;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into prod from products where id = (item ->> 'productId')::uuid and active for update;
    if not found then
      raise exception 'invalid:%', item ->> 'productId' using errcode = 'P0002';
    end if;
    qty := (item ->> 'quantity')::int;
    if qty is null or qty not between 1 and 5 then
      raise exception 'invalid:%', prod.id using errcode = 'P0002';
    end if;
    select e.ord - 1 into idx
      from jsonb_array_elements(prod.variants) with ordinality as e(v, ord)
      where e.v ->> 'size' = coalesce(item ->> 'size', '');
    if idx is null then
      raise exception 'invalid:%', prod.id using errcode = 'P0002';
    end if;
    current_stock := (prod.variants -> idx ->> 'stock')::int;
    if current_stock < qty then
      raise exception 'stock:%', prod.id using errcode = 'P0003';
    end if;
    update products
      set variants = jsonb_set(variants, array[idx::text, 'stock'], to_jsonb(current_stock - qty))
      where id = prod.id;
    lines := lines || jsonb_build_object(
      'productId', prod.id, 'name', prod.name, 'size', coalesce(item ->> 'size', ''),
      'quantity', qty, 'unitPrice', prod.price
    );
    order_total := order_total + prod.price * qty;
  end loop;

  return query
    insert into orders (code, user_id, user_name, user_email, items, total)
    values (
      'MP-' || upper(translate(substr(md5(random()::text || clock_timestamp()::text), 1, 5), '01', 'XY')),
      uid, prof.name, prof.email, lines, order_total
    )
    returning *;
end;
$$;

grant execute on function public.place_order(jsonb) to authenticated;

-- Cancela un pedido (el propio cliente o el admin) y devuelve el stock.
create or replace function public.cancel_order(p_order uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o orders%rowtype;
  item jsonb;
  idx int;
begin
  select * into o from orders where id = p_order for update;
  if not found or not (o.user_id = auth.uid() or public.is_admin()) then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  if o.status not in ('pending', 'ready') then
    return;
  end if;
  for item in select * from jsonb_array_elements(o.items) loop
    select e.ord - 1 into idx
      from products p, jsonb_array_elements(p.variants) with ordinality as e(v, ord)
      where p.id = (item ->> 'productId')::uuid and e.v ->> 'size' = item ->> 'size';
    if idx is not null then
      update products
        set variants = jsonb_set(
          variants, array[idx::text, 'stock'],
          to_jsonb((variants -> idx ->> 'stock')::int + (item ->> 'quantity')::int)
        )
        where id = (item ->> 'productId')::uuid;
    end if;
  end loop;
  update orders set status = 'cancelled' where id = p_order;
end;
$$;

grant execute on function public.cancel_order(uuid) to authenticated;

-- Catálogo de ejemplo (marcas ficticias). Edítalo o bórralo desde el panel.
insert into public.products (name, brand, category, description_es, description_en, price, variants, shape, level) values
  ('Carbon Pro 18K', 'Vértice', 'palas', 'Pala de potencia con caras de carbono 18K y núcleo EVA duro. Balance alto para remates definitivos.', 'Power racket with 18K carbon faces and a hard EVA core. High balance for finishing smashes.', 21995, '[{"size":"","stock":4}]'::jsonb, 'diamante', 'avanzado'),
  ('Control 3K', 'Vértice', 'palas', 'Máximo control y punto dulce amplio. Ideal para jugadores de defensa que buscan precisión.', 'Maximum control and a large sweet spot. Ideal for defensive players looking for precision.', 14995, '[{"size":"","stock":6}]'::jsonb, 'redonda', 'intermedio'),
  ('Hybrid Tear', 'Nórdika', 'palas', 'Forma de lágrima con balance medio: el equilibrio perfecto entre potencia y manejabilidad.', 'Teardrop shape with medium balance: the perfect mix of power and handling.', 12995, '[{"size":"","stock":5}]'::jsonb, 'lagrima', 'intermedio'),
  ('Start', 'Altamar', 'palas', 'Ligera, cómoda y con goma blanda. La mejor forma de empezar a jugar al pádel.', 'Light, comfortable and with a soft core. The best way to start playing padel.', 6995, '[{"size":"","stock":8}]'::jsonb, 'redonda', 'iniciacion'),
  ('Grip Clay', 'Nórdika', 'zapatillas', 'Suela de espiga para césped artificial con arena. Agarre y estabilidad en los cambios de dirección.', 'Herringbone sole for sand-filled artificial grass. Grip and stability when changing direction.', 8995, '[{"size":"38","stock":0},{"size":"39","stock":0},{"size":"40","stock":2},{"size":"41","stock":3},{"size":"42","stock":3},{"size":"43","stock":2},{"size":"44","stock":0},{"size":"45","stock":0}]'::jsonb, null, null),
  ('Court Lite', 'Altamar', 'zapatillas', 'Zapatilla ligera y transpirable con amortiguación en el talón para jugar muchas horas.', 'Light, breathable shoe with heel cushioning for long hours on court.', 6495, '[{"size":"38","stock":0},{"size":"39","stock":0},{"size":"40","stock":1},{"size":"41","stock":2},{"size":"42","stock":2},{"size":"43","stock":1},{"size":"44","stock":0},{"size":"45","stock":0}]'::jsonb, null, null),
  ('Camiseta técnica Club', 'masquePadel', 'ropa', 'Camiseta oficial del club en tejido técnico de secado rápido.', 'Official club T-shirt in quick-dry technical fabric.', 2495, '[{"size":"XS","stock":2},{"size":"S","stock":4},{"size":"M","stock":5},{"size":"L","stock":5},{"size":"XL","stock":4},{"size":"XXL","stock":2}]'::jsonb, null, null),
  ('Pantalón corto Dry', 'Nórdika', 'ropa', 'Pantalón corto elástico con bolsillos para las bolas.', 'Stretch shorts with ball pockets.', 2995, '[{"size":"XS","stock":1},{"size":"S","stock":3},{"size":"M","stock":4},{"size":"L","stock":4},{"size":"XL","stock":3},{"size":"XXL","stock":1}]'::jsonb, null, null),
  ('Falda pantalón Ace', 'Altamar', 'ropa', 'Falda con malla interior y cintura ancha para máxima libertad de movimiento.', 'Skort with inner shorts and a wide waistband for full freedom of movement.', 3295, '[{"size":"XS","stock":0},{"size":"S","stock":2},{"size":"M","stock":3},{"size":"L","stock":3},{"size":"XL","stock":2},{"size":"XXL","stock":0}]'::jsonb, null, null),
  ('Bote de pelotas Pro (3 uds)', 'Vértice', 'accesorios', 'Pelotas presurizadas de bote regular, aprobadas para competición.', 'Pressurised balls with a consistent bounce, approved for competition.', 595, '[{"size":"","stock":40}]'::jsonb, null, null),
  ('Overgrips (pack de 3)', 'Nórdika', 'accesorios', 'Overgrips perforados, finos y absorbentes. Colores variados.', 'Thin, absorbent perforated overgrips. Assorted colours.', 795, '[{"size":"","stock":25}]'::jsonb, null, null),
  ('Paletero Tour', 'masquePadel', 'accesorios', 'Paletero con compartimento térmico para dos palas y bolsillo para zapatillas.', 'Racket bag with a thermal compartment for two rackets and a shoe pocket.', 5495, '[{"size":"","stock":0}]'::jsonb, null, null),
  ('Muñequeras (2 uds)', 'masquePadel', 'accesorios', 'Muñequeras de rizo con el logo del club.', 'Terry wristbands with the club logo.', 695, '[{"size":"","stock":15}]'::jsonb, null, null);
