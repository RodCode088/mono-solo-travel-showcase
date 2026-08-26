import { useState } from "react";
import logoCircle from "../../../assets/brand/nuevos-logos/logo-mark-cropped.png";
import walkingMonkey from "../../../assets/video_loading/mono-solo-walking.mp4";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";

export function ExperienceLoader({ compact = false, message = "Cargando experiencias..." }) {
  const { t } = useLanguage();
  const label = t(message);
  const [videoReady, setVideoReady] = useState(false);
  const reduceMotion = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section
      className={`ms-experience-loader ${compact ? "ms-experience-loader-compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="ms-experience-loader-inner">
        <div className={`ms-experience-loader-media ${videoReady ? "is-ready" : ""}`} aria-hidden="true">
          <img src={logoCircle} alt="" />
          <video
            autoPlay={!reduceMotion}
            loop={!reduceMotion}
            muted
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
          >
            <source src={walkingMonkey} type="video/mp4" />
          </video>
        </div>
        <div className="ms-experience-loader-copy">
          <span>Mono Solo Travel</span>
          <strong>{label}</strong>
          <span className="ms-experience-loader-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
        <span className="ms-experience-loader-track" aria-hidden="true"><i /></span>
      </div>
    </section>
  );
}
