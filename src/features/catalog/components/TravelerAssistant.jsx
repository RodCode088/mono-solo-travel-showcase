import { Compass, MessageCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { db } from "../../../data/db.js";
import { destinationDisplayName } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";

const interests = [
  {
    id: "beach",
    label: "Quiero playa y agua",
    categories: ["Beach & Water Experiences", "Playa Venao & Los Santos Province"],
    destinations: ["Kuna Yala / San Blas", "Playa Venao & Los Santos"],
  },
  {
    id: "mountain",
    label: "Quiero montana y selva",
    categories: ["Jungle & Mountain Experiences", "Boquete & Chiriqui Province"],
    destinations: ["Boquete / Provincia de Chiriqui"],
  },
  {
    id: "culture",
    label: "Quiero cultura local",
    categories: ["Cultural Experiences"],
    destinations: [],
  },
  {
    id: "social",
    label: "Quiero conocer gente",
    categories: ["Free Experiences & Socials", "Nightlife"],
    destinations: [],
  },
  {
    id: "adventure",
    label: "Quiero adrenalina",
    categories: ["Extreme Experiences", "Beach & Water Experiences"],
    destinations: [],
  },
  {
    id: "shuttle",
    label: "Necesito un traslado",
    categories: ["Shuttles & Logistics", "Shuttle Tours"],
    destinations: ["Shuttles"],
  },
];

export function TravelerAssistant() {
  const { pathname } = useLocation();
  const { experience: localizeExperience, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const publicRoute = pathname === "/" || pathname.startsWith("/experiencias") || pathname.startsWith("/destinos") || pathname === "/conocenos";

  const results = useMemo(() => {
    if (!selected) return [];
    return rankExperiences(interests.find((interest) => interest.id === selected)).slice(0, 3);
  }, [selected]);

  if (!publicRoute) return null;

  return (
    <div className={`ms-travel-assistant ${open ? "is-open" : ""}`}>
      {open ? (
        <section className="ms-assistant-panel" aria-label={t("Asistente de experiencias")}>
          <header>
            <span className="ms-assistant-mark" aria-hidden="true"><Compass size={20} /></span>
            <div>
              <strong>{t("Encuentra tu experiencia")}</strong>
              <small>{t("Te recomiendo opciones del catalogo actual.")}</small>
            </div>
            <button type="button" aria-label={t("Cerrar chat")} onClick={() => setOpen(false)}><X size={19} /></button>
          </header>

          <div className="ms-assistant-body">
            <div className="ms-assistant-message">
              <Sparkles size={16} aria-hidden="true" />
              <p>{t(selected ? "Estas opciones encajan mejor con lo que buscas:" : "Que te provoca hacer en Panama?")}</p>
            </div>

            {!selected ? (
              <div className="ms-assistant-choices">
                {interests.map((interest) => (
                  <button key={interest.id} type="button" onClick={() => setSelected(interest.id)}>
                    {t(interest.label)}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="ms-assistant-results">
                  {results.map((item) => {
                    const content = localizeExperience(item);
                    return (
                      <Link key={item.id} to={`/experiencias/${item.slug}`} onClick={() => setOpen(false)}>
                        <img src={item.images?.[0]} alt="" />
                        <span>
                          <strong>{content.title}</strong>
                          <small>{destinationDisplayName(content.destination)}</small>
                        </span>
                        <b>{t("Ver")}</b>
                      </Link>
                    );
                  })}
                </div>
                <button className="ms-assistant-reset" type="button" onClick={() => setSelected(null)}>
                  <RotateCcw size={16} /> {t("Cambiar lo que busco")}
                </button>
              </>
            )}
          </div>
        </section>
      ) : null}

      <button
        className="ms-assistant-trigger"
        type="button"
        aria-expanded={open}
        aria-label={t(open ? "Cerrar asistente" : "Abrir asistente de experiencias")}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <span>{t(open ? "Cerrar" : "Encuentra tu plan")}</span>
      </button>
    </div>
  );
}

function rankExperiences(interest) {
  if (!interest) return [];

  return db.experiences
    .map((experience, index) => {
      const groups = experience.catalogGroups?.length
        ? experience.catalogGroups
        : [{ category: experience.category, destination: experience.destination }];
      const categoryMatches = groups.filter((group) => interest.categories.includes(group.category)).length;
      const destinationMatches = groups.filter((group) => interest.destinations.includes(group.destination)).length;
      return { experience, score: categoryMatches * 3 + destinationMatches * 2, index };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.experience);
}
