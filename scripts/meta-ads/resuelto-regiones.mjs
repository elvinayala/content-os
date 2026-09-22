// Resuelto · reclutamiento de plomeros POR REGIÓN (22/sep/2026, instrucción de Elvin):
// todo a WhatsApp, objetivo Ventas, maximizar conversaciones, solo botón de WhatsApp,
// $75/día en total por 7 días, un conjunto por región con su flyer (kit/flyers-regiones/).
// Lo que no sirve se PAUSA (nunca se borra): la campaña de Leads a la web y los anuncios con cifras.
//
//   node scripts/meta-ads/resuelto-regiones.mjs inspeccionar
//   node scripts/meta-ads/resuelto-regiones.mjs montar [--aplicar]     (sin --aplicar = dry-run)
//
// Todo lo nuevo nace EN PAUSA. Activar lo hace Elvin (o se activa por pedido explícito).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./core.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
function token() {
  if (process.env.META_ADS_TOKEN) return process.env.META_ADS_TOKEN;
  const f = resolve(ROOT, ".env.local");
  if (!existsSync(f)) return "";
  const l = readFileSync(f, "utf8").split("\n").find((x) => x.startsWith("META_ADS_TOKEN="));
  return l ? l.slice("META_ADS_TOKEN=".length).trim().replace(/^["']|["']$/g, "") : "";
}
const c = M.crearCliente(token());
const CUENTA = "act_1564735818086768";
const CAMP_WA = "120255016399820029";   // Resuelto · Plomeros · WhatsApp · Sprint 1
const CAMP_LEADS = "120255016255510029"; // Resuelto · Plomeros · Leads · Sprint 1
const [cmd, ...resto] = process.argv.slice(2);

async function inspeccionar() {
  for (const id of [CAMP_WA, CAMP_LEADS]) {
    const camp = await c.graph("GET", "/" + id, { fields: "name,status,effective_status,objective,daily_budget,lifetime_budget,bid_strategy,special_ad_categories,is_adset_budget_sharing_enabled" });
    console.log("\n=== CAMPAÑA", id, JSON.stringify(camp));
    const adsets = await c.todos("/" + id + "/adsets", { fields: "id,name,status,effective_status,daily_budget,optimization_goal,billing_event,bid_strategy,destination_type,promoted_object,targeting,end_time,start_time" });
    for (const a of adsets) console.log("  ADSET", JSON.stringify(a));
    const ads = await c.todos("/" + id + "/ads", { fields: "id,name,status,effective_status,adset_id,creative{id,name,object_story_spec,asset_feed_spec,call_to_action_type,url_tags}" });
    for (const a of ads) console.log("  AD", JSON.stringify(a).slice(0, 1600));
  }
}

const PAGE = "1278171838721301";
const ADSET_MOLDE = "120255018289310029"; // W2: WhatsApp + CONVERSATIONS, vinculado a mano en Ads Manager
const IG = "17841432209401518";
const PLAN = resolve(ROOT, "data/meta-ads/campanas/resuelto-regiones-2026-09.json");
const FLYERS = resolve(ROOT, "vault/proyectos/plomeria-pr/kit/flyers-regiones");
const TERR = JSON.parse(readFileSync(resolve(ROOT, "vault/proyectos/plomeria-pr/agente/data/territorios.json"), "utf8")).territorios;
const mun = (...ids) => ids.flatMap((id) => TERR.find((t) => t.id === id).municipios);
// $75/día en total: Metro (San Juan + Bayamón, la mitad de los plomeros de la isla) $15; el resto $10 (mínimo por conjunto).
const REGIONES = [
  { slug: "metro", nombre: "el Área Metro", corto: "Área Metro", municipios: mun("T1", "T2"), dia: 15 },
  { slug: "caguas", nombre: "Caguas", corto: "Caguas", municipios: mun("T3"), dia: 10 },
  { slug: "ponce", nombre: "Ponce", corto: "Ponce", municipios: mun("T4"), dia: 10 },
  { slug: "arecibo", nombre: "Arecibo", corto: "Arecibo", municipios: mun("T5"), dia: 10 },
  { slug: "mayaguez", nombre: "Mayagüez", corto: "Mayagüez", municipios: mun("T6"), dia: 10 },
  { slug: "aguadilla", nombre: "Aguadilla", corto: "Aguadilla", municipios: mun("T7"), dia: 10 },
  { slug: "fajardo", nombre: "Fajardo", corto: "Fajardo", municipios: mun("T8"), dia: 10 },
];
const FIN = "2026-09-29T23:59:00-0400"; // 7 días
const INTERESES = [{ interests: [{ id: "6003178845152" }, { id: "6003348229032" }, { id: "6003395414271" }, { id: "6003469754863" }], work_positions: [{ id: "369884826469649" }] }];

const copy = (r) => ({
  message: `Buscamos plomero en ${r.nombre}. Tú haces la plomería; nosotros ponemos los clientes y pagamos la publicidad.\n\nSolo 2 cupos en la región y vamos por orden de llegada. Requisito: licencia vigente (oficial o maestro).\n\nEscríbenos por WhatsApp: te hacemos 4 preguntas y coordinamos la entrevista.`,
  name: `Buscamos plomero en ${r.corto}`,
  description: "Solo 2 cupos en la región · Licencia vigente",
});
// Saludo del chat: el mismo formato del anuncio que ya funcionaba (W1), con el texto que
// le dice al agente quién escribe y de dónde.
const saludo = (r) => JSON.stringify({ type: "VISUAL_EDITOR", version: 2, landing_screen_type: "welcome_message", media_type: "text",
  text_format: { customer_action_type: "autofill_message", message: { autofill_message: { content: `Hola, soy plomero de ${r.corto} y quiero aplicar.` }, text: "¡Hola! Cuéntanos de ti y coordinamos la entrevista." } },
  user_edit: false, surface: "visual_editor_new" });

// "Manatí (Puerto Rico)" = "Manatí": Meta desambigua algunos municipios con el país.
const sinTilde = (x) => x.replace(/ \(Puerto Rico\)$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
async function claveMunicipio(nombre) {
  const r = await c.graph("GET", "/search", { type: "adgeolocation", location_types: ["region"], q: nombre, country_code: "PR", limit: 10 });
  const hit = (r.data || []).find((x) => x.type === "region" && sinTilde(x.name) === sinTilde(nombre));
  if (!hit) throw new Error("Meta no reconoce el municipio: " + nombre + " → " + (r.data || []).map((x) => x.name + "/" + x.type).join(", "));
  return hit.key;
}

async function montar(aplicar) {
  const plan = existsSync(PLAN) ? JSON.parse(readFileSync(PLAN, "utf8")) : { campana: CAMP_WA, conjuntos: {} };
  const guardar = () => aplicar && writeFileSync(PLAN, JSON.stringify(plan, null, 2) + "\n");
  let suma = 0;
  for (const r of REGIONES) {
    suma += r.dia;
    const n = (plan.conjuntos[r.slug] ||= {});
    const claves = [];
    for (const m of r.municipios) claves.push({ key: String(await claveMunicipio(m)) });
    const targeting = { geo_locations: { regions: claves, location_types: ["home", "recent"] }, age_min: 25, age_max: 65, genders: [1], flexible_spec: INTERESES, targeting_automation: { advantage_audience: 1 } };
    console.log(`${r.slug.padEnd(10)} $${r.dia}/día · ${r.municipios.length} municipios (${r.municipios.join(", ")}) · flyer plomero-${r.slug}-feed.png`);
    if (!aplicar) continue;
    // 22/sep: los 7 quedaron terminados a mano en Ads Manager (listo:true) → no se tocan más.
    if (n.listo) { console.log(`   ✔ ya listo (${n.adsetId})`); continue; }
    if (!n.imageHash) {
      const bytes = readFileSync(resolve(FLYERS, `plomero-${r.slug}-feed.png`)).toString("base64");
      const j = await c.graph("POST", `/${CUENTA}/adimages`, { bytes });
      n.imageHash = Object.values(j.images)[0].hash; guardar();
    }
    if (!n.adsetId) {
      // Crear un conjunto a WhatsApp por API falla ("tu página no está vinculada a una cuenta de
      // WhatsApp", subcode 2446886): el número se vinculó a mano en Ads Manager y esa vinculación
      // vive en los conjuntos que se crearon ahí. Por eso se COPIA W2 (ya optimiza conversaciones)
      // sin sus anuncios, en pausa, y después se le cambia región, presupuesto y nombre.
      // (Ya no se usa: /copies falla por la atribución de 7 días de W2. Las copias se hacen en
      // Ads Manager y sus ids se ponen en el plan antes de correr esto.)
      throw new Error("Falta adsetId para " + r.slug + ": duplica W2 en Ads Manager y pon el id en el plan");
      const j = await c.graph("POST", `/${ADSET_MOLDE}/copies`, { deep_copy: false, status_option: "PAUSED" });
      n.adsetId = j.copied_adset_id; guardar();
    }
    // Meta: máx. 1 cambio cada 30 s por conjunto (#613) → se espera entre llamadas al mismo conjunto.
    const esperar = () => new Promise((x) => setTimeout(x, 32000));
    const paso = async (clave, body) => {
      if (n[clave]) return;
      for (let i = 0; i < 3; i++) {
        try { await c.graph("POST", `/${n.adsetId}`, body); n[clave] = true; guardar(); await esperar(); return; }
        catch (e) { if (e.subcode === 4841018 || /rate limit/i.test(e.message)) { await esperar(); continue; } throw e; }
      }
    };
    await paso("nombreListo", { name: `R · ${r.corto} · WhatsApp · Conversaciones` });
    await paso("presupuestoListo", { daily_budget: r.dia * 100, end_time: FIN });
    await paso("segmentacionListo", { targeting });
    // Las copias heredaron LINK_CLICKS del borrador viejo de W2. Pasar a CONVERSATIONS exige
    // cambiar también la atribución (7 días de clic ya no se admite con ese objetivo).
    if (!n.optimizacion) {
      try { await c.graph("POST", `/${n.adsetId}`, { optimization_goal: "CONVERSATIONS", attribution_spec: [{ event_type: "CLICK_THROUGH", window_days: 1 }] }); n.optimizacion = "CONVERSATIONS"; }
      catch (e) { n.optimizacion = "LINK_CLICKS (Meta: " + e.message.slice(0, 140) + ")"; }
      guardar(); await esperar();
    }
    // Los ANUNCIOS no se pueden tocar por API con el token de Bori (la página Resuelto PR no está
    // en sus permisos → subcode 2446880): el flyer, textos y saludo se cambian en Ads Manager
    // sobre el anuncio copiado (imagen ya subida a la biblioteca con este hash).
    console.log(`   ✔ conjunto ${n.adsetId} listo (apagado) · objetivo ${n.optimizacion} · imagen ${n.imageHash} · anuncio a editar en Ads Manager: ${n.adCopiadoId}`);
  }
  console.log(`Total: $${suma}/día · fin ${FIN}`);
  // Lo que no sirve: se pausa, no se borra (queda el historial).
  // W1/W2 ya se pausaron el 22/sep (copy con cifras); el flag queda por si se reactivan por error.
  const pausar = resto.includes("--pausar-viejos") ? [["adset W1 · video · optimiza clics", "120255016399830029"], ["adset W2 · flyer $1,950", "120255018289310029"]] : [];
  for (const [que, id] of pausar) {
    console.log(`${aplicar ? "pausando" : "pausaría"}: ${que} (${id})`);
    if (aplicar) await c.graph("POST", "/" + id, { status: "PAUSED" });
  }
  if (aplicar) { await c.graph("POST", "/" + CAMP_WA, { name: "Resuelto · Plomeros · WhatsApp · Por región" }); plan.pausados = pausar.map(([, id]) => id); plan.montado = new Date().toISOString(); guardar(); }
}

if (cmd === "inspeccionar") await inspeccionar();
else if (cmd === "montar") await montar(resto.includes("--aplicar"));
else { console.error("uso: inspeccionar | montar [--aplicar]"); process.exit(1); }
