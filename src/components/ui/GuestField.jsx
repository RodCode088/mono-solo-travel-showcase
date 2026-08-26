import { Minus, Plus, Users } from "lucide-react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";

/**
 * Contador de personas.
 *
 * El `<input type="number">` deja unas flechas diminutas que en movil son
 * practicamente inutilizables. Aqui los dos botones son objetivos tactiles
 * reales y el valor sigue viajando en un input oculto con el mismo `name`.
 */
export function GuestField({ name, value, onChange, min = 1, max = 12, id, label }) {
  const { t } = useLanguage();
  const current = Number(value) || min;

  function step(amount) {
    const next = Math.min(max, Math.max(min, current + amount));
    if (next !== current) onChange?.(next);
  }

  return (
    <span className="ms-guest-field" id={id}>
      <input type="hidden" name={name} value={current} />
      <Users className="ms-guest-icon" size={17} aria-hidden="true" />
      <button
        type="button"
        aria-label={t("Quitar persona")}
        title={t("Quitar persona")}
        disabled={current <= min}
        onClick={() => step(-1)}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <output aria-live="polite">
        {current}
        {label ? <small>{label}</small> : null}
      </output>
      <button
        type="button"
        aria-label={t("Agregar persona")}
        title={t("Agregar persona")}
        disabled={current >= max}
        onClick={() => step(1)}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </span>
  );
}
