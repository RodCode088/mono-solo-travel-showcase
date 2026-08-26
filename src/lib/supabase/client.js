import { createClient } from "@supabase/supabase-js";
import { getConfig, isSupabaseEnabled } from "../config/config-service.js";

let client = null;

export function getSupabaseClient() {
  if (!isSupabaseEnabled()) return null;
  if (client) return client;

  const cfg = getConfig();
  client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Activado para que los links de confirmacion de email y recuperacion de
      // contrasena (que llevan el token en la URL) establezcan sesion al aterrizar.
      detectSessionInUrl: true,
    },
  });
  return client;
}

export function isSupabase() {
  return isSupabaseEnabled();
}

export function resetSupabaseClientForTests() {
  client = null;
}
