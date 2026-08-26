/* Mono Solo Travel - E2E del flujo critico de reserva.
 *
 * Se ejecuta SOLO contra un entorno de STAGING configurado. Si faltan variables,
 * NO inventa credenciales: marca la prueba como PENDIENTE DE ENTORNO y sale con 0.
 *
 * Variables requeridas:
 *   E2E_BASE_URL          URL de la app levantada contra staging (p.ej. http://127.0.0.1:5173)
 *   E2E_CUSTOMER_EMAIL    email de un customer creado en Supabase staging
 *   E2E_CUSTOMER_PASSWORD contrasena del customer
 *   E2E_ADMIN_EMAIL       email del admin creado en Supabase staging
 *   E2E_ADMIN_PASSWORD    contrasena del admin
 *   SUPABASE_URL          (presencia indica que el front corre en modo staging)
 *   SUPABASE_ANON_KEY
 *
 * Flujo vigente: abrir experiencia -> reservar exige login customer -> elegir
 * fecha/personas -> confirmar datos -> reserva pending sin pago obligatorio
 * -> login admin -> confirmar reserva
 * -> confirmacion publica refleja Confirmada.
 */

const REQUIRED = [
  "E2E_BASE_URL",
  "E2E_CUSTOMER_EMAIL",
  "E2E_CUSTOMER_PASSWORD",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
];
const missing = REQUIRED.filter((k) => !process.env[k]);

if (missing.length) {
  console.log("E2E PENDIENTE DE ENTORNO - no se ejecuta contra staging.");
  console.log("Faltan variables: " + missing.join(", "));
  console.log("Configura staging (docs/setup/SUPABASE_STAGING_SETUP.md) y reintenta.");
  process.exit(0);
}

const BASE = process.env.E2E_BASE_URL.replace(/\/$/, "");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("E2E PENDIENTE DE ENTORNO - Playwright no esta instalado.");
  console.log("Instala Playwright (npm i -D playwright && npx playwright install chromium) y reintenta.");
  process.exit(0);
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FALLO: " + msg);
}

async function firstReservableExperienceHref(page) {
  await page.goto(`${BASE}/experiencias?reset=1`, { waitUntil: "networkidle" });
  const hrefs = await page.locator('a[href^="/experiencias/"]').evaluateAll((links) => (
    [...new Set(links.map((link) => link.getAttribute("href")).filter(Boolean))]
  ));

  for (const href of hrefs.slice(0, 20)) {
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    if (await page.getByRole("link", { name: /^Reservar$/ }).count()) return href;
  }

  throw new Error("no se encontro una experiencia publica con inventario persistido para reservar");
}

const browser = await chromium.launch();
const customerContext = await browser.newContext();
const page = await customerContext.newPage();
let publicContext = null;
let adminContext = null;
let failed = false;

try {
  const detailHref = await firstReservableExperienceHref(page);

  await page.goto(`${BASE}${detailHref}`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /^Reservar$/ }).first().click();
  await page.waitForURL(/\/login/);
  await page.locator('input[name="email"]').fill(process.env.E2E_CUSTOMER_EMAIL);
  await page.locator('input[name="password"]').fill(process.env.E2E_CUSTOMER_PASSWORD);
  await page.getByRole("button", { name: /Ingresar|Sign in/i }).click();
  await page.waitForURL(/\/reservar\//);

  const guests = page.locator('input[name="guests"]');
  await guests.fill("2");
  await page.getByRole("button", { name: /Continuar con mis datos/i }).click();
  await page.waitForURL(/\/checkout/);

  await page.locator('input[name="customerName"]').fill("E2E Tester");
  await page.locator('input[name="customerEmail"]').fill("e2e@example.com");
  await page.locator('input[name="customerPhone"]').fill("+507 6000 0000");
  await page.locator('input[name="acceptPolicy"]').check();
  await page.getByRole("button", { name: /Reservar sin pagar ahora/i }).click();

  await page.waitForFunction(() => location.pathname === "/confirmacion" && location.search.includes("token="));
  const confirmationUrl = page.url();
  const confirmationText = await page.locator("body").innerText();
  assert(/Pendiente/i.test(confirmationText), "la reserva deberia quedar pendiente sin pago obligatorio");
  const code = confirmationText.match(/MS-\d{6}-\d{5}/)?.[0];
  assert(code, "no se encontro codigo de reserva en la confirmacion");

  publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(confirmationUrl, { waitUntil: "networkidle" });
  assert((await publicPage.locator("body").innerText()).includes(code), "la reserva debe leerse en otro navegador");

  adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await adminPage.locator('input[name="email"]').fill(process.env.E2E_ADMIN_EMAIL);
  await adminPage.locator('input[name="password"]').fill(process.env.E2E_ADMIN_PASSWORD);
  await adminPage.getByRole("button", { name: /Entrar/i }).click();
  await adminPage.waitForURL(/\/admin\//);

  await adminPage.goto(`${BASE}/admin/reservas`, { waitUntil: "networkidle" });
  const row = adminPage.locator("article", { hasText: code }).first();
  await row.getByRole("button", { name: /Confirmar/i }).click();
  await adminPage.waitForTimeout(800);

  await publicPage.goto(confirmationUrl, { waitUntil: "networkidle" });
  const finalText = await publicPage.locator("body").innerText();
  assert(/Confirmada/i.test(finalText), "la reserva deberia estar confirmada tras accion admin");

  console.log("OK E2E flujo de reserva sin pago obligatorio: " + code);
} catch (err) {
  failed = true;
  console.error("ERROR E2E fallo:", err.message);
} finally {
  if (adminContext) await adminContext.close();
  if (publicContext) await publicContext.close();
  await customerContext.close();
  await browser.close();
  process.exit(failed ? 1 : 0);
}
