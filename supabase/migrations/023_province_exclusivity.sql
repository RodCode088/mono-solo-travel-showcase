-- =============================================================================
-- Mono Solo Travel — Migración 023: exclusividad de reservas por provincia
--
-- Sebastian guía en persona Panama City y Colón: solo puede cubrir una
-- experiencia por día en cada una de esas dos provincias. Al confirmarse una
-- reserva en Panama City, el resto de experiencias de Panama City para esa
-- misma fecha se cierran automáticamente (mismo mecanismo para Colón, de
-- forma independiente). El interior del país (Chiriquí/Boquete, Playa Venao
-- / Los Santos), Kuna Yala y Shuttles son delegables a otros guías/choferes y
-- NUNCA se bloquean por esta regla.
--
-- La experiencia que sí se reservó NO se cierra a sí misma: si le quedan
-- cupos, otras personas pueden seguir sumándose a esa misma salida el mismo
-- día (Sebastian ya está ahí de todas formas).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. experiences.province: a qué provincia pertenece cada experiencia.
--    Solo 'panama_city' y 'colon' participan en la regla de exclusividad;
--    las demás quedan etiquetadas para el filtro público pero nunca bloquean.
-- -----------------------------------------------------------------------------
alter table public.experiences
  add column if not exists province text
    check (province is null or province in
      ('panama_city', 'colon', 'chiriqui', 'los_santos', 'kuna_yala', 'shuttles'));

comment on column public.experiences.province is
  'Provincia real de la experiencia (independiente de category/destination, que son solo de UI). panama_city y colon son exclusivas: una reserva confirmada en una de ellas cierra el resto de esa misma provincia para esa fecha (ver trg_bookings_province_exclusivity). Las demas son delegables y nunca bloquean.';

-- Backfill por legacy_id (e-XXX = numero de orden del catalogo original),
-- agrupado igual que primaryCatalogByOrder en src/data/mono-experiences.js.
update public.experiences set province = 'panama_city' where legacy_id in (
  'e-007', 'e-008', 'e-009', 'e-011', 'e-012', 'e-013', 'e-016', 'e-017',
  'e-022', 'e-023', 'e-024', 'e-032', 'e-033', 'e-034', 'e-036', 'e-038',
  'e-040', 'e-041', 'e-043', 'e-046'
);
update public.experiences set province = 'colon' where legacy_id in (
  'e-010', 'e-019', 'e-029', 'e-035', 'e-037'
);
update public.experiences set province = 'chiriqui' where legacy_id in (
  'e-001', 'e-015', 'e-018', 'e-039', 'e-042', 'e-044'
);
update public.experiences set province = 'los_santos' where legacy_id in (
  'e-014', 'e-045'
);
update public.experiences set province = 'kuna_yala' where legacy_id in (
  'e-026', 'e-027'
);
update public.experiences set province = 'shuttles' where legacy_id in (
  'e-002', 'e-003', 'e-004', 'e-005', 'e-006', 'e-020', 'e-021', 'e-028',
  'e-030', 'e-031'
);

-- -----------------------------------------------------------------------------
-- 2. availability.blocked_by_booking_id: qué reserva cerró esta fila por
--    exclusividad de provincia, para poder reabrirla con precisión si esa
--    reserva se cancela (y solo esa: nunca toca un cierre manual del admin,
--    que deja esta columna en null).
-- -----------------------------------------------------------------------------
alter table public.availability
  add column if not exists blocked_by_booking_id uuid
    references public.bookings(id) on delete set null;

comment on column public.availability.blocked_by_booking_id is
  'Si no es null, esta fila fue cerrada automaticamente por exclusividad de provincia (023) a causa de esa reserva. Un cierre manual del admin deja esta columna en null.';

-- -----------------------------------------------------------------------------
-- 3. Trigger: aplica/libera el cierre cuando una reserva entra o sale de
--    'confirmed'. Cubre tanto el alta directa (create_guest_booking crea la
--    reserva ya confirmada) como cualquier cambio de estado manual del admin
--    (confirmar/cancelar desde el panel, aprobar/rechazar pago legacy).
-- -----------------------------------------------------------------------------
create or replace function public.apply_province_exclusivity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_province text;
  v_date     date;
begin
  if tg_op = 'INSERT' and new.status = 'confirmed' then
    select e.province, a.date into v_province, v_date
      from public.experiences e
      join public.availability a on a.id = new.availability_id
      where e.id = new.experience_id;

    if v_province in ('panama_city', 'colon') then
      update public.availability a
        set status = 'closed', blocked_by_booking_id = new.id
        from public.experiences e2
        where a.experience_id = e2.id
          and e2.province = v_province
          and a.date = v_date
          and a.experience_id <> new.experience_id
          and a.status = 'open';
    end if;

  elsif tg_op = 'UPDATE' then
    if new.status = 'confirmed' and old.status <> 'confirmed' then
      select e.province, a.date into v_province, v_date
        from public.experiences e
        join public.availability a on a.id = new.availability_id
        where e.id = new.experience_id;

      if v_province in ('panama_city', 'colon') then
        update public.availability a
          set status = 'closed', blocked_by_booking_id = new.id
          from public.experiences e2
          where a.experience_id = e2.id
            and e2.province = v_province
            and a.date = v_date
            and a.experience_id <> new.experience_id
            and a.status = 'open';
      end if;

    elsif old.status = 'confirmed' and new.status <> 'confirmed' then
      -- Se cancelo (o revirtio) la reserva que causo el cierre: reabre solo
      -- las filas que ESA reserva cerro, nunca un cierre manual del admin.
      update public.availability
        set status = 'open', blocked_by_booking_id = null
        where blocked_by_booking_id = old.id;
    end if;
  end if;

  return new;
end;
$$;
comment on function public.apply_province_exclusivity is
  'Al confirmarse una reserva en panama_city o colon, cierra el resto de disponibilidad abierta de esa misma provincia/fecha (Sebastian guia en persona, una experiencia por dia). Al cancelarse, reabre solo lo que esa reserva habia cerrado.';

drop trigger if exists trg_bookings_province_exclusivity on public.bookings;
create trigger trg_bookings_province_exclusivity
  after insert or update of status on public.bookings
  for each row execute function public.apply_province_exclusivity();

-- -----------------------------------------------------------------------------
-- 4. create_guest_booking: agrega un lock transaccional por (provincia, fecha)
--    ANTES de validar/tomar la fila de disponibilidad. Sin esto, dos personas
--    reservando dos experiencias distintas de la misma provincia en el mismo
--    instante podrian pasar ambas la validacion antes de que el trigger de
--    arriba alcance a cerrar la del otro (condicion de carrera). El lock
--    serializa: la segunda transaccion espera a que la primera termine (y ya
--    haya cerrado el resto de la provincia) antes de revisar su propia fila.
--    Sin cambios de comportamiento fuera de panama_city/colon.
-- -----------------------------------------------------------------------------
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
  v_avail_date date;
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

  if v_exp.province in ('panama_city', 'colon') then
    select date into v_avail_date from public.availability where id = p_availability_id;
    if v_avail_date is not null then
      perform pg_advisory_xact_lock(hashtextextended(v_exp.province || ':' || v_avail_date::text, 0));
    end if;
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
  'Crea una reserva ya confirmada (022) sin exigir ni crear pago automatico -- la capacidad ya se valida de forma atomica en este mismo RPC, no hace falta una revision manual aparte. Enlaza user_id = auth.uid() si hay sesion. Rechaza disponibilidad con fecha pasada (008). Atribuye referral_partner_id si p_referral_code hace match con un partner activo (013), sin bloquear si no hace match. Si la experiencia es de panama_city o colon, toma un advisory lock por provincia+fecha (023) antes de validar disponibilidad, para serializar reservas concurrentes de esa misma provincia y que la exclusividad (trg_bookings_province_exclusivity) no tenga condicion de carrera.';

-- -----------------------------------------------------------------------------
-- 5. get_today_featured_experience: para el "flayer" del inicio. bookings NO
--    tiene lectura publica (003_rls.sql, a proposito: no debe listarse), asi
--    que el homepage no puede consultar esa tabla directo desde el navegador
--    como visitante anonimo -- necesita esta RPC angosta, que solo expone
--    slug/title de la experiencia confirmada de hoy (prioriza panama_city/
--    colon, que es la que realmente ocupa a Sebastian ese dia), sin exponer
--    nunca datos de contacto ni la tabla completa. Devuelve null si hoy no
--    hay ninguna reserva confirmada.
-- -----------------------------------------------------------------------------
create or replace function public.get_today_featured_experience()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_result json;
begin
  select json_build_object('slug', e.slug, 'title', e.title)
    into v_result
    from public.bookings b
    join public.experiences e on e.id = b.experience_id
    join public.availability a on a.id = b.availability_id
    where b.status = 'confirmed'
      and a.date = current_date
    order by (e.province in ('panama_city', 'colon')) desc, b.created_at asc
    limit 1;

  return v_result;
end;
$$;
comment on function public.get_today_featured_experience is
  'Slug/title de la experiencia confirmada de hoy para el banner publico del inicio (prioriza panama_city/colon), o null si no hay ninguna. No expone la tabla bookings ni datos de contacto.';

grant execute on function public.get_today_featured_experience() to anon, authenticated;

-- =============================================================================
-- Fin migración 023.
-- =============================================================================
