import { db, exp } from "../../data/db.js";
import { state } from "./state.js";
import { findExperience } from "./queries.js";
import { slugify } from "./format.js";

function fallbackDate(offsetDays = 7) {
  const d = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function buildDraft(experience, availability, guests, data = {}) {
  const price = availability?.priceOverride || experience.basePrice;
  const subtotal = price * guests;
  const taxes = 0;

  return {
    experienceId: experience.id,
    availabilityId: availability?.id,
    date: availability?.date || fallbackDate(),
    time: availability?.startTime || "08:00",
    guests,
    customerName: data.customerName || "",
    customerEmail: data.customerEmail || "",
    customerPhone: data.customerPhone || "",
    subtotal,
    taxes,
    total: subtotal,
  };
}

export function confirmBooking(id) {
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) return { data: null, error: { code: "BOOKING_NOT_FOUND", message: "Reserva no encontrada." } };
  booking.bookingStatus = "confirmed";
  return { data: booking, error: null };
}

export function toggleExperience(id) {
  const experience = findExperience(id);
  experience.status = experience.status === "active" ? "paused" : "active";
  return { data: experience, error: null };
}

export function createDraftExperience(data) {
  const next = exp(
    `e-${Date.now()}`,
    slugify(data.title),
    data.title,
    data.destination,
    data.category,
    Number(data.basePrice),
    4,
    "Por definir",
    ["beach-girls.jpg", "city-group.jpg"],
    0,
    0,
    "draft",
    null,
    1,
    10,
  );
  next.shortDescription = data.shortDescription;
  db.experiences.unshift(next);
  return { data: next, error: null };
}

export function createB2BBooking(data) {
  const experience = findExperience(data.experienceId);
  const availability = db.availability.find((item) => item.experienceId === experience.id && item.status === "available");
  const guests = Number(data.guests || experience.minGuests || 1);
  const draft = buildDraft(experience, availability, guests, {
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone || "",
  });
  const booking = {
    id: `b-${Date.now()}`,
    bookingCode: `BK-${1100 + db.bookings.length}`,
    userId: state.currentUserId,
    experienceId: experience.id,
    date: draft.date,
    time: draft.time,
    guests,
    customerName: draft.customerName,
    customerEmail: draft.customerEmail,
    customerPhone: draft.customerPhone,
    subtotal: draft.subtotal,
    taxes: draft.taxes,
    total: draft.total,
    paymentMethod: "manual",
    paymentStatus: "no_payment",
    bookingStatus: "pending",
    channel: "b2b",
    partnerId: db.b2bPartners[0]?.id || null,
    createdAt: new Date().toISOString(),
  };
  db.bookings.unshift(booking);
  db.payments.unshift({
    id: `pay-${Date.now()}`,
    bookingId: booking.id,
    method: "manual",
    amount: booking.total,
    referenceNumber: "",
    proofImage: "",
    status: "no_payment",
    verifiedBy: null,
    verifiedAt: null,
  });
  return { data: booking, error: null };
}
