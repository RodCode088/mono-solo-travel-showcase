-- =============================================================================
-- Mono Solo Travel - Migracion 014: pedido de cambios del cliente
-- ("From Panama City", Notion 2026-08-07 + aclaraciones 2026-08-09)
--
-- El catalogo publico toma titulos, descripciones, fotos, destino y categoria
-- del contenido estatico del frontend, asi que esos cambios NO necesitan SQL.
-- Esta migracion cubre solo lo que vive en Supabase y que el frontend no puede
-- corregir por su cuenta: estado, precio, duracion y las dos experiencias
-- nuevas.
--
-- Ejecutar en Supabase STAGING primero, despues en produccion.
-- Idempotente: se puede re-ejecutar sin duplicar ni perder datos.
-- =============================================================================

-- NOTA: experiences.status tiene un check constraint de 001_initial_mvp_schema
-- que solo admite 'active', 'paused' o 'draft'. Se usa 'draft' ("no publicado").
-- hydrateCatalog() filtra por status = 'active', asi que cualquier otro valor
-- saca la experiencia del catalogo publico.

-- 1.2 Primitive Spearfishing: Catch Your Dinner -- el cliente la elimino.
-- Se despublica en vez de borrarla para no romper reservas historicas que
-- puedan referenciarla (bookings.experience_id tiene FK contra experiences).
update public.experiences
   set status = 'draft'
 where legacy_id = 'e-025';

-- 1.6 Surf Day Experience: The City Escape -- precio temporal $80.
-- El cliente lo va a revisar mas adelante.
update public.experiences
   set base_price = 80.00
 where legacy_id = 'e-036';

-- 1.3 / 4.1 Duraciones que el cliente indico en las descripciones nuevas.
-- hydrateCatalog() usa row.duration antes que la duracion del contenido
-- estatico, asi que sin esto el sitio publicado seguiria mostrando la vieja.
update public.experiences
   set duration = 9   -- "Full Day (~8 to 9 Hours)"
 where legacy_id = 'e-009';

update public.experiences
   set duration = 3   -- "~3 Hours (Walking Tour + Optional Social Lunch)"
 where legacy_id = 'e-011';

-- 3.1 / 5.2 Experiencias nuevas.
--
-- BLOQUEADO (B3): el cliente todavia no entrego precio, capacidad ni
-- disponibilidad para ninguna de las dos. Entran como 'draft' con
-- base_price 0 a proposito: asi el contenido ya queda cargado y versionado,
-- pero no se publica nada con datos comerciales inventados.
--
-- Para publicarlas, una vez que el cliente confirme los datos:
--   update public.experiences
--      set base_price = <PRECIO>, min_guests = <MIN>, max_guests = <MAX>,
--          duration = <HORAS>, status = 'active'
--    where legacy_id = 'e-023';   -- idem 'e-024'
-- y despues cargar fechas en /admin/disponibilidad (sin availability no se
-- puede reservar aunque esten activas).
insert into public.experiences
  (legacy_id, slug, title, summary, base_price, duration, min_guests, max_guests, status, is_demo)
values
    ('e-023', 'shooting-range-experience-and-sunset-chill', 'Shooting Range Experience & Sunset Chill', 'Practica de tiro bajo el Puente de las Americas y atardecer en Playa Veracruz. Solo fines de semana.', 0.00, 5, 1, 10, 'draft', false),
    ('e-024', 'bar-hopping', 'Bar Hopping', 'Recorrido de bares por el Casco Antiguo de Panama City.', 0.00, 4, 1, 10, 'draft', false)
on conflict (legacy_id) do update set
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  -- No pisa base_price/status/duration/cupos: si el cliente ya cargo los datos
  -- reales, re-ejecutar esta migracion no los revierte a los placeholders.
  is_demo = false;

-- Verificacion esperada:
-- select legacy_id, title, base_price, duration, status
--   from public.experiences
--  where legacy_id in ('e-009','e-011','e-023','e-024','e-025','e-036')
--  order by legacy_id;
--   e-009 duration 9 | e-011 duration 3 | e-023 draft | e-024 draft
--   e-025 draft      | e-036 base_price 80.00
-- =============================================================================
