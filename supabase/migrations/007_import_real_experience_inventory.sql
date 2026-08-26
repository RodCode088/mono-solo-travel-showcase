-- =============================================================================
-- Mono Solo Travel - Migracion 007: importar inventario real Cuanto a Supabase
--
-- Lleva al backend operacional las 44 experiencias que ya ve el frontend desde
-- assets/mono_experience_by_cuanto. No crea disponibilidad masiva: las fechas y
-- cupos se administran desde /admin/disponibilidad.
--
-- Ejecutar despues de 004, 005 y 006 en Supabase STAGING.
-- Idempotente: se puede re-ejecutar; actualiza por legacy_id.
-- =============================================================================

insert into public.experiences
  (legacy_id, slug, title, summary, base_price, duration, min_guests, max_guests, status, is_demo)
values
    ('e-001', 'artilleria-hill-the-vertical-shortcut', 'Artilleria Hill: el atajo vertical', 'Artilleria Hill: el atajo vertical es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 50.00, 5, 1, 10, 'active', false),
    ('e-002', 'bocas-isla-colon-boquete', 'Bocas (Isla Colon) a Boquete', 'Ruta compartida bocas (isla colon) a boquete con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 30.00, 6, 1, 14, 'active', false),
    ('e-003', 'boquete-bocas-isla-colon-bocas-del-toro', 'Boquete a Bocas (Isla Colon)', 'Ruta compartida boquete a bocas (isla colon) con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 30.00, 6, 1, 14, 'active', false),
    ('e-004', 'boquete-lost-and-found-hostel', 'Boquete a Lost & Found Hostel', 'Ruta compartida boquete a lost & found hostel con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 20.00, 6, 1, 14, 'active', false),
    ('e-005', 'boquete-puerto-viejo-costa-rica', 'Boquete a Puerto Viejo, Costa Rica', 'Ruta compartida boquete a puerto viejo, costa rica con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 55.00, 6, 1, 14, 'active', false),
    ('e-006', 'boquete-santa-catalina', 'Boquete a Santa Catalina', 'Ruta compartida boquete a santa catalina con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 35.00, 6, 1, 14, 'active', false),
    ('e-007', 'canal-zone-legacy-walk', 'Caminata historica por la Zona del Canal', 'Caminata historica por la Zona del Canal es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 31.82, 36, 1, 10, 'active', false),
    ('e-008', 'canyon-thrills-hidden-falls-and-high-altitude-wellness', 'Canones, cascadas escondidas y bienestar en altura', 'Canones, cascadas escondidas y bienestar en altura es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 73.98, 10, 1, 10, 'active', false),
    ('e-009', 'caribbean-island-day-escape', 'Escape de dia a una isla caribena', 'Escape de dia a una isla caribena es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 95.02, 10, 1, 12, 'active', false),
    ('e-010', 'extreme-park-hanging-bridges-and-kayaks', 'Parque extremo, puentes colgantes y kayaks', 'Parque extremo, puentes colgantes y kayaks es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 60.14, 5, 1, 10, 'active', false),
    ('e-011', 'free-casco-walking-tour-history-and-vibes-3-transport-fees', 'Walking tour por Casco Viejo', 'Ruta compartida walking tour por casco viejo con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 5.00, 6, 1, 14, 'active', false),
    ('e-012', 'golden-hour-womens-intro-to-calisthenics-and-hangouts', 'Intro femenina a calistenia y encuentro social', 'Ruta compartida intro femenina a calistenia y encuentro social con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 12.00, 6, 1, 14, 'active', false),
    ('e-013', 'hiking-chame-hill-and-ocean-lunch', 'Caminata al Cerro Chame y almuerzo frente al mar', 'Caminata al Cerro Chame y almuerzo frente al mar es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 58.20, 10, 1, 20, 'active', false),
    ('e-014', 'iguana-island-and-snorkel-sea-adeventure', 'Isla Iguana y snorkel', 'Ruta compartida isla iguana y snorkel con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 70.01, 6, 1, 14, 'active', false),
    ('e-015', 'india-vieja-hike-the-sleeping-giant', 'Caminata India Vieja: el gigante dormido', 'Caminata India Vieja: el gigante dormido es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 50.00, 10, 1, 10, 'active', false),
    ('e-016', 'indigenous-community-visit', 'Visita a comunidad indigena', 'Visita a comunidad indigena es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 85.00, 10, 1, 10, 'active', false),
    ('e-017', 'island-in-front-of-panama-city-taboga', 'Taboga: la isla frente a Panama City', 'Taboga: la isla frente a Panama City es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 73.78, 5, 1, 12, 'active', false),
    ('e-018', 'jaguata-waterfalls-and-hotsprings', 'Cascadas Jaguata y aguas termales', 'Cascadas Jaguata y aguas termales es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 70.00, 10, 1, 10, 'active', false),
    ('e-019', 'longest-single-zip-line-in-panama', 'La zip-line individual mas larga de Panama', 'La zip-line individual mas larga de Panama es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 79.03, 5, 1, 10, 'active', false),
    ('e-020', 'lost-and-found-hostel-boquete', 'Lost & Found Hostel a Boquete', 'Ruta compartida lost & found hostel a boquete con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 20.00, 6, 1, 14, 'active', false),
    ('e-021', 'lost-and-found-hostel-isla-colon-bocas-del-toro', 'Lost & Found Hostel a Isla Colon, Bocas del Toro', 'Ruta compartida lost & found hostel a isla colon, bocas del toro con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 25.00, 6, 1, 14, 'active', false),
    ('e-022', 'make-your-own-chocolate-casa-coronel-cacao-museum', 'Haz tu propio chocolate en Casa Coronel', 'Haz tu propio chocolate en Casa Coronel conecta historia, identidad local y acompanamiento operativo.', 63.46, 36, 1, 10, 'active', false),
    -- e-025 (Primitive Spearfishing: Catch Your Dinner) fue eliminada por el
    -- cliente en el pedido de cambios de 2026-08-07 (ver migracion 014). Se
    -- quita de este import porque el "on conflict ... set status = 'active'"
    -- de abajo la reactivaria cada vez que se re-ejecute esta migracion.
    ('e-026', 'san-blas-castaway-overnight-and-beyond', 'San Blas Castaway: noche y mas alla', 'San Blas Castaway: noche y mas alla combina mar, naturaleza y logistica local para una salida clara.', 205.42, 36, 1, 12, 'active', false),
    ('e-027', 'san-blas-day-trip-for-the-commitment-phobes', 'San Blas en un dia', 'San Blas en un dia combina mar, naturaleza y logistica local para una salida clara.', 126.56, 10, 1, 12, 'active', false),
    ('e-028', 'santa-catalina-boquete', 'Santa Catalina a Boquete', 'Ruta compartida santa catalina a boquete con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 35.00, 6, 1, 14, 'active', false),
    ('e-029', 'secret-reef-snorkeling-back-of-isla-grande', 'Snorkel en arrecife secreto detras de Isla Grande', 'Snorkel en arrecife secreto detras de Isla Grande combina mar, naturaleza y logistica local para una salida clara.', 52.80, 4, 1, 12, 'active', false),
    ('e-030', 'shuttle-tour-island-for-couples', 'Shuttle a isla para parejas', 'Ruta compartida shuttle a isla para parejas con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 315.05, 6, 1, 14, 'active', false),
    ('e-031', 'shuttle-tour-santa-catalina', 'Shuttle a Santa Catalina', 'Ruta compartida shuttle a santa catalina con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 105.53, 6, 1, 14, 'active', false),
    ('e-032', 'skydive-panama-paragliding-skydiving', 'Skydive Panama', 'Skydive Panama es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 385.00, 5, 1, 10, 'active', false),
    ('e-033', 'social-multi-hostel-daily-lunch', 'Almuerzo social multi-hostel', 'Ruta compartida almuerzo social multi-hostel con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 12.00, 6, 1, 14, 'active', false),
    ('e-034', 'stand-up-paddle-getaway-hidden-caves-and-skyline-sunrise-views', 'Stand-up paddle: cuevas escondidas y amanecer frente al skyline', 'Stand-up paddle: cuevas escondidas y amanecer frente al skyline combina mar, naturaleza y logistica local para una salida clara.', 47.69, 5, 1, 10, 'active', false),
    ('e-035', 'surf-board-rental', 'Alquiler de tabla de surf', 'Alquiler de tabla de surf combina mar, naturaleza y logistica local para una salida clara.', 31.82, 2, 1, 10, 'active', false),
    -- base_price 80.00: precio temporal fijado por el cliente (2026-08-09).
    ('e-036', 'surf-day-experience-the-city-escape', 'Dia de surf: escape desde la ciudad', 'Dia de surf: escape desde la ciudad combina mar, naturaleza y logistica local para una salida clara.', 80.00, 36, 1, 10, 'active', false),
    ('e-037', 'surf-and-escape-at-el-playon', 'Surf y escape en El Playon', 'Surf y escape en El Playon combina mar, naturaleza y logistica local para una salida clara.', 94.76, 4, 1, 10, 'active', false),
    ('e-038', 'tattoo-panamanian-neo-tribal-ink-of-the-ancestors', 'Tatuaje neo-tribal panameno', 'Tatuaje neo-tribal panameno combina mar, naturaleza y logistica local para una salida clara.', 90.00, 36, 1, 10, 'active', false),
    ('e-039', 'the-5-waterfall-liquid-gold-expedition', 'Expedicion de las 5 cascadas', 'Expedicion de las 5 cascadas es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 120.00, 10, 1, 10, 'active', false),
    ('e-040', 'the-first-cacao-museum-in-central-america', 'Primer museo del cacao en Centroamerica', 'Primer museo del cacao en Centroamerica conecta historia, identidad local y acompanamiento operativo.', 21.40, 3, 1, 10, 'active', false),
    ('e-041', 'the-hostel-run-club-hrc', 'Hostel Run Club', 'Hostel Run Club es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 1.00, 5, 1, 20, 'active', false),
    ('e-042', 'the-legend-of-the-pianist-trail', 'La leyenda del sendero Pianista', 'Ruta compartida la leyenda del sendero pianista con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 45.00, 6, 1, 14, 'active', false),
    ('e-043', 'toucan-sightseeing-and-cold-mountains-of-the-city-28-17-mandatory-provisions-and-transpor', 'Avistamiento de tucanes y montanas frescas cerca de la ciudad', 'Avistamiento de tucanes y montanas frescas cerca de la ciudad es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 45.00, 2, 1, 10, 'active', false),
    ('e-044', 'volcano-baru-highest-point-in-panama', 'Volcan Baru: el punto mas alto de Panama', 'Volcan Baru: el punto mas alto de Panama es una experiencia activa para viajeros que quieren moverse, explorar y reservar con cupo confirmado.', 100.00, 5, 1, 10, 'active', false),
    ('e-045', 'whale-watch-and-island-combo', 'Avistamiento de ballenas e Isla Iguana', 'Ruta compartida avistamiento de ballenas e isla iguana con coordinacion local, cupos limitados y salida confirmada antes del viaje.', 85.00, 6, 1, 14, 'active', false),
    ('e-046', 'yoga-and-functionals-sculpt-yourself', 'Yoga y funcionales: esculpe tu cuerpo', 'Yoga y funcionales: esculpe tu cuerpo propone una pausa activa y social, con cupos simples de coordinar.', 18.00, 2, 1, 20, 'active', false)
on conflict (legacy_id) do update set
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  base_price = excluded.base_price,
  duration = excluded.duration,
  min_guests = excluded.min_guests,
  max_guests = excluded.max_guests,
  status = 'active',
  is_demo = false;

-- La vieja seed de staging podia dejar nombres con "(DEMO)". Esta migracion
-- los reemplaza por inventario real y marca is_demo=false.

-- Verificacion esperada: 43 experiencias reales activas desde 2026-08-09
-- (e-025 eliminada por el cliente; e-023 y e-024 se crean en la migracion 014
-- y quedan 'inactive' hasta que el cliente entregue precio y disponibilidad).
-- select count(*) from public.experiences where status = 'active' and is_demo = false;
-- select legacy_id, slug, title, is_demo from public.experiences order by legacy_id limit 10;
-- =============================================================================
