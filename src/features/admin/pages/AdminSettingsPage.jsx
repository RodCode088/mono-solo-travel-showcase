import { getConfig } from "../../../lib/config/config-service.js";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const config = getConfig();
  const { fullName, email } = useAuth();
  const modeLabel = config.mode === "production" ? t("Produccion") : config.mode === "staging" ? t("Ambiente de prueba") : t("Modo demo/local");

  return (
    <>
      <section className="ms-panel p-5">
        <p className="ms-eyebrow">{t("Configuracion")}</p>
        <h1 className="m-0 font-serif text-[clamp(28px,4vw,44px)] text-ink">{t("Configuracion")}</h1>
        <p className="m-0 text-muted">{t("Estado del entorno y de la cuenta administrativa.")}</p>
      </section>

      <section className="ms-panel mt-4 grid gap-3 p-5">
        <h2 className="m-0 font-serif text-2xl text-ink">{t("Entorno")}</h2>
        <Row label={t("Modo")} value={modeLabel} />
        <Row label={t("Fuente de configuracion")} value={config.source} />
        <Row label={t("Conexion Supabase")} value={config.supabaseEnabled ? t("activa") : t("modo local / mock")} />
        <Row label={t("Backend")} value={config.supabaseEnabled ? "Supabase" : t("datos locales")} />
        <p className="m-0 text-sm text-muted">
          {t("Staging es el ambiente de prueba antes de produccion. Local significa que esta app esta corriendo desde este computador.")}
        </p>
      </section>

      <section className="ms-panel mt-4 grid gap-3 p-5">
        <h2 className="m-0 font-serif text-2xl text-ink">{t("Cuenta admin")}</h2>
        <Row label={t("Nombre")} value={fullName || t("(sin nombre)")} />
        <Row label={t("Email")} value={email || "-"} />
      </section>

      <section className="ms-panel mt-4 p-5">
        <h2 className="m-0 font-serif text-2xl text-ink">{t("Notas")}</h2>
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-sm text-muted">
          <li>{t("Las claves y secretos de Supabase se configuran solo en el servidor/hosting, nunca en esta interfaz.")}</li>
          <li>{t("Los administradores se crean de forma interna por SQL; el rol no se asigna desde el formulario publico.")}</li>
          <li>{t("La reserva publica ya no exige pago inmediato; la pasarela de pago queda como fase futura.")}</li>
        </ul>
      </section>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2 text-sm last:border-b-0">
      <span className="font-black uppercase tracking-[.05em] text-muted">{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}
