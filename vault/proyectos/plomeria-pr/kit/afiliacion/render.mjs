// PDF con membrete de Resuelto en TODAS las páginas: franja azul C1 con el logo blanco + línea naranja C2
// arriba, y pie con la empresa, iniciales (en el acuerdo) y "Página X de Y". Usa el protocolo de Chrome
// (Page.printToPDF con headerTemplate/footerTemplate), sin dependencias.
// Uso: node render.mjs <entrada.html> <salida.pdf> "<texto del pie>" [--iniciales]
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [entrada, salida, pie, ...flags] = process.argv.slice(2);
const iniciales = flags.includes("--iniciales");
const LOGO = readFileSync(new URL("../logo/logo-horizontal-blanco.png", import.meta.url)).toString("base64");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PUERTO = 9300 + Math.floor(Math.random() * 500);

const header = `<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;width:100%;margin:-10px 0 0;padding:0 0.7in;height:0.66in;box-sizing:border-box;background:#0F3D5E;border-bottom:3px solid #F2621F;display:flex;align-items:center;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;font-size:8px;letter-spacing:.4px;color:#FBF7F0">
<img src="data:image/png;base64,${LOGO}" style="height:22px"><span>Resuelto Home Services LLC &nbsp;·&nbsp; resueltopr.com &nbsp;·&nbsp; WhatsApp 939-247-9234</span></div>`;
const footer = `<div style="width:100%;padding:0 0.7in;box-sizing:border-box;display:flex;justify-content:space-between;align-items:flex-end;font-family:Helvetica,Arial,sans-serif;font-size:7.5px;color:#5C6670">
<span>${pie}</span>${iniciales ? '<span>Iniciales: ________ &nbsp; ________</span>' : ""}<span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`;

const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "resuelto-pdf-"))}`, "about:blank"], { stdio: "ignore" });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let destino;
for (let i = 0; i < 50 && !destino; i++) { await esperar(200); try { destino = await (await fetch(`http://127.0.0.1:${PUERTO}/json/new?about:blank`, { method: "PUT" })).json(); } catch {} }
const ws = new WebSocket(destino.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let n = 0; const pendientes = new Map(); const eventos = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pendientes.has(m.id)) { pendientes.get(m.id)(m); pendientes.delete(m.id); } else if (m.method) eventos.push(m.method); });
const cdp = (method, params = {}) => new Promise((r) => { const id = ++n; pendientes.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await cdp("Page.enable");
await cdp("Page.navigate", { url: pathToFileURL(resolve(entrada)).href });
for (let i = 0; i < 60 && !eventos.includes("Page.loadEventFired"); i++) await esperar(200);
await cdp("Runtime.evaluate", { expression: "document.fonts.ready.then(() => true)", awaitPromise: true });
await esperar(800);
const r = await cdp("Page.printToPDF", { printBackground: true, displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer, paperWidth: 8.5, paperHeight: 11, marginTop: 0.95, marginBottom: 0.6, marginLeft: 0.7, marginRight: 0.7, preferCSSPageSize: false });
if (!r.result?.data) { console.error("printToPDF falló", JSON.stringify(r).slice(0, 300)); chrome.kill(); process.exit(1); }
writeFileSync(salida, Buffer.from(r.result.data, "base64"));
ws.close(); chrome.kill();
console.log("✔", salida);
