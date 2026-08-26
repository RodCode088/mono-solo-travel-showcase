import { AtSign, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PasswordField, TextField } from "../../../components/ui/TextField.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { homeCoverImages } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { signInCustomer } from "../../../lib/services/auth-service.js";
import { useAuth } from "../AuthContext.jsx";
import { AuthShell } from "../components/AuthShell.jsx";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = location.state?.from || "/usuario/dashboard";
  const isBookingAccess = String(redirectTo).startsWith("/reservar") || String(redirectTo).startsWith("/checkout");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const { error: signInError } = await signInCustomer(
      String(form.get("email") || "").trim(),
      String(form.get("password") || ""),
    );

    if (signInError) {
      setBusy(false);
      setError(signInError.message);
      return;
    }

    await refresh();
    setBusy(false);
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthShell
      eyebrow={t("Area de cliente")}
      title={isBookingAccess ? t("Inicia sesion para reservar") : t("Iniciar sesion")}
      lead={isBookingAccess
        ? t("Necesitamos tu cuenta para guardar la reserva, confirmar cupo y enviarte el seguimiento.")
        : t("Accede a tus reservas y datos de contacto.")}
      cover={homeCoverImages[0] || ""}
      coverTitle={t("Tu cuenta Mono Solo")}
      coverText={t("Entra para reservar mas rapido y ver tus experiencias asociadas.")}
      perks={[
        t("Tus reservas y su estado en un solo lugar"),
        t("Datos de contacto listos para el siguiente checkout"),
        t("Favoritos guardados entre dispositivos"),
      ]}
      footer={
        <div className="ms-auth-foot">
          <Link to="/recuperar">{t("Olvide mi contrasena")}</Link>
          <span>
            {t("Sin cuenta?")}{" "}
            <Link to="/registro" state={{ from: redirectTo }}>{t("Crear una")}</Link>
          </span>
        </div>
      }
    >
      {isBookingAccess ? (
        <p className="ms-auth-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>
            <strong>{t("Tu reserva queda asociada a tu cuenta.")}</strong>
            {t("Despues de entrar volveras automaticamente al paso de reserva.")}
          </span>
        </p>
      ) : null}

      <form className="ms-auth-form" onSubmit={handleSubmit}>
        <TextField
          name="email"
          type="email"
          label="Email"
          icon={AtSign}
          required
          autoComplete="email"
          autoFocus
        />
        <PasswordField
          name="password"
          label={t("Contrasena")}
          required
          autoComplete="current-password"
        />

        {error ? <StateBlock tone="error" title={t("No se pudo iniciar sesion")} text={error} /> : null}

        <button className="ms-button ms-button-primary ms-button-lg w-full" disabled={busy} type="submit">
          {busy ? t("Ingresando...") : t("Ingresar")}
        </button>
      </form>
    </AuthShell>
  );
}
