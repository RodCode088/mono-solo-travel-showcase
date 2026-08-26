-- =============================================================================
-- Mono Solo Travel — Migración 016: cola de notificaciones (patrón outbox)
--
-- Implementa los eventos E1 (aviso interno) y E2 (aviso al cliente) de
-- docs/product/AUTOMATION_BLUEPRINT.md: al crearse una reserva, se encolan dos
-- filas en `notifications`. Este trigger NUNCA envía nada por sí mismo -- solo
-- inserta en la cola. El envío real lo hace la Edge Function
-- `dispatch-notifications` (supabase/functions/dispatch-notifications), que se
-- despliega y programa por separado (ver docs/execution/PENDIENTES.md).
-- =============================================================================

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references public.bookings(id) on delete cascade,
  partner_id    uuid references public.partners(id) on delete cascade,
  kind          text not null,
  channel       text not null check (channel in ('email','whatsapp','internal')),
  recipient     text not null,
  payload       jsonb not null default '{}',
  scheduled_for timestamptz not null default now(),
  status        text not null default 'pending'
                  check (status in ('pending','sending','sent','failed','cancelled')),
  attempts      int not null default 0,
  last_error    text,
  provider_id   text,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
comment on table public.notifications is
  'Cola outbox de notificaciones (email/whatsapp/internal). La Edge Function dispatch-notifications la drena; nunca se envia nada directo desde un trigger.';

create unique index if not exists notifications_booking_kind_channel
  on public.notifications (booking_id, kind, channel)
  where booking_id is not null;

create index if not exists notifications_due
  on public.notifications (scheduled_for)
  where status = 'pending';

alter table public.notifications enable row level security;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

drop policy if exists notifications_admin_all on public.notifications;
create policy notifications_admin_all on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Encolado automático de E1 (aviso interno a monosolot@gmail.com) y E2 (aviso
-- de "recibimos tu solicitud" al cliente) al crearse una reserva.
--
-- SECURITY DEFINER: create_guest_booking corre con el auth.uid() (o anon) de
-- quien reserva, que no tiene permiso para insertar en notifications (RLS solo
-- admin). El trigger, definido por el dueño de la función (postgres, igual que
-- create_guest_booking en 001/013), sí puede.
-- -----------------------------------------------------------------------------
create or replace function public.enqueue_booking_notifications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exp_title text;
  v_date      date;
  v_time      time;
  v_partner   text;
  v_payload   jsonb;
begin
  select title into v_exp_title from public.experiences where id = new.experience_id;
  select date, start_time into v_date, v_time from public.availability where id = new.availability_id;
  if new.referral_partner_id is not null then
    select name into v_partner from public.partners where id = new.referral_partner_id;
  end if;

  v_payload := jsonb_build_object(
    'booking_code', new.code,
    'public_token', new.public_token,
    'experience_title', coalesce(v_exp_title, ''),
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

  return new;
end;
$$;
comment on function public.enqueue_booking_notifications is
  'Encola E1 (aviso interno) y E2 (aviso al cliente) cada vez que se crea una reserva. Solo inserta en la cola outbox notifications, nunca envia nada directamente.';

drop trigger if exists trg_bookings_enqueue_notifications on public.bookings;
create trigger trg_bookings_enqueue_notifications
  after insert on public.bookings
  for each row execute function public.enqueue_booking_notifications();

-- =============================================================================
-- Fin migración 016.
-- =============================================================================
