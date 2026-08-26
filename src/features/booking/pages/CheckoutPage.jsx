import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { activeAvailability, findExperience } from "../../catalog/catalog-service.js";
import {
  buildDraft,
  clearDraftBooking,
  createGuestBooking,
  isReservableAvailability,
  readDraftBooking,
  saveDraftBooking,
} from "../booking-service.js";
import { Stepper, SummaryBox } from "./BookingSelectionPage.jsx";

export function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useLanguage();
  const initialDraft = useMemo(() => readDraftBooking() || createDraftFromQuery(params), [params]);
  const [draft] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { fullName, email, isAuthenticated } = useAuth();

  if (!draft) {
    return (
      <section className="ms-page">
        <div className="mx-auto max-w-[1100px]">
          <StateBlock title={t("No hay reserva activa")} text={t("Elige una experiencia para iniciar la reserva.")} />
          <div className="mt-4 flex justify-center">
            <Link className="ms-button ms-button-primary" to="/experiencias">{t("Ir al catalogo")}</Link>
          </div>
        </div>
      </section>
    );
  }

  const experience = findExperience(draft.experienceId);
  const selectedAvailability = experience
    ? activeAvailability(experience.id).find((item) => item.id === draft.availabilityId)
    : null;
  const canSubmitBooking = isReservableAvailability(experience, selectedAvailability || draft.availabilityId);

  if (!canSubmitBooking) {
    return (
      <section className="ms-page">
        <div className="mx-auto max-w-[1100px]">
          <StateBlock
            title={t("Cupo por confirmar")}
            text={t("Todavia no hay una fecha confirmada para esta reserva. Volve al detalle para consultar cupo con Mono Solo.")}
          />
          <div className="mt-4 flex justify-center">
            <Link className="ms-button ms-button-primary" to={experience ? `/experiencias/${experience.slug}` : "/experiencias"}>
              {t("Volver")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const { data, error: bookingError } = await createGuestBooking({
      experienceId: draft.experienceId,
      availabilityId: draft.availabilityId,
      guests: draft.guests,
      contactName: form.get("customerName"),
      contactEmail: form.get("customerEmail"),
      contactPhone: form.get("customerPhone"),
    });

    setBusy(false);

    if (bookingError) {
      setError(bookingError.message);
      return;
    }

    clearDraftBooking();
    navigate(`/confirmacion?token=${encodeURIComponent(data.publicToken)}`);
  }

  return (
    <section className="ms-page ms-page-wide">
      <div className="mx-auto max-w-[1100px]">
        <Stepper active={1} />
        <section className="mb-5">
          <p className="ms-eyebrow">{t("Ultimo paso")}</p>
          <h1 className="m-0 max-w-[760px] font-serif text-[clamp(34px,6vw,58px)] leading-none text-ink">{t("Confirmar reserva")}</h1>
          <p className="m-0 mt-3 max-w-[720px] text-muted">
            {t("Tu cupo se confirma al instante. Coordinamos el pago y los detalles con tus datos de contacto.")}
          </p>
        </section>
        <div className="grid items-start gap-5 md:grid-cols-[1fr_360px]">
          <form className="ms-panel overflow-hidden" onSubmit={handleSubmit}>
            <div className="border-b border-line bg-surface-2 p-5">
              <p className="m-0 text-xs font-black uppercase tracking-[.08em] text-green">{t("Paso 2")}</p>
              <h2 className="m-0 mt-1 font-serif text-3xl text-ink">{t("Datos de contacto")}</h2>
              <p className="m-0 mt-2 text-sm text-muted">
                {t("Reserva sin pagar ahora. Tu cupo queda confirmado al instante; coordinamos el pago despues.")}
              </p>
            </div>
            <div className="grid gap-4 p-5">
              {isAuthenticated ? (
                <p className="m-0 rounded-[10px] border border-green/20 bg-green/10 p-3 text-sm font-semibold text-green">
                  {t("Precargamos tus datos de cuenta. Puedes editarlos para esta reserva.")}
                </p>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  {t("Nombre completo")}
                  <input name="customerName" required defaultValue={draft.customerName || fullName || ""} placeholder={t("Nombre y apellido")} />
                </label>
                <label>
                  Email
                  <input name="customerEmail" type="email" required defaultValue={draft.customerEmail || email || ""} placeholder={t("cliente@email.com")} />
                </label>
              </div>
              <label>
                {t("WhatsApp / Telefono")}
                <input name="customerPhone" required defaultValue={draft.customerPhone || ""} placeholder="+507 6000 0000" />
              </label>

              <div className="grid gap-1.5 rounded-[10px] border border-teal/30 bg-[#edf8f6] p-3.5 text-sm">
                <strong>{t("Total estimado:")} {money(draft.total)}</strong>
                <span>{t("1. Envia la reserva sin pago inmediato.")}</span>
                <span>{t("2. Tu cupo queda confirmado al instante.")}</span>
                <span>{t("3. Coordinamos el pago por WhatsApp o correo.")}</span>
              </div>

              <label className="flex items-start gap-2 text-sm font-normal text-muted">
                <input className="mt-1 min-h-0 w-auto" name="acceptPolicy" type="checkbox" required />
                <span>
                  {t("He leído y acepto los")} {" "}
                  <Link className="font-bold text-green hover:underline" to="/legal/terminos">{t("Términos y Condiciones")}</Link> {t("y la")} {" "}
                  <Link className="font-bold text-green hover:underline" to="/legal/exencion">{t("Exención de Responsabilidad")}</Link> {" "}
                  {t("del servicio facilitado por Sebastián Santos Cruz.")}
                  <br />
                  <span className="text-xs">
                    {t("Consulta tambien:")} {" "}
                    <Link className="font-bold text-green hover:underline" to="/legal/privacidad">{t("Privacidad")}</Link> {t("y")} {" "}
                    <Link className="font-bold text-green hover:underline" to="/legal/cancelacion">{t("Cancelacion")}</Link>.
                  </span>
                </span>
              </label>

              {error ? <p className="m-0 rounded-lg bg-red/10 p-3 text-sm font-semibold text-red">{error}</p> : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <p className="m-0 max-w-[520px] text-sm text-muted">
                  {t("Recibiras una confirmacion con enlace para consultar tu reserva.")}
                </p>
                <button className="ms-button ms-button-primary" disabled={busy} type="submit">
                  {busy ? t("Reservando...") : t("Reservar sin pagar ahora")}
                </button>
              </div>
            </div>
          </form>
          <SummaryBox experience={experience} guests={draft.guests} draft={draft} />
        </div>
      </div>
    </section>
  );
}

function createDraftFromQuery(params) {
  const experienceId = params.get("experienceId");
  if (!experienceId) return null;

  const experience = findExperience(experienceId);
  if (!experience) return null;

  const availability = activeAvailability(experience.id).find((item) => (
    item.status === "available" && isReservableAvailability(experience, item)
  ));
  if (!availability) return null;

  const guests = Number(params.get("guests") || experience.minGuests);
  const boundedGuests = Math.max(experience.minGuests, Math.min(experience.maxGuests, guests));
  const draft = buildDraft(experience, availability, boundedGuests, {});
  saveDraftBooking(draft);
  return draft;
}
