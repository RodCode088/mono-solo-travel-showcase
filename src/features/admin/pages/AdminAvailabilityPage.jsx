import { useEffect, useState } from "react";
import { useState as useLocalState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { DateField } from "../../../components/ui/DateField.jsx";
import { SelectMenu } from "../../../components/ui/SelectMenu.jsx";
import { PanelHead } from "../../user/pages/PanelHead.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import {
  adminCreateAvailability,
  adminListAvailability,
  adminListExperiences,
  adminSetAvailabilityStatus,
  adminUpdateAvailability,
} from "../admin-service.js";

const EMPTY_FORM = { date: "", startTime: "", totalSpots: "10", priceOverride: "", status: "open" };

export function AdminAvailabilityPage() {
  const { experience: localizeExperience, t } = useLanguage();
  const [experiences, setExperiences] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminListExperiences().then(({ data, error: loadError }) => {
      if (loadError) {
        setError(loadError.message);
        setExperiences([]);
        return;
      }
      setExperiences(data || []);
      if (data && data.length) setSelectedId(data[0].id);
    });
  }, []);

  async function loadRows(expId) {
    if (!expId) {
      setRows([]);
      return;
    }
    setError(null);
    const { data, error: loadError } = await adminListAvailability(expId);
    if (loadError) {
      setError(loadError.message);
      setRows([]);
      return;
    }
    setRows(data || []);
  }

  useEffect(() => {
    if (selectedId) loadRows(selectedId);
  }, [selectedId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      date: form.get("date"),
      startTime: form.get("startTime"),
      totalSpots: form.get("totalSpots"),
      priceOverride: form.get("priceOverride"),
      status: form.get("status"),
    };

    const action = editing?.id
      ? adminUpdateAvailability(editing.id, payload)
      : adminCreateAvailability(selectedId, payload);
    const { error: saveError } = await action;
    setBusy(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    setNotice(editing?.id ? t("Fecha actualizada.") : t("Fecha agregada."));
    setEditing(null);
    await loadRows(selectedId);
  }

  async function toggleStatus(row) {
    setError(null);
    const next = row.status === "open" ? "closed" : "open";
    const { error: statusError } = await adminSetAvailabilityStatus(row.id, next);
    if (statusError) {
      setError(statusError.message);
      return;
    }
    await loadRows(selectedId);
  }

  return (
    <>
      <PanelHead
        eyebrow={t("Operacion")}
        title={t("Disponibilidad")}
        lead={t("Gestiona fechas, cupos y bloqueos por experiencia.")}
        actions={selectedId ? (
          <Button type="button" onClick={() => { setNotice(null); setEditing({ ...EMPTY_FORM }); }}>
            {t("Agregar fecha")}
          </Button>
        ) : null}
      />

      <div className="ms-stacked-field mt-4 max-w-[520px]">
        {t("Experiencia")}
        <SelectMenu
          name="experienceId"
          value={selectedId}
          onChange={(value) => { setEditing(null); setSelectedId(value); }}
          placeholder={experiences === null ? t("Cargando...") : t("Sin experiencias")}
          options={(experiences || []).map((exp) => ({ value: exp.id, label: localizeExperience(exp).title }))}
        />
      </div>

      {notice ? <div className="mt-4"><StateBlock tone="success" title={t("Listo")} text={notice} /></div> : null}
      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo completar")} text={error} /></div> : null}

      {editing ? (
        <AvailabilityForm editing={editing} busy={busy} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
      ) : null}

      {selectedId && rows === null ? (
        <section className="ms-panel mt-4 p-5"><ExperienceLoader compact message="Cargando disponibilidad..." /></section>
      ) : selectedId && rows.length === 0 ? (
        <section className="ms-panel mt-4 p-5">
          <StateBlock title={t("Sin fechas todavia")} text={t("Agrega la primera fecha con cupos para permitir reservas.")} />
        </section>
      ) : selectedId ? (
        <section className="ms-panel mt-4 overflow-auto p-5">
          <div className="grid gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="ms-admin-row grid min-w-[760px] grid-cols-[1fr_.7fr_.9fr_.9fr_auto_auto] items-center"
              >
                <div>
                  <strong className="block text-ink">{row.date}</strong>
                  <small className="text-muted">{row.startTime || t("sin hora")}</small>
                </div>
                <span>{row.bookedSpots}/{row.totalSpots} {t("cupos")}</span>
                <span>{row.priceOverride != null ? money(row.priceOverride) : t("precio base")}</span>
                <StatusBadge value={row.status === "open" ? "available" : "blocked"} />
                <Button type="button" variant="secondary" onClick={() => { setNotice(null); setEditing({ id: row.id, date: row.date, startTime: row.startTime || "", totalSpots: String(row.totalSpots), priceOverride: row.priceOverride ?? "", status: row.status }); }}>
                  {t("Editar")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => toggleStatus(row)}>
                  {row.status === "open" ? t("Bloquear") : t("Abrir")}
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function AvailabilityForm({ editing, busy, onSubmit, onCancel }) {
  const { t } = useLanguage();
  const [date, setDate] = useLocalState(editing.date || "");
  const [status, setStatus] = useLocalState(editing.status || "open");

  return (
    <form className="ms-panel ms-booking-form mt-4 grid gap-3.5 p-5" onSubmit={onSubmit}>
      <h2 className="m-0 font-serif text-2xl text-ink">{editing.id ? t("Editar fecha") : t("Nueva fecha")}</h2>
      <div className="grid gap-3.5 md:grid-cols-2">
        <label className="ms-stacked-field">
          {t("Fecha")}
          <DateField name="date" value={date} onChange={setDate} clearable={false} />
        </label>
        <label>
          {t("Hora de inicio")}
          <input name="startTime" type="time" defaultValue={editing.startTime} />
        </label>
        <label>
          {t("Cupos totales")}
          <input name="totalSpots" type="number" min="0" step="1" required defaultValue={editing.totalSpots} />
        </label>
        <label>
          {t("Precio especial (opcional)")}
          <input name="priceOverride" type="number" min="0" step="0.01" defaultValue={editing.priceOverride} placeholder={t("Vacio = precio base")} />
        </label>
      </div>
      <label className="ms-stacked-field max-w-[320px]">
        {t("Estado")}
        <SelectMenu
          name="status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "open", label: t("Abierta") },
            { value: "closed", label: t("Cerrada / bloqueada") },
          ]}
        />
      </label>
      <div className="flex gap-2">
        <button className="ms-button ms-button-primary" disabled={busy} type="submit">
          {busy ? t("Guardando...") : t("Guardar")}
        </button>
        <button className="ms-button ms-button-secondary" type="button" onClick={onCancel}>{t("Cancelar")}</button>
      </div>
    </form>
  );
}
