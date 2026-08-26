import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { getSession, updatePassword } from "../../../lib/services/auth-service.js";
import { isSupabase } from "../../../lib/supabase/client.js";
import { useAuth } from "../AuthContext.jsx";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    // El link de recuperacion aterriza aca con un token; el cliente de
    // Supabase lo parsea y establece una sesion temporal. Dale un tick y despues revisa.
    const timer = setTimeout(async () => {
      if (!isSupabase()) {
        if (active) {
          setHasSession(true);
          setReady(true);
        }
        return;
      }
      const { data: session } = await getSession();
      if (active) {
        setHasSession(Boolean(session));
        setReady(true);
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setBusy(true);
    const { error: updateError } = await updatePassword(password);
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refresh();
    setDone(true);
  }

  if (!ready) {
    return (
      <section className="ms-page">
        <div className="mx-auto max-w-[460px]">
          <StateBlock title="Validando enlace" text="Un momento." />
        </div>
      </section>
    );
  }

  if (done) {
    return (
      <section className="ms-page">
        <div className="mx-auto max-w-[460px]">
          <div className="ms-panel grid gap-3 p-[22px]">
            <StateBlock tone="success" title="Contrasena actualizada" text="Ya puedes usar tu nueva contrasena." />
            <button className="ms-button ms-button-primary w-fit" type="button" onClick={() => navigate("/usuario/dashboard")}>
              Ir a mi cuenta
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!hasSession) {
    return (
      <section className="ms-page">
        <div className="mx-auto max-w-[460px]">
          <div className="ms-panel grid gap-3 p-[22px]">
            <p className="ms-eyebrow">Area de cliente</p>
            <h1 className="m-0 font-serif text-[clamp(26px,5vw,38px)] text-ink">Enlace no valido</h1>
            <StateBlock
              tone="error"
              title="Abre el enlace desde tu correo"
              text="Este paso requiere el enlace de recuperacion que enviamos por email. Solicita uno nuevo si expiro."
            />
            <Link className="ms-button ms-button-secondary w-fit" to="/recuperar">Solicitar enlace</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ms-page">
      <div className="mx-auto max-w-[460px]">
        <form className="ms-panel grid gap-3.5 p-[22px]" onSubmit={handleSubmit}>
          <p className="ms-eyebrow">Area de cliente</p>
          <h1 className="m-0 font-serif text-[clamp(28px,5vw,40px)] leading-none text-ink">Nueva contrasena</h1>
          <label>
            Nueva contrasena
            <input name="password" type="password" required autoComplete="new-password" minLength={6} placeholder="Minimo 6 caracteres" />
          </label>
          <label>
            Repetir contrasena
            <input name="confirm" type="password" required autoComplete="new-password" minLength={6} placeholder="Repite la contrasena" />
          </label>

          {error ? <StateBlock tone="error" title="No se pudo actualizar" text={error} /> : null}

          <button className="ms-button ms-button-primary" disabled={busy} type="submit">
            {busy ? "Guardando..." : "Guardar contrasena"}
          </button>
        </form>
      </div>
    </section>
  );
}
