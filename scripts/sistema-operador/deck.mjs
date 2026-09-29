// Presentación de venta del Sistema Operador (28/sep/2026): 12 slides 16:9 con la paleta de Shadow
// Operator. La usa Elvin (o el closer) en la llamada de diagnóstico, junto con
// vault/proyectos/sistema-operador/kit-venta/guion-closer.md. La slide 7 (diagnóstico) queda para
// llenarla en vivo con el puntaje del prospecto.
//
//   node scripts/sistema-operador/deck.mjs [salida.pptx]
//
// Por defecto escribe vault/proyectos/sistema-operador/kit-venta/sistema-operador.pptx.

import path from "node:path";
import fs from "node:fs";
import PptxGenJS from "pptxgenjs";

const SALIDA = path.resolve(process.argv[2] || "vault/proyectos/sistema-operador/kit-venta/sistema-operador.pptx");

const BG = "0F1115", CARD = "171A21", CARD2 = "1D212A", LINE = "2B303B";
const TXT = "F2EFE8", MUT = "9AA0AD", ACC = "FFE14D", ACC_FG = "14120A", INK = "5B8CFF";
const F = "Arial";

const SISTEMAS = [
  ["01", "Marketing", "Anuncios y contenido que venden", "Optimiza por la venta, no por el lead barato: saber qué anuncio trajo cada venta."],
  ["02", "IA", "Tu equipo digital", "Convierte tu receta en instrucciones: lo que haces igual cada semana, la IA lo hace como tú."],
  ["03", "Operaciones", "Un negocio que no depende de ti", "Nadie con más de 3–4 reportes directos; tus líderes deciden en su alcance."],
  ["04", "Ventas", "Que no se escape un lead", "Nunca des un lead por muerto: ~$32K recuperados en mes y medio solo en seguimientos."],
  ["05", "Reclutamiento", "La persona correcta, rápido", "Filtra en 6 días, no en 6 meses: KPIs desde el primer día."],
  ["06", "Entrenamiento", "Un equipo que mejora cada semana", "Los deportistas no juegan sin calentar: 20 minutos de práctica antes de la primera llamada."],
];

const VALOR = [
  ["Diagnóstico de los 6 sistemas + 1:1 + plan de 90 días", 2500],
  ["Los 6 playbooks", 6000],
  ["Instalación acompañada (done-with-you)", 7500],
  ["Kit de plantillas (SOPs, guiones, seguimientos, campañas, perfiles)", 4000],
  ["Tu equipo digital (instrucciones de IA con tu voz + mapa de agentes)", 5000],
  ["Sistema de seguimiento configurado", 2000],
  ["12 llamadas grupales", 3600],
  ["4 llamadas 1:1 con Elvin", 4000],
  ["Las pepitas (+$100K en mentorías, destiladas)", 3000],
  ["Soporte por Slack 90 días", 1500],
];

const usd = (n) => "$" + n.toLocaleString("en-US");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9"; // 10 × 5.625 in
pptx.author = "Elvin Ayala";
pptx.company = "EA Market LLC";
pptx.title = "Sistema Operador";

const base = (s, n) => {
  s.background = { color: BG };
  s.addText("SISTEMA OPERADOR · ELVIN AYALA", { x: 0.5, y: 5.2, w: 6, h: 0.25, fontSize: 8, color: MUT, charSpacing: 2, fontFace: F });
  if (n) s.addText(String(n).padStart(2, "0"), { x: 8.9, y: 5.2, w: 0.6, h: 0.25, fontSize: 8, color: MUT, align: "right", fontFace: F });
};
const titulo = (s, eyebrow, t) => {
  s.addText(eyebrow.toUpperCase(), { x: 0.5, y: 0.35, w: 9, h: 0.3, fontSize: 10, color: INK, bold: true, charSpacing: 3, fontFace: F });
  s.addText(t, { x: 0.5, y: 0.65, w: 9, h: 0.75, fontSize: 26, color: TXT, bold: true, fontFace: F });
};
const tarjeta = (s, x, y, w, h, fill = CARD) => s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: fill }, line: { color: LINE, width: 0.75 }, rectRadius: 0.12 });

// 1 · Portada
{
  const s = pptx.addSlide();
  base(s);
  s.addText("POR APLICACIÓN · 90 DÍAS · CON ELVIN AYALA", { x: 0.6, y: 1.0, w: 9, h: 0.3, fontSize: 10, color: INK, bold: true, charSpacing: 3, fontFace: F });
  s.addText([
    { text: "Tu negocio no necesita más horas. Necesita ", options: { color: TXT } },
    { text: "un sistema.", options: { color: ACC } },
  ], { x: 0.6, y: 1.4, w: 8.8, h: 1.8, fontSize: 38, bold: true, fontFace: F, valign: "top" });
  s.addText("Los 6 sistemas con los que mis dos agencias facturan ~$1.5M al año, instalados en tu negocio contigo en 90 días.", { x: 0.6, y: 3.35, w: 8, h: 0.8, fontSize: 16, color: MUT, fontFace: F });
}

// 2 · Quién soy
{
  const s = pptx.addSlide();
  base(s, 2);
  titulo(s, "Quién te acompaña", "Yo he sido un fantasma.");
  s.addText("Construí Level Up Media y AI Borinquen en silencio. Pagué más de $100K en mentorías y me equivoqué lo suficiente para saber qué funciona. Este es el sistema que quedó.", { x: 0.5, y: 1.5, w: 9, h: 0.9, fontSize: 15, color: MUT, fontFace: F });
  [["~$1.5M", "al año entre mis 2 agencias"], ["+$100K", "invertidos en mentorías"], ["2", "agencias operando con este sistema"], ["5 AM", "board meeting de mis agentes de IA"]].forEach(([n, t], i) => {
    const x = 0.5 + i * 2.28;
    tarjeta(s, x, 2.7, 2.1, 1.7);
    s.addText(n, { x: x + 0.15, y: 2.85, w: 1.9, h: 0.7, fontSize: 28, bold: true, color: ACC, fontFace: F });
    s.addText(t, { x: x + 0.15, y: 3.55, w: 1.85, h: 0.75, fontSize: 12, color: MUT, fontFace: F, valign: "top" });
  });
}

// 3 · El problema
{
  const s = pptx.addSlide();
  base(s, 3);
  titulo(s, "Si te suena familiar", "Vendes. Pero el negocio eres tú.");
  [
    ["La plata se escapa entre marketing y ventas", "No sabes qué anuncio trajo la venta. Los leads esperan horas. El que no compró nunca recibe seguimiento."],
    ["Todo pasa por ti", "Apruebas cada cosa, respondes cada pregunta y, si paras una semana, se nota en la venta."],
    ["El equipo no rinde parejo", "Contratas por intuición, entrenas sobre la marcha y te enteras tarde de quién no funciona."],
  ].forEach(([t, d], i) => {
    const x = 0.5 + i * 3.05;
    tarjeta(s, x, 1.65, 2.85, 2.9);
    s.addText(t, { x: x + 0.2, y: 1.85, w: 2.5, h: 0.9, fontSize: 16, bold: true, color: TXT, fontFace: F, valign: "top" });
    s.addText(d, { x: x + 0.2, y: 2.8, w: 2.5, h: 1.6, fontSize: 12, color: MUT, fontFace: F, valign: "top" });
  });
}

// 4 · La columna: los 4 Fundamentos
{
  const s = pptx.addSlide();
  base(s, 4);
  titulo(s, "La columna", "Todo se sostiene en 4 fundamentos.");
  [["Nicho", "Dolor y dinero"], ["Oferta", "Promesa, valor, credibilidad, riesgo"], ["Contenido", "Gancho, problema, prueba, CTA"], ["Estrategia", "Por dónde entra, por dónde compra"]].forEach(([t, d], i) => {
    const x = 0.5 + i * 2.28;
    tarjeta(s, x, 1.7, 2.1, 1.9, CARD2);
    s.addText(String(i + 1), { x: x + 0.15, y: 1.8, w: 0.6, h: 0.5, fontSize: 20, bold: true, color: ACC, fontFace: F });
    s.addText(t, { x: x + 0.15, y: 2.35, w: 1.9, h: 0.45, fontSize: 18, bold: true, color: TXT, fontFace: F });
    s.addText(d, { x: x + 0.15, y: 2.85, w: 1.85, h: 0.7, fontSize: 11, color: MUT, fontFace: F, valign: "top" });
  });
  s.addText("“Si están bien, el negocio funciona. Si uno falla, todo se cae.” Casi siempre falla la oferta, no el tráfico: nunca bajes el precio, quita componentes.", { x: 0.5, y: 3.9, w: 9, h: 0.9, fontSize: 14, color: MUT, italic: true, fontFace: F });
}

// 5 · Los 6 sistemas
{
  const s = pptx.addSlide();
  base(s, 5);
  titulo(s, "El sistema", "Seis sistemas instalados en tu negocio.");
  SISTEMAS.forEach(([n, nombre, sub], i) => {
    const x = 0.5 + (i % 3) * 3.05, y = 1.6 + Math.floor(i / 3) * 1.75;
    tarjeta(s, x, y, 2.85, 1.55);
    s.addText(`${n} · ${nombre.toUpperCase()}`, { x: x + 0.2, y: y + 0.15, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: INK, charSpacing: 2, fontFace: F });
    s.addText(sub, { x: x + 0.2, y: y + 0.5, w: 2.5, h: 0.9, fontSize: 16, bold: true, color: TXT, fontFace: F, valign: "top" });
  });
}

// 6 · Cada sistema vale por sí solo: las palancas
{
  const s = pptx.addSlide();
  base(s, 6);
  titulo(s, "Cada sistema vale por sí solo", "Un consejo que te cambia el negocio.");
  SISTEMAS.forEach(([n, nombre, , palanca], i) => {
    const y = 1.55 + i * 0.58;
    s.addText(nombre, { x: 0.5, y, w: 1.9, h: 0.5, fontSize: 13, bold: true, color: ACC, fontFace: F, valign: "middle" });
    s.addText(palanca, { x: 2.4, y, w: 7.1, h: 0.5, fontSize: 13, color: TXT, fontFace: F, valign: "middle" });
    if (i < SISTEMAS.length - 1) s.addShape(pptx.ShapeType.line, { x: 0.5, y: y + 0.54, w: 9, h: 0, line: { color: LINE, width: 0.75 } });
  });
}

// 7 · Tu diagnóstico (se llena en vivo)
{
  const s = pptx.addSlide();
  base(s, 7);
  titulo(s, "Tu diagnóstico", "Dónde está tu negocio hoy.");
  const filas = [
    [{ text: "Sistema", options: { bold: true, color: MUT } }, { text: "Puntaje (0–10)", options: { bold: true, color: MUT, align: "center" } }, { text: "Lo que vimos", options: { bold: true, color: MUT } }],
    ...SISTEMAS.map(([, nombre]) => [{ text: nombre, options: { color: TXT, bold: true } }, { text: "", options: { align: "center" } }, { text: "" }]),
  ];
  s.addTable(filas, { x: 0.5, y: 1.55, w: 9, colW: [2.2, 1.6, 5.2], fontSize: 13, fontFace: F, color: TXT, fill: { color: CARD }, border: { type: "solid", color: LINE, pt: 0.75 }, rowH: 0.42 });
  s.addText("Tus 2 sistemas prioritarios: ______________________  ·  ______________________", { x: 0.5, y: 4.65, w: 9, h: 0.35, fontSize: 13, bold: true, color: ACC, fontFace: F });
}

// 8 · Cómo funciona: 90 días
{
  const s = pptx.addSlide();
  base(s, 8);
  titulo(s, "Cómo funciona", "90 días, con un plan hecho para tu negocio.");
  [
    ["SEMANA 1", "Diagnóstico", "Auditamos los 6 sistemas + 1:1 conmigo. Escogemos los 2 que más te mueven."],
    ["SEMANAS 2–4", "Palancas", "Aplicamos la palanca de tus 2 sistemas prioritarios. Primer resultado medible."],
    ["SEMANAS 5–10", "Instalación", "Instalamos los prioritarios completos y arrancamos los otros cuatro."],
    ["SEMANAS 11–13", "Operación", "Tu negocio opera el sistema con números. Plan de los próximos 90 días."],
  ].forEach(([sem, t, d], i) => {
    const x = 0.5 + i * 2.28;
    s.addShape(pptx.ShapeType.rect, { x, y: 1.7, w: 2.1, h: 0.06, fill: { color: i < 2 ? ACC : LINE }, line: { color: i < 2 ? ACC : LINE, width: 0 } });
    s.addText(sem, { x, y: 1.9, w: 2.1, h: 0.3, fontSize: 10, bold: true, color: MUT, charSpacing: 2, fontFace: F });
    s.addText(t, { x, y: 2.2, w: 2.1, h: 0.45, fontSize: 18, bold: true, color: TXT, fontFace: F });
    s.addText(d, { x, y: 2.7, w: 2.05, h: 1.3, fontSize: 12, color: MUT, fontFace: F, valign: "top" });
  });
  s.addText("Cada semana: 1 llamada grupal + 3–4 horas de implementación · 4 llamadas 1:1 con Elvin · soporte del equipo por Slack", { x: 0.5, y: 4.4, w: 9, h: 0.4, fontSize: 12, color: TXT, fontFace: F });
}

// 9 · Lo que recibes
{
  const s = pptx.addSlide();
  base(s, 9);
  titulo(s, "Lo que recibes", "Todo lo que usamos en EA Market, para ti.");
  const total = VALOR.reduce((a, [, v]) => a + v, 0);
  const filas = [
    ...VALOR.map(([t, v]) => [{ text: t, options: { color: TXT } }, { text: usd(v), options: { color: MUT, align: "right" } }]),
    [{ text: "Valor total", options: { bold: true, color: ACC } }, { text: usd(total), options: { bold: true, color: ACC, align: "right" } }],
  ];
  s.addTable(filas, { x: 0.5, y: 1.45, w: 6.1, colW: [4.9, 1.2], fontSize: 11, fontFace: F, fill: { color: CARD }, border: { type: "solid", color: LINE, pt: 0.5 }, rowH: 0.31 });
  tarjeta(s, 6.85, 1.45, 2.65, 3.4, CARD2);
  s.addText("BONOS · PAGO ÚNICO", { x: 7.0, y: 1.6, w: 2.4, h: 0.3, fontSize: 10, bold: true, color: ACC, charSpacing: 2, fontFace: F });
  s.addText(
    ["2 videos de motion graphics con tu marca", "12 meses en la comunidad", "Actualizaciones del sistema por 12 meses"].map((t) => ({ text: "•  " + t, options: { breakLine: true } })),
    { x: 7.0, y: 2.0, w: 2.4, h: 2.6, fontSize: 13, color: TXT, fontFace: F, paraSpaceAfter: 10, valign: "top" },
  );
}

// 10 · Prueba
{
  const s = pptx.addSlide();
  base(s, 10);
  titulo(s, "Funciona porque ya funciona", "El mismo sistema, en negocios reales.");
  [
    ["Yadiel", "Coaching", "De ~$5K a $40–50K al mes con setter, closer y mentorías: los sistemas de ventas y entrenamiento."],
    ["Mano Santa PR", "Servicios", "De responder el 20 % de sus leads a responder en segundos: el sistema de IA aplicado a ventas."],
    ["EA Market", "Mis agencias", "~$1.5M al año con agentes que trabajan de verdad, CRM propio y los números del equipo a la vista."],
  ].forEach(([n, tag, d], i) => {
    const x = 0.5 + i * 3.05;
    tarjeta(s, x, 1.65, 2.85, 2.9);
    s.addText(tag.toUpperCase(), { x: x + 0.2, y: 1.8, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: INK, charSpacing: 2, fontFace: F });
    s.addText(n, { x: x + 0.2, y: 2.1, w: 2.5, h: 0.5, fontSize: 20, bold: true, color: TXT, fontFace: F });
    s.addText(d, { x: x + 0.2, y: 2.7, w: 2.5, h: 1.7, fontSize: 13, color: MUT, fontFace: F, valign: "top" });
  });
}

// 11 · Garantía + para quién
{
  const s = pptx.addSlide();
  base(s, 11);
  titulo(s, "Sin letra pequeña", "Garantía de implementación.");
  tarjeta(s, 0.5, 1.55, 9, 1.35, CARD2);
  s.addShape(pptx.ShapeType.ellipse, { x: 0.75, y: 1.75, w: 0.95, h: 0.95, fill: { color: ACC }, line: { color: ACC, width: 0 } });
  s.addText("90\nDÍAS", { x: 0.75, y: 1.75, w: 0.95, h: 0.95, fontSize: 12, bold: true, color: ACC_FG, align: "center", valign: "middle", fontFace: F });
  s.addText("Si en 90 días no tienes instalados los sistemas que acordamos, te seguimos acompañando sin costo hasta que queden. Te pido que vengas a las llamadas y hagas las tareas. No prometo ingresos: prometo el sistema instalado.", { x: 1.95, y: 1.65, w: 7.35, h: 1.15, fontSize: 13, color: TXT, fontFace: F, valign: "middle" });
  s.addText("ES PARA TI SI…", { x: 0.5, y: 3.15, w: 4.4, h: 0.3, fontSize: 10, bold: true, color: ACC, charSpacing: 2, fontFace: F });
  s.addText(["Tu negocio digital ya factura $10K+ al mes", "Tienes oferta y clientes, pero todo depende de ti", "Puedes darle 4–5 horas a la semana por 90 días"].map((t) => ({ text: "✓  " + t, options: { breakLine: true } })), { x: 0.5, y: 3.45, w: 4.4, h: 1.4, fontSize: 12, color: TXT, fontFace: F, valign: "top", paraSpaceAfter: 6 });
  s.addText("NO ES PARA TI SI…", { x: 5.1, y: 3.15, w: 4.4, h: 0.3, fontSize: 10, bold: true, color: MUT, charSpacing: 2, fontFace: F });
  s.addText(["Estás empezando de cero", "Tu negocio es un local físico", "Quieres que te lo hagan todo sin participar"].map((t) => ({ text: "✕  " + t, options: { breakLine: true } })), { x: 5.1, y: 3.45, w: 4.4, h: 1.4, fontSize: 12, color: MUT, fontFace: F, valign: "top", paraSpaceAfter: 6 });
}

// 12 · Inversión y siguientes pasos
{
  const s = pptx.addSlide();
  base(s, 12);
  titulo(s, "Tu inversión", "Un solo pago. El sistema es tuyo.");
  tarjeta(s, 0.5, 1.55, 4.3, 2.4);
  s.addText("PRECIO REGULAR", { x: 0.7, y: 1.7, w: 4, h: 0.3, fontSize: 10, bold: true, color: MUT, charSpacing: 2, fontFace: F });
  s.addText("$15,000", { x: 0.7, y: 2.0, w: 4, h: 0.8, fontSize: 40, bold: true, color: MUT, strike: "sngStrike", fontFace: F });
  s.addText("Valor total: $39,100", { x: 0.7, y: 2.9, w: 4, h: 0.4, fontSize: 13, color: MUT, fontFace: F });
  s.addShape(pptx.ShapeType.roundRect, { x: 5.05, y: 1.55, w: 4.45, h: 2.4, fill: { color: ACC }, line: { color: ACC, width: 0 }, rectRadius: 0.12 });
  s.addText("FUNDADOR · 10 CUPOS", { x: 5.25, y: 1.7, w: 4, h: 0.3, fontSize: 10, bold: true, color: ACC_FG, charSpacing: 2, fontFace: F });
  s.addText("$9,997", { x: 5.25, y: 2.0, w: 4, h: 0.8, fontSize: 40, bold: true, color: ACC_FG, fontFace: F });
  s.addText("Pago único o financiado. A cambio, documentamos tu caso contigo: el antes y el después.", { x: 5.25, y: 2.85, w: 4.05, h: 0.9, fontSize: 12, color: ACC_FG, fontFace: F, valign: "top" });
  s.addText("SIGUIENTES PASOS", { x: 0.5, y: 4.15, w: 9, h: 0.3, fontSize: 10, bold: true, color: INK, charSpacing: 2, fontFace: F });
  s.addText("1. Aseguras tu cupo hoy   ·   2. Firmas el acuerdo   ·   3. En 24 h: bienvenida + tu 1:1 de la semana 1", { x: 0.5, y: 4.45, w: 9, h: 0.4, fontSize: 13, color: TXT, fontFace: F });
}

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
await pptx.writeFile({ fileName: SALIDA });
console.log(`✓ ${path.relative(process.cwd(), SALIDA)} (12 slides)`);
