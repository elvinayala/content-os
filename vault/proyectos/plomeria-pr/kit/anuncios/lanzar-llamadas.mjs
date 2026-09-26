// Campaña de LLAMADAS de clientes (26/sep/2026, Elvin: "las personas mayores llaman mucho"). Una sola campaña para
// todas las áreas, UN conjunto por área ($10/día, 40–65 años, sus pueblos) con 4 flyers que dicen "Llama al
// 787-956-1111": ciudad · menú · destape · cisterna (LLAMADA=1 en generar.mjs / familia.mjs).
// Botón CALL_NOW → tel:+17879561111 (Zernio: en horario desvía al celular de quien cierra; si nadie contesta,
// contestadora + texto automático + aviso por Telegram — agente/src/canales/llamadas.ts).
// La CAMPAÑA queda EN PAUSA: se prende cuando haya alguien contestando. Idempotente (JSON con los ids).
// Uso (desde la raíz del repo): node vault/proyectos/plomeria-pr/kit/anuncios/lanzar-llamadas.mjs caguas "Caguas" "Caguas:4262,…"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FLY = path.join(AQUI, "../flyers-clientes-regiones");
const RAIZ = path.join(AQUI, "../../../../..");
const [slug, nombre, pueblosArg] = process.argv.slice(2);
if (!slug || !nombre || !pueblosArg) throw new Error('Uso: lanzar-llamadas.mjs <slug> "<Nombre>" "Pueblo:key,Pueblo:key"');
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768", PAGE = "1278171838721301";
const TEL = "tel:+17879561111";
const PUEBLOS = pueblosArg.split(",").map((x) => { const [name, key] = x.split(":").map((s) => s.trim()); return { key, name, country: "PR" }; });
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-clientes-llamadas.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { marca: "resuelto", creada: new Date().toISOString().slice(0, 10), telefono: "787-956-1111", campana: null, areas: {} };
const area = (plan.areas[slug] ??= { nombre, pueblos: PUEBLOS.map((p) => p.name), conjunto: null, anuncios: {} });
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

async function api(p, body) {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.has("access_token") || body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
    const j = await r.json();
    if (j.error?.code === 17 && i < 3) { await new Promise((z) => setTimeout(z, 65_000)); continue; } // límite de la API
    if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
  }
}
const subirImagen = async (f) => { const d = new FormData(); d.append("bytes", fs.readFileSync(f).toString("base64")); return Object.values((await api(`${ACT}/adimages`, d)).images)[0].hash; };

const PIEZAS = [
  ["ciudad", `cliente-${slug}-llamada-feed.png`, `¿Problema de plomería en ${nombre}? Llámanos y te decimos el precio antes de llegar: destape $149, inodoro $99, calentador $279. Plomero licenciado de tu zona y 12 meses de garantía.`, `Plomero con precio fijo en ${nombre}`],
  ["menu", `cliente-${slug}-menu-llamada-feed.png`, `Esto es lo que cobramos en ${nombre}, antes de ir a tu casa. Sin sorpresas: si aparece algo más, tú lo apruebas primero. Llámanos y te damos la hora de la visita.`, "Precios publicados · 12 meses de garantía"],
  ["destape", `cliente-${slug}-destape-llamada-feed.png`, `¿Fregadero, lavamanos o inodoro tapado en ${nombre}? Destape simple $149 de mano de obra + $19 de coordinación. Llámanos y te damos la hora.`, "Destape simple $149"],
  ["cisterna", `cliente-${slug}-cisterna-llamada-feed.png`, `¿Cansado de quedarte sin agua cuando la AAA corta? Cisterna con bomba instalada en ${nombre}, desde $899 de mano de obra. Precio por escrito antes de empezar. Llámanos.`, "Cisterna con bomba desde $899"],
];
const faltan = PIEZAS.map(([, f]) => path.join(FLY, f)).filter((f) => !fs.existsSync(f));
if (faltan.length) throw new Error("Faltan flyers (LLAMADA=1 node generar.mjs … y familia.mjs con PIEZAS=menu,destape,cisterna):\n" + faltan.join("\n"));

plan.campana ??= (await api(`${ACT}/campaigns`, { name: "Resuelto · Clientes · Llamadas (787-956-1111)", objective: "OUTCOME_LEADS", special_ad_categories: [], status: "PAUSED", is_adset_budget_sharing_enabled: false })).id; guardar();
area.conjunto ??= (await api(`${ACT}/adsets`, { name: `${nombre} · Llamadas · 40-65`, campaign_id: plan.campana, status: "ACTIVE", daily_budget: 1000, billing_event: "IMPRESSIONS", optimization_goal: "QUALITY_CALL", destination_type: "PHONE_CALL", bid_strategy: "LOWEST_COST_WITHOUT_CAP", promoted_object: { page_id: PAGE }, targeting: { age_min: 40, age_max: 65, geo_locations: { regions: PUEBLOS, location_types: ["home", "recent"] }, targeting_automation: { advantage_audience: 0 } } })).id; guardar();
for (const [k, f, message, titulo] of PIEZAS) {
  const a = (area.anuncios[k] ??= {}); if (a.ad) continue;
  a.imagen ??= await subirImagen(path.join(FLY, f)); guardar();
  a.creativo ??= (await api(`${ACT}/adcreatives`, { name: `Llamadas · ${nombre} · ${k}`, object_story_spec: { page_id: PAGE, link_data: { link: `https://www.facebook.com/${PAGE}`, message, name: titulo, description: "Llama al 787-956-1111", image_hash: a.imagen, call_to_action: { type: "CALL_NOW", value: { link: TEL } } } }, degrees_of_freedom_spec: { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } } })).id; guardar();
  a.ad = (await api(`${ACT}/ads`, { name: `${nombre} · Llamada · ${k}`, adset_id: area.conjunto, creative: { creative_id: a.creativo }, status: "ACTIVE" })).id; guardar();
  console.log("anuncio", slug, k);
}
plan.estado = "Campaña EN PAUSA: se prende cuando haya alguien contestando el 787-956-1111. $10/día por área.";
guardar(); console.log(`listo: campaña ${plan.campana} · ${slug} · ${OUT}`);
