-- =============================================================================
-- Mono Solo Travel — Migración 009: reseñas con calificación (1-5 estrellas)
--
-- Regla de elegibilidad: solo se puede reseñar una reserva propia, confirmada,
-- cuya fecha de disponibilidad ya haya pasado (decisión de producto, no existe
-- estado "completed" en bookings). Sin moderación por ahora: toda reseña se
-- auto-publica (status default 'published'); las columnas de moderación quedan
-- listas para una fase futura sin requerir otro cambio de esquema.
-- =============================================================================

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null unique references public.bookings(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  rating        integer not null check (rating between 1 and 5),
  body          text,
  author_name   text not null,
  status        text not null default 'published'
                  check (status in ('published', 'pending', 'rejected')),
  moderated_by  uuid references auth.users(id),
  moderated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.reviews is 'Reseñas de clientes por reserva. Un review por booking.';
comment on column public.reviews.author_name is
  'Nombre del autor al momento de reseñar (snapshot de profiles.full_name). Evita tener que exponer profiles de otros usuarios via RLS solo para mostrar el nombre en una reseña pública.';
comment on column public.reviews.status is
  'published = visible ahora (auto-publicado, sin moderación en esta fase). pending/rejected quedan reservados para una fase de moderación futura.';

create index if not exists idx_reviews_experience_published
  on public.reviews (experience_id) where status = 'published';
create index if not exists idx_reviews_user on public.reviews (user_id);

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.reviews enable row level security;
grant select on public.reviews to anon, authenticated;

drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select using (status = 'published' or user_id = auth.uid() or public.is_admin());

-- Sin grant de insert/update/delete para anon/authenticated: toda escritura pasa
-- por create_review() (SECURITY DEFINER), mismo patrón que bookings en 003_rls.sql.

-- -----------------------------------------------------------------------------
-- get_my_reviewable_bookings: reservas confirmadas y ya vividas (fecha pasada)
-- del cliente autenticado que todavía no tienen reseña. Alimenta el CTA
-- "Dejar reseña" en el frontend.
-- -----------------------------------------------------------------------------
create or replace function public.get_my_reviewable_bookings()
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

  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  into v_result
  from (
    select b.id as booking_id, b.code, e.id as experience_id,
           e.slug as experience_slug, e.title as experience_title, a.date
    from public.bookings b
    join public.availability a on a.id = b.availability_id
    join public.experiences e on e.id = b.experience_id
    where b.user_id = auth.uid()
      and b.status = 'confirmed'
      and a.date < current_date
      and not exists (select 1 from public.reviews r where r.booking_id = b.id)
  ) t;

  return v_result;
end;
$$;
comment on function public.get_my_reviewable_bookings is
  'Reservas propias, confirmadas, con fecha ya pasada y sin reseña todavia.';

grant execute on function public.get_my_reviewable_bookings() to authenticated;

-- -----------------------------------------------------------------------------
-- create_review: crea una reseña auto-publicada. Re-valida servidor-side que
-- la reserva sea del usuario, esté confirmed y la fecha ya haya pasado — nunca
-- confía en el frontend para la regla de elegibilidad.
-- -----------------------------------------------------------------------------
create or replace function public.create_review(
  p_booking_id uuid,
  p_rating     integer,
  p_body       text
)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_booking     public.bookings%rowtype;
  v_avail       public.availability%rowtype;
  v_author_name text;
  v_review_id   uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
  if v_booking.user_id is null or v_booking.user_id <> auth.uid() then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'BOOKING_NOT_CONFIRMED';
  end if;

  select * into v_avail from public.availability where id = v_booking.availability_id;
  if not found or v_avail.date >= current_date then
    raise exception 'EXPERIENCE_NOT_YET_HAPPENED';
  end if;

  if exists (select 1 from public.reviews where booking_id = p_booking_id) then
    raise exception 'ALREADY_REVIEWED';
  end if;

  select coalesce(nullif(trim(p.full_name), ''), v_booking.contact_name)
    into v_author_name
    from public.profiles p where p.id = auth.uid();

  insert into public.reviews (booking_id, experience_id, user_id, rating, body, author_name, status)
  values (p_booking_id, v_booking.experience_id, auth.uid(), p_rating,
          nullif(trim(p_body), ''), coalesce(v_author_name, 'Viajero Mono Solo'), 'published')
  returning id into v_review_id;

  return json_build_object('review_id', v_review_id, 'status', 'published');
end;
$$;
comment on function public.create_review is
  'Crea una reseña auto-publicada. Solo si la reserva es del usuario, esta confirmed y la fecha de disponibilidad ya pasó. Un review por booking.';

grant execute on function public.create_review(uuid, integer, text) to authenticated;

-- -----------------------------------------------------------------------------
-- get_experience_ratings: agregado público (promedio + cantidad) por
-- experiencia, para la insignia de calificación en catálogo/detalle.
-- -----------------------------------------------------------------------------
create or replace function public.get_experience_ratings()
returns json
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select experience_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
    from public.reviews
    where status = 'published'
    group by experience_id
  ) t;
$$;
comment on function public.get_experience_ratings is
  'Promedio y cantidad de reseñas publicadas por experiencia (público).';

grant execute on function public.get_experience_ratings() to anon, authenticated;

-- =============================================================================
-- Fin migración 009.
-- =============================================================================
