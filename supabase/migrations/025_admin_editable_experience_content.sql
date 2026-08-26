-- =============================================================================
-- Mono Solo Travel — Migración 025: contenido completo de la experiencia y
-- fotos, editables desde el panel de admin (Fase 2 de "todo editable desde
-- el panel", pedido del owner 2026-08-24)
--
-- Fase 1 (024) dejó categoria/provincia/destacados editables. Esta fase deja
-- editable lo que hoy vive solo en el catalogo estatico (mono-experiences.js
-- / experience-content.js / archivos .txt originales): descripcion completa,
-- itinerario, que incluye/no incluye, requisitos, politica de cancelacion,
-- punto de encuentro y fotos. Mismo principio que 024: si una columna es
-- null/vacia, el sitio sigue usando el contenido estatico -- cero riesgo
-- para las experiencias existentes hasta que un admin las edite.
-- =============================================================================

alter table public.experiences
  add column if not exists full_description text,
  add column if not exists meeting_point text,
  add column if not exists cancellation_policy text,
  add column if not exists itinerary text[],
  add column if not exists included text[],
  add column if not exists not_included text[],
  add column if not exists requirements text[],
  add column if not exists images text[];

comment on column public.experiences.full_description is 'Descripcion larga elegida desde el panel de admin. null = usa la del catalogo estatico.';
comment on column public.experiences.meeting_point is 'Punto de encuentro elegido desde el panel de admin. null = usa el del catalogo estatico.';
comment on column public.experiences.cancellation_policy is 'Politica de cancelacion elegida desde el panel de admin. null = usa la del catalogo estatico.';
comment on column public.experiences.itinerary is 'Itinerario (un paso por elemento) elegido desde el panel de admin. Vacio/null = usa el del catalogo estatico.';
comment on column public.experiences.included is 'Que incluye (un item por elemento) elegido desde el panel de admin. Vacio/null = usa el del catalogo estatico.';
comment on column public.experiences.not_included is 'Que NO incluye (un item por elemento) elegido desde el panel de admin. Vacio/null = usa el del catalogo estatico.';
comment on column public.experiences.requirements is 'Requisitos (un item por elemento) elegidos desde el panel de admin. Vacio/null = usa los del catalogo estatico.';
comment on column public.experiences.images is 'URLs publicas en el bucket Storage "experience-photos", en orden de galeria. Vacio/null = usa las fotos del catalogo estatico.';

-- -----------------------------------------------------------------------------
-- Bucket de fotos: publico para lectura (son fotos de marketing, no privadas),
-- escritura solo admin. Mismo patron que 011_avatar_storage.sql, cambiando el
-- chequeo de dueño (auth.uid()) por is_admin() porque las fotos son del
-- catalogo, no de un usuario.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('experience-photos', 'experience-photos', true)
on conflict (id) do update set public = true;

drop policy if exists experience_photos_public_read on storage.objects;
create policy experience_photos_public_read on storage.objects
  for select using (bucket_id = 'experience-photos');

drop policy if exists experience_photos_admin_write on storage.objects;
create policy experience_photos_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'experience-photos' and public.is_admin())
  with check (bucket_id = 'experience-photos' and public.is_admin());

-- =============================================================================
-- Fin migración 025.
-- =============================================================================
