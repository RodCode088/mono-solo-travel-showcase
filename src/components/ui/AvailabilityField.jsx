import { CalendarDays, Clock, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";
import { money } from "../../lib/services/format.js";
import { MonthCalendar, fromISODate, longDateLabel, startOfMonth, todayISO } from "./Calendar.jsx";
import { usePopover } from "./use-popover.js";

/**
 * Selector de salida: calendario flotante que solo deja elegir los dias que
 * tienen cupo real, con los cupos pintados en cada casilla y las horas del dia
 * como fichas debajo.
 *
 * Sustituye al `<select>` donde cada opcion era la cadena
 * "fecha / hora / cupos", que era ilegible y no dejaba ver de un vistazo que
 * dias hay abiertos. Mantiene un input oculto con el `name` original para que
 * los formularios que leen FormData no cambien.
 */
export function AvailabilityField({ name, availability, value, onChange, basePrice, id }) {
  const { language, t } = useLanguage();
  const { open, setOpen, placement, anchorRef, panelRef } = usePopover();

  const byDate = useMemo(() => {
    const map = new Map();
    for (const item of availability) {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date).push(item);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));
    }
    return map;
  }, [availability]);

  const selected = availability.find((item) => item.id === value) || null;
  const [activeDate, setActiveDate] = useState(selected?.date || availability[0]?.date || "");
  const [month, setMonth] = useState(() => startOfMonth(fromISODate(selected?.date || availability[0]?.date) || new Date()));

  useEffect(() => {
    if (!open) return;
    const date = selected?.date || availability[0]?.date || "";
    setActiveDate(date);
    setMonth(startOfMonth(fromISODate(date) || new Date()));
  }, [open, selected?.date, availability]);

  const dayRows = byDate.get(activeDate) || [];
  const firstDate = availability.reduce((min, item) => (!min || item.date < min ? item.date : min), "");
  const lastDate = availability.reduce((max, item) => (!max || item.date > max ? item.date : max), "");

  function dayMeta(iso) {
    const rows = byDate.get(iso);
    if (!rows?.length) return { disabled: true };
    const spots = rows.reduce((sum, row) => sum + Number(row.availableSpots || 0), 0);
    return {
      spots,
      tone: spots <= 3 ? "low" : "open",
      title: `${spots} ${t("cupos")}`,
    };
  }

  function pickDate(iso) {
    setActiveDate(iso);
    const rows = byDate.get(iso) || [];
    // Con una sola salida en el dia no tiene sentido pedir un segundo clic.
    if (rows.length === 1) {
      onChange?.(rows[0].id);
      setOpen(false);
      return;
    }
    const stillValid = rows.some((row) => row.id === value);
    if (!stillValid && rows[0]) onChange?.(rows[0].id);
  }

  return (
    <span className="ms-field-shell" ref={anchorRef}>
      <input type="hidden" name={name} value={value || ""} />
      <button
        className="ms-field-trigger ms-field-trigger-lg"
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-filled={selected ? "" : undefined}
        onClick={() => setOpen((state) => !state)}
      >
        <CalendarDays size={18} aria-hidden="true" />
        {selected ? (
          <span className="ms-field-value">
            <strong>{longDateLabel(selected.date, language)}</strong>
            <small>
              {selected.startTime ? `${selected.startTime} · ` : ""}
              {selected.availableSpots} {t("cupos")}
            </small>
          </span>
        ) : (
          <span>{t("Elegir fecha")}</span>
        )}
      </button>

      {open ? (
        <div
          className="ms-popover ms-popover-calendar"
          data-placement={placement}
          ref={panelRef}
          role="dialog"
          aria-label={t("Fechas disponibles")}
        >
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={activeDate}
            onSelect={pickDate}
            min={firstDate || todayISO()}
            max={lastDate || undefined}
            dayMeta={dayMeta}
          />

          {dayRows.length ? (
            <div className="ms-slot-list">
              <p className="ms-slot-title">
                <Clock size={14} aria-hidden="true" />
                {longDateLabel(activeDate, language)}
              </p>
              <div className="ms-slot-grid">
                {dayRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="ms-slot"
                    data-selected={row.id === value || undefined}
                    onClick={() => { onChange?.(row.id); setOpen(false); }}
                  >
                    <strong>{row.startTime || t("Horario por confirmar")}</strong>
                    <small>
                      <Users size={12} aria-hidden="true" />
                      {row.availableSpots} {t("cupos")}
                    </small>
                    <b>{money(row.priceOverride || basePrice)}</b>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="ms-calendar-legend">
            <i data-tone="open" aria-hidden="true" /> {t("Con cupo")}
            <i data-tone="low" aria-hidden="true" /> {t("Ultimos lugares")}
          </p>
        </div>
      ) : null}
    </span>
  );
}
