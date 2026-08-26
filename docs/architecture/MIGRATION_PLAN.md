# Incremental Migration Plan

Date: 2026-06-30.

The React/Vite presentation migration is complete. This document now covers
future Supabase/data migrations only.

Do not replace the existing Phase 1 schema. Add incremental migrations after
staging validation and explicit approval.

## Current Migrations

- `001_initial_mvp_schema.sql`: profiles, experiences, availability, bookings,
  payments, indexes and triggers.
- `002_functions.sql`: admin helper, guest booking, public confirmation,
  payment approve/reject.
- `003_rls.sql`: RLS policies for current tables.

These are the active Phase 1 database foundation. The React/Vite migration did
not rewrite them.

## Proposed Future Migrations

### 004_customer_role_and_profiles

Purpose: align public role naming with product vision.

Recommended path:

- Add `customer` compatibility while keeping `traveler` during transition.
- Update seed/test expectations.
- Make public sign-up create `customer`.
- Remove `traveler` only after data and services no longer depend on it.

### 005_contacts_and_leads

Purpose: support mini-CRM and external customers without Auth accounts.

Adds:

- `contacts`
- `leads`
- normalized indexes on email/phone/status/source/follow-up dates.

### 006_booking_origin_contact_notes

Purpose: unify web/manual/WhatsApp/phone/Instagram/referral booking origins.

Adds:

- nullable booking contact relation,
- origin/source fields,
- customer notes,
- internal notes,
- created/updated actor fields.

### 007_admin_manual_booking_rpc

Purpose: create manual bookings from admin while preserving anti-oversell
behavior.

Adds:

- RPC `create_admin_booking`.
- Optional contact upsert/link helper.

### 008_activity_content_and_media

Purpose: persist the richer activity model needed for real inventory.

Adds depending final content decision:

- detailed experience fields,
- `experience_media` table, and/or
- Supabase Storage bucket/policies.

### 009_reviews

Purpose: persisted ratings/reviews with moderation.

Adds:

- `reviews`
- unique constraint per booking/contact.
- eligibility RPC/checks for completed bookings.

### 010_recommendation_views

Purpose: deterministic recommendation score without ML.

Adds:

- SQL view or service query for approved reviews/completed bookings/published
  activities.

### 011_audit_events

Purpose: trace important admin/customer state changes.

Adds:

- `audit_events`
- helper trigger/function for selected tables.

## Execution Rule

Before each migration:

1. Confirm staging is backed up or disposable.
2. Run existing checks.
3. Review SQL diff.
4. Execute in staging.
5. Validate RLS.
6. Update `CURRENT_STATE.md`.

No destructive migration without explicit approval.
