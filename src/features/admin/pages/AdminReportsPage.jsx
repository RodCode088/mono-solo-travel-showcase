import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import { adminGetReports } from "../admin-service.js";

export function AdminReportsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    const { data: report, error: loadError } = await adminGetReports();
    if (loadError) {
      setError(loadError.message);
      setData(null);
      return;
    }
    setData(report);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <section className="ms-panel p-5">
        <p className="ms-eyebrow">{t("Reportes")}</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="m-0 font-serif text-[clamp(28px,4vw,44px)] text-ink">{t("Reportes")}</h1>
            <p className="m-0 text-muted">{t("Metricas reales calculadas desde reservas, pagos y cupos.")}</p>
          </div>
          <Button type="button" variant="secondary" onClick={load}>{t("Actualizar")}</Button>
        </div>
      </section>

      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo cargar")} text={error} /></div> : null}

      {data === null ? (
        <section className="ms-panel mt-4 p-5"><ExperienceLoader compact message="Cargando estadisticas de viaje..." /></section>
      ) : !data.hasData ? (
        <section className="ms-panel mt-4 p-5">
          <StateBlock title={t("Sin datos todavia")} text={t("Cuando existan reservas y cupos, las metricas apareceran aqui.")} />
        </section>
      ) : (
        <>
          <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <Metric label={t("Reservas totales")} value={data.totalBookings} />
            <Metric label={t("Pendientes")} value={data.pending} />
            <Metric label={t("Confirmadas")} value={data.confirmed} />
            <Metric label={t("En revision")} value={data.underReview} />
            <Metric label={t("Canceladas")} value={data.cancelled} />
            <Metric label={t("Ingresos aprobados")} value={money(data.revenueApproved)} />
            <Metric label={t("Clientes con cuenta")} value={data.registeredCustomers} />
            <Metric label={t("Cupos vendidos")} value={`${data.bookedSpots}/${data.totalSpots}`} />
            <Metric label={t("Ocupacion")} value={data.occupancy != null ? `${data.occupancy}%` : "-"} />
          </section>
          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <ChartPanel title={t("Estado de reservas")}>
              <MiniBar label={t("Pendientes")} value={data.pending} max={data.totalBookings} color="bg-warn" />
              <MiniBar label={t("En revision")} value={data.underReview} max={data.totalBookings} color="bg-teal" />
              <MiniBar label={t("Confirmadas")} value={data.confirmed} max={data.totalBookings} color="bg-green" />
              <MiniBar label={t("Canceladas")} value={data.cancelled} max={data.totalBookings} color="bg-red" />
            </ChartPanel>
            <ChartPanel title={t("Ocupacion publicada")}>
              <MiniBar label={t("Cupos vendidos")} value={data.bookedSpots} max={data.totalSpots} color="bg-green" />
              <MiniBar label={t("Cupos disponibles")} value={Math.max(data.totalSpots - data.bookedSpots, 0)} max={data.totalSpots} color="bg-teal" />
              <p className="m-0 text-sm text-muted">
                {t("La ocupacion se calcula como cupos reservados sobre cupos totales publicados.")}
              </p>
            </ChartPanel>
          </section>
          <p className="mt-3 text-xs text-muted">
            {t("Ingresos aprobados = suma de pagos con estado aprobado. Como el pago dejo de ser obligatorio, esta metrica puede estar en cero aunque existan reservas.")}
          </p>
        </>
      )}
    </>
  );
}

function ChartPanel({ children, title }) {
  return (
    <section className="rounded-[10px] border border-line bg-surface p-4">
      <h2 className="m-0 font-serif text-2xl text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function MiniBar({ color, label, max, value }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-black text-ink">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-bg">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <span className="block text-[11px] font-black uppercase tracking-[.06em] text-muted">{label}</span>
      <strong className="mt-2 block text-2xl text-ink">{value}</strong>
    </article>
  );
}
