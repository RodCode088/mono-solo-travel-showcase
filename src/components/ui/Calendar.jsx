import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";

/* -------------------------------------------------------------------------
 * Utilidades de fecha
 *
 * Todo se maneja como texto ISO "YYYY-MM-DD" y objetos Date construidos en
 * hora local. Nunca se usa Date.parse sobre el ISO: en zonas al oeste de UTC
 * eso corre el dia una jornada hacia atras, que es el bug clasico de los
 * calendarios de reserva.
 * ---------------------------------------------------------------------- */

export function toISODate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISODate(iso) {
  if (!iso) return null;
  const [year, month, day] = String(iso).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function todayISO() {
  return toISODate(new Date());
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthLabel(date, language) {
  const label = new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function longDateLabel(iso, language) {
  const date = fromISODate(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

// Lunes primero: es la convencion de calendario en Panama.
function weekdayLabels(language) {
  const base = new Date(2024, 0, 1); // lunes
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + index);
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-ES", { weekday: "narrow" }).format(day);
  });
}

function buildGrid(month) {
  const first = startOfMonth(month);
  // getDay() da 0 = domingo; se reindexa para que 0 = lunes.
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return { date, iso: toISODate(date), outside: date.getMonth() !== month.getMonth() };
  });
}

/**
 * Rejilla de un mes.
 *
 * `dayMeta(iso)` puede devolver `{ disabled, spots, tone, title }` para pintar
 * los dias con cupo, el precio o un bloqueo. Es lo que permite reusar el mismo
 * componente en el buscador, en la reserva y en el panel de admin.
 */
export function MonthCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  min,
  max,
  dayMeta,
  footer = null,
  compact = false,
}) {
  const { language, t } = useLanguage();
  const cells = useMemo(() => buildGrid(month), [month]);
  const weekdays = useMemo(() => weekdayLabels(language), [language]);
  const today = todayISO();

  return (
    <div className={`ms-calendar ${compact ? "is-compact" : ""}`}>
      <div className="ms-calendar-head">
        <button
          type="button"
          aria-label={t("Mes anterior")}
          title={t("Mes anterior")}
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
        <strong aria-live="polite">{monthLabel(month, language)}</strong>
        <button
          type="button"
          aria-label={t("Mes siguiente")}
          title={t("Mes siguiente")}
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="ms-calendar-weekdays" aria-hidden="true">
        {weekdays.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="ms-calendar-grid" role="grid">
        {cells.map((cell) => {
          const meta = dayMeta?.(cell.iso) || {};
          const outOfRange = (min && cell.iso < min) || (max && cell.iso > max);
          const disabled = cell.outside || outOfRange || meta.disabled;
          const isSelected = selected === cell.iso;

          return (
            <button
              key={cell.iso}
              type="button"
              className="ms-calendar-day"
              data-outside={cell.outside || undefined}
              data-today={cell.iso === today || undefined}
              data-selected={isSelected || undefined}
              data-tone={meta.tone || undefined}
              disabled={disabled}
              aria-pressed={isSelected}
              title={meta.title || undefined}
              onClick={() => onSelect?.(cell.iso, meta)}
            >
              <span>{cell.date.getDate()}</span>
              {meta.spots != null ? <b>{meta.spots}</b> : null}
              {meta.dot ? <i data-dot={meta.dot} aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      {footer}
    </div>
  );
}
