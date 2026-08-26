import { CalendarDays, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";
import { MonthCalendar, fromISODate, longDateLabel, startOfMonth, todayISO } from "./Calendar.jsx";
import { usePopover } from "./use-popover.js";

/**
 * Campo de fecha con calendario flotante.
 *
 * Sustituye a `<input type="date">`, cuyo panel nativo no se puede diseñar y
 * cambia de aspecto en cada navegador. Mantiene un input oculto con el mismo
 * `name`, asi que los formularios que leen FormData siguen funcionando igual.
 */
export function DateField({
  name,
  value = "",
  onChange,
  min,
  max,
  placeholder,
  dayMeta,
  clearable = true,
  id,
}) {
  const { language, t } = useLanguage();
  const { open, setOpen, placement, anchorRef, panelRef } = usePopover();
  const [month, setMonth] = useState(() => startOfMonth(fromISODate(value) || new Date()));

  useEffect(() => {
    if (open) setMonth(startOfMonth(fromISODate(value) || new Date()));
  }, [open, value]);

  const label = value ? longDateLabel(value, language) : placeholder || t("Elegir fecha");

  return (
    <span className="ms-field-shell" ref={anchorRef}>
      <input type="hidden" name={name} value={value} />
      <button
        className="ms-field-trigger"
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-filled={value ? "" : undefined}
        onClick={() => setOpen((state) => !state)}
      >
        <CalendarDays size={17} aria-hidden="true" />
        <span>{label}</span>
        {value && clearable ? (
          <i
            className="ms-field-clear"
            role="button"
            tabIndex={-1}
            aria-label={t("Quitar fecha")}
            title={t("Quitar fecha")}
            onClick={(event) => {
              event.stopPropagation();
              onChange?.("");
            }}
          >
            <X size={14} aria-hidden="true" />
          </i>
        ) : null}
      </button>

      {open ? (
        <div className="ms-popover ms-popover-calendar" data-placement={placement} ref={panelRef} role="dialog" aria-label={t("Elegir fecha")}>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={value}
            onSelect={(iso) => {
              onChange?.(iso);
              setOpen(false);
            }}
            min={min}
            max={max}
            dayMeta={dayMeta}
            footer={
              <div className="ms-calendar-foot">
                <button type="button" onClick={() => { onChange?.(todayISO()); setOpen(false); }}>
                  {t("Hoy")}
                </button>
                {clearable ? (
                  <button type="button" onClick={() => { onChange?.(""); setOpen(false); }}>
                    {t("Cualquier fecha")}
                  </button>
                ) : null}
              </div>
            }
          />
        </div>
      ) : null}
    </span>
  );
}
