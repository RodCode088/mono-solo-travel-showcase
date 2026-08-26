import { db } from "../data/db.js";

/**
 * Experiencias destacadas del catálogo (banner del inicio + primeras dos
 * tarjetas de "From Panama City").
 *
 * Fase 1 de "todo editable desde el panel" (024, 2026-08-24): el admin puede
 * marcar `experience.promoRank` (1 = principal, 2 = secundaria) desde
 * /admin/experiencias. Si ninguna experiencia tiene promoRank asignado
 * (Supabase sin migrar todavía, o modo mock), se usa el default histórico:
 * el walking tour "gratis" de Casco es la puerta de entrada del embudo -- es
 * el destino de los siete QR impresos en hostales
 * (docs/product/HOSTEL_QR_REFERRAL_PROPOSAL.md) -- y Caribbean Island Day
 * Escape va justo despues (pedido del owner, 2026-08-24).
 *
 * Se compara por id Y por slug a proposito: en staging y produccion el catalogo
 * se hidrata desde Supabase, y conviene que la promocion siga funcionando
 * aunque una de las dos claves cambie de forma.
 */
export const PROMOTED_EXPERIENCE_ID = "e-011";
export const PROMOTED_EXPERIENCE_SLUG = "free-casco-walking-tour-history-and-vibes-3-transport-fees";

export const SECONDARY_PROMOTED_EXPERIENCE_ID = "e-009";
export const SECONDARY_PROMOTED_EXPERIENCE_SLUG = "caribbean-island-day-escape";

// Chequea sobre TODO el catalogo cargado, no solo la fila en cuestion: si
// cualquier experiencia tiene promoRank, el admin ya tomo el control y los
// IDs fijos de abajo dejan de mirarse -- de lo contrario, una experiencia
// vieja sin promoRank (p.ej. el walking tour original) seguiria matcheando
// por ID aunque el admin haya elegido OTRA como principal.
function adminControlsPromotion() {
  return db.experiences.some((e) => e.promoRank === 1);
}

export function isPromotedExperience(experience) {
  if (!experience) return false;
  if (adminControlsPromotion()) return experience.promoRank === 1;
  return experience.id === PROMOTED_EXPERIENCE_ID
    || experience.legacyId === PROMOTED_EXPERIENCE_ID
    || experience.slug === PROMOTED_EXPERIENCE_SLUG;
}

export function isSecondaryPromotedExperience(experience) {
  if (!experience) return false;
  if (adminControlsPromotion()) return experience.promoRank === 2;
  return experience.id === SECONDARY_PROMOTED_EXPERIENCE_ID
    || experience.legacyId === SECONDARY_PROMOTED_EXPERIENCE_ID
    || experience.slug === SECONDARY_PROMOTED_EXPERIENCE_SLUG;
}

/** Devuelve la lista con la destacada principal primero y la secundaria justo despues. */
export function promotedFirst(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return rows;
  const copy = rows.slice();

  const promotedIndex = copy.findIndex(isPromotedExperience);
  const promoted = promotedIndex >= 0 ? copy.splice(promotedIndex, 1)[0] : null;

  const secondaryIndex = copy.findIndex(isSecondaryPromotedExperience);
  const secondary = secondaryIndex >= 0 ? copy.splice(secondaryIndex, 1)[0] : null;

  if (secondary) copy.unshift(secondary);
  if (promoted) copy.unshift(promoted);
  return copy;
}
