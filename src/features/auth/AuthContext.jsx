import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { initConfig } from "../../lib/config/config-service.js";
import {
  getCurrentProfile,
  getSession,
  onAuthStateChange,
  signOut as authSignOut,
} from "../../lib/services/auth-service.js";
import { hydrateFavorites } from "../../lib/services/favorites-service.js";

const AuthContext = createContext(null);

// Fuente unica de verdad de "quien esta logueado" en toda la app (nav,
// guards, area de cliente). Funciona en modo Supabase y en modo mock.
export function AuthProvider({ children }) {
  const [snapshot, setSnapshot] = useState({ status: "loading", session: null, profile: null });

  const refresh = useCallback(async () => {
    // Asegura que la config de runtime (mock vs Supabase) este resuelta antes
    // de leer auth, si no la primera lectura corre contra el backend
    // equivocado y puede mostrar un rol viejo/mock en staging/produccion.
    await initConfig();
    const [{ data: session }, { data: profile }] = await Promise.all([getSession(), getCurrentProfile()]);
    setSnapshot({ status: "ready", session: session || null, profile: profile || null });
    // Mantiene state.favorites sincronizado con quien este logueado ahora
    // (solo modo Supabase — en modo mock el Set de favoritos se queda como
    // esta, controlado por rol en toggleFavorite de favorites-service.js).
    await hydrateFavorites();
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = null;
    refresh();
    // onAuthStateChange resuelve a la funcion de unsubscribe (es async en el
    // camino de Supabase), asi que espera la promesa antes de guardarla o llamarla.
    Promise.resolve(
      onAuthStateChange(() => {
        if (active) refresh();
      }),
    ).then((fn) => {
      if (!active) {
        if (typeof fn === "function") fn();
        return;
      }
      unsubscribe = fn;
    });
    return () => {
      active = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [refresh]);

  const role = snapshot.profile?.role || "visitor";
  const value = {
    status: snapshot.status,
    session: snapshot.session,
    profile: snapshot.profile,
    role,
    isAdmin: role === "admin",
    isCustomer: role === "customer",
    isAuthenticated: role === "customer" || role === "admin",
    email: snapshot.session?.user?.email || null,
    fullName: snapshot.profile?.full_name || "",
    refresh,
    async signOut() {
      await authSignOut();
      await refresh();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
