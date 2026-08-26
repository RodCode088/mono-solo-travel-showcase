import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import { adminListCustomers } from "../admin-service.js";

export function AdminCustomersPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    const { data, error: loadError } = await adminListCustomers();
    if (loadError) {
      setError(loadError.message);
      setRows([]);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <section className="ms-panel p-5">
        <p className="ms-eyebrow">{t("Clientes")}</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="m-0 font-serif text-[clamp(28px,4vw,44px)] text-ink">{t("Clientes")}</h1>
            <p className="m-0 text-muted">{t("Clientes registrados y su historial de reservas.")}</p>
          </div>
          <Button type="button" variant="secondary" onClick={load}>{t("Actualizar")}</Button>
        </div>
      </section>

      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo cargar")} text={error} /></div> : null}

      {rows === null ? (
        <section className="ms-panel mt-4 p-5"><ExperienceLoader compact message="Cargando viajeros..." /></section>
      ) : rows.length === 0 ? (
        <section className="ms-panel mt-4 p-5">
          <StateBlock title={t("Sin clientes registrados")} text={t("Cuando un cliente cree cuenta y reserve, aparecera aqui.")} />
        </section>
      ) : (
        <section className="ms-panel mt-4 overflow-auto p-5">
          <div className="grid gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-[900px] grid-cols-[1.6fr_1.2fr_.7fr_.9fr_.9fr_1fr] items-center gap-2 rounded-[10px] border border-line bg-surface-2 p-3 text-sm"
              >
                <div>
                  <strong className="block text-ink">{row.fullName}</strong>
                  <small className="text-muted">{row.email}</small>
                </div>
                <span>{row.phone}</span>
                <span>{row.bookingCount} {t("reservas")}</span>
                <span>{money(row.totalSpent)}</span>
                <span className="text-muted">{row.lastBookingAt ? String(row.lastBookingAt).slice(0, 10) : "-"}</span>
                <span className="text-muted">
                  {t("Registro:")} {row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
