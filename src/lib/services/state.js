export const DEFAULT_FILTERS = {
  q: "",
  destination: "all",
  category: "all",
  price: "all",
  duration: "all",
  rating: "all",
  availability: "all",
  sort: "recommended",
};

export const storageKeys = {
  role: "ms.role",
  user: "ms.user",
  draftBooking: "ms.draftBooking",
  favorites: "ms.favorites.platform",
  referral: "ms.referral",
};

// Captura de referido QR de hostel (docs/product/HOSTEL_QR_REFERRAL_PROPOSAL.md,
// Fase A). localStorage (no sessionStorage, a diferencia de draftBooking)
// porque tiene que sobrevivir el viaje /login -> /registro -> vuelta-a-booking,
// que puede abarcar una pestana cerrada. Expira a los 30 dias para que una
// reserva hecha meses despues por alguien que ya no esta en ese hostel no
// quede mal atribuida.
const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function browserStorage(kind) {
  if (typeof window === "undefined") return null;
  return kind === "session" ? window.sessionStorage : window.localStorage;
}

function readJson(storage, key, fallback) {
  if (!storage) return fallback;
  try {
    return JSON.parse(storage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export const state = {
  role: browserStorage("local")?.getItem(storageKeys.role) || "visitor",
  currentUserId: browserStorage("local")?.getItem(storageKeys.user) || "u-001",
  filters: { ...DEFAULT_FILTERS },
  draftBooking: readJson(browserStorage("session"), storageKeys.draftBooking, null),
  favorites: new Set(readJson(browserStorage("local"), storageKeys.favorites, [])),
};

export function resetFilters() {
  state.filters = { ...DEFAULT_FILTERS };
}

export function saveFavorites() {
  const storage = browserStorage("local");
  if (storage) storage.setItem(storageKeys.favorites, JSON.stringify([...state.favorites]));
}

export function readDraftBooking() {
  state.draftBooking = readJson(browserStorage("session"), storageKeys.draftBooking, null);
  return state.draftBooking;
}

export function saveDraftBooking(draft) {
  state.draftBooking = draft;
  const storage = browserStorage("session");
  if (storage) storage.setItem(storageKeys.draftBooking, JSON.stringify(draft));
}

export function clearDraftBooking() {
  state.draftBooking = null;
  const storage = browserStorage("session");
  if (storage) storage.removeItem(storageKeys.draftBooking);
}

// Captura ?ref=CODE de cualquier URL de entrada (se llama una vez por
// navegacion desde RootLayout, que envuelve cada ruta). Gana el ultimo
// toque si aparece un ref nuevo mientras uno anterior sigue guardado --
// modelo mas simple, y refleja correctamente cual hostel realmente origino
// la visita que llevo a la reserva.
export function captureReferralFromSearch(search) {
  const code = new URLSearchParams(search).get("ref");
  if (!code?.trim()) return;
  const storage = browserStorage("local");
  if (!storage) return;
  storage.setItem(storageKeys.referral, JSON.stringify({ code: code.trim(), capturedAt: new Date().toISOString() }));
}

export function readReferral() {
  const storage = browserStorage("local");
  const stored = readJson(storage, storageKeys.referral, null);
  if (!stored?.code || !stored?.capturedAt) return null;
  const age = Date.now() - new Date(stored.capturedAt).getTime();
  if (!Number.isFinite(age) || age > REFERRAL_TTL_MS) {
    storage?.removeItem(storageKeys.referral);
    return null;
  }
  return stored.code;
}

export function clearReferral() {
  const storage = browserStorage("local");
  if (storage) storage.removeItem(storageKeys.referral);
}

export function setMockRole(role) {
  state.role = role;
  const storage = browserStorage("local");
  if (storage) storage.setItem(storageKeys.role, role);
}

export function guardRole(role) {
  if (state.role !== role) setMockRole(role);
}
