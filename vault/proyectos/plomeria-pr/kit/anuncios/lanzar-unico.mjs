// Conjuntos "E · <área> · <servicio>": UN flyer de ticket alto por conjunto, dentro de las campañas de clientes que ya
// corren (3/oct/2026, Elvin: "usa seis de ellos en las campañas que ya están; crea más conjuntos, conjunto-creativo,
// alternado entre las campañas; no apagues lo que estaba funcionando"). Flyers de kit/flyers-ticket-alto (unico.mjs).
// Público copiado del conjunto A (Precio fijo) del área, desde 30 años. Messenger + IG DM, conversaciones. Nacen ACTIVOS.
// Idempotente: guarda los ids en data/meta-ads/campanas/resuelto-ticket-unico-2026-10.json.
//
// Uso (desde la raíz del repo):  node --env-file=.env.local vault/proyectos/plomeria-pr/kit/anuncios/lanzar-unico.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "../../../../..");
const FLY = path.join(AQUI, "../flyers-ticket-alto");
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768", PAGE = "1278171838721301", IG = "17841432209401518";
const PRESUPUESTO = Math.round(Number(process.env.PRESUPUESTO_DIA ?? 5) * 100);
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-ticket-unico-2026-10.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { creado: new Date().toISOString(), conjuntos: {} };
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

const A = { caguas: "120255115172980029", quebradillas: "120255119529220029", aguadilla: "120255155398700029" };
const NOMBRE = { caguas: "Caguas", quebradillas: "Quebradillas", aguadilla: "Aguadilla" };
const COPY = {
  "bomba-cisterna": { s: "Bomba de cisterna", title: "Reemplazo de bomba · $249", description: "La bomba aparte, con su precio antes",
    message: "¿La bomba de la cisterna no prende? Te la cambiamos por $249 de mano de obra (+ $19 de coordinación). La bomba va aparte: te decimos su precio antes de comprarla y tú lo apruebas. Plomero licenciado de tu zona y 12 meses de garantía.\n\nEscríbenos por mensaje con una foto de la bomba." },
  "calentador-tanque": { s: "Calentador", title: "Calentador instalado · $279", description: "Si ya lo tienes, solo la instalación",
    message: "¿Otra vez agua fría? Instalamos tu calentador de tanque por $279 de mano de obra (+ $19 de coordinación). Si ya lo tienes, solo pagas la instalación; si no, te decimos el precio del calentador antes. Plomero licenciado y 12 meses de garantía.\n\nEscríbenos por mensaje y te agendamos." },
  "reparacion-filtracion": { s: "Filtraciones", title: "Filtraciones · desde $349", description: "Precio fijo antes de romper",
    message: "¿Humedad o una mancha en la pared? Reparamos filtraciones en pared o piso desde $349 de mano de obra (+ $19 de coordinación). El plomero te da el precio fijo antes de romper nada, y no se toca hasta que lo apruebes. 12 meses de garantía.\n\nEscríbenos por mensaje con una foto." },
  "cisterna-bomba": { s: "Cisterna", title: "Cisterna con bomba · desde $899", description: "Precio por escrito antes de empezar",
    message: "Que el corte de agua no te toque. Instalamos tu cisterna con bomba y conexiones desde $899 de mano de obra (+ $19 de coordinación). La cisterna y la bomba van aparte, y el precio final te lo damos por escrito antes de empezar. Plomero licenciado de tu zona y 12 meses de garantía.\n\nEscríbenos por mensaje y te damos tu precio." },
};
const LOTE = [["caguas", "bomba-cisterna"], ["caguas", "calentador-tanque"], ["caguas", "reparacion-filtracion"], ["quebradillas", "cisterna-bomba"], ["aguadilla", "calentador-tanque"]];

for (const c of Object.values(COPY)) if (/gratis|whatsapp|\b(787|939)\b/i.test(c.message + c.title)) throw new Error("copy prohibido");
const faltan = LOTE.map(([a, p]) => path.join(FLY, `ta-${a}-${p}-feed.png`)).filter((f) => !fs.existsSync(f));
if (faltan.length) throw new Error("Faltan flyers:\n" + faltan.join("\n"));

async function api(p, body) {
  const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
  const j = await r.json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
}
const leer = async (p) => { const j = await (await fetch(`https://graph.facebook.com/v25.0/${p}${p.includes("?") ? "&" : "?"}access_token=${T}`)).json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j; };
const subirImagen = async (f) => { const d = new FormData(); d.append("bytes", fs.readFileSync(f).toString("base64")); return Object.values((await api(`${ACT}/adimages`, d)).images)[0].hash; };
const CTA = { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } };
const DESTINOS = { call_to_actions: [{ type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER", link: "https://fb.com/messenger_doc/" } }, { type: "INSTAGRAM_MESSAGE", value: { app_destination: "INSTAGRAM_DIRECT", link: "https://www.instagram.com/" } }], optimization_type: "DOF_MESSAGING_DESTINATION", additional_data: { is_click_to_message: true } };
const SIN_ADV = { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } };

for (const [area, pieza] of LOTE) {
  const k = `${area}:${pieza}`, x = (plan.conjuntos[k] ??= {}), c = COPY[pieza];
  if (x.ad) { console.log("ya estaba", k); continue; }
  const a = await leer(`${A[area]}?fields=campaign_id,targeting`);
  x.conjunto ??= (await api(`${ACT}/adsets`, { name: `E · ${NOMBRE[area]} · ${c.s} · Messenger+IG`, campaign_id: a.campaign_id, status: "ACTIVE", daily_budget: PRESUPUESTO, billing_event: "IMPRESSIONS", optimization_goal: "CONVERSATIONS", destination_type: "MESSAGING_INSTAGRAM_DIRECT_MESSENGER", bid_strategy: "LOWEST_COST_WITHOUT_CAP", promoted_object: { page_id: PAGE }, targeting: { ...a.targeting, age_min: 30 } })).id; guardar();
  x.imagen ??= await subirImagen(path.join(FLY, `ta-${area}-${pieza}-feed.png`)); guardar();
  x.creativo ??= (await api(`${ACT}/adcreatives`, { name: `E · ${NOMBRE[area]} · ${pieza}`, object_story_spec: { page_id: PAGE, instagram_user_id: IG, link_data: { link: "https://fb.com/messenger_doc/", message: c.message, name: c.title, description: c.description, image_hash: x.imagen, call_to_action: CTA } }, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
  x.ad = (await api(`${ACT}/ads`, { name: `E · ${pieza}`, adset_id: x.conjunto, creative: { creative_id: x.creativo }, status: "ACTIVE" })).id; guardar();
  console.log("listo", k, x.conjunto);
}
console.log(`Conjuntos E: ${LOTE.length} · $${PRESUPUESTO / 100}/día c/u · ${OUT}`);
