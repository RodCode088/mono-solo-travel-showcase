import { Link, useParams } from "react-router-dom";
import { db } from "../../../data/db.js";
import { destinationDisplayName } from "../../../data/mono-experiences.js";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { findDestination } from "../catalog-service.js";
import { DestinationCard, ExperienceCard } from "../components/index.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";

export function DestinationsPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const destinationMeta = slug ? findDestination(slug) : null;
  useDocumentMeta({
    title: destinationMeta ? t(destinationDisplayName(destinationMeta.name)) : t("Destinos"),
    description: destinationMeta?.summary
      ? t(destinationMeta.summary)
      : t("Destinos turisticos de Panama: Bocas del Toro, Chiriqui, Panama City, Los Santos y Colon."),
    canonicalPath: slug ? `/destinos/${slug}` : "/destinos",
  });

  if (slug) {
    const destination = findDestination(slug);
    if (!destination) {
      return (
        <section className="ms-page">
          <StateBlock title={t("Destino no encontrado")} text={t("Explora otros destinos del catalogo.")} />
        </section>
      );
    }

    const rows = db.experiences.filter((experience) =>
      (experience.catalogGroups?.length ? experience.catalogGroups : [{ destination: experience.destination }])
        .some((group) => group.destination === destination.name),
    );
    return (
      <section className="ms-page">
        <section className="my-5">
          <h1 className="m-0 font-serif text-[clamp(34px,6vw,72px)] leading-none text-ink">{t(destinationDisplayName(destination.name))}</h1>
          <p className="text-muted">{t(destination.summary)}</p>
        </section>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {rows.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="ms-page">
      <section className="my-5">
        <h1 className="m-0 font-serif text-[clamp(34px,6vw,72px)] leading-none text-ink">{t("Destinos")}</h1>
        <p className="text-muted">{t("Explora inventario por destino.")}</p>
      </section>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-5">
        {db.destinations.map((destination) => (
          <DestinationCard key={destination.id} destination={destination} />
        ))}
      </div>
      <div className="mt-5">
        <Link className="ms-button ms-button-secondary" to="/experiencias">{t("Ver catalogo completo")}</Link>
      </div>
    </section>
  );
}
