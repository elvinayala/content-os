import "server-only";

// PDF del contrato de AI Borinquen ya firmado, con pdf-lib (JS puro: corre en Vercel sin Chromium). Membrete de AIB en
// cada página (franja oscura + logo + línea verde), iniciales del cliente y "Página X de Y" en el pie, y una hoja final
// de certificado (constancia de la firma). Fuentes estándar (Helvetica, WinAnsi): se limpian los caracteres que no
// tiene (emojis, flechas) para que nunca falle por un dato raro del cliente.

import fs from "node:fs/promises";
import path from "node:path";

import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

import { fechaLarga, type Hoja } from "./documento";

const W = 612, H = 792, MX = 54, TOP = 92, BOTTOM = 60; // carta, márgenes en puntos
const C = {
  fondo: rgb(0.02, 0.055, 0.04), verde: rgb(0.17, 1, 0.53), teal: rgb(0.12, 0.71, 0.65),
  tinta: rgb(0.08, 0.12, 0.1), gris: rgb(0.38, 0.45, 0.41), linea: rgb(0.85, 0.89, 0.87), suave: rgb(0.95, 0.97, 0.96),
};

// WinAnsi (cp1252): ASCII + Latin-1 + estos extras. Lo demás se reemplaza o se quita.
const EXTRAS = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
function winAnsi(s: string): string {
  return s.replace(/[→←]/g, "->").replace(/[✓✔]/g, "x").replace(/[   ]/g, " ")
    .split("").filter((ch) => { const c = ch.charCodeAt(0); return (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || EXTRAS.includes(ch) || ch === "\n"; }).join("");
}

function partir(texto: string, f: PDFFont, tam: number, ancho: number): string[] {
  const out: string[] = [];
  for (const parrafo of winAnsi(texto).split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (f.widthOfTextAtSize(prueba, tam) <= ancho) { linea = prueba; continue; }
      if (linea) out.push(linea);
      linea = palabra;
      while (f.widthOfTextAtSize(linea, tam) > ancho) { // palabra larguísima (un correo, un link)
        let i = linea.length; while (i > 1 && f.widthOfTextAtSize(linea.slice(0, i), tam) > ancho) i--;
        out.push(linea.slice(0, i)); linea = linea.slice(i);
      }
    }
    out.push(linea);
  }
  return out;
}

export interface DatosPdf {
  codigo: string;
  hojas: Hoja[];
  firma: string; iniciales: string; // PNG data URL
  firmante: string;
  emitido: { en: string; por: string };
  abierto: { en: string; ip: string } | null;
  firmado: { en: string; ip: string; ua: string };
  hashContenido: string;
}

const pngDe = (dataUrl: string) => Buffer.from(dataUrl.split(",")[1] ?? "", "base64");
const horaPR = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", dateStyle: "long", timeStyle: "medium" }) + " (hora de PR)";

export async function pdfContrato(d: DatosPdf): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${d.codigo} · Acuerdo de servicios y pago · AI Borinquen`);
  doc.setAuthor("EA Market LLC · AI Borinquen");
  const [reg, neg, obl] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold), doc.embedFont(StandardFonts.HelveticaOblique)]);
  const logoBytes = await fs.readFile(path.join(process.cwd(), "public/marcas/ai-borinquen/lockup-horizontal-transparente.png"));
  const [logo, firma, iniciales] = await Promise.all([doc.embedPng(logoBytes), doc.embedPng(pngDe(d.firma)), doc.embedPng(pngDe(d.iniciales))]);

  let page!: PDFPage, y = 0;
  const nueva = () => { page = doc.addPage([W, H]); y = H - TOP; };
  const espacio = (alto: number) => { if (y - alto < BOTTOM) nueva(); };
  const ancho = W - 2 * MX;
  const texto = (s: string, o: { f?: PDFFont; tam?: number; color?: ReturnType<typeof rgb>; x?: number; w?: number; inter?: number } = {}) => {
    const f = o.f ?? reg, tam = o.tam ?? 9.5, inter = o.inter ?? tam * 1.42, x = o.x ?? MX;
    for (const l of partir(s, f, tam, o.w ?? ancho)) { espacio(inter); page.drawText(l, { x, y: y - tam, size: tam, font: f, color: o.color ?? C.tinta }); y -= inter; }
  };
  const imagen = (img: PDFImage, alto: number, x: number, yBase: number, maxW = 200) => {
    const s = Math.min(alto / img.height, maxW / img.width);
    page.drawImage(img, { x, y: yBase, width: img.width * s, height: img.height * s });
  };

  for (const hoja of d.hojas) {
    nueva();
    for (const b of hoja.bloques) {
      if (b.t === "titulo") {
        texto(b.tag.toUpperCase(), { f: neg, tam: 7.5, color: C.teal });
        y -= 2; texto(b.texto, { f: neg, tam: 19 }); y -= 6;
      } else if (b.t === "h") {
        y -= 6; espacio(30); texto(b.texto, { f: neg, tam: 11 }); y -= 2;
      } else if (b.t === "p") {
        texto(b.texto, { inter: 13.4 }); y -= 6;
      } else if (b.t === "nota") {
        const lineas = partir(b.texto, obl, 8.5, ancho - 20), alto = lineas.length * 12 + 14;
        espacio(alto + 4);
        page.drawRectangle({ x: MX, y: y - alto, width: ancho, height: alto, color: C.suave, borderColor: C.linea, borderWidth: 0.6 });
        let yy = y - 18; for (const l of lineas) { page.drawText(l, { x: MX + 10, y: yy, size: 8.5, font: obl, color: C.gris }); yy -= 12; }
        y -= alto + 8;
      } else if (b.t === "opciones") {
        const col = ancho / 2;
        b.opciones.forEach((o, i) => {
          if (i % 2 === 0) espacio(16);
          const x = MX + (i % 2) * col, yy = y - 11;
          page.drawRectangle({ x, y: yy - 1, width: 9, height: 9, borderColor: C.tinta, borderWidth: 0.8, color: o.marcado ? C.fondo : undefined });
          if (o.marcado) page.drawText("x", { x: x + 2.2, y: yy + 0.8, size: 8, font: neg, color: C.verde });
          page.drawText(winAnsi(o.texto), { x: x + 15, y: yy, size: 9.5, font: o.marcado ? neg : reg, color: C.tinta });
          if (i % 2 === 1 || i === b.opciones.length - 1) y -= 16;
        });
        y -= 4;
      } else if (b.t === "datos") {
        const kW = 150, vW = ancho - kW - 16;
        for (const [k, v] of b.filas) {
          const lk = partir(k, neg, 8.5, kW - 8), lv = partir(v, reg, 9.5, vW), alto = Math.max(lk.length * 11, lv.length * 13) + 10;
          if (y - alto < BOTTOM) nueva();
          page.drawRectangle({ x: MX, y: y - alto, width: kW, height: alto, color: C.suave });
          page.drawLine({ start: { x: MX, y: y - alto }, end: { x: MX + ancho, y: y - alto }, thickness: 0.6, color: C.linea });
          let yk = y - 14; for (const l of lk) { page.drawText(l, { x: MX + 6, y: yk, size: 8.5, font: neg, color: C.gris }); yk -= 11; }
          let yv = y - 14; for (const l of lv) { page.drawText(l, { x: MX + kW + 8, y: yv, size: 9.5, font: reg, color: C.tinta }); yv -= 13; }
          y -= alto;
        }
        y -= 8;
      } else if (b.t === "firmas") {
        y -= 10; espacio(110);
        const col = (ancho - 24) / 2, base = y - 62;
        imagen(firma, 46, MX, base + 4, col);
        page.drawText("AI Borinquen", { x: MX + col + 24, y: base + 22, size: 17, font: obl, color: C.fondo });
        page.drawText(winAnsi(`Firmado electrónicamente · ${fechaLarga(d.emitido.en)}`), { x: MX + col + 24, y: base + 8, size: 7, font: reg, color: C.gris });
        for (const [i, t, s] of [[0, "Firma del cliente", d.firmante.split(" · ")[0]], [1, "Por AI Borinquen", "EA Market LLC · representante autorizado"]] as const) {
          const x = MX + i * (col + 24);
          page.drawLine({ start: { x, y: base }, end: { x: x + col, y: base }, thickness: 0.8, color: C.tinta });
          page.drawText(winAnsi(t), { x, y: base - 12, size: 8.5, font: neg, color: C.tinta });
          let sub = winAnsi(s); while (sub.length > 4 && reg.widthOfTextAtSize(sub, 8.5) > col) sub = sub.slice(0, -2).trimEnd() + "…";
          page.drawText(sub, { x, y: base - 24, size: 8.5, font: reg, color: C.gris });
        }
        page.drawText(winAnsi(`Fecha: ${horaPR(d.firmado.en)}`), { x: MX, y: base - 40, size: 8.5, font: reg, color: C.gris });
        y = base - 50;
      }
    }
  }

  // Certificado (constancia de la firma)
  nueva();
  texto("CONSTANCIA DE FIRMA ELECTRÓNICA", { f: neg, tam: 7.5, color: C.teal }); y -= 2;
  texto("Certificado", { f: neg, tam: 19 }); y -= 6;
  texto("Este documento fue firmado electrónicamente en la plataforma de AI Borinquen (EA Market LLC). La persona firmante completó sus datos, dibujó su firma, puso sus iniciales en cada página y aceptó firmar electrónicamente, conforme a la Ley de Transacciones Electrónicas de Puerto Rico (Ley 148-2006) y la ley federal E-SIGN.", { inter: 13.4 });
  y -= 8;
  const filas: [string, string][] = [
    ["Documento", `${d.codigo} · Acuerdo de servicios y pago · AI Borinquen`],
    ["Firmante", d.firmante],
    ["Emitido por AI Borinquen", `${horaPR(d.emitido.en)} · ${d.emitido.por}`],
    ...(d.abierto ? [["Abierto por el firmante", `${horaPR(d.abierto.en)} · IP ${d.abierto.ip}`] as [string, string]] : []),
    ["Firmado", `${horaPR(d.firmado.en)} · IP ${d.firmado.ip}`],
    ["Dispositivo", d.firmado.ua.slice(0, 180)],
    ["Iniciales", `Páginas 1 a ${d.hojas.length} (todas)`],
    ["Huella del contenido (SHA-256)", d.hashContenido],
  ];
  const kW = 150;
  for (const [k, v] of filas) {
    const lv = partir(v, reg, 9, ancho - kW - 16), alto = lv.length * 12 + 10;
    if (y - alto < BOTTOM) nueva();
    page.drawRectangle({ x: MX, y: y - alto, width: kW, height: alto, color: C.suave });
    page.drawLine({ start: { x: MX, y: y - alto }, end: { x: MX + ancho, y: y - alto }, thickness: 0.6, color: C.linea });
    page.drawText(winAnsi(k), { x: MX + 6, y: y - 14, size: 8.5, font: neg, color: C.gris });
    let yv = y - 14; for (const l of lv) { page.drawText(l, { x: MX + kW + 8, y: yv, size: 9, font: reg, color: C.tinta }); yv -= 12; }
    y -= alto;
  }
  y -= 10; texto("Cualquier cambio al contenido firmado cambia la huella. AI Borinquen conserva el original.", { tam: 8.5, color: C.gris });

  // Membrete y pie en todas las páginas
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    p.drawRectangle({ x: 0, y: H - 58, width: W, height: 58, color: C.fondo });
    p.drawRectangle({ x: 0, y: H - 61, width: W, height: 3, color: C.verde });
    const s = 26 / logo.height;
    p.drawImage(logo, { x: MX, y: H - 44, width: logo.width * s, height: 26 });
    const der = winAnsi("EA Market LLC  ·  Mayagüez, Puerto Rico");
    p.drawText(der, { x: W - MX - reg.widthOfTextAtSize(der, 7.5), y: H - 34, size: 7.5, font: reg, color: rgb(0.83, 0.9, 0.86) });
    const pie = winAnsi(`${d.codigo} · Acuerdo de servicios y pago · firmado electrónicamente`);
    p.drawText(pie, { x: MX, y: 30, size: 7, font: reg, color: C.gris });
    const num = `Página ${i + 1} de ${paginas.length}`;
    p.drawText(winAnsi(num), { x: W - MX - reg.widthOfTextAtSize(winAnsi(num), 7), y: 30, size: 7, font: reg, color: C.gris });
    const sI = Math.min(18 / iniciales.height, 60 / iniciales.width), wI = iniciales.width * sI;
    p.drawText("Iniciales:", { x: W / 2 - 40, y: 30, size: 7, font: reg, color: C.gris });
    p.drawImage(iniciales, { x: W / 2, y: 26, width: wI, height: iniciales.height * sI });
    p.drawLine({ start: { x: W / 2, y: 26 }, end: { x: W / 2 + Math.max(wI, 40), y: 26 }, thickness: 0.5, color: C.gris });
  });
  return doc.save();
}
