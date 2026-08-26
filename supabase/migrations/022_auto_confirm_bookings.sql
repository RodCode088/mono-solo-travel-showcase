-- =============================================================================
-- Mono Solo Travel — Migración 022: confirmación automática de reservas
--
-- El dueño pidió que la confirmación deje de ser manual ("para no perder
-- tiempo"). La lógica que hace esto seguro ya existía: create_guest_booking
-- valida capacidad de forma atómica (select ... for update sobre
-- availability, chequeo de cupo antes de insertar) y rechaza fechas pasadas
-- -- no hay nada que un admin estuviera verificando a mano que el propio
-- RPC no verifique ya. Por eso la reserva puede nacer 'confirmed'
-- directamente en vez de 'pending', sin bajar ninguna garantía.
--
-- El botón "Confirmar" se deja en el panel admin (AdminRoutePage.jsx, sin
-- cambios) por si alguna reserva necesita re-confirmarse a mano en un caso
-- raro -- ya no hará falta casi nunca, pero no estorba dejarlo.
-- =============================================================================

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
    v_unit_price, v_total, 'USD', 'confirmed', 'web',
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
    'status', 'confirmed',
    'payment_status', null,
    'total', v_total,
    'currency', 'USD'
  );
end;
$$;
comment on function public.create_guest_booking is
  'Crea una reserva ya confirmada (022) sin exigir ni crear pago automatico -- la capacidad ya se valida de forma atomica en este mismo RPC, no hace falta una revision manual aparte. Enlaza user_id = auth.uid() si hay sesion. Rechaza disponibilidad con fecha pasada (008). Atribuye referral_partner_id si p_referral_code hace match con un partner activo (013), sin bloquear si no hace match.';

-- =============================================================================
-- Fin migración 022.
-- =============================================================================
