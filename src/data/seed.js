/* Datos operativos seed: availability, bookings, payments, reviews
   Se ejecuta una sola vez al arrancar la app. */

import { db } from "./db.js";

function pad(value) {
  return String(value).padStart(2, "0");
}

function relativeDate(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function relativeDateTime(offsetDays = 0, time = "10:00:00") {
  return `${relativeDate(offsetDays)}T${time}`;
}

export function findExperience(idOrSlug) {
  return db.experiences.find((x) => x.id === idOrSlug || x.slug === idOrSlug) || db.experiences[0];
}
export function findUser(id) {
  return db.users.find((x) => x.id === id) || db.users[0];
}

export function seedOperationalData() {
  db.availability.length = 0;
  db.bookings.length = 0;
  db.payments.length = 0;
  db.reviews.length = 0;

  const statuses = ["available", "available", "available", "sold_out", "blocked"];

  db.experiences.forEach((experience, i) => {
    for (let d = 1; d <= 5; d += 1) {
      const totalSpots = experience.maxGuests;
      const bookedSpots = (i + d) % totalSpots;
      const status = statuses[(i + d) % statuses.length];
      db.availability.push({
        id: `av-${experience.id}-${d}`,
        experienceId: experience.id,
        date: relativeDate(d + 6),
        startTime: d % 2 ? "08:00" : "14:00",
        endTime: d % 2 ? "13:00" : "18:00",
        totalSpots,
        bookedSpots: status === "blocked" ? 0 : bookedSpots,
        availableSpots: status === "sold_out" ? 0 : status === "blocked" ? 0 : Math.max(totalSpots - bookedSpots, 0),
        priceOverride: d === 4 ? experience.basePrice + 12 : null,
        status,
      });
    }
  });

  const rawBookings = [
    ["BK-1041", "u-001", "e-001", 0, "08:00", 2, "approved", "confirmed", "direct"],
    ["BK-1042", "u-002", "e-002", 1, "08:00", 3, "under_review", "pending_payment", "direct"],
    ["BK-1043", "u-003", "e-003", 2, "14:00", 1, "approved", "confirmed", "b2b"],
    ["BK-1044", "u-001", "e-004", 0, "14:00", 2, "pending", "pending_payment", "direct"],
    ["BK-1045", "u-002", "e-005", -2, "08:00", 4, "approved", "completed", "b2b"],
    ["BK-1046", "u-003", "e-006", -1, "14:00", 2, "rejected", "cancelled", "b2b"],
    ["BK-1047", "u-001", "e-009", 3, "08:00", 2, "approved", "confirmed", "direct"],
    ["BK-1048", "u-002", "e-010", 4, "08:00", 2, "under_review", "pending_payment", "b2b"],
    ["BK-1049", "u-003", "e-012", 5, "14:00", 2, "approved", "confirmed", "direct"],
    ["BK-1050", "u-001", "e-007", 0, "08:00", 2, "pending", "pending_payment", "b2b"],
  ];

  rawBookings.forEach(([bookingCode, userId, experienceId, dateOffset, time, guests, paymentStatus, bookingStatus, channel], i) => {
    const experience = findExperience(experienceId);
    const date = relativeDate(dateOffset);
    const subtotal = guests * experience.basePrice;
    const taxes = Math.round(subtotal * 0.07);
    const total = subtotal + taxes;
    const booking = {
      id: `b-${i + 1}`,
      bookingCode, userId, experienceId, date, time, guests,
      customerName: findUser(userId).name,
      customerEmail: findUser(userId).email,
      customerPhone: findUser(userId).phone,
      subtotal, taxes, total,
      paymentMethod: "cuantoapp",
      paymentStatus, bookingStatus, channel,
      partnerId: channel === "b2b" ? db.b2bPartners[i % db.b2bPartners.length].id : null,
      createdAt: relativeDateTime(-10 + i, "10:00:00"),
    };
    db.bookings.push(booking);
    if (i < 8) {
      db.payments.push({
        id: `pay-${i + 1}`,
        bookingId: booking.id,
        method: "cuantoapp",
        amount: total,
        referenceNumber: paymentStatus === "pending" ? "" : `CUANTO-${7000 + i}`,
        proofImage: paymentStatus === "pending" ? "" : "proof-uploaded.jpg",
        status: paymentStatus === "approved" ? "approved" : paymentStatus,
        verifiedBy: paymentStatus === "approved" ? "adm-001" : null,
        verifiedAt: paymentStatus === "approved" ? relativeDateTime(-2, "09:00:00") : null,
      });
    }
  });

  // Las reviews quedan vacias hasta que exista la fase de reviews persistidas/moderadas.
}
