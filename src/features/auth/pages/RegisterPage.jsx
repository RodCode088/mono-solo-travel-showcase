import { AtSign, Phone, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PasswordField, TextField } from "../../../components/ui/TextField.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { homeCoverImages } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { signUpCustomer } from "../../../lib/services/auth-service.js";
import { useAuth } from "../AuthContext.jsx";
import { AuthShell } from "../components/AuthShell.jsx";

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [password, setPassword] = useState("");
  const redirectTo = location.state?.from || "/usuario/dashboard";
  const isBookingAccess = String(redirectTo).startsWith("/reservar") || String(redirectTo).startsWith("/checkout");

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const pass = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (pass.length < 6) {
      setError(t("La contrasena debe tener al menos 6 caracteres."));
      return;
    }
    if (pass !== confirm) {
      setError(t("Las contrasenas no coinciden."));
      return;
    }

    setBusy(true);
    const { data, error: signUpError } = await signUpCustomer({
      email: String(form.get("email") || "").trim(),
      password: pass,
      fullName: String(form.get("fullName") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
    });
    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.needsConfirmation) {
      setDone(t("Te enviamos un correo para confirmar tu cuenta. Confirmalo y luego inicia sesion."));
      return;
    }

    await refresh();
    navigate(redirectTo, { replace: true });
  }

  if (done) {
    return (
      <section className="ms-page">
        <div className="mx-auto max-w-[480px]">
          <div className="ms-panel grid gap-3 p-6">
            <p className="ms-eyebrow">{t("Area de cliente")}</p>
            <h1 className="m-0 font-serif text-[clamp(28px,5vw,40px)] text-ink">{t("Revisa tu correo")}</h1>
            <StateBlock tone="success" title={t("Cuenta creada")} text={done} />
            <Link className="ms-button ms-button-primary w-fit" to="/login">{t("Ir a iniciar sesion")}</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <AuthShell
      eyebrow={t("Area de cliente")}
      title={isBookingAccess ? t("Crea tu cuenta para reservar") : t("Crear cuenta")}
      lead={isBookingAccess
        ? t("Tu cuenta nos permite guardar la reserva y mantener el seguimiento en un solo lugar.")
        : t("Guarda tus reservas y agiliza tus datos de contacto.")}
      cover={homeCoverImages[2] || homeCoverImages[0] || ""}
      coverTitle={t("Una cuenta, todas tus salidas")}
      coverText={t("Entra para reservar mas rapido y ver tus experiencias asociadas.")}
      perks={[
        t("Reserva sin volver a escribir tus datos"),
        t("Seguimiento del cupo por WhatsApp y correo"),
        t("Tus resenas y favoritos siempre contigo"),
      ]}
      footer={
        <div className="ms-auth-foot">
          <span>
            {t("Ya tienes cuenta?")}{" "}
            <Link to="/login" state={{ from: redirectTo }}>{t("Inicia sesion")}</Link>
          </span>
        </div>
      }
    >
      <form className="ms-auth-form" onSubmit={handleSubmit}>
        <TextField
          name="fullName"
          label={t("Nombre completo")}
          icon={User}
          required
          autoComplete="name"
          autoFocus
        />
        <TextField name="email" type="email" label="Email" icon={AtSign} required autoComplete="email" />
        <TextField
          name="phone"
          type="tel"
          label={t("Telefono (WhatsApp)")}
          icon={Phone}
          required
          autoComplete="tel"
        />
        <div className="ms-auth-grid">
          <PasswordField
            name="password"
            label={t("Contrasena")}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordField
            name="confirm"
            label={t("Repetir contrasena")}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <PasswordStrength value={password} />

        <label className="ms-auth-legal">
          <input name="acceptLegal" type="checkbox" required />
          <span>
            {t("He leído y acepto los")}{" "}
            <Link to="/legal/terminos">{t("Términos y Condiciones")}</Link> {t("y la")}{" "}
            <Link to="/legal/exencion">{t("Exención de Responsabilidad")}</Link>{" "}
            {t("del servicio facilitado por Sebastián Santos Cruz.")}
            <small>
              {t("Consulta tambien:")}{" "}
              <Link to="/legal/privacidad">{t("Privacidad")}</Link> {t("y")}{" "}
              <Link to="/legal/cancelacion">{t("Cancelacion")}</Link>.
            </small>
          </span>
        </label>

        {error ? <StateBlock tone="error" title={t("No se pudo crear la cuenta")} text={error} /> : null}

        <button className="ms-button ms-button-primary ms-button-lg w-full" disabled={busy} type="submit">
          {busy ? t("Creando...") : t("Crear cuenta")}
        </button>
      </form>
    </AuthShell>
  );
}

/**
 * Medidor de contrasena.
 *
 * Solo orienta: la regla que valida el formulario sigue siendo la misma de
 * antes (minimo 6 caracteres) y no se endurece aqui.
 */
function PasswordStrength({ value }) {
  const { t } = useLanguage();
  if (!value) return null;

  const score = [value.length >= 6, value.length >= 10, /[A-Z]/.test(value), /\d/.test(value), /[^\w\s]/.test(value)]
    .filter(Boolean).length;
  const level = score <= 2 ? "low" : score === 3 ? "mid" : "high";
  const label = level === "low" ? t("Debil") : level === "mid" ? t("Aceptable") : t("Solida");

  return (
    <div className="ms-strength" data-level={level}>
      <span className="ms-strength-track" aria-hidden="true">
        <i style={{ width: `${(score / 5) * 100}%` }} />
      </span>
      <small>{t("Seguridad")}: {label}</small>
    </div>
  );
}
