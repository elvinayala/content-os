// Núcleo del agente de Meta Ads del Content OS: cliente de la Marketing API +
// builders PUROS (campaña / conjunto / creativo / anuncio / públicos) + lectura
// de resultados. Portado de los patrones que ya corren en producción en Bori
// (heybori.ai, meta.js): TODO se crea en PAUSA, presupuesto por conjunto (ABO),
// `instagram_user_id` (no `instagram_actor_id`), promoted_object con pixel.
//
// Los builders no tocan la red: se prueban en tests/meta-ads.test.mjs.
// Nada de aquí activa campañas ni sube presupuestos: eso lo hace Elvin en Ads Manager.

import { createHash } from "node:crypto";

export const VERSION = process.env.META_API_VERSION || "v25.0";
export const GRAPH = "https://graph.facebook.com/" + VERSION;

const DAY = 86400;

// ---------- cliente ----------
export class MetaError extends Error {
  constructor(message, { status, code, subcode, type, path } = {}) {
    super(message);
    this.name = "MetaError";
    this.status = status; this.code = code; this.subcode = subcode; this.type = type; this.path = path;
  }
}

export function crearCliente(token, { fetchImpl = fetch, log } = {}) {
  if (!token) throw new Error("Falta el token de Meta (META_ADS_TOKEN)");
  async function graph(method, path, params = {}) {
    const url = new URL(GRAPH + path);
    const init = { method, headers: {} };
    const enc = (v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));
    if (method === "GET") {
      url.searchParams.set("access_token", token);
      for (const k of Object.keys(params)) if (params[k] !== undefined) url.searchParams.set(k, enc(params[k]));
    } else {
      const body = new URLSearchParams();
      body.set("access_token", token);
      for (const k of Object.keys(params)) if (params[k] !== undefined) body.set(k, enc(params[k]));
      init.body = body;
      init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    log?.(method, path);
    const res = await fetchImpl(url, init);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok || json.error) {
      const e = json.error || {};
      throw new MetaError(
        `${method} ${path} → ${res.status} ${e.message || text.slice(0, 300)}` +
          (e.error_user_msg ? ` · ${e.error_user_msg}` : ""),
        { status: res.status, code: e.code, subcode: e.error_subcode, type: e.type, path },
      );
    }
    return json;
  }
  // Pagina hasta `max` items (Meta pagina con paging.next).
  async function todos(path, params = {}, max = 1000) {
    const out = [];
    let j = await graph("GET", path, { limit: 200, ...params });
    out.push(...(j.data || []));
    while (j.paging?.next && out.length < max) {
      const res = await fetchImpl(j.paging.next);
      j = await res.json();
      if (j.error) throw new MetaError(j.error.message, { code: j.error.code });
      out.push(...(j.data || []));
    }
    return out.slice(0, max);
  }
  return { graph, todos, token };
}

// ---------- lecturas ----------
export const acct = (cuentaId) => "/act_" + String(cuentaId).replace(/^act_/, "");

export async function infoCuenta(c, cuentaId) {
  return c.graph("GET", acct(cuentaId), {
    fields: "id,name,account_status,currency,timezone_name,amount_spent,business{id,name},disable_reason",
  });
}
export async function cuentasDelToken(c) {
  return c.todos("/me/adaccounts", { fields: "id,name,account_status,currency,business{id,name}" });
}
export async function paginasDelToken(c, negocioId) {
  const props = await c.todos("/me/accounts", { fields: "id,name,instagram_business_account{id,username}" }).catch(() => []);
  const owned = negocioId
    ? await c.todos(`/${negocioId}/owned_pages`, { fields: "id,name,instagram_business_account{id,username}" }).catch(() => [])
    : [];
  const client = negocioId
    ? await c.todos(`/${negocioId}/client_pages`, { fields: "id,name,instagram_business_account{id,username}" }).catch(() => [])
    : [];
  const vistos = new Map();
  for (const p of [...props, ...owned, ...client]) vistos.set(p.id, p);
  return [...vistos.values()];
}
export async function infoPixel(c, pixelId) {
  return c.graph("GET", "/" + pixelId, { fields: "id,name,last_fired_time,is_unavailable,data_use_setting,owner_business{id,name}" });
}
export async function estadisticasPixel(c, pixelId) {
  // Eventos recibidos por el pixel (últimos días) agregados por nombre de evento.
  const j = await c.graph("GET", `/${pixelId}/stats`, { aggregation: "event", fields: "count,event" }).catch(() => ({ data: [] }));
  return j.data || [];
}
export async function listarPublicos(c, cuentaId) {
  return c.todos(acct(cuentaId) + "/customaudiences", {
    fields: "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,lookalike_spec,time_updated,data_source",
  });
}
export async function listarVideos(c, cuentaId, limit = 50) {
  return c.todos(acct(cuentaId) + "/advideos", { fields: "id,title,length,created_time,updated_time,thumbnails.limit(1){uri}", limit: 50 }, limit);
}
export async function buscarIntereses(c, q, limit = 8) {
  const j = await c.graph("GET", "/search", { type: "adinterest", q, limit, locale: "es_LA" });
  return (j.data || []).map((i) => ({ id: i.id, name: i.name, tamano: i.audience_size_lower_bound ?? null, path: (i.path || []).join(" > ") }));
}
export async function listarCampanas(c, cuentaId) {
  return c.todos(acct(cuentaId) + "/campaigns", { fields: "id,name,status,effective_status,objective,daily_budget,created_time,updated_time" });
}
export async function arbolCampana(c, campaignId) {
  const camp = await c.graph("GET", "/" + campaignId, { fields: "id,name,status,effective_status,objective,is_adset_budget_sharing_enabled" });
  const adsets = await c.todos(`/${campaignId}/adsets`, {
    fields: "id,name,status,effective_status,daily_budget,optimization_goal,billing_event,bid_strategy,destination_type,promoted_object,targeting",
  });
  const ads = await c.todos(`/${campaignId}/ads`, { fields: "id,name,status,effective_status,adset_id,creative{id,name,url_tags,object_story_spec}" });
  return { camp, adsets, ads };
}
export async function insights(c, cuentaId, { campaignId, nivel = "adset", preset = "last_7d", desde, hasta } = {}) {
  const params = {
    level: nivel,
    fields: "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,clicks,unique_clicks,ctr,unique_ctr,cpc,cpm,actions,cost_per_action_type,action_values,purchase_roas",
  };
  if (desde && hasta) params.time_range = { since: desde, until: hasta }; else params.date_preset = preset;
  if (campaignId) params.filtering = [{ field: "campaign.id", operator: "IN", value: [String(campaignId)] }];
  return c.todos(acct(cuentaId) + "/insights", params);
}

// ---------- builders puros ----------
export const centavos = (usd) => String(Math.max(100, Math.round(Number(usd) * 100)));

export function buildCampaignBody({ nombre, objetivo = "OUTCOME_LEADS", categoriasEspeciales = [] }) {
  return {
    name: nombre,
    objective: objetivo,
    status: "PAUSED",
    special_ad_categories: categoriasEspeciales,
    // ABO: presupuesto por conjunto. Meta exige declarar el campo cuando no hay
    // presupuesto de campaña (Bori lo aprendió en producción, 2026).
    is_adset_budget_sharing_enabled: "false",
  };
}

const POSICIONES_IG = ["stream", "story", "reels", "explore", "explore_home", "profile_feed"];

// Targeting de un conjunto a partir del plan (paises/edades/plataformas/públicos/intereses).
export function buildTargeting({
  paises = ["PR"], edadMin = 25, edadMax = 55,
  plataformas = ["instagram"], posicionesIG = POSICIONES_IG,
  incluir = [], excluir = [], intereses = [], comportamientos = [],
  advantage = false, idiomas = [],
}) {
  const t = {
    geo_locations: { countries: paises },
    age_min: edadMin,
    age_max: edadMax,
    // Meta exige declarar Advantage+ audience explícitamente (0/1) en conjuntos nuevos.
    targeting_automation: { advantage_audience: advantage ? 1 : 0 },
  };
  if (idiomas.length) t.locales = idiomas;
  if (plataformas.length) {
    t.publisher_platforms = plataformas;
    if (plataformas.includes("instagram") && posicionesIG.length) t.instagram_positions = posicionesIG;
    if (plataformas.includes("facebook")) t.facebook_positions = ["feed", "story", "facebook_reels", "video_feeds"];
  }
  if (incluir.length) t.custom_audiences = incluir.map((id) => ({ id: String(id) }));
  if (excluir.length) t.excluded_custom_audiences = excluir.map((id) => ({ id: String(id) }));
  const flex = {};
  if (intereses.length) flex.interests = intereses.map((i) => ({ id: String(i.id), name: i.name }));
  if (comportamientos.length) flex.behaviors = comportamientos.map((b) => ({ id: String(b.id), name: b.name }));
  if (Object.keys(flex).length) t.flexible_spec = [flex];
  return t;
}

// Formas verificadas contra campañas montadas a mano (Mauro/LU, 19-20/sep/2026):
//   perfil IG  → PROFILE_VISIT + INSTAGRAM_PROFILE + promoted_object {page_id}
//   enlace     → LINK_CLICKS + WEBSITE (sin promoted_object)
//   DM IG      → CONVERSATIONS + INSTAGRAM_DIRECT + promoted_object {page_id}
//   leads web  → OFFSITE_CONVERSIONS + WEBSITE + promoted_object {pixel_id, custom_event_type}
export const OPTIMIZACIONES = {
  "perfil-ig": { optimizacion: "PROFILE_VISIT", destino: "INSTAGRAM_PROFILE", objetivo: "OUTCOME_TRAFFIC" },
  "enlace": { optimizacion: "LINK_CLICKS", destino: "WEBSITE", objetivo: "OUTCOME_TRAFFIC" },
  "dm-ig": { optimizacion: "CONVERSATIONS", destino: "INSTAGRAM_DIRECT", objetivo: "OUTCOME_SALES" },
  "leads": { optimizacion: "OFFSITE_CONVERSIONS", destino: "WEBSITE", objetivo: "OUTCOME_LEADS" },
  // Fase 4 del método de Elvin: reconocimiento a público 365 (no es venta). Sin destino.
  "thruplay": { optimizacion: "THRUPLAY", destino: null, objetivo: "OUTCOME_AWARENESS" },
};
export function buildAdSetBody({
  nombre, campaignId, presupuestoDiario, pixelId, pageId, evento = "LEAD",
  optimizacion = "OFFSITE_CONVERSIONS", targeting, destino = "WEBSITE",
}) {
  if (!pixelId && optimizacion === "OFFSITE_CONVERSIONS") throw new Error("Optimizar a conversiones requiere pixelId");
  if (!pageId && (optimizacion === "PROFILE_VISIT" || optimizacion === "CONVERSATIONS")) throw new Error(`${optimizacion} requiere pageId`);
  const body = {
    name: nombre,
    campaign_id: campaignId,
    daily_budget: centavos(presupuestoDiario),
    billing_event: "IMPRESSIONS",
    optimization_goal: optimizacion,
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    ...(destino ? { destination_type: destino } : {}),
    targeting,
    status: "PAUSED",
  };
  if (optimizacion === "OFFSITE_CONVERSIONS") body.promoted_object = { pixel_id: String(pixelId), custom_event_type: evento };
  if (optimizacion === "PROFILE_VISIT" || optimizacion === "CONVERSATIONS") body.promoted_object = { page_id: String(pageId) };
  return body;
}

// Creativo a partir de una publicación que YA existe (reel de Instagram o post de
// Facebook): no se sube video ni se escribe copy; se promociona el post tal cual
// (conserva likes/comentarios). `igMediaId` = id del reel en IG (18…); `postId`
// = id del post de FB (page_post). CTA: VIEW_INSTAGRAM_PROFILE (Follow Me),
// WATCH_MORE / LEARN_MORE con `link` (tráfico a URL), MESSAGE_PAGE… (DM).
export function buildCreativeExistente({ nombre, pageId, igUserId, igMediaId, postId, cta = "VIEW_INSTAGRAM_PROFILE", link, urlTags }) {
  if (!pageId) throw new Error("Falta pageId para el creativo");
  if (!igMediaId && !postId) throw new Error("El creativo existente necesita igMediaId o postId");
  const body = { name: nombre, object_id: String(pageId) };
  if (igMediaId) {
    if (!igUserId) throw new Error("Un reel existente necesita igUserId (portafolio.json)");
    body.source_instagram_media_id = String(igMediaId);
    body.instagram_user_id = String(igUserId);
  } else {
    body.object_story_id = `${pageId}_${postId}`;
    if (igUserId) body.instagram_user_id = String(igUserId);
  }
  if (cta) body.call_to_action = link ? { type: cta, value: { link } } : { type: cta }; // ThruPlay: sin CTA
  if (urlTags) body.url_tags = urlTags;
  return body;
}

// Creativo de video (o imagen) que manda a la landing. `urlTags` = UTMs dinámicos
// ({{ad.name}}, {{adset.name}}) que la landing ya lee y manda a Pipedrive.
export function buildCreativeBody({
  nombre, pageId, igUserId, videoId, imageHash, thumbUrl,
  link, textoPrincipal = "", titulo = "", descripcion = "", cta = "LEARN_MORE", urlTags,
}) {
  if (!pageId) throw new Error("Falta pageId para el creativo");
  if (!videoId && !imageHash) throw new Error("El creativo necesita videoId o imageHash");
  const spec = { page_id: String(pageId) };
  const call_to_action = { type: cta, value: { link } };
  if (videoId) {
    spec.video_data = { video_id: String(videoId), message: textoPrincipal.slice(0, 2000), title: titulo.slice(0, 255), link_description: descripcion.slice(0, 255), call_to_action };
    if (thumbUrl) spec.video_data.image_url = thumbUrl;
  } else {
    spec.link_data = { image_hash: imageHash, link, message: textoPrincipal.slice(0, 2000), name: titulo.slice(0, 255), description: descripcion.slice(0, 255), call_to_action };
  }
  if (igUserId) spec.instagram_user_id = String(igUserId);
  const body = { name: nombre, object_story_spec: spec };
  if (urlTags) body.url_tags = urlTags;
  return body;
}

export function buildAdBody({ nombre, adsetId, creativeId }) {
  return { name: nombre, adset_id: adsetId, creative: { creative_id: creativeId }, status: "PAUSED" };
}

// ---------- medios que produce Max (flyers y videos de fal) ----------
// Imagen: Meta no la baja de una URL; se manda en base64 y devuelve el hash que usa el creativo.
export async function subirImagen(c, cuentaId, url, { fetchImpl = fetch } = {}) {
  const r = await fetchImpl(url);
  if (!r.ok) throw new Error(`no pude bajar el flyer (${r.status}): ${url}`);
  const bytes = Buffer.from(await r.arrayBuffer()).toString("base64");
  const j = await c.graph("POST", acct(cuentaId) + "/adimages", { bytes });
  const hash = Object.values(j.images || {})[0]?.hash;
  if (!hash) throw new Error("Meta no devolvió el hash de la imagen");
  return hash;
}

// Video: Meta sí lo baja de la URL; hay que esperar a que lo procese para usarlo (y trae su miniatura).
export async function subirVideo(c, cuentaId, url, nombre = "Video Max", { intentos = 60, esperaMs = 5000, dormir = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const j = await c.graph("POST", acct(cuentaId) + "/advideos", { file_url: url, name: nombre });
  if (!j.id) throw new Error("Meta no devolvió el id del video");
  for (let i = 0; i < intentos; i++) {
    const v = await c.graph("GET", "/" + j.id, { fields: "status,picture" });
    const est = v.status?.video_status;
    if (est === "ready") return { id: j.id, thumbUrl: v.picture || null };
    if (est === "error") throw new Error(`Meta no pudo procesar el video ${j.id}`);
    await dormir(esperaMs);
  }
  throw new Error(`el video ${j.id} sigue procesándose en Meta; vuelve a correr (es idempotente)`);
}

// ---------- públicos ----------
export function specPublicoWeb({ nombre, pixelId, dias = 180, evento = "PageView", urlContiene }) {
  const filters = [{ field: "event", operator: "eq", value: evento }];
  if (urlContiene) filters.push({ field: "url", operator: "i_contains", value: urlContiene });
  return {
    name: nombre,
    subtype: "WEBSITE",
    prefill: "true",
    rule: { inclusions: { operator: "or", rules: [{ event_sources: [{ id: String(pixelId), type: "pixel" }], retention_seconds: dias * DAY, filter: { operator: "and", filters } }] } },
  };
}
export function specPublicoEngagement({ nombre, pageId, igUserId, dias = 365, tipo = "engagers" }) {
  const rules = [];
  const add = (src, event, extra = []) => src && rules.push({
    event_sources: [src], retention_seconds: dias * DAY,
    filter: { operator: "and", filters: [{ field: "event", operator: "eq", value: event }, ...extra] },
  });
  const fb = pageId ? { id: String(pageId), type: "page" } : null;
  const ig = igUserId ? { id: String(igUserId), type: "ig_business" } : null;
  if (tipo === "engagers") { add(fb, "page_engaged"); add(ig, "ig_business_profile_engaged"); }
  if (tipo === "mensajes") { add(fb, "page_messaged"); add(ig, "ig_business_messaged"); }
  if (tipo === "video75") { add(fb, "video_watched", [{ field: "aggregation", operator: ">=", value: "75" }]); add(ig, "video_watched", [{ field: "aggregation", operator: ">=", value: "75" }]); }
  if (tipo === "visitas") { add(fb, "page_visited"); add(ig, "ig_business_profile_visit"); }
  if (tipo === "guardados") add(ig, "ig_business_saved");
  if (tipo === "video50") { add(fb, "video_watched", [{ field: "aggregation", operator: ">=", value: "50" }]); add(ig, "video_watched", [{ field: "aggregation", operator: ">=", value: "50" }]); }
  if (tipo === "video25") { add(fb, "video_watched", [{ field: "aggregation", operator: ">=", value: "25" }]); add(ig, "video_watched", [{ field: "aggregation", operator: ">=", value: "25" }]); }
  if (!rules.length) throw new Error("specPublicoEngagement: falta pageId/igUserId o tipo inválido");
  return { name: nombre, subtype: "ENGAGEMENT", rule: { inclusions: { operator: "or", rules } } };
}
export function specPublicoLista({ nombre, descripcion = "" }) {
  return { name: nombre, subtype: "CUSTOM", customer_file_source: "USER_PROVIDED_ONLY", description: descripcion };
}
export function specSimilar({ nombre, origenId, ratio = 0.01, pais = "PR" }) {
  return { name: nombre, subtype: "LOOKALIKE", origin_audience_id: String(origenId), lookalike_spec: { country: pais, ratio } };
}
export const sha256 = (s) => createHash("sha256").update(String(s)).digest("hex");
export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const normTel = (t) => String(t || "").replace(/[^0-9]/g, "");
// Filas [email, telefono] → payload hasheado para POST /{audience}/users.
export function payloadLista(filas) {
  const data = filas
    .map(([e, t]) => [normEmail(e), normTel(t)])
    .filter(([e, t]) => e || t)
    .map(([e, t]) => [e ? sha256(e) : "", t ? sha256(t) : ""]);
  return { schema: ["EMAIL", "PHONE"], data };
}

export async function crearPublico(c, cuentaId, spec) {
  const j = await c.graph("POST", acct(cuentaId) + "/customaudiences", spec);
  if (!j.id) throw new Error("Meta no devolvió id del público");
  return j.id;
}
export async function subirLista(c, publicoId, filas) {
  const payload = payloadLista(filas);
  const out = [];
  for (let i = 0; i < payload.data.length; i += 5000) {
    out.push(await c.graph("POST", `/${publicoId}/users`, { payload: { schema: payload.schema, data: payload.data.slice(i, i + 5000) } }));
  }
  return out;
}

// ---------- plan → Meta ----------
// Valida un plan de campaña antes de tocar la API. Devuelve lista de errores.
export function validarPlan(plan, { publicosDisponibles = new Map() } = {}) {
  const errores = [];
  if (!plan.marca) errores.push("plan.marca vacío");
  if (!plan.nombre) errores.push("plan.nombre vacío");
  const modo = plan.modo || "leads";
  if (modo === "leads" && !plan.pixelId) errores.push("plan.pixelId vacío");
  if ((modo === "leads" || modo === "enlace") && !plan.landing) errores.push("plan.landing vacío");
  if (!plan.pageId) errores.push("plan.pageId vacío (corre `cuentas` y guárdalo en portafolio.json)");
  if (!OPTIMIZACIONES[modo]) errores.push(`plan.modo "${modo}" desconocido (${Object.keys(OPTIMIZACIONES).join("|")})`);
  const suma = (plan.conjuntos || []).reduce((s, cj) => s + Number(cj.presupuestoDiario || 0), 0);
  if (plan.topeDiario && suma > plan.topeDiario) errores.push(`suma de presupuestos $${suma}/día > tope $${plan.topeDiario}/día`);
  const minimo = plan.minPorConjunto ?? 10;
  for (const cj of plan.conjuntos || []) {
    if (Number(cj.presupuestoDiario) < minimo) errores.push(`conjunto ${cj.clave}: presupuesto < $${minimo}/día`);
    if (!plan.publicos?.[cj.publico]) errores.push(`conjunto ${cj.clave}: público "${cj.publico}" no definido en plan.publicos`);
    if (!(plan.creativos || []).some((cr) => cr.clave === cj.creativo)) errores.push(`conjunto ${cj.clave}: creativo "${cj.creativo}" no definido`);
  }
  for (const [k, p] of Object.entries(plan.publicos || {})) {
    for (const ref of [...(p.incluir || []), ...(p.excluir || [])]) {
      if (!/^\d+$/.test(String(ref)) && !publicosDisponibles.has(ref)) errores.push(`público ${k}: "${ref}" no está en publicosClave ni es un id`);
    }
    if (!(p.incluir || []).length && !(p.intereses || []).length && !p.advantage && !p.amplio) errores.push(`público ${k}: sin incluir/intereses/advantage → sería todo PR (pon "amplio": true si es a propósito)`);
  }
  for (const cr of plan.creativos || []) {
    if (cr.igMediaId || cr.postId) { if (cr.igMediaId && !plan.igUserId) errores.push(`creativo ${cr.clave}: reel existente sin igUserId en el plan/portafolio`); continue; }
    if (!cr.copy?.textoPrincipal) errores.push(`creativo ${cr.clave}: sin textoPrincipal`);
    if (/\bgratis\b|gratuit/i.test(JSON.stringify(cr.copy || {}))) errores.push(`creativo ${cr.clave}: usa "gratis" (regla dura)`);
    if (/\b(vos|tenés|querés|podés|mirá|dejá)\b/i.test(JSON.stringify(cr.copy || {}))) errores.push(`creativo ${cr.clave}: voseo detectado (tuteo PR obligatorio)`);
  }
  return errores;
}

const resolverRef = (ref, disponibles) => (/^\d+$/.test(String(ref)) ? String(ref) : disponibles.get(ref));

// Árbol que se va a crear (sin red). Sirve para --dry-run y para crear.
export function expandirPlan(plan, { publicosDisponibles = new Map() } = {}) {
  const opt = OPTIMIZACIONES[plan.modo || "leads"];
  const campana = buildCampaignBody({ nombre: plan.nombre, objetivo: plan.objetivo || opt.objetivo });
  const base = plan.targetingBase || {};
  const conjuntos = (plan.conjuntos || []).map((cj) => {
    const pub = plan.publicos[cj.publico];
    const cr = plan.creativos.find((x) => x.clave === cj.creativo);
    const targeting = buildTargeting({
      ...base,
      incluir: (pub.incluir || []).map((r) => resolverRef(r, publicosDisponibles)).filter(Boolean),
      excluir: (pub.excluir || []).map((r) => resolverRef(r, publicosDisponibles)).filter(Boolean),
      intereses: pub.intereses || [],
      comportamientos: pub.comportamientos || [],
      advantage: !!pub.advantage,
    });
    const nombreConjunto = cj.nombre || `${cj.clave} · ${pub.nombre} · ${cr.clave}`;
    return {
      clave: cj.clave,
      adset: buildAdSetBody({ nombre: nombreConjunto, campaignId: "<campaña>", presupuestoDiario: cj.presupuestoDiario, pixelId: plan.pixelId, pageId: plan.pageId, evento: plan.evento || "LEAD", optimizacion: opt.optimizacion, destino: opt.destino, targeting }),
      creativo: {
        clave: cr.clave,
        videoId: cr.videoId || null,
        imagenUrl: cr.imagenUrl || null,
        videoUrl: cr.videoUrl || null,
        existente: cr.igMediaId ? `reel ${cr.igMediaId}` : cr.postId ? `post ${cr.postId}` : null,
        body: (pageId, igUserId, videoId, imageHash, thumbUrl) => (cr.igMediaId || cr.postId) ? buildCreativeExistente({
          nombre: `${plan.nombre} · ${cr.clave}`, pageId, igUserId, igMediaId: cr.igMediaId, postId: cr.postId,
          cta: cr.cta !== undefined ? cr.cta : (opt.optimizacion === "PROFILE_VISIT" ? "VIEW_INSTAGRAM_PROFILE" : opt.optimizacion === "CONVERSATIONS" ? "MESSAGE_PAGE" : opt.optimizacion === "THRUPLAY" ? null : "LEARN_MORE"),
          // VIEW_INSTAGRAM_PROFILE también exige `link` (error 2061015): la URL del perfil.
          link: opt.destino === "WEBSITE" ? plan.landing : opt.destino === "INSTAGRAM_PROFILE" && plan.igHandle ? `https://www.instagram.com/${plan.igHandle}/` : undefined, urlTags: plan.urlTags,
        }) : buildCreativeBody({
          nombre: `${plan.nombre} · ${cr.clave}`, pageId, igUserId, videoId: imageHash ? undefined : videoId, imageHash, thumbUrl: thumbUrl || cr.thumbUrl,
          link: plan.landing, textoPrincipal: cr.copy.textoPrincipal, titulo: cr.copy.titulo, descripcion: cr.copy.descripcion,
          cta: cr.copy.cta || "LEARN_MORE", urlTags: plan.urlTags,
        }),
      },
      ad: { nombre: cj.nombreAnuncio || `${cr.clave}${cr.videoId || cr.igMediaId || cr.postId ? "" : " · ⚠ reemplazar video"} · ${cj.clave}` },
    };
  });
  return { campana, conjuntos };
}

// Crea en Meta (todo PAUSED) y devuelve/actualiza plan.meta con los ids. Idempotente:
// si plan.meta ya tiene el id de un nodo, no lo vuelve a crear.
export async function crearEnMeta(c, plan, { publicosDisponibles = new Map(), videoMarcador, log = console.log, fetchImpl = fetch, dormir } = {}) {
  const errores = validarPlan(plan, { publicosDisponibles });
  if (errores.length) throw new Error("Plan inválido:\n - " + errores.join("\n - "));
  const arbol = expandirPlan(plan, { publicosDisponibles });
  const a = acct(plan.cuentaId);
  plan.meta ||= { campaignId: null, conjuntos: {}, creativos: {}, anuncios: {} };
  if (!plan.meta.campaignId) {
    const j = await c.graph("POST", a + "/campaigns", arbol.campana);
    plan.meta.campaignId = j.id;
    log("campaña creada", j.id);
  }
  for (const n of arbol.conjuntos) {
    if (!plan.meta.conjuntos[n.clave]) {
      const j = await c.graph("POST", a + "/adsets", { ...n.adset, campaign_id: plan.meta.campaignId });
      plan.meta.conjuntos[n.clave] = j.id;
      log("conjunto", n.clave, j.id);
    }
    // Flyers y videos que produjo Max: se suben una vez y se recuerdan en plan.meta.medios (idempotente).
    plan.meta.medios ||= {};
    let videoId = null, imageHash = null, thumbUrl = null;
    if (!n.creativo.existente) {
      if (n.creativo.imagenUrl) {
        imageHash = plan.meta.medios[n.creativo.imagenUrl] ||= await subirImagen(c, plan.cuentaId, n.creativo.imagenUrl, { fetchImpl });
      } else if (n.creativo.videoUrl) {
        const m = (plan.meta.medios[n.creativo.videoUrl] ||= await subirVideo(c, plan.cuentaId, n.creativo.videoUrl, `${plan.nombre} · ${n.creativo.clave}`, dormir ? { dormir } : {}));
        videoId = m.id; thumbUrl = m.thumbUrl;
      } else videoId = n.creativo.videoId || videoMarcador;
    }
    if (!videoId && !imageHash && !n.creativo.existente) throw new Error(`creativo ${n.creativo.clave}: sin videoId ni video marcador en la cuenta`);
    const kCre = `${n.creativo.clave}@${imageHash || videoId || n.creativo.existente}`;
    if (!plan.meta.creativos[kCre]) {
      const j = await c.graph("POST", a + "/adcreatives", n.creativo.body(plan.pageId, plan.igUserId, videoId, imageHash, thumbUrl));
      plan.meta.creativos[kCre] = j.id;
      log("creativo", kCre, j.id);
    }
    if (!plan.meta.anuncios[n.clave]) {
      const j = await c.graph("POST", a + "/ads", buildAdBody({ nombre: n.ad.nombre, adsetId: plan.meta.conjuntos[n.clave], creativeId: plan.meta.creativos[kCre] }));
      plan.meta.anuncios[n.clave] = j.id;
      log("anuncio", n.clave, j.id);
    }
  }
  return plan.meta;
}

// ---------- resultados ----------
const accion = (row, tipo) => Number((row.actions || []).find((x) => x.action_type === tipo)?.value || 0);
const costo = (row, tipo) => Number((row.cost_per_action_type || []).find((x) => x.action_type === tipo)?.value || 0);
export function resumirInsights(rows, { compuertas = {} } = {}) {
  const filas = rows.map((r) => {
    const leads = accion(r, "lead") || accion(r, "offsite_conversion.fb_pixel_lead");
    const cpl = leads ? Number(r.spend) / leads : null;
    return {
      id: r.adset_id || r.ad_id || r.campaign_id,
      nombre: r.adset_name || r.ad_name || r.campaign_name,
      gasto: Number(r.spend || 0), impresiones: Number(r.impressions || 0), alcance: Number(r.reach || 0),
      clics: Number(r.clicks || 0), ctr: Number(r.ctr || 0), ctrUnico: Number(r.unique_ctr || 0), cpc: Number(r.cpc || 0),
      leads, cpl, contact: accion(r, "contact") || accion(r, "offsite_conversion.fb_pixel_contact"),
      costoLead: costo(r, "lead") || null,
      // Tráfico/DM: seguidores (Meta lo reporta con nombres distintos según la cuenta),
      // visitas al perfil, clics al enlace y conversaciones iniciadas.
      seguidores: Number((r.actions || []).find((x) => /follow/i.test(x.action_type))?.value || 0),
      visitasPerfil: accion(r, "profile_visit") || accion(r, "onsite_conversion.ig_profile_visit"),
      clicsEnlace: accion(r, "link_click"),
      conversaciones: accion(r, "onsite_conversion.messaging_conversation_started_7d") || accion(r, "onsite_conversion.total_messaging_connection"),
    };
  });
  for (const f of filas) f.costoSeguidor = f.seguidores ? f.gasto / f.seguidores : null;
  // Ventas por pixel (purchase) y ROAS: "el ROAS mata todo" (Elvin); meta 6-8.
  rows.forEach((r, i) => {
    const f = filas[i];
    f.ventas = accion(r, "purchase") || accion(r, "offsite_conversion.fb_pixel_purchase") || accion(r, "omni_purchase");
    f.ingresos = Number((r.action_values || []).find((x) => /purchase/.test(x.action_type))?.value || 0);
    f.roas = Number((r.purchase_roas || []).find((x) => /purchase/.test(x.action_type))?.value || 0) || (f.ingresos && f.gasto ? f.ingresos / f.gasto : null);
    f.frecuencia = Number(r.frequency || 0);
  });
  const cpls = filas.map((f) => f.cpl).filter((x) => x != null).sort((a, b) => a - b);
  const mediana = cpls.length ? cpls[Math.floor(cpls.length / 2)] : null;
  for (const f of filas) {
    const razones = [];
    if (f.gasto >= 20 && f.leads === 0) razones.push("sin leads con ≥$20 gastados");
    if (f.cpl != null && mediana && f.cpl > 2 * mediana) razones.push(`CPL ${f.cpl.toFixed(2)} > 2× mediana ${mediana.toFixed(2)}`);
    if (f.cpl != null && compuertas.cplMax && f.cpl > compuertas.cplMax) razones.push(`CPL > tope $${compuertas.cplMax}`);
    if (f.impresiones >= 1000 && compuertas.ctrMin && f.ctr < compuertas.ctrMin) razones.push(`CTR ${f.ctr.toFixed(2)}% < ${compuertas.ctrMin}%`);
    if (f.costoSeguidor != null && compuertas.costoPorSeguidorMax && f.gasto >= 10 && f.costoSeguidor > 2 * compuertas.costoPorSeguidorMax) razones.push(`$${f.costoSeguidor.toFixed(2)}/seguidor > 2× meta $${compuertas.costoPorSeguidorMax}`);
    // Señales de ESCALAR (el trabajo del media buyer): gana en su métrica, engancha (CTR ≥ 2%) y ya tiene
    // gasto suficiente para que el dato sea real. Subir 10-20 % o duplicar a público nuevo; nunca de golpe.
    const engancha = f.ctr >= (compuertas.ctrEscalar ?? 2);
    const escalar = [];
    if (f.roas && f.roas >= (compuertas.roasMeta ?? 6)) escalar.push(`ROAS ${f.roas.toFixed(1)}x ≥ meta ${compuertas.roasMeta ?? 6}x`);
    if (f.cpl != null && compuertas.cplMax && f.cpl <= 0.7 * compuertas.cplMax && f.leads >= 5 && engancha) escalar.push(`CPL $${f.cpl.toFixed(2)} ≤ 70 % del tope con ${f.leads} leads`);
    if (f.costoSeguidor != null && compuertas.costoPorSeguidorMax && f.costoSeguidor <= 0.7 * compuertas.costoPorSeguidorMax && f.gasto >= 20 && engancha) escalar.push(`$${f.costoSeguidor.toFixed(2)}/seguidor ≤ 70 % de la meta con $${f.gasto.toFixed(0)} gastados`);
    if (f.frecuencia >= (compuertas.frecuenciaMax ?? 2.5) && f.gasto >= 20) razones.push(`frecuencia ${f.frecuencia.toFixed(1)} (quemado: renovar creativo)`);
    if (f.impresiones >= 1000 && f.ctr < 2 && !razones.length) f.aviso = `CTR ${f.ctr.toFixed(2)}% < 2 %: el anuncio no engancha, revisar gancho/creativo`;
    f.recomendacion = razones.length ? "pausar: " + razones.join("; ")
      : escalar.length ? "ESCALAR +10-20 %: " + escalar.join("; ")
      : (f.cpl != null && mediana && f.cpl <= mediana ? "ganador: duplicar a públicos nuevos" : "seguir");
  }
  const gastoTotal = filas.reduce((s, f) => s + f.gasto, 0), ingresosTotal = filas.reduce((s, f) => s + (f.ingresos || 0), 0);
  return { filas, mediana, gastoTotal, leadsTotal: filas.reduce((s, f) => s + f.leads, 0), ventasTotal: filas.reduce((s, f) => s + (f.ventas || 0), 0), ingresosTotal, roasTotal: gastoTotal && ingresosTotal ? ingresosTotal / gastoTotal : null,
    escalar: filas.filter((f) => /^ESCALAR/.test(f.recomendacion)), pausar: filas.filter((f) => /^pausar/.test(f.recomendacion)) };
}
