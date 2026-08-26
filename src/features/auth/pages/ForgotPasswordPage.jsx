import { useState } from "react";
import { Link } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { requestPasswordReset } from "../../../lib/services/auth-service.js";

export function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const { error: resetError } = await requestPasswordReset(String(form.get("email") || "").trim());
    setBusy(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <section className="ms-page">
      <div className="mx-auto max-w-[460px]">
        <form className="ms-panel grid gap-3.5 p-[22px]" onSubmit={handleSubmit}>
          <p className="ms-eyebrow">Area de cliente</p>
          <h1 className="m-0 font-serif text-[clamp(28px,5vw,40px)] leading-none text-ink">Recuperar contrasena</h1>
          <p className="m-0 text-muted">Te enviaremos un enlace para crear una nueva contrasena.</p>

          <label>
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="cliente@email.com" />
          </label>

          {sent ? (
            <StateBlock
              tone="success"
              title="Revisa tu correo"
              text="Si el correo existe, recibiras un enlace para restablecer tu contrasena."
            />
          ) : null}
          {error ? <StateBlock tone="error" title="No se pudo enviar" text={error} /> : null}

          <button className="ms-button ms-button-primary" disabled={busy || sent} type="submit">
            {busy ? "Enviando..." : "Enviar enlace"}
          </button>

          <p className="m-0 text-sm font-bold text-muted">
            <Link className="text-green hover:underline" to="/login">Volver a iniciar sesion</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
