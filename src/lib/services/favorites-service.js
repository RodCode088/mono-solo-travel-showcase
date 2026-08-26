import { db } from "../../data/db.js";
import { saveFavorites, state } from "./state.js";
import { isSupabase, getSupabaseClient } from "../supabase/client.js";

const ok = (data) => ({ data, error: null });
const fail = (err) => {
  console.error("[favorites-service]", err);
  return { data: null, error: { code: err?.code || "UNKNOWN", message: err?.message || "No se pudieron actualizar tus favoritos." } };
};

function isMockSignedIn() {
  return state.role === "customer" || state.role === "admin";
}

function findLocalExperience(id) {
  return db.experiences.find((e) => e.id === id || e.supabaseId === id) || null;
}

// Carga los favoritos del usuario logueado a state.favorites. Se llama
// despues de que AuthContext resuelve session/profile para que funcione
// igual en los dos modos: mock deja el Set local del navegador tal cual (no
// hay fuente remota con la cual sincronizar); en modo Supabase se reemplaza
// con las filas del servidor para ese usuario.
export async function hydrateFavorites() {
  if (!isSupabase()) return ok(false);

  try {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      state.favorites = new Set();
      return ok(true);
    }

    const { data, error } = await client.from("favorites").select("experience_id");
    if (error) throw error;

    const ids = new Set();
    for (const row of data || []) {
      const local = db.experiences.find((e) => e.supabaseId === row.experience_id);
      ids.add(local ? local.id : row.experience_id);
    }
    state.favorites = ids;
    return ok(true);
  } catch (err) {
    return fail(err);
  }
}

export async function toggleFavorite(experienceId) {
  const isFavorite = state.favorites.has(experienceId);

  if (!isSupabase()) {
    if (!isMockSignedIn()) return fail({ code: "NOT_AUTHENTICATED", message: "Inicia sesion para guardar favoritos." });
    if (isFavorite) state.favorites.delete(experienceId);
    else state.favorites.add(experienceId);
    saveFavorites();
    return ok({ favorite: !isFavorite });
  }

  try {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return fail({ code: "NOT_AUTHENTICATED", message: "Inicia sesion para guardar favoritos." });

    const experience = findLocalExperience(experienceId);
    const expUuid = experience?.supabaseId || experienceId;

    if (isFavorite) {
      const { error } = await client
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("experience_id", expUuid);
      if (error) throw error;
      state.favorites.delete(experienceId);
    } else {
      const { error } = await client
        .from("favorites")
        .insert({ user_id: userId, experience_id: expUuid });
      if (error) throw error;
      state.favorites.add(experienceId);
    }
    return ok({ favorite: !isFavorite });
  } catch (err) {
    return fail(err);
  }
}
