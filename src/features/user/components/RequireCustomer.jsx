import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

// Guard de UX para el area de cliente. La proteccion real de datos es RLS de
// Supabase + la RPC get_my_bookings (solo devuelve filas donde user_id = auth.uid()).
export function RequireCustomer() {
  const { status, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <section className="ms-page">
        <ExperienceLoader message="Verificando tu sesion..." />
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  }

  // El formulario publico /login no tiene selector de rol y siempre
  // autentica a traves de la misma sesion de Supabase; una cuenta admin que
  // inicie sesion ahi nunca debe terminar en el area de cliente en vez de /admin/dashboard.
  if (isAdmin) {
    return <Navigate replace to="/admin/dashboard" />;
  }

  return <Outlet />;
}
