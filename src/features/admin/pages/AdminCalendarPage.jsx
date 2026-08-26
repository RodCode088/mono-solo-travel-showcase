import { RefreshCw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BookingCalendar } from "../../../components/ui/BookingCalendar.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { listAdminBookings } from "../admin-service.js";
import { PanelHead } from "../../user/pages/PanelHead.jsx";

export function AdminCalendarPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    const { data, error: loadError } = await listAdminBookings();
    if (loadError) {
      setError(loadError.message);
      setRows([]);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => buildSummary(rows || []), [rows]);

  return (
    <>
      <PanelHead
        eyebrow={t("Operacion")}
        title={t("Calendario")}
        lead={t("Todas las salidas reservadas en un mes. Toca un dia para ver quien va y en que estado esta.")}
        actions={
          <button className="ms-button ms-button-secondary" type="button" onClick={load}>
            <RefreshCw size={16} aria-hidden="true" />
            {t("Actualizar")}
          </button>
        }
      />

      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo cargar")} text={error} /></div> : null}

      <section className="ms-metric-row mt-4">
        <Metric label={t("Dias con salida")} value={rows === null ? "-" : summary.days} />
        <Metric label={t("Salidas")} value={rows === null ? "-" : summary.total} />
        <Metric label={t("Viajeros")} value={rows === null ? "-" : summary.guests} />
        <Metric label={t("Por confirmar")} value={rows === null ? "-" : summary.pending} tone={summary.pending > 0 ? "warn" : undefined} />
      </section>

      <div className="mt-4">
        {rows === null ? (
          <section className="ms-panel p-5"><ExperienceLoader compact message="Cargando calendario..." /></section>
        ) : (
          <BookingCalendar
            rows={rows}
            emptyTitle={t("Nada agendado ese dia")}
            emptyText={t("Los dias con reservas aparecen resaltados en el calendario.")}
            renderRow={(row) => (
              <article className="ms-day-row">
                <div className="min-w-0">
                  <strong>{row.experienceTitle}</strong>
                  <small>
                    {row.time ? `${row.time} · ` : ""}
                    {row.contactName || row.contactEmail || row.code}
                  </small>
                </div>
                <span className="ms-day-guests">
                  <Users size={13} aria-hidden="true" />
                  {row.guests} {t("pax")}
                </span>
                <StatusBadge value={row.bookingStatus} />
              </article>
            )}
          />
        )}
      </div>
    </>
  );
}

function Metric({ label, value, tone }) {
  return (
    <article className="ms-metric" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function buildSummary(rows) {
  const active = rows.filter((row) => row.bookingStatus !== "cancelled");
  return {
    days: new Set(active.map((row) => row.date).filter(Boolean)).size,
    total: active.length,
    guests: active.reduce((sum, row) => sum + Number(row.guests || 0), 0),
    pending: rows.filter((row) => row.bookingStatus === "pending" || row.bookingStatus === "under_review").length,
  };
}
