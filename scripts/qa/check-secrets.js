/* Mono Solo Travel — escaneo básico de secretos en el repositorio.
 *
 * Busca patrones de credenciales en archivos de texto del proyecto, excluyendo
 * dependencias y artefactos (node_modules, .git, .codex_deps, .qa_node, _archive,
 * binarios e imágenes). Pensado como red de seguridad antes de cada commit.
 *
 * Uso: node scripts/qa/check-secrets.js
 * Salida: 0 si no hay coincidencias, 1 si encuentra posibles secretos.
 *
 * NOTA: detección heurística. No reemplaza una revisión humana ni un escáner
 * dedicado (gitleaks, trufflehog) en fases posteriores.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".codex_deps", ".qa_node", "_archive", "entregables",
]);
const SKIP_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".docx", ".pptx",
  ".xlsx", ".woff", ".woff2", ".ttf", ".pyd", ".so", ".dll", ".zip",
]);

// Permite el .env.example con placeholders vacíos.
const ALLOW_FILE = (rel) => rel === ".env.example";

const PATTERNS = [
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Stripe secret", re: /sk_(live|test)_[0-9a-zA-Z]{16,}/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/ },
  { name: "Supabase service key (jwt)", re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "Generic assigned secret", re: /(api[_-]?key|secret|password|passwd|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][^"'\s]{8,}["']/i },
];

async function walk(dir, acc) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walk(path.join(dir, e.name), acc);
    } else if (e.isFile()) {
      if (SKIP_EXT.has(path.extname(e.name).toLowerCase())) continue;
      acc.push(path.join(dir, e.name));
    }
  }
}

async function main() {
  const files = [];
  await walk(ROOT, files);

  let hits = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f).replace(/\\/g, "/");
    if (ALLOW_FILE(rel)) continue;
    let content;
    try {
      content = await fs.readFile(f, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const p of PATTERNS) {
        if (p.re.test(line)) {
          hits++;
          console.error(`✗ ${rel}:${i + 1} [${p.name}]`);
        }
      }
    });
  }

  console.log(`\nArchivos de texto escaneados: ${files.length} · Posibles secretos: ${hits}`);
  process.exit(hits === 0 ? 0 : 1);
}

main();
