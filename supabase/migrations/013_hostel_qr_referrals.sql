-- =============================================================================
-- Mono Solo Travel — Migración 013: atribución de reservas por QR de hostel
--
-- Fase A de docs/product/HOSTEL_QR_REFERRAL_PROPOSAL.md: captura de origen +
-- una tabla de partners, sin panel admin todavía (alta de hostels por SQL
-- Editor). No es un programa de afiliados con panel propio -- eso queda fuera
-- de alcance sin pasar por DECISION_LOG.md, per AGENTS.md/MVP_SCOPE.md.
-- =============================================================================

create table if not exists public.partners (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,          -- p.ej. 'SEL01' para Selina
  name              text not null,                  -- 'Selina Casco Viejo'
  commission_type   text not null default 'flat' check (commission_type in ('flat', 'percentage')),
  commission_value  numeric(10,2) not null default 0 check (commission_value >= 0),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.partners is
  'Hostels/aliados con QR de referido, para atribucion de reservas y calculo de comision. Alta/edicion por SQL Editor en esta fase (sin panel admin todavia).';

create index if not exists idx_partners_active_code on public.partners (code) where active;

drop trigger if exists trg_partners_updated_at on public.partners;
create trigger trg_partners_updated_at
  before update on public.partners
  for each row execute function public.set_updated_at();

alter table public.partners enable row level security;
grant select, insert, update, delete on public.partners to authenticated;

drop policy if exists partners_admin_all on public.partners;
create policy partners_admin_all on public.partners
  for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Atribucion en bookings. No se toca el check existente de channel
-- (web/b2b/manual) -- el origen "vino de un QR de hostel" se modela aparte,
-- minimizando el blast radius sobre codigo que ya depende de esos 3 valores.
-- -----------------------------------------------------------------------------
alter table public.bookings add column if not exists referral_partner_id uuid references public.partners(id);
comment on column public.bookings.referral_partner_id is
  'Hostel/partner de origen si la reserva vino de un QR (?ref=CODE capturado en localStorage). Null = sin atribucion; nunca bloquea la reserva si el codigo no hace match.';

-- -----------------------------------------------------------------------------
-- create_guest_booking: mismo contrato que 008 + un parametro final opcional
-- p_referral_code. Si hace match con un partner activo, resuelve
-- referral_partner_id; si no (codigo viejo, mal tecleado, hostel dado de
-- baja, o simplemente ausente), la reserva se crea igual sin atribucion.
--
-- IMPORTANTE: agregar un parametro cambia la firma de la funcion (8 args ->
-- 9 args), asi que "create or replace" NO reemplaza la version de 008 -- crea
-- un segundo overload con el mismo nombre. Hay que borrar la firma vieja
-- primero para terminar con una sola funcion (si no, cualquier referencia sin
-- lista de argumentos, como "comment on function ... is", queda ambigua).
-- -----------------------------------------------------------------------------
drop function if exists public.create_guest_booking(uuid, uuid, integer, text, text, text, text, text);

create or replace function public.create_guest_booking(
  p_experience_id     uuid,
  p_availability_id   uuid,
  p_guests            integer,
  p_contact_name      text,
  p_contact_email     text,
  p_contact_phone     text,
  p_payment_reference text default null,
  p_payment_method    text default 'manual',
  p_referral_code     text default null
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exp        public.experiences%rowtype;
  v_avail      public.availability%rowtype;
  v_unit_price numeric(10,2);
  v_total      numeric(10,2);
  v_code       text;
  v_booking_id uuid;
  v_token      uuid;
  v_attempts   int := 0;
  v_partner_id uuid;
begin
  if p_guests is null or p_guests < 1 then
    raise exception 'INVALID_GUESTS: la cantidad de viajeros debe ser >= 1';
  end if;
  if coalesce(trim(p_contact_name), '') = '' or coalesce(trim(p_contact_email), '') = '' then
    raise exception 'INVALID_CONTACT: nombre y correo son obligatorios';
  end if;
  if p_payment_method is not null and p_payment_method not in ('cuantoapp', 'manual', 'transfer') then
    raise exception 'INVALID_METHOD: metodo de pago no permitido';
  end if;

  select * into v_exp from public.experiences where id = p_experience_id;
  if not found then
    raise exception 'EXPERIENCE_NOT_FOUND';
  end if;
  if v_exp.status <> 'active' then
    raise exception 'EXPERIENCE_NOT_ACTIVE';
  end if;

  select * into v_avail
    from public.availability
    where id = p_availability_id and experience_id = p_experience_id
    for update;
  if not found then
    raise exception 'AVAILABILITY_NOT_FOUND';
  end if;
  if v_avail.status <> 'open' then
    raise exception 'AVAILABILITY_CLOSED';
  end if;
  if v_avail.date < current_date then
    raise exception 'AVAILABILITY_PAST: la fecha % ya paso', v_avail.date;
  end if;

  if (v_avail.total_spots - v_avail.booked_spots) < p_guests then
    raise exception 'NOT_ENOUGH_SPOTS: disponibles %, solicitados %',
      (v_avail.total_spots - v_avail.booked_spots), p_guests;
  end if;

  if p_guests > v_exp.max_guests then
    raise exception 'GUESTS_OVER_MAX: maximo % por reserva', v_exp.max_guests;
  end if;

  if p_referral_code is not null and trim(p_referral_code) <> '' then
    select id into v_partner_id
      from public.partners
      where code = trim(p_referral_code) and active = true;
    -- Sin match: v_partner_id queda null, la reserva sigue su curso normal.
  end if;

  v_unit_price := coalesce(v_avail.price_override, v_exp.base_price);
  v_total := v_unit_price * p_guests;

  loop
    v_attempts := v_attempts + 1;
    v_code := 'MS-' || to_char(now(), 'YYMMDD') || '-' ||
              lpad((floor(random() * 100000))::int::text, 5, '0');
    exit when not exists (select 1 from public.bookings where code = v_code);
    if v_attempts > 10 then
      raise exception 'CODE_GENERATION_FAILED';
    end if;
  end loop;

  insert into public.bookings (
    code, user_id, experience_id, availability_id, guests,
    unit_price, total, currency, status, channel,
    contact_name, contact_email, contact_phone, referral_partner_id
  ) values (
    v_code, auth.uid(), p_experience_id, p_availability_id, p_guests,
    v_unit_price, v_total, 'USD', 'pending', 'web',
    trim(p_contact_name), trim(p_contact_email), nullif(trim(p_contact_phone), ''), v_partner_id
  )
  returning id, public_token into v_booking_id, v_token;

  update public.availability
    set booked_spots = booked_spots + p_guests
    where id = p_availability_id;

  return json_build_object(
    'booking_id', v_booking_id,
    'code', v_code,
    'public_token', v_token,
    'status', 'pending',
    'payment_status', null,
    'total', v_total,
    'currency', 'USD'
  );
end;
$$;
comment on function public.create_guest_booking is
  'Crea una reserva pendiente sin exigir ni crear pago automatico. Enlaza user_id = auth.uid() si hay sesion. Rechaza disponibilidad con fecha pasada (008). Atribuye referral_partner_id si p_referral_code hace match con un partner activo (013), sin bloquear si no hace match.';

grant execute on function public.create_guest_booking(uuid, uuid, integer, text, text, text, text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reporte de comisiones. MVP: una vista, no un panel nuevo. RLS de bookings/
-- partners ya restringe lo que cada rol ve al consultarla (admin ve todo,
-- un cliente autenticado no ve partners y por lo tanto no ve filas del join).
-- -----------------------------------------------------------------------------
create or replace view public.partner_bookings_report as
select p.code, p.name, b.id as booking_id, b.code as booking_code, b.total, b.status, b.created_at
from public.bookings b
join public.partners p on p.id = b.referral_partner_id
where b.status = 'confirmed';
comment on view public.partner_bookings_report is
  'Reporte de comisiones por partner (reservas confirmadas). Consultar desde SQL Editor; sin panel admin en esta fase.';

grant select on public.partner_bookings_report to authenticated;

-- =============================================================================
-- Fin migración 013.
-- =============================================================================
