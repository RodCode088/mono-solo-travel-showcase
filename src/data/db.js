/* Mock database — Mono Solo Travel
   Será reemplazada por servicios de Supabase manteniendo la misma interfaz.
   No usar imports — este módulo es la base. */

import { img, monoCatalogGroups, monoCategories, monoDestinations, monoExperiences } from "./mono-experiences.js";
export { img };

export const db = {
  users: [
    { id: "u-001", name: "Amelia Rivera", email: "amelia@example.com", phone: "+507 6000 1020", role: "user", createdAt: "2026-01-11" },
    { id: "u-002", name: "Marco Torres", email: "marco@example.com", phone: "+507 6000 2030", role: "user", createdAt: "2026-02-18" },
    { id: "u-003", name: "Sofia Lee", email: "sofia@example.com", phone: "+507 6000 3040", role: "user", createdAt: "2026-03-04" },
    { id: "b2b-001", name: "Selina Boquete Desk", email: "frontdesk@selinaboquete.com", phone: "+507 7200 1000", role: "b2b", createdAt: "2025-11-09" },
    { id: "adm-001", name: "Monosolo Ops", email: "admin@monosolo.travel", phone: "+507 6000 0001", role: "admin", createdAt: "2025-09-01" },
  ],
  destinations: monoDestinations,
  categories: monoCategories,
  catalogGroups: monoCatalogGroups,
  b2bPartners: [
    { id: "p-001", companyName: "Selina Boquete", contactName: "Laura Gomez", email: "frontdesk@selinaboquete.com", phone: "+507 7200 1000", commissionRate: 0.16, status: "active", bookingsGenerated: 4, totalCommissions: 126 },
    { id: "p-002", companyName: "Nomad Bocas Hostel", contactName: "Diego Santos", email: "sales@nomadbocas.com", phone: "+507 7600 4444", commissionRate: 0.14, status: "active", bookingsGenerated: 3, totalCommissions: 84 },
    { id: "p-003", companyName: "PTY Boutique Travel", contactName: "Natalia Perez", email: "ops@ptyboutique.com", phone: "+507 6100 5555", commissionRate: 0.18, status: "review", bookingsGenerated: 1, totalCommissions: 36 },
  ],
  experiences: monoExperiences,
  availability: [],
  bookings: [],
  payments: [],
  reviews: [],
};

export function exp(id, slug, title, destination, category, basePrice, duration, meetingPoint, imageNames, rating, reviewCount, status, supplierId, minGuests, maxGuests) {
  return {
    id, slug, title, destination, category,
    shortDescription: `${title} en ${destination}, operado con cupos reales, anfitrion local y confirmacion operativa.`,
    fullDescription: `Una experiencia Monosolo disenada para venderse como producto turistico real: disponibilidad por fecha, cupos, reglas de cancelacion, punto de encuentro, inclusiones, requisitos y seguimiento por WhatsApp.`,
    images: imageNames.map(img),
    duration,
    meetingPoint,
    included: ["Anfitrion local", "Coordinacion por WhatsApp", "Briefing de seguridad", "Soporte operativo Monosolo"],
    notIncluded: ["Comidas no indicadas", "Gastos personales", "Seguro de viaje"],
    requirements: ["Llegar 15 minutos antes", "Documento de identidad", "Ropa comoda segun actividad"],
    cancellationPolicy: "Cancelacion gratis hasta 24 horas antes. No show no reembolsable. Cambios sujetos a cupo.",
    itinerary: ["Check-in y briefing", "Ruta principal con anfitrion", "Tiempo libre o parada fotografica", "Cierre y confirmacion de retorno"],
    basePrice, rating, reviewCount, status, supplierId, minGuests, maxGuests,
  };
}
