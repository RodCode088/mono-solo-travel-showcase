import {
  CalendarDays,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPinned,
  PieChart,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ConsoleTabs } from "../../../components/ui/ConsoleTabs.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

// Tab de admin B2B omitido a proposito (fase futura). Sidebar compartido por
// cada pantalla /admin/* a traves del layout del router.
const adminNav = [
  {
    group: "Operacion",
    items: [
      ["/admin/dashboard", "Dashboard", LayoutDashboard],
      ["/admin/reservas", "Reservas", Ticket],
      ["/admin/calendario", "Calendario", CalendarRange],
      ["/admin/pagos", "Pagos", CreditCard],
    ],
  },
  {
    group: "Catalogo",
    items: [
      ["/admin/experiencias", "Experiencias", MapPinned],
      ["/admin/disponibilidad", "Disponibilidad", CalendarDays],
    ],
  },
  {
    group: "Negocio",
    items: [
      ["/admin/clientes", "Clientes", Users],
      ["/admin/reportes", "Reportes", PieChart],
      ["/admin/configuracion", "Config", Settings],
    ],
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { email, signOut } = useAuth();
  const { t } = useLanguage();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <section className="ms-page ms-page-wide">
      <div className="ms-console" data-tone="admin">
        <aside className="ms-console-side">
          <div className="ms-console-identity">
            <span className="ms-console-avatar" data-tone="admin">
              <LayoutDashboard size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <strong>{t("Admin")}</strong>
              <small>{email || t("Operacion interna")}</small>
            </div>
          </div>

          <nav className="ms-console-nav">
            {adminNav.map((section) => (
              <div className="ms-console-group" key={section.group}>
                <p>{t(section.group)}</p>
                {section.items.map(([to, label, Icon]) => (
                  <NavLink key={to} end className={({ isActive }) => `ms-console-link${isActive ? " is-active" : ""}`} to={to}>
                    <Icon size={17} aria-hidden="true" />
                    <span>{t(label)}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <button className="ms-console-signout" type="button" onClick={handleSignOut}>
            <LogOut size={16} aria-hidden="true" />
            {t("Salir")}
          </button>
        </aside>

        <div className="ms-console-main">
          <Outlet />
        </div>
      </div>

      <ConsoleTabs items={adminNav.flatMap((section) => section.items)} onSignOut={handleSignOut} />
    </section>
  );
}
