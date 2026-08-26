import { db } from "../../data/db.js";
import { getReviewableLocalBookings } from "./db-service.js";
import { state } from "./state.js";
import { isSupabase, getSupabaseClient } from "../supabase/client.js";
import { cleanDisplayText } from "./text.js";

const LOCAL_REVIEWS_KEY = "ms.localReviews";

const ok = (data) => ({ data, error: null });
const fail = (err) => {
  console.error("[reviews-service]", err);
  return { data: null, error: { code: err?.code || "UNKNOWN", message: err?.message || "No se pudo completar la operacion. Intenta de nuevo." } };
};

function localStorageSafe() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let localReviewsHydrated = false;
function ensureLocalReviewsHydrated() {
  if (localReviewsHydrated) return;
  localReviewsHydrated = true;
  const storage = localStorageSafe();
  if (!storage) return;
  try {
    const rows = JSON.parse(storage.getItem(LOCAL_REVIEWS_KEY) || "[]");
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (!db.reviews.some((r) => r.id === row.id)) db.reviews.push(row);
      }
    }
  } catch {
    // ignore malformed local storage payload
  }
}

function persistLocalReviews() {
  const storage = localStorageSafe();
  if (storage) storage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(db.reviews.slice(0, 200)));
}

function experienceKey(experience) {
  return experience?.supabaseId || experience?.id;
}

function mapReviewError(err) {
  const raw = (err?.message || String(err || "")).toString();
  const known = [
    ["NOT_AUTHENTICATED", "Inicia sesion para dejar una reseña."],
    ["INVALID_RATING", "Selecciona una calificacion de 1 a 5 estrellas."],
    ["BOOKING_NOT_FOUND", "No encontramos esa reserva."],
    ["NOT_AUTHORIZED", "Esta reserva no te pertenece."],
    ["BOOKING_NOT_CONFIRMED", "Solo puedes resenar reservas confirmadas."],
    ["EXPERIENCE_NOT_YET_HAPPENED", "Podras resenar esta experiencia despues de la fecha reservada."],
    ["ALREADY_REVIEWED", "Ya dejaste una reseña para esta reserva."],
  ];
  for (const [code, message] of known) {
    if (raw.includes(code)) return { code, message };
  }
  return { code: "UNKNOWN", message: "No se pudo enviar la reseña. Intenta de nuevo." };
}

export async function getExperienceReviews(experience) {
  if (!experience) return ok([]);

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("reviews")
        .select("id, rating, body, author_name, created_at")
        .eq("experience_id", experienceKey(experience))
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ok((data || []).map((r) => ({
        id: r.id,
        rating: r.rating,
        body: cleanDisplayText(r.body || ""),
        authorName: cleanDisplayText(r.author_name || "Viajero Mono Solo"),
        createdAt: r.created_at,
      })));
    } catch (err) {
      return fail(err);
    }
  }

  ensureLocalReviewsHydrated();
  const rows = db.reviews
    .filter((r) => r.experienceId === experience.id)
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map((r) => ({ id: r.id, rating: r.rating, body: r.body, authorName: r.authorName, createdAt: r.createdAt }));
  return ok(rows);
}

export async function getExperienceRatingsMap() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("get_experience_ratings");
      if (error) throw error;
      const map = new Map();
      for (const row of data || []) {
        map.set(row.experience_id, { rating: Number(row.avg_rating), reviewCount: Number(row.review_count) });
      }
      return ok(map);
    } catch (err) {
      return fail(err);
    }
  }

  ensureLocalReviewsHydrated();
  const totals = new Map();
  for (const r of db.reviews) {
    const entry = totals.get(r.experienceId) || { total: 0, count: 0 };
    entry.total += Number(r.rating) || 0;
    entry.count += 1;
    totals.set(r.experienceId, entry);
  }
  const map = new Map();
  for (const [experienceId, { total, count }] of totals) {
    map.set(experienceId, { rating: Math.round((total / count) * 10) / 10, reviewCount: count });
  }
  return ok(map);
}

// Muta el rating/reviewCount de db.experiences a partir del mapa de ratings
// actual. Corre una vez despues del bootstrap del catalogo (modo mock y
// Supabase) y otra vez despues de enviar una review para que el badge se
// actualice sin un reload completo.
export async function hydrateExperienceRatings() {
  const { data: map, error } = await getExperienceRatingsMap();
  if (error || !map) return ok(false);
  for (const experience of db.experiences) {
    const entry = map.get(experienceKey(experience));
    experience.rating = entry ? entry.rating : null;
    experience.reviewCount = entry ? entry.reviewCount : 0;
  }
  return ok(true);
}

export async function getMyReviewableBookings() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("get_my_reviewable_bookings");
      if (error) throw error;
      return ok((data || []).map((row) => ({
        bookingId: row.booking_id,
        code: row.code,
        experienceId: row.experience_id,
        experienceSlug: row.experience_slug,
        experienceTitle: cleanDisplayText(row.experience_title),
      })));
    } catch (err) {
      return fail(err);
    }
  }

  ensureLocalReviewsHydrated();
  const candidates = getReviewableLocalBookings();
  return ok(candidates.filter((b) => !db.reviews.some((r) => r.bookingId === b.bookingId)));
}

export async function submitReview({ bookingId, rating, body }) {
  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return fail({ code: "INVALID_RATING", message: "Selecciona una calificacion de 1 a 5 estrellas." });
  }

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("create_review", {
        p_booking_id: bookingId,
        p_rating: numericRating,
        p_body: body || null,
      });
      if (error) throw error;
      return ok(data);
    } catch (err) {
      return fail(mapReviewError(err));
    }
  }

  ensureLocalReviewsHydrated();
  const reviewable = getReviewableLocalBookings().find((b) => b.bookingId === bookingId);
  if (!reviewable) return fail({ code: "BOOKING_NOT_REVIEWABLE", message: "Esta reserva no esta disponible para reseña." });
  if (db.reviews.some((r) => r.bookingId === bookingId)) {
    return fail({ code: "ALREADY_REVIEWED", message: "Ya dejaste una reseña para esta reserva." });
  }

  const review = {
    id: `rv-${Date.now()}`,
    bookingId,
    experienceId: reviewable.experienceId,
    userId: state.currentUserId,
    rating: numericRating,
    body: (body || "").trim(),
    authorName: "Viajero Mono Solo",
    status: "published",
    createdAt: new Date().toISOString(),
  };
  db.reviews.unshift(review);
  persistLocalReviews();
  return ok({ review_id: review.id, status: "published" });
}
