import { isSupabase, getSupabaseClient } from "../supabase/client.js";
import { updateOwnAvatar } from "./auth-service.js";

const MAX_BYTES = 3 * 1024 * 1024;

const ok = (data) => ({ data, error: null });
const fail = (err) => {
  console.error("[avatar-service]", err);
  return { data: null, error: { code: err?.code || "UNKNOWN", message: err?.message || "No se pudo subir la foto." } };
};

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("FILE_READ_ERROR"));
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatar(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    return fail({ code: "INVALID_FILE_TYPE", message: "Selecciona un archivo de imagen." });
  }
  if (file.size > MAX_BYTES) {
    return fail({ code: "FILE_TOO_LARGE", message: "La imagen debe pesar menos de 3 MB." });
  }

  if (!isSupabase()) {
    try {
      const dataUrl = await readAsDataUrl(file);
      const { error } = await updateOwnAvatar(dataUrl);
      if (error) throw error;
      return ok({ avatarUrl: dataUrl });
    } catch (err) {
      return fail(err);
    }
  }

  try {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return fail({ code: "NO_SESSION", message: "Tu sesion expiro. Inicia sesion de nuevo." });

    // Path fijo (sin extension): los re-uploads sobrescriben limpio via
    // upsert, sin objetos huerfanos por cambiar de formato de imagen. El
    // content-type real va en el header HTTP del objeto, no en la URL, asi
    // que <img> sigue renderizando bien aunque el path no tenga extension.
    const path = `${userId}/avatar`;
    const { error: uploadError } = await client.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = client.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await updateOwnAvatar(avatarUrl);
    if (profileError) throw profileError;

    return ok({ avatarUrl });
  } catch (err) {
    return fail(err);
  }
}
