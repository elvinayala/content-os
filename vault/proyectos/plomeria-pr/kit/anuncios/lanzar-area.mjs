// Campaña de CLIENTES de un área (estándar de LANZAR-AREA.md): Messenger + Instagram DM, conversaciones,
// 3 conjuntos × $10 (A Precio fijo · B Problemas · C Confianza) con 11 anuncios (4 videos + 7 flyers del área).
// La CAMPAÑA queda EN PAUSA: Elvin la prende (conjuntos y anuncios quedan activos debajo, listos).
// Idempotente: guarda los ids en data/meta-ads/campanas/resuelto-clientes-<slug>.json y retoma donde quedó.
//
// Antes: los creativos del área (generar.mjs + familia.mjs + armar-regionales.sh con el mismo nombre/slug).
// Uso (desde la raíz del repo, con META_ADS_TOKEN en .env.local):
//   node vault/proyectos/plomeria-pr/kit/anuncios/lanzar-area.mjs quebradillas "Quebradillas" "Quebradillas:4242,Camuy:4214,Hatillo:4225,Arecibo:4261"
// Los códigos de pueblo salen de /search?type=adgeolocation&country_code=PR (verificar que sean de PR).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(AQUI, "..");
const RAIZ = path.join(AQUI, "../../../../..");
const [slug, nombre, pueblosArg] = process.argv.slice(2);
if (!slug || !nombre || !pueblosArg) throw new Error('Uso: lanzar-area.mjs <slug> "<Nombre>" "Pueblo:key,Pueblo:key"');
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768", PAGE = "1278171838721301", IG = "17841432209401518";
const PUEBLOS = pueblosArg.split(",").map((x) => { const [name, key] = x.split(":").map((s) => s.trim()); return { key, name, country: "PR" }; });
const OUT = path.join(RAIZ, `data/meta-ads/campanas/resuelto-clientes-${slug}.json`);
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { marca: "resuelto", creada: new Date().toISOString().slice(0, 10), area: nombre, pueblos: PUEBLOS.map((p) => p.name), ids: {}, anuncios: {} };
const guardar = () => fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

async function api(p, body) {
  const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
  const j = await r.json(); if (j.error) throw new Error(p + ": " + JSON.stringify(j.error)); return j;
}
const subirImagen = async (archivo) => { const f = new FormData(); f.append("bytes", fs.readFileSync(archivo).toString("base64")); return Object.values((await api(`${ACT}/adimages`, f)).images)[0].hash; };
const subirVideo = async (archivo, n) => { const f = new FormData(); f.append("name", n); f.append("source", new Blob([fs.readFileSync(archivo)], { type: "video/mp4" }), "v.mp4"); return (await api(`${ACT}/advideos`, f)).id; };
const esperarVideo = async (id) => { for (let i = 0; i < 45; i++) { const r = await (await fetch(`https://graph.facebook.com/v25.0/${id}?fields=status&access_token=${T}`)).json(); if (r.status?.video_status === "ready") return; await new Promise((z) => setTimeout(z, 8000)); } throw new Error("El video no terminó de procesarse: " + id); };
const miniatura = (video) => { const jpg = video.replace(/\.mp4$/, ".mini.jpg"); execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "1.8", "-i", video, "-frames:v", "1", "-q:v", "3", jpg]); return jpg; };

const CTA = { type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER" } };
const DESTINOS = { call_to_actions: [{ type: "MESSAGE_PAGE", value: { app_destination: "MESSENGER", link: "https://fb.com/messenger_doc/" } }, { type: "INSTAGRAM_MESSAGE", value: { app_destination: "INSTAGRAM_DIRECT", link: "https://www.instagram.com/" } }], optimization_type: "DOF_MESSAGING_DESTINATION", additional_data: { is_click_to_message: true } };
const SIN_ADV = { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } };
const COPY = {
  A: { message: `¿Fregadero tapado, inodoro que no para o calentador dañado en ${nombre}? Te decimos el precio ANTES de llegar: destape $149, reparación de inodoro $99, calentador $279. Plomero licenciado de tu zona y 12 meses de garantía en la mano de obra.\n\nEscríbenos por mensaje y te coordinamos la visita.`, title: `Plomero con precio fijo en ${nombre}`, description: "Precio antes de llegar · 12 meses de garantía" },
  B: { message: `¿Fregadero tapado o te quedaste sin agua caliente en ${nombre}? Destape simple $149 y calentador de tanque $279, precio fijo de mano de obra + $19 de coordinación. Plomero licenciado de tu zona y 12 meses de garantía.\n\nMándanos una foto por mensaje y te damos el precio y la hora.`, title: "Destape $149 · Calentador $279", description: `Plomero licenciado en ${nombre}` },
  C: { message: "¿Te ha pasado que el plomero te dice un precio y al final te cobra el doble? Con Resuelto sabes el precio antes de que lleguemos, y si aparece algo, tú lo apruebas primero. 12 meses de garantía por escrito.\n\nEscríbenos por mensaje: te damos tu precio en minutos.", title: "Sin sorpresas en la factura", description: `Plomería con precio fijo en ${nombre}` },
};
const CONJUNTOS = { A: "Precio fijo", B: "Problemas", C: "Confianza" };
const ANUNCIOS = [
  ["A", "video", "precio"], ["A", "flyer", ""], ["A", "flyer", "menu"],
  ["B", "video", "destape"], ["B", "video", "calentador"], ["B", "flyer", "destape"], ["B", "flyer", "calentador"],
  ["C", "video", "sorpresas"], ["C", "flyer", "promesa"], ["C", "flyer", "problema"], ["C", "flyer", "sorpresas"],
];
// Todos los archivos antes de tocar Meta: si falta uno, no se crea nada a medias.
const archivo = (tipo, pieza) => tipo === "video" ? path.join(KIT, `videos/regiones/resuelto-clientes-${slug}-${pieza}.mp4`) : path.join(KIT, `flyers-clientes-regiones/cliente-${slug}${pieza ? "-" + pieza : ""}-feed.png`);
const faltan = ANUNCIOS.map(([, t, p]) => archivo(t, p)).filter((f) => !fs.existsSync(f));
if (faltan.length) throw new Error("Faltan creativos:\n" + faltan.join("\n"));

const ids = plan.ids;
if (!ids.campana) { ids.campana = (await api(`${ACT}/campaigns`, { name: `Resuelto · Clientes · ${nombre} · Messenger+IG`, objective: "OUTCOME_SALES", special_ad_categories: [], status: "PAUSED", is_adset_budget_sharing_enabled: false })).id; guardar(); }
for (const [g, n] of Object.entries(CONJUNTOS)) {
  const k = "conjunto" + g; if (ids[k]) continue;
  ids[k] = (await api(`${ACT}/adsets`, { name: `${g} · ${nombre} · ${n} · Messenger+IG`, campaign_id: ids.campana, status: "ACTIVE", daily_budget: 1000, billing_event: "IMPRESSIONS", optimization_goal: "CONVERSATIONS", destination_type: "MESSAGING_INSTAGRAM_DIRECT_MESSENGER", bid_strategy: "LOWEST_COST_WITHOUT_CAP", promoted_object: { page_id: PAGE }, targeting: { age_min: 28, age_max: 65, geo_locations: { regions: PUEBLOS, location_types: ["home", "recent"] }, targeting_automation: { advantage_audience: 0 } } })).id; guardar();
}
for (const [g, tipo, pieza] of ANUNCIOS) {
  const k = `${g}-${tipo}-${pieza || "ciudad"}`; const a = (plan.anuncios[k] ??= {}); if (a.ad) continue;
  const copy = COPY[g], f = archivo(tipo, pieza), etiqueta = tipo === "video" ? `Video ${pieza}` : `Flyer ${pieza || "de la ciudad"}`;
  if (tipo === "flyer") {
    a.imagen ??= await subirImagen(f); guardar();
    a.creativo ??= (await api(`${ACT}/adcreatives`, { name: `${g} · ${nombre} · ${etiqueta}`, object_story_spec: { page_id: PAGE, instagram_user_id: IG, link_data: { link: "https://fb.com/messenger_doc/", message: copy.message, name: copy.title, description: copy.description, image_hash: a.imagen, call_to_action: CTA } }, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
  } else {
    a.video ??= await subirVideo(f, `Resuelto · Clientes · ${nombre} · ${pieza} 19s`); guardar();
    a.miniatura ??= await subirImagen(miniatura(f)); guardar();
    await esperarVideo(a.video);
    a.creativo ??= (await api(`${ACT}/adcreatives`, { name: `${g} · ${nombre} · ${etiqueta}`, object_story_spec: { page_id: PAGE, instagram_user_id: IG, video_data: { video_id: a.video, image_hash: a.miniatura, message: copy.message, title: copy.title, link_description: copy.description, call_to_action: CTA } }, asset_feed_spec: DESTINOS, degrees_of_freedom_spec: SIN_ADV })).id; guardar();
  }
  a.ad = (await api(`${ACT}/ads`, { name: `${g} · ${etiqueta}`, adset_id: ids["conjunto" + g], creative: { creative_id: a.creativo }, status: "ACTIVE" })).id; guardar();
  console.log("anuncio", k);
}
plan.estado = "Campaña EN PAUSA (Elvin la prende). 3 conjuntos × $10 = $30/día.";
guardar(); console.log(`listo: campaña ${ids.campana} · ${Object.keys(plan.anuncios).length} anuncios · ${OUT}`);
