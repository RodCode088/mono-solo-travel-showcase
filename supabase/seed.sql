-- =============================================================================
-- Mono Solo Travel — Seed de STAGING (datos DEMO)
--
-- Inserta lo MÍNIMO para probar el flujo de reserva de punta a punta.
-- Todos los registros llevan is_demo = true: NO son inventario aprobado por el cliente.
-- Idempotente: se puede ejecutar varias veces sin duplicar.
-- NO inserta credenciales ni el usuario administrador (ver docs/setup/ADMIN_ACCOUNT_SETUP.sql).
-- NO incluye 'Panama Signature Week' ni viajes grupales complejos (fuera del flujo real).
--
-- Ejecutar en Supabase staging (SQL Editor) DESPUÉS de las migraciones 001-003.
-- =============================================================================

do $$
declare
  v_exp uuid;
begin
  -- Experiencia demo basada en el mock 'caribbean-island-day' (legacy_id e-001).
  insert into public.experiences
    (legacy_id, slug, title, summary, base_price, duration, min_guests, max_guests, status, is_demo)
  values
    ('e-001', 'caribbean-island-day', 'Caribbean Island Day (DEMO)',
     'Día de isla en el Caribe panameño. DATO DEMO para pruebas de staging.',
     85, 7, 2, 10, 'active', true)
  on conflict (legacy_id) do update set is_demo = true
  returning id into v_exp;

  if v_exp is null then
    select id into v_exp from public.experiences where legacy_id = 'e-001';
  end if;

  -- Disponibilidad futura con cupos suficientes (solo si aún no hay para esta experiencia).
  if not exists (select 1 from public.availability where experience_id = v_exp) then
    insert into public.availability
      (experience_id, date, start_time, total_spots, booked_spots, status, price_override)
    values
      (v_exp, current_date + 7,  '08:00', 10, 0, 'open', null),
      (v_exp, current_date + 10, '14:00', 10, 2, 'open', null),
      (v_exp, current_date + 14, '08:00', 8,  0, 'open', null),
      (v_exp, current_date + 21, '08:00', 12, 0, 'open', 97);
  end if;

  -- Segunda experiencia demo para que el catálogo no quede con un solo ítem.
  insert into public.experiences
    (legacy_id, slug, title, summary, base_price, duration, min_guests, max_guests, status, is_demo)
  values
    ('e-002', 'canyon-thrills-waterfall', 'Canyon Thrills Waterfall Route (DEMO)',
     'Ruta de cascadas en Chiriquí. DATO DEMO para pruebas de staging.',
     65, 5, 2, 8, 'active', true)
  on conflict (legacy_id) do update set is_demo = true
  returning id into v_exp;

  if v_exp is null then
    select id into v_exp from public.experiences where legacy_id = 'e-002';
  end if;

  if not exists (select 1 from public.availability where experience_id = v_exp) then
    insert into public.availability
      (experience_id, date, start_time, total_spots, booked_spots, status, price_override)
    values
      (v_exp, current_date + 8,  '08:00', 8, 0, 'open', null),
      (v_exp, current_date + 12, '14:00', 8, 1, 'open', null);
  end if;
end $$;

-- Verificación rápida (debería devolver filas demo):
-- select legacy_id, slug, status, is_demo from public.experiences where is_demo;
-- select e.legacy_id, a.date, a.total_spots, a.booked_spots, a.status
--   from public.availability a join public.experiences e on e.id = a.experience_id
--   order by e.legacy_id, a.date;
