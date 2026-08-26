import { AtSign } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PasswordField, TextField } from "../../../components/ui/TextField.jsx";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { homeCoverImages } from "../../../data/mono-experiences.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { AuthShell } from "../../auth/components/AuthShell.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { signInAdmin } from "../admin-service.js";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { refresh } = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const { error: authError } = await signInAdmin(form.get("email"), form.get("password"));
    if (authError) {
      setBusy(false);
      setError(authError.message);
      return;
    }
    // Mantiene sincronizado el nav del shell compartido (muestra Admin, no un link de customer desactualizado).
    await refresh();
    setBusy(false);
    navigate("/admin/dashboard");
  }

  return (
    <AuthShell
      tone="admin"
      eyebrow={t("Admin")}
      title={t("Acceso operativo")}
      lead={t("Reservas, disponibilidad y operacion interna.")}
      cover={homeCoverImages[1] || homeCoverImages[0] || ""}
      coverTitle={t("Backoffice")}
      coverText={t("Reservas, disponibilidad y operacion interna.")}
      perks={[
        t("Confirmacion de cupos y estados de reserva"),
        t("Calendario de salidas por experiencia"),
        t("Clientes, reportes y configuracion"),
      ]}
    >
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
          minLength={4}
          autoComplete="current-password"
        />
        {error ? <StateBlock tone="error" title={t("No se pudo entrar")} text={error} /> : null}
        <button className="ms-button ms-button-primary ms-button-lg w-full" disabled={busy} type="submit">
          {busy ? t("Entrando...") : t("Entrar")}
        </button>
      </form>
    </AuthShell>
  );
}
