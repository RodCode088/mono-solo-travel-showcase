-- =============================================================================
-- Mono Solo Travel — Migración 010: favoritos ligados a la cuenta
--
-- Un favorito por (usuario, experiencia). CRUD directo protegido por RLS
-- (sin RPC): cada operación ya viene acotada a auth.uid(), no hay lógica de
-- negocio adicional que requiera un SECURITY DEFINER como en bookings/reviews.
-- =============================================================================

create table if not exists public.favorites (
  user_id       uuid not null references auth.users(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, experience_id)
);
comment on table public.favorites is 'Favoritos de cliente. Un favorito por (usuario, experiencia).';

create index if not exists idx_favorites_user on public.favorites (user_id);

alter table public.favorites enable row level security;
grant select, insert, delete on public.favorites to authenticated;

drop policy if exists favorites_select on public.favorites;
create policy favorites_select on public.favorites
  for select using (user_id = auth.uid());

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites
  for delete using (user_id = auth.uid());

-- =============================================================================
-- Fin migración 010.
-- =============================================================================
