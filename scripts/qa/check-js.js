/* Mono Solo Travel - JavaScript syntax check.
 *
 * Checks source files, QA scripts and Vite/Tailwind/PostCSS config files with
 * `node --check`. It does not execute app code or touch integrations.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const INCLUDE = ["src", "scripts", "vite.config.js", "tailwind.config.js", "postcss.config.js"];
const SKIP_DIRS = new Set(["node_modules", ".git", ".qa_node", ".codex_deps", "_archive"]);

async function collect(target, acc) {
  const full = path.join(ROOT, target);
  const st = await fs.stat(full).catch(() => null);
  if (!st) return;
  if (st.isFile()) {
    if (full.endsWith(".js")) acc.push(full);
    return;
  }
  if (st.isDirectory()) {
    const entries = await fs.readdir(full, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      await collect(path.join(target, entry.name), acc);
    }
  }
}

async function main() {
  const files = [];
  for (const target of INCLUDE) await collect(target, files);

  let failed = 0;
  for (const file of files) {
    try {
      await execFileAsync(process.execPath, ["--check", file]);
    } catch (err) {
      failed++;
      console.error(`FAIL ${path.relative(ROOT, file)}`);
      console.error((err.stderr || err.message).trim());
    }
  }

  console.log(`\nArchivos .js revisados: ${files.length} - OK: ${files.length - failed} - Fallos: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
