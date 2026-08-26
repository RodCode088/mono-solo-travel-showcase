-- =============================================================================
-- Mono Solo Travel — Migración 003: Row Level Security (RLS)
--
-- RLS habilitado en TODAS las tablas. Las reservas/pagos NO se listan públicamente.
-- La creación de reserva de invitado ocurre solo dentro de create_guest_booking
-- (SECURITY DEFINER), que omite RLS de forma controlada.
-- =============================================================================

alter table public.profiles     enable row level security;
alter table public.experiences  enable row level security;
alter table public.availability enable row level security;
alter table public.bookings     enable row level security;
alter table public.payments     enable row level security;

-- -----------------------------------------------------------------------------
-- Permisos base: RLS decide qué filas puede ver/modificar cada rol, pero los
-- roles de API también necesitan privilegios SQL sobre las tablas.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.experiences to anon, authenticated;
grant select on public.availability to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;

grant insert, update, delete on public.experiences to authenticated;
grant insert, update, delete on public.availability to authenticated;

grant select, update on public.bookings to authenticated;
grant select, update on public.payments to authenticated;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (
    public.is_admin()
    or (id = auth.uid() and role = 'traveler')
  );

-- Un usuario edita su perfil pero NO puede auto-asignarse rol admin:
-- el rol debe permanecer igual al actual, salvo que quien edita sea admin.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()))
  );

-- -----------------------------------------------------------------------------
-- experiences: público lee activas; admin lee/gestiona todo.
-- -----------------------------------------------------------------------------
drop policy if exists experiences_select_public on public.experiences;
create policy experiences_select_public on public.experiences
  for select using (status = 'active' or public.is_admin());

drop policy if exists experiences_admin_write on public.experiences;
create policy experiences_admin_write on public.experiences
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- availability: público lee abiertas; admin gestiona. Visitantes NO modifican cupos.
-- (El incremento de booked_spots ocurre dentro de la RPC SECURITY DEFINER.)
-- -----------------------------------------------------------------------------
drop policy if exists availability_select_public on public.availability;
create policy availability_select_public on public.availability
  for select using (status = 'open' or public.is_admin());

drop policy if exists availability_admin_write on public.availability;
create policy availability_admin_write on public.availability
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- bookings: SIN listado público. Admin ve todas; usuario futuro solo las propias.
-- Inserción solo vía create_guest_booking (definer). Update solo admin.
-- -----------------------------------------------------------------------------
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings
  for select using (public.is_admin() or (user_id is not null and user_id = auth.uid()));

drop policy if exists bookings_admin_update on public.bookings;
create policy bookings_admin_update on public.bookings
  for update using (public.is_admin()) with check (public.is_admin());

-- (No se crea policy de INSERT para anon/authenticated: las inserciones directas
--  quedan bloqueadas; solo la RPC definer puede crear reservas.)

-- -----------------------------------------------------------------------------
-- payments: SIN listado público. Admin gestiona; dueño de la reserva puede leer.
-- Inserción solo vía RPC. Update solo admin.
-- -----------------------------------------------------------------------------
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and b.user_id is not null
        and b.user_id = auth.uid()
    )
  );

drop policy if exists payments_admin_update on public.payments;
create policy payments_admin_update on public.payments
  for update using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- Fin migración 003. Verificación en supabase/tests/rls_verification.sql.
-- =============================================================================
