import { db, exp } from "../../data/db.js";
import { getExperienceContent } from "../../data/experience-content.js";
import { monoCategories, provinceCodeToDestination, provinceOptions } from "../../data/mono-experiences.js";
import { findExperience } from "./queries.js";
import { slugify } from "./format.js";
import { clearReferral, readReferral, state } from "./state.js";
import { isSupabase, getSupabaseClient } from "../supabase/client.js";
import { cleanDisplayList, cleanDisplayText } from "./text.js";

const DEFAULT_IMAGE_NAMES = ["beach-girls.jpg", "snorkel-sharks.jpg", "sunset-sea.jpg"];
const LOCAL_BOOKINGS_KEY = "ms.localBookings";

function shouldKeepStaticCatalog(rows) {
  const supabaseRows = rows || [];
  const localActiveRows = db.experiences.filter((experience) => experience.status === "active");
  if (!localActiveRows.length) return false;
  if (!supabaseRows.length) return true;

  const looksLikeDemoInventory = supabaseRows.some((row) => row.is_demo || /\bDEMO\b/i.test(row.title || ""));
  return looksLikeDemoInventory && supabaseRows.length < localActiveRows.length;
}

/** Fecha de hoy en formato YYYY-MM-DD, para comparar contra `availability.date`. */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function readableCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `MS-${ymd}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
}

function maskRef(ref) {
  if (!ref) return ref || null;
  return ref.length > 4 ? "*".repeat(ref.length - 4) + ref.slice(-4) : ref;
}

function sanitizeExperienceContent(experience) {
  experience.title = cleanDisplayText(experience.title);
  experience.destination = cleanDisplayText(experience.destination);
  experience.category = cleanDisplayText(experience.category);
  experience.shortDescription = cleanDisplayText(experience.shortDescription);
  experience.fullDescription = cleanDisplayText(experience.fullDescription);
  experience.meetingPoint = cleanDisplayText(experience.meetingPoint);
  experience.included = cleanDisplayList(experience.included);
  experience.notIncluded = cleanDisplayList(experience.notIncluded);
  experience.requirements = cleanDisplayList(experience.requirements);
  experience.cancellationPolicy = cleanDisplayText(experience.cancellationPolicy);
  experience.itinerary = cleanDisplayList(experience.itinerary);
  experience.descriptionSections = cleanDisplayList(experience.descriptionSections);
  experience.rawCategory = cleanDisplayText(experience.rawCategory);
  if (experience.translations) {
    experience.translations = Object.fromEntries(
      Object.entries(experience.translations).map(([language, translation]) => [language, {
        ...translation,
        title: cleanDisplayText(translation?.title),
        shortDescription: cleanDisplayText(translation?.shortDescription),
        fullDescription: cleanDisplayText(translation?.fullDescription),
        itinerary: cleanDisplayList(translation?.itinerary),
      }]),
    );
  }
  return experience;
}

function friendlyError(err) {
  const raw = (err?.message || String(err || "")).toString();
  const known = [
    ["NOT_ENOUGH_SPOTS", "No hay cupos suficientes para esa fecha."],
    ["AVAILABILITY_CLOSED", "Esa fecha ya no esta disponible."],
    ["AVAILABILITY_NOT_FOUND", "La fecha seleccionada no existe."],
    ["EXPERIENCE_NOT_ACTIVE", "La experiencia no esta disponible."],
    ["EXPERIENCE_NOT_FOUND", "No encontramos la experiencia."],
    ["GUESTS_OVER_MAX", "Demasiados viajeros para esta reserva."],
    ["INVALID_GUESTS", "Cantidad de viajeros invalida."],
    ["INVALID_CONTACT", "Revisa nombre y correo."],
    ["INVENTORY_NOT_PERSISTED", "Esta experiencia no esta disponible para reservar en este momento. Escribinos por WhatsApp."],
    ["NOT_AUTHORIZED", "No tienes permiso para esta accion."],
    ["PAYMENT_NOT_FOUND", "No encontramos el pago."],
    ["invalid input syntax for type uuid", "Esta experiencia no esta disponible para reservar en este momento. Escribinos por WhatsApp."],
    ["idx_experiences_promo_rank_unique", "Ya otra experiencia tiene ese mismo destacado. Intenta guardar de nuevo."],
  ];
  for (const [code, msg] of known) {
    if (raw.includes(code)) return { code, message: msg };
  }
  return { code: "UNKNOWN", message: "Ocurrio un error. Intenta de nuevo." };
}

const ok = (data) => ({ data, error: null });
const fail = (err) => {
  console.error("[db-service]", err);
  return { data: null, error: friendlyError(err) };
};

function localStorageSafe() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredLocalBookings() {
  const storage = localStorageSafe();
  if (!storage) return [];
  try {
    const rows = JSON.parse(storage.getItem(LOCAL_BOOKINGS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeStoredLocalBookings(rows) {
  const storage = localStorageSafe();
  if (!storage) return;
  storage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(rows.slice(0, 50)));
}

function shouldExposeLocalBooking(booking) {
  return !isSupabase();
}

function allLocalBookings() {
  const byId = new Map();
  for (const booking of readStoredLocalBookings()) {
    if (shouldExposeLocalBooking(booking)) byId.set(booking.id, booking);
  }
  for (const booking of db.bookings) {
    if (shouldExposeLocalBooking(booking)) byId.set(booking.id, booking);
  }
  return [...byId.values()].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function persistLocalBooking(booking) {
  if (!shouldExposeLocalBooking(booking)) return;
  const rows = readStoredLocalBookings().filter((row) => row.id !== booking.id && row.publicToken !== booking.publicToken);
  writeStoredLocalBookings([booking, ...rows]);
}

function updateStoredLocalBooking(booking) {
  const rows = readStoredLocalBookings();
  const index = rows.findIndex((row) => row.id === booking.id);
  if (index === -1) return;
  rows[index] = booking;
  writeStoredLocalBookings(rows);
}

function findLocalBookingByToken(token) {
  return allLocalBookings().find((booking) => booking.publicToken === token) || null;
}

function findLocalBookingById(id) {
  return allLocalBookings().find((booking) => booking.id === id) || null;
}

export function isReservableAvailability(experience, availability) {
  const availabilityId = typeof availability === "string" ? availability : availability?.id;
  if (!experience || !availabilityId) return false;
  if (!isSupabase()) return true;
  const expUuid = experience.supabaseId || experience.id;
  return isUuid(expUuid) && isUuid(availabilityId);
}

function mapLocalBookingConfirmation(booking) {
  const experience = findExperience(booking.experienceId);
  const payment = db.payments.find((p) => p.bookingId === booking.id);
  return {
    code: booking.code || booking.bookingCode,
    experienceTitle: experience?.title || "Experiencia",
    date: booking.date,
    startTime: booking.time,
    guests: booking.guests,
    total: booking.total,
    currency: booking.currency || "USD",
    bookingStatus: booking.bookingStatus,
    paymentStatus: payment?.status || booking.paymentStatus || "no_payment",
    referenceMasked: maskRef(payment?.referenceNumber || payment?.reference),
  };
}

function mapLocalBookingListRow(booking) {
  const experience = findExperience(booking.experienceId);
  const payment = db.payments.find((p) => p.bookingId === booking.id) || null;
  return {
    code: booking.code || booking.bookingCode,
    publicToken: booking.publicToken,
    experienceTitle: experience?.title || "Experiencia",
    image: experience?.images?.[0] || null,
    date: booking.date,
    time: booking.time,
    guests: booking.guests,
    total: booking.total,
    currency: booking.currency || "USD",
    bookingStatus: booking.bookingStatus,
    paymentStatus: payment?.status || booking.paymentStatus || "no_payment",
    createdAt: booking.createdAt,
  };
}

function mapLocalAdminBookingRow(booking) {
  const payment = db.payments.find((p) => p.bookingId === booking.id) || null;
  const experience = findExperience(booking.experienceId);
  return {
    id: booking.id,
    code: booking.code || booking.bookingCode,
    experienceTitle: experience?.title || "-",
    date: booking.date,
    time: booking.time,
    contactName: booking.contactName || booking.customerName,
    contactEmail: booking.contactEmail || booking.customerEmail,
    contactPhone: booking.contactPhone || booking.customerPhone,
    guests: booking.guests,
    total: booking.total,
    currency: booking.currency || "USD",
    reference: payment?.referenceNumber || payment?.reference || "",
    bookingStatus: booking.bookingStatus,
    paymentStatus: payment?.status || booking.paymentStatus || "no_payment",
    paymentId: payment?.id || null,
    createdAt: booking.createdAt,
    source: booking.source || "local",
  };
}

function localCustomerBookingRows() {
  return allLocalBookings()
    .filter((b) => b.userId && b.userId === state.currentUserId)
    .map(mapLocalBookingListRow);
}

function localAdminBookingRows() {
  return allLocalBookings().map(mapLocalAdminBookingRow);
}

// Expuesto para reviews-service.js. Nota de paridad con mock: las bookings
// locales siempre tienen fecha futura (el catalogo mock no tiene concepto de
// disponibilidad pasada), asi que la elegibilidad aca se relaja a solo
// "confirmed"; el enforcement real (confirmed Y fecha ya pasada) vive
// enteramente en la RPC create_review().
export function getReviewableLocalBookings() {
  return allLocalBookings()
    .filter((b) => b.userId && b.userId === state.currentUserId && b.bookingStatus === "confirmed")
    .map((b) => ({ bookingId: b.id, code: b.code || b.bookingCode, experienceId: b.experienceId }));
}

export async function getExperiences() {
  return ok(db.experiences.filter((e) => e.status === "active"));
}

// Para el "flayer" del inicio: la experiencia confirmada de hoy, priorizando
// Panama City/Colon (la que de verdad ocupa a Sebastian ese dia, ver 023) por
// sobre una del interior/Kuna Yala/Shuttles si hubiera ambas el mismo dia.
// bookings no tiene lectura publica (003_rls.sql), asi que esto pasa por la
// RPC angosta get_today_featured_experience en vez de leer la tabla directo.
// Solo real (Supabase); en modo mock no hay reservas reales que anunciar, asi
// que no se inventa nada (sin banner en vez de un dato falso).
export async function getTodayFeaturedExperience() {
  if (!isSupabase()) return ok(null);

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc("get_today_featured_experience");
    if (error) throw error;
    return ok(data ? { slug: data.slug, title: cleanDisplayText(data.title) } : null);
  } catch (err) {
    console.error("[db-service] getTodayFeaturedExperience", err);
    return ok(null);
  }
}

export async function getExperienceBySlug(slug) {
  return ok(db.experiences.find((e) => e.slug === slug || e.id === slug) || null);
}

export async function getAvailability(experienceId) {
  return ok(db.availability.filter((a) => a.experienceId === experienceId));
}

export async function hydrateCatalog() {
  if (!isSupabase()) return ok(false);

  try {
    const client = getSupabaseClient();
    const { data: exps, error: e1 } = await client
      .from("experiences")
      .select("id, legacy_id, slug, title, summary, base_price, duration, min_guests, max_guests, status, is_demo, category, province, promo_rank, full_description, meeting_point, cancellation_policy, itinerary, included, not_included, requirements, images")
      .eq("status", "active");
    if (e1) throw e1;

    if (shouldKeepStaticCatalog(exps)) {
      return ok({
        source: "static-catalog",
        reason: "Supabase staging still has the smaller demo inventory.",
      });
    }

    // PostgREST corta cualquier select en 1000 filas por defecto. Con 44
    // experiencias x ~120 dias la tabla pasa de 5000 filas, asi que una sola
    // consulta devolvia un recorte arbitrario: algunas experiencias quedaban
    // con cero fechas futuras y su widget de reserva mostraba "sin cupos"
    // aunque en la base si hubiera cupo. Se pide solo lo futuro (lo pasado no
    // se puede reservar) y se pagina hasta agotar, ordenando de forma estable
    // para que el paginado no duplique ni saltee filas.
    const avails = [];
    const AVAIL_PAGE_SIZE = 1000;
    for (let from = 0; ; from += AVAIL_PAGE_SIZE) {
      const { data: page, error: e2 } = await client
        .from("availability")
        .select("id, experience_id, date, start_time, total_spots, booked_spots, status, price_override")
        .eq("status", "open")
        .gte("date", todayIso())
        .order("date", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + AVAIL_PAGE_SIZE - 1);
      if (e2) throw e2;
      avails.push(...(page || []));
      if (!page || page.length < AVAIL_PAGE_SIZE) break;
    }

    const idToLegacy = new Map();
    db.experiences = (exps || []).map((row) => {
      const localId = row.legacy_id || row.id;
      idToLegacy.set(row.id, localId);

      // Enriquece las filas delgadas de Supabase con contenido descriptivo
      // redactado por legacy_id/slug. Los campos operativos de abajo se
      // siguen tomando de Supabase.
      const content = getExperienceContent(row.legacy_id, row.slug);
      // Categoria/provincia elegidas desde el panel de admin (024) ganan
      // sobre el catalogo estatico -- null en cualquiera de las dos deja el
      // comportamiento exactamente como estaba (compatibilidad hacia atras).
      const adminDestination = row.province ? provinceCodeToDestination[row.province] : null;
      const adminCategory = row.category || null;

      const e = exp(
        localId,
        row.slug,
        cleanDisplayText(row.title),
        adminDestination || content?.destination || "Panama",
        adminCategory || content?.category || (row.is_demo ? "Demo" : "Experiencia"),
        Number(row.base_price),
        Number(row.duration) || content?.duration || 4,
        row.meeting_point || content?.meetingPoint || "Punto de encuentro por confirmar",
        DEFAULT_IMAGE_NAMES,
        null,
        0,
        row.status,
        null,
        row.min_guests || content?.minGuests || 1,
        row.max_guests || content?.maxGuests || 10,
      );

      if (content) {
        if (content.images?.length) e.images = content.images;
        if (content.shortDescription) e.shortDescription = content.shortDescription;
        if (content.fullDescription) e.fullDescription = content.fullDescription;
        if (content.catalogGroups) e.catalogGroups = content.catalogGroups;
        if (content.included) e.included = content.included;
        if (content.notIncluded) e.notIncluded = content.notIncluded;
        if (content.requirements) e.requirements = content.requirements;
        if (content.cancellationPolicy) e.cancellationPolicy = content.cancellationPolicy;
        if (content.itinerary) e.itinerary = content.itinerary;
        if (content.descriptionSections) e.descriptionSections = content.descriptionSections;
        if (content.cuantoLink) e.cuantoLink = content.cuantoLink;
        if (content.rawCategory) e.rawCategory = content.rawCategory;
        if (content.sourceFolder) e.sourceFolder = content.sourceFolder;
        if (content.sourceImageCount) e.sourceImageCount = content.sourceImageCount;
        if (content.publishedInCuanto !== undefined) e.publishedInCuanto = content.publishedInCuanto;
      }
      // El admin eligiendo categoria Y provincia manda por encima de
      // catalogGroups del catalogo estatico (incluida la doble membresia
      // que algunas experiencias tienen ahi): pasa a tener una sola
      // categoria/provincia, la que el admin haya elegido.
      if (adminCategory && adminDestination) {
        e.catalogGroups = [{ destination: adminDestination, category: adminCategory }];
      }
      // Contenido largo elegido desde el panel de admin (025) gana sobre el
      // catalogo estatico campo por campo -- null/vacio en Supabase deja el
      // comportamiento exactamente como estaba. A diferencia de "summary"
      // (columna vieja, puede traer datos genericos de la importacion
      // original), estas columnas son nuevas: null es siempre "sin editar".
      if (row.full_description) e.fullDescription = cleanDisplayText(row.full_description);
      if (row.cancellation_policy) e.cancellationPolicy = row.cancellation_policy;
      if (row.itinerary?.length) e.itinerary = row.itinerary;
      if (row.included?.length) e.included = row.included;
      if (row.not_included?.length) e.notIncluded = row.not_included;
      if (row.requirements?.length) e.requirements = row.requirements;
      if (row.images?.length) e.images = row.images;
      // Conserva el copy redactado por idioma cuando el catalogo estatico lo
      // tiene. Supabase sigue siendo la fuente de verdad de los campos
      // operativos; un summary generico mas viejo no debe reemplazar el copy
      // traducido publico de la experiencia.
      if (row.summary && !content?.translations?.es?.shortDescription) {
        e.shortDescription = cleanDisplayText(row.summary);
      }
      if (content?.translations) {
        e.translations = {
          ...content.translations,
          es: {
            ...content.translations.es,
            title: content.translations.es?.title || e.title,
            shortDescription: content.translations.es?.shortDescription || e.shortDescription,
            // Si el admin edito full_description/itinerary, se muestra igual
            // en los dos idiomas (no hay campo de admin separado por idioma
            // todavia) -- si no, se respeta la traduccion estatica de siempre.
            fullDescription: row.full_description
              ? cleanDisplayText(row.full_description)
              : (content.translations.es?.fullDescription || e.fullDescription),
            itinerary: row.itinerary?.length
              ? row.itinerary
              : (content.translations.es?.itinerary?.length ? content.translations.es.itinerary : e.itinerary),
          },
        };
      }

      e.supabaseId = row.id;
      e.isDemo = Boolean(row.is_demo);
      // No reviews are persisted yet: keep rating/reviewCount honest (no fakes).
      e.rating = null;
      e.reviewCount = 0;
      e.promoRank = row.promo_rank ?? null;
      return sanitizeExperienceContent(e);
    })
    // El select de `experiences` no tiene `order by`, asi que Postgres puede
    // devolver las filas en cualquier orden y el catalogo se barajearia entre
    // deploys. Ordenar aca por legacy id coincide con el orden propio del
    // catalogo estatico, que es lo que decide que experiencia se muestra
    // primero dentro de una categoria.
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: "base" }));

    db.availability = (avails || []).map((row) => ({
      id: row.id,
      experienceId: idToLegacy.get(row.experience_id) || row.experience_id,
      date: row.date,
      startTime: (row.start_time || "").slice(0, 5),
      endTime: "",
      totalSpots: row.total_spots,
      bookedSpots: row.booked_spots,
      availableSpots: Math.max(row.total_spots - row.booked_spots, 0),
      priceOverride: row.price_override,
      status: row.status === "open" ? "available" : "blocked",
    }));

    return ok(true);
  } catch (err) {
    return ok({
      source: "static-catalog",
      reason: "Supabase catalog fetch failed; kept the local Cuanto catalog.",
      error: friendlyError(err),
    });
  }
}

function createLocalGuestBooking(input, options = {}) {
  const {
    experienceId,
    availabilityId,
    guests,
    contactName,
    contactEmail,
    contactPhone,
    paymentMethod = "manual",
  } = input;

  try {
    const experience = findExperience(experienceId);
    const availability = db.availability.find((a) => a.id === availabilityId) || null;
    if (!experience) throw new Error("EXPERIENCE_NOT_FOUND");
    if (availability && (availability.totalSpots - availability.bookedSpots) < Number(guests)) {
      throw new Error("NOT_ENOUGH_SPOTS");
    }

    const unit = availability?.priceOverride || experience.basePrice;
    const total = unit * Number(guests);
    const code = readableCode();
    const publicToken = uuid();
    const bookingId = `b-${Date.now()}`;

    const booking = {
      id: bookingId,
      code,
      bookingCode: code,
      publicToken,
      // Paridad con la RPC en mock: liga la booking al customer mock
      // logueado para que aparezca en su area privada; guest se queda null.
      userId: state.role === "customer" ? state.currentUserId : null,
      experienceId: experience.id,
      availabilityId: availability?.id,
      date: availability?.date || "-",
      time: availability?.startTime || "",
      guests: Number(guests),
      unitPrice: unit,
      subtotal: total,
      taxes: 0,
      total,
      currency: "USD",
      customerName: contactName,
      customerEmail: contactEmail,
      customerPhone: contactPhone || "",
      contactName,
      contactEmail,
      paymentMethod,
      paymentStatus: "no_payment",
      bookingStatus: "confirmed",
      channel: "web",
      partnerId: null,
      // Referido QR de hostel (docs/product/HOSTEL_QR_REFERRAL_PROPOSAL.md).
      // El modo mock no tiene tabla de partners contra la cual resolver --
      // solo pasa el codigo crudo para visibilidad local/demo.
      referralCode: readReferral(),
      createdAt: new Date().toISOString(),
      source: options.source || "local",
    };
    db.bookings.unshift(booking);
    persistLocalBooking(booking);

    if (availability) {
      availability.bookedSpots += Number(guests);
      availability.availableSpots = Math.max(availability.totalSpots - availability.bookedSpots, 0);
    }
    clearReferral();

    return ok({
      code,
      publicToken,
      status: "confirmed",
      paymentStatus: "no_payment",
      total,
      currency: "USD",
      source: booking.source,
    });
  } catch (err) {
    return fail(err);
  }
}

// El parametro p_referral_code de create_guest_booking solo existe una vez
// que el owner aplica la migracion 013 en el SQL Editor de Supabase -- hasta
// entonces, llamar la RPC con esa key falla con "could not find the
// function" (PostgREST no puede resolver un overload con un named param
// desconocido), lo que de otro modo romperia el camino mas critico de la app
// (creacion de reserva) para cada visitante. Reintenta una vez sin el
// parametro para que la reserva nunca dependa del timing del deploy de 013,
// siguiendo el principio de mock-fallback-hasta-validar-todo.
async function callCreateGuestBookingRpc(client, params) {
  const first = await client.rpc("create_guest_booking", params);
  if (!first.error) return first;
  const message = (first.error.message || "").toLowerCase();
  const looksLikeMissingReferralParam =
    "p_referral_code" in params &&
    (message.includes("p_referral_code") || message.includes("could not find the function") || message.includes("schema cache"));
  if (!looksLikeMissingReferralParam) return first;
  const { p_referral_code, ...withoutReferral } = params;
  return client.rpc("create_guest_booking", withoutReferral);
}

export async function createGuestBooking(input) {
  const {
    experienceId,
    availabilityId,
    guests,
    contactName,
    contactEmail,
    contactPhone,
    paymentReference,
    paymentMethod = "manual",
  } = input;

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const experience = findExperience(experienceId);
      const expUuid = experience?.supabaseId || experienceId;
      if (!isUuid(expUuid) || !isUuid(availabilityId)) throw new Error("INVENTORY_NOT_PERSISTED");

      const { data, error } = await callCreateGuestBookingRpc(client, {
        p_experience_id: expUuid,
        p_availability_id: availabilityId,
        p_guests: Number(guests),
        p_contact_name: contactName,
        p_contact_email: contactEmail,
        p_contact_phone: contactPhone || "",
        p_payment_reference: paymentReference || "",
        p_payment_method: paymentMethod,
        p_referral_code: readReferral(),
      });
      if (error) throw error;
      clearReferral();
      return ok({
        code: data.code,
        publicToken: data.public_token,
        status: data.status,
        paymentStatus: data.payment_status || "no_payment",
        total: data.total,
        currency: data.currency,
      });
    } catch (err) {
      return fail(err);
    }
  }

  return createLocalGuestBooking(input, { source: "mock" });
}

export async function getPublicBookingConfirmation(token) {
  if (!token) return ok(null);

  const localBooking = findLocalBookingByToken(token);
  if (localBooking) return ok(mapLocalBookingConfirmation(localBooking));

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("get_public_booking_confirmation", { p_public_token: token });
      if (error) throw error;
      if (!data) return ok(null);
      return ok({
        code: data.code,
        experienceTitle: data.experience_title,
        date: data.date,
        startTime: (data.start_time || "").slice(0, 5),
        guests: data.guests,
        total: data.total,
        currency: data.currency,
        bookingStatus: data.booking_status,
        paymentStatus: data.payment_status || "no_payment",
        referenceMasked: data.payment_reference_masked,
      });
    } catch (err) {
      return fail(err);
    }
  }

  return ok(null);
}

// experiences no tiene columna de imagen (las fotos solo viven en el
// catalogo estatico del frontend, src/data/mono-experiences.js, indexado por
// legacy_id/slug), asi que una fila de booking de Supabase se tiene que
// matchear explicitamente de vuelta a db.experiences. A proposito no se
// reusa findExperience() de queries.js aca -- esa cae de vuelta a
// db.experiences[0] cuando no encuentra nada, lo que mostraria en silencio
// la foto de la experiencia equivocada en vez de simplemente no mostrar foto.
function resolveBookingCoverImage({ experienceId, legacyId, slug }) {
  const match = db.experiences.find((e) =>
    (legacyId && e.id === legacyId) ||
    (experienceId && e.supabaseId === experienceId) ||
    (slug && e.slug === slug),
  );
  return match?.images?.[0] || null;
}

export async function getMyBookings() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("get_my_bookings");
      if (error) throw error;
      const rows = (data || []).map((b) => ({
        code: b.code,
        publicToken: b.public_token,
        experienceTitle: cleanDisplayText(b.experience_title) || "Experiencia",
        image: resolveBookingCoverImage({
          experienceId: b.experience_id,
          legacyId: b.experience_legacy_id,
          slug: b.experience_slug,
        }),
        date: b.date,
        time: (b.start_time || "").slice(0, 5),
        guests: b.guests,
        total: b.total,
        currency: b.currency || "USD",
        bookingStatus: b.booking_status,
        paymentStatus: b.payment_status || "no_payment",
        createdAt: b.created_at,
      }));
      return ok([...localCustomerBookingRows(), ...rows]);
    } catch (err) {
      return fail(err);
    }
  }

  return ok(localCustomerBookingRows());
}

export async function listAdminBookings() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("bookings")
        .select("id, code, guests, total, currency, status, contact_name, contact_email, contact_phone, created_at, experiences(title), availability(date, start_time), payments(id, status, reference, amount), partners(code, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []).map((b) => {
        const payment = (b.payments || [])[0] || null;
        return {
          id: b.id,
          code: b.code,
          experienceTitle: b.experiences?.title || "-",
          date: b.availability?.date || "-",
          time: (b.availability?.start_time || "").slice(0, 5),
          contactName: b.contact_name,
          contactEmail: b.contact_email,
          contactPhone: b.contact_phone,
          guests: b.guests,
          total: b.total,
          currency: b.currency,
          reference: payment?.reference || "",
          bookingStatus: b.status,
          paymentStatus: payment?.status || "no_payment",
          paymentId: payment?.id || null,
          createdAt: b.created_at,
          referralPartnerName: b.partners?.name || null,
          referralPartnerCode: b.partners?.code || null,
        };
      });
      return ok([...localAdminBookingRows(), ...rows]);
    } catch (err) {
      return fail(err);
    }
  }

  return ok(localAdminBookingRows());
}

export async function approvePayment(paymentId) {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("approve_booking_payment", { p_payment_id: paymentId });
      if (error) throw error;
      return ok(data);
    } catch (err) {
      return fail(err);
    }
  }

  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) return fail(new Error("PAYMENT_NOT_FOUND"));
  payment.status = "approved";
  payment.verifiedBy = "mock-admin";
  payment.verifiedAt = new Date().toISOString();
  const booking = db.bookings.find((b) => b.id === payment.bookingId);
  if (booking) {
    booking.paymentStatus = "approved";
    booking.bookingStatus = "confirmed";
  }
  return ok({ payment_status: "approved", booking_status: "confirmed" });
}

export async function rejectPayment(paymentId) {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("reject_booking_payment", { p_payment_id: paymentId });
      if (error) throw error;
      return ok(data);
    } catch (err) {
      return fail(err);
    }
  }

  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) return fail(new Error("PAYMENT_NOT_FOUND"));
  payment.status = "rejected";
  payment.verifiedBy = "mock-admin";
  payment.verifiedAt = new Date().toISOString();
  const booking = db.bookings.find((b) => b.id === payment.bookingId);
  if (booking) {
    booking.paymentStatus = "rejected";
    booking.bookingStatus = "pending";
  }
  return ok({ payment_status: "rejected", booking_status: "pending" });
}

export async function updateBookingStatus(bookingId, status) {
  const nextStatus = ["pending", "under_review", "confirmed", "cancelled"].includes(status) ? status : "pending";
  const localBooking = findLocalBookingById(bookingId);
  if (localBooking) {
    localBooking.bookingStatus = nextStatus;
    updateStoredLocalBooking(localBooking);
    return ok({ bookingId, bookingStatus: nextStatus });
  }

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("bookings")
        .update({ status: nextStatus })
        .eq("id", bookingId)
        .select("id, status")
        .single();
      if (error) throw error;
      return ok({ bookingId: data.id, bookingStatus: data.status });
    } catch (err) {
      return fail(err);
    }
  }

  return fail(new Error("BOOKING_NOT_FOUND"));
}

// =============================================================================
// Admin CRUD (experiencias, disponibilidad, clientes, reportes).
// El enforcement real es RLS de Supabase (is_admin() en experiences/
// availability + lecturas de booking/payment solo-admin). Los caminos mock
// mantienen las mismas formas para que la UI de admin funcione en modo local/demo.
// =============================================================================

const EXP_COLUMNS =
  "id, legacy_id, slug, title, summary, base_price, duration, min_guests, max_guests, status, is_demo, category, province, promo_rank, full_description, meeting_point, cancellation_policy, itinerary, included, not_included, requirements, images";
const VALID_CATEGORY_NAMES = new Set(monoCategories.map((c) => c.name));
const VALID_PROVINCE_CODES = new Set(provinceOptions.map((p) => p.value));

// El admin ve el contenido REAL que hoy esta en vivo (estatico si nunca lo
// edito, o su propio override si ya lo hizo) en vez de campos en blanco con
// un mensaje "vacio = usa el catalogo" -- se edita como en un CMS normal, no
// a ciegas. getExperienceContent es la misma fuente que usa hydrateCatalog.
function mapExperienceRow(row) {
  const content = getExperienceContent(row.legacy_id, row.slug);
  return {
    id: row.id,
    legacyId: row.legacy_id || null,
    slug: row.slug,
    title: cleanDisplayText(row.title),
    summary: cleanDisplayText(row.summary) || content?.shortDescription || "",
    basePrice: Number(row.base_price),
    duration: row.duration != null ? Number(row.duration) : null,
    minGuests: row.min_guests,
    maxGuests: row.max_guests,
    status: row.status,
    isDemo: Boolean(row.is_demo),
    category: row.category || null,
    province: row.province || null,
    promoRank: row.promo_rank ?? null,
    fullDescription: row.full_description || content?.fullDescription || "",
    meetingPoint: row.meeting_point || content?.meetingPoint || "",
    cancellationPolicy: row.cancellation_policy || content?.cancellationPolicy || "",
    itinerary: row.itinerary?.length ? row.itinerary : (content?.itinerary || []),
    included: row.included?.length ? row.included : (content?.included || []),
    notIncluded: row.not_included?.length ? row.not_included : (content?.notIncluded || []),
    requirements: row.requirements?.length ? row.requirements : (content?.requirements || []),
    images: row.images?.length ? row.images : (content?.images || []),
    // Distingue "esto lo subio el admin" de "esto es solo la vista previa del
    // catalogo estatico" -- el panel necesita saberlo para decidir si mostrar
    // el boton de quitar foto (solo tiene sentido sobre fotos propias).
    hasCustomImages: Boolean(row.images?.length),
  };
}

function normalizeExperienceInput(input) {
  const title = (input.title || "").trim();
  const slug = (input.slug || "").trim() || slugify(title);
  const basePrice = Number(input.basePrice);
  const minGuests = Math.max(1, Number(input.minGuests) || 1);
  const maxGuests = Math.max(minGuests, Number(input.maxGuests) || minGuests);
  const duration = input.duration === "" || input.duration == null ? null : Number(input.duration);
  const status = ["active", "paused", "draft"].includes(input.status) ? input.status : "draft";
  const category = VALID_CATEGORY_NAMES.has(input.category) ? input.category : null;
  const province = VALID_PROVINCE_CODES.has(input.province) ? input.province : null;
  const promoRank = [1, 2].includes(Number(input.promoRank)) ? Number(input.promoRank) : null;
  const fullDescription = (input.fullDescription || "").trim();
  const meetingPoint = (input.meetingPoint || "").trim();
  const cancellationPolicy = (input.cancellationPolicy || "").trim();
  const itinerary = linesToList(input.itinerary);
  const included = linesToList(input.included);
  const notIncluded = linesToList(input.notIncluded);
  const requirements = linesToList(input.requirements);

  if (!title) throw new Error("INVALID_TITLE");
  if (!slug) throw new Error("INVALID_SLUG");
  if (!Number.isFinite(basePrice) || basePrice < 0) throw new Error("INVALID_PRICE");

  return {
    title, slug, summary: (input.summary || "").trim(), basePrice, duration, minGuests, maxGuests, status,
    category, province, promoRank,
    fullDescription, meetingPoint, cancellationPolicy, itinerary, included, notIncluded, requirements,
  };
}

// El admin escribe listas (itinerario, incluye, etc.) una linea por item en
// un textarea -- mas simple que un editor de "agregar/quitar" para el primer
// corte de esto, y ya es el mismo patron que espera cualquiera que edito una
// lista en un formulario de texto plano.
function linesToList(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function adminListExperiences() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("experiences")
        .select(EXP_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ok((data || []).map(mapExperienceRow));
    } catch (err) {
      return fail(err);
    }
  }

  const rows = db.experiences.map((e) => ({
    id: e.supabaseId || e.id,
    legacyId: e.id,
    slug: e.slug,
    title: e.title,
    summary: e.shortDescription || "",
    basePrice: Number(e.basePrice),
    duration: e.duration || null,
    minGuests: e.minGuests || 1,
    maxGuests: e.maxGuests || 10,
    status: e.status,
    isDemo: Boolean(e.isDemo),
    category: e.category || null,
    province: e.province || null,
    promoRank: e.promoRank ?? null,
    fullDescription: e.fullDescription || "",
    meetingPoint: e.meetingPoint || "",
    cancellationPolicy: e.cancellationPolicy || "",
    itinerary: e.itinerary || [],
    included: e.included || [],
    notIncluded: e.notIncluded || [],
    requirements: e.requirements || [],
    images: e.images || [],
    hasCustomImages: false,
  }));
  return ok(rows);
}

// Antes de guardar un promoRank, libera esa misma posicion (1 o 2) de
// cualquier OTRA experiencia que la tuviera: se comporta como radio button
// desde el panel, no como checkbox -- nunca hay dos "principal" a la vez.
async function releasePromoRank(client, rank, exceptId) {
  if (rank == null) return;
  let query = client.from("experiences").update({ promo_rank: null }).eq("promo_rank", rank);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  if (error) throw error;
}

function releasePromoRankLocal(rank, exceptId) {
  if (rank == null) return;
  for (const e of db.experiences) {
    const id = e.supabaseId || e.id;
    if (e.promoRank === rank && id !== exceptId) e.promoRank = null;
  }
}

export async function adminGetExperience(id) {
  const { data, error } = await adminListExperiences();
  if (error) return { data: null, error };
  return ok(data.find((e) => e.id === id || e.slug === id || e.legacyId === id) || null);
}

export async function adminCreateExperience(input) {
  let payload;
  try {
    payload = normalizeExperienceInput(input);
  } catch (err) {
    return fail(err);
  }

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      await releasePromoRank(client, payload.promoRank, null);
      const { data, error } = await client
        .from("experiences")
        .insert({
          slug: payload.slug,
          title: payload.title,
          summary: payload.summary || null,
          base_price: payload.basePrice,
          duration: payload.duration,
          min_guests: payload.minGuests,
          max_guests: payload.maxGuests,
          status: payload.status,
          category: payload.category,
          province: payload.province,
          promo_rank: payload.promoRank,
          full_description: payload.fullDescription || null,
          meeting_point: payload.meetingPoint || null,
          cancellation_policy: payload.cancellationPolicy || null,
          itinerary: payload.itinerary.length ? payload.itinerary : null,
          included: payload.included.length ? payload.included : null,
          not_included: payload.notIncluded.length ? payload.notIncluded : null,
          requirements: payload.requirements.length ? payload.requirements : null,
        })
        .select(EXP_COLUMNS)
        .single();
      if (error) throw error;
      return ok(mapExperienceRow(data));
    } catch (err) {
      return fail(err);
    }
  }

  const next = exp(
    `e-${Date.now()}`,
    payload.slug,
    payload.title,
    (payload.province && provinceCodeToDestination[payload.province]) || "Panama",
    payload.category || "Experiencia",
    payload.basePrice,
    payload.duration || 4,
    "Por definir",
    DEFAULT_IMAGE_NAMES,
    null,
    0,
    payload.status,
    null,
    payload.minGuests,
    payload.maxGuests,
  );
  if (payload.summary) next.shortDescription = payload.summary;
  next.province = payload.province || null;
  if (payload.category && payload.province) {
    next.catalogGroups = [{ destination: provinceCodeToDestination[payload.province], category: payload.category }];
  }
  if (payload.fullDescription) next.fullDescription = payload.fullDescription;
  if (payload.meetingPoint) next.meetingPoint = payload.meetingPoint;
  if (payload.cancellationPolicy) next.cancellationPolicy = payload.cancellationPolicy;
  if (payload.itinerary.length) next.itinerary = payload.itinerary;
  if (payload.included.length) next.included = payload.included;
  if (payload.notIncluded.length) next.notIncluded = payload.notIncluded;
  if (payload.requirements.length) next.requirements = payload.requirements;
  releasePromoRankLocal(payload.promoRank, null);
  next.promoRank = payload.promoRank;
  db.experiences.unshift(next);
  return ok({
    id: next.id,
    legacyId: next.id,
    slug: next.slug,
    title: next.title,
    summary: next.shortDescription || "",
    basePrice: Number(next.basePrice),
    duration: next.duration || null,
    minGuests: next.minGuests,
    maxGuests: next.maxGuests,
    status: next.status,
    isDemo: false,
    category: next.category || null,
    province: next.province || null,
    promoRank: next.promoRank ?? null,
    fullDescription: next.fullDescription || "",
    meetingPoint: next.meetingPoint || "",
    cancellationPolicy: next.cancellationPolicy || "",
    itinerary: next.itinerary || [],
    included: next.included || [],
    notIncluded: next.notIncluded || [],
    requirements: next.requirements || [],
    images: next.images || [],
    hasCustomImages: false,
  });
}

export async function adminUpdateExperience(id, input) {
  let payload;
  try {
    payload = normalizeExperienceInput(input);
  } catch (err) {
    return fail(err);
  }

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      await releasePromoRank(client, payload.promoRank, id);
      const { data, error } = await client
        .from("experiences")
        .update({
          slug: payload.slug,
          title: payload.title,
          summary: payload.summary || null,
          base_price: payload.basePrice,
          duration: payload.duration,
          min_guests: payload.minGuests,
          max_guests: payload.maxGuests,
          status: payload.status,
          category: payload.category,
          province: payload.province,
          promo_rank: payload.promoRank,
          full_description: payload.fullDescription || null,
          meeting_point: payload.meetingPoint || null,
          cancellation_policy: payload.cancellationPolicy || null,
          itinerary: payload.itinerary.length ? payload.itinerary : null,
          included: payload.included.length ? payload.included : null,
          not_included: payload.notIncluded.length ? payload.notIncluded : null,
          requirements: payload.requirements.length ? payload.requirements : null,
        })
        .eq("id", id)
        .select(EXP_COLUMNS)
        .single();
      if (error) throw error;
      return ok(mapExperienceRow(data));
    } catch (err) {
      return fail(err);
    }
  }

  const e = db.experiences.find((x) => x.id === id || x.slug === id);
  if (!e) return fail(new Error("EXPERIENCE_NOT_FOUND"));
  e.title = payload.title;
  e.slug = payload.slug;
  e.shortDescription = payload.summary || e.shortDescription;
  e.basePrice = payload.basePrice;
  e.duration = payload.duration || e.duration;
  e.minGuests = payload.minGuests;
  e.maxGuests = payload.maxGuests;
  e.status = payload.status;
  e.category = payload.category || e.category;
  e.province = payload.province;
  if (payload.category && payload.province) {
    e.destination = provinceCodeToDestination[payload.province];
    e.catalogGroups = [{ destination: e.destination, category: payload.category }];
  }
  if (payload.fullDescription) e.fullDescription = payload.fullDescription;
  if (payload.meetingPoint) e.meetingPoint = payload.meetingPoint;
  if (payload.cancellationPolicy) e.cancellationPolicy = payload.cancellationPolicy;
  if (payload.itinerary.length) e.itinerary = payload.itinerary;
  if (payload.included.length) e.included = payload.included;
  if (payload.notIncluded.length) e.notIncluded = payload.notIncluded;
  if (payload.requirements.length) e.requirements = payload.requirements;
  releasePromoRankLocal(payload.promoRank, e.supabaseId || e.id);
  e.promoRank = payload.promoRank;
  return ok({
    id: e.supabaseId || e.id,
    legacyId: e.id,
    slug: e.slug,
    title: e.title,
    summary: e.shortDescription || "",
    basePrice: Number(e.basePrice),
    duration: e.duration || null,
    minGuests: e.minGuests,
    maxGuests: e.maxGuests,
    status: e.status,
    isDemo: Boolean(e.isDemo),
    category: e.category || null,
    province: e.province || null,
    promoRank: e.promoRank ?? null,
    fullDescription: e.fullDescription || "",
    meetingPoint: e.meetingPoint || "",
    cancellationPolicy: e.cancellationPolicy || "",
    itinerary: e.itinerary || [],
    included: e.included || [],
    notIncluded: e.notIncluded || [],
    requirements: e.requirements || [],
    images: e.images || [],
    hasCustomImages: false,
  });
}

export async function adminSetExperienceStatus(id, status) {
  const nextStatus = ["active", "paused", "draft"].includes(status) ? status : "draft";
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("experiences")
        .update({ status: nextStatus })
        .eq("id", id)
        .select(EXP_COLUMNS)
        .single();
      if (error) throw error;
      return ok(mapExperienceRow(data));
    } catch (err) {
      return fail(err);
    }
  }

  const e = db.experiences.find((x) => x.id === id || x.slug === id);
  if (!e) return fail(new Error("EXPERIENCE_NOT_FOUND"));
  e.status = nextStatus;
  return ok({ id: e.supabaseId || e.id, status: e.status });
}

// -----------------------------------------------------------------------------
// Disponibilidad
// -----------------------------------------------------------------------------

const AVAIL_COLUMNS = "id, experience_id, date, start_time, total_spots, booked_spots, status, price_override";

function mapAvailabilityRow(row) {
  return {
    id: row.id,
    experienceId: row.experience_id,
    date: row.date,
    startTime: (row.start_time || "").slice(0, 5),
    totalSpots: row.total_spots,
    bookedSpots: row.booked_spots,
    availableSpots: Math.max((row.total_spots || 0) - (row.booked_spots || 0), 0),
    priceOverride: row.price_override != null ? Number(row.price_override) : null,
    status: row.status,
  };
}

function normalizeAvailabilityInput(input) {
  const date = (input.date || "").trim();
  const totalSpots = Number(input.totalSpots);
  const startTime = (input.startTime || "").trim();
  const status = input.status === "closed" ? "closed" : "open";
  const priceOverride =
    input.priceOverride === "" || input.priceOverride == null ? null : Number(input.priceOverride);

  if (!date) throw new Error("INVALID_DATE");
  if (!Number.isFinite(totalSpots) || totalSpots < 0) throw new Error("INVALID_SPOTS");
  if (priceOverride != null && (!Number.isFinite(priceOverride) || priceOverride < 0)) {
    throw new Error("INVALID_PRICE");
  }

  return { date, startTime: startTime || null, totalSpots, status, priceOverride };
}

export async function adminListAvailability(experienceId) {
  if (!experienceId) return ok([]);

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("availability")
        .select(AVAIL_COLUMNS)
        .eq("experience_id", experienceId)
        .order("date", { ascending: true });
      if (error) throw error;
      return ok((data || []).map(mapAvailabilityRow));
    } catch (err) {
      return fail(err);
    }
  }

  const rows = db.availability
    .filter((a) => a.experienceId === experienceId)
    .map((a) => ({
      id: a.id,
      experienceId: a.experienceId,
      date: a.date,
      startTime: a.startTime || "",
      totalSpots: a.totalSpots,
      bookedSpots: a.bookedSpots,
      availableSpots: Math.max((a.totalSpots || 0) - (a.bookedSpots || 0), 0),
      priceOverride: a.priceOverride != null ? Number(a.priceOverride) : null,
      status: a.status === "blocked" ? "closed" : "open",
    }));
  return ok(rows);
}

export async function adminCreateAvailability(experienceId, input) {
  if (!experienceId) return fail(new Error("EXPERIENCE_NOT_FOUND"));
  let payload;
  try {
    payload = normalizeAvailabilityInput(input);
  } catch (err) {
    return fail(err);
  }

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("availability")
        .insert({
          experience_id: experienceId,
          date: payload.date,
          start_time: payload.startTime,
          total_spots: payload.totalSpots,
          booked_spots: 0,
          status: payload.status,
          price_override: payload.priceOverride,
        })
        .select(AVAIL_COLUMNS)
        .single();
      if (error) throw error;
      return ok(mapAvailabilityRow(data));
    } catch (err) {
      return fail(err);
    }
  }

  const row = {
    id: `av-${Date.now()}`,
    experienceId,
    date: payload.date,
    startTime: payload.startTime || "",
    endTime: "",
    totalSpots: payload.totalSpots,
    bookedSpots: 0,
    availableSpots: payload.totalSpots,
    priceOverride: payload.priceOverride,
    status: payload.status === "closed" ? "blocked" : "available",
  };
  db.availability.push(row);
  return ok({ ...row, status: payload.status });
}

export async function adminUpdateAvailability(id, input) {
  let payload;
  try {
    payload = normalizeAvailabilityInput(input);
  } catch (err) {
    return fail(err);
  }

  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("availability")
        .update({
          date: payload.date,
          start_time: payload.startTime,
          total_spots: payload.totalSpots,
          status: payload.status,
          price_override: payload.priceOverride,
        })
        .eq("id", id)
        .select(AVAIL_COLUMNS)
        .single();
      if (error) throw error;
      return ok(mapAvailabilityRow(data));
    } catch (err) {
      return fail(err);
    }
  }

  const a = db.availability.find((x) => x.id === id);
  if (!a) return fail(new Error("AVAILABILITY_NOT_FOUND"));
  if (payload.totalSpots < a.bookedSpots) return fail(new Error("NOT_ENOUGH_SPOTS"));
  a.date = payload.date;
  a.startTime = payload.startTime || "";
  a.totalSpots = payload.totalSpots;
  a.availableSpots = Math.max(a.totalSpots - a.bookedSpots, 0);
  a.priceOverride = payload.priceOverride;
  a.status = payload.status === "closed" ? "blocked" : "available";
  return ok(mapAvailabilityRow({
    id: a.id,
    experience_id: a.experienceId,
    date: a.date,
    start_time: a.startTime,
    total_spots: a.totalSpots,
    booked_spots: a.bookedSpots,
    status: payload.status,
    price_override: a.priceOverride,
  }));
}

export async function adminSetAvailabilityStatus(id, status) {
  const nextStatus = status === "closed" ? "closed" : "open";
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("availability")
        .update({ status: nextStatus })
        .eq("id", id)
        .select(AVAIL_COLUMNS)
        .single();
      if (error) throw error;
      return ok(mapAvailabilityRow(data));
    } catch (err) {
      return fail(err);
    }
  }

  const a = db.availability.find((x) => x.id === id);
  if (!a) return fail(new Error("AVAILABILITY_NOT_FOUND"));
  a.status = nextStatus === "closed" ? "blocked" : "available";
  return ok({ id: a.id, status: nextStatus });
}

// -----------------------------------------------------------------------------
// Clientes (lightweight operational list: registered customers + booking stats)
// -----------------------------------------------------------------------------

export async function adminListCustomers() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const [{ data: profiles, error: e1 }, { data: bookings, error: e2 }] = await Promise.all([
        client.from("profiles").select("id, full_name, role, email, phone, created_at").eq("role", "customer"),
        client.from("bookings").select("user_id, contact_name, contact_email, contact_phone, total, status, created_at"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const byUser = new Map();
      for (const b of bookings || []) {
        if (!b.user_id) continue;
        const entry = byUser.get(b.user_id) || { count: 0, total: 0, last: null, email: null, phone: null, name: null };
        entry.count += 1;
        entry.total += Number(b.total || 0);
        if (!entry.last || b.created_at > entry.last) {
          entry.last = b.created_at;
          entry.email = b.contact_email || entry.email;
          entry.phone = b.contact_phone || entry.phone;
          entry.name = b.contact_name || entry.name;
        }
        byUser.set(b.user_id, entry);
      }

      const rows = (profiles || []).map((p) => {
        const stats = byUser.get(p.id) || { count: 0, total: 0, last: null, email: null, phone: null, name: null };
        return {
          id: p.id,
          fullName: cleanDisplayText(p.full_name) || stats.name || "(sin nombre)",
          email: p.email || stats.email || "-",
          phone: p.phone || stats.phone || "-",
          bookingCount: stats.count,
          totalSpent: stats.total,
          lastBookingAt: stats.last,
          createdAt: p.created_at,
        };
      });
      rows.sort((a, b) => (b.lastBookingAt || "").localeCompare(a.lastBookingAt || ""));
      return ok(rows);
    } catch (err) {
      return fail(err);
    }
  }

  const byUser = new Map();
  for (const b of db.bookings) {
    if (!b.userId) continue;
    const entry = byUser.get(b.userId) || { count: 0, total: 0, last: null, email: null, phone: null, name: null };
    entry.count += 1;
    entry.total += Number(b.total || 0);
    const created = b.createdAt || "";
    if (!entry.last || created > entry.last) {
      entry.last = created;
      entry.email = b.contactEmail || b.customerEmail || entry.email;
      entry.phone = b.contactPhone || b.customerPhone || entry.phone;
      entry.name = b.contactName || b.customerName || entry.name;
    }
    byUser.set(b.userId, entry);
  }
  const rows = [...byUser.entries()].map(([userId, stats]) => {
    const user = db.users.find((u) => u.id === userId);
    return {
      id: userId,
      fullName: user?.name || stats.name || "(sin nombre)",
      email: user?.email || stats.email || "-",
      phone: user?.phone || stats.phone || "-",
      bookingCount: stats.count,
      totalSpent: stats.total,
      lastBookingAt: stats.last,
      createdAt: user?.createdAt || null,
    };
  });
  rows.sort((a, b) => (b.lastBookingAt || "").localeCompare(a.lastBookingAt || ""));
  return ok(rows);
}

// -----------------------------------------------------------------------------
// Reportes (solo conteos reales; nada de metricas inventadas)
// -----------------------------------------------------------------------------

export async function adminGetReports() {
  if (isSupabase()) {
    try {
      const client = getSupabaseClient();
      const [{ data: bookings, error: e1 }, { data: payments, error: e2 }, { data: avails, error: e3 }] =
        await Promise.all([
          client.from("bookings").select("status, total, user_id"),
          client.from("payments").select("status, amount"),
          client.from("availability").select("total_spots, booked_spots"),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      return ok(buildReports(bookings || [], payments || [], avails || []));
    } catch (err) {
      return fail(err);
    }
  }

  const bookings = db.bookings.map((b) => ({ status: b.bookingStatus, total: b.total, user_id: b.userId }));
  const payments = db.payments.map((p) => ({ status: p.status, amount: p.amount }));
  const avails = db.availability.map((a) => ({ total_spots: a.totalSpots, booked_spots: a.bookedSpots }));
  return ok(buildReports(bookings, payments, avails));
}

function buildReports(bookings, payments, avails) {
  const totalBookings = bookings.length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const underReview = bookings.filter((b) => b.status === "under_review").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const registeredCustomers = new Set(bookings.map((b) => b.user_id).filter(Boolean)).size;
  const revenueApproved = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalSpots = avails.reduce((sum, a) => sum + Number(a.total_spots || 0), 0);
  const bookedSpots = avails.reduce((sum, a) => sum + Number(a.booked_spots || 0), 0);
  const occupancy = totalSpots > 0 ? Math.round((bookedSpots / totalSpots) * 100) : null;

  return {
    hasData: totalBookings > 0 || totalSpots > 0,
    totalBookings,
    pending,
    confirmed,
    underReview,
    cancelled,
    registeredCustomers,
    revenueApproved,
    totalSpots,
    bookedSpots,
    occupancy,
  };
}
