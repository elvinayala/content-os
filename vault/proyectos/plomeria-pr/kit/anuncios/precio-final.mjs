// Anuncios de clientes con PRECIO FINAL (20/oct/2026, Elvin: "sí" a cambiar los flyers al precio final, igual que lo cotiza
// el agente desde el 19/oct). Mismo anuncio (mismo id y conjunto), creativo nuevo: texto y flyer con el total (destape $168,
// inodoro $118, calentador $298, cisterna desde $918…), sin "mano de obra + $19". Lo que trae el precio viejo dentro del
// arte y no se puede regenerar al momento (los videos "precio" con la tabla animada y los gráficos G) se pausa.
// De paso arregla Quebradillas: sus 2 anuncios activos todavía decían "12 meses de garantía" (se pausaron el 20/oct al verlo).
// Uso: node --env-file=.env.local vault/proyectos/plomeria-pr/kit/anuncios/precio-final.mjs [--real]
// Idempotente: data/meta-ads/campanas/resuelto-precio-final-2026-10-20.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FLY = (f) => path.join(AQUI, "../flyers-clientes-regiones", f);
const RAIZ = path.join(AQUI, "../../../../..");
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const ACT = "act_1564735818086768";
const REAL = process.argv.includes("--real");
const OUT = path.join(RAIZ, "data/meta-ads/campanas/resuelto-precio-final-2026-10-20.json");
const plan = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { creado: new Date().toISOString(), anuncios: {} };
const guardar = () => REAL && fs.writeFileSync(OUT, JSON.stringify(plan, null, 1));

const api = async (p, body) => {
  for (let i = 0; ; i++) {
    const r = await fetch(`https://graph.facebook.com/v25.0/${p}`, { method: "POST", headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body instanceof FormData ? (body.append("access_token", T), body) : JSON.stringify({ ...body, access_token: T }) });
    const j = await r.json();
    if (j.error?.code === 17 && i < 4) { await new Promise((z) => setTimeout(z, 65_000)); continue; }
    if (j.error) throw new Error(`${p}: ${JSON.stringify(j.error)}`); return j;
  }
};
const leer = async (p, fields) => { for (let i = 0; ; i++) { const j = await (await fetch(`https://graph.facebook.com/v25.0/${p}?fields=${fields}&access_token=${T}`)).json(); if (j.error?.code === 17 && i < 4) { await new Promise((z) => setTimeout(z, 65_000)); continue; } if (j.error) throw new Error(`${p}: ${JSON.stringify(j.error)}`); return j; } };
const subirImagen = async (archivo) => { const f = new FormData(); f.append("bytes", fs.readFileSync(archivo).toString("base64")); return Object.values((await api(`${ACT}/adimages`, f)).images)[0].hash; };

const CHICO = (zona) => `¿Fregadero tapado, inodoro que no para o calentador dañado en ${zona}? Te decimos el precio ANTES de llegar: destape $168, reparación de inodoro $118, calentador $298. Precio final, materiales aparte. Plomero licenciado de tu zona y pagas al terminar.\n\nEscríbenos por mensaje y te coordinamos la visita.`;
const GRANDE = "¿Se fue el agua o la luz otra vez en Caguas y Cidra? Cisterna con bomba desde $918, calentador solar desde $718 y calentador de tanque $298. El precio final te lo damos por escrito antes de empezar: si no lo apruebas, no se toca nada. Plomero licenciado de tu zona.\n\nEscríbenos por mensaje con una foto y te damos tu precio.";
const CISTERNA_QB = "¿Te cortaron el agua otra vez en Quebradillas? Instalamos tu cisterna con bomba y conexiones desde $918, con el precio final por escrito antes de empezar. Reemplazo de bomba: $268. Plomero licenciado de tu zona.\n\nEscríbenos por mensaje y te damos el precio.";

// anuncio → { imagen, mensaje, titulo?, descripcion? } o "pausar"
const CAMBIOS = {
  // Caguas · A Precio fijo
  "120255118332210029": "pausar", // video precio (tabla animada con $149)
  "120255115176090029": { imagen: FLY("cliente-caguas-final-feed.png"), mensaje: CHICO("Caguas") },
  "120255118333520029": { imagen: FLY("cliente-caguas-menu-final-feed.png"), mensaje: CHICO("Caguas") },
  // Caguas y Cidra · D Ticket alto
  "120255203466510029": { imagen: FLY("cliente-caguas-calentador-final-feed.png"), mensaje: GRANDE },
  "120255203465220029": { imagen: FLY("cliente-caguas-cisterna-final-feed.png"), mensaje: GRANDE },
  "120255247298100029": "pausar", // G · calentador (gráfico con $279 de mano de obra)
  "120255247296090029": "pausar", // G · cisterna (gráfico con $899 de mano de obra)
  // Aguadilla · A Precio fijo
  "120255155403390029": "pausar", // video precio
  "120255155404830029": { imagen: FLY("cliente-aguadilla-final-feed.png"), mensaje: CHICO("Aguadilla") },
  "120255155405880029": { imagen: FLY("cliente-aguadilla-menu-final-feed.png"), mensaje: CHICO("Aguadilla") },
  // Quebradillas · A Precio fijo (decían garantía: se prenden ya corregidos)
  "120255121185540029": { imagen: FLY("cliente-quebradillas-cisterna-final-feed.png"), mensaje: CISTERNA_QB, titulo: "Cisterna con bomba desde $918", descripcion: "Precio final por escrito antes de empezar", prender: true },
  "120255119533070029": { imagen: FLY("cliente-quebradillas-final-feed.png"), mensaje: CHICO("Quebradillas"), descripcion: "Precio antes de llegar · Pagas al terminar", prender: true },
};

for (const [adId, c] of Object.entries(CAMBIOS)) {
  const x = (plan.anuncios[adId] ??= {});
  if (x.listo) { console.log(`✓ ${adId} ya estaba`); continue; }
  const ad = await leer(adId, "name,status,creative{id,name,object_story_spec,asset_feed_spec}");
  if (c === "pausar") { console.log(`⏸ ${ad.name} (${ad.status}) → PAUSED`); if (REAL) { await api(adId, { status: "PAUSED" }); x.listo = new Date().toISOString(); x.accion = "pausado"; guardar(); } continue; }
  const oss = JSON.parse(JSON.stringify(ad.creative.object_story_spec)); const d = oss.link_data;
  if (!d) throw new Error(`${adId}: no es un anuncio de imagen`);
  if (!fs.existsSync(c.imagen)) throw new Error("Falta el flyer: " + c.imagen);
  d.message = c.mensaje; if (c.titulo) d.name = c.titulo; if (c.descripcion) d.description = c.descripcion;
  delete d.picture;
  if (/garant|\$149|\$99\b|\$279|\$899|mano de obra|coordinaci/i.test(JSON.stringify(oss))) throw new Error(`${adId}: el texto todavía trae precio viejo o garantía`);
  console.log(`\n== ${ad.name} (${ad.status})${c.prender ? " → ACTIVE" : ""}\n${d.message}\n   ${d.name} · ${d.description}\n   ${path.basename(c.imagen)}`);
  if (!REAL) continue;
  x.imagen ??= await subirImagen(c.imagen); guardar(); d.image_hash = x.imagen;
  const a = ad.creative.asset_feed_spec;
  const afs = a ? { optimization_type: a.optimization_type, call_to_actions: a.call_to_actions, ...(a.additional_data ? { additional_data: a.additional_data } : {}) } : undefined;
  x.creativoViejo ??= ad.creative.id;
  x.creativo ??= (await api(`${ACT}/adcreatives`, { name: `${ad.name} · precio final`, object_story_spec: oss, ...(afs ? { asset_feed_spec: afs } : {}), degrees_of_freedom_spec: { creative_features_spec: { advantage_plus_creative: { enroll_status: "OPT_OUT" } } } })).id; guardar();
  await api(adId, { creative: { creative_id: x.creativo }, ...(c.prender ? { status: "ACTIVE" } : {}) });
  x.listo = new Date().toISOString(); guardar();
  console.log(`   ✔ creativo ${x.creativo}`);
}
console.log(REAL ? "\nListo." : "\n(prueba: nada se cambió; corre con --real)");
