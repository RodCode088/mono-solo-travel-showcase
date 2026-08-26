-- =============================================================================
-- Mono Solo Travel - Migracion 015: Bar Hopping + duraciones erroneas
-- (pedido del cliente, 2026-08-18)
--
-- Ejecutar en Supabase STAGING primero, despues en produccion.
-- Idempotente: se puede re-ejecutar sin duplicar ni perder datos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bar Hopping (e-024): contenido listo, falta el dato comercial.
--
-- La 014 ya inserto la fila como 'draft' con base_price 0. El contenido
-- (descripcion, itinerario, incluye/no incluye, requisitos y las 4 fotos de
-- "24 - Bar Hopping") ya esta en el frontend, asi que lo unico que falta para
-- publicarla es el precio y la capacidad reales.
--
-- >>> ACCION DEL DUENO: reemplazar los valores marcados y ejecutar. <<<
-- Mientras base_price siga en 0 la experiencia mostraria "desde USD 0", asi
-- que este bloque NO se activa solo: hay que poner el precio a proposito.
--
-- update public.experiences
--    set base_price = 25.00,   -- <<< PRECIO REAL
--        min_guests = 1,
--        max_guests = 12,      -- <<< CUPO MAXIMO POR SALIDA
--        duration   = 5,       -- horas
--        status     = 'active'
--  where legacy_id = 'e-024';
--
-- Despues hay que cargar fechas en /admin/disponibilidad: sin filas en
-- availability la ficha se publica pero el boton queda en "Consultar cupo".

-- Titulo y resumen si que se pueden dejar alineados con el contenido nuevo,
-- sin publicar nada todavia.
update public.experiences
   set title   = 'Bar Hopping',
       summary = 'Casco Antiguo de noche: rooftops con vista al skyline, un speakeasy escondido y bares de callejon donde toman los locales.',
       duration = 5
 where legacy_id = 'e-024';

-- -----------------------------------------------------------------------------
-- 2. Duraciones importadas mal por la 007.
--
-- El importador dedujo la duracion buscando "overnight|beyond|castaway" en la
-- descripcion completa. La palabra "beyond" aparece de forma casual en varios
-- textos, asi que cinco experiencias quedaron con 36 horas. hydrateCatalog()
-- usa row.duration antes que la del contenido estatico, de modo que el sitio
-- publicado muestra hoy "36 h aprox." en la tarjeta de un taller de chocolate,
-- un tatuaje, una caminata por la Zona del Canal y un dia de surf.
--
-- e-026 (San Blas Castaway: Overnight & Beyond) SI es de 36 h y se deja igual.
update public.experiences set duration = 3  where legacy_id = 'e-007'; -- Canal Zone Legacy Walk
update public.experiences set duration = 3  where legacy_id = 'e-022'; -- Haz tu propio chocolate
update public.experiences set duration = 3  where legacy_id = 'e-038'; -- Tatuaje neo-tribal
update public.experiences set duration = 5  where legacy_id = 'e-036'; -- Dia de surf: escape desde la ciudad

-- -----------------------------------------------------------------------------
-- 3. Titulo de prueba filtrado a produccion.
--
-- e-046 quedo guardado como "PRUEBA: Yoga y funcionales...". El sitio publico
-- no lo muestra porque el titulo visible sale del contenido traducido, pero si
-- aparece en el panel de administracion y en cualquier consulta a la tabla.
update public.experiences
   set title = 'Yoga y funcionales: esculpe tu cuerpo'
 where legacy_id = 'e-046'
   and title like 'PRUEBA:%';

-- Verificacion esperada:
-- select legacy_id, title, base_price, duration, status
--   from public.experiences
--  where legacy_id in ('e-007','e-022','e-024','e-036','e-038','e-046')
--  order by legacy_id;
--   e-007 3 | e-022 3 | e-024 draft/5 | e-036 5 | e-038 3 | e-046 sin "PRUEBA:"
-- =============================================================================
