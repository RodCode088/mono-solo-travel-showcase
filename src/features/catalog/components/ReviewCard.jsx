import { StarRating } from "../../../components/ui/StarRating.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { cleanDisplayText } from "../../../lib/services/text.js";

export function ReviewCard({ review }) {
  const { t } = useLanguage();

  return (
    <article className="rounded-[10px] border border-line bg-surface-2 p-4">
      <StarRating value={review.rating} size={16} />
      {review.body ? <p className="mt-2 text-ink">{cleanDisplayText(review.body)}</p> : null}
      <small className="mt-1 block text-muted">{cleanDisplayText(review.authorName) || t("Viajero Mono Solo")}</small>
    </article>
  );
}
