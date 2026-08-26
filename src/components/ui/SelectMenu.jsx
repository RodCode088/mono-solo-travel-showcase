import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext.jsx";
import { usePopover } from "./use-popover.js";

/**
 * Menu desplegable propio.
 *
 * El `<select>` nativo no permite diseñar la lista de opciones: en cada
 * navegador se ve distinto y no admite agrupar con estilo, marcar la opcion
 * activa ni filtrar. Este componente rinde un listbox real (con teclado) y
 * conserva un input oculto con el `name` original, de forma que los formularios
 * que leen FormData no cambian.
 *
 * `options` acepta entradas planas `{ value, label, hint }` y grupos
 * `{ group, options: [...] }`.
 */
export function SelectMenu({
  name,
  value,
  onChange,
  options,
  placeholder,
  id,
  searchable = "auto",
  align = "start",
}) {
  const { t } = useLanguage();
  const { open, setOpen, placement, anchorRef, panelRef } = usePopover();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);

  const flat = useMemo(() => flatten(options), [options]);
  const showSearch = searchable === true || (searchable === "auto" && flat.length > 12);

  const visible = useMemo(() => {
    if (!query.trim()) return options;
    const needle = query.trim().toLowerCase();
    return filterOptions(options, needle);
  }, [options, query]);

  const visibleFlat = useMemo(() => flatten(visible), [visible]);
  const selected = flat.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const index = visibleFlat.findIndex((option) => String(option.value) === String(value));
    setActiveIndex(index >= 0 ? index : 0);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector('[data-active="true"]');
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(option) {
    onChange?.(option.value);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = current + step;
        if (next < 0) return visibleFlat.length - 1;
        if (next >= visibleFlat.length) return 0;
        return next;
      });
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = visibleFlat[activeIndex];
      if (option) commit(option);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !open) {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <span className="ms-field-shell" ref={anchorRef}>
      <input type="hidden" name={name} value={value ?? ""} />
      <button
        className="ms-field-trigger"
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-filled={selected ? "" : undefined}
        onKeyDown={handleKeyDown}
        onClick={() => setOpen((state) => !state)}
      >
        <span className="truncate">
          {selected ? (selected.hint ? `${selected.label} · ${selected.hint}` : selected.label) : (placeholder || t("Selecciona"))}
        </span>
        <ChevronDown className="ms-field-caret" size={17} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="ms-popover ms-popover-menu"
          data-placement={placement}
          data-align={align}
          ref={panelRef}
        >
          {showSearch ? (
            <div className="ms-menu-search">
              <Search size={15} aria-hidden="true" />
              <input
                autoFocus
                type="search"
                value={query}
                placeholder={t("Filtrar")}
                onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
                onKeyDown={handleKeyDown}
              />
            </div>
          ) : null}

          <div className="ms-menu-list" role="listbox" ref={listRef}>
            {visibleFlat.length === 0 ? (
              <p className="ms-menu-empty">{t("Sin resultados")}</p>
            ) : (
              renderOptions(visible, {
                value,
                activeValue: visibleFlat[activeIndex]?.value,
                onPick: commit,
              })
            )}
          </div>
        </div>
      ) : null}
    </span>
  );
}

function renderOptions(options, ctx) {
  return options.map((entry, index) => {
    if (entry.group) {
      if (!entry.options?.length) return null;
      return (
        <div className="ms-menu-group" key={`group-${entry.group}-${index}`}>
          {entry.groupValue ? (
            <button
              type="button"
              className="ms-menu-group-trigger"
              aria-selected={String(entry.groupValue) === String(ctx.value)}
              onClick={() => ctx.onPick({ value: entry.groupValue, label: entry.group })}
            >
              <span>{entry.group}{entry.groupHint ? <small> · {entry.groupHint}</small> : null}</span>
            </button>
          ) : (
            <p>{entry.group}{entry.groupHint ? ` · ${entry.groupHint}` : ""}</p>
          )}
          {entry.options.map((option) => renderOption(option, ctx))}
        </div>
      );
    }
    return renderOption(entry, ctx);
  });
}

function renderOption(option, { value, activeValue, onPick }) {
  const isSelected = String(option.value) === String(value);
  return (
    <button
      key={String(option.value)}
      type="button"
      role="option"
      className="ms-menu-option"
      aria-selected={isSelected}
      data-active={String(option.value) === String(activeValue) ? "true" : undefined}
      onClick={() => onPick(option)}
    >
      <span>
        {option.label}
        {option.hint ? <small>{option.hint}</small> : null}
      </span>
      {isSelected ? <Check size={15} aria-hidden="true" /> : null}
    </button>
  );
}

function flatten(options) {
  return options.flatMap((entry) => {
    if (!entry.group) return [entry];
    const groupOption = entry.groupValue ? [{ value: entry.groupValue, label: entry.group, hint: entry.groupHint }] : [];
    return [...groupOption, ...(entry.options || [])];
  });
}

function filterOptions(options, needle) {
  return options
    .map((entry) => {
      if (!entry.group) {
        return String(entry.label).toLowerCase().includes(needle) ? entry : null;
      }
      const kept = (entry.options || []).filter((option) => String(option.label).toLowerCase().includes(needle));
      return kept.length ? { ...entry, options: kept } : null;
    })
    .filter(Boolean);
}
