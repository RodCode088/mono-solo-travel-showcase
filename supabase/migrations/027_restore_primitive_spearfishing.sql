-- =============================================================================
-- Mono Solo Travel — Migración 027: restaurar Primitive Spearfishing (e-025)
--
-- El cliente había eliminado esta experiencia (migración 014, "el cliente la
-- elimino"), que la despublicó con status = 'draft' en vez de borrarla. El
-- owner pidió traerla de vuelta el 2026-08-25 ("necesitamos de vuelta la
-- experiencia de pesca que teniamos antes... en las experiencias de colon y
-- sister moon"), que coincide con su categoría/provincia original en Cuanto
-- (📍Colón & Sister Moon Experiences — ver el .txt fuente de la carpeta 25).
--
-- El contenido (título, descripción, fotos, itinerario) vive en el catálogo
-- estático del frontend y ya fue restaurado ahí (src/data/mono-experiences.js
-- y src/data/experience-client-overrides.js: se sacó el 25 de removedOrders y
-- se agregó a colonOrders). Esta migración cubre solo lo que vive en
-- Supabase: reactivar la fila y dejarla con la misma categoría/provincia que
-- sus hermanas de Colón (10, 19, 29, 35, 37 — backfill de las migraciones
-- 023 y 024).
--
-- Ejecutar en Supabase STAGING primero, después en producción.
-- Idempotente: se puede re-ejecutar sin duplicar ni perder datos.
-- =============================================================================

update public.experiences
   set status = 'active',
       province = 'colon',
       category = 'Colón & Sister Moon Experiences'
 where legacy_id = 'e-025';

-- Nota: esto NO crea disponibilidad. Sin filas en `availability` para e-025,
-- la experiencia aparece en el catálogo pero no es reservable todavía —
-- cargar fechas/cupos desde /admin/disponibilidad antes de anunciarla.

-- Verificación esperada:
-- select legacy_id, title, status, province, category
--   from public.experiences
--  where legacy_id = 'e-025';
--   status active | province colon | category 'Colón & Sister Moon Experiences'
-- =============================================================================
