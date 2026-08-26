/* Mono Solo Travel - React route smoke test.
 *
 * Starts the Vite dev server on an ephemeral port and verifies that clean
 * browser routes return the React HTML shell. Rendering and Supabase flows are
 * covered by browser/manual checks and gated E2E.
 */

import { createServer } from "vite";

const ROUTES = [
  "/",
  "/experiencias",
  "/experiencias/artilleria-hill-the-vertical-shortcut",
  "/conocenos",
  "/vlog",
  "/destinos",
  "/checkout",
  "/confirmacion",
  "/legal/terminos",
  "/legal/privacidad",
  "/legal/cancelacion",
  "/legal/exencion",
  "/admin/login",
  "/admin/dashboard",
];

async function main() {
  const server = await createServer({
    logLevel: "silent",
    server: {
      host: "127.0.0.1",
      port: 0,
    },
  });

  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === "object" && address ? address.port : null;
  const base = `http://127.0.0.1:${port}`;

  let failed = 0;
  console.log(`Comprobando ${ROUTES.length} rutas React en ${base}\n`);

  for (const route of ROUTES) {
    try {
      const res = await fetch(base + route);
      const body = await res.text();
      const hasShell = body.includes('id="react-root"');
      const ok = res.status === 200 && hasShell;
      if (!ok) failed++;
      const flag = ok ? "OK" : "FAIL";
      console.log(`${flag} ${String(res.status).padEnd(3)} ${route}${hasShell ? "" : " (sin shell React)"}`);
    } catch (err) {
      failed++;
      console.log(`FAIL ERR ${route} ${err.message}`);
    }
  }

  await server.close();
  console.log(`\nRutas OK: ${ROUTES.length - failed}/${ROUTES.length}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main();
