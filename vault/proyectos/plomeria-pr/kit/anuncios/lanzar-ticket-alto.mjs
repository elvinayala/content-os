// Conjunto "D · Ticket alto" dentro de la campaña de clientes de un área que YA existe (1/oct/2026, Elvin: "empujar
// subir el ticket… crea los creativos de los tickets más altos, calentadores, destape, trabajos de 500-800, más lo que
// ya está funcionando, el precio fijo"). Messenger + IG DM, conversaciones, mismos pueblos que el conjunto A.
// Flyers: solar · grandes · agua-alta · cisterna · calentador (familia.mjs con PIEZAS=…, mismos pueblos).
// El conjunto y sus anuncios nacen ACTIVOS: si la campaña está prendida, corren al instante (Elvin lo pidió así).
// Idempotente: guarda los ids en el mismo JSON de la campaña del área, bajo "ticketAlto".
//
// Uso (desde la raíz del repo, con META_ADS_TOKEN en .env.local):
//   PRESUPUESTO_DIA=15 node vault/proyectos/plomeria-pr/kit/anuncios/lanzar-ticket-alto.mjs caguas "Caguas y Cidra" \
//     data/meta-ads/campanas/resuelto-clientes-caguas-2026-09.json 120255115172980029
//   (el último argumento = el conjunto A del área, de donde se copia el público)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(AQUI, "..");
const RAIZ = path.join(AQUI, "../../../../..");
const [slug, nombre, planArg, conjuntoA] = process.argv.slice(2);
if (!slug || !nombre || !planArg || !conjuntoA) throw new Error('Uso: lanzar-ticket-alto.mjs <slug> "<Nombre>" <plan.json> <idConjuntoA>');
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const PRESUPUESTO = Math.round(Number(process.env.PRESUPUESTO_DIA ?? 15) * 100);
const ACT = "act_1564735818086768", PAGE = "1278171838721301", IG = "17841432209401518";
const OUT = path.resolve(RAIZ, planArg);
const plan = JSON.parse(fs.readFileSync(OUT, "utf8"));
const d = (plan.ticketAlto ??= { anuncios: {} });
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

async function api(p, body) {
  const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
  const j = await r.json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
}
const leer = async (p) => { const j = await (await fetch(`https://graph.facebook.com/v25.0/${p}${p.includes("?") ? "&" : "?"}access_token=${T}`)).json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j; };
const subirImagen = async (archivo) => { const f = new FormData(); f.append("bytes", fs.readFileSync(archivo).toString("base64")); return Object.values((await api(`${ACT}/adimages`, f)).images)[0].hash; };

const CTA = { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } };
const DESTINOS = { call_to_actions: [{ type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER", link: "https://fb.com/messenger_doc/" } }, { type: "INSTAGRAM_MESSAGE", value: { app_destination: "INSTAGRAM_DIRECT", link: "https://www.instagram.com/" } }], optimization_type: "DOF_MESSAGING_DESTINATION", additional_data: { is_click_to_message: true } };
const SIN_ADV = { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } };
const COPY = {
  message: `¿Se fue el agua o la luz otra vez en ${nombre}? Cisterna con bomba desde $899, calentador solar desde $699 y calentador de tanque $279. El precio final te lo damos por escrito antes de empezar: si no lo apruebas, no se toca nada. Plomero licenciado de tu zona y 12 meses de garantía.\n\nEscríbenos por mensaje con una foto y te damos tu precio.`,
  title: "Cisterna, calentador y trabajos grandes",
  description: "Precio por escrito antes de empezar",
};
const PIEZAS = ["solar", "grandes", "agua-alta", "cisterna", "calentador"];
const archivo = (p) => path.join(KIT, `flyers-clientes-regiones/cliente-${slug}-${p}-feed.png`);
const faltan = PIEZAS.map(archivo).filter((f) => !fs.existsSync(f));
if (faltan.length) throw new Error("Faltan creativos:\n" + faltan.join("\n"));

const a = await leer(`${conjuntoA}?fields=campaign_id,targeting`);
if (!d.conjunto) {
  d.conjunto = (await api(`${ACT}/adsets`, { name: `D · ${nombre} · Ticket alto · Messenger+IG`, campaign_id: a.campaign_id, status: "ACTIVE", daily_budget: PRESUPUESTO, billing_event: "IMPRESSIONS", optimization_goal: "CONVERSATIONS", destination_type: "MESSAGING_INSTAGRAM_DIRECT_MESSENGER", bid_strategy: "LOWEST_COST_WITHOUT_CAP", promoted_object: { page_id: PAGE }, targeting: { ...a.targeting, age_min: 30 } })).id;
  d.creado = new Date().toISOString(); guardar();
}
for (const p of PIEZAS) {
  const x = (d.anuncios[p] ??= {}); if (x.ad) continue;
  x.imagen ??= await subirImagen(archivo(p)); guardar();
  x.creativo ??= (await api(`${ACT}/adcreatives`, { name: `D · ${nombre} · Flyer ${p}`, object_story_spec: { page_id: PAGE, instagram_user_id: IG, link_data: { link: "https://fb.com/messenger_doc/", message: COPY.message, name: COPY.title, description: COPY.description, image_hash: x.imagen, call_to_action: CTA } }, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
  x.ad = (await api(`${ACT}/ads`, { name: `D · Flyer ${p}`, adset_id: d.conjunto, creative: { creative_id: x.creativo }, status: "ACTIVE" })).id; guardar();
  console.log("anuncio", p);
}
d.estado = `Conjunto D activo · $${PRESUPUESTO / 100}/día · ${PIEZAS.length} flyers`;
guardar(); console.log(`listo: conjunto ${d.conjunto} · ${OUT}`);
