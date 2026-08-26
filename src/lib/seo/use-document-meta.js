/* Per-route document metadata for the SPA (dependency-free).
 *
 * React Router renders client-side, so unique <title>/description/canonical per
 * route are set imperatively here. This covers basic technical SEO for the
 * public surface. Full crawler parity would require pre-rendering/SSR, which is
 * out of scope for Phase 1 and documented as a known limitation.
 */
import { useEffect } from "react";
import { cleanDisplayText } from "../services/text.js";

const SITE_NAME = "Mono Solo Travel";

const DEFAULTS = {
  title: "Mono Solo Travel | Experiencias y reservas en Panama",
  description:
    "Catalogo publico de experiencias turisticas en Panama con reserva online, datos de contacto y confirmacion por token.",
};

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useDocumentMeta({ title, description, canonicalPath, noindex = false } = {}) {
  useEffect(() => {
    const resolvedTitle = title ? `${cleanDisplayText(title)} | ${SITE_NAME}` : DEFAULTS.title;
    const resolvedDescription = cleanDisplayText(description || DEFAULTS.description);

    document.title = resolvedTitle;
    upsertMeta("name", "description", resolvedDescription);
    upsertMeta("property", "og:title", resolvedTitle);
    upsertMeta("property", "og:description", resolvedDescription);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    if (typeof window !== "undefined") {
      const path = canonicalPath || window.location.pathname;
      upsertCanonical(`${window.location.origin}${path}`);
    }

    return () => {
      document.title = DEFAULTS.title;
      upsertMeta("name", "robots", "index, follow");
    };
  }, [title, description, canonicalPath, noindex]);
}
