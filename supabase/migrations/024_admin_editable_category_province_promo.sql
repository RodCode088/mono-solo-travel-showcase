-- =============================================================================
-- Mono Solo Travel — Migración 024: categoría, provincia y destacados
-- editables desde el panel de admin (Fase 1 de "todo editable desde el
-- panel", pedido del owner 2026-08-24)
--
-- Hasta ahora category/destination y "cuál experiencia se destaca primero"
-- (walking tour + Caribbean Island Day Escape) vivían solo en código
-- (mono-experiences.js / catalog-promo.js). Esta migración agrega las
-- columnas para que el admin pueda cambiarlas desde /admin/experiencias sin
-- pedir un cambio de código: el VOCABULARIO (qué categorías/provincias
-- existen) sigue siendo de código, lo que se vuelve editable es cuál le
-- corresponde a cada experiencia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. experiences.category: nombre de categoría elegido por el admin, de la
--    misma lista fija que ya usa el catálogo público (categoryMeta en
--    mono-experiences.js). Si es null, el sitio sigue usando la categoría
--    del catálogo estático (compatibilidad hacia atrás, cero riesgo para
--    las 44 experiencias existentes hasta que un admin las edite).
-- -----------------------------------------------------------------------------
alter table public.experiences
  add column if not exists category text
    check (category is null or category in (
      'Beach & Water Experiences', 'Cultural Experiences', 'Extreme Experiences',
      'Free Experiences & Socials', 'Nightlife', 'Jungle & Mountain Experiences',
      'Colón & Sister Moon Experiences', 'Boquete & Chiriqui Province',
      'Playa Venao & Los Santos Province', 'Kuna Yala / San Blas',
      'Shuttles & Logistics', 'Shuttle Tours'
    ));

comment on column public.experiences.category is
  'Categoria elegida desde el panel de admin, de la lista fija definida en categoryMeta (mono-experiences.js). null = usa la categoria del catalogo estatico.';

-- -----------------------------------------------------------------------------
-- 2. experiences.promo_rank: 1 = destacada principal (banner del inicio +
--    primera del catalogo), 2 = destacada secundaria (segunda del catalogo).
--    El indice unico parcial impide que dos filas compartan el mismo rango;
--    el panel de admin limpia el rango anterior antes de asignarlo a otra
--    experiencia (comportamiento de radio button, no de checkbox).
-- -----------------------------------------------------------------------------
alter table public.experiences
  add column if not exists promo_rank integer
    check (promo_rank is null or promo_rank in (1, 2));

create unique index if not exists idx_experiences_promo_rank_unique
  on public.experiences (promo_rank) where promo_rank is not null;

comment on column public.experiences.promo_rank is
  '1 = destacada principal (banner "Hoy estamos haciendo" cuando no hay reserva real + primera del catalogo), 2 = destacada secundaria (segunda del catalogo). Si ninguna fila tiene promo_rank, el sitio usa el walking tour / Caribbean Island Day Escape por defecto (catalog-promo.js).';

-- -----------------------------------------------------------------------------
-- Backfill: deja explícito en Supabase lo que hoy ya está en código, para
-- que el admin vea el estado real reflejado desde el primer momento y las
-- 44 experiencias no queden con category en blanco. Mismo agrupamiento que
-- primaryCatalogByOrder en mono-experiences.js.
-- -----------------------------------------------------------------------------
update public.experiences set category = 'Cultural Experiences' where legacy_id in (
  'e-007', 'e-016', 'e-022', 'e-038', 'e-040'
);
update public.experiences set category = 'Jungle & Mountain Experiences' where legacy_id in (
  'e-008', 'e-013', 'e-043'
);
update public.experiences set category = 'Beach & Water Experiences' where legacy_id in (
  'e-009', 'e-017', 'e-034', 'e-036'
);
update public.experiences set category = 'Colón & Sister Moon Experiences' where legacy_id in (
  'e-010', 'e-019', 'e-029', 'e-035', 'e-037'
);
update public.experiences set category = 'Free Experiences & Socials' where legacy_id in (
  'e-011', 'e-012', 'e-033', 'e-041', 'e-046'
);
update public.experiences set category = 'Boquete & Chiriqui Province' where legacy_id in (
  'e-001', 'e-015', 'e-018', 'e-039', 'e-042', 'e-044'
);
update public.experiences set category = 'Playa Venao & Los Santos Province' where legacy_id in (
  'e-014', 'e-045'
);
update public.experiences set category = 'Extreme Experiences' where legacy_id in (
  'e-023', 'e-032'
);
update public.experiences set category = 'Nightlife' where legacy_id in (
  'e-024'
);
update public.experiences set category = 'Kuna Yala / San Blas' where legacy_id in (
  'e-026', 'e-027'
);
update public.experiences set category = 'Shuttles & Logistics' where legacy_id in (
  'e-002', 'e-003', 'e-004', 'e-005', 'e-006', 'e-020', 'e-021', 'e-028'
);
update public.experiences set category = 'Shuttle Tours' where legacy_id in (
  'e-030', 'e-031'
);

update public.experiences set promo_rank = 1 where legacy_id = 'e-011'; -- "FREE" Casco Walking Tour
update public.experiences set promo_rank = 2 where legacy_id = 'e-009'; -- Caribbean Island Day Escape

-- =============================================================================
-- Fin migración 024.
-- =============================================================================
