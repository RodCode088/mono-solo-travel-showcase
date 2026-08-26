-- =============================================================================
-- Mono Solo Travel — Migración 018: liberar cupo al cancelar una reserva
--
-- Bug real encontrado en la ronda 2026-08-20: availability.booked_spots solo
-- sube (al crear la reserva, en toda RPC desde 002 hasta 013) y nunca baja
-- cuando la reserva pasa a 'cancelled'. Cada fecha ya tiene su propio cupo
-- independiente (una fila de availability por experiencia+fecha) -- no hace
-- falta ningún "reinicio" al pasar el día, lo único que faltaba era corregir
-- el conteo apenas se cancela, para que el cupo quede disponible de inmediato
-- para otro cliente el mismo día.
-- =============================================================================

create or replace function public.free_spots_on_booking_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.availability
    set booked_spots = greatest(0, booked_spots - old.guests)
    where id = old.availability_id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    -- Reactivar una reserva cancelada (el admin la vuelve a poner en pending/
    -- confirmed) debe volver a ocupar el cupo, si no el conteo queda corto.
    update public.availability
    set booked_spots = booked_spots + new.guests
    where id = new.availability_id;
  end if;
  return new;
end;
$$;
comment on function public.free_spots_on_booking_cancelled is
  'Ajusta availability.booked_spots cuando una reserva cambia hacia o desde cancelled, para que un cupo cancelado quede disponible de inmediato.';

drop trigger if exists trg_bookings_free_spots_on_cancel on public.bookings;
create trigger trg_bookings_free_spots_on_cancel
  after update of status on public.bookings
  for each row execute function public.free_spots_on_booking_cancelled();

-- =============================================================================
-- Fin migración 018.
-- =============================================================================
