/* Mono Solo Travel — genera src/config/runtime-config.local.js desde variables de entorno.
 *
 * Pensado para CI o para generar la config local sin editar a mano. El archivo
 * generado está IGNORADO por Git (nunca se commitea).
 *
 * Uso (PowerShell):
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"; `
 *   $env:SUPABASE_ANON_KEY="eyJhbGci..."; `
 *   $env:MS_MODE="staging"; `
 *   node scripts/config/generate-runtime-config.js
 *
 * Uso (bash):
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... MS_MODE=staging node scripts/config/generate-runtime-config.js
 *
 * Variables:
 *   SUPABASE_URL        URL del proyecto Supabase (staging).
 *   SUPABASE_ANON_KEY   anon public key (NUNCA service_role).
 *   MS_MODE             mock | staging | production (default: staging si hay creds, si no mock).
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "src", "config", "runtime-config.local.js");

const url = (process.env.SUPABASE_URL || "").trim();
const anon = (process.env.SUPABASE_ANON_KEY || "").trim();
const mode = (process.env.MS_MODE || (url && anon ? "staging" : "mock")).trim();

if ((anon || "").includes("service_role")) {
  console.error("✗ Detección de service_role en SUPABASE_ANON_KEY. Abortado: nunca uses service_role en el frontend.");
  process.exit(1);
}

if (mode !== "mock" && !(url && anon)) {
  console.error(`✗ Modo "${mode}" requiere SUPABASE_URL y SUPABASE_ANON_KEY.`);
  process.exit(1);
}

const content = `/* GENERADO por scripts/config/generate-runtime-config.js — NO COMMITEAR.
 * Este archivo está ignorado por Git (.gitignore). Contiene solo la anon key.
 */

export const runtimeConfig = {
  mode: ${JSON.stringify(mode)},
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anon)},
};

export default runtimeConfig;
`;

await fs.writeFile(OUT, content, "utf8");
console.log(`✓ Generado ${path.relative(ROOT, OUT)} (modo: ${mode}). Recuerda: este archivo NO se commitea.`);
