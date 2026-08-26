import { isSupabase, getSupabaseClient } from "../supabase/client.js";
import { setMockRole, state } from "./state.js";

let cachedProfile = null;

// Forma de fallback en modo mock, igual al propio fallback de
// getCurrentProfile() (`cachedProfile || { role: state.role, mock: true }`).
// Las funciones de update en mock deben mergear sobre ESTO, no sobre un
// `cachedProfile || {}` pelado -- cachedProfile solo vive en memoria y
// vuelve a null en cada reload de pagina, asi que mergear sobre `{}` despues
// de un reload borra `role` por completo y pone isAuthenticated en false en
// el siguientisimo refresh de auth (sign-out silencioso).
function mockProfileBase() {
  return { id: state.currentUserId, role: state.role, mock: true };
}

const ok = (data) => ({ data, error: null });
const fail = (code, message) => {
  console.error("[auth-service]", code, message || "");
  return { data: null, error: { code, message: message || code } };
};

// Mapea errores crudos de Supabase Auth a copy corto en espanol para los flujos de cliente.
function friendlyAuthMessage(error, fallback) {
  const raw = (error?.message || "").toLowerCase();
  if (raw.includes("already registered") || raw.includes("already been registered") || raw.includes("user already")) {
    return "Ese correo ya tiene una cuenta. Inicia sesion.";
  }
  if (raw.includes("email not confirmed")) return "Confirma tu correo antes de iniciar sesion.";
  if (raw.includes("weak") || (raw.includes("password") && raw.includes("least"))) {
    return "La contrasena debe tener al menos 6 caracteres.";
  }
  if (raw.includes("invalid login") || raw.includes("invalid credentials")) {
    return "Email o contrasena incorrectos.";
  }
  return fallback || "No se pudo completar la operacion. Intenta de nuevo.";
}

export async function signInAdmin(email, password) {
  if (!isSupabase()) {
    setMockRole("admin");
    return ok({ role: "admin", mode: "mock" });
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return fail("INVALID_CREDENTIALS", "Email o contrasena incorrectos.");

    const userId = data?.user?.id;
    const { data: profile, error: pErr } = await client
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .eq("id", userId)
      .single();

    if (pErr || !profile) {
      await client.auth.signOut();
      return fail("NO_PROFILE", "Tu usuario no tiene perfil asignado.");
    }

    if (profile.role !== "admin") {
      await client.auth.signOut();
      return fail("NOT_ADMIN", "Esta cuenta no tiene acceso administrativo.");
    }

    cachedProfile = profile;
    return ok({ role: "admin", mode: "supabase" });
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function signOut() {
  cachedProfile = null;
  if (!isSupabase()) {
    setMockRole("visitor");
    return ok(true);
  }

  try {
    const client = getSupabaseClient();
    await client.auth.signOut();
    return ok(true);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

// Borra la cuenta del cliente que tiene sesion. El SDK del navegador no
// puede borrar auth.users por si solo -- delega en la Edge Function
// delete-account, que corre con la service_role key en el servidor y solo
// borra la cuenta de quien llama (nunca recibe un id por parametro). Cierra
// la sesion local despues, haya o no ido bien el borrado en el servidor.
export async function deleteOwnAccount() {
  if (!isSupabase()) {
    cachedProfile = null;
    setMockRole("visitor");
    return ok(true);
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.functions.invoke("delete-account");
    if (error) return fail("DELETE_ACCOUNT_FAILED", "No se pudo eliminar la cuenta. Intenta de nuevo.");

    cachedProfile = null;
    await client.auth.signOut();
    return ok(true);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function getSession() {
  if (!isSupabase()) return ok({ role: state.role, mock: true });

  try {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    return ok(data?.session || null);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function getCurrentProfile() {
  if (!isSupabase()) return ok(cachedProfile || { role: state.role, mock: true });
  if (cachedProfile) return ok(cachedProfile);

  try {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return ok(null);

    const { data: profile, error } = await client
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .eq("id", userId)
      .single();
    if (error) return ok(null);

    cachedProfile = profile;
    return ok(profile);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function isAdmin() {
  if (!isSupabase()) return state.role === "admin";
  const { data: profile } = await getCurrentProfile();
  return Boolean(profile && profile.role === "admin");
}

// -----------------------------------------------------------------------------
// Auth publica de cliente (role = 'customer'). Nunca expone seleccion de rol:
// el rol se setea server-side por el trigger handle_new_user (migracion 005).
// -----------------------------------------------------------------------------

export async function signUpCustomer({ email, password, fullName, phone }) {
  if (!isSupabase()) {
    setMockRole("customer");
    cachedProfile = { id: state.currentUserId, full_name: fullName || "Cliente demo", role: "customer" };
    return ok({ needsConfirmation: false, session: true, profile: cachedProfile });
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: (fullName || "").trim(), phone: (phone || "").trim() } },
    });
    if (error) return fail("SIGNUP_FAILED", friendlyAuthMessage(error, "No se pudo crear la cuenta."));

    cachedProfile = null;
    const hasSession = Boolean(data?.session);
    // Con confirmacion de email ON y sin sesion activa, el cliente debe
    // confirmar por email antes del primer login.
    return ok({ needsConfirmation: !hasSession, session: hasSession });
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function signInCustomer(email, password) {
  if (!isSupabase()) {
    setMockRole("customer");
    cachedProfile = { id: state.currentUserId, full_name: "Cliente demo", role: "customer" };
    return ok({ role: "customer", mode: "mock", profile: cachedProfile });
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return fail("INVALID_CREDENTIALS", friendlyAuthMessage(error, "Email o contrasena incorrectos."));

    const userId = data?.user?.id;
    const { data: profile } = await client
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .eq("id", userId)
      .single();

    cachedProfile = profile || null;
    return ok({ role: profile?.role || "customer", mode: "supabase", profile: cachedProfile });
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function requestPasswordReset(email) {
  if (!isSupabase()) return ok(true);

  try {
    const client = getSupabaseClient();
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/usuario/nueva-clave` : undefined;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return fail("RESET_FAILED", "No se pudo enviar el correo de recuperacion.");
    return ok(true);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function updatePassword(newPassword) {
  if (!isSupabase()) return ok(true);

  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) return fail("UPDATE_FAILED", friendlyAuthMessage(error, "No se pudo actualizar la contrasena."));
    cachedProfile = null;
    return ok(true);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

// Actualiza el propio perfil del cliente autenticado (solo full_name). El rol
// se sigue enforzando server-side; RLS previene la auto-promocion a admin.
export async function updateOwnProfile({ fullName }) {
  if (!isSupabase()) {
    cachedProfile = { ...mockProfileBase(), ...(cachedProfile || {}), full_name: fullName };
    return ok(cachedProfile);
  }

  try {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return fail("NO_SESSION", "Tu sesion expiro. Inicia sesion de nuevo.");

    const { data, error } = await client
      .from("profiles")
      .update({ full_name: (fullName || "").trim() || null })
      .eq("id", userId)
      .select("id, full_name, role, avatar_url")
      .single();
    if (error) return fail("UPDATE_FAILED", "No se pudo actualizar el perfil.");

    cachedProfile = data;
    return ok(data);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

// Actualiza el propio avatar_url del cliente autenticado. Misma forma/patron
// que updateOwnProfile, se mantiene separada para que avatar-service.js la
// pueda llamar despues de un upload sin tener que reenviar tambien full_name.
export async function updateOwnAvatar(avatarUrl) {
  if (!isSupabase()) {
    cachedProfile = { ...mockProfileBase(), ...(cachedProfile || {}), avatar_url: avatarUrl };
    return ok(cachedProfile);
  }

  try {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) return fail("NO_SESSION", "Tu sesion expiro. Inicia sesion de nuevo.");

    const { data, error } = await client
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)
      .select("id, full_name, role, avatar_url")
      .single();
    if (error) return fail("UPDATE_FAILED", "No se pudo actualizar la foto de perfil.");

    cachedProfile = data;
    return ok(data);
  } catch (err) {
    return fail("AUTH_ERROR", err?.message);
  }
}

export async function onAuthStateChange(callback) {
  if (!isSupabase()) return () => {};

  try {
    const client = getSupabaseClient();
    const { data } = client.auth.onAuthStateChange((event) => {
      cachedProfile = null;
      callback(event);
    });
    return () => data?.subscription?.unsubscribe?.();
  } catch {
    return () => {};
  }
}
