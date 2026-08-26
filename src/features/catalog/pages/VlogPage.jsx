import { Instagram, Play, Youtube } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { img } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";

// El vlog vive en YouTube; aqui se ve dentro del sitio.
export const VLOG_VIDEO_ID = "jK_yaEmELRY";
export const VLOG_WATCH_URL = `https://www.youtube.com/watch?v=${VLOG_VIDEO_ID}`;

/**
 * Reproductor con "fachada": hasta que alguien pulsa play no se carga nada de
 * YouTube. El poster es una foto propia, asi que la pagina no hace ninguna
 * peticion a terceros solo por visitarla, y el iframe usa el dominio
 * `youtube-nocookie` para no sembrar cookies de seguimiento.
 */
function VlogPlayer({ poster, title }) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="ms-vlog-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${VLOG_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button className="ms-vlog-frame ms-vlog-facade" type="button" onClick={() => setPlaying(true)}>
      <img src={poster} alt="" loading="eager" decoding="async" />
      <span className="ms-vlog-scrim" aria-hidden="true" />
      <span className="ms-vlog-play">
        <Play size={26} aria-hidden="true" />
        <em>{t("Reproducir vlog")}</em>
      </span>
    </button>
  );
}

export function VlogPage() {
  const { t } = useLanguage();
  const title = t("El vlog de Mono Solo");
  useDocumentMeta({
    title,
    description: t("Mira el vlog de Mono Solo Travel sin salir del sitio: la ruta, la gente y los lugares detras de las experiencias."),
    canonicalPath: "/vlog",
  });

  return (
    <section className="ms-page">
      <section className="ms-vlog-hero">
        <div className="ms-vlog-intro">
          <p className="ms-eyebrow">{t("Vlog")}</p>
          <h1>{title}</h1>
          <p className="ms-vlog-lead">
            {t("La ruta contada desde adentro: los caminos, la gente y los lugares que despues terminan siendo una experiencia del catalogo.")}
          </p>
          <div className="ms-vlog-actions">
            <Link className="ms-button ms-button-primary ms-button-lg" to="/experiencias?reset=1">{t("Ver experiencias")}</Link>
            <a
              className="ms-button ms-button-secondary ms-button-lg"
              href="https://www.instagram.com/monosolotravel/"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={17} aria-hidden="true" />
              Instagram
            </a>
          </div>
        </div>

        <VlogPlayer poster={img("about-story-1-origin.jpg")} title={title} />

        <p className="ms-vlog-note">
          <Youtube size={15} aria-hidden="true" />
          {t("El video se reproduce aqui mismo. Al pulsar play se carga el reproductor de YouTube.")}
        </p>
      </section>

      <section className="ms-vlog-links">
        <article>
          <h2>{t("De la camara al catalogo")}</h2>
          <p>{t("Cada ruta que aparece en el vlog la recorrimos antes de publicarla. Lo que ves grabado es lo mismo que puedes reservar.")}</p>
          <Link className="ms-home-text-link" to="/experiencias?reset=1">{t("Ver catalogo")}</Link>
        </article>
        <article>
          <h2>{t("Como empezo todo")}</h2>
          <p>{t("El road trip fundacional, contado paso a paso con las fotos originales del viaje.")}</p>
          <Link className="ms-home-text-link" to="/conocenos">{t("Conocenos")}</Link>
        </article>
      </section>
    </section>
  );
}
