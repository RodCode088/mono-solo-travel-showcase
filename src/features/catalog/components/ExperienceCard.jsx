import { Link } from "react-router-dom";
import { StarRating } from "../../../components/ui/StarRating.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import { destinationDisplayName } from "../../../data/mono-experiences.js";

export function ExperienceCard({ experience, favorite = false, onFavorite }) {
  const { experience: localizeExperience, t } = useLanguage();
  const content = localizeExperience(experience);
  const cover = experience.images?.[0] || "";
  const hasReviews = Number(experience.reviewCount) > 0;

  return (
    <article className="ms-experience-card relative grid overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-ms">
      <button
        className="absolute right-2.5 top-2.5 z-20 grid h-9 w-9 place-items-center rounded-full border-0 bg-white/90 text-red shadow-sm"
        type="button"
        aria-label={favorite ? t("Quitar de favoritos") : t("Guardar en favoritos")}
        onClick={() => onFavorite?.(experience.id)}
      >
        <svg className={favorite ? "h-5 w-5 fill-current" : "h-5 w-5 fill-none"} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20s-6.6-4.4-8.8-8.2C1.4 8.7 3 5 6.4 5c1.9 0 3.2 1 3.9 2.1C11 6 12.3 5 14.2 5c3.4 0 5 3.7 3.2 6.8C15.4 15.6 12 20 12 20Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <Link className="absolute inset-0 z-10" to={`/experiencias/${experience.slug}`} aria-label={`${t("Ver detalle")} ${content.title}`} />
      <img className="ms-experience-card-image h-[210px] w-full object-cover" src={cover} alt="" loading="lazy" decoding="async" />
      <div className="ms-experience-card-content grid gap-2.5 p-3.5">
        <span className="text-xs font-bold text-muted">{destinationDisplayName(content.destination)} · {content.category}</span>
        <h3 className="m-0 text-xl font-extrabold leading-tight text-ink">{content.title}</h3>
        <p className="m-0 line-clamp-3 text-sm text-muted">{content.shortDescription}</p>
        <div className="ms-experience-card-meta flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-muted">
          {hasReviews ? (
            <StarRating value={experience.rating} count={experience.reviewCount} size={14} />
          ) : (
            <span>{experience.duration} {t("h aprox.")}</span>
          )}
          <span>{t("Reserva con confirmación")}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-ink">{t("Desde")} {money(experience.basePrice)}</strong>
          <span className="font-black text-green">{t("Ver detalle")}</span>
        </div>
      </div>
    </article>
  );
}
