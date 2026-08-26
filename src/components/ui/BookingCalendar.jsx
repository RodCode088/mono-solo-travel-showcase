import { CalendarRange, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { MonthCalendar, longDateLabel, startOfMonth, todayISO } from "./Calendar.jsx";

// Un dia cancelado no deberia pintarse igual que uno confirmado: el punto de
// color es lo primero que mira quien opera el calendario.
function toneForRows(rows) {
  if (rows.some((row) => row.bookingStatus === "confirmed")) return "open";
  if (rows.every((row) => row.bookingStatus === "cancelled")) return "off";
  return "low";
}

/**
 * Calendario mensual de reservas, compartido por el panel de cliente y el de
 * admin. Marca los dias con actividad, cuenta las salidas y muestra el detalle
 * del dia elegido al lado.
 */
export function BookingCalendar({ rows, emptyTitle, emptyText, renderRow }) {
  const { language, t } = useLanguage();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [activeDate, setActiveDate] = useState(null);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const row of rows || []) {
      if (!row.date) continue;
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date).push(row);
    }
    return map;
  }, [rows]);

  // Sin dia elegido se muestra el siguiente con actividad, que casi siempre es
  // lo que se quiere ver al entrar.
  const upcoming = useMemo(() => {
    const today = todayISO();
    return [...byDate.keys()].filter((date) => date >= today).sort()[0] || null;
  }, [byDate]);

  const selected = activeDate || upcoming;
  const dayRows = selected ? byDate.get(selected) || [] : [];

  function dayMeta(iso) {
    const rowsForDay = byDate.get(iso);
    if (!rowsForDay?.length) return {};
    return {
      spots: rowsForDay.length,
      tone: toneForRows(rowsForDay),
      title: `${rowsForDay.length} ${t("salidas")}`,
    };
  }

  return (
    <div className="ms-booking-calendar">
      <div className="ms-panel ms-booking-calendar-month">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={(iso) => setActiveDate(iso)}
          dayMeta={dayMeta}
        />
        <p className="ms-calendar-legend">
          <i data-tone="open" aria-hidden="true" /> {t("Con confirmadas")}
          <i data-tone="low" aria-hidden="true" /> {t("Por confirmar")}
        </p>
      </div>

      <div className="ms-panel ms-booking-calendar-day">
        <header>
          <CalendarRange size={17} aria-hidden="true" />
          <div>
            <strong>{selected ? longDateLabel(selected, language) : t("Sin fecha seleccionada")}</strong>
            <small>
              {dayRows.length
                ? `${dayRows.length} ${dayRows.length === 1 ? t("salida") : t("salidas")}`
                : t("Elige un dia marcado en el calendario")}
            </small>
          </div>
        </header>

        {dayRows.length ? (
          <ul className="ms-day-list">
            {dayRows.map((row) => (
              <li key={row.code || row.id}>
                {renderRow ? renderRow(row) : <DefaultDayRow row={row} />}
              </li>
            ))}
          </ul>
        ) : (
          <div className="ms-day-empty">
            <strong>{emptyTitle || t("Nada agendado")}</strong>
            <p>{emptyText || t("Los dias con actividad aparecen resaltados en el calendario.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultDayRow({ row }) {
  const { t } = useLanguage();
  return (
    <article className="ms-day-row">
      <div className="min-w-0">
        <strong>{row.experienceTitle}</strong>
        <small>
          {row.time ? `${row.time} · ` : ""}
          {row.code}
        </small>
      </div>
      <span className="ms-day-guests">
        <Users size={13} aria-hidden="true" />
        {row.guests} {t("pax")}
      </span>
      <StatusBadge value={row.bookingStatus} />
    </article>
  );
}
