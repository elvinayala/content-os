// Reclutamiento de OTROS OFICIOS (27/sep/2026, Elvin aprobó aire acondicionado, handyman, peritos electricistas y
// cotizador de proyectos a comisión). Una campaña con categoría especial EMPLEO (Meta fija edad 18-65 y todo género),
// Messenger + Instagram DM (el agente califica y agenda la entrevista con Yaileen), un conjunto por puesto a $10/día en
// todo Puerto Rico, 2 anuncios por conjunto (flyer feed + historia de kit/flyers-oficios). Queda EN PAUSA: Elvin la prende.
// Idempotente: guarda los ids en data/meta-ads/campanas/resuelto-oficios-empleo.json.
// Uso (raíz del repo, con META_ADS_TOKEN): node vault/proyectos/plomeria-pr/kit/anuncios/lanzar-oficios.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FLY = path.join(AQUI, "../flyers-oficios");
const RAIZ = path.join(AQUI, "../../../../..");
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768", PAGE = "1278171838721301", IG = "17841432209401518";
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-oficios-empleo.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { marca: "resuelto", creada: new Date().toISOString().slice(0, 10), campana: null, conjuntos: {} };
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

async function api(p, body) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.has("access_token") || body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
    const j = await r.json();
    if (j.error?.code === 17 && i < 3) { await new Promise((z) => setTimeout(z, 65_000)); continue; }
    if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
  }
}
const subirImagen = async (f) => { const d = new FormData(); d.append("bytes", fs.readFileSync(f).toString("base64")); return Object.values((await api(`${ACT}/adimages`, d)).images)[0].hash; };
const CTA = { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } };
const DESTINOS = { call_to_actions: [{ type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER", link: "https://fb.com/messenger_doc/" } }, { type: "INSTAGRAM_MESSAGE", value: { app_destination: "INSTAGRAM_DIRECT", link: "https://www.instagram.com/" } }], optimization_type: "DOF_MESSAGING_DESTINATION", additional_data: { is_click_to_message: true } };
const SIN_ADV = { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } };

const PUESTOS = {
  aire: { nombre: "Técnicos de aire", titulo: "Buscamos técnicos de aire acondicionado", mensaje: "¿Eres técnico de aire acondicionado con licencia en Puerto Rico? En Resuelto nosotros ponemos los clientes y pagamos la publicidad; tú haces el servicio y decides qué trabajos coges. Buscamos 2 técnicos por área.\n\nEscríbenos un mensaje: te hacemos unas preguntas y cuadramos una entrevista por videollamada." },
  handyman: { nombre: "Handyman", titulo: "Buscamos handyman", mensaje: "¿Eres handyman en Puerto Rico? Montar TV, muebles, puertas, cerraduras, drywall… En Resuelto nosotros ponemos los clientes y pagamos la publicidad; tú decides qué trabajos coges. Buscamos 2 por área.\n\nEscríbenos un mensaje y cuadramos una entrevista por videollamada." },
  perito: { nombre: "Peritos electricistas", titulo: "Buscamos peritos electricistas", mensaje: "¿Eres perito electricista con licencia? En Resuelto nosotros ponemos los clientes y pagamos la publicidad; tú haces el trabajo eléctrico y decides qué trabajos coges. Buscamos 2 peritos por área.\n\nEscríbenos un mensaje y cuadramos una entrevista por videollamada." },
  cotizador: { nombre: "Cotizador de proyectos", titulo: "Buscamos cotizador de proyectos", mensaje: "¿Tienes experiencia cotizando o vendiendo proyectos de construcción? Resuelto busca un cotizador de proyectos a comisión: visitas al cliente, mides y cotizas remodelaciones, cocinas, baños y piscinas con nuestra app. Nosotros ponemos los clientes.\n\nEscríbenos un mensaje y cuadramos una entrevista por videollamada." },
};
const faltan = Object.keys(PUESTOS).flatMap((k) => ["feed", "story"].map((f) => path.join(FLY, `oficio-${k}-${f}.png`))).filter((f) => !fs.existsSync(f));
if (faltan.length) throw new Error("Faltan flyers (node kit/flyers-oficios/generar.mjs):\n" + faltan.join("\n"));

plan.campana ??= (await api(`${ACT}/campaigns`, { name: "Resuelto · Oficios · Messenger+IG · Empleo", objective: "OUTCOME_SALES", special_ad_categories: ["EMPLOYMENT"], special_ad_category_country: ["PR"], status: "PAUSED", is_adset_budget_sharing_enabled: false })).id; guardar();
for (const [k, p] of Object.entries(PUESTOS)) {
  const c = (plan.conjuntos[k] ??= { anuncios: {} });
  c.adset ??= (await api(`${ACT}/adsets`, { name: `${p.nombre} · Puerto Rico · Messenger+IG`, campaign_id: plan.campana, status: "ACTIVE", daily_budget: 1000, billing_event: "IMPRESSIONS", optimization_goal: "CONVERSATIONS", destination_type: "MESSAGING_INSTAGRAM_DIRECT_MESSENGER", bid_strategy: "LOWEST_COST_WITHOUT_CAP", promoted_object: { page_id: PAGE }, targeting: { age_min: 18, age_max: 65, geo_locations: { countries: ["PR"] } } })).id; guardar();
  for (const f of ["feed", "story"]) {
    const a = (c.anuncios[f] ??= {}); if (a.ad) continue;
    a.imagen ??= await subirImagen(path.join(FLY, `oficio-${k}-${f}.png`)); guardar();
    a.creativo ??= (await api(`${ACT}/adcreatives`, { name: `Oficios · ${p.nombre} · ${f}`, object_story_spec: { page_id: PAGE, instagram_user_id: IG, link_data: { link: "https://fb.com/messenger_doc/", message: p.mensaje, name: p.titulo, description: "Resuelto · toda la isla", image_hash: a.imagen, call_to_action: CTA } }, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
    a.ad = (await api(`${ACT}/ads`, { name: `${p.nombre} · ${f === "feed" ? "Flyer" : "Historia"}`, adset_id: c.adset, creative: { creative_id: a.creativo }, status: "ACTIVE" })).id; guardar();
    console.log("anuncio", k, f);
  }
}
plan.estado = "Campaña EN PAUSA (Elvin la prende). 4 conjuntos × $10 = $40/día, categoría Empleo, toda la isla.";
guardar(); console.log(`listo: campaña ${plan.campana} · ${OUT}`);
