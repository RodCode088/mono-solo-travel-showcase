-- =============================================================================
-- Mono Solo Travel — Migración 019: telefono en el registro, bienvenida al
-- crear cuenta, agradecimiento + pedido de reseña automatico (E8), y
-- cancelación en cascada de notificaciones pendientes.
--
-- Requiere 016 (tabla notifications), 017 (profiles.email) y 018 (trigger de
-- cupos) ya aplicadas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Teléfono del cliente en su perfil (antes solo existía si había reservado
--    al menos una vez, tomado de bookings.contact_phone). El formulario de
--    registro ahora lo pide y lo manda en el metadata del signUp.
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists phone text;

-- -----------------------------------------------------------------------------
-- 2. handle_new_user: guarda el teléfono y encola el correo de bienvenida
--    (kind='signup_welcome', sin booking_id -- notifications.booking_id ya es
--    nullable). Se dispara una sola vez por alta real (after insert on
--    auth.users), así que no hay riesgo de duplicados.
-- -----------------------------------------------------------------------------
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

  return new;
end;
$$;
comment on function public.handle_new_user is
  'Crea el profile (role=customer) al registrarse, guarda email/telefono, y encola el correo de bienvenida (signup_welcome).';

-- -----------------------------------------------------------------------------
-- 3. enqueue_booking_notifications: además de E1/E2 (ya existían), ahora
--    también encola E8 (thanks_and_review) programado para la noche del día
--    de la experiencia. Aproximación: no hay hora de fin real en el modelo
--    (solo start_time), así que se usa el mismo día a las 20:00 hora del
--    servidor -- razonable para experiencias de un día, que es el 100% del
--    catálogo actual. Se cancela solo si la reserva se cancela antes (ver
--    punto 4).
-- -----------------------------------------------------------------------------
create or replace function public.enqueue_booking_notifications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exp_title text;
  v_exp_slug  text;
  v_date      date;
  v_time      time;
  v_partner   text;
  v_payload   jsonb;
  v_review_at timestamptz;
begin
  select title, slug into v_exp_title, v_exp_slug from public.experiences where id = new.experience_id;
  select date, start_time into v_date, v_time from public.availability where id = new.availability_id;
  if new.referral_partner_id is not null then
    select name into v_partner from public.partners where id = new.referral_partner_id;
  end if;

  v_payload := jsonb_build_object(
    'booking_code', new.code,
    'public_token', new.public_token,
    'experience_title', coalesce(v_exp_title, ''),
    'experience_slug', v_exp_slug,
    'date', v_date,
    'time', v_time,
    'guests', new.guests,
    'total', new.total,
    'currency', new.currency,
    'contact_name', new.contact_name,
    'contact_email', new.contact_email,
    'contact_phone', new.contact_phone,
    'referral_partner_name', v_partner
  );

  insert into public.notifications (booking_id, kind, channel, recipient, payload)
  values (new.id, 'booking_received_admin', 'email', 'monosolot@gmail.com', v_payload)
  on conflict (booking_id, kind, channel) do nothing;

  insert into public.notifications (booking_id, kind, channel, recipient, payload)
  values (new.id, 'booking_received_customer', 'email', new.contact_email, v_payload)
  on conflict (booking_id, kind, channel) do nothing;

  v_review_at := (coalesce(v_date, current_date + 1)::text || ' 20:00')::timestamptz;
  insert into public.notifications (booking_id, kind, channel, recipient, payload, scheduled_for)
  values (new.id, 'thanks_and_review', 'email', new.contact_email, v_payload, v_review_at)
  on conflict (booking_id, kind, channel) do nothing;

  return new;
end;
$$;
comment on function public.enqueue_booking_notifications is
  'Encola E1 (aviso interno), E2 (aviso al cliente) y E8 (agradecimiento + pedir resena, programado) al crear una reserva.';

-- -----------------------------------------------------------------------------
-- 4. Cancelación en cascada: si la reserva se cancela, cualquier notificación
--    todavía pendiente para ese booking (el E8 programado) se marca
--    'cancelled' y el worker nunca la envía. Reemplaza por completo la
--    función de 018 (mismo trigger, ahora hace las dos cosas).
-- -----------------------------------------------------------------------------
create or replace function public.free_spots_on_booking_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.availability
    set booked_spots = greatest(0, booked_spots - old.guests)
    where id = old.availability_id;

    update public.notifications
    set status = 'cancelled'
    where booking_id = old.id and status = 'pending';
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.availability
    set booked_spots = booked_spots + new.guests
    where id = new.availability_id;
  end if;
  return new;
end;
$$;
comment on function public.free_spots_on_booking_cancelled is
  'Al cancelar: libera el cupo y cancela cualquier notificacion programada pendiente (p.ej. el E8 de esa reserva). Al reactivar: vuelve a ocupar el cupo.';

-- =============================================================================
-- Fin migración 019.
-- =============================================================================
