-- =============================================================================
-- Mono Solo Travel — Migración 017: correo visible en profiles para el admin
--
-- Encontrada al revisar el alta real de "Nana" en /admin/clientes: un cliente
-- que se registra pero todavía no reserva aparecía con correo "-", porque
-- adminListCustomers() solo podía sacar el correo de bookings.contact_email
-- (necesita al menos una reserva). profiles nunca guardó el correo de
-- auth.users, así que no había otra fuente. Esta migración lo agrega y
-- rellena lo que ya existe.
-- =============================================================================

alter table public.profiles add column if not exists email text;

-- Backfill para cuentas creadas antes de este cambio (incluye "Nana").
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is distinct from u.email;

-- A partir de ahora, el alta de cuenta también copia el correo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), null),
    'customer',
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
comment on function public.handle_new_user is
  'Crea el profile (role=customer) automaticamente al registrarse un usuario y guarda su correo -- antes solo vivia en auth.users, invisible para el admin.';

-- Si el usuario cambia su correo en auth (verificación, etc.), mantener
-- profiles.email sincronizado en vez de que quede desactualizado.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
comment on function public.sync_profile_email is
  'Mantiene profiles.email igual a auth.users.email cuando el usuario cambia su correo.';

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- =============================================================================
-- Fin migración 017.
-- =============================================================================
