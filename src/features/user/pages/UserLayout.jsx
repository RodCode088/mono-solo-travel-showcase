import { CalendarRange, Heart, LayoutDashboard, LogOut, Ticket, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ConsoleTabs } from "../../../components/ui/ConsoleTabs.jsx";
import { MonkeyAvatarIcon } from "../../../components/ui/MonkeyAvatarIcon.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

const userNav = [
  ["/usuario/dashboard", "Resumen", LayoutDashboard],
  ["/usuario/reservas", "Mis reservas", Ticket],
  ["/usuario/calendario", "Calendario", CalendarRange],
  ["/usuario/favoritos", "Favoritos", Heart],
  ["/usuario/perfil", "Perfil", UserRound],
];

export function UserLayout() {
  const navigate = useNavigate();
  const { fullName, email, profile, signOut } = useAuth();
  const { t } = useLanguage();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <section className="ms-page ms-page-wide">
      <div className="ms-console">
        <aside className="ms-console-side">
          <div className="ms-console-identity">
            <span className="ms-console-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <MonkeyAvatarIcon className="h-7 w-7" />
              )}
            </span>
            <div className="min-w-0">
              <strong>{fullName || t("Mi cuenta")}</strong>
              {email ? <small>{email}</small> : null}
            </div>
          </div>

          <nav className="ms-console-nav">
            {userNav.map(([to, label, Icon]) => (
              <NavLink key={to} end className={({ isActive }) => `ms-console-link${isActive ? " is-active" : ""}`} to={to}>
                <Icon size={17} aria-hidden="true" />
                <span>{t(label)}</span>
              </NavLink>
            ))}
          </nav>

          <button className="ms-console-signout" type="button" onClick={handleSignOut}>
            <LogOut size={16} aria-hidden="true" />
            {t("Cerrar sesion")}
          </button>
        </aside>

        <div className="ms-console-main">
          <Outlet />
        </div>
      </div>

      <ConsoleTabs items={userNav} onSignOut={handleSignOut} />
    </section>
  );
}
