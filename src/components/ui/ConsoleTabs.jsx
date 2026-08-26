import { LogOut, MoreHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";

const PRIMARY_TABS = 4;

/**
 * Barra de pestanas inferior de los paneles en movil.
 *
 * En pantalla estrecha la barra lateral oscura se comia el tercio superior y
 * dejaba la navegacion en un carrusel horizontal donde solo se veian tres de
 * los cinco (o nueve) destinos. Aqui la navegacion baja al pulgar, como en una
 * app: cuatro destinos fijos y un boton "Mas" que abre una hoja con el resto y
 * con el cierre de sesion, para que ninguna entrada quede inalcanzable.
 *
 * Solo existe en movil (el CSS la oculta a partir de 1080px, donde vuelve la
 * barra lateral). El asistente flotante no aparece en /usuario ni en /admin,
 * asi que nada compite por esa esquina.
 */
export function ConsoleTabs({ items, onSignOut }) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Siempre cuatro destinos y "Mas": la barra mantiene el mismo ritmo en los
  // dos paneles, y el cierre de sesion vive siempre dentro de la hoja.
  const primary = items.slice(0, PRIMARY_TABS);
  const rest = items.slice(PRIMARY_TABS);

  // Al cambiar de pantalla la hoja se cierra sola: si no, queda abierta encima
  // del destino recien elegido.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const restIsActive = rest.some(([to]) => pathname === to);

  return (
    <>
      {sheetOpen ? (
        <>
          <div className="ms-tabsheet-veil" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div className="ms-tabsheet" role="dialog" aria-label={t("Mas")}>
            <header>
              <strong>{t("Mas")}</strong>
              <button type="button" aria-label={t("Cerrar")} onClick={() => setSheetOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="ms-tabsheet-list">
              {rest.map(([to, label, Icon]) => (
                <NavLink key={to} end to={to} className={({ isActive }) => (isActive ? "is-active" : "")}>
                  <Icon size={17} aria-hidden="true" />
                  {t(label)}
                </NavLink>
              ))}
              <button type="button" className="ms-tabsheet-signout" onClick={onSignOut}>
                <LogOut size={17} aria-hidden="true" />
                {t("Cerrar sesion")}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <nav className="ms-tabbar" aria-label={t("Panel")}>
        {primary.map(([to, label, Icon]) => (
          <NavLink key={to} end to={to} className={({ isActive }) => `ms-tab${isActive ? " is-active" : ""}`}>
            <Icon size={19} aria-hidden="true" />
            <span>{t(label)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`ms-tab${sheetOpen || restIsActive ? " is-active" : ""}`}
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((open) => !open)}
        >
          <MoreHorizontal size={19} aria-hidden="true" />
          <span>{t("Mas")}</span>
        </button>
      </nav>
    </>
  );
}
