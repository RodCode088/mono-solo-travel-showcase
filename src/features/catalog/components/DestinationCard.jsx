import { Link } from "react-router-dom";
import { destinationDisplayName } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";

export function DestinationCard({ destination }) {
  const { t } = useLanguage();

  return (
    <Link className="relative flex min-h-[260px] items-end overflow-hidden rounded-[14px] bg-ink text-white" to={`/destinos/${destination.slug}`}>
      <img className="absolute inset-0 h-full w-full object-cover opacity-70" src={destination.image} alt={t(destinationDisplayName(destination.name))} loading="lazy" decoding="async" />
      <div className="relative w-full bg-gradient-to-t from-black/70 to-transparent p-[18px]">
        <span className="text-sm">{t(destination.region)}</span>
        <h3 className="my-1 text-2xl font-extrabold text-white">{t(destinationDisplayName(destination.name))}</h3>
        <p className="m-0 text-white/80">{t(destination.summary)}</p>
      </div>
    </Link>
  );
}
