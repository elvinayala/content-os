// Flyers GRÁFICOS (5/oct/2026, Elvin: "más gráfico: una cisterna, un destape, un tubo botando agua; pocas palabras").
// Reemplazan a los flyers minimalistas que no traían conversaciones (CTR < 2 %): el anuncio nuevo entra ACTIVO en el
// mismo conjunto y el viejo se pausa. Ningún conjunto se apaga. Presupuesto total: $60/día.
// Idempotente: data/meta-ads/campanas/resuelto-graficos-2026-10.json.
// Uso: node --env-file=.env.local vault/proyectos/plomeria-pr/kit/anuncios/lanzar-graficos.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "../../../../..");
const FLY = path.join(AQUI, "../flyers-graficos");
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768", PAGE = "1278171838721301", IG = "17841432209401518";
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-graficos-2026-10.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { creado: new Date().toISOString(), anuncios: {}, pausados: [] };
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

const COPY = {
  fregadero: { title: "Destape · $149", description: "Precio fijo antes de llegar",
    message: "¿El fregadero no baja? Destape simple por $149 de mano de obra (+ $19 de coordinación) en Caguas y pueblos cercanos. Plomero licenciado, precio fijo antes de llegar y garantía de 30 días.\n\nEscríbenos por mensaje con una foto y te agendamos." },
  tubo: { title: "Fugas debajo del fregadero · desde $119", description: "La pieza aparte, con su precio antes",
    message: "¿Se está botando el agua debajo del fregadero? Cambiamos la válvula o la llave de ángulo desde $119 de mano de obra (+ $19 de coordinación). La pieza va aparte y te decimos su precio antes. Plomero licenciado y 12 meses de garantía.\n\nEscríbenos por mensaje con una foto." },
  inodoro: { title: "Inodoro que corre · $99", description: "Flapper, válvula o sello",
    message: "¿El inodoro se queda corriendo? Lo reparamos por $99 de mano de obra (+ $19 de coordinación): flapper, válvula o sello. Las piezas van aparte, con su precio antes. Plomero licenciado y 12 meses de garantía.\n\nEscríbenos por mensaje y te agendamos." },
  cisterna: { title: "Cisterna con bomba · desde $899", description: "Precio por escrito antes de empezar",
    message: "Que el corte de agua no te toque. Instalamos tu cisterna con bomba y conexiones desde $899 de mano de obra (+ $19 de coordinación). La cisterna y la bomba van aparte, y el precio final te lo damos por escrito antes de empezar. Plomero licenciado y 12 meses de garantía.\n\nEscríbenos por mensaje y te damos tu precio." },
  bomba: { title: "Cambio de bomba · $249", description: "La bomba aparte, con su precio antes",
    message: "¿La bomba de la cisterna no prende? Te la cambiamos por $249 de mano de obra (+ $19 de coordinación). La bomba va aparte: te decimos su precio antes de comprarla y tú lo apruebas. Plomero licenciado y 12 meses de garantía.\n\nEscríbenos por mensaje con una foto de la bomba." },
  calentador: { title: "Calentador instalado · $279", description: "Si ya lo tienes, solo la instalación",
    message: "¿Otra vez agua fría? Instalamos tu calentador de tanque por $279 de mano de obra (+ $19 de coordinación). Si ya lo tienes, solo pagas la instalación; si no, te decimos el precio del calentador antes. Plomero licenciado y 12 meses de garantía.\n\nEscríbenos por mensaje y te agendamos." },
};
// [pieza, conjunto, nombre nuevo del conjunto (o null), anuncios viejos que se pausan]
const LOTE = [
  ["fregadero", "120255225330300029", "E · Caguas · Fregadero (gráfico) · Messenger+IG", ["120255225331110029"]],
  ["tubo", "120255225331230029", "E · Caguas · Fuga (gráfico) · Messenger+IG", ["120255225331670029"]],
  ["inodoro", "120255225331700029", "E · Caguas · Inodoro (gráfico) · Messenger+IG", ["120255225332450029"]],
  ["cisterna", "120255203459600029", null, ["120255203463640029"]], // D: sale agua-alta
  ["bomba", "120255203459600029", null, ["120255203462420029"]],    // D: sale grandes
  ["calentador", "120255203459600029", null, ["120255203461010029"]], // D: sale solar
];
// $60/día (Elvin, 5/oct). Meta exige > $2 en conjuntos de mensajes; Llamadas acepta $1.
const PRESUPUESTO = {
  "120255115172980029": 2100, // A Caguas · Precio fijo (el que trae)
  "120255203459600029": 800,  // D Caguas y Cidra · Ticket alto (gráficos de equipo)
  "120255225330300029": 400, "120255225331230029": 400, "120255225331700029": 400, // E Caguas gráficos
  "120255119529220029": 600,  // A Quebradillas
  "120255155398700029": 600,  // A Aguadilla
  "120255155399390029": 201,  // C Aguadilla · Confianza
  "120255155432920029": 100,  // Aguadilla · Llamadas
  "120255225332610029": 201,  // E Quebradillas · Cisterna
  "120255225333360029": 201,  // E Aguadilla · Calentador
};

async function api(p, body) {
  const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
  const j = await r.json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
}
const subirImagen = async (f) => { const d = new FormData(); d.append("bytes", fs.readFileSync(f).toString("base64")); return Object.values((await api(`${ACT}/adimages`, d)).images)[0].hash; };
const CTA = { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } };
const DESTINOS = { call_to_actions: [{ type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER", link: "https://fb.com/messenger_doc/" } }, { type: "INSTAGRAM_MESSAGE", value: { app_destination: "INSTAGRAM_DIRECT", link: "https://www.instagram.com/" } }], optimization_type: "DOF_MESSAGING_DESTINATION", additional_data: { is_click_to_message: true } };
const SIN_ADV = { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } };

for (const c of Object.values(COPY)) if (/gratis|whatsapp|\b(787|939)\b/i.test(c.message + c.title)) throw new Error("copy prohibido");
for (const [pieza] of LOTE) if (!fs.existsSync(path.join(FLY, `g-${pieza}.png`))) throw new Error(`Falta g-${pieza}.png`);

// 1) Presupuesto primero: bajar ya (Elvin: "empieza ahora mismo").
for (const [id, b] of Object.entries(PRESUPUESTO)) await api(id, { daily_budget: b });
console.log(`presupuesto: $${Object.values(PRESUPUESTO).reduce((a, b) => a + b, 0) / 100}/día`);

// 2) Anuncios gráficos nuevos y 3) pausar el flyer viejo que reemplaza.
for (const [pieza, conjunto, nombre, viejos] of LOTE) {
  const x = (plan.anuncios[pieza] ??= { conjunto }), c = COPY[pieza];
  if (nombre && !x.renombrado) { await api(conjunto, { name: nombre }); x.renombrado = true; guardar(); }
  x.imagen ??= await subirImagen(path.join(FLY, `g-${pieza}.png`)); guardar();
  x.creativo ??= (await api(`${ACT}/adcreatives`, { name: `G · ${pieza}`, object_story_spec: { page_id: PAGE, instagram_user_id: IG, link_data: { link: "https://fb.com/messenger_doc/", message: c.message, name: c.title, description: c.description, image_hash: x.imagen, call_to_action: CTA } }, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
  x.ad ??= (await api(`${ACT}/ads`, { name: `G · ${pieza} (gráfico)`, adset_id: conjunto, creative: { creative_id: x.creativo }, status: "ACTIVE" })).id; guardar();
  for (const v of viejos) if (!plan.pausados.includes(v)) { await api(v, { status: "PAUSED" }); plan.pausados.push(v); guardar(); }
  console.log("listo", pieza, x.ad);
}
console.log(OUT);
