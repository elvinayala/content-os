/**
 * HTML del contrato llenado → PDF con el membrete de Resuelto en cada página (franja C1 + logo blanco + línea C2)
 * y, en el pie, las INICIALES del firmante en todas las páginas + "Página X de Y". Mismo diseño que
 * kit/afiliacion/render.mjs, pero con el Chromium del contenedor (puppeteer-core, sin Chrome descargado).
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { RAIZ } from "../almacen.js";

const CHROME = process.env.CHROME_PATH || [
  "/usr/bin/chromium-browser", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => fs.existsSync(p)) || "";

const LOGO = () => fs.readFileSync(path.join(RAIZ, "data", "plantillas", "logo-blanco.png")).toString("base64");

export async function htmlAPdf(html: string, opciones: { pie: string; iniciales?: string }): Promise<Buffer> {
  if (!CHROME) throw new Error("No hay Chromium para generar el PDF (CHROME_PATH)");
  const header = `<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;width:100%;margin:-10px 0 0;padding:0 0.7in;height:0.66in;box-sizing:border-box;background:#0F3D5E;border-bottom:3px solid #F2621F;display:flex;align-items:center;justify-content:space-between;font-family:Helvetica,Arial,sans-serif;font-size:8px;letter-spacing:.4px;color:#FBF7F0"><img src="data:image/png;base64,${LOGO()}" style="height:22px"><span>Resuelto Home Services LLC &nbsp;·&nbsp; resueltopr.com &nbsp;·&nbsp; WhatsApp 787-956-1111</span></div>`;
  const ini = opciones.iniciales ? `<span style="display:flex;align-items:flex-end;gap:4px">Iniciales: <img src="${opciones.iniciales}" style="height:20px;border-bottom:1px solid #8a97a3"></span>` : "<span></span>";
  const footer = `<div style="width:100%;padding:0 0.7in;box-sizing:border-box;display:flex;justify-content:space-between;align-items:flex-end;font-family:Helvetica,Arial,sans-serif;font-size:7.5px;color:#5C6670"><span>${opciones.pie}</span>${ini}<span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`;
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  try {
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await new Promise((r) => setTimeout(r, 400)); // fuentes de Google (@import) y las imágenes en data URL
    await pagina.evaluate(() => (document as any).fonts.ready);
    const pdf = await pagina.pdf({ printBackground: true, displayHeaderFooter: true, headerTemplate: header, footerTemplate: footer, width: "8.5in", height: "11in", margin: { top: "0.95in", bottom: "0.6in", left: "0.7in", right: "0.7in" } });
    return Buffer.from(pdf);
  } finally { await navegador.close(); }
}
