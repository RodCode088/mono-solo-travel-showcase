import { useEffect, useState } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { AppShell } from "../components/ui/AppShell.jsx";
import { ExperienceLoader } from "../components/ui/ExperienceLoader.jsx";
import { StateBlock } from "../components/ui/StateBlock.jsx";
import { LanguageProvider, useLanguage } from "../lib/i18n/LanguageContext.jsx";
import { captureReferralFromSearch } from "../lib/services/state.js";
import { bootstrapApp } from "./bootstrap.js";

const MINIMUM_BOOT_MS = 1100;

export function RootLayout() {
  return (
    <LanguageProvider>
      <RootLayoutContent />
    </LanguageProvider>
  );
}

function RootLayoutContent() {
  const [boot, setBoot] = useState({ status: "loading", config: null, error: null });
  const { t } = useLanguage();
  const location = useLocation();

  // Corre en cada navegacion (no solo en detalle de experiencia) para que
  // cualquier URL de entrada con ?ref=CODE capture el codigo QR del hostel,
  // segun docs/product/HOSTEL_QR_REFERRAL_PROPOSAL.md. Nunca se muestra al visitante.
  useEffect(() => {
    captureReferralFromSearch(location.search);
  }, [location.search]);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    bootstrapApp()
      .then(async (result) => {
        const remaining = Math.max(0, MINIMUM_BOOT_MS - (Date.now() - startedAt));
        if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
        if (active) setBoot({ status: "ready", config: result.config, error: result.configError });
      })
      .catch((error) => {
        if (active) setBoot({ status: "error", config: null, error });
      });
    return () => {
      active = false;
    };
  }, []);

  if (boot.status === "loading") {
    return (
      <AppShell>
        <ExperienceLoader />
      </AppShell>
    );
  }

  if (boot.status === "error") {
    return (
      <AppShell>
        <StateBlock tone="error" title={t("No se pudo iniciar")} text={t("Revisa la configuracion local antes de continuar.")} />
      </AppShell>
    );
  }

  return (
    <AppShell mode={boot.config?.mode} source={boot.config?.source}>
      {boot.error ? (
        <StateBlock tone="error" title={t("Configuracion incompleta")} text={boot.error} />
      ) : (
        <Outlet />
      )}
      <ScrollRestoration getKey={(location) => location.pathname} />
    </AppShell>
  );
}
