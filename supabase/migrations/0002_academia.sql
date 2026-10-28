-- masquePadel: academia (cursos mensuales y pruebas de nivel).
-- Ejecutar en el SQL Editor después de 0001_reservas.sql.

create table public.academy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 120),
  phone text not null check (char_length(phone) between 6 and 30),
  for_whom text not null check (for_whom in ('adult', 'child')),
  child_age smallint check (child_age between 4 and 17),
  experience text not null check (experience in ('never', 'beginner', 'intermediate', 'advanced')),
  preferred_days smallint[] not null default '{}',
  preferred_time text check (preferred_time in ('morning', 'afternoon', 'evening')),
  test_date date,
  test_slot text check (test_slot in ('09:30', '11:00')),
  notes text check (char_length(notes) <= 300),
  status text not null default 'pending' check (status in ('pending', 'assigned', 'waitlist', 'cancelled')),
  assessed_level text check (assessed_level in ('iniciacion', 'intermedio', 'avanzado', 'infantil')),
  group_id text,
  created_at timestamptz not null default now()
);

create index academy_requests_user on public.academy_requests (user_id);

alter table public.academy_requests enable row level security;

-- Cualquiera puede enviar una solicitud (con o sin cuenta), siempre como pendiente.
create policy "Enviar solicitud"
  on public.academy_requests for insert
  to anon, authenticated
  with check (
    (user_id is null or user_id = auth.uid())
    and status = 'pending'
    and assessed_level is null
    and group_id is null
  );

create policy "Ver solicitudes propias; admin ve todas"
  on public.academy_requests for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Solo admin gestiona solicitudes"
  on public.academy_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- Plazas ocupadas en cada prueba de nivel, sin exponer los datos de nadie.
create or replace function public.level_test_counts()
returns table (test_date date, test_slot text, n bigint)
language sql
stable
security definer
set search_path = public
as $$
  select test_date, test_slot, count(*)
  from academy_requests
  where test_date >= (now() at time zone 'Europe/Madrid')::date and status <> 'cancelled'
  group by test_date, test_slot;
$$;

-- Alumnos asignados a cada grupo.
create or replace function public.academy_group_counts()
returns table (group_id text, n bigint)
language sql
stable
security definer
set search_path = public
as $$
  select group_id, count(*)
  from academy_requests
  where status = 'assigned' and group_id is not null
  group by group_id;
$$;

grant execute on function public.level_test_counts() to anon, authenticated;
grant execute on function public.academy_group_counts() to anon, authenticated;
