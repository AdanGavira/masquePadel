-- masquePadel: esquema de reservas para Supabase.
-- Ejecutar en el SQL Editor del proyecto (o con `supabase db push`).

-- Perfiles de usuario --------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'player' check (role in ('player', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Crea el perfil al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Cada usuario ve su perfil; admin ve todos"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- Reservas -------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  court_id smallint not null check (court_id between 1 and 4),
  date date not null,
  slot text not null check (slot in ('08:00','09:30','11:00','12:30','14:00','15:30','17:00','18:30','20:00','21:30')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Nunca dos reservas confirmadas en la misma pista y turno.
create unique index bookings_one_per_slot
  on public.bookings (court_id, date, slot)
  where status = 'confirmed';

create index bookings_user on public.bookings (user_id);

alter table public.bookings enable row level security;

create policy "Ver reservas propias; admin ve todas"
  on public.bookings for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Reservar a nombre propio"
  on public.bookings for insert
  with check (
    user_id = auth.uid()
    and status = 'confirmed'
    -- Turno futuro y dentro de los próximos 14 días (hora de Sevilla).
    and (date + slot::time) at time zone 'Europe/Madrid' > now()
    and date <= (now() at time zone 'Europe/Madrid')::date + 13
  );

create policy "Cancelar reservas propias; admin cualquiera"
  on public.bookings for update
  using (
    public.is_admin()
    or (
      user_id = auth.uid()
      -- Cancelación con al menos 24 h de antelación.
      and (date + slot::time) at time zone 'Europe/Madrid' - interval '24 hours' >= now()
    )
  )
  with check (status = 'cancelled');

-- Pistas bloqueadas (mantenimiento, clases, torneos) ---------------------------
create table public.blocks (
  court_id smallint not null check (court_id between 1 and 4),
  date date not null,
  slot text not null,
  primary key (court_id, date, slot)
);

alter table public.blocks enable row level security;

create policy "Solo admin gestiona bloqueos"
  on public.blocks for all
  using (public.is_admin())
  with check (public.is_admin());

-- No se puede reservar un hueco bloqueado.
create or replace function public.reject_blocked_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from blocks b where b.court_id = new.court_id and b.date = new.date and b.slot = new.slot) then
    raise exception 'Pista bloqueada' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger bookings_reject_blocked
  before insert on public.bookings
  for each row execute function public.reject_blocked_booking();

-- Ocupación pública de un día, sin exponer quién ha reservado.
create or replace function public.occupied_slots(p_date date)
returns table (court_id smallint, slot text, kind text, mine boolean)
language sql
stable
security definer
set search_path = public
as $$
  select b.court_id, b.slot, 'booked', b.user_id = auth.uid()
  from bookings b
  where b.date = p_date and b.status = 'confirmed'
  union all
  select k.court_id, k.slot, 'blocked', false
  from blocks k
  where k.date = p_date;
$$;

grant execute on function public.occupied_slots(date) to anon, authenticated;
