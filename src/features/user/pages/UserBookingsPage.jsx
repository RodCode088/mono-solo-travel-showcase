import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { money } from "../../../lib/services/format.js";
import { getMyBookings } from "../../../lib/services/db-service.js";
import { getMyReviewableBookings } from "../../../lib/services/reviews-service.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { PanelHead } from "./PanelHead.jsx";

export function UserBookingsPage() {
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
        title={t("Mis reservas")}
        lead={t("Historial de reservas asociadas a tu cuenta.")}
      />

      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo cargar")} text={error} /></div> : null}

      {rows === null ? (
        <section className="ms-panel mt-4 p-5">
          <ExperienceLoader compact message="Cargando tus reservas..." />
        </section>
      ) : (
        <div className="mt-4">
          <BookingList rows={rows} />
        </div>
      )}
    </>
  );
}

export function BookingList({ rows }) {
  const { t } = useLanguage();
  const [reviewableByCode, setReviewableByCode] = useState({});

  useEffect(() => {
    let active = true;
    getMyReviewableBookings().then(({ data }) => {
      if (!active) return;
      const map = {};
      for (const row of data || []) map[row.code] = row.experienceSlug || row.experienceId;
      setReviewableByCode(map);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!rows.length) {
    return (
      <section className="ms-panel p-5">
        <StateBlock
          title={t("Todavia no tienes reservas")}
          text={t("Cuando reserves una experiencia con la sesion iniciada, aparecera aqui.")}
        />
        <Link className="ms-button ms-button-primary mt-4 w-fit" to="/experiencias?reset=1">
          {t("Ver experiencias")}
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <article
          key={row.code}
          className="ms-booking-row"
        >
          <div className="flex items-center gap-3">
            {row.image ? (
              <img className="h-14 w-14 shrink-0 rounded-lg object-cover" src={row.image} alt="" loading="lazy" decoding="async" />
            ) : (
              <div className="h-14 w-14 shrink-0 rounded-lg bg-surface-2" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <strong className="block truncate text-ink">{row.experienceTitle}</strong>
              <small className="text-muted">{row.code}</small>
            </div>
          </div>
          <span className="text-sm">{row.date} {row.time || ""}</span>
          <span className="text-sm">{row.guests} pax</span>
          <span className="text-sm font-bold text-ink">{money(row.total)}</span>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={row.bookingStatus} />
            {row.publicToken ? (
              <Link className="ms-day-link" to={`/confirmacion?token=${encodeURIComponent(row.publicToken)}`}>
                {t("Ver")}
              </Link>
            ) : null}
            {reviewableByCode[row.code] ? (
              <Link className="ms-day-link" data-tone="gold" to={`/experiencias/${reviewableByCode[row.code]}#resenas`}>
                {t("Dejar reseña")}
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
