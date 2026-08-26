-- =============================================================================
-- Mono Solo Travel — Migración 001: esquema MVP inicial
-- Fase 1: persistencia real de reservas y administración protegida.
--
-- Seguro de ejecutar en Supabase STAGING (SQL Editor o CLI).
-- Idempotente donde es razonable (IF NOT EXISTS / CREATE OR REPLACE).
-- NO elimina tablas existentes.
-- =============================================================================

-- Extensión para gen_random_uuid() (presente en Supabase).
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Trigger reutilizable para mantener updated_at.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: espejo de auth.users con rol. El rol NO es auto-asignable (ver RLS).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'traveler'
                check (role in ('traveler', 'admin', 'b2b_partner')),
  created_at  timestamptz not null default now()
);
comment on table public.profiles is 'Perfil + rol por usuario de auth. El rol solo lo cambia un admin (RLS).';

-- -----------------------------------------------------------------------------
-- experiences: catálogo. legacy_id conecta los datos mock existentes (e-001...).
-- -----------------------------------------------------------------------------
create table if not exists public.experiences (
  id          uuid primary key default gen_random_uuid(),
  legacy_id   text unique,                       -- p.ej. 'e-001' para mapear seed/mock
  slug        text not null unique,
  title       text not null,
  summary     text,
  base_price  numeric(10,2) not null check (base_price >= 0),
  duration    numeric(5,2),                      -- horas
  min_guests  integer not null default 1 check (min_guests >= 1),
  max_guests  integer not null default 1 check (max_guests >= 1),
  status      text not null default 'active'
                check (status in ('active', 'paused', 'draft')),
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint experiences_guest_range check (max_guests >= min_guests)
);
comment on column public.experiences.legacy_id is 'ID del dato mock original (e-001..e-012) para migración/seed.';
comment on column public.experiences.is_demo is 'true = dato demo, NO aprobado por el cliente como inventario real.';

create index if not exists idx_experiences_status on public.experiences (status);
create index if not exists idx_experiences_slug on public.experiences (slug);

drop trigger if exists trg_experiences_updated_at on public.experiences;
create trigger trg_experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- availability: cupos por fecha. Restricciones contra sobreventa / negativos.
-- -----------------------------------------------------------------------------
create table if not exists public.availability (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references public.experiences(id) on delete cascade,
  date            date not null,
  start_time      time,
  total_spots     integer not null check (total_spots >= 0),
  booked_spots    integer not null default 0 check (booked_spots >= 0),
  status          text not null default 'open'
                    check (status in ('open', 'closed')),
  price_override  numeric(10,2) check (price_override is null or price_override >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint availability_no_oversell check (booked_spots <= total_spots)
);
comment on constraint availability_no_oversell on public.availability is 'Impide reservar más cupos que el total (anti-sobreventa).';

create index if not exists idx_availability_experience_date
  on public.availability (experience_id, date);
create index if not exists idx_availability_status on public.availability (status);

drop trigger if exists trg_availability_updated_at on public.availability;
create trigger trg_availability_updated_at
  before update on public.availability
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- bookings: reservas. public_token permite confirmación pública sin exponer la tabla.
-- -----------------------------------------------------------------------------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  public_token    uuid not null unique default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,  -- null = invitado
  experience_id   uuid not null references public.experiences(id),
  availability_id uuid not null references public.availability(id),
  guests          integer not null check (guests >= 1),
  unit_price      numeric(10,2) not null check (unit_price >= 0),
  total           numeric(10,2) not null check (total >= 0),
  currency        text not null default 'USD',
  status          text not null default 'pending'
                    check (status in ('pending', 'under_review', 'confirmed', 'cancelled')),
  channel         text not null default 'web'
                    check (channel in ('web', 'b2b', 'manual')),
  contact_name    text not null,
  contact_email   text not null,
  contact_phone   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on column public.bookings.public_token is 'Token no adivinable para la página de confirmación pública.';
comment on column public.bookings.user_id is 'null para reservas de invitado (MVP). Reservado para cuentas de turista futuras.';

create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_experience on public.bookings (experience_id);
create index if not exists idx_bookings_created_at on public.bookings (created_at desc);

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payments: pagos/referencias. CuantoApp manual en esta fase (sin API/webhook).
-- -----------------------------------------------------------------------------
create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  method        text not null default 'cuantoapp'
                  check (method in ('cuantoapp', 'manual', 'transfer')),
  amount        numeric(10,2) not null check (amount >= 0),
  reference     text,
  proof_url     text,
  status        text not null default 'pending'
                  check (status in ('pending', 'under_review', 'approved', 'rejected')),
  verified_by   uuid references auth.users(id),
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_payments_booking on public.payments (booking_id);
create index if not exists idx_payments_status on public.payments (status);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Fin migración 001. RLS y funciones RPC se definen en migraciones siguientes.
-- =============================================================================
