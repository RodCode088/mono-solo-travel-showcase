import { Link } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { PUBLIC_CONTACT, whatsappHref } from "../../../config/public-contact.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";
import { LEGAL_CONTENT } from "../legal-content.js";

export function LegalPage({ doc }) {
  const { language, t } = useLanguage();
  const locale = LEGAL_CONTENT[language] || LEGAL_CONTENT.es;
  const content = locale[doc] || null;

  useDocumentMeta({
    title: content?.title || t("Legal"),
    description: content?.summary,
    canonicalPath: content ? `/legal/${doc}` : "/legal",
  });

  if (!content) {
    return (
      <section className="ms-page">
        <StateBlock title={t("Documento no encontrado")} text={t("Revisa los enlaces legales en el pie de página.")} />
        <div className="mt-4 flex justify-center">
          <Link className="ms-button ms-button-primary" to="/">{t("Ir al inicio")}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-page">
      <header className="my-5 max-w-[820px]">
        <p className="ms-eyebrow">{locale.common.label}</p>
        <h1 className="m-0 font-serif text-[clamp(30px,5vw,56px)] leading-none text-ink">{content.title}</h1>
        <p className="text-muted">{content.summary}</p>
        <p className="m-0 text-sm font-bold text-muted">{locale.common.updated}</p>
      </header>

      <article className="grid max-w-[820px] gap-5">
        {content.sections.map((section) => <LegalSection key={section.heading} section={section} />)}
        <ContactBlock content={locale.common} />
      </article>

      <nav className="mt-7 flex flex-wrap gap-4 font-black text-green" aria-label="Legal">
        <Link to="/legal/terminos">{t("Terminos")}</Link>
        <Link to="/legal/privacidad">{t("Privacidad")}</Link>
        <Link to="/legal/cancelacion">{t("Cancelacion")}</Link>
        <Link to="/legal/exencion">{t("Exencion de Responsabilidad")}</Link>
      </nav>
    </section>
  );
}

function LegalSection({ section }) {
  return (
    <section className="ms-panel p-5 sm:p-6">
      <h2 className="m-0 mb-3 text-xl font-extrabold text-ink">{section.heading}</h2>
      <Paragraphs items={section.paragraphs} />
      {section.facts ? (
        <dl className="my-4 grid gap-3">
          {section.facts.map(([label, value]) => (
            <div key={label} className="grid gap-1 border-t border-line pt-3 sm:grid-cols-[220px_1fr] sm:gap-4">
              <dt className="font-extrabold text-ink">{label}</dt>
              <dd className="m-0 text-muted">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {section.bullets ? (
        <ul className="my-3 grid gap-2 pl-5 text-muted">
          {section.bullets.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      <Paragraphs items={section.paragraphsAfter} />
    </section>
  );
}

function Paragraphs({ items }) {
  if (!items?.length) return null;
  return items.map((item) => <p key={item} className="my-0 mb-3 text-muted last:mb-0">{item}</p>);
}

function ContactBlock({ content }) {
  return (
    <section className="ms-panel p-5 sm:p-6">
      <h2 className="m-0 mb-2 text-xl font-extrabold text-ink">{content.contactTitle}</h2>
      <p className="m-0 text-muted">{content.contactIntro}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a className="ms-button ms-button-secondary" href={`mailto:${PUBLIC_CONTACT.email}`}>{PUBLIC_CONTACT.email}</a>
        <a className="ms-button ms-button-secondary" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
          WhatsApp {PUBLIC_CONTACT.phoneDisplay}
        </a>
      </div>
    </section>
  );
}
