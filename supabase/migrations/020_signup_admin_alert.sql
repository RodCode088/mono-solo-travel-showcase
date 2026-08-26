-- =============================================================================
-- Mono Solo Travel — Migración 020: aviso interno cuando alguien se registra
--
-- 019 solo encolaba el correo de bienvenida al cliente (signup_welcome). El
-- dueño pidió explícitamente que TAMBIÉN les llegue un aviso a ellos cuando
-- alguien se suscribe, no solo cuando reserva -- ese caso quedó afuera.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_full_name text;
  v_phone     text;
begin
  v_full_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), null);
  v_phone     := nullif(trim(new.raw_user_meta_data->>'phone'), '');

  insert into public.profiles (id, full_name, role, email, phone)
  values (new.id, v_full_name, 'customer', new.email, v_phone)
  on conflict (id) do update
    set email = excluded.email,
        phone = coalesce(excluded.phone, public.profiles.phone);

  insert into public.notifications (booking_id, kind, channel, recipient, payload)
  values (
    null,
    'signup_welcome',
    'email',
    new.email,
    jsonb_build_object('full_name', v_full_name, 'email', new.email)
  );

  insert into public.notifications (booking_id, kind, channel, recipient, payload)
  values (
    null,
    'signup_admin',
    'email',
    'monosolot@gmail.com',
    jsonb_build_object('full_name', v_full_name, 'email', new.email, 'phone', v_phone)
  );

  return new;
end;
$$;
comment on function public.handle_new_user is
  'Crea el profile (role=customer) al registrarse, guarda email/telefono, y encola el correo de bienvenida (signup_welcome) + el aviso interno (signup_admin).';

-- =============================================================================
-- Fin migración 020.
-- =============================================================================
