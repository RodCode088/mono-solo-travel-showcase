-- =============================================================================
-- Mono Solo Travel — Migración 004: renombrar rol 'traveler' -> 'customer'
--
-- Decisión del product owner (2026-07-10, docs/decisions/DECISION_LOG.md):
-- renombrar directamente el rol público de 'traveler' a 'customer'. NO es un
-- shim de compatibilidad; 'traveler' deja de existir tras esta migración.
--
-- Seguro de ejecutar en Supabase STAGING (SQL Editor o CLI).
-- Idempotente: se puede re-ejecutar sin romper (usa IF EXISTS / updates guardados).
-- NO reescribe migraciones anteriores; solo altera el estado actual.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Quitar el CHECK actual sobre profiles.role (creado inline en 001, con
--    nombre autogenerado). Se elimina cualquier check de la columna role para
--    ser robustos ante distintos nombres de constraint.
-- -----------------------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 2. Nuevo default y migración de filas existentes ANTES de re-crear el check
--    (así ninguna fila 'traveler' viola la nueva constraint).
-- -----------------------------------------------------------------------------
alter table public.profiles alter column role set default 'customer';

update public.profiles set role = 'customer' where role = 'traveler';

-- -----------------------------------------------------------------------------
-- 3. Re-crear el CHECK con el nuevo conjunto de roles. 'b2b_partner' se mantiene
--    (el portal B2B queda oculto para una fase futura, no se elimina).
-- -----------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'admin', 'b2b_partner'));

comment on column public.profiles.role is
  'Rol del usuario. Público = customer (renombrado desde traveler en 004). El rol solo lo cambia un admin (RLS).';

-- -----------------------------------------------------------------------------
-- 4. Actualizar la policy de INSERT de profiles: el auto-registro público crea
--    su propia fila SOLO con role = 'customer' (nunca admin/b2b).
-- -----------------------------------------------------------------------------
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (
    public.is_admin()
    or (id = auth.uid() and role = 'customer')
  );

-- =============================================================================
-- Fin migración 004. La creación automática del perfil al registrarse y el
-- enlace de reservas a cuentas se define en 005.
-- =============================================================================
