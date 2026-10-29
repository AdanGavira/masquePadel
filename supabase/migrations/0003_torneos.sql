-- masquePadel: torneos de fin de semana, cuadros eliminatorios y ranking.
-- Ejecutar en el SQL Editor después de 0002_academia.sql.

-- Torneos ----------------------------------------------------------------------
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  date date not null check (extract(dow from date) in (0, 6)),
  start_slot text not null,
  end_slot text not null,
  categories text[] not null check (categories <@ array['masculino', 'femenino', 'mixto'] and cardinality(categories) > 0),
  max_pairs smallint not null check (max_pairs in (8, 16)),
  price_per_pair smallint not null check (price_per_pair between 0 and 500),
  registration_closes date not null check (registration_closes <= date),
  bracket_generated boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;

create policy "Torneos públicos"
  on public.tournaments for select
  to anon, authenticated
  using (true);

create policy "Solo admin crea y edita torneos"
  on public.tournaments for all
  using (public.is_admin())
  with check (public.is_admin());

-- Inscripciones ------------------------------------------------------------------
create table public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  category text not null check (category in ('masculino', 'femenino', 'mixto')),
  user_id uuid not null references public.profiles (id) on delete cascade,
  player1_name text not null check (char_length(player1_name) between 1 and 80),
  player1_email text not null check (player1_email = lower(player1_email)),
  player2_name text not null check (char_length(player2_name) between 1 and 80),
  player2_email text not null check (player2_email = lower(player2_email) and player2_email <> player1_email),
  seed smallint,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Un jugador solo puede estar una vez por categoría y torneo.
create unique index registrations_player1_once
  on public.tournament_registrations (tournament_id, category, player1_email) where status = 'confirmed';
create unique index registrations_player2_once
  on public.tournament_registrations (tournament_id, category, player2_email) where status = 'confirmed';

alter table public.tournament_registrations enable row level security;

create policy "Ver inscripciones propias (jugador 1 o compañero); admin todas"
  on public.tournament_registrations for select
  using (
    user_id = auth.uid()
    or player2_email = lower(auth.jwt() ->> 'email')
    or public.is_admin()
  );

create policy "Inscribirse a nombre propio con inscripciones abiertas"
  on public.tournament_registrations for insert
  with check (
    user_id = auth.uid()
    and status = 'confirmed'
    and seed is null
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and not t.bracket_generated
        and (now() at time zone 'Europe/Madrid')::date <= t.registration_closes
        and category = any (t.categories)
    )
  );

create policy "Cancelar la propia antes del cuadro; admin cualquiera"
  on public.tournament_registrations for update
  using (
    public.is_admin()
    or (
      user_id = auth.uid()
      and not exists (select 1 from public.tournaments t where t.id = tournament_id and t.bracket_generated)
    )
  )
  with check (public.is_admin() or status = 'cancelled');

-- Cupo máximo de parejas por categoría.
create or replace function public.check_tournament_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  taken int;
  max_allowed int;
begin
  select max_pairs into max_allowed from tournaments where id = new.tournament_id;
  select count(*) into taken from tournament_registrations
    where tournament_id = new.tournament_id and category = new.category and status = 'confirmed';
  if taken >= max_allowed then
    raise exception 'Categoría completa' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger tournament_registrations_capacity
  before insert on public.tournament_registrations
  for each row execute function public.check_tournament_capacity();

-- Parejas públicas sin emails: la clave de jugador es un hash del email.
create or replace function public.tournament_pairs(p_tournament uuid default null)
returns table (
  id uuid,
  tournament_id uuid,
  category text,
  player1_name text,
  player2_name text,
  player1_key text,
  player2_key text,
  seed smallint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.tournament_id, r.category, r.player1_name, r.player2_name,
         md5(r.player1_email), md5(r.player2_email), r.seed, r.created_at
  from tournament_registrations r
  where r.status = 'confirmed' and (p_tournament is null or r.tournament_id = p_tournament);
$$;

grant execute on function public.tournament_pairs(uuid) to anon, authenticated;

-- Genera el cuadro: guarda las cabezas de serie y cierra las inscripciones.
create or replace function public.generate_bracket(p_tournament uuid, p_seeds jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  update tournament_registrations r
    set seed = (s ->> 'seed')::smallint
    from jsonb_array_elements(p_seeds) s
    where r.id = (s ->> 'id')::uuid and r.tournament_id = p_tournament;
  update tournaments set bracket_generated = true where id = p_tournament;
end;
$$;

grant execute on function public.generate_bracket(uuid, jsonb) to authenticated;

-- Resultados -------------------------------------------------------------------
create table public.tournament_results (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  category text not null check (category in ('masculino', 'femenino', 'mixto')),
  round smallint not null check (round between 0 and 4),
  position smallint not null check (position between 0 and 15),
  winner text not null check (winner in ('a', 'b')),
  score text not null check (char_length(score) between 1 and 40),
  primary key (tournament_id, category, round, position)
);

alter table public.tournament_results enable row level security;

create policy "Resultados públicos"
  on public.tournament_results for select
  to anon, authenticated
  using (true);

create policy "Solo admin anota resultados"
  on public.tournament_results for all
  using (public.is_admin())
  with check (public.is_admin());
