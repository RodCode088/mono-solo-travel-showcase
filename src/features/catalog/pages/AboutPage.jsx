import { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../../data/db.js";
import { homeCoverImages, img } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";

// Los cuatro capitulos del road trip fundacional. Las fotos son recortes
// limpios de los collages originales (assets/photos/about-*.jpg): el texto que
// venia quemado en la imagen ahora es tipografia real y traducible.
const originStory = [
  {
    id: "origin",
    step: "01",
    place: "En carretera, Panama",
    image: img("about-story-1-origin.jpg"),
    title: "El origen de Mono Solo",
    quote: "Un road trip que se convirtio en una vision.",
    text: "Todo empezo con un road trip que se convirtio en una vision: un Jimny azul, una idea suelta y las carreteras de Panama.",
  },
  {
    id: "chiriqui",
    step: "02",
    place: "Tierras altas de Chiriqui",
    image: img("about-story-2-chiriqui.jpg"),
    title: "Las tierras altas de Chiriqui",
    quote: "Esta parte fue personal: mi pueblo natal.",
    text: "Manejamos directo a las tierras altas de Chiriqui. Esta parte fue personal: es el pueblo natal del fundador, recorrido junto a amigos que se sumaron al viaje.",
  },
  {
    id: "bocas",
    step: "03",
    place: "Bocas del Toro, Caribe",
    image: img("about-story-3-bocas.jpg"),
    title: "Solo hacia el Caribe: Bocas del Toro",
    quote: "Por un momento fui, de verdad, mono solo.",
    text: "Por un momento fue, de verdad, mono solo: el salto de manejar en solitario hasta el lado caribeno, Bocas del Toro.",
  },
  {
    id: "reunion",
    step: "04",
    place: "Panama City",
    image: img("about-story-4-skyline.jpg"),
    title: "De vuelta en Panama City, la idea seguia viva",
    quote: "El road trip termino, pero la idea apenas empezaba.",
    text: "Semanas despues, el fundador se reencontro en Panama City con los viajeros que lo empezaron todo. El road trip termino, pero la idea apenas comenzaba: asi nacio Mono Solo Travel.",
  },
];

const values = [
  {
    id: "nace",
    title: "Como nace",
    text: "Mono Solo empieza desde la vida real de viajeros que querian explorar Panama sin sentirse perdidos, solos o atrapados en tours genericos.",
  },
  {
    id: "curamos",
    title: "Que curamos",
    text: "Reunimos experiencias, rutas, hostales, operadores locales y planes sociales para que cada salida tenga contexto, logistica clara y personas afines.",
  },
  {
    id: "para-quien",
    title: "Para quien es",
    text: "Para viajeros independientes, backpackers, nomadas y grupos pequenos que quieren descubrir Panama con energia local y una forma facil de reservar.",
  },
];

export function AboutPage() {
  const { t } = useLanguage();
  const cover = homeCoverImages[1] || homeCoverImages[0] || "";
  useDocumentMeta({
    title: t("Conocenos"),
    description: t("Conoce la historia de Mono Solo Travel y como conecta viajeros independientes con experiencias locales en Panama."),
    canonicalPath: "/conocenos",
  });

  return (
    <section className="ms-page">
      <section className="ms-about-hero">
        <div className="ms-about-hero-copy">
          <p className="ms-eyebrow">{t("Conocenos")}</p>
          <h1>{t("Viajar solo, sin sentirse solo.")}</h1>
          <p className="ms-about-lead">
            {t("Mono Solo nace en Panama para conectar viajeros independientes con experiencias locales faciles de reservar, rutas claras y planes donde conocer personas con la misma energia. Curamos cada salida para que explorar se sienta simple, social y autentico.")}
          </p>
          <div className="ms-about-facts">
            <span><b>{db.experiences.length}</b> {t("Experiencias")}</span>
            <span><b>{db.destinations.length}</b> {t("Destinos")}</span>
            <span>{t("Reserva con confirmación")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="ms-button ms-button-primary ms-button-lg" to="/experiencias?reset=1">{t("Ver experiencias")}</Link>
            <Link className="ms-button ms-button-secondary ms-button-lg" to="/destinos">{t("Destinos")}</Link>
          </div>
        </div>

        {cover ? (
          <div className="ms-about-hero-media">
            <img src={cover} alt="" loading="eager" decoding="async" />
          </div>
        ) : null}
      </section>

      <StoryStrip />

      <section className="ms-about-values">
        {values.map((value) => (
          <article className="ms-about-value" key={value.id}>
            <h3>{t(value.title)}</h3>
            <p>{t(value.text)}</p>
          </article>
        ))}
      </section>

      <section className="ms-about-cta">
        <div>
          <h2>{t("Listo para tu propia ruta")}</h2>
          <p>{t("El catalogo completo esta abierto: elige destino, fecha y cupo, y coordinamos el resto contigo.")}</p>
        </div>
        <div className="ms-about-cta-actions">
          <Link className="ms-button ms-button-accent ms-button-lg" to="/experiencias?reset=1">{t("Ver experiencias")}</Link>
          <Link className="ms-button ms-button-secondary ms-button-lg" to="/destinos">{t("Explorar destinos")}</Link>
        </div>
      </section>
    </section>
  );
}

/**
 * La tira de la historia: los cuatro capitulos siguen en fila como antes, pero
 * ahora se eligen. El capitulo activo se abre debajo con la foto grande, la
 * cita y el texto completo, de modo que la seccion cuenta el viaje sin obligar
 * a leerlo todo de corrido.
 */
function StoryStrip() {
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState(originStory[0].id);
  const active = originStory.find((step) => step.id === activeId) || originStory[0];

  return (
    <section className="ms-story">
      <div className="ms-about-section-head">
        <p className="ms-eyebrow">{t("La historia real")}</p>
        <h2>{t("El road trip que se convirtio en Mono Solo")}</h2>
        <p>{t("Cuatro paradas, un Jimny azul y la ruta que termino definiendo como Mono Solo arma cada salida.")}</p>
      </div>

      <div className="ms-story-strip" role="tablist" aria-label={t("El road trip que se convirtio en Mono Solo")}>
        {originStory.map((step) => (
          <button
            key={step.id}
            className="ms-story-chapter"
            type="button"
            role="tab"
            id={`story-tab-${step.id}`}
            aria-selected={step.id === activeId}
            aria-controls="story-panel"
            data-active={step.id === activeId || undefined}
            onClick={() => setActiveId(step.id)}
          >
            <img src={step.image} alt="" loading="lazy" decoding="async" />
            <span className="ms-story-chapter-body">
              <i>{step.step}</i>
              <strong>{t(step.title)}</strong>
              <small>{t(step.place)}</small>
            </span>
          </button>
        ))}
      </div>

      <article
        className="ms-story-panel"
        id="story-panel"
        role="tabpanel"
        aria-labelledby={`story-tab-${active.id}`}
        key={active.id}
      >
        <figure>
          <img src={active.image} alt={t(active.title)} loading="lazy" decoding="async" />
        </figure>
        <div className="ms-story-copy">
          <p className="ms-route-place">{t(active.place)}</p>
          <h3>{t(active.title)}</h3>
          <p className="ms-route-quote">{t(active.quote)}</p>
          <p className="ms-story-text">{t(active.text)}</p>
          <p className="ms-story-progress" aria-hidden="true">
            {active.step} / {String(originStory.length).padStart(2, "0")}
          </p>
        </div>
      </article>
    </section>
  );
}
