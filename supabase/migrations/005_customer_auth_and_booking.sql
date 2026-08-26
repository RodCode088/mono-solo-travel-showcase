-- =============================================================================
-- Mono Solo Travel — Migración 005: auth de cliente + enlace de reservas a cuenta
--
-- Habilita el registro/login público de clientes y conecta las reservas a la
-- cuenta autenticada, sin romper la reserva de invitado (guest).
--
-- Seguro de ejecutar en Supabase STAGING. Requiere 004 aplicada antes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Creación automática del perfil al registrarse.
--    Al insertarse una fila en auth.users (signUp), se crea su profile con
--    role = 'customer'. Evita depender del timing de confirmación de email en
--    el navegador. El nombre viene del metadata del signUp (full_name).
--    Los admin se promueven manualmente por SQL (ACCESS_CONTROL.md), por eso
--    el default siempre es 'customer' y usamos ON CONFLICT DO NOTHING.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), null),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
comment on function public.handle_new_user is 'Crea el profile (role=customer) automáticamente al registrarse un usuario.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. create_guest_booking ahora enlaza la reserva a la cuenta autenticada.
--    auth.uid() es null para visitantes anónimos (guest sigue funcionando) y
--    es el id del cliente cuando hay sesión (aparece en su área privada).
--    Única diferencia vs. 002: user_id = auth.uid() en el INSERT.
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
  if p_guests is null or p_guests < 1 then
    raise exception 'INVALID_GUESTS: la cantidad de viajeros debe ser >= 1';
  end if;
  if coalesce(trim(p_contact_name), '') = '' or coalesce(trim(p_contact_email), '') = '' then
    raise exception 'INVALID_CONTACT: nombre y correo son obligatorios';
  end if;
  if p_payment_method not in ('cuantoapp', 'manual', 'transfer') then
    raise exception 'INVALID_METHOD: método de pago no permitido';
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
    raise exception 'GUESTS_OVER_MAX: máximo % por reserva', v_exp.max_guests;
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

  -- user_id = auth.uid(): null para invitado, id de cuenta cuando hay sesión.
  insert into public.bookings (
    code, user_id, experience_id, availability_id, guests,
    unit_price, total, currency, status, channel,
    contact_name, contact_email, contact_phone
  ) values (
    v_code, auth.uid(), p_experience_id, p_availability_id, p_guests,
    v_unit_price, v_total, 'USD', 'under_review', 'web',
    trim(p_contact_name), trim(p_contact_email), nullif(trim(p_contact_phone), '')
  )
  returning id, public_token into v_booking_id, v_token;

  insert into public.payments (
    booking_id, method, amount, reference, status
  ) values (
    v_booking_id, p_payment_method, v_total, nullif(trim(p_payment_reference), ''), v_payment_status
  );

  update public.availability
    set booked_spots = booked_spots + p_guests
    where id = p_availability_id;

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
comment on function public.create_guest_booking is 'Crea reserva + pago de forma atómica. Enlaza user_id = auth.uid() (invitado si es null).';

-- -----------------------------------------------------------------------------
-- 3. get_my_bookings: reservas del cliente autenticado, con título de la
--    experiencia y estado de pago. SECURITY DEFINER para evitar huecos de RLS
--    en los joins (p.ej. una experiencia pausada que el cliente ya reservó).
--    Solo devuelve reservas cuyo user_id = auth.uid().
-- -----------------------------------------------------------------------------
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
comment on function public.get_my_bookings is 'Reservas del cliente autenticado (user_id = auth.uid()).';

grant execute on function public.get_my_bookings() to authenticated;

-- =============================================================================
-- Fin migración 005.
-- =============================================================================
