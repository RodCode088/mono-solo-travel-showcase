import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AvailabilityField } from "../../../components/ui/AvailabilityField.jsx";
import { GuestField } from "../../../components/ui/GuestField.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import { activeAvailability, findExperience } from "../../catalog/catalog-service.js";
import { buildDraft, isReservableAvailability, readDraftBooking, saveDraftBooking } from "../booking-service.js";

export function BookingSelectionPage() {
  const navigate = useNavigate();
  const { experienceId } = useParams();
  const { experience: localizeExperience, t } = useLanguage();
  const experience = findExperience(experienceId);
  const content = experience ? localizeExperience(experience) : null;
  const visibleAvailability = experience ? activeAvailability(experience.id).filter((a) => a.status === "available") : [];
  const availability = visibleAvailability.filter((a) => isReservableAvailability(experience, a));
  const hasLocalOnlyAvailability = visibleAvailability.length > 0 && availability.length === 0;
  const storedDraft = useMemo(() => {
    const draft = readDraftBooking();
    return draft?.experienceId === experience?.id ? draft : null;
  }, [experience?.id]);
  const firstAvailability = availability[0] || null;
  const [availabilityId, setAvailabilityId] = useState(storedDraft?.availabilityId || firstAvailability?.id || "");
  const [guests, setGuests] = useState(storedDraft?.guests || experience?.minGuests || 1);
  const selectedAvailability = availability.find((item) => item.id === availabilityId) || firstAvailability;

  if (!experience) {
    return (
      <section className="ms-page">
        <StateBlock title={t("No encontramos esa experiencia")} text={t("Elige una experiencia activa para reservar.")} />
        <div className="mt-4 flex justify-center">
          <Link className="ms-button ms-button-primary" to="/experiencias">{t("Ir al catalogo")}</Link>
        </div>
      </section>
    );
  }

  if (!availability.length) {
    return (
      <section className="ms-page">
        <StateBlock
          title={hasLocalOnlyAvailability ? t("Cupo por confirmar") : t("Sin cupos disponibles")}
          text={hasLocalOnlyAvailability
            ? t("Todavia no hay fechas cargadas para esta experiencia. Escribinos y te confirmamos el cupo directo.")
            : t("Esta experiencia no tiene fechas disponibles para reservar ahora.")}
        />
        <div className="mt-4 flex justify-center">
          <Link className="ms-button ms-button-primary" to={`/experiencias/${experience.slug}`}>{t("Volver al detalle")}</Link>
        </div>
      </section>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const selected = availability.find((item) => item.id === data.availabilityId);
    const draft = buildDraft(experience, selected, Number(data.guests), data);
    saveDraftBooking(draft);
    navigate("/checkout");
  }

  return (
    <section className="ms-page ms-page-wide">
      <div className="mx-auto max-w-[1100px]">
        <Stepper active={0} />
        <section className="mb-5">
          <p className="ms-eyebrow">{t("Reserva protegida")}</p>
          <h1 className="m-0 max-w-[860px] font-serif text-[clamp(34px,6vw,58px)] leading-none text-ink">{content.title}</h1>
          <p className="m-0 mt-3 max-w-[720px] text-muted">
            {t("Elige fecha y personas. Tu cuenta mantiene la reserva guardada para seguimiento y confirmacion.")}
          </p>
        </section>
        <div className="grid items-start gap-5 md:grid-cols-[1fr_360px]">
          <form className="ms-panel ms-booking-form" onSubmit={handleSubmit}>
            <div className="border-b border-line bg-surface-2 p-5">
              <p className="m-0 text-xs font-black uppercase tracking-[.08em] text-green">{t("Paso 1")}</p>
              <h2 className="m-0 mt-1 font-serif text-3xl text-ink">{t("Fecha y personas")}</h2>
            </div>
            <div className="grid gap-4 p-5">
            <input type="hidden" name="experienceId" value={experience.id} />
              <div className="grid gap-4 md:grid-cols-[1.4fr_.6fr]">
                <label className="ms-stacked-field">
                  {t("Fecha y hora")}
                  <AvailabilityField
                    name="availabilityId"
                    availability={availability}
                    value={availabilityId}
                    onChange={setAvailabilityId}
                    basePrice={experience.basePrice}
                  />
                </label>
                <label className="ms-stacked-field">
                  {t("Personas")}
                  <GuestField
                    name="guests"
                    value={guests}
                    onChange={setGuests}
                    min={experience.minGuests}
                    max={experience.maxGuests}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="m-0 max-w-[520px] text-sm text-muted">
                  {t("No pagas ahora. Tu cupo queda confirmado al instante.")}
                </p>
                <button className="ms-button ms-button-primary" type="submit">{t("Continuar con mis datos")}</button>
              </div>
            </div>
          </form>
          <SummaryBox experience={experience} guests={guests} availability={selectedAvailability} />
        </div>
      </div>
    </section>
  );
}

export function Stepper({ active }) {
  const { t } = useLanguage();
  const steps = [
    { label: "Seleccion", helper: "Fecha y personas" },
    { label: "Datos", helper: "Contacto" },
    { label: "Confirmacion", helper: "Voucher" },
  ];
  return (
    <ol className="ms-stepper">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className="ms-step"
          data-state={index === active ? "active" : index < active ? "done" : undefined}
        >
          <i aria-hidden="true">{index < active ? "✓" : index + 1}</i>
          <strong>{t(step.label)}</strong>
          <small>{t(step.helper)}</small>
        </li>
      ))}
    </ol>
  );
}

export function SummaryBox({ experience, guests, availability, draft = null }) {
  const { experience: localizeExperience, t } = useLanguage();
  const content = localizeExperience(experience);
  const subtotal = draft?.subtotal ?? (availability?.priceOverride || experience.basePrice) * guests;
  const taxes = draft?.taxes ?? 0;
  const total = draft?.total ?? subtotal + taxes;

  return (
    <aside className="ms-panel sticky top-[88px] overflow-hidden">
      <div className="relative">
        <img className="h-48 w-full object-cover" src={experience.images[0]} alt="" loading="lazy" decoding="async" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-4">
          <p className="m-0 text-xs font-black uppercase tracking-[.08em] text-gold">{t("Resumen")}</p>
          <h2 className="m-0 mt-1 text-2xl font-black leading-tight text-white">{content.title}</h2>
        </div>
      </div>
      <dl className="grid gap-2 p-[18px]">
        <SummaryRow label={t("Personas")}>{guests}</SummaryRow>
        <SummaryRow label={t("Subtotal")}>{money(subtotal)}</SummaryRow>
        <SummaryRow label={t("Impuestos")}>{money(taxes)}</SummaryRow>
        <SummaryRow label={t("Total")}>{money(total)}</SummaryRow>
        <SummaryRow label={t("Pago")}>{t("No requerido para reservar")}</SummaryRow>
      </dl>
    </aside>
  );
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex justify-between gap-3 border-t border-line pt-2">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
