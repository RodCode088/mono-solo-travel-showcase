/* Mono Solo Travel - compara el bundle publicado contra el build local.
 *
 * Por que existe: el 2026-08-10 el sitio publicado quedo semanas atras del
 * repo sin ningun error visible (la GitHub App de Cloudflare habia dejado de
 * disparar builds). "El deploy anda" se estaba comprobando a ojo, mirando si
 * el sitio cargaba -- y cargaba, pero era el build viejo.
 *
 * Vite le pone un hash de contenido a cada bundle, asi que comparar el hash
 * publicado contra el de dist/ responde la pregunta real: el sitio esta
 * sirviendo ESTE codigo, si o no.
 *
 * Uso:
 *   npm run build && npm run check:deploy
 *   npm run check:deploy -- https://mono-solo-travel.pages.dev
 */
import fs from "node:fs";
import path from "node:path";

const DEFAULT_URL = "https://monosolotravel.com";

function bundlesFrom(html) {
  return [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
    .map((m) => m[1].split("/").pop())
    .filter(Boolean)
    .sort();
}

async function main() {
  const target = (process.argv[2] || process.env.DEPLOY_URL || DEFAULT_URL).replace(/\/$/, "");
  const distIndex = path.join(process.cwd(), "dist", "index.html");

  if (!fs.existsSync(distIndex)) {
    console.error("✗ No existe dist/index.html. Corre `npm run build` primero.");
    return 1;
  }

  const localBundles = bundlesFrom(fs.readFileSync(distIndex, "utf8"));
  if (!localBundles.length) {
    console.error("✗ No se encontro ningun bundle en dist/index.html.");
    return 1;
  }

  let html;
  try {
    const res = await fetch(`${target}/?cachebust=${Date.now()}`, {
      headers: { "cache-control": "no-cache" },
    });
    if (!res.ok) {
      console.error(`✗ ${target} respondio HTTP ${res.status}.`);
      return 1;
    }
    html = await res.text();
  } catch (err) {
    console.error(`✗ No se pudo consultar ${target}: ${err.message}`);
    return 1;
  }

  const liveBundles = bundlesFrom(html);
  const missing = localBundles.filter((bundle) => !liveBundles.includes(bundle));

  console.log(`URL:       ${target}`);
  console.log(`local:     ${localBundles.join(", ")}`);
  console.log(`publicado: ${liveBundles.length ? liveBundles.join(", ") : "(ninguno)"}`);

  if (missing.length) {
    console.error("\n✗ El sitio publicado NO esta sirviendo el build local.");
    console.error("  El deploy no entro, fallo, o Cloudflare no se entero del push.");
    console.error("  Revisar Cloudflare -> Workers & Pages -> Deployments.");
    return 1;
  }

  console.log("\n✓ El sitio publicado sirve exactamente el build local.");
  return 0;
}

// process.exitCode en vez de process.exit(): en Windows, salir con sockets de
// fetch aun abiertos dispara un assert de libuv.
process.exitCode = await main();
