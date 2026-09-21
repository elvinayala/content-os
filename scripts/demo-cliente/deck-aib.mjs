#!/usr/bin/env node
// Deck genérico de AI Borinquen para la apertura de la llamada del closer (Elvin, 21/sep/2026):
// 3 slides, minimalista, pocas palabras. NO es personalizado por prospecto.
//   1 · Quiénes somos (Puerto Rico)   2 · Nuestra visión   3 · A quién hemos ayudado (4 espacios)
// Los testimonios salen de TESTIMONIOS: los que están vacíos quedan como espacio en blanco para que
// Elvin los llene a mano (o me dice el texto y lo pongo aquí). Solo casos verificados.
//
//   node scripts/demo-cliente/deck-aib.mjs            → demos/ai-borinquen-deck/ai-borinquen.pptx
//   node scripts/demo-cliente/deck-aib.mjs --pdf      → además exporta el PDF con Keynote (macOS)

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "demos", "ai-borinquen-deck");
const LOGO = path.join(ROOT, "public", "marcas", "ai-borinquen-logo-dark.png");

// Cuatro espacios. `nombre` vacío = espacio en blanco. Solo lo respaldado
// (vault/estilo/testimonios-ai-borinquen.md).
const TESTIMONIOS = [
  { nombre: "Teo · Mano Santa PR", rubro: "Terapia", frase: "Respondía el 20 % de sus leads. Hoy responde en segundos y agenda solo." },
  { nombre: "Milton · Caribe Paint", rubro: "Pintura", frase: "“Pensé que sería mucho más complicado. Ha sido bastante fácil.”" },
  { nombre: "Lcdo. Ernest Crison", rubro: "Oficina legal · chat + voz + CRM", frase: "“Llenaron mis expectativas y las superaron. No doy abasto en llamadas y citas. Entran 25 a 50 mensajes al día, casi siempre de madrugada… gracias a Dios que está el sistema.”" },
  { nombre: "", rubro: "", frase: "" },
];

const { default: PptxGenJS } = await import("pptxgenjs");
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9";
pptx.author = "AI Borinquen"; pptx.company = "AI Borinquen"; pptx.title = "AI Borinquen";

const BG = "07160F", PANEL = "0D2118", LINE = "1F3A2B", TXT = "E9F5EE", MUT = "9DB8AA", BORI = "35C06F";
const F = "Helvetica";
const tieneLogo = fs.existsSync(LOGO);

function base(s, eyebrow) {
  s.background = { color: BG };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: BORI } });
  s.addText(eyebrow.toUpperCase(), { x: 0.7, y: 0.45, w: 8, h: 0.3, fontSize: 10, color: BORI, bold: true, charSpacing: 4, fontFace: F });
  if (tieneLogo) s.addImage({ path: LOGO, x: 8.55, y: 0.35, w: 1.0, h: 0.5, sizing: { type: "contain", w: 1.0, h: 0.5 } });
  s.addText("AI Borinquen · Puerto Rico", { x: 0.7, y: 5.15, w: 6, h: 0.3, fontSize: 9, color: MUT, fontFace: F });
}

// 1 · Quiénes somos
let s = pptx.addSlide(); base(s, "Quiénes somos");
s.addText("Agentes de inteligencia artificial\nhechos en Puerto Rico.", { x: 0.7, y: 1.3, w: 8.6, h: 1.6, fontSize: 34, color: TXT, bold: true, fontFace: F, valign: "top" });
s.addText("Instalamos el empleado digital que contesta, precalifica y agenda por tu negocio.\nNo un chatbot.", { x: 0.7, y: 3.15, w: 8.2, h: 1.1, fontSize: 16, color: MUT, fontFace: F, valign: "top" });

// 2 · Nuestra visión
s = pptx.addSlide(); base(s, "Nuestra visión");
s.addText("Que ningún negocio de la isla\npierda un cliente por no contestar a tiempo.", { x: 0.7, y: 1.3, w: 8.6, h: 1.6, fontSize: 30, color: TXT, bold: true, fontFace: F, valign: "top" });
const pilares = [["Digitalizar", "Lo instalamos por ti."], ["Capacitar", "O te enseñamos a hacerlo tú."], ["Medir", "Tú ves cada llamada y cada lead."]];
pilares.forEach(([t, d], i) => {
  const x = 0.7 + i * 2.95;
  s.addShape(pptx.ShapeType.line, { x, y: 3.3, w: 2.6, h: 0, line: { color: BORI, width: 1.5 } });
  s.addText(t, { x, y: 3.4, w: 2.6, h: 0.4, fontSize: 15, color: TXT, bold: true, fontFace: F });
  s.addText(d, { x, y: 3.8, w: 2.6, h: 0.6, fontSize: 12, color: MUT, fontFace: F, valign: "top" });
});

// 3 · A quién hemos ayudado (4 espacios)
s = pptx.addSlide(); base(s, "A quién hemos ayudado");
s.addText("Negocios de aquí.", { x: 0.7, y: 1.0, w: 8, h: 0.6, fontSize: 28, color: TXT, bold: true, fontFace: F });
TESTIMONIOS.forEach((t, i) => {
  const col = i % 2, fila = Math.floor(i / 2);
  const x = 0.7 + col * 4.45, y = 1.8 + fila * 1.6, w = 4.2, h = 1.4;
  const vacio = !t.nombre;
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: vacio ? BG : PANEL }, line: { color: LINE, width: 1, dashType: vacio ? "dash" : "solid" }, rectRadius: 0.08 });
  if (vacio) return; // espacio en blanco para llenar a mano
  s.addText(t.nombre, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.35, fontSize: 13, color: TXT, bold: true, fontFace: F });
  s.addText(t.rubro, { x: x + 0.2, y: y + 0.42, w: w - 0.4, h: 0.25, fontSize: 9, color: BORI, charSpacing: 2, fontFace: F });
  s.addText(t.frase, { x: x + 0.2, y: y + 0.68, w: w - 0.4, h: 0.68, fontSize: 11, color: MUT, italic: t.frase.startsWith("“"), fontFace: F, valign: "top" });
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const pptxPath = path.join(OUT_DIR, "ai-borinquen.pptx");
await pptx.writeFile({ fileName: pptxPath });
console.log(`✓ ${path.relative(ROOT, pptxPath)} (3 slides)`);

if (process.argv.includes("--pdf")) {
  const script = path.join(ROOT, "scripts", "demo-cliente", "pptx-a-pdf.applescript");
  const pdfPath = path.join(OUT_DIR, "ai-borinquen.pdf");
  execSync(`osascript ${JSON.stringify(script)} ${JSON.stringify(pptxPath)} ${JSON.stringify(pdfPath)}`, { stdio: "pipe", timeout: 120000 });
  try { execSync(`osascript -e 'tell application "Keynote" to quit'`, { stdio: "ignore" }); } catch {}
  console.log(`✓ ${path.relative(ROOT, pdfPath)}`);
}
