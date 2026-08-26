-- =============================================================================
-- Mono Solo Travel — Migración 002: funciones RPC seguras y transaccionales
--
-- Todas las funciones SECURITY DEFINER fijan un search_path seguro.
-- La reserva de invitado se hace SOLO por create_guest_booking (atómica),
-- evitando que el navegador combine pasos y produzca sobreventa.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: ¿el usuario autenticado es admin? Usado por RLS y por las RPC admin.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
comment on function public.is_admin() is 'true si el usuario autenticado tiene rol admin en profiles.';

-- -----------------------------------------------------------------------------
-- create_guest_booking: crea reserva + pago de invitado de forma atómica.
-- Bloquea la fila de disponibilidad, valida cupos y calcula el total en servidor.
-- -----------------------------------------------------------------------------
create or replace function public.create_guest_booking(
  p_experience_id   uuid,
  p_availability_id uuid,
  p_guests          integer,
  p_contact_name    text,
  p_contact_email   text,
  p_contact_phone   text,
  p_payment_reference text,
  p_payment_method  text default 'cuantoapp'
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
  v_payment_status text := 'under_review';
  v_attempts   int := 0;
begin
  -- Validaciones de entrada.
  if p_guests is null or p_guests < 1 then
    raise exception 'INVALID_GUESTS: la cantidad de viajeros debe ser >= 1';
  end if;
  if coalesce(trim(p_contact_name), '') = '' or coalesce(trim(p_contact_email), '') = '' then
    raise exception 'INVALID_CONTACT: nombre y correo son obligatorios';
  end if;
  if p_payment_method not in ('cuantoapp', 'manual', 'transfer') then
    raise exception 'INVALID_METHOD: método de pago no permitido';
  end if;

  -- Experiencia activa.
  select * into v_exp from public.experiences where id = p_experience_id;
  if not found then
    raise exception 'EXPERIENCE_NOT_FOUND';
  end if;
  if v_exp.status <> 'active' then
    raise exception 'EXPERIENCE_NOT_ACTIVE';
  end if;

  -- Bloqueo de la fila de disponibilidad durante la operación (anti-sobreventa).
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

  -- Cupos suficientes.
  if (v_avail.total_spots - v_avail.booked_spots) < p_guests then
    raise exception 'NOT_ENOUGH_SPOTS: disponibles %, solicitados %',
      (v_avail.total_spots - v_avail.booked_spots), p_guests;
  end if;

  -- Rango de viajeros de la experiencia.
  if p_guests > v_exp.max_guests then
    raise exception 'GUESTS_OVER_MAX: máximo % por reserva', v_exp.max_guests;
  end if;

  -- Precio y total calculados en servidor (pago completo, sin impuestos: decisión D-1).
  v_unit_price := coalesce(v_avail.price_override, v_exp.base_price);
  v_total := v_unit_price * p_guests;

  -- Código legible único.
  loop
    v_attempts := v_attempts + 1;
    v_code := 'MS-' || to_char(now(), 'YYMMDD') || '-' ||
              lpad((floor(random() * 100000))::int::text, 5, '0');
    exit when not exists (select 1 from public.bookings where code = v_code);
    if v_attempts > 10 then
      raise exception 'CODE_GENERATION_FAILED';
    end if;
  end loop;

  -- Inserta reserva (under_review) — invitado: user_id null, canal web.
  insert into public.bookings (
    code, user_id, experience_id, availability_id, guests,
    unit_price, total, currency, status, channel,
    contact_name, contact_email, contact_phone
  ) values (
    v_code, null, p_experience_id, p_availability_id, p_guests,
    v_unit_price, v_total, 'USD', 'under_review', 'web',
    trim(p_contact_name), trim(p_contact_email), nullif(trim(p_contact_phone), '')
  )
  returning id, public_token into v_booking_id, v_token;

  -- Inserta pago (under_review) con la referencia CuantoApp.
  insert into public.payments (
    booking_id, method, amount, reference, status
  ) values (
    v_booking_id, p_payment_method, v_total, nullif(trim(p_payment_reference), ''), v_payment_status
  );

  -- Incrementa cupos (la constraint availability_no_oversell protege ante carreras).
  update public.availability
    set booked_spots = booked_spots + p_guests
    where id = p_availability_id;

  -- Devuelve solo lo necesario.
  return json_build_object(
    'booking_id', v_booking_id,
    'code', v_code,
    'public_token', v_token,
    'status', 'under_review',
    'payment_status', v_payment_status,
    'total', v_total,
    'currency', 'USD'
  );
end;
$$;
comment on function public.create_guest_booking is 'Crea reserva + pago de invitado de forma atómica con bloqueo de cupos.';

-- -----------------------------------------------------------------------------
-- get_public_booking_confirmation: confirmación pública por token (sin exponer tabla).
-- -----------------------------------------------------------------------------
create or replace function public.get_public_booking_confirmation(p_public_token uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_result json;
  v_ref    text;
  v_masked text;
begin
  if p_public_token is null then
    return null;
  end if;

  select p.reference into v_ref
    from public.bookings b
    join public.payments p on p.booking_id = b.id
    where b.public_token = p_public_token
    order by p.created_at desc
    limit 1;

  -- Enmascara la referencia: deja visibles solo los últimos 4 caracteres.
  if v_ref is not null and length(v_ref) > 4 then
    v_masked := repeat('*', length(v_ref) - 4) || right(v_ref, 4);
  else
    v_masked := v_ref;
  end if;

  select json_build_object(
    'code', b.code,
    'experience_title', e.title,
    'date', a.date,
    'start_time', a.start_time,
    'guests', b.guests,
    'total', b.total,
    'currency', b.currency,
    'booking_status', b.status,
    'payment_status', (
      select p2.status from public.payments p2
      where p2.booking_id = b.id order by p2.created_at desc limit 1
    ),
    'payment_reference_masked', v_masked
  )
  into v_result
  from public.bookings b
  join public.experiences e on e.id = b.experience_id
  join public.availability a on a.id = b.availability_id
  where b.public_token = p_public_token;

  return v_result;  -- null si el token no existe
end;
$$;
comment on function public.get_public_booking_confirmation is 'Confirmación pública por public_token. No expone la tabla de reservas.';

-- -----------------------------------------------------------------------------
-- approve_booking_payment: solo admin. payment->approved, booking->confirmed.
-- -----------------------------------------------------------------------------
create or replace function public.approve_booking_payment(p_payment_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking_id uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED: se requiere rol admin';
  end if;

  update public.payments
    set status = 'approved', verified_by = auth.uid(), verified_at = now()
    where id = p_payment_id
    returning booking_id into v_booking_id;

  if v_booking_id is null then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  update public.bookings set status = 'confirmed' where id = v_booking_id;

  return json_build_object(
    'payment_id', p_payment_id,
    'booking_id', v_booking_id,
    'payment_status', 'approved',
    'booking_status', 'confirmed'
  );
end;
$$;
comment on function public.approve_booking_payment is 'Aprueba pago (admin): payment=approved, booking=confirmed. Transaccional.';

-- -----------------------------------------------------------------------------
-- reject_booking_payment: solo admin. payment->rejected, booking->pending (D-2).
-- NO libera cupos automáticamente (no hay regla de cancelación en esta fase).
-- -----------------------------------------------------------------------------
create or replace function public.reject_booking_payment(p_payment_id uuid)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking_id uuid;
begin
  if not public.is_admin() then
    raise exception 'NOT_AUTHORIZED: se requiere rol admin';
  end if;

  update public.payments
    set status = 'rejected', verified_by = auth.uid(), verified_at = now()
    where id = p_payment_id
    returning booking_id into v_booking_id;

  if v_booking_id is null then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  -- Decisión D-2: la reserva vuelve a 'pending' (a la espera de un nuevo pago).
  -- No se liberan cupos automáticamente.
  update public.bookings set status = 'pending' where id = v_booking_id;

  return json_build_object(
    'payment_id', p_payment_id,
    'booking_id', v_booking_id,
    'payment_status', 'rejected',
    'booking_status', 'pending'
  );
end;
$$;
comment on function public.reject_booking_payment is 'Rechaza pago (admin): payment=rejected, booking=pending. No libera cupos.';

-- -----------------------------------------------------------------------------
-- Permisos de ejecución (la seguridad fina está dentro de cada función).
-- -----------------------------------------------------------------------------
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.create_guest_booking(uuid, uuid, integer, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking_confirmation(uuid) to anon, authenticated;
grant execute on function public.approve_booking_payment(uuid) to authenticated;
grant execute on function public.reject_booking_payment(uuid) to authenticated;
