# Domain Model - Mono Solo Travel

Date: 2026-06-30.

This document describes the intended domain model and maps it to the current
React/Vite + Supabase code/schema. Future entities remain conceptual until
migrations are implemented and validated.

## Current Persisted Schema

Implemented by `supabase/migrations/001_initial_mvp_schema.sql`:

- `profiles`
- `experiences`
- `availability`
- `bookings`
- `payments`

Implemented RPC:

- `is_admin`
- `create_guest_booking`
- `get_public_booking_confirmation`
- `approve_booking_payment`
- `reject_booking_payment`

Current RLS:

- Public can read active experiences and open availability.
- Public cannot list bookings/payments.
- Admin can manage operational tables through role check.
- Booking creation uses `create_guest_booking`.

## Existing Mock-Only Model

`src/data/db.js` and `src/data/seed.js` currently include richer in-memory
entities:

- users,
- destinations,
- categories,
- B2B partners,
- experiences with images/copy,
- availability,
- bookings,
- payments,
- reviews.

These are not fully persisted in Supabase.

## Target Entities

### Profile

Purpose: auth-linked identity and role.

Current columns:

- `id` = `auth.users.id`
- `full_name`
- `role`
- `created_at`

Resolved (Phase 2, migration `004_customer_role_rename.sql`):

- The public customer role was renamed from `traveler` to `customer` (direct
  rename, not a compatibility shim). New rows default to `customer`; the
  `handle_new_user` trigger (`005`) auto-creates a `customer` profile on signup.
  Apply 004 + 005 in Supabase for this to take effect (see
  `docs/execution/CURRENT_STATE.md`).

### Contact

Purpose: person/customer record that may or may not be linked to Auth.

Proposed fields:

- `id uuid primary key`
- `auth_user_id uuid null references auth.users(id)`
- `first_name text`
- `last_name text`
- `email text`
- `phone text`
- `country text`
- `origin_channel text`
- `status text`
- `notes text`
- `created_by uuid null`
- `created_at timestamptz`
- `updated_at timestamptz`

Constraints:

- nullable `auth_user_id`,
- indexes on normalized email/phone,
- uniqueness strategy should prevent obvious duplicates without blocking messy
  real-world data.

### Lead

Purpose: sales/opportunity state for a contact.

Proposed fields:

- `id uuid primary key`
- `contact_id uuid references contacts(id)`
- `status text`
- `interest text`
- `experience_id uuid null`
- `source text`
- `assigned_to uuid null`
- `last_contact_at timestamptz null`
- `next_follow_up_at timestamptz null`
- `created_at`
- `updated_at`

Initial states:

- `new`
- `contacted`
- `qualified`
- `proposal`
- `booked`
- `lost`

### Experience

Current persisted fields:

- slug/title/summary/base price/duration/min/max/status/is_demo.

Target additions:

- destination/location,
- category,
- long description,
- meeting point,
- included/not included,
- requirements,
- cancellation policy,
- publication metadata,
- media relation.

Do not add all fields at once unless the first real activity requires them.

### Experience Media

Purpose: images and future video.

Proposed fields:

- `id uuid primary key`
- `experience_id uuid references experiences(id)`
- `storage_path text`
- `public_url text null`
- `alt_text text`
- `sort_order int`
- `status text`
- `created_at`

Storage decision is pending: static assets vs Supabase Storage.

### Availability

Current fields cover experience/date/start time/total/booked/status/price
override.

Target additions:

- end time,
- timezone,
- cutoff rules,
- admin block reason,
- source/import metadata.

### Booking

Current fields:

- `code`
- `public_token`
- `user_id nullable`
- `experience_id`
- `availability_id`
- `guests`
- `unit_price`
- `total`
- `currency`
- `status`
- `channel`
- contact fields.

Target additions:

- `contact_id`
- `origin`
- `customer_notes`
- `internal_notes`
- `created_by`
- `updated_by`
- discount/subtotal fields,
- manual booking support,
- completed/no-show states,
- audit log relation.

### Booking Participant

Purpose: companions/travelers beyond the holder.

Proposed fields:

- `id uuid primary key`
- `booking_id uuid references bookings(id)`
- `full_name`
- `email null`
- `phone null`
- `notes null`
- `created_at`

### Payment

Payment remains modeled for a future gateway or manual reconciliation path, but
the current public reservation flow no longer requires a payment row at booking
time.

Target additions:

- `provider`
- `provider_reference`
- `proof_storage_path`
- `paid_at`
- `refund_amount`
- `notes`

### Review

Proposed fields:

- `id uuid primary key`
- `booking_id uuid references bookings(id)`
- `experience_id uuid references experiences(id)`
- `contact_id uuid references contacts(id)`
- `user_id uuid null references auth.users(id)`
- `rating int check between 1 and 5`
- `body text`
- `status text`
- `moderated_by uuid null`
- `moderated_at timestamptz null`
- `created_at`
- `updated_at`

Constraints:

- unique review per booking, or per booking/contact depending final policy.
- review allowed only for completed booking via RPC or trigger-backed check.

### Internal Note

Purpose: CRM/admin notes without exposing them publicly.

Proposed fields:

- `id uuid primary key`
- `entity_type text`
- `entity_id uuid`
- `body text`
- `created_by uuid`
- `created_at`

### Audit Event

Purpose: trace important state changes.

Proposed fields:

- `id uuid primary key`
- `actor_id uuid null`
- `entity_type text`
- `entity_id uuid`
- `action text`
- `before jsonb`
- `after jsonb`
- `created_at`

## Acquisition Source

Use a common constrained source vocabulary for contacts/leads/bookings:

- `web`
- `admin_manual`
- `whatsapp`
- `phone`
- `instagram`
- `referral`
- `b2b`
- `other`

The current `bookings.channel` allows only `web`, `b2b`, `manual`; this must be
expanded or complemented by a new `origin` column.

## Minimal Next Model

After demo readiness is decided, the next minimal product migration should add:

1. `customer` role compatibility.
2. `contacts`.
3. `leads`.
4. `booking.origin` or expanded `channel`.
5. `booking.contact_id`.
6. `internal_notes`.

Reviews and recommendation tables/services should come after customer profile
and completed booking flow are real.
