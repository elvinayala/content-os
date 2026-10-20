// Sprint del 19/oct/2026 (Elvin): "reclutar handyman y contratistas juntos, y los plomeros que faltan… $45 al día por 4 días;
// a los plomeros solo $10-12, lo demás a contratistas y handyman" + "$100 diarios por 3 días" en las zonas de las firmas nuevas.
// Y luego: "no lances campañas, solamente deja todo en borrador". Por eso TODO nace EN PAUSA y sin fecha de fin.
//
//   R · Reclutamiento (categoría EMPLEO, Messenger + IG DM, el agente califica y agenda con Yaileen) — $45/día:
//       Plomeros que faltan $11 (Metro Oeste $4 · Sur $4 · Este $3) · Handyman $17 · Contratistas $17
//   C · Clientes en las zonas de las firmas nuevas — $100/día: San Juan (Metro Norte) $60 · Mayagüez/Cabo Rojo (Oeste) $40.
//       Flyers con PRECIO FINAL (destape $168…), como lo cotiza el agente desde el 19/oct. El Oeste nace con su conjunto
//       apagado: se prende cuando firme un plomero licenciado de allá (Porrata o Peña).
//
// Uso (raíz del repo, con META_ADS_TOKEN):
//   node --env-file=.env.local vault/proyectos/plomeria-pr/kit/anuncios/lanzar-octubre-handyman-contratistas.mjs
//   … --prender reclutamiento   → SOLO con el OK de Elvin: fecha de fin a 4 días y la campaña ACTIVA
//   … --prender clientes        → SOLO con el OK de Elvin: fecha de fin a 3 días y la campaña ACTIVA
// Idempotente: data/meta-ads/campanas/resuelto-octubre-handyman-contratistas.json.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(AQUI, "..");
const RAIZ = path.join(AQUI, "../../../../..");
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768", PAGE = "1278171838721301", IG = "17841432209401518";
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-octubre-handyman-contratistas.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { marca: "resuelto", creada: new Date().toISOString().slice(0, 10), campanas: {}, conjuntos: {} };
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

async function api(p, body, metodo = "POST") {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: metodo, headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.has("access_token") || body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
    const j = await r.json();
    if (j.error?.code === 17 && i < 3) { await new Promise((z) => setTimeout(z, 65_000)); continue; }
    if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
  }
}
const leer = async (p) => { const j = await (await fetch(`https://graph.facebook.com/v25.0/${p}${p.includes("?") ? "&" : "?"}access_token=${T}`)).json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j; };
const subirImagen = async (f) => { const d = new FormData(); d.append("bytes", fs.readFileSync(f).toString("base64")); return Object.values((await api(`${ACT}/adimages`, d)).images)[0].hash; };
const subirVideo = async (archivo, n) => { const f = new FormData(); f.append("name", n); f.append("source", new Blob([fs.readFileSync(archivo)], { type: "video/mp4" }), "v.mp4"); return (await api(`${ACT}/advideos`, f)).id; };
const esperarVideo = async (id) => { for (let i = 0; i < 45; i++) { if ((await leer(`${id}?fields=status`)).status?.video_status === "ready") return; await new Promise((z) => setTimeout(z, 8000)); } throw new Error("El video no terminó de procesarse: " + id); };
const miniatura = (video) => { const jpg = path.join(path.dirname(video), path.basename(video, ".mp4") + ".mini.jpg"); if (!fs.existsSync(jpg)) execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "1.8", "-i", video, "-frames:v", "1", "-q:v", "3", jpg]); return jpg; };

const CTA = { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } };
const DESTINOS = { call_to_actions: [{ type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER", link: "https://fb.com/messenger_doc/" } }, { type: "INSTAGRAM_MESSAGE", value: { app_destination: "INSTAGRAM_DIRECT", link: "https://www.instagram.com/" } }], optimization_type: "DOF_MESSAGING_DESTINATION", additional_data: { is_click_to_message: true } };
const SIN_ADV = { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } };

// Pueblos → llaves de región de Meta (los 78 municipios de PR).
const REGIONES = Object.fromEntries((await leer(`search?type=adgeolocation&location_types=["region"]&country_code=PR&limit=200&q=`)).data.map((r) => [r.name.replace(/ \(Puerto Rico\)$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(), r.key]));
const geo = (pueblos) => ({ regions: pueblos.map((p) => { const k = REGIONES[p.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()]; if (!k) throw new Error("Pueblo sin región en Meta: " + p); return { key: k }; }), location_types: ["home", "recent"] });

const RECLUTA = (texto) => `${texto}\n\nEscríbenos un mensaje: te hacemos unas preguntas y cuadramos una entrevista por videollamada.`;
const PLOMERO = (zona) => RECLUTA(`¿Eres plomero con licencia (oficial o maestro) en ${zona}? En Resuelto nosotros ponemos los clientes y pagamos la publicidad; tú haces la plomería, decides qué trabajos coges y cobras todo completo los viernes. Quedan pocos cupos en tu zona.`);
const FR = (f) => path.join(KIT, "flyers-regiones", f), FO = (f) => path.join(KIT, "flyers-oficios", f), FK = (f) => path.join(KIT, "flyers-contratistas", f), FC = (f) => path.join(KIT, "flyers-clientes-regiones", f);

const CAMPANAS = {
  reclutamiento: { nombre: "Resuelto · Reclutamiento oct · Plomeros que faltan + Handyman + Contratistas · Empleo", empleo: true, dias: 4 },
  clientes: { nombre: "Resuelto · Clientes · Zonas nuevas (San Juan + Oeste) · Precio final", empleo: false, dias: 3 },
};
const CONJUNTOS = {
  "plo-metro-oeste": { campana: "reclutamiento", nombre: "Plomeros · Metro Oeste (Bayamón)", diario: 400, pueblos: ["Bayamón", "Toa Baja", "Toa Alta", "Cataño", "Dorado"],
    titulo: "Buscamos plomero en Bayamón", mensaje: PLOMERO("Bayamón, Toa Baja, Toa Alta, Cataño o Dorado"), anuncios: { flyer: FR("plomero-bayamon-feed.png"), historia: FR("plomero-bayamon-story.png") } },
  "plo-sur": { campana: "reclutamiento", nombre: "Plomeros · Sur (Ponce y Guayama)", diario: 400, pueblos: ["Ponce", "Juana Díaz", "Peñuelas", "Guayanilla", "Yauco", "Santa Isabel", "Coamo", "Salinas", "Guayama"],
    titulo: "Buscamos plomero en Ponce", mensaje: PLOMERO("Ponce, Juana Díaz, Yauco, Santa Isabel o Guayama"), anuncios: { flyer: FR("plomero-ponce-feed.png"), historia: FR("plomero-ponce-story.png") } },
  "plo-este": { campana: "reclutamiento", nombre: "Plomeros · Este (Fajardo y Humacao)", diario: 300, pueblos: ["Fajardo", "Luquillo", "Río Grande", "Ceiba", "Naguabo", "Humacao", "Las Piedras"],
    titulo: "Buscamos plomero en Fajardo", mensaje: PLOMERO("Fajardo, Río Grande, Humacao o Las Piedras"), anuncios: { flyer: FR("plomero-fajardo-feed.png"), historia: FR("plomero-fajardo-story.png") } },
  handyman: { campana: "reclutamiento", nombre: "Handyman · zonas con clientes", diario: 1700,
    pueblos: ["San Juan", "Guaynabo", "Carolina", "Trujillo Alto", "Bayamón", "Toa Baja", "Cataño", "Caguas", "Gurabo", "Juncos", "Cidra", "Cayey", "San Lorenzo", "Aguas Buenas", "Arecibo", "Hatillo", "Camuy", "Quebradillas", "Aguadilla", "Aguada", "Moca", "Isabela", "San Sebastián"],
    titulo: "Buscamos handyman", mensaje: RECLUTA("¿Eres handyman en Puerto Rico? Montar TV, armar muebles, cerraduras, puertas, cortinas, parchos de pared… En Resuelto nosotros ponemos los clientes y pagamos la publicidad; tú decides qué trabajos coges y cobras los viernes. Necesitas el registro de contratista de DACO (si no lo tienes, te explicamos cómo sacarlo). Buscamos 2 por área."),
    anuncios: { flyer: FO("oficio-handyman-feed.png"), historia: FO("oficio-handyman-story.png"), video: path.join(KIT, "videos/oficios/resuelto-oficio-handyman.mp4") } },
  contratistas: { campana: "reclutamiento", nombre: "Contratistas de remodelación · Puerto Rico (Verified)", diario: 1700, pueblos: null,
    titulo: "Nosotros vendemos el proyecto. Tú lo ejecutas.", mensaje: RECLUTA("¿Eres contratista de remodelación con registro en DACO? Baños, cocinas, pisos, puertas y ventanas, terrazas, piscinas… En Resuelto nosotros conseguimos el cliente, visitamos, cotizamos, cerramos y cobramos. A ti te llega el proyecto ya vendido, con alcance y precio cerrados, y te pagamos por etapas. Sin cuotas y sin comprar leads."),
    anuncios: { flyer: FK("k1-vendemos-el-proyecto.png"), "flyer-2": FK("k3-verified.png"), historia: FK("k4-story.png") } },
    // (sin el video de 15 s de contratistas: dice "Aplicar por WhatsApp" y menciona garantía)
  "cli-san-juan": { campana: "clientes", nombre: "Clientes · San Juan (Metro Norte) · Precio final", diario: 6000, pueblos: ["San Juan", "Guaynabo", "Carolina", "Trujillo Alto", "Canóvanas", "Loíza"],
    titulo: "Plomero con precio fijo en San Juan", mensaje: "¿Fregadero tapado, inodoro que no para o calentador dañado en San Juan, Guaynabo o Carolina? Te decimos el precio ANTES de llegar: destape $168, reparación de inodoro $118, calentador $298. Precio final, materiales aparte. Plomero de tu zona y pagas al terminar.\n\nEscríbenos por mensaje y te coordinamos la visita.",
    anuncios: { flyer: FC("cliente-metro-final-feed.png"), historia: FC("cliente-metro-final-story.png") } },
  "cli-oeste": { campana: "clientes", nombre: "Clientes · Mayagüez y Cabo Rojo (Oeste) · Precio final", diario: 4000, apagado: true, pueblos: ["Mayagüez", "Cabo Rojo", "San Germán", "Hormigueros", "Añasco", "Lajas"],
    titulo: "Plomero con precio fijo en Mayagüez", mensaje: "¿Fregadero tapado, inodoro que no para o calentador dañado en Mayagüez, Cabo Rojo o San Germán? Te decimos el precio ANTES de llegar: destape $168, reparación de inodoro $118, calentador $298. Precio final, materiales aparte. Plomero de tu zona y pagas al terminar.\n\nEscríbenos por mensaje y te coordinamos la visita.",
    anuncios: { flyer: FC("cliente-mayaguez-final-feed.png"), historia: FC("cliente-mayaguez-final-story.png") } },
};

// ── --prender <campaña>: solo con el OK de Elvin ──
const iP = process.argv.indexOf("--prender");
if (iP > -1) {
  const k = process.argv[iP + 1]; const c = CAMPANAS[k]; if (!c || !plan.campanas[k]) throw new Error("--prender reclutamiento|clientes (y la campaña tiene que existir)");
  const fin = new Date(Date.now() + c.dias * 86400_000).toISOString();
  for (const [id, cj] of Object.entries(CONJUNTOS)) if (cj.campana === k && plan.conjuntos[id]?.adset) await api(plan.conjuntos[id].adset, { end_time: fin });
  await api(plan.campanas[k], { status: "ACTIVE" });
  plan.prendidas = { ...(plan.prendidas ?? {}), [k]: { en: new Date().toISOString(), fin } }; guardar();
  console.log(`✔ ${c.nombre} ACTIVA hasta ${fin}`); process.exit(0);
}

for (const [k, c] of Object.entries(CAMPANAS)) {
  plan.campanas[k] ??= (await api(`${ACT}/campaigns`, { name: c.nombre, objective: "OUTCOME_SALES", special_ad_categories: c.empleo ? ["EMPLOYMENT"] : [], ...(c.empleo ? { special_ad_category_country: ["PR"] } : {}), status: "PAUSED", is_adset_budget_sharing_enabled: false })).id; guardar();
}
for (const [id, cj] of Object.entries(CONJUNTOS)) {
  const x = (plan.conjuntos[id] ??= { anuncios: {} }); const empleo = CAMPANAS[cj.campana].empleo;
  const targeting = empleo
    ? { age_min: 18, age_max: 65, geo_locations: cj.pueblos ? geo(cj.pueblos) : { countries: ["PR"], location_types: ["home", "recent"] } }
    : { age_min: 28, age_max: 65, geo_locations: geo(cj.pueblos), targeting_automation: { advantage_audience: 0 } };
  x.adset ??= (await api(`${ACT}/adsets`, { name: `${cj.nombre} · Messenger+IG`, campaign_id: plan.campanas[cj.campana], status: cj.apagado ? "PAUSED" : "ACTIVE", daily_budget: cj.diario, billing_event: "IMPRESSIONS", optimization_goal: "CONVERSATIONS", destination_type: "MESSAGING_INSTAGRAM_DIRECT_MESSENGER", bid_strategy: "LOWEST_COST_WITHOUT_CAP", promoted_object: { page_id: PAGE }, targeting })).id; guardar();
  for (const [tipo, archivo] of Object.entries(cj.anuncios)) {
    const a = (x.anuncios[tipo] ??= {}); if (a.ad) continue;
    if (!fs.existsSync(archivo)) throw new Error("Falta el arte: " + archivo);
    let oss;
    if (tipo === "video") {
      a.video ??= await subirVideo(archivo, `${cj.nombre} · video`); guardar();
      a.miniatura ??= await subirImagen(miniatura(archivo)); guardar();
      await esperarVideo(a.video);
      oss = { page_id: PAGE, instagram_user_id: IG, video_data: { video_id: a.video, image_hash: a.miniatura, message: cj.mensaje, title: cj.titulo, link_description: "Resuelto", call_to_action: CTA } };
    } else {
      a.imagen ??= await subirImagen(archivo); guardar();
      oss = { page_id: PAGE, instagram_user_id: IG, link_data: { link: "https://fb.com/messenger_doc/", message: cj.mensaje, name: cj.titulo, description: "Resuelto", image_hash: a.imagen, call_to_action: CTA } };
    }
    if (/garant[ií]a|gratis/i.test(JSON.stringify(oss))) throw new Error(`${id}/${tipo}: el texto dice garantía o gratis`);
    a.creativo ??= (await api(`${ACT}/adcreatives`, { name: `${cj.nombre} · ${tipo}`, object_story_spec: oss, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
    a.ad = (await api(`${ACT}/ads`, { name: `${cj.nombre} · ${tipo}`, adset_id: x.adset, creative: { creative_id: a.creativo }, status: "ACTIVE" })).id; guardar();
    console.log("anuncio", id, tipo);
  }
}
plan.estado = "BORRADOR: las 2 campañas EN PAUSA y sin fecha de fin (Elvin, 19/oct: 'no lances campañas, deja todo en borrador'). Se prenden con --prender reclutamiento|clientes cuando Elvin dé el OK.";
guardar(); console.log(`listo · ${OUT}`);
