-- =============================================================================
-- Mono Solo Travel — Migración 011: foto de perfil (avatar)
--
-- Bucket público: un avatar es una foto de presentación elegida por el propio
-- usuario, no un documento de verificación de identidad, así que no hace falta
-- gestionar URLs firmadas con expiración. Si una fase futura agrega fotos de
-- verificación real, debe usar un bucket privado aparte.
-- =============================================================================

alter table public.profiles add column if not exists avatar_url text;
comment on column public.profiles.avatar_url is
  'URL publica del avatar en el bucket Storage "avatars" (getPublicUrl tras el upload). Null = sin foto, el frontend muestra el placeholder mono.';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

-- Convención de ruta: avatars/{auth.uid()}/avatar (nombre fijo, sin extensión;
-- content-type real lo maneja el header HTTP del objeto, no la URL). upsert:true
-- en el frontend hace que una nueva foto sobreescriba limpio, sin archivos
-- huérfanos por cambios de formato.
drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- Fin migración 011.
-- =============================================================================
