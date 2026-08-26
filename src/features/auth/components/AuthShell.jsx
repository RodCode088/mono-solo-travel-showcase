import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import logoCircle from "../../../../assets/brand/nuevos-logos/logo-mark-cropped.png";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";

/**
 * Marco compartido de las pantallas de acceso (cliente y admin).
 *
 * Antes cada una repetia su propio grid y su propio panel de foto, con
 * medidas distintas. Aqui viven la columna visual y la tarjeta del formulario,
 * de modo que login, registro y backoffice se ven como la misma familia.
 */
export function AuthShell({
  eyebrow,
  title,
  lead,
  cover,
  coverTitle,
  coverText,
  perks = [],
  tone = "customer",
  children,
  footer = null,
}) {
  const { t } = useLanguage();

  return (
    <section className="ms-page">
      <div className="ms-auth" data-tone={tone}>
        <aside className="ms-auth-cover">
          {cover ? <img src={cover} alt="" loading="eager" decoding="async" /> : null}
          <span className="ms-auth-cover-scrim" aria-hidden="true" />
          <div className="ms-auth-cover-body">
            <Link className="ms-logo-mark" to="/" aria-label={t("Volver al inicio")} title={t("Volver al inicio")}>
              <img src={logoCircle} alt="" />
            </Link>
            <h2>{coverTitle}</h2>
            {coverText ? <p>{coverText}</p> : null}
            {perks.length ? (
              <ul className="ms-auth-perks">
                {perks.map((perk) => (
                  <li key={perk}>
                    <i aria-hidden="true"><Check size={13} /></i>
                    {perk}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>

        <div className="ms-auth-panel">
          <header className="ms-auth-head">
            <p className="ms-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            {lead ? <p className="ms-auth-lead">{lead}</p> : null}
          </header>
          {children}
          {footer}
        </div>
      </div>
    </section>
  );
}
