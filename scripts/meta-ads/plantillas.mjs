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

// --- EL MÉTODO DE ELVIN · 5 FASES (23/sep/2026) --------------------------------
// Dicho por él: "fase 1 tráfico, fase 2 ventas con el 70 % del presupuesto (un poco
// más), fase 3 remarketing objetivo ventas, fase 4 remarketing objetivo enganchar
// (ThruPlay) con público de 365 días, fase 5 escalar. Hacer públicos es bien
// importante: siempre crear públicos ANTES de lanzar campaña."
// F1-F4 son estructura (4 campañas EN PAUSA); F5 es operación (resultados → ESCALAR
// horizontal/vertical con permiso de Elvin). Todo 1 creativo por conjunto, ≥ mínimo/día.
export const REPARTO_5F = { f1: 0.10, f2: 0.70, f3: 0.13, f4: 0.07 };

// Públicos que el método crea SIEMPRE antes de lanzar (vacíos se llenan solos).
export function publicosMetodo(cfg) {
  const p = {
    "engagers-365": { tipo: "engagers", dias: 365, nombre: `${cfg.etiqueta || cfg.nombre} · Interacción IG/FB 365d` },
    "video75-365": { tipo: "video75", dias: 365, nombre: `${cfg.etiqueta || cfg.nombre} · Video 75 % 365d (caliente)` },
    "video25-365": { tipo: "video25", dias: 365, nombre: `${cfg.etiqueta || cfg.nombre} · Video 25 % 365d (tibio)` },
    "mensajes-365": { tipo: "mensajes", dias: 365, nombre: `${cfg.etiqueta || cfg.nombre} · Mensajes IG/FB 365d (caliente)` },
    "visitas-120": { tipo: "visitas", dias: 120, nombre: `${cfg.etiqueta || cfg.nombre} · Visitó perfil/página 120d (tibio)` },
  };
  if (cfg.pixelId) p["web-180"] = { tipo: "web", dias: 180, evento: "PageView", nombre: `${cfg.etiqueta || cfg.nombre} · Visitó la web 180d` };
  // Similar 1 % de los que interactuaron (Meta lo llena cuando el origen tiene ≥ 100 personas).
  p["similar-engagers-1"] = { tipo: "similar", origen: "engagers-365", ratio: 0.01, pais: "PR", nombre: `${cfg.etiqueta || cfg.nombre} · Similar 1 % interacción` };
  return p;
}

// Reparte el presupuesto: F2 recibe lo que sobre (≥ 70 %). Una fase que no llega al
// mínimo por conjunto se sube al mínimo si el total aguanta; si no, se omite con motivo.
export function repartirFases(total, { minimo = 10, conjuntos = { f1: 1, f2: 2, f3: 1, f4: 1 } } = {}) {
  const r = {}, omitidas = {};
  for (const f of ["f1", "f3", "f4"]) {
    const necesita = minimo * (conjuntos[f] || 1);
    const pct = Math.round(total * REPARTO_5F[f]);
    r[f] = Math.max(pct, necesita);
  }
  let f2 = total - r.f1 - r.f3 - r.f4;
  // Si F2 no llega al 70 % o a su mínimo, se sacrifican primero F4 y luego F3 (y se dice).
  for (const f of ["f4", "f3"]) {
    if (f2 >= Math.max(total * 0.65, minimo * (conjuntos.f2 || 1))) break;
    f2 += r[f]; omitidas[f] = `presupuesto de $${total}/día no alcanza para ${f.toUpperCase()} sin bajar ventas del 70 %`; delete r[f];
  }
  r.f2 = f2;
  return { reparto: r, omitidas };
}

export function planEstrategia5Fases(cfg, { destino = "dm-ig", presupuesto = 100, reels = [], posts = [], videos = [], copias = [], edad, intereses = [], url, nombre, excluir } = {}) {
  if (!["dm-ig", "leads", "enlace"].includes(destino)) throw new Error("--destino debe ser dm-ig | leads | enlace (WhatsApp se monta desde Bori)");
  const creativos = creativosDe({ reels, posts, videos, copias }, "C");
  if (!creativos.length) throw new Error("La estrategia necesita creativos: --reels, --posts o --videos");
  const reglas = cfg.reglas || {};
  const minimo = reglas.minPorConjunto ?? cfg.minPorConjunto ?? 10;
  const etiqueta = cfg.etiqueta || cfg.nombre;
  const ex = excluir ?? cfg.exclusionesBase ?? [];
  const nF2 = Math.max(1, Math.min(creativos.length, Math.floor((presupuesto * REPARTO_5F.f2) / minimo)));
  // F3 en dos conjuntos (caliente/tibio) solo si cada uno llega al mínimo sin ahogar ventas; si no, remarketing total.
  const dosF3 = presupuesto * REPARTO_5F.f3 >= 2 * minimo;
  const { reparto, omitidas } = repartirFases(presupuesto, { minimo, conjuntos: { f1: 1, f2: nF2, f3: dosF3 ? 2 : 1, f4: 1 } });
  const conVideo = creativos.filter((c) => c.igMediaId || c.videoId || c.postId);
  const sub = (fase, modo, extra) => {
    const plan = base(cfg, { nombre: `${etiqueta} · ${fase} · ${nombre || "Método 5 Fases"}`, modo, presupuesto: reparto[extra.clave], edad, excluir: ex, intereses: extra.frio ? intereses : [], advantage: extra.frio ? !intereses.length : false });
    plan.fase = extra.clave;
    if (url) plan.landing = url;
    if (modo === "leads") plan.evento = "LEAD";
    return plan;
  };
  const fases = [];
  // F1 · Tráfico (frío): calienta y llena los públicos de remarketing. Perfil IG si no hay URL.
  const f1 = sub("F1 Tráfico", url ? "enlace" : "perfil-ig", { clave: "f1", frio: true });
  f1.creativos = [creativos[0]]; f1.conjuntos = [{ clave: "F1-1", publico: "P1", creativo: creativos[0].clave, presupuestoDiario: reparto.f1 }];
  fases.push(f1);
  // F2 · Ventas (frío, ≥ 70 %): 1 creativo por conjunto.
  const f2 = sub("F2 Ventas", destino, { clave: "f2", frio: true });
  f2.creativos = creativos.slice(0, nF2);
  const cadaF2 = Math.floor(reparto.f2 / nF2); // dólares enteros; el sobrante al primero (suma exacta)
  f2.conjuntos = f2.creativos.map((cr, i) => ({ clave: `F2-${i + 1}`, publico: "P1", creativo: cr.clave, presupuestoDiario: cadaF2 + (i === 0 ? reparto.f2 - cadaF2 * nF2 : 0) }));
  fases.push(f2);
  // F3 · Remarketing objetivo ventas: caliente (video 75 %, mensajes, web) y tibio (video 25 %, visitas, interacción, similares).
  if (reparto.f3) {
    const f3 = sub("F3 Remarketing ventas", destino, { clave: "f3" });
    const caliente = ["video75-365", "mensajes-365", ...(cfg.pixelId ? ["web-180"] : []), ...(cfg.publicosClave?.["clientes-alto-valor"] ? ["clientes-alto-valor"] : [])];
    const tibio = ["video25-365", "visitas-120", "engagers-365", "similar-engagers-1"];
    const dos = dosF3;
    f3.publicos = dos
      ? { CAL: { nombre: "Caliente", incluir: caliente, excluir: ex }, TIB: { nombre: "Tibio + similares", incluir: tibio, excluir: ex } }
      : { REM: { nombre: "Remarketing total", incluir: [...caliente, ...tibio], excluir: ex } };
    f3.creativos = [creativos[0]];
    const claves = Object.keys(f3.publicos);
    // Caliente pesa más (60/40): está más cerca de comprar. La suma cuadra exacto con F3.
    const cal = dos ? Math.max(minimo, Math.round(reparto.f3 * 0.6)) : reparto.f3;
    const montos = dos ? [cal, reparto.f3 - cal] : [reparto.f3];
    f3.conjuntos = claves.map((k, i) => ({ clave: `F3-${k}`, publico: k, creativo: creativos[0].clave, presupuestoDiario: montos[i] }));
    f3.dependeDePublicos = true;
    fases.push(f3);
  }
  // F4 · Remarketing objetivo enganchar (ThruPlay) al público 365: top of mind, no venta.
  if (reparto.f4 && conVideo.length) {
    const f4 = sub("F4 ThruPlay 365", "thruplay", { clave: "f4" });
    f4.publicos = { CA365: { nombre: "Público 365 (interacción + video)", incluir: ["engagers-365", "video25-365"], excluir: ex } };
    f4.creativos = [{ ...conVideo[0], cta: null }];
    f4.conjuntos = [{ clave: "F4-365", publico: "CA365", creativo: conVideo[0].clave, presupuestoDiario: reparto.f4 }];
    f4.dependeDePublicos = true;
    fases.push(f4);
  } else if (reparto.f4) omitidas.f4 = "ThruPlay necesita un reel/post/video";
  return {
    tipo: "estrategia-5-fases", marca: cfg.clave, nombre: nombre || `${etiqueta} · Método 5 Fases`, fecha: hoy(),
    presupuestoDiario: presupuesto, destino, reparto, omitidas,
    publicosACrear: publicosMetodo(cfg),
    fases,
    f5: "Escalar: `resultados --ads` cada 3-7 días; ganadores (ROAS ≥ meta o CPL ≤ 70 % del tope con CTR ≥ 2 %) → vertical +10-20 % o horizontal (duplicar el creativo a público nuevo). Se PROPONE a Elvin y se ejecuta solo con su OK.",
  };
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
  if (flags.destino) o.destino = String(flags.destino);
  // --intereses "6003178845152:The Home Depot,6003234413249:Remodelaciones"
  if (flags.intereses) o.intereses = String(flags.intereses).split(",").map((x) => { const [id, ...n] = x.split(":"); return { id: id.trim(), name: n.join(":").trim() || id.trim() }; }).filter((i) => /^\d+$/.test(i.id));
  return o;
}
