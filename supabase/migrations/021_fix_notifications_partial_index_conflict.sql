-- =============================================================================
-- Mono Solo Travel — Migración 021: arregla el trigger que rompía TODA
-- reserva desde la migración 016
--
-- Bug crítico encontrado el 2026-08-20: el índice único de `notifications`
-- (`notifications_booking_kind_channel`, creado en 016) es PARCIAL --
-- `where booking_id is not null`. Postgres exige que un `on conflict (...)`
-- repita ese mismo `where` para poder inferir el índice; sin él, la
-- inserción falla con "there is no unique or exclusion constraint matching
-- the ON CONFLICT specification". `enqueue_booking_notifications()` (016,
-- reescrita en 019) no lo tenía, así que el trigger `after insert on
-- bookings` fallaba SIEMPRE, y como un trigger que falla revierte el INSERT
-- completo, **ninguna reserva se pudo crear desde que se aplicó 016** --
-- el error genérico "Ocurrio un error. Intenta de nuevo." en el checkout es
-- exactamente este fallo, no un problema de disponibilidad ni de datos.
-- =============================================================================

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
  on conflict (booking_id, kind, channel) where booking_id is not null do nothing;

  insert into public.notifications (booking_id, kind, channel, recipient, payload)
  values (new.id, 'booking_received_customer', 'email', new.contact_email, v_payload)
  on conflict (booking_id, kind, channel) where booking_id is not null do nothing;

  v_review_at := (coalesce(v_date, current_date + 1)::text || ' 20:00')::timestamptz;
  insert into public.notifications (booking_id, kind, channel, recipient, payload, scheduled_for)
  values (new.id, 'thanks_and_review', 'email', new.contact_email, v_payload, v_review_at)
  on conflict (booking_id, kind, channel) where booking_id is not null do nothing;

  return new;
end;
$$;
comment on function public.enqueue_booking_notifications is
  'Encola E1 (aviso interno), E2 (aviso al cliente) y E8 (agradecimiento + pedir resena, programado) al crear una reserva. El ON CONFLICT repite el WHERE del indice parcial (021) -- sin eso, Postgres no puede inferir el indice y la insercion (y por lo tanto la reserva completa) falla siempre.';

-- =============================================================================
-- Fin migración 021.
-- =============================================================================
