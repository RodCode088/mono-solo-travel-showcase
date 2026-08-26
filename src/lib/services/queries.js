import { db } from "../../data/db.js";
import { state } from "./state.js";
import { promotedFirst } from "../../config/catalog-promo.js";

export function findExperience(idOrSlug) {
  return db.experiences.find((x) => x.id === idOrSlug || x.slug === idOrSlug) || db.experiences[0];
}

export function findUser(id) {
  return db.users.find((x) => x.id === id) || db.users[0];
}

export function findDestination(slugOrName) {
  return db.destinations.find((x) => x.slug === slugOrName || x.name === slugOrName) || null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isUpcoming(row) {
  return !row.date || row.date >= todayIso();
}

export function spotsFor(experienceId) {
  return db.availability
    .filter((x) => x.experienceId === experienceId && x.status === "available" && isUpcoming(x))
    .reduce((sum, x) => sum + x.availableSpots, 0);
}

export function activeAvailability(experienceId) {
  return db.availability.filter((x) => x.experienceId === experienceId && x.status !== "blocked" && isUpcoming(x));
}

function matchesCatalogGroup(experience, filters) {
  const destinationOk = filters.destination === "all";
  const categoryOk = filters.category === "all";
  if (destinationOk && categoryOk) return true;

  const groups = experience.catalogGroups?.length
    ? experience.catalogGroups
    : [{ destination: experience.destination, category: experience.category }];

  return groups.some((group) => {
    const groupDestinationOk = destinationOk || group.destination === filters.destination;
    const groupCategoryOk = categoryOk || group.category === filters.category;
    return groupDestinationOk && groupCategoryOk;
  });
}

export function getFilteredExperiences(filters = state.filters) {
  const f = filters;
  const rows = db.experiences.filter((x) => {
    const groupText = (x.catalogGroups || []).map((group) => `${group.destination} ${group.category}`).join(" ");
    const text = `${x.title} ${x.destination} ${x.category} ${groupText} ${x.shortDescription}`.toLowerCase();
    const priceOk = f.price === "all"
      || (f.price === "0-60" && x.basePrice <= 60)
      || (f.price === "61-120" && x.basePrice > 60 && x.basePrice <= 120)
      || (f.price === "121+" && x.basePrice > 120);
    const durationOk = f.duration === "all"
      || (f.duration === "short" && x.duration <= 4)
      || (f.duration === "day" && x.duration > 4 && x.duration <= 12)
      || (f.duration === "multi" && x.duration > 12);
    const ratingOk = f.rating === "all" || (Number(x.rating) || 0) >= Number(f.rating);
    const availabilityOk = f.availability === "all" || activeAvailability(x.id).some((a) => a.status === f.availability);

    return (!f.q || text.includes(f.q.toLowerCase()))
      && matchesCatalogGroup(x, f)
      && priceOk
      && durationOk
      && ratingOk
      && availabilityOk;
  });

  rows.sort((a, b) => {
    if (f.sort === "price") return a.basePrice - b.basePrice;
    if (f.sort === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (f.sort === "duration") return a.duration - b.duration;
    return ((Number(b.rating) || 0) * (Number(b.reviewCount) || 0))
      - ((Number(a.rating) || 0) * (Number(a.reviewCount) || 0));
  });

  // Solo en el orden por defecto: si el visitante pidio precio, valoracion o
  // duracion, su eleccion manda por encima de la promocion.
  if (!f.sort || f.sort === "recommended") return promotedFirst(rows);

  return rows;
}
