import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AvailabilityField } from "../../../components/ui/AvailabilityField.jsx";
import { GuestField } from "../../../components/ui/GuestField.jsx";
import { StarRating } from "../../../components/ui/StarRating.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { db } from "../../../data/db.js";
import { destinationDisplayName } from "../../../data/mono-experiences.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";
import { money } from "../../../lib/services/format.js";
import { saveDraftBooking } from "../../../lib/services/state.js";
import { cleanDisplayText } from "../../../lib/services/text.js";
import { buildDraft, isReservableAvailability } from "../../booking/booking-service.js";
import { CheckList, ExperienceCard, InfoBlock, ReviewCard, ReviewForm } from "../components/index.js";
import { activeAvailability, getExperienceReviews, getMyReviewableBookings, hydrateExperienceRatings } from "../catalog-service.js";
import { useFavorites } from "../hooks/useFavorites.js";

export function ExperienceDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const experience = db.experiences.find((item) => item.id === slug || item.slug === slug);
  const { experience: localizeExperience, t } = useLanguage();
  const { isCustomer } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const content = experience ? localizeExperience(experience) : null;
  const [reviews, setReviews] = useState([]);
  const [reviewableBookingId, setReviewableBookingId] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({
    rating: experience?.rating ?? null,
    reviewCount: experience?.reviewCount || 0,
  });

  useEffect(() => {
    let active = true;
    if (!experience) return undefined;

    getExperienceReviews(experience).then(({ data }) => {
      if (active) setReviews(data || []);
    });

    if (isCustomer) {
      getMyReviewableBookings().then(({ data }) => {
        if (!active) return;
        const experienceKey = experience.supabaseId || experience.id;
        const match = (data || []).find((row) => row.experienceId === experienceKey);
        setReviewableBookingId(match?.bookingId || null);
      });
    } else {
      setReviewableBookingId(null);
    }

    return () => {
      active = false;
    };
  }, [experience, isCustomer]);

  async function handleReviewSubmitted() {
    setReviewableBookingId(null);
    const [{ data: freshReviews }] = await Promise.all([
      getExperienceReviews(experience),
      hydrateExperienceRatings(),
    ]);
    setReviews(freshReviews || []);
    setRatingSummary({ rating: experience.rating, reviewCount: experience.reviewCount });
  }

  useDocumentMeta({
    title: experience ? content.title : "Experiencia",
    description: content?.shortDescription,
    canonicalPath: experience ? `/experiencias/${experience.slug}` : undefined,
  });

  if (!experience) {
    return (
      <section className="ms-page">
        <StateBlock title={t("Experiencia no encontrada")} text={t("Revisa el catalogo para elegir una experiencia activa.")} />
        <div className="mt-4 flex justify-center">
          <Link className="ms-button ms-button-primary" to="/experiencias">{t("Ir al catalogo")}</Link>
        </div>
      </section>
    );
  }

  const visibleAvailability = activeAvailability(experience.id).filter((item) => item.status === "available");
  const availability = visibleAvailability.filter((item) => isReservableAvailability(experience, item));
  const hasLocalOnlyAvailability = visibleAvailability.length > 0 && availability.length === 0;
  const gallery = experience.images?.length ? experience.images : [];
  const primaryGallery = gallery.slice(0, 5);
  const extraGallery = gallery.slice(5);
  const similar = db.experiences
    .filter((item) => item.id !== experience.id && (item.category === experience.category || item.destination === experience.destination))
    .slice(0, 3);

  function handleReserveDraft(draft) {
    saveDraftBooking(draft);
    navigate(`/reservar/${experience.id}`);
  }

  return (
    <section className="ms-page">
      <section className="my-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ms-eyebrow">{destinationDisplayName(content.destination)} / {content.category}</p>
          <h1 className="m-0 max-w-[900px] font-serif text-[clamp(34px,6vw,72px)] leading-none text-ink">{content.title}</h1>
          <p className="max-w-[780px] text-muted">{content.shortDescription}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 font-black text-green">
            {ratingSummary.reviewCount > 0 ? <StarRating value={ratingSummary.rating} count={ratingSummary.reviewCount} size={16} /> : null}
            <span>{t("desde")} {money(experience.basePrice)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {availability.length ? (
            <Link className="ms-button ms-button-primary" to={`/reservar/${experience.id}`}>{t("Reservar")}</Link>
          ) : (
            <button className="ms-button ms-button-secondary" type="button" disabled>{t("Consultar cupo")}</button>
          )}
        </div>
      </section>

      <section className="my-5 grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[220px_220px]">
        {primaryGallery.map((src, index) => (
          <img
            key={src}
            className={`h-60 w-full rounded-[10px] object-cover md:h-full ${index === 0 ? "md:row-span-2" : ""}`}
            src={src}
            alt={content.title}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index === 0 ? "high" : "low"}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_360px]">
        <article className="grid gap-4">
          <InfoBlock title={t("Descripcion completa")}>
            <RichDescription text={content.fullDescription} />
          </InfoBlock>
          <InfoBlock title={t("Momentos clave")}>
            <CheckList items={content.itinerary} />
          </InfoBlock>
          <InfoBlock title={t("Que incluye")}>
            <CheckList items={content.included} />
          </InfoBlock>
          <InfoBlock title={t("Que no incluye")}>
            <CheckList items={content.notIncluded} />
          </InfoBlock>
          <InfoBlock title={t("Punto de encuentro")}>
            <p>{content.meetingPoint}</p>
          </InfoBlock>
          <InfoBlock title={t("Requisitos")}>
            <CheckList items={content.requirements} />
          </InfoBlock>
          <InfoBlock title={t("Politicas")}>
            <p>{content.cancellationPolicy}</p>
          </InfoBlock>
          {extraGallery.length ? (
            <InfoBlock title={t("Mas fotos")}>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {extraGallery.map((src) => (
                  <img key={src} className="aspect-[4/3] rounded-[10px] object-cover" src={src} alt={content.title} loading="lazy" decoding="async" />
                ))}
              </div>
            </InfoBlock>
          ) : null}
          <InfoBlock id="resenas" title={t("Reseñas")}>
            <div className="grid gap-3">
              {reviewableBookingId ? (
                <ReviewForm bookingId={reviewableBookingId} onSubmitted={handleReviewSubmitted} />
              ) : null}
              {reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} />) : (
                <StateBlock title={t("Sin reseñas todavía")} text={t("Sé el primero en compartir cómo te fue en esta experiencia.")} />
              )}
            </div>
          </InfoBlock>
        </article>

        <ReserveWidget
          experience={experience}
          availability={availability}
          hasLocalOnlyAvailability={hasLocalOnlyAvailability}
          onReserve={handleReserveDraft}
        />
      </section>

      {similar.length ? (
        <section className="mt-6 py-5">
          <div className="mb-4">
            <h2 className="m-0 font-serif text-3xl text-ink">{t("Experiencias similares")}</h2>
          </div>
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {similar.map((item) => (
              <ExperienceCard key={item.id} experience={item} favorite={favoriteIds.has(item.id)} onFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function RichDescription({ text }) {
  const { t } = useLanguage();
  const blocks = cleanDisplayText(text)
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return <p className="m-0 text-muted">{t("Descripcion disponible pronto. Escribinos si queres mas detalles.")}</p>;

  return (
    <div className="grid gap-3 text-ink-2">
      {blocks.map((block) => (
        <p key={block.slice(0, 80)} className="m-0 whitespace-pre-line">
          {block}
        </p>
      ))}
    </div>
  );
}

function ReserveWidget({ experience, availability, hasLocalOnlyAvailability, onReserve }) {
  const { t } = useLanguage();
  const firstAvailability = availability[0] || null;
  const [availabilityId, setAvailabilityId] = useState(firstAvailability?.id || "");
  const [guests, setGuests] = useState(experience.minGuests);
  const selectedAvailability = availability.find((item) => item.id === availabilityId) || firstAvailability;
  const unitPrice = selectedAvailability?.priceOverride || experience.basePrice;
  const total = unitPrice * guests;

  function handleSubmit(event) {
    event.preventDefault();
    if (!selectedAvailability) return;
    const draft = buildDraft(experience, selectedAvailability, guests, {});
    onReserve(draft);
  }

  return (
    <aside className="ms-reserve-widget ms-nature-panel sticky top-[88px] p-5">
      <h2 className="m-0 font-serif text-3xl text-ink">{t("Reserva")}</h2>
      <p className="ms-reserve-lead">{t("Elige la salida y confirmamos el cupo contigo.")}</p>
      {availability.length ? (
        <form className="mt-4 grid gap-3.5" onSubmit={handleSubmit}>
          <label className="ms-stacked-field">
            {t("Fecha")}
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
          <div className="ms-reserve-total">
            <span>{t("Total estimado")}</span>
            <strong>{money(total)}</strong>
            <small>{t("Reserva ahora y coordina el pago despues")}</small>
          </div>
          <button className="ms-button ms-button-primary ms-button-lg w-full" type="submit">{t("Continuar reserva")}</button>
        </form>
      ) : (
        <StateBlock
          title={hasLocalOnlyAvailability ? t("Cupo por confirmar") : t("Sin cupos disponibles")}
          text={hasLocalOnlyAvailability
            ? t("Escribinos y te confirmamos disponibilidad y fecha directo por WhatsApp.")
            : t("Esta experiencia no tiene salidas abiertas ahora mismo.")}
        />
      )}
    </aside>
  );
}
