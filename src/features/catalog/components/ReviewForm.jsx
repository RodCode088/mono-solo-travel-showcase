import { useState } from "react";
import { StarRating } from "../../../components/ui/StarRating.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { submitReview } from "../catalog-service.js";

export function ReviewForm({ bookingId, onSubmitted }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!rating) {
      setError(t("Selecciona una calificacion antes de enviar."));
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: submitError } = await submitReview({ bookingId, rating, body });
    setBusy(false);
    if (submitError) {
      setError(submitError.message);
      return;
    }
    setRating(0);
    setBody("");
    onSubmitted?.(data);
  }

  return (
    <form className="grid gap-2.5 rounded-[10px] border border-line bg-surface-2 p-4" onSubmit={handleSubmit}>
      <strong className="text-ink">{t("Deja tu reseña")}</strong>
      <StarRating value={rating} interactive size={22} onChange={(next) => { setRating(next); setError(null); }} />
      <textarea
        placeholder={t("Cuentanos como te fue en esta experiencia...")}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={600}
      />
      {error ? <p className="m-0 text-sm font-bold text-red">{error}</p> : null}
      <button className="ms-button ms-button-primary w-fit" type="submit" disabled={busy}>
        {busy ? t("Enviando...") : t("Enviar reseña")}
      </button>
    </form>
  );
}
