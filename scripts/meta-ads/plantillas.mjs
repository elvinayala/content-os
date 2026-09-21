// Plantillas de campaña del agente de Meta Ads: convierten "lo que pide Elvin en
// una frase" en un plan JSON que `crear` monta EN PAUSA. Módulo puro (sin red):
// se testea en tests/meta-ads.test.mjs.
//
//   follow-me    tráfico al perfil de IG con reels existentes (meta ≤ $1/seguidor)
//   trafico-url  clics a una URL (YouTube, landing, tienda) con reels existentes
//   dm-instagram conversaciones por DM de IG (ManyChat calienta y agenda)
//   quiz         leads del pixel a la landing del quiz (videos subidos o marcador)
//
// Reglas que aplican solas: 1 creativo por conjunto (test limpio), presupuesto
// repartido en partes iguales, todo PAUSED, Instagram como plataforma, edad de la
// marca (portafolio.reglas.edad) salvo que se indique, exclusiones de la marca.

const hoy = () => new Date().toISOString().slice(0, 10);
const redondear = (n) => Math.round(n * 100) / 100;

// Reparte `total` entre `n` conjuntos respetando el mínimo por conjunto de la marca.
export function repartir(total, n, minimo = 10) {
  if (!n) throw new Error("Sin creativos: pasa --reels o --videos");
  const porConjunto = redondear(total / n);
  if (porConjunto < minimo) throw new Error(`$${total}/día entre ${n} conjuntos = $${porConjunto} < mínimo $${minimo}. Sube el presupuesto o quita creativos.`);
  return porConjunto;
}

function base(cfg, { nombre, modo, presupuesto, edad, advantage = true, excluir = [], intereses = [], plataformas }) {
  const reglas = cfg.reglas || {};
  const [edadMin, edadMax] = edad || reglas.edad || [25, 55];
  const minimo = reglas.minPorConjunto ?? cfg.minPorConjunto ?? 10;
  // Meta rechaza age_max con público Advantage+ (error 1870189): con tope de edad
  // se usa el público original (advantage_audience 0), igual que en Ads Manager.
  if (edadMax < 65) advantage = false;
  return {
    marca: cfg.clave, nombre, modo, creadoPor: "plantilla", fecha: hoy(),
    cuentaId: cfg.cuentaId, pageId: cfg.pageId, igUserId: cfg.igUserId, igHandle: cfg.igHandle || null, pixelId: cfg.pixelId || null,
    topeDiario: presupuesto, minPorConjunto: minimo,
    targetingBase: { paises: ["PR"], edadMin, edadMax, plataformas: plataformas || (reglas.ubicaciones === "instagram" ? ["instagram"] : ["instagram"]), advantage },
    // `amplio`: público abierto PR con tope de edad, a propósito (Follow Me / tráfico de artista).
    publicos: { P1: { nombre: advantage ? "Advantage+ PR" : `PR ${edadMin}-${edadMax}${intereses.length ? " · intereses" : ""}`, advantage, excluir, intereses, amplio: !advantage && !intereses.length } },
    creativos: [], conjuntos: [],
  };
}

function conjuntosPorCreativo(plan, prefijo, porConjunto) {
  plan.conjuntos = plan.creativos.map((cr, i) => ({
    clave: `${prefijo}-${i + 1}`, publico: "P1", creativo: cr.clave, presupuestoDiario: porConjunto,
    nombre: `${prefijo}-${i + 1} · ${plan.publicos.P1.nombre} · ${cr.clave}`,
    nombreAnuncio: `${cr.clave} · ${cr.igMediaId ? "reel " + cr.igMediaId : cr.postId ? "post " + cr.postId : cr.videoId ? "video " + cr.videoId : "⚠ SUBIR VIDEO"}`,
  }));
  return plan;
}

function creativosDe({ reels = [], posts = [], videos = [], copias = [] }, prefijo) {
  const out = [];
  reels.forEach((id, i) => out.push({ clave: `${prefijo}-R${i + 1}`, igMediaId: String(id) }));
  posts.forEach((id, i) => out.push({ clave: `${prefijo}-P${i + 1}`, postId: String(id) }));
  videos.forEach((v, i) => out.push({ clave: `${prefijo}-V${i + 1}`, videoId: v ? String(v) : null, copy: copias[i] || copias[0] || {} }));
  return out;
}

// --- Follow Me: tráfico al perfil de IG con reels existentes ---------------------
export function planFollowMe(cfg, { reels = [], posts = [], presupuesto = 20, edad, nombre, excluir } = {}) {
  const plan = base(cfg, { nombre: nombre || `${cfg.etiqueta || cfg.nombre} · Follow Me · Tráfico a perfil IG · ${reels.length + posts.length} reels · $1/seguidor`, modo: "perfil-ig", presupuesto, edad, excluir: excluir ?? cfg.exclusionesBase ?? [] });
  plan.creativos = creativosDe({ reels, posts }, "FM");
  return conjuntosPorCreativo(plan, "FM", repartir(presupuesto, plan.creativos.length, plan.minPorConjunto));
}

// --- Tráfico a una URL (YouTube, tienda, landing) con reels existentes -----------
export function planTraficoUrl(cfg, { url, reels = [], posts = [], presupuesto = 10, edad, nombre, cta = "WATCH_MORE", excluir } = {}) {
  if (!url) throw new Error("trafico-url necesita --url");
  const plan = base(cfg, { nombre: nombre || `${cfg.etiqueta || cfg.nombre} · Tráfico a ${new URL(url).hostname.replace(/^www\./, "")} · ${reels.length + posts.length} reels · solo IG`, modo: "enlace", presupuesto, edad, excluir: excluir ?? cfg.exclusionesBase ?? [] });
  plan.landing = url;
  plan.creativos = creativosDe({ reels, posts }, "YT").map((c) => ({ ...c, cta }));
  return conjuntosPorCreativo(plan, "YT", repartir(presupuesto, plan.creativos.length, plan.minPorConjunto));
}

// --- DM de Instagram (ventas → conversaciones; ManyChat nutre) -------------------
export function planDmInstagram(cfg, { videos = [], reels = [], copias = [], presupuesto = 30, edad, nombre, excluir, intereses = [] } = {}) {
  const plan = base(cfg, { nombre: nombre || `${cfg.etiqueta || cfg.nombre} · DM Instagram · Ventas · Test ${videos.length + reels.length} creativos`, modo: "dm-ig", presupuesto, edad, excluir: excluir ?? cfg.exclusionesBase ?? [], intereses, advantage: !intereses.length });
  plan.creativos = creativosDe({ reels, videos, copias }, "DM").map((c) => (c.igMediaId ? { ...c, cta: "MESSAGE_PAGE" } : c));
  return conjuntosPorCreativo(plan, "DM", repartir(presupuesto, plan.creativos.length, plan.minPorConjunto));
}

// --- Quiz / landing con pixel (leads) -------------------------------------------
export function planQuiz(cfg, { videos = [], copias = [], presupuesto = 39, edad, nombre, excluir, intereses = [], url, utmCampaign } = {}) {
  if (!cfg.pixelId) throw new Error("quiz necesita pixelId en portafolio.json");
  const landing = url || cfg.landing?.url;
  if (!landing) throw new Error("quiz necesita --url o landing.url en portafolio.json");
  const plan = base(cfg, { nombre: nombre || `${cfg.etiqueta || cfg.nombre} · Quiz · Leads · Test ${videos.length} creativos`, modo: "leads", presupuesto, edad, excluir: excluir ?? cfg.exclusionesBase ?? [], intereses, advantage: !intereses.length });
  plan.landing = landing; plan.evento = "LEAD";
  plan.urlTags = `${cfg.landing?.utmBase || "utm_source=meta&utm_medium=paid"}&utm_campaign=${utmCampaign || (cfg.clave + "-quiz")}&utm_content={{ad.name}}&utm_term={{adset.name}}`;
  plan.creativos = creativosDe({ videos, copias }, "Q");
  return conjuntosPorCreativo(plan, "Q", repartir(presupuesto, plan.creativos.length, plan.minPorConjunto));
}

export const PLANTILLAS = { "follow-me": planFollowMe, "trafico-url": planTraficoUrl, "dm-instagram": planDmInstagram, "quiz": planQuiz };

// Parseo de flags de la CLI/Telegram: --reels a,b --presupuesto 15 --edad 18-35 --url … --nombre "…"
export function opcionesDesdeFlags(flags) {
  const lista = (v) => (v ? String(v).split(/[,\s]+/).filter(Boolean) : []);
  const o = {};
  if (flags.reels) o.reels = lista(flags.reels);
  if (flags.posts) o.posts = lista(flags.posts);
  if (flags.videos) o.videos = lista(flags.videos);
  if (flags.presupuesto) o.presupuesto = Number(flags.presupuesto);
  if (flags.edad) { const m = String(flags.edad).match(/^(\d+)\s*-\s*(\d+)$/); if (!m) throw new Error("--edad debe ser 18-35"); o.edad = [Number(m[1]), Number(m[2])]; }
  if (flags.url) o.url = String(flags.url);
  if (flags.nombre) o.nombre = String(flags.nombre);
  if (flags.cta) o.cta = String(flags.cta);
  if (flags.excluir) o.excluir = lista(flags.excluir);
  return o;
}
