/* Static presentation content for experiences, keyed by legacy id and slug.
 *
 * Purpose: enrich the thin Supabase `experiences` rows (which only persist
 * operational fields like title/price/duration/capacity/status) with the richer
 * descriptive content already authored in the mock catalog, WITHOUT inventing
 * Supabase columns and WITHOUT fabricating reviews.
 *
 * This is the frontend-side "static content map" approach from
 * docs/content/ACTIVITY_CONTENT_PLAN.md (path 1). Operational truth stays in
 * Supabase; only descriptive copy/media is layered on top by legacy_id/slug.
 *
 * The lookup is built from db.experiences at import time, before
 * hydrateCatalog() reassigns db.experiences in Supabase mode. Only descriptive
 * fields are exposed: rating and reviewCount are intentionally omitted because
 * no reviews are persisted yet (showing demo review counts in staging would be
 * a false claim, violating the "demo, no promesa" rule).
 */
import { db } from "./db.js";

const PRESENTATION_KEYS = [
  "destination",
  "category",
  "catalogGroups",
  "shortDescription",
  "fullDescription",
  "images",
  "duration",
  "meetingPoint",
  "included",
  "notIncluded",
  "requirements",
  "cancellationPolicy",
  "itinerary",
  "descriptionSections",
  "cuantoLink",
  "rawCategory",
  "sourceFolder",
  "sourceImageCount",
  "publishedInCuanto",
  "translations",
  "minGuests",
  "maxGuests",
];

function pickContent(experience) {
  const content = {};
  for (const key of PRESENTATION_KEYS) {
    if (experience[key] !== undefined) content[key] = experience[key];
  }
  return content;
}

const contentByKey = new Map();
for (const experience of db.experiences) {
  const content = pickContent(experience);
  contentByKey.set(experience.id, content); // legacy id, e.g. "e-001"
  if (experience.legacyId) contentByKey.set(experience.legacyId, content);
  if (experience.slug) contentByKey.set(experience.slug, content);
}

/** Returns descriptive content for the first matching legacy id / slug, or null. */
export function getExperienceContent(...keys) {
  for (const key of keys) {
    if (key && contentByKey.has(key)) return contentByKey.get(key);
  }
  return null;
}
