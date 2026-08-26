import { useState } from "react";
import { Instagram, LogIn, Menu as MenuIcon, ShieldCheck, X, Youtube } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import logoCircle from "../../../assets/brand/nuevos-logos/logo-mark-cropped.png";
import { PUBLIC_CONTACT, whatsappHref } from "../../config/public-contact.js";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import { TravelerAssistant } from "../../features/catalog/components/TravelerAssistant.jsx";
import { VLOG_WATCH_URL } from "../../features/catalog/pages/VlogPage.jsx";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";
import { AmbientScenery } from "./AmbientScenery.jsx";
import { MonkeyAvatarIcon } from "./MonkeyAvatarIcon.jsx";

// Entradas publicas que ve todo el mundo. B2B esta desvinculado a proposito
// (fase futura): la ruta y el codigo mock de la pagina se quedan en el repo;
// solo se quita la entrada del nav.
const publicNav = [
  ["/", "Inicio"],
  ["/experiencias?reset=1", "Experiencias"],
  ["/destinos", "Destinos"],
  ["/vlog", "Vlog"],
  ["/conocenos", "Conocenos"],
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/monosolotravel/", icon: "instagram" },
  { label: "YouTube", href: VLOG_WATCH_URL, icon: "youtube" },
];

export function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { status, fullName, isAdmin, isCustomer, profile } = useAuth();
  const { language, languages, setLanguage, t } = useLanguage();
  // Con sesion iniciada la cabecera muestra un avatar, no el nombre ni la
  // palabra "Admin": el circulo ya comunica "tienes cuenta", no se corta en
  // movil y deja sitio a la marca. El nombre sigue accesible como title.
  const roleAction = isAdmin
    ? { to: "/admin/dashboard", title: "Admin" }
    : isCustomer
      ? { to: "/usuario/dashboard", title: fullName || "Usuario" }
      : null;
  const loginAction = status === "ready" && !roleAction
    ? { to: "/login", label: "Ingresar", title: "Ingresar" }
    : null;
  const accountAction = roleAction || loginAction;

  function handleBrandClick(event) {
    if (pathname === "/") event.preventDefault();
    window.scrollTo({ top: 0, behavior: pathname === "/" ? "smooth" : "auto" });
  }

  return (
    <>
      <AmbientScenery />

      <header className="ms-header sticky top-0 z-50 flex items-center justify-between gap-5 px-4 md:px-10">
        <div className="flex min-w-0 items-center gap-2.5">
          <NavLink
            className="flex min-w-0 items-center gap-2.5 font-extrabold"
            to="/"
            aria-label={t("Volver al inicio")}
            title={t("Volver al inicio")}
            onClick={handleBrandClick}
          >
            <span className="ms-logo-mark">
              <img src={logoCircle} alt="Mono Solo Travel" />
            </span>
            <strong className="ms-brand-name truncate">Mono Solo Travel</strong>
          </NavLink>
          <div className="hidden items-center gap-1 sm:flex">
            {socialLinks.map((item) => (
              <BrandSocialLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <nav className="hidden gap-7 lg:flex">
          {publicNav.map(([to, label]) => (
            <NavItem key={to} to={to}>{t(label)}</NavItem>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="ms-lang-switch flex items-center gap-1 rounded-full border border-line p-1" aria-label={t("Traducir página")}>
            {languages.map((item) => (
              <button
                key={item.code}
                className={`rounded-full px-2.5 py-1.5 text-xs font-black ${language === item.code ? "bg-ink text-gold" : "text-muted hover:text-green"}`}
                type="button"
                aria-pressed={language === item.code}
                title={item.name}
                onClick={() => setLanguage(item.code)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {loginAction ? (
            <div className="ms-account-entry">
              <NavLink
                className="ms-button ms-button-primary ms-login-button"
                aria-label={t(loginAction.title)}
                title={t(loginAction.title)}
                to={loginAction.to}
              >
                <LogIn size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{t(loginAction.label)}</span>
              </NavLink>
            </div>
          ) : null}
          {roleAction ? (
            <NavLink
              className="ms-account-avatar"
              aria-label={t(roleAction.title)}
              title={t(roleAction.title)}
              to={roleAction.to}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : isAdmin ? (
                <ShieldCheck size={19} aria-hidden="true" />
              ) : (
                <MonkeyAvatarIcon className="h-6 w-6" />
              )}
            </NavLink>
          ) : null}
          <button className="ms-menu-toggle grid h-10 w-10 place-items-center rounded-full lg:hidden" type="button" aria-label={t("Menu")} title={t("Menu")} onClick={() => setMenuOpen(true)}>
            <MenuIcon size={21} />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <aside className="ms-mobile-menu fixed left-3 right-3 top-[80px] z-[70] grid max-h-[calc(100svh-96px)] gap-1 overflow-auto rounded-[18px] border p-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3 border-b px-1 pb-2">
            <strong>{t("Menu")}</strong>
            <button className="grid h-10 w-10 place-items-center rounded-full text-ink" type="button" aria-label={t("Cerrar")} title={t("Cerrar")} onClick={() => setMenuOpen(false)}><X size={20} /></button>
          </div>
          {publicNav.map(([to, label]) => (
            <NavLink key={to} className="rounded-xl p-3 font-bold" to={to} onClick={() => setMenuOpen(false)}>
              {t(label)}
            </NavLink>
          ))}
          {accountAction ? (
            <NavLink className="ms-button ms-button-primary mt-2" title={t(accountAction.title)} to={accountAction.to} onClick={() => setMenuOpen(false)}>
              {loginAction ? <LogIn className="mr-2" size={18} aria-hidden="true" /> : null}
              {t(accountAction.title)}
            </NavLink>
          ) : null}
        </aside>
      ) : null}

      <main className="ms-app-main">{children}</main>

      <TravelerAssistant />

      <footer className="ms-footer">
        <div className="ms-footer-inner">
          <div className="ms-footer-brand">
            <div className="flex items-center gap-3">
              <span className="ms-logo-mark ms-logo-mark-sm">
                <img src={logoCircle} alt="" />
              </span>
              <strong>Mono Solo Travel</strong>
            </div>
            <p>{t("Catalogo real de experiencias, rutas y actividades curadas en Panama.")}</p>
            <div className="ms-footer-socials">
              {socialLinks.map((item) => (
                <a key={item.href} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} title={item.label}>
                  {item.icon === "instagram" ? <Instagram size={17} /> : <Youtube size={18} />}
                </a>
              ))}
            </div>
          </div>

          <nav className="ms-footer-col">
            <h3>{t("Explorar")}</h3>
            <NavLink to="/">{t("Inicio")}</NavLink>
            <NavLink to="/experiencias?reset=1">{t("Catalogo")}</NavLink>
            <NavLink to="/destinos">{t("Destinos")}</NavLink>
            <NavLink to="/vlog">{t("Vlog")}</NavLink>
            <NavLink to="/conocenos">{t("Conocenos")}</NavLink>
          </nav>

          <nav className="ms-footer-col">
            <h3>{t("Legal")}</h3>
            <NavLink to="/legal/terminos">{t("Terminos")}</NavLink>
            <NavLink to="/legal/privacidad">{t("Privacidad")}</NavLink>
            <NavLink to="/legal/cancelacion">{t("Cancelacion")}</NavLink>
            <NavLink to="/legal/exencion">{t("Exencion de Responsabilidad")}</NavLink>
          </nav>

          <div className="ms-footer-col">
            <h3>{t("Contacto")}</h3>
            <a href={`mailto:${PUBLIC_CONTACT.email}`}>{PUBLIC_CONTACT.email}</a>
            <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
              WhatsApp {PUBLIC_CONTACT.phoneDisplay}
            </a>
          </div>
        </div>

        <div className="ms-footer-base">
          <span>Mono Solo Travel · Panama</span>
          <span>
            {t("Desarrollado por")}{" "}
            <a href="https://www.dtechl.com/" target="_blank" rel="noreferrer">
              DtechLab
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}

function BrandSocialLink({ href, label, icon }) {
  return (
    <a
      className="ms-social-link grid h-8 w-8 place-items-center rounded-full border border-line text-green hover:border-green hover:text-ink"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
    >
      {icon === "instagram" ? <Instagram size={17} /> : <Youtube size={18} />}
    </a>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink className={({ isActive }) => `ms-nav-link${isActive ? " is-active" : ""}`} to={to}>
      {children}
    </NavLink>
  );
}
