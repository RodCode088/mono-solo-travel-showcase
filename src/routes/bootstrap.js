import { seedOperationalData } from "../data/seed.js";
import { initConfig, getConfig } from "../lib/config/config-service.js";
import { hydrateCatalog } from "../lib/services/db-service.js";
import { hydrateExperienceRatings } from "../lib/services/reviews-service.js";

let bootPromise = null;

export function bootstrapApp() {
  if (!bootPromise) {
    bootPromise = (async () => {
      const config = await initConfig();
      seedOperationalData();
      const catalog = await hydrateCatalog();
      // Corre despues de hydrateCatalog tanto en modo mock como Supabase (a
      // diferencia de hydrateCatalog mismo, que retorna temprano en mock) para
      // que los badges de rating/reviewCount se llenen con reviews reales en
      // vez del default honesto null/0 que trae cada registro de experiencia.
      await hydrateExperienceRatings();
      return {
        config: getConfig(),
        catalog,
        configError: config.configError,
      };
    })();
  }
  return bootPromise;
}
