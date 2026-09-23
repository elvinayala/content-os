#!/usr/bin/env node
// Markdown → PDF con el estilo de EA Market, para entregar documentos al equipo (acuerdos, SOPs,
// manuales). Usa `marked` (ya en el repo) + Chrome headless: no hace falta instalar nada más.
//   node scripts/md-a-pdf.mjs <archivo.md> [más.md …] [--salida <carpeta>] [--marca "EA Market LLC"]
// En Linux (Railway): CHROME_PATH=<chrome-headless-shell> CHROME_FLAGS=--no-sandbox node scripts/md-a-pdf.mjs …
// El frontmatter YAML no se imprime; el título es el primer # del documento.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const salida = path.resolve(ROOT, arg("salida", "vault/proyectos/contrataciones/pdf"));
const marca = arg("marca", "EA Market LLC");
const archivos = process.argv.slice(2).filter((a, i, all) => a.endsWith(".md") && all[i - 1] !== "--salida" && all[i - 1] !== "--marca");
if (!archivos.length) { console.log("Uso: node scripts/md-a-pdf.mjs <archivo.md> … [--salida <carpeta>]"); process.exit(1); }
fs.mkdirSync(salida, { recursive: true });

const CSS = `
  @page { size: Letter; margin: 22mm 18mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 10.5pt; line-height: 1.55; color: #1b2430; margin: 0; }
  .marca { font-size: 8.5pt; letter-spacing: .14em; text-transform: uppercase; color: #8a6a4f; font-weight: 700; margin-bottom: 4px; }
  h1 { font-size: 21pt; line-height: 1.15; margin: 0 0 4px; color: #14202a; }
  h1 + p em, .fecha { color: #6b7684; font-size: 9pt; }
  h2 { font-size: 13pt; margin: 20px 0 6px; padding-top: 10px; border-top: 2px solid #14202a; color: #14202a; break-after: avoid; }
  h3 { font-size: 11pt; margin: 14px 0 4px; color: #2a3744; break-after: avoid; }
  p, li { orphans: 2; widows: 2; }
  ul, ol { padding-left: 18px; margin: 6px 0; }
  li { margin: 3px 0; }
  strong { color: #14202a; }
  hr { border: none; border-top: 1px solid #d9ddd8; margin: 18px 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; break-inside: avoid; }
  th { background: #14202a; color: #fff; text-align: left; padding: 6px 8px; font-size: 9pt; }
  td { border-bottom: 1px solid #e3e6e2; padding: 6px 8px; vertical-align: top; }
  tr:nth-child(even) td { background: #f7f8f6; }
  blockquote { margin: 10px 0; padding: 10px 14px; background: #f5f6f3; border-left: 3px solid #c8643a; color: #2a3744; }
  blockquote p { margin: 4px 0; }
  code { background: #f1f2ef; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  pre { background: #f5f6f3; padding: 10px; border-radius: 4px; overflow-x: hidden; white-space: pre-wrap; font-size: 9pt; }
  .pie { margin-top: 26px; padding-top: 8px; border-top: 1px solid #d9ddd8; color: #8a949f; font-size: 8pt; }
`;

for (const f of archivos) {
  const ruta = path.resolve(ROOT, f);
  let md = fs.readFileSync(ruta, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
  const titulo = (md.match(/^#\s+(.+)$/m) || [, path.basename(f, ".md")])[1];
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title><style>${CSS}</style></head><body>
    <div class="marca">${marca}</div>${marked.parse(md)}
    <div class="pie">${marca} · ${titulo} · ${new Date().toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" })} · documento interno</div>
  </body></html>`;
  const tmp = path.join(salida, path.basename(f, ".md") + ".html");
  const pdf = path.join(salida, path.basename(f, ".md") + ".pdf");
  fs.writeFileSync(tmp, html);
  const r = spawnSync(CHROME, [...(process.env.CHROME_FLAGS || "").split(" ").filter(Boolean), "--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, "file://" + tmp], { encoding: "utf8" });
  fs.unlinkSync(tmp);
  console.log(fs.existsSync(pdf) ? `✔ ${path.relative(ROOT, pdf)} (${Math.round(fs.statSync(pdf).size / 1024)} KB)` : `✗ falló ${f}: ${(r.stderr || "").slice(0, 200)}`);
}
