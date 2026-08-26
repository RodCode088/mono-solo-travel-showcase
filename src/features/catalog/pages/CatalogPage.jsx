import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_FILTERS } from "../../../lib/services/state.js";
import { getFilteredExperiences } from "../catalog-service.js";
import { CatalogSearchPanel, FallingExperienceGrid } from "../components/index.js";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useDocumentMeta } from "../../../lib/seo/use-document-meta.js";
import { useFavorites } from "../hooks/useFavorites.js";

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  useDocumentMeta({
    title: t("Catalogo de experiencias"),
    description:
      t("Explora el catalogo de experiencias turisticas en Panama con filtros por destino y categoria."),
    canonicalPath: "/experiencias",
  });
  const initialFilters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);
  const { favoriteIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const rows = getFilteredExperiences(filters);

  function applySearch(next) {
    setFilters((current) => ({
      ...current,
      // "destination" solo se setea cuando el usuario clickea un encabezado
      // de grupo (p.ej. "From Panama City") para pedir todas sus categorias
      // a la vez; elegir una sola categoria lo limpia de vuelta a "all" para
      // que los dos nunca se combinen en silencio en un filtro imposible.
      destination: next.destination || "all",
      category: next.category,
      date: next.date,
      guests: next.guests,
      q: next.q,
    }));
  }

  return (
    <section className="ms-page ms-page-wide">
      <section className="my-5 grid gap-4">
        <div>
          <p className="ms-eyebrow">{t("Catalogo")}</p>
          <h1 className="m-0 font-serif text-[clamp(34px,6vw,72px)] leading-none text-ink">
            {t("Conoce nuestras experiencias")}
          </h1>
          <p className="text-muted">
            {rows.length} {t("experiencias para vivir Panama a tu manera.")}
          </p>
        </div>
        <CatalogSearchPanel
          key={`${filters.category}-${filters.destination}-${filters.date || ""}-${filters.guests || "2"}-${filters.q || ""}`}
          compact
          initialValues={filters}
          onSearch={applySearch}
        />
      </section>

      <section>
        {rows.length ? (
          <FallingExperienceGrid
            key={`${filters.destination}-${filters.category}-${filters.q || ""}`}
            experiences={rows}
            favoriteIds={favoriteIds}
            onFavorite={toggleFavorite}
            className="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          />
        ) : (
          <StateBlock title={t("Sin resultados")} text={t("Ajusta filtros o busca otro destino.")} />
        )}
      </section>
    </section>
  );
}

function filtersFromParams(searchParams) {
  if (searchParams.get("reset") === "1") return { ...DEFAULT_FILTERS };

  const next = { ...DEFAULT_FILTERS };
  if (searchParams.get("category")) next.category = searchParams.get("category");
  if (searchParams.get("destination")) next.destination = searchParams.get("destination");
  if (searchParams.get("q")) next.q = searchParams.get("q");
  if (searchParams.get("date")) next.date = searchParams.get("date");
  if (searchParams.get("guests")) next.guests = searchParams.get("guests");
  return next;
}
