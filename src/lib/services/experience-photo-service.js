import { getSupabaseClient, isSupabase } from "../supabase/client.js";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "experience-photos";

const ok = (data) => ({ data, error: null });
const fail = (err) => {
  console.error("[experience-photo-service]", err);
  return { data: null, error: { code: err?.code || "UNKNOWN", message: err?.message || "No se pudo subir la foto." } };
};

function sanitizeFileName(name) {
  return (name || "foto").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
}

/**
 * Sube una foto al bucket "experience-photos" (migracion 025) y la agrega al
 * final de experiences.images. currentImages es el array vigente (viene del
 * formulario) para no pisar fotos subidas en otra pestaña justo antes.
 */
export async function uploadExperiencePhoto(experienceId, file, currentImages) {
  if (!isSupabase()) {
    return fail({ code: "MOCK_MODE", message: "Subir fotos requiere estar conectado a Supabase." });
  }
  if (!file || !file.type || !file.type.startsWith("image/")) {
    return fail({ code: "INVALID_FILE_TYPE", message: "Selecciona un archivo de imagen." });
  }
  if (file.size > MAX_BYTES) {
    return fail({ code: "FILE_TOO_LARGE", message: "La imagen debe pesar menos de 5 MB." });
  }

  try {
    const client = getSupabaseClient();
    const path = `${experienceId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage.from(BUCKET).getPublicUrl(path);
    const nextImages = [...(currentImages || []), publicUrlData.publicUrl];

    const { error: updateError } = await client
      .from("experiences")
      .update({ images: nextImages })
      .eq("id", experienceId);
    if (updateError) throw updateError;

    return ok({ images: nextImages });
  } catch (err) {
    return fail(err);
  }
}

/** Quita una foto de experiences.images y borra el objeto del bucket (best-effort). */
export async function removeExperiencePhoto(experienceId, url, currentImages) {
  if (!isSupabase()) {
    return fail({ code: "MOCK_MODE", message: "Requiere estar conectado a Supabase." });
  }

  try {
    const client = getSupabaseClient();
    const nextImages = (currentImages || []).filter((u) => u !== url);

    const { error: updateError } = await client
      .from("experiences")
      .update({ images: nextImages })
      .eq("id", experienceId);
    if (updateError) throw updateError;

    const marker = `/object/public/${BUCKET}/`;
    const markerIndex = url.indexOf(marker);
    if (markerIndex >= 0) {
      const path = url.slice(markerIndex + marker.length);
      await client.storage.from(BUCKET).remove([path]);
    }

    return ok({ images: nextImages });
  } catch (err) {
    return fail(err);
  }
}
