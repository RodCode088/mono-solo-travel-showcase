/* Mono Solo Travel — plantilla de configuración en tiempo de ejecución.
 *
 * NO contiene datos reales. Es el fallback por defecto (modo `mock`).
 *
 * Para activar Supabase staging:
 *   1. Copia este archivo a `runtime-config.local.js` (ese archivo está IGNORADO por Git).
 *   2. Completa `supabaseUrl` y `supabaseAnonKey` con los valores del proyecto STAGING.
 *   3. Cambia `mode` a "staging".
 *
 * Reglas de seguridad:
 *   - SOLO la `anon` public key va aquí. La seguridad real depende de RLS.
 *   - NUNCA pongas la `service_role` key. NUNCA la uses en el navegador.
 *   - No subas `runtime-config.local.js` al repositorio.
 *
 * `mode`: "mock" | "staging" | "production"
 */

export const runtimeConfig = {
  mode: "mock",
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export default runtimeConfig;
