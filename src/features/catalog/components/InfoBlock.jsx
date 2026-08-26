import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";

export function InfoBlock({ title, children, id }) {
  return (
    <section id={id} className="ms-nature-panel p-[18px]">
      <h2 className="m-0 mb-2.5 text-2xl font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function CheckList({ items }) {
  const { t } = useLanguage();
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!rows.length) return <p className="m-0 text-muted">{t("Consulta este detalle directo con Mono Solo.")}</p>;

  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {rows.map((item) => (
        <li key={item} className="relative pl-6 before:absolute before:left-0.5 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-teal">
          {item}
        </li>
      ))}
    </ul>
  );
}
