import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookingCalendar } from "../../../components/ui/BookingCalendar.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { getMyBookings } from "../../../lib/services/db-service.js";
import { PanelHead } from "./PanelHead.jsx";

export function UserCalendarPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getMyBookings().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) {
        setError(loadError.message);
        setRows([]);
        return;
      }
      setRows(data || []);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PanelHead
        eyebrow={t("Area de cliente")}
        title={t("Calendario")}
        lead={t("Tus salidas mes a mes. Toca un dia marcado para ver el detalle.")}
      />

      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo cargar")} text={error} /></div> : null}

      <div className="mt-4">
        {rows === null ? (
          <section className="ms-panel p-5"><ExperienceLoader compact message="Cargando tu calendario..." /></section>
        ) : (
          <BookingCalendar
            rows={rows}
            emptyTitle={t("Nada agendado ese dia")}
            emptyText={t("Los dias con una salida reservada aparecen resaltados en el calendario.")}
            renderRow={(row) => (
              <article className="ms-day-row">
                {row.image ? <img src={row.image} alt="" loading="lazy" decoding="async" /> : null}
                <div className="min-w-0">
                  <strong>{row.experienceTitle}</strong>
                  <small>{row.time ? `${row.time} · ` : ""}{row.guests} {t("pax")} · {row.code}</small>
                </div>
                <StatusBadge value={row.bookingStatus} />
                {row.publicToken ? (
                  <Link className="ms-day-link" to={`/confirmacion?token=${encodeURIComponent(row.publicToken)}`}>
                    {t("Ver")}
                  </Link>
                ) : null}
              </article>
            )}
          />
        )}
      </div>
    </>
  );
}
