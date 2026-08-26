import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isPromotedExperience, promotedFirst } from "../../../config/catalog-promo.js";
import { db } from "../../../data/db.js";
import { destinationDisplayName, homeCoverImages } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";
import { getTodayFeaturedExperience } from "../catalog-service.js";
import { CatalogSearchPanel, DestinationCard, FallingExperienceGrid } from "../components/index.js";
import { useFavorites } from "../hooks/useFavorites.js";

const interestCollections = [
  {
    category: "Beach & Water Experiences",
    title: "Playa, islas y agua",
    description: "Escapes para nadar, surfear, hacer snorkel o perderte en el Caribe.",
  },
  {
    category: "Jungle & Mountain Experiences",
    title: "Selva y montaña",
    description: "Cascadas, senderos y panoramas para moverte fuera de la ciudad.",
  },
  {
    category: "Cultural Experiences",
    title: "Cultura local",
    description: "Historias, comunidades y lugares que dan contexto a Panamá.",
  },
  {
    category: "Free Experiences & Socials",
    title: "Conocer gente",
    description: "Planes sencillos para conectar con viajeros y la ciudad.",
  },
  {
    category: "Extreme Experiences",
    title: "Aventura",
    description: "Adrenalina, altura y actividades para salir de la rutina.",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  useDocumentMeta({
    description:
      t("Descubre experiencias reales de Mono Solo Travel en Panama: aventura, cultura, shuttles, playa, bienestar y salidas sociales con reserva online."),
    canonicalPath: "/",
  });
  const { favoriteIds, toggleFavorite } = useFavorites();
  const heroImages = (homeCoverImages.length ? homeCoverImages : db.experiences.flatMap((item) => item.images)).slice(0, 4);
  const featured = pickExperiencesForHome(db.experiences);
  const freeSocial = experiencesForCategory("Free Experiences & Socials").slice(0, 3);
  const beachAndWater = experiencesForCategory("Beach & Water Experiences").slice(0, 3);

  function selectCategory(category) {
    navigate(`/experiencias?category=${encodeURIComponent(category)}`);
  }

  return (
    <>
      <TodayFlyer />
      <section className="ms-hero ms-home-hero">
        <div className="ms-hero-media" aria-hidden="true">
          {heroImages.map((src, index) => (
            <img
              key={src}
              className="ms-hero-slide"
              src={src}
              alt=""
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
              style={{
                animationDelay: `${index * 5}s`,
                zIndex: heroImages.length - index,
              }}
            />
          ))}
        </div>
        <div className="ms-hero-shade" />
        <div className="ms-hero-content ms-home-hero-content">
          <div className="ms-home-hero-copy">
            <h1>{t("Panama con las mejores rutas, personas afines y lugares escondidos.")}</h1>
            <p>{t("Islas, cascadas, shuttles, surf, caminatas y planes sociales. Todo probado por nosotros antes de subirlo aqui.")}</p>
          </div>
          <CatalogSearchPanel variant="hero" />
        </div>
      </section>

      <section className="ms-home-trust" aria-label={t("Por qué reservar con Mono Solo")}>
        <span>{t("Experiencias seleccionadas")}</span>
        <span>{t("Reserva en pocos pasos")}</span>
      </section>

      <section className="ms-page ms-home-page">
        <section className="ms-home-section">
          <SectionHead
            eyebrow={t("Explora según tu plan")}
            title={t("¿Qué te provoca hacer?")}
            to="/experiencias?reset=1"
            linkLabel={t("Ver todas las experiencias")}
          />
          <div className="ms-home-interest-grid">
            {interestCollections.map((interest) => (
              <button
                key={interest.category}
                className="ms-home-interest-card"
                type="button"
                onClick={() => selectCategory(interest.category)}
              >
                <img src={coverForCategory(interest.category, heroImages[0])} alt="" loading="lazy" decoding="async" />
                <span>
                  <strong>{t(interest.title)}</strong>
                  <small>{t(interest.description)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="ms-home-section">
          <SectionHead
            eyebrow={t("Para empezar")}
            title={t("Experiencias para descubrir Panamá")}
            to="/experiencias?reset=1"
            linkLabel={t("Ver catálogo")}
          />
          <FallingExperienceGrid
            experiences={featured}
            favoriteIds={favoriteIds}
            onFavorite={toggleFavorite}
            className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          />
        </section>

        <section className="ms-home-section">
          <div className="ms-home-collection-grid">
            <CollectionFeature
              title={t("Planes para conocer gente")}
              description={t("Walking tours, encuentros y planes sociales para entrar en la ciudad acompañado.")}
              category="Free Experiences & Socials"
              rows={freeSocial}
              fallbackImage={heroImages[0]}
            />
            <CollectionFeature
              title={t("El mar está más cerca")}
              description={t("Islas, surf y escapadas de agua para cuando el plan pide salir de la ciudad.")}
              category="Beach & Water Experiences"
              rows={beachAndWater}
              fallbackImage={heroImages[0]}
            />
          </div>
        </section>

        <section className="ms-home-section">
          <SectionHead
            eyebrow={t("Muévete por Panamá")}
            title={t("Explora por destino")}
            to="/destinos"
            linkLabel={t("Explorar destinos")}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {db.destinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        </section>

        <section id="viajes-grupales" className="ms-group-trips">
          <div>
            <p className="ms-eyebrow">{t("Lo proximo de Mono Solo")}</p>
            <h2>{t("Viajes grupales")}</h2>
            <p>{t("Estamos preparando salidas en grupo con fechas, rutas y cupos definidos. Muy pronto las encontraras aqui.")}</p>
          </div>
          <strong>{t("Próximamente")}</strong>
        </section>
      </section>
    </>
  );
}

function experiencesForCategory(category) {
  return db.experiences.filter((experience) => hasCatalogCategory(experience, category));
}

function coverForCategory(category, fallbackImage) {
  return experiencesForCategory(category)[0]?.images?.[0] || fallbackImage || "";
}

function pickExperiencesForHome(experiences) {
  const selected = [];
  const seen = new Set();
  for (const category of interestCollections.map((item) => item.category).concat("Kuna Yala / San Blas")) {
    const match = experiences.find((experience) => hasCatalogCategory(experience, category) && !seen.has(experience.id));
    if (match) {
      selected.push(match);
      seen.add(match.id);
    }
  }
  for (const experience of experiences) {
    if (selected.length >= 6) break;
    if (!seen.has(experience.id)) selected.push(experience);
  }
  // La experiencia destacada abre la rejilla, sea cual sea la categoria por la
  // que haya entrado en la seleccion.
  return promotedFirst(selected.slice(0, 6));
}

function hasCatalogCategory(experience, category) {
  return (experience.catalogGroups?.length ? experience.catalogGroups : [{ category: experience.category }])
    .some((group) => group.category === category);
}

const TODAY_FLYER_STORAGE_PREFIX = "ms.todayFlyerDismissed.";

// El "flayer" del dia: si hay una reserva confirmada real para hoy
// (getTodayFeaturedExperience prioriza Panama City/Colon) se anuncia esa.
// Sin ninguna, el cliente pidio (2026-08-24) que el sitio anuncie igual el
// walking tour -- es la experiencia insignia (misma que reciben los QR de
// hostales), asi que nunca queda sin nada que promocionar, ni en el QR
// generico que apunta al inicio. El cliente pidio despues (2026-08-24) que
// se vea como un anuncio publicitario real (popup con foto), no como una
// barra de texto -- se recuerda cerrado por el resto del dia (sessionStorage
// con la fecha en la llave) para no ser molesto en cada visita.
function TodayFlyer() {
  const { t, experience: localizeExperience } = useLanguage();
  const [featured, setFeatured] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTodayFeaturedExperience().then(({ data }) => {
      if (cancelled) return;
      let slug = data?.slug;
      let title = data?.title;
      if (!slug) {
        const fallback = db.experiences.find(isPromotedExperience);
        if (!fallback) return;
        slug = fallback.slug;
        title = localizeExperience(fallback).title;
      }

      const dismissKey = `${TODAY_FLYER_STORAGE_PREFIX}${todayKey()}`;
      if (sessionStorage.getItem(dismissKey) === slug) return;

      const match = db.experiences.find((item) => item.slug === slug);
      setFeatured({
        slug,
        title: match ? localizeExperience(match).title : title,
        description: match ? localizeExperience(match).shortDescription : "",
        image: match?.images?.[0] || null,
      });
      // Un tick despues del mount para que la transicion CSS anime la
      // entrada en vez de aparecer de golpe. setTimeout en vez de
      // requestAnimationFrame a proposito: rAF se pausa/nunca dispara en una
      // pestaña en segundo plano (y en este entorno de prueba, que no
      // compone frames), dejando el popup invisible para siempre.
      setTimeout(() => setVisible(true), 30);
    });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    if (featured) sessionStorage.setItem(`${TODAY_FLYER_STORAGE_PREFIX}${todayKey()}`, featured.slug);
    setVisible(false);
  }

  if (!featured) return null;

  return (
    <div
      className={`ms-flyer-backdrop ${visible ? "is-visible" : ""}`}
      onClick={dismiss}
      onTransitionEnd={() => {
        if (!visible) setFeatured(null);
      }}
      role="presentation"
    >
      <div className="ms-flyer-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ms-flyer-close" onClick={dismiss} aria-label={t("Cerrar")}>
          ×
        </button>
        {featured.image ? (
          <div className="ms-flyer-media">
            <img src={featured.image} alt="" loading="eager" />
          </div>
        ) : null}
        <div className="ms-flyer-body">
          <span className="ms-flyer-eyebrow">{t("Hoy estamos haciendo")}</span>
          <h2>{featured.title}</h2>
          {featured.description ? <p>{featured.description}</p> : null}
          <Link className="ms-button ms-button-primary w-fit" to={`/experiencias/${featured.slug}`} onClick={dismiss}>
            {t("Ver detalles")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function SectionHead({ eyebrow, title, to, linkLabel }) {
  return (
    <div className="ms-home-section-head">
      <div>
        {eyebrow ? <p className="ms-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      <Link className="ms-home-text-link" to={to}>{linkLabel}</Link>
    </div>
  );
}

function CollectionFeature({ title, description, category, rows, fallbackImage }) {
  const { experience: localizeExperience, t } = useLanguage();
  const cover = rows[0]?.images?.[0] || fallbackImage;
  return (
    <section className="ms-home-collection">
      <img src={cover} alt="" loading="lazy" decoding="async" />
      <div className="ms-home-collection-content">
        <p className="ms-eyebrow">{t("Colección Mono Solo")}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="ms-home-collection-list">
          {rows.map((experience) => (
            <Link key={experience.id} to={`/experiencias/${experience.slug}`}>
              {localizeExperience(experience).title}
            </Link>
          ))}
        </div>
        <Link className="ms-button ms-button-secondary w-fit" to={`/experiencias?category=${encodeURIComponent(category)}`}>
          {t("Explorar colección")}
        </Link>
      </div>
    </section>
  );
}
