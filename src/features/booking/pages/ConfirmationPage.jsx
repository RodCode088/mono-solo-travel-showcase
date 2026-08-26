import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { whatsappHref } from "../../../config/public-contact.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";
import { getPublicBookingConfirmation } from "../booking-service.js";

export function ConfirmationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || params.get("code");
  const { t } = useLanguage();
  useDocumentMeta({ title: t("Confirmacion de reserva"), noindex: true });
  const [state, setState] = useState({ status: token ? "loading" : "empty", row: null, error: null });

  useEffect(() => {
    if (!token) return;
    let active = true;
    getPublicBookingConfirmation(token).then(({ data, error }) => {
      if (!active) return;
      if (error) setState({ status: "error", row: null, error });
      else setState({ status: data ? "ready" : "empty", row: data, error: null });
    });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="ms-page">
      <div className="grid min-h-[620px] items-center gap-6 md:grid-cols-[420px_1fr]">
        {state.status === "loading" ? <ExperienceLoader message="Cargando tu reserva..." /> : null}
        {state.status === "error" ? <StateBlock tone="error" title={t("No pudimos cargar tu reserva")} text={state.error?.message || t("Intenta refrescar la pagina.")} /> : null}
        {state.status === "empty" ? <StateBlock title={t("Confirmacion no encontrada")} text={t("Inicia una nueva reserva desde el catalogo.")} /> : null}
        {state.status === "ready" ? <Voucher data={state.row} /> : null}
        <div>
          <h1 className="font-serif text-5xl text-ink">{t("Confirmacion")}</h1>
          <p className="mt-3 text-muted">{t("Tu reserva quedo confirmada al instante. Te contactamos para coordinar el pago y los detalles.")}</p>
          {state.status === "ready" ? <ShareBox data={state.row} /> : null}
          <Link className="ms-button ms-button-primary mt-5" to="/experiencias">{t("Explorar mas experiencias")}</Link>
        </div>
      </div>
    </section>
  );
}

function ShareBox({ data }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const message =
    `Reserva Mono Solo Travel ${data.code}\n` +
    `${data.experienceTitle}\n` +
    `${t("Fecha")}: ${data.date} ${data.startTime || ""}\n` +
    `${t("Personas")}: ${data.guests} - ${t("Total")}: ${data.currency || "USD"} ${data.total}\n` +
    `${t("Confirmacion")}: ${url}`;
  const contactHref = whatsappHref(message);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-line bg-surface-2 p-4">
      <strong className="block text-ink">{t("Comparte tu confirmacion")}</strong>
      <p className="mt-1 text-sm text-muted">{t("Guarda o envia este comprobante por WhatsApp. El enlace es valido y persistente.")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className="ms-button ms-button-secondary" href={contactHref} target="_blank" rel="noopener noreferrer">
          {t("Enviar por WhatsApp")}
        </a>
        <button className="ms-button ms-button-secondary" type="button" onClick={copyLink}>
          {copied ? t("Enlace copiado") : t("Copiar enlace")}
        </button>
      </div>
    </div>
  );
}

function Voucher({ data }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-ms">
      <p className="ms-eyebrow">{t("Voucher / ticket")}</p>
      <h2 className="text-5xl font-black text-ink">{data.code}</h2>
      <p className="mt-2 text-muted">{data.experienceTitle}</p>
      <dl className="mt-5 grid gap-3">
        <Row label={t("Fecha")}>{data.date} {data.startTime || ""}</Row>
        <Row label={t("Personas")}>{data.guests}</Row>
        <Row label={t("Total")}>{data.currency || "USD"} {data.total}</Row>
        <Row label={t("Pago")}><StatusBadge value={data.paymentStatus || "no_payment"} /></Row>
        <Row label={t("Reserva")}><StatusBadge value={data.bookingStatus} /></Row>
        {data.referenceMasked ? <Row label={t("Referencia")}>{data.referenceMasked}</Row> : null}
      </dl>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-t border-line pt-2">
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 font-black text-ink">{children}</dd>
    </div>
  );
}
