# Access Control - Mono Solo Travel

Date: 2026-06-30.

Security must be enforced in UI, routes, services and database RLS. Hidden
buttons and route guards are UX, not authorization.

## Roles

Supabase schema after Phase 2 migration `004_customer_role_rename.sql`:

- `customer` (renamed from `traveler`)
- `admin`
- `b2b_partner` (kept; B2B portal is a future phase, unlinked from nav)

Resolved 2026-07-10: `traveler` was renamed directly to `customer` (not a
compatibility shim). The public registration default is `customer`, enforced
server-side by the `handle_new_user` trigger (`005`) and the `profiles_insert`
policy (`004`); the frontend never exposes role selection. Migrations 004 and
005 must be applied in Supabase for this to be live.

## Public Visitor

Allowed:

- read published/active activities,
- read public availability,
- read approved reviews when implemented,
- create guest booking through controlled RPC,
- read own confirmation by public token.

Denied:

- list bookings,
- list payments,
- list profiles,
- list contacts/leads,
- read internal notes,
- update operational data,
- access admin routes.

Current RLS covers active experiences, open availability and blocks direct
booking/payment listing. Approved-review policies are pending because reviews
are not persisted yet.

## Customer

Allowed target:

- read/update own profile,
- read own bookings/payments,
- create allowed bookings,
- manage own review for completed booking,
- read own history.

Denied:

- read other customer profiles/bookings,
- change role,
- change prices/availability,
- change admin states,
- access mini-CRM/admin.

Current status:

- Owner policies exist for `profiles`, `bookings` and `payments`. Phase 2
  implemented the frontend: real `/registro`, `/login`, password recovery and a
  gated `/usuario/*` area. A logged-in customer's bookings link via
  `user_id = auth.uid()` (RPC `create_guest_booking`, `005`) and are read back
  through the `get_my_bookings` RPC. Requires migrations 004/005 applied.

## Admin

Allowed target:

- manage activities,
- manage availability,
- manage bookings,
- manage payments,
- manage customers/contacts/leads,
- moderate reviews,
- view dashboard data,
- create manual bookings,
- add internal notes.

Current status:

- `is_admin()` checks `profiles.role = 'admin'`.
- Admin can list bookings/payments and approve/reject payments.
- Phase 2 added persisted admin CRUD for experiencias and disponibilidad
  (RLS `experiences_admin_write` / `availability_admin_write`), a customers
  list (from `profiles` + `bookings`), and reportes (real counts). Config is an
  informational panel only.
- React `/admin/*` guard is intentionally UX only; real enforcement is Auth +
  RLS + RPC permissions.
- Contact/lead/review admin persistence is still pending (deferred).

## Matrix

| Entity | Public | Customer | Admin | Current status |
|---|---|---|---|---|
| experiences | read active | read active | manage | partial, active only |
| availability | read open | read open | manage | partial |
| profiles | none | own | all | RLS ready, UI pending |
| bookings | create via RPC, token confirmation | own | all/manage | partial |
| payments | none | own | all/manage | partial |
| contacts | none | own linked contact later | manage | missing |
| leads | none | none | manage | missing |
| reviews | read approved | own valid reviews | moderate | missing persisted model |
| internal notes | none | none | manage | missing |
| audit events | none | own safe subset later | read/manage | missing |

## Auth Flow Requirements

Public registration:

- must create an authenticated user,
- must create/update profile with role `customer`,
- must not expose role selection,
- must not trust frontend metadata for admin role.

Admin creation:

- manual/internal only,
- create user in Supabase Auth,
- assign `profiles.role = 'admin'` through trusted SQL/admin path,
- never hardcode Sebastian email in application logic.

## RLS Requirements For Next Migrations

Contacts:

- customer reads/updates own linked contact only.
- admin reads/manages all.
- public no access.

Leads:

- admin only.
- public no access.
- customer no access unless later exposed as safe customer support data.

Reviews:

- public reads `status = 'approved'`.
- customer reads own reviews.
- customer creates/updates through RPC or strict policy only when booking is
  completed and belongs to them.
- admin moderates all.

Manual bookings:

- admin only for creation.
- must allow `user_id` null and/or `contact_id` not null.

## Test Requirements

Future tests must verify:

- registration creates `customer`,
- customer cannot become admin,
- customer reads only own profile/bookings,
- visitor cannot access admin/private tables,
- admin can manage operational data,
- rejected/hidden reviews are not public,
- contact without auth user can exist,
- manual booking can be created by admin only.
