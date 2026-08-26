-- =============================================================================
-- Mono Solo Travel - Migracion 006: reserva sin pago obligatorio
--
-- Cambia el flujo publico para crear una reserva pendiente sin crear un pago
-- CuantoApp/manual de forma automatica. Mantiene la firma de create_guest_booking
-- para compatibilidad con el frontend y con clientes antiguos.
--
-- Ejecutar despues de 004 y 005 en Supabase STAGING.
-- =============================================================================

create or replace function public.create_guest_booking(
  p_experience_id   uuid,
  p_availability_id uuid,
  p_guests          integer,
  p_contact_name    text,
  p_contact_email   text,
  p_contact_phone   text,
  p_payment_reference text default null,
  p_payment_method  text default 'manual'
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

  if (v_avail.total_spots - v_avail.booked_spots) < p_guests then
    raise exception 'NOT_ENOUGH_SPOTS: disponibles %, solicitados %',
      (v_avail.total_spots - v_avail.booked_spots), p_guests;
  end if;

  if p_guests > v_exp.max_guests then
    raise exception 'GUESTS_OVER_MAX: maximo % por reserva', v_exp.max_guests;
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
    contact_name, contact_email, contact_phone
  ) values (
    v_code, auth.uid(), p_experience_id, p_availability_id, p_guests,
    v_unit_price, v_total, 'USD', 'pending', 'web',
    trim(p_contact_name), trim(p_contact_email), nullif(trim(p_contact_phone), '')
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
comment on function public.create_guest_booking is 'Crea una reserva pendiente sin exigir ni crear pago automatico. Enlaza user_id = auth.uid() si hay sesion.';

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
    left join public.payments p on p.booking_id = b.id
    where b.public_token = p_public_token
    order by p.created_at desc nulls last
    limit 1;

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

  return v_result;
end;
$$;
comment on function public.get_public_booking_confirmation is 'Confirmacion publica por public_token, compatible con reservas sin pago.';

create or replace function public.get_my_bookings()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_result json;
begin
  if auth.uid() is null then
    return '[]'::json;
  end if;

  select coalesce(json_agg(row_to_json(t) order by t.created_at desc), '[]'::json)
  into v_result
  from (
    select
      b.code,
      b.public_token,
      e.title           as experience_title,
      a.date            as date,
      a.start_time      as start_time,
      b.guests,
      b.total,
      b.currency,
      b.status          as booking_status,
      (select p.status from public.payments p
         where p.booking_id = b.id order by p.created_at desc limit 1) as payment_status,
      b.created_at
    from public.bookings b
    join public.experiences e on e.id = b.experience_id
    join public.availability a on a.id = b.availability_id
    where b.user_id = auth.uid()
  ) t;

  return v_result;
end;
$$;
comment on function public.get_my_bookings is 'Reservas del cliente autenticado, compatible con reservas sin pago.';

grant execute on function public.create_guest_booking(uuid, uuid, integer, text, text, text, text, text) to anon, authenticated;
grant execute on function public.get_public_booking_confirmation(uuid) to anon, authenticated;
grant execute on function public.get_my_bookings() to authenticated;

-- =============================================================================
-- Fin migracion 006.
-- =============================================================================
