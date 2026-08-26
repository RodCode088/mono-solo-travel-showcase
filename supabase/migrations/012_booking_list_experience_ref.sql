-- =============================================================================
-- Mono Solo Travel — Migración 012: referencia de experiencia en get_my_bookings
--
-- experiences no tiene columna de imagen (las fotos viven solo en el frontend,
-- en src/data/mono-experiences.js, indexadas por legacy_id/slug). Para que
-- "Mis reservas" pueda mostrar la foto de portada de cada reserva, get_my_bookings
-- necesita devolver un identificador que el frontend pueda usar para resolver
-- esa experiencia en su catálogo estático. Cambio puramente aditivo en el
-- select: misma firma, mismo comportamiento salvo por los 3 campos nuevos.
-- =============================================================================

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
      e.id              as experience_id,
      e.legacy_id       as experience_legacy_id,
      e.slug            as experience_slug,
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
comment on function public.get_my_bookings is
  'Reservas del cliente autenticado (user_id = auth.uid()). Incluye experience_id/legacy_id/slug (012) para que el frontend resuelva la foto de portada, ya que experiences no tiene columna de imagen.';

grant execute on function public.get_my_bookings() to authenticated;

-- =============================================================================
-- Fin migración 012.
-- =============================================================================
