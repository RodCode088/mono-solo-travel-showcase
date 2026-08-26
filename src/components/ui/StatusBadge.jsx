import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";

const labels = {
  pending: "Pendiente",
  under_review: "En revision",
  approved: "Aprobado",
  rejected: "Rechazado",
  pending_payment: "Pago pendiente",
  no_payment: "Sin pago",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  active: "Activa",
  paused: "Pausada",
  draft: "Borrador",
  available: "Disponible",
  sold_out: "Agotado",
  blocked: "Bloqueado",
  review: "En revision",
};

function tone(value) {
  if (["approved", "confirmed", "completed", "active", "available"].includes(value)) return "bg-green/10 text-green";
  if (["rejected", "cancelled", "paused", "sold_out", "blocked"].includes(value)) return "bg-red/10 text-red";
  return "bg-warn/10 text-warn";
}

export function statusText(value) {
  return labels[value] || value;
}

export function StatusBadge({ value }) {
  const { t } = useLanguage();

  return (
    <span className={`inline-flex min-h-[26px] items-center justify-center rounded-full px-2.5 text-xs font-black ${tone(value)}`}>
      {t(statusText(value))}
    </span>
  );
}
