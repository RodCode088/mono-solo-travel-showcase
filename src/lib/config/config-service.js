import { runtimeConfig as exampleConfig } from "../../config/runtime-config.example.js";

const VALID_MODES = ["mock", "staging", "production"];
const LOCAL_CONFIG_MODULE = "/src/config/runtime-config.local.js";

let cached = null;
let initPromise = null;

function envConfig() {
  const env = import.meta.env || {};
  const supabaseUrl = env.SUPABASE_URL || "";
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || "";
  const mode = env.MS_MODE || (supabaseUrl && supabaseAnonKey ? "staging" : "");

  if (!mode && !supabaseUrl && !supabaseAnonKey) return null;

  return {
    mode: mode || "mock",
    supabaseUrl,
    supabaseAnonKey,
    _source: "env",
  };
}

function isLocalHost() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "";
}

async function resolveRaw() {
  if (typeof window !== "undefined" && window.__MS_RUNTIME_CONFIG__) {
    return { ...window.__MS_RUNTIME_CONFIG__, _source: "window" };
  }

  try {
    const mod = await import(/* @vite-ignore */ LOCAL_CONFIG_MODULE);
    const local = mod.runtimeConfig || mod.default;
    if (local) return { ...local, _source: "local" };
  } catch {
    // runtime-config.local.js es opcional y esta ignorado a proposito por Git.
  }

  const fromEnv = envConfig();
  if (fromEnv) return fromEnv;

  return { ...exampleConfig, _source: "example" };
}

function normalize(raw) {
  const mode = VALID_MODES.includes(raw.mode) ? raw.mode : "mock";
  const supabaseUrl = (raw.supabaseUrl || "").trim();
  const supabaseAnonKey = (raw.supabaseAnonKey || "").trim();
  const wantsSupabase = mode === "staging" || mode === "production";
  const hasCreds = Boolean(supabaseUrl && supabaseAnonKey);
  const isRemoteExampleConfig = raw._source === "example" && !isLocalHost();
  const isRemoteMockMode = mode === "mock" && !isLocalHost();

  let configError = null;
  if (isRemoteExampleConfig) {
    configError =
      "Configuracion invalida: un despliegue remoto requiere configuracion runtime explicita. " +
      "No se usara fallback mock fuera de local.";
  } else if (isRemoteMockMode) {
    configError =
      "Configuracion invalida: modo mock acepta cualquier credencial como admin y no debe " +
      "correr fuera de local. Configura MS_MODE=staging o production con credenciales de Supabase.";
  } else if (wantsSupabase && !hasCreds) {
    configError =
      `Configuracion invalida: modo "${mode}" requiere supabaseUrl y supabaseAnonKey. ` +
      "No se usara fallback mock en este modo.";
  }

  return {
    mode,
    source: raw._source || "unknown",
    supabaseUrl,
    supabaseAnonKey,
    supabaseEnabled: !configError && wantsSupabase && hasCreds,
    configError,
  };
}

export async function initConfig() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    cached = normalize(await resolveRaw());
    if (cached.configError) {
      console.error("[config-service]", cached.configError);
    } else {
      console.info(`[config-service] modo: ${cached.mode} (fuente: ${cached.source})`);
    }
    return cached;
  })();
  return initPromise;
}

export function isConfigReady() {
  return cached !== null;
}

export function getConfig() {
  if (cached) return cached;
  const fromEnv = envConfig();
  return normalize(fromEnv || { ...exampleConfig, _source: "example" });
}

export function getMode() {
  return getConfig().mode;
}

export function isSupabaseEnabled() {
  return getConfig().supabaseEnabled;
}

export function hasConfigError() {
  return Boolean(getConfig().configError);
}
