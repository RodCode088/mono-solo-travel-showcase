import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DateField } from "../../../components/ui/DateField.jsx";
import { GuestField } from "../../../components/ui/GuestField.jsx";
import { SelectMenu } from "../../../components/ui/SelectMenu.jsx";
import { todayISO } from "../../../components/ui/Calendar.jsx";
import { db } from "../../../data/db.js";
import { destinationDisplayName } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";

export function CatalogSearchPanel({ compact = false, variant = "default", initialValues = {}, onSearch }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [category, setCategory] = useState(initialValues.category || "all");
  const [destination, setDestination] = useState(initialValues.destination || "all");
  const [date, setDate] = useState(initialValues.date || "");
  const [guests, setGuests] = useState(Number(initialValues.guests) || 2);
  const [query, setQuery] = useState(initialValues.q || "");

  const categoryOptions = useMemo(() => buildCategoryOptions(db.catalogGroups, t), [t]);
  // El destino se codifica como "dest:<nombre>" dentro del mismo selector de
  // categoria: es lo que se elige al hacer click en el encabezado de un grupo
  // (p.ej. "From Panama City") para pedir todas sus categorias a la vez.
  const selectedCategoryValue = destination !== "all" ? `dest:${destination}` : category;

  function buildNext(overrides = {}) {
    return {
      category: overrides.category ?? category,
      destination: overrides.destination ?? destination,
      date: overrides.date ?? date,
      guests: String(overrides.guests ?? guests ?? 2),
      q: (overrides.q ?? query).trim(),
    };
  }

  function applyFilters(next) {
    if (onSearch) onSearch(next);
    const params = new URLSearchParams();
    if (next.category && next.category !== "all") params.set("category", next.category);
    if (next.destination && next.destination !== "all") params.set("destination", next.destination);
    if (next.date) params.set("date", next.date);
    if (next.guests !== "2") params.set("guests", next.guests);
    if (next.q) params.set("q", next.q);
    navigate(`/experiencias${params.toString() ? `?${params}` : ""}`);
  }

  function handleSubmit(event) {
    event.preventDefault();
    applyFilters(buildNext());
  }

  // La categoria (y el "todas las de este destino") se aplican al elegirlas,
  // sin esperar al submit del formulario: es el filtro principal y el cliente
  // pidio que abra resultados de inmediato.
  function handleCategoryChange(value) {
    if (typeof value === "string" && value.startsWith("dest:")) {
      const nextDestination = value.slice(5);
      setCategory("all");
      setDestination(nextDestination);
      applyFilters(buildNext({ category: "all", destination: nextDestination }));
    } else {
      setCategory(value);
      setDestination("all");
      applyFilters(buildNext({ category: value, destination: "all" }));
    }
  }

  return (
    <form
      className={`ms-searchbar ${variant === "hero" ? "ms-searchbar-hero" : ""} ${compact ? "is-compact" : ""}`}
      onSubmit={handleSubmit}
    >
      <Field label={t("Categoria")}>
        <SelectMenu
          name="category"
          value={selectedCategoryValue}
          onChange={handleCategoryChange}
          options={categoryOptions}
          placeholder={t("Todas")}
        />
      </Field>

      <Field label={t("Fecha")}>
        <DateField
          name="date"
          value={date}
          onChange={setDate}
          min={todayISO()}
          placeholder={t("Cualquier fecha")}
        />
      </Field>

      <Field label={t("Personas")}>
        <GuestField name="guests" value={guests} onChange={setGuests} min={1} max={12} />
      </Field>

      <Field label={t("Buscar")}>
        <span className="ms-search-input">
          <Search size={17} aria-hidden="true" />
          <input
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Buscar por nombre")}
          />
        </span>
      </Field>

      <button className="ms-button ms-button-primary ms-searchbar-submit" type="submit">
        <Search size={17} aria-hidden="true" />
        <span>{t("Buscar experiencias")}</span>
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div className="ms-searchbar-field">
      <span className="ms-searchbar-label">{label}</span>
      {children}
    </div>
  );
}

// Los grupos "flat" son categorias independientes (no cuelgan de un destino),
// asi que se listan sueltas en vez de dentro de un grupo que repetiria el mismo
// nombre dos veces.
function buildCategoryOptions(catalogGroups, t) {
  const options = [{ value: "all", label: t("Todas las categorias") }];
  for (const group of catalogGroups) {
    if (group.flat) {
      for (const category of group.categories) {
        options.push({
          value: category.name,
          label: t(category.name),
          hint: category.province ? t(category.province) : undefined,
        });
      }
      continue;
    }
    // El encabezado solo es clickable cuando agrupa mas de una categoria: con
    // una sola, elegir la categoria de abajo ya trae el mismo resultado y un
    // segundo boton identico solo confundiria (caso de Boquete, Los Santos,
    // Kuna Yala, hoy con una categoria cada uno).
    const groupSelectsAll = group.categories.length > 1;
    const groupLabel = t(destinationDisplayName(group.destination));
    const groupProvince = group.province ? t(group.province) : undefined;
    options.push({
      group: groupLabel,
      // Click en el encabezado del grupo = todas las categorias de ese
      // destino/provincia a la vez (filters.destination, category "all").
      groupValue: groupSelectsAll ? `dest:${group.destination}` : undefined,
      // Si la provincia ya es literalmente el nombre del encabezado (Colon,
      // Kuna Yala), repetirla como hint solo se ve redundante ("Colón · Colón").
      groupHint: groupProvince && groupProvince !== groupLabel ? groupProvince : undefined,
      options: group.categories.map((category) => ({
        value: category.name,
        label: t(category.name),
        hint: category.province ? t(category.province) : undefined,
      })),
    });
  }
  return options;
}
