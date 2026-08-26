import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button.jsx";
import { ExperienceLoader } from "../../../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { StatusBadge } from "../../../components/ui/StatusBadge.jsx";
import { monoCategories, provinceOptions } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { money } from "../../../lib/services/format.js";
import {
  adminCreateExperience,
  adminListExperiences,
  adminSetExperienceStatus,
  adminUpdateExperience,
  removeExperiencePhoto,
  uploadExperiencePhoto,
} from "../admin-service.js";

const EMPTY_FORM = {
  title: "",
  slug: "",
  summary: "",
  basePrice: "",
  duration: "",
  minGuests: "1",
  maxGuests: "10",
  status: "draft",
  category: "",
  province: "",
  promoRank: "",
  fullDescription: "",
  meetingPoint: "",
  cancellationPolicy: "",
  itinerary: [],
  included: [],
  notIncluded: [],
  requirements: [],
  images: [],
  hasCustomImages: false,
};

export function AdminExperiencesPage({ create = false }) {
  const { t } = useLanguage();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(create ? { ...EMPTY_FORM } : null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    const { data, error: loadError } = await adminListExperiences();
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

  function startCreate() {
    setNotice(null);
    setEditing({ ...EMPTY_FORM });
  }

  function startEdit(row) {
    setNotice(null);
    setEditing({
      id: row.id,
      title: row.title || "",
      slug: row.slug || "",
      summary: row.summary || "",
      basePrice: row.basePrice ?? "",
      duration: row.duration ?? "",
      minGuests: String(row.minGuests ?? 1),
      maxGuests: String(row.maxGuests ?? 10),
      status: row.status || "draft",
      category: row.category || "",
      province: row.province || "",
      promoRank: row.promoRank ? String(row.promoRank) : "",
      fullDescription: row.fullDescription || "",
      meetingPoint: row.meetingPoint || "",
      cancellationPolicy: row.cancellationPolicy || "",
      itinerary: row.itinerary || [],
      included: row.included || [],
      notIncluded: row.notIncluded || [],
      requirements: row.requirements || [],
      images: row.images || [],
      hasCustomImages: Boolean(row.hasCustomImages),
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get("title"),
      slug: form.get("slug"),
      summary: form.get("summary"),
      basePrice: form.get("basePrice"),
      duration: form.get("duration"),
      minGuests: form.get("minGuests"),
      maxGuests: form.get("maxGuests"),
      status: form.get("status"),
      category: form.get("category"),
      province: form.get("province"),
      promoRank: form.get("promoRank"),
      fullDescription: form.get("fullDescription"),
      meetingPoint: form.get("meetingPoint"),
      cancellationPolicy: form.get("cancellationPolicy"),
      itinerary: form.get("itinerary"),
      included: form.get("included"),
      notIncluded: form.get("notIncluded"),
      requirements: form.get("requirements"),
    };

    const action = editing?.id
      ? adminUpdateExperience(editing.id, payload)
      : adminCreateExperience(payload);
    const { error: saveError } = await action;
    setBusy(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    setNotice(editing?.id ? t("Experiencia actualizada.") : t("Experiencia creada."));
    setEditing(null);
    await load();
  }

  async function toggleStatus(row) {
    setError(null);
    const next = row.status === "active" ? "paused" : "active";
    const { error: statusError } = await adminSetExperienceStatus(row.id, next);
    if (statusError) {
      setError(statusError.message);
      return;
    }
    await load();
  }

  return (
    <>
      <section className="ms-panel p-5">
        <p className="ms-eyebrow">{t("Catalogo")}</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="m-0 font-serif text-[clamp(28px,4vw,44px)] text-ink">{t("Experiencias")}</h1>
            <p className="m-0 text-muted">{t("Crea, edita y publica experiencias. Los cambios se guardan en Supabase.")}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={load}>{t("Actualizar")}</Button>
            <Button type="button" onClick={startCreate}>{t("Nueva experiencia")}</Button>
          </div>
        </div>
      </section>

      {notice ? <div className="mt-4"><StateBlock tone="success" title={t("Listo")} text={notice} /></div> : null}
      {error ? <div className="mt-4"><StateBlock tone="error" title={t("No se pudo completar")} text={error} /></div> : null}

      {editing ? (
        <ExperienceForm editing={editing} busy={busy} onSubmit={handleSubmit} onCancel={() => setEditing(null)} />
      ) : null}

      {rows === null ? (
        <section className="ms-panel mt-4 p-5"><ExperienceLoader compact /></section>
      ) : rows.length === 0 ? (
        <section className="ms-panel mt-4 p-5">
          <StateBlock title={t("Sin experiencias")} text={t("Crea la primera experiencia para publicarla en el catalogo.")} />
        </section>
      ) : (
        <section className="ms-panel mt-4 overflow-auto p-5">
          <div className="grid gap-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid min-w-[760px] grid-cols-[1.7fr_.7fr_.7fr_.8fr_auto_auto] items-center gap-2 rounded-[10px] border border-line bg-surface-2 p-3 text-sm"
              >
                <div>
                  <strong className="block text-ink">
                    {row.title}
                    {row.promoRank ? <span className="ml-1.5 text-gold" title={t("Destacada")}>{row.promoRank === 1 ? "★" : "☆"}</span> : null}
                  </strong>
                  <small className="text-muted">
                    /{row.slug}{row.isDemo ? " · demo" : ""}
                    {row.category ? ` · ${t(row.category)}` : ""}
                    {row.province ? ` (${provinceOptions.find((p) => p.value === row.province)?.label || row.province})` : ""}
                  </small>
                </div>
                <span>{money(row.basePrice)}</span>
                <span>{row.minGuests}-{row.maxGuests} pax</span>
                <StatusBadge value={row.status} />
                <Button type="button" variant="secondary" onClick={() => startEdit(row)}>{t("Editar")}</Button>
                <Button type="button" variant="secondary" onClick={() => toggleStatus(row)}>
                  {row.status === "active" ? t("Pausar") : t("Activar")}
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ExperienceForm({ editing, busy, onSubmit, onCancel }) {
  const { t } = useLanguage();
  return (
    <form className="ms-panel mt-4 grid gap-3.5 p-5" onSubmit={onSubmit}>
      <h2 className="m-0 font-serif text-2xl text-ink">{editing.id ? t("Editar experiencia") : t("Nueva experiencia")}</h2>
      <div className="grid gap-3.5 md:grid-cols-2">
        <label>
          {t("Titulo")}
          <input name="title" required defaultValue={editing.title} placeholder={t("Nombre de la experiencia")} />
        </label>
        <label>
          {t("Slug (URL)")}
          <input name="slug" defaultValue={editing.slug} placeholder={t("se-genera-del-titulo")} />
        </label>
      </div>
      <label>
        {t("Resumen (tarjetas del catalogo)")}
        <input name="summary" defaultValue={editing.summary} placeholder={t("Descripcion corta para las tarjetas")} />
      </label>
      <label>
        {t("Descripcion completa (pagina de la experiencia)")}
        <textarea name="fullDescription" rows={5} defaultValue={editing.fullDescription} placeholder={t("Usar la del catalogo estatico")} />
      </label>
      <div className="grid gap-3.5 md:grid-cols-4">
        <label>
          {t("Precio base (USD)")}
          <input name="basePrice" type="number" min="0" step="0.01" required defaultValue={editing.basePrice} />
        </label>
        <label>
          {t("Duracion (h)")}
          <input name="duration" type="number" min="0" step="0.5" defaultValue={editing.duration} />
        </label>
        <label>
          {t("Min. pax")}
          <input name="minGuests" type="number" min="1" step="1" required defaultValue={editing.minGuests} />
        </label>
        <label>
          {t("Max. pax")}
          <input name="maxGuests" type="number" min="1" step="1" required defaultValue={editing.maxGuests} />
        </label>
      </div>
      <div className="grid gap-3.5 md:grid-cols-3">
        <label>
          {t("Estado")}
          <select name="status" defaultValue={editing.status}>
            <option value="active">{t("Activa (visible en catalogo)")}</option>
            <option value="paused">{t("Pausada")}</option>
            <option value="draft">{t("Borrador")}</option>
          </select>
        </label>
        <label>
          {t("Categoria")}
          <select name="category" defaultValue={editing.category}>
            <option value="">{t("Usar la del catalogo estatico")}</option>
            {monoCategories.map((category) => (
              <option key={category.id} value={category.name}>{t(category.name)}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Provincia")}
          <select name="province" defaultValue={editing.province}>
            <option value="">{t("Usar la del catalogo estatico")}</option>
            {provinceOptions.map((province) => (
              <option key={province.value} value={province.value}>{province.label}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="m-0 -mt-2 text-xs text-muted">
        {t("Elige categoria Y provincia juntas para que el filtro publico refleje el cambio. Si dejas una en blanco, se sigue usando el catalogo estatico para las dos.")}
      </p>
      <label>
        {t("Destacada")}
        <select name="promoRank" defaultValue={editing.promoRank}>
          <option value="">{t("Ninguna")}</option>
          <option value="1">{t("Principal (banner del inicio + primera del catalogo)")}</option>
          <option value="2">{t("Secundaria (segunda del catalogo)")}</option>
        </select>
      </label>
      <label>
        {t("Punto de encuentro")}
        <input name="meetingPoint" defaultValue={editing.meetingPoint} placeholder={t("Usar el del catalogo estatico")} />
      </label>
      <div className="grid gap-3.5 md:grid-cols-2">
        <label>
          {t("Itinerario (un paso por linea)")}
          <textarea name="itinerary" rows={5} defaultValue={editing.itinerary.join("\n")} placeholder={t("Usar el del catalogo estatico")} />
        </label>
        <label>
          {t("Requisitos (uno por linea)")}
          <textarea name="requirements" rows={5} defaultValue={editing.requirements.join("\n")} placeholder={t("Usar los del catalogo estatico")} />
        </label>
        <label>
          {t("Que incluye (uno por linea)")}
          <textarea name="included" rows={5} defaultValue={editing.included.join("\n")} placeholder={t("Usar el del catalogo estatico")} />
        </label>
        <label>
          {t("Que NO incluye (uno por linea)")}
          <textarea name="notIncluded" rows={5} defaultValue={editing.notIncluded.join("\n")} placeholder={t("Usar el del catalogo estatico")} />
        </label>
      </div>
      <label>
        {t("Politica de cancelacion")}
        <textarea name="cancellationPolicy" rows={3} defaultValue={editing.cancellationPolicy} placeholder={t("Usar la del catalogo estatico")} />
      </label>

      {editing.id ? (
        <PhotoManager
          experienceId={editing.id}
          initialImages={editing.images}
          initialHasCustomImages={editing.hasCustomImages}
        />
      ) : (
        <p className="m-0 text-xs text-muted">{t("Guarda la experiencia primero para poder subirle fotos.")}</p>
      )}

      <div className="flex gap-2">
        <button className="ms-button ms-button-primary" disabled={busy} type="submit">
          {busy ? t("Guardando...") : t("Guardar")}
        </button>
        <button className="ms-button ms-button-secondary" type="button" onClick={onCancel}>{t("Cancelar")}</button>
      </div>
    </form>
  );
}

// Las fotos se manejan aparte del submit del formulario: subir/quitar pega
// directo contra Supabase Storage + experiences.images, no hace falta
// guardar el resto del formulario para que una foto quede aplicada.
function PhotoManager({ experienceId, initialImages, initialHasCustomImages }) {
  const { t } = useLanguage();
  const [images, setImages] = useState(initialImages || []);
  const [hasCustomImages, setHasCustomImages] = useState(Boolean(initialHasCustomImages));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const isStaticPreview = images.length > 0 && !hasCustomImages;

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    const baseImages = isStaticPreview ? [] : images;
    const { data, error: uploadError } = await uploadExperiencePhoto(experienceId, file, baseImages);
    setBusy(false);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setImages(data.images);
    setHasCustomImages(true);
  }

  async function handleRemove(url) {
    setBusy(true);
    setError(null);
    const { data, error: removeError } = await removeExperiencePhoto(experienceId, url, images);
    setBusy(false);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setImages(data.images);
  }

  return (
    <div className="grid gap-2 rounded-[10px] border border-line p-3">
      <strong className="text-sm text-ink">{t("Fotos")}</strong>
      {isStaticPreview ? (
        <p className="m-0 text-xs text-muted">
          {t("Estas son las fotos actuales del catalogo estatico. Al subir una foto nueva, la galeria pasa a manejarse desde aca (reemplaza estas).")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {images.map((url) => (
          <div key={url} className="relative">
            <img src={url} alt="" className="h-20 w-20 rounded-[8px] object-cover" />
            {!isStaticPreview ? (
              <button
                type="button"
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red text-xs text-white"
                onClick={() => handleRemove(url)}
                disabled={busy}
                aria-label={t("Quitar foto")}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <label className="ms-button ms-button-secondary w-fit cursor-pointer">
        {busy ? t("Subiendo...") : t("Subir foto")}
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={busy} />
      </label>
      {error ? <p className="m-0 text-xs text-red">{error}</p> : null}
    </div>
  );
}
