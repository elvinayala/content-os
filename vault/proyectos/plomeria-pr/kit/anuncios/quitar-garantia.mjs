// Quitar la garantía de 12 meses de los anuncios ACTIVOS (14/oct/2026, Aure → Elvin: "quitar la garantía de 1 año de la
// aplicación y de todos los anuncios"). Cada anuncio activo cuyo texto o arte la menciona recibe un creativo nuevo en el
// MISMO anuncio (mismo id, mismo conjunto, mismo estado): el texto sin la garantía y el arte regenerado sin ella
// (flyers de flyers-clientes-regiones, videos de videos/regiones, gráfico del calentador editado). No se pausa ni se
// prende nada, ni se toca presupuesto.
// Uso: node --env-file=.env.local vault/proyectos/plomeria-pr/kit/anuncios/quitar-garantia.mjs [--real]
// Idempotente: data/meta-ads/campanas/resuelto-sin-garantia-2026-10-14.json.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.join(AQUI, "..");
const RAIZ = path.join(AQUI, "../../../../..");
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768";
const REAL = process.argv.includes("--real");
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-sin-garantia-2026-10-14.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { creado: new Date().toISOString(), anuncios: {} };
const guardar = () => REAL && fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

const api = async (p, body) => {
  const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
  const j = await r.json(); if (j.error) throw new Error(`${p}: ${JSON.stringify(j.error)}`); return j;
};
const leer = async (p, fields) => { const j = await (await fetch(`https://graph.facebook.com/v25.0/${p}?fields=${fields}&access_token=${T}`)).json(); if (j.error) throw new Error(`${p}: ${JSON.stringify(j.error)}`); return j; };
const subirImagen = async (archivo) => { const f = new FormData(); f.append("bytes", fs.readFileSync(archivo).toString("base64")); return Object.values((await api(`${ACT}/adimages`, f)).images)[0].hash; };
const subirVideo = async (archivo, n) => { const f = new FormData(); f.append("name", n); f.append("source", new Blob([fs.readFileSync(archivo)], { type: "video/mp4" }), "v.mp4"); return (await api(`${ACT}/advideos`, f)).id; };
const esperarVideo = async (id) => { for (let i = 0; i < 45; i++) { const r = await leer(id, "status"); if (r.status?.video_status === "ready") return; await new Promise((z) => setTimeout(z, 8000)); } throw new Error("El video no terminó de procesarse: " + id); };
const miniatura = (video) => { const jpg = video.replace(/\.mp4$/, ".mini.jpg"); execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "1.8", "-i", video, "-frames:v", "1", "-q:v", "3", jpg]); return jpg; };

const FLY = (f) => path.join(KIT, "flyers-clientes-regiones", f);
// anuncio → arte nuevo (null = el arte ya está bien, solo cambia el texto)
const ARTE = {
  "120255247298100029": { imagen: path.join(KIT, "flyers-graficos/g-calentador.png") },  // G · calentador (gráfico), editado
  "120255247296090029": null,                                                             // G · cisterna (gráfico): el arte no la menciona
  "120255118332210029": { video: path.join(KIT, "videos/regiones/resuelto-clientes-caguas-precio.mp4") },
  "120255203465220029": { imagen: FLY("cliente-caguas-cisterna-feed.png") },
  "120255203466510029": { imagen: FLY("cliente-caguas-calentador-feed.png") },
  "120255118333520029": { imagen: FLY("cliente-caguas-menu-feed.png") },
  "120255115176090029": { imagen: FLY("cliente-caguas-feed.png") },
  "120255155403390029": { video: path.join(KIT, "videos/regiones/resuelto-clientes-aguadilla-precio.mp4") },
  "120255155405880029": { imagen: FLY("cliente-aguadilla-menu-feed.png") },
  "120255155404830029": { imagen: FLY("cliente-aguadilla-feed.png") },
};

/** Quita la garantía del copy. Los trabajos grandes (cisterna) llevan depósito al agendar: ahí no se dice "pagas al terminar". Pura. */
export function sinGarantia(texto, grande) {
  if (typeof texto !== "string") return texto;
  return texto
    .replace(/ y 12 meses de garant[ií]a( en la mano de obra| por escrito)?\./g, grande ? "." : " y pagas al terminar.")
    .replace(/ · 12 meses de garant[ií]a/g, grande ? "" : " · Pagas al terminar")
    .replace(/12 meses de garant[ií]a/g, "pagas al terminar");
}
const limpiar = (obj, grande) => JSON.parse(JSON.stringify(obj), (k, v) => (typeof v === "string" ? sinGarantia(v, grande) : v));

for (const [adId, arte] of Object.entries(ARTE)) {
  const x = (plan.anuncios[adId] ??= {});
  if (x.listo) { console.log(`✓ ${adId} ya estaba`); continue; }
  const ad = await leer(adId, "name,effective_status,creative{id,name,object_story_spec,asset_feed_spec}");
  const c = ad.creative; const grande = /cisterna|solar/i.test(JSON.stringify(c.object_story_spec)); // trabajos grandes: depósito al agendar
  const oss = limpiar(c.object_story_spec, grande);
  const d = oss.link_data ?? oss.video_data;
  console.log(`\n== ${adId} · ${ad.name} (${ad.effective_status})\n${d.message}\n   ${d.name ?? d.title ?? ""} · ${d.description ?? d.link_description ?? ""}`);
  if (/garant/i.test(JSON.stringify(oss))) throw new Error(`Todavía dice garantía: ${adId}`);
  if (!REAL) continue;
  if (arte?.imagen) { x.imagen ??= await subirImagen(arte.imagen); guardar(); oss.link_data.image_hash = x.imagen; delete oss.link_data.picture; }
  if (arte?.video) {
    x.video ??= await subirVideo(arte.video, `${ad.name} · sin garantía`); guardar();
    x.miniatura ??= await subirImagen(miniatura(arte.video)); guardar();
    await esperarVideo(x.video);
    Object.assign(oss.video_data, { video_id: x.video, image_hash: x.miniatura }); delete oss.video_data.image_url;
  }
  const afs = c.asset_feed_spec ? { optimization_type: c.asset_feed_spec.optimization_type, call_to_actions: c.asset_feed_spec.call_to_actions, ...(c.asset_feed_spec.additional_data ? { additional_data: c.asset_feed_spec.additional_data } : {}) } : undefined;
  x.creativoViejo ??= c.id;
  x.creativo ??= (await api(`${ACT}/adcreatives`, { name: `${c.name ?? ad.name} · sin garantía`, object_story_spec: oss, ...(afs ? { asset_feed_spec: afs } : {}), degrees_of_freedom_spec: { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } } })).id; guardar();
  await api(adId, { creative: { creative_id: x.creativo } });
  x.listo = new Date().toISOString(); guardar();
  console.log(`   ✔ creativo ${x.creativo} puesto en el anuncio`);
}
console.log(REAL ? "\nListo." : "\n(prueba: nada se cambió; corre con --real)");
