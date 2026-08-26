/* Mono Solo Travel - local import check.
 *
 * Scans React/Vite source files and verifies local relative or root-absolute
 * imports resolve to files in the repository.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const INCLUDE = ["src", "vite.config.js", "tailwind.config.js", "postcss.config.js"];
const IMPORT_RE = /\bimport\s+(?:[^"']*?\sfrom\s+)?["']([^"']+)["']/g;
const SOURCE_EXTENSIONS = [".js", ".jsx"];
const RESOLVE_EXTENSIONS = ["", ".js", ".jsx", ".json"];

async function collect(target, acc) {
  const full = path.join(ROOT, target);
  const st = await fs.stat(full).catch(() => null);
  if (!st) return;
  if (st.isFile()) {
    if (SOURCE_EXTENSIONS.some((ext) => full.endsWith(ext))) acc.push(full);
    return;
  }
  const entries = await fs.readdir(full, { withFileTypes: true });
  for (const entry of entries) await collect(path.join(target, entry.name), acc);
}

async function exists(p) {
  return Boolean(await fs.stat(p).catch(() => null));
}

async function resolves(basePath) {
  for (const ext of RESOLVE_EXTENSIONS) {
    if (await exists(basePath + ext)) return true;
  }
  return false;
}

async function main() {
  const files = [];
  for (const target of INCLUDE) await collect(target, files);

  let broken = 0;
  let checked = 0;
  for (const file of files) {
    const code = await fs.readFile(file, "utf8");
    let match;
    while ((match = IMPORT_RE.exec(code)) !== null) {
      const spec = match[1];
      let resolved;
      if (spec.startsWith("/")) resolved = path.join(ROOT, spec);
      else if (spec.startsWith(".")) resolved = path.resolve(path.dirname(file), spec);
      else continue;

      checked++;
      if (!(await resolves(resolved))) {
        broken++;
        console.error(`FAIL ${path.relative(ROOT, file)} -> "${spec}"`);
      }
    }
  }

  console.log(`\nImports locales revisados: ${checked} - Rotos: ${broken}`);
  process.exit(broken === 0 ? 0 : 1);
}

main();
