import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { deleteOwnAccount, updateOwnProfile } from "../../../lib/services/auth-service.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { AvatarUploader } from "../components/AvatarUploader.jsx";

export function UserProfilePage() {
  const { fullName, email, profile, refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const form = new FormData(event.currentTarget);
    const { error: updateError } = await updateOwnProfile({ fullName: String(form.get("fullName") || "").trim() });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refresh();
    setSaved(true);
  }

  return (
    <>
      <section className="ms-panel p-5">
        <p className="ms-eyebrow">Area de cliente</p>
        <h1 className="m-0 font-serif text-[clamp(28px,4vw,40px)] text-ink">Perfil</h1>
        <p className="m-0 text-muted">Datos de tu cuenta.</p>
      </section>

      <section className="ms-panel mt-4 max-w-[520px] p-5">
        <AvatarUploader currentUrl={profile?.avatar_url} onUploaded={refresh} />
      </section>

      <form className="ms-panel mt-4 grid max-w-[520px] gap-3.5 p-5" onSubmit={handleSubmit}>
        <label>
          Nombre completo
          <input name="fullName" required defaultValue={fullName} placeholder="Nombre y apellido" />
        </label>
        <label>
          Email
          <input value={email || ""} disabled placeholder="No disponible" />
        </label>
        <p className="m-0 text-xs text-muted">El correo se cambia desde el enlace de recuperacion, no aqui.</p>

        {saved ? <StateBlock tone="success" title="Guardado" text="Tu perfil se actualizo." /> : null}
        {error ? <StateBlock tone="error" title="No se pudo guardar" text={error} /> : null}

        <button className="ms-button ms-button-primary w-fit" disabled={busy} type="submit">
          {busy ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <DangerZone />
    </>
  );
}

function DangerZone() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    const { error: deleteError } = await deleteOwnAccount();

    if (deleteError) {
      setBusy(false);
      setError(deleteError.message);
      return;
    }
    await refresh();
    navigate("/", { replace: true });
  }

  return (
    <section className="ms-panel mt-4 max-w-[520px] p-5" style={{ borderColor: "var(--warn, #a5560e)" }}>
      <p className="m-0 font-serif text-xl text-ink">Eliminar cuenta</p>
      <p className="m-0 mt-1 text-sm text-muted">
        Esto borra tu cuenta, tu perfil, tus favoritos y tus resenas de forma permanente. Tus reservas ya
        hechas se conservan (necesarias para nuestros registros), pero dejan de estar ligadas a una cuenta.
        Esta accion no se puede deshacer.
      </p>

      {error ? <div className="mt-3"><StateBlock tone="error" title="No se pudo eliminar" text={error} /></div> : null}

      {!confirming ? (
        <button
          className="ms-button ms-button-secondary mt-3 w-fit"
          type="button"
          onClick={() => setConfirming(true)}
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-3 grid gap-2">
          <p className="m-0 text-sm font-bold text-ink">
            ¿Seguro que quieres eliminar tu cuenta? No hay vuelta atras.
          </p>
          <div className="flex gap-2">
            <button className="ms-button ms-button-primary w-fit" disabled={busy} type="button" onClick={handleDelete}>
              {busy ? "Eliminando..." : "Si, eliminar mi cuenta"}
            </button>
            <button
              className="ms-button ms-button-secondary w-fit"
              disabled={busy}
              type="button"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
