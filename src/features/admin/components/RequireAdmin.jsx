import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { StateBlock } from "../../../components/ui/StateBlock.jsx";
import { useLanguage } from "../../../lib/i18n/LanguageContext.jsx";
import { isAdmin } from "../admin-service.js";

export function RequireAdmin() {
  const { t } = useLanguage();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    let active = true;
    isAdmin().then((result) => {
      if (active) setAllowed(Boolean(result));
    });
    return () => {
      active = false;
    };
  }, []);

  if (allowed === null) {
    return (
      <section className="ms-page">
        <StateBlock title={t("Verificando acceso")} text={t("Validando sesion administrativa.")} />
      </section>
    );
  }

  if (!allowed) return <Navigate replace to="/admin/login" />;

  return <Outlet />;
}
