import { CalendarRange, Compass } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { longDateLabel } from "../../../components/ui/Calendar.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { getMyBookings } from "../../../lib/services/db-service.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { PanelHead } from "./PanelHead.jsx";
import { BookingList } from "./UserBookingsPage.jsx";

export function UserDashboardPage() {
  const { fullName } = useAuth();
  const { language, t } = useLanguage();
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

  const metrics = useMemo(() => buildMetrics(rows || []), [rows]);
  const nextTrip = metrics.next;

  return (
    <>
      <PanelHead
        eyebrow={t("Area de cliente")}
        title={`${t("Hola")}${fullName ? `, ${fullName.split(" ")[0]}` : ""}`}
        lead={t("Resumen de tu actividad en Mono Solo Travel.")}
        actions={
          <Link className="ms-button ms-button-primary" to="/experiencias?reset=1">
            <Compass size={16} aria-hidden="true" />
            {t("Explorar experiencias")}
          </Link>
        }
      />

      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo cargar")} text={error} /></div> : null}

      {nextTrip ? (
        <section className="ms-next-trip mt-4">
          {nextTrip.image ? <img src={nextTrip.image} alt="" loading="lazy" decoding="async" /> : null}
          <div>
            <p className="ms-eyebrow">{t("Tu proxima salida")}</p>
            <h2>{nextTrip.experienceTitle}</h2>
            <p>
              {longDateLabel(nextTrip.date, language)}
              {nextTrip.time ? ` · ${nextTrip.time}` : ""} · {nextTrip.guests} {t("pax")}
            </p>
          </div>
          <Link className="ms-button ms-button-accent" to="/usuario/calendario">
            <CalendarRange size={16} aria-hidden="true" />
            {t("Ver calendario")}
          </Link>
        </section>
      ) : null}

      <section className="ms-metric-row mt-4">
        <Metric label={t("Reservas")} value={rows === null ? "-" : metrics.total} />
        <Metric label={t("Confirmadas")} value={rows === null ? "-" : metrics.confirmed} />
        <Metric label={t("En revision")} value={rows === null ? "-" : metrics.underReview} />
        <Metric label={t("Proxima fecha")} value={rows === null ? "-" : (metrics.next ? longDateLabel(metrics.next.date, language) : "-")} />
      </section>

      <section className="mt-6">
        <div className="ms-section-bar">
          <h2>{t("Reservas recientes")}</h2>
          <Link className="ms-home-text-link" to="/usuario/reservas">{t("Ver todas")}</Link>
        </div>
        <div className="mt-3">
          {rows === null ? (
            <section className="ms-panel p-5"><ExperienceLoader compact message="Cargando tus reservas..." /></section>
          ) : (
            <BookingList rows={rows.slice(0, 3)} />
          )}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <article className="ms-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function buildMetrics(rows) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = rows
    .filter((row) => row.date && row.date >= today && row.bookingStatus !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    total: rows.length,
    confirmed: rows.filter((row) => row.bookingStatus === "confirmed").length,
    underReview: rows.filter((row) => row.bookingStatus === "under_review").length,
    nextDate: upcoming[0]?.date || "-",
    next: upcoming[0] || null,
  };
}
