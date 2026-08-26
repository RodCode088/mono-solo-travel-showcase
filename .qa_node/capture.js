// Capture QA screenshots for the entregables folder.
// Requires: a running static server at http://127.0.0.1:5188

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const URL = "http://127.0.0.1:5188/";
const OUT = path.resolve(__dirname, "..", "entregables");

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ---------- Desktop captures ----------
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await desktop.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForTimeout(800);

  // 1. Hero full
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "qa-hero-desktop.png"), fullPage: false });

  // 2. Catalog
  await page.evaluate(() => {
    const el = document.getElementById("catalog");
    if (el) window.scrollTo(0, el.offsetTop - 60);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "qa-catalog-desktop.png"), fullPage: false });

  // 3. Experience detail with booking card
  await page.evaluate(() => {
    const el = document.getElementById("experience");
    if (el) window.scrollTo(0, el.offsetTop - 60);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "qa-experience-desktop.png"), fullPage: false });

  // 4. Checkout modal open
  await page.evaluate(() => {
    const btn = document.querySelector("[data-open-checkout]");
    if (btn) btn.click();
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "qa-checkout-desktop.png"), fullPage: false });

  // close modal
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 5. Full page tall capture (small width to fit, optional)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "qa-fullpage-desktop.png"), fullPage: true });

  await desktop.close();

  // ---------- Mobile captures ----------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  await m.goto(URL, { waitUntil: "load" });
  await m.waitForTimeout(800);

  // mobile hero
  await m.screenshot({ path: path.join(OUT, "qa-hero-mobile.png"), fullPage: false });

  // mobile experience (with sticky CTA)
  await m.evaluate(() => {
    const el = document.getElementById("experience");
    if (el) window.scrollTo(0, el.offsetTop - 60);
  });
  await m.waitForTimeout(900);
  await m.screenshot({ path: path.join(OUT, "qa-experience-mobile.png"), fullPage: false });

  // mobile catalog
  await m.evaluate(() => {
    const el = document.getElementById("catalog");
    if (el) window.scrollTo(0, el.offsetTop - 40);
  });
  await m.waitForTimeout(600);
  await m.screenshot({ path: path.join(OUT, "qa-catalog-mobile.png"), fullPage: false });

  await mobile.close();
  await browser.close();

  const captures = fs.readdirSync(OUT).filter((f) => f.startsWith("qa-") && f.endsWith(".png"));
  console.log("OK · captured:", captures.length);
  captures.forEach((c) => console.log("  -", c));
})();
