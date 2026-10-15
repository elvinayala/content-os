// Revisión de cuentas de clientes de Level Up (Max · Elvin) — reglas puras. v2: 15/oct/2026.
//
// Elvin (15/oct): "Clientes con acuerdo de $3,000 o más se revisan dos veces al mes (aunque el pago inicial sea menor,
// también los de menos de $1,500); los de acuerdos menores, una vez al mes. El resumen al estratega tiene que ser
// claro: primero los creativos con costos más elevados comparados con el CTR — costo alto y CTR bajo = reemplazar, lo
// más urgente posible. Un anuncio a menos de $1 se pide escalar; a $2 con CTR alto se puede ver para escalar (vertical,
// horizontal o surf, que es cuando está muy por debajo: menos de 99 centavos; el trafficker escoge). Identificar si no
// tiene la estrategia completa: 8 a 12 campañas — Fase 1: tráfico al perfil de Instagram + reconocimiento ThruPlay;
// Fase 2: ventas (WhatsApp/mensajes, landing o tienda), 3 a 4 campañas (video, flyers, carrusel o flexible); Fase 3:
// remarketing a tibios y calientes, mínimo 2 (video + flyers o carrusel); Fase 4: ThruPlay a 365 días; Fase 5: escalar.
// Frecuencia no más de 1.8. Fácil de leer, con espacios y pocos emojis; el estratega marca ejecutado o explica por qué no."
//
// Lo usan scripts/revision-clientes.mjs (datos de Pulse por /api/max + Marketing API) y, para el seguimiento en Ritmo,
// las acciones que devuelve `acciones()`. Tests en tests/revision-clientes.test.mjs. CTR = CTR único de Meta (unique_ctr).

export const PERIODOS = [
  { clave: "maximo", preset: "maximum", nombre: "Máx" },
  { clave: "mes", preset: "last_30d", nombre: "Mes" },
  { clave: "semana", preset: "last_7d", nombre: "7 días" },
  { clave: "hoy", preset: "today", nombre: "Hoy" },
];

export const UMBRAL = {
  ctr: 2, // CTR único < 2 % = no engancha → rotar / reemplazar
  ctrAlto: 3, // "CTR alto" para ver si se escala algo de ~$2
  frecuencia: 1.8,
  acuerdoAlto: 3000, // acuerdo ≥ $3,000 → dos veces al mes (cualquier pago inicial)
  costoAlto: 1.5, // ≥ 1.5× la mediana de la cuenta = caro
  conversacionCara: 3, // y, si se mide en conversaciones, al menos $3 (a $2 todavía es bueno)
  escalar: 1, // conversación a menos de $1 → pedir escalar (surf, vertical u horizontal)
  evaluar: 2, // hasta $2 con CTR alto → evaluar escalar
  minResultados: 5,
  minImpresiones: 1000,
  minGasto: 15,
  campanasMin: 8,
  campanasMax: 12,
};

const n = (x) => Number(x || 0);
export const usd = (x, dec = 2) => (x == null ? "—" : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }));
const usd0 = (x) => usd(x, 0);
const pct = (x) => (x == null ? "—" : `${(Math.floor(Number(x) * 10) / 10).toFixed(1)} %`); // 1.99 → "1.9 %", nunca "2.0 %" si está debajo
const entero = (x) => Number(x || 0).toLocaleString("en-US");
const corto = (s, max = 34) => (String(s).length > max ? String(s).slice(0, max - 1).trimEnd() + "…" : String(s));

// ---------- quién y cada cuánto ----------

// "3000 x 90 dias" → 3000 · "3.500 X 90 DIAS" → 3500 · "$2100 x 90 dias" → 2100 · "1.200 mes a mes" → 1200 al mes ·
// "500 MES A MES X 6 MESES" → 500 al mes · "4500 x 6 MESES - 750 MES A MES" → 4500.
export function leerAcuerdo(texto) {
  const t = String(texto ?? "").trim();
  const m = t.match(/\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{1,2}(?!\d))?/);
  if (!m) return null;
  const monto = Number(m[1].replace(/[.,]/g, ""));
  if (!(monto > 0)) return null;
  const resto = t.slice(m.index + m[0].length);
  return { monto, mensual: /^\s*(usd|d[oó]lares)?\s*(mes a mes|mensual|al mes|\/\s*mes)/i.test(resto) };
}

// Dos veces al mes: acuerdo de $3,000 o más, sea cual sea el pago inicial (Elvin, 15/oct: "sí, también dos veces al mes"
// los que pagaron menos de $1,500 de entrada). Acuerdos menores: una vez al mes.
export function cadencia({ acuerdo, pagoInicial } = {}) {
  const a = leerAcuerdo(acuerdo);
  const pago = n(pagoInicial);
  const desc = a ? (a.mensual ? `${usd0(a.monto)} al mes` : `acuerdo de ${usd0(a.monto)}`) : "sin acuerdo en Pulse";
  const conPago = pago ? `${desc} · pago inicial ${usd0(pago)}` : desc;
  return a && a.monto >= UMBRAL.acuerdoAlto ? { dias: 15, motivo: conPago } : { dias: 30, motivo: conPago };
}

export function sumarDias(dia, dias) {
  const d = new Date(dia + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
export const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 86_400_000);

// Los que tocan hoy: vencidos primero (más días de atraso arriba), después los que nunca se han revisado (acuerdo
// más grande primero). Tope por día; el resto sigue en la fila mañana.
export function pendientesHoy(clientes, estado, hoy, { porDia = 8 } = {}) {
  const fila = [];
  for (const c of clientes) {
    const cad = cadencia(c);
    const ultima = estado?.[c.itemId]?.ultima || null;
    const vence = ultima ? sumarDias(ultima, cad.dias) : null;
    if (vence && vence > hoy) continue;
    fila.push({ ...c, cadencia: cad, ultima, atraso: vence ? diasEntre(vence, hoy) : null, peso: Math.max(leerAcuerdo(c.acuerdo)?.monto || 0, n(c.pagoInicial)) });
  }
  fila.sort((a, b) => (b.atraso ?? -1) - (a.atraso ?? -1) || b.peso - a.peso || String(a.nombre).localeCompare(String(b.nombre)));
  return { hoy: fila.slice(0, porDia), enFila: Math.max(0, fila.length - porDia) };
}

// ---------- lectura de Meta ----------

const TIPOS = [
  [/messaging_conversation_started|messaging_connection|messaging_first_reply|conversation/, "conversación", "conversaciones"],
  [/schedule|appointment/, "cita", "citas"],
  [/purchase/, "compra", "compras"],
  [/lead/, "lead", "leads"],
  [/landing_page_view/, "visita a la web", "visitas a la web"],
  [/link_click/, "clic", "clics"],
  [/follow/, "seguidor", "seguidores"],
  [/profile_visit/, "visita al perfil", "visitas al perfil"],
  [/thruplay/, "ThruPlay", "ThruPlays"],
  [/page_like|\blike\b/, "me gusta", "me gusta"],
  [/contact/, "contacto", "contactos"],
  [/post_engagement|engagement/, "interacción", "interacciones"],
  [/reach/, "persona alcanzada", "personas alcanzadas"],
];
export function tipoResultado(indicador) {
  const i = String(indicador || "").toLowerCase();
  if (!i) return null;
  for (const [re, uno, varios] of TIPOS) if (re.test(i)) return { clave: uno, uno, varios };
  const cola = i.split(/[:.]/).pop().replace(/_/g, " ");
  return { clave: cola, uno: cola, varios: cola };
}

// El resultado de una fila de insights (campo `results` de Meta): tipo + cantidad.
export function resultadoDe(fila) {
  const r = (fila?.results || []).find((x) => x?.indicator) || null;
  return { tipo: tipoResultado(r?.indicator), cantidad: n(r?.values?.[0]?.value) };
}

const limpiarNombre = (s) => String(s || "").replace(/(\s*[-–—]\s*(copia|copy)(\s*\d+)?)+\s*$/i, "").trim() || "sin nombre";

// La unidad de Elvin es el CREATIVO, no la campaña: el mismo flyer/video duplicado en 3 conjuntos es uno solo.
export function claveCreativo(ad) {
  const c = ad?.creative || {};
  const id = c.video_id || c.image_hash || c.effective_instagram_media_id || c.effective_object_story_id || c.id;
  return id ? String(id) : "ad:" + (ad?.id || "?");
}
export function tipoCreativo(ad) {
  const c = ad?.creative || {};
  if (c.object_story_spec?.link_data?.child_attachments?.length || /carrusel|carousel/i.test(ad?.name || "")) return "carrusel";
  if (c.asset_feed_spec) return "flexible";
  if (c.video_id || /VIDEO/i.test(c.object_type || "")) return "video";
  if (c.image_hash || c.image_url || /PHOTO|IMAGE/i.test(c.object_type || "")) return "flyer";
  if (/video|reel/i.test(ad?.name || "")) return "video"; // post existente: Meta no dice el formato, el nombre sí
  if (/flyer|imagen|foto|arte/i.test(ad?.name || "")) return "flyer";
  return "anuncio";
}
const NOMBRE_FORMATO = { video: "Video", flyer: "Flyer", carrusel: "Carrusel", flexible: "Flexible", anuncio: "Anuncio" };

// Agrupa las filas por anuncio (level=ad) en creativos. CTR único y frecuencia del creativo = sumados sobre sus
// anuncios (clics únicos ÷ alcance, impresiones ÷ alcance): exactos si corre en un solo conjunto, promedio si en varios.
export function agruparCreativos(filas, anunciosPorId, { porResultado = true } = {}) {
  const g = new Map(), alias = new Map();
  for (const f of filas || []) {
    const ad = anunciosPorId.get(String(f.ad_id)) || { id: f.ad_id, name: f.ad_name };
    const { tipo, cantidad } = resultadoDe(f);
    // El mismo video/flyer publicado como post en Facebook y en Instagram trae ids distintos: si coinciden nombre,
    // día de creación y formato, es el mismo creativo.
    const gemelo = `${limpiarNombre(f.ad_name || ad.name)}|${String(ad.created_time || "").slice(0, 10)}|${tipoCreativo(ad)}${porResultado ? "|" + (tipo?.clave || "-") : ""}`;
    const clave = alias.get(gemelo) || (porResultado ? `${claveCreativo(ad)}|${tipo?.clave || "-"}` : claveCreativo(ad));
    if (ad.created_time) alias.set(gemelo, clave);
    const x = g.get(clave) || { clave, nombre: limpiarNombre(f.ad_name || ad.name), formato: tipoCreativo(ad), resultado: tipo, gasto: 0, impresiones: 0, alcance: 0, clicsUnicos: 0, cantidad: 0, anuncios: new Set(), conjuntos: new Map(), activo: false, desde: null };
    x.gasto += n(f.spend);
    x.impresiones += n(f.impressions);
    x.alcance += n(f.reach);
    x.clicsUnicos += n(f.unique_clicks) || (n(f.unique_ctr) * n(f.reach)) / 100;
    x.cantidad += cantidad;
    x.anuncios.add(String(f.ad_id));
    if (f.adset_id) x.conjuntos.set(String(f.adset_id), f.adset_name || String(f.adset_id));
    if (ad.effective_status === "ACTIVE") x.activo = true;
    const creado = String(ad.created_time || "").slice(0, 10);
    if (creado && (!x.desde || creado < x.desde)) x.desde = creado;
    if (!x.resultado && tipo) x.resultado = tipo;
    g.set(clave, x);
  }
  return [...g.values()].map((x) => ({
    ...x,
    anuncios: [...x.anuncios],
    conjuntos: [...x.conjuntos].map(([id, nombre]) => ({ id, nombre })),
    ctr: x.alcance ? (x.clicsUnicos / x.alcance) * 100 : null,
    frecuencia: x.alcance ? x.impresiones / x.alcance : null,
    costo: x.cantidad ? x.gasto / x.cantidad : null,
  }));
}

const mediana = (xs) => {
  const v = xs.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

// Resumen de un periodo: la fila de la cuenta (gasto, CTR único, frecuencia exactos) + resultados por tipo (suma de anuncios).
export function resumenPeriodo(p) {
  const cuenta = p?.cuenta || null;
  const porTipo = new Map();
  for (const f of p?.filas || []) {
    const { tipo, cantidad } = resultadoDe(f);
    if (!tipo) continue;
    const x = porTipo.get(tipo.clave) || { tipo, cantidad: 0, gasto: 0 };
    x.cantidad += cantidad;
    x.gasto += n(f.spend);
    porTipo.set(tipo.clave, x);
  }
  const resultados = [...porTipo.values()].sort((a, b) => b.gasto - a.gasto).map((x) => ({ ...x, costo: x.cantidad ? x.gasto / x.cantidad : null }));
  const gasto = cuenta ? n(cuenta.spend) : (p?.filas || []).reduce((s, f) => s + n(f.spend), 0);
  return { gasto, impresiones: n(cuenta?.impressions), ctr: cuenta?.unique_ctr != null ? n(cuenta.unique_ctr) : null, frecuencia: cuenta?.frequency != null ? n(cuenta.frequency) : null, resultados };
}

// ---------- la estrategia de 5 fases (estructura de campañas) ----------

const OPT_VENTAS = /CONVERSATIONS|REPLIES|OFFSITE_CONVERSIONS|LEAD_GENERATION|QUALITY_LEAD|VALUE|CONVERSIONS|MESSAGING/;
// Fase de una campaña activa: el nombre manda ("FASE 2 / VENTAS WHATSAPP…", así las nombra el equipo); si no lo dice,
// el objetivo, la optimización de sus conjuntos y si apunta a públicos personalizados (tibios/calientes).
export function faseDe(camp, conjuntos = []) {
  const nom = String(camp?.name || "");
  const opt = conjuntos.map((s) => `${s.optimization_goal || ""}/${s.destination_type || ""}`).join(" ");
  const conPublico = conjuntos.some((s) => (s.targeting?.custom_audiences || []).some((a) => !/semelhante|similar|lookalike|\bLAL\b/i.test(a.name || "")));
  const thru = /THRUPLAY|REACH|VIDEO_VIEWS/.test(opt) || /thruplay|reconocimiento|alcance|envolver/i.test(nom);
  const trafico = /PROFILE_VISIT|INSTAGRAM_PROFILE/.test(opt) || /tr[aá]fico|tr[aá]fego|perfil|seguidores|follow/i.test(nom);
  const f = nom.match(/fase\s*([1-5])/i);
  if (f) {
    const fase = Number(f[1]);
    if (fase === 1) return { fase, tipo: trafico && !/thruplay|reconocimiento/i.test(nom) ? "trafico" : thru ? "thruplay" : "trafico" };
    return { fase, tipo: fase === 4 ? "thruplay" : fase === 5 ? "escalar" : "ventas" };
  }
  if (/rmkt|remarketing|retarget/i.test(nom)) return { fase: thru ? 4 : 3, tipo: thru ? "thruplay" : "ventas" };
  if (thru) return conPublico ? { fase: 4, tipo: "thruplay" } : { fase: 1, tipo: "thruplay" };
  if (trafico) return { fase: 1, tipo: "trafico" };
  if (OPT_VENTAS.test(opt) || /OUTCOME_SALES|OUTCOME_LEADS|OUTCOME_ENGAGEMENT/.test(camp?.objective || "")) return { fase: conPublico ? 3 : 2, tipo: "ventas" };
  return { fase: 0, tipo: "otra" };
}

// Qué le falta a la cuenta para tener la estrategia completa (8 a 12 campañas activas).
export function estructura(campanas, conjuntos, anuncios) {
  const porCamp = (id, xs) => xs.filter((x) => String(x.campaign_id) === String(id));
  const filas = (campanas || []).map((c) => {
    const f = faseDe(c, porCamp(c.id, conjuntos || []));
    const formatos = new Set(porCamp(c.id, anuncios || []).filter((a) => a.effective_status === "ACTIVE").map(tipoCreativo));
    if (/video/i.test(c.name)) formatos.add("video");
    if (/flyer/i.test(c.name)) formatos.add("flyer");
    if (/carrusel|carousel/i.test(c.name)) formatos.add("carrusel");
    if (/flexible|din[aá]mic/i.test(c.name)) formatos.add("flexible");
    return { ...f, nombre: c.name, formatos };
  });
  const de = (fase, tipo) => filas.filter((x) => x.fase === fase && (!tipo || x.tipo === tipo));
  const formatosDe = (xs) => new Set(xs.flatMap((x) => [...x.formatos]));
  const falta = [];
  if (!de(1, "trafico").length) falta.push("Fase 1 · tráfico al perfil de Instagram");
  if (!de(1, "thruplay").length) falta.push("Fase 1 · reconocimiento ThruPlay");
  const f2 = de(2), f2f = formatosDe(f2);
  if (f2.length < 3) falta.push(`Fase 2 · ventas: ${f2.length} de 3-4 campañas`);
  const f2falta = [!f2f.has("video") && "video", !f2f.has("flyer") && "flyers", !f2f.has("carrusel") && !f2f.has("flexible") && "carrusel o flexible"].filter(Boolean);
  if (f2.length && f2falta.length) falta.push(`Fase 2 · falta de ${f2falta.join(", ")}`);
  const f3 = de(3), f3f = formatosDe(f3);
  if (f3.length < 2) falta.push(`Fase 3 · remarketing: ${f3.length} de 2 (video + flyers o carrusel)`);
  else if (!f3f.has("video") || !(f3f.has("flyer") || f3f.has("carrusel"))) falta.push(`Fase 3 · remarketing sin ${!f3f.has("video") ? "video" : "flyers ni carrusel"}`);
  if (!de(4).length) falta.push("Fase 4 · ThruPlay a público de 365 días");
  const fuera = filas.filter((x) => x.fase === 0).length;
  return { total: filas.length, porFase: [1, 2, 3, 4, 5].map((f) => de(f).length), fuera, falta, sobran: filas.length > UMBRAL.campanasMax, completa: !falta.length };
}

// ---------- el análisis (método de Elvin) ----------

export function analizar({ periodos, anuncios, campanas, conjuntos, hoy = new Date().toISOString().slice(0, 10) }) {
  const porId = new Map((anuncios || []).map((a) => [String(a.id), a]));
  const costos = Object.fromEntries(PERIODOS.map((p) => [p.clave, resumenPeriodo(periodos?.[p.clave])]));
  const principal = costos.maximo.resultados[0]?.tipo || costos.mes.resultados[0]?.tipo || null;
  const conv = principal?.clave === "conversación";
  const delPrincipal = (cs) => cs.filter((c) => principal && c.resultado?.clave === principal.clave);

  const cMax = agruparCreativos(periodos?.maximo?.filas, porId);
  const cMes = agruparCreativos(periodos?.mes?.filas, porId);
  const cSem = agruparCreativos(periodos?.semana?.filas, porId);
  const semDe = new Map(cSem.map((c) => [c.clave, c]));
  const medMes = mediana(delPrincipal(cMes).filter((c) => c.cantidad >= 3).map((c) => c.costo)) ?? mediana(delPrincipal(cMax).filter((c) => c.cantidad >= 3).map((c) => c.costo));
  // CTR por creativo (sin separar por objetivo: el gancho es del creativo).
  const ctrMes = new Map(agruparCreativos(periodos?.mes?.filas, porId, { porResultado: false }).map((c) => [c.clave, c]));
  const ctrSem = new Map(agruparCreativos(periodos?.semana?.filas, porId, { porResultado: false }).map((c) => [c.clave, c]));
  const base = (c) => c.clave.split("|")[0];

  // 1) Costo alto vs. CTR (último mes, solo lo que está prendido). Costo alto + CTR bajo = reemplazar YA.
  const caro = (c) => c.gasto >= UMBRAL.minGasto && (c.cantidad === 0 || (medMes != null && c.costo >= UMBRAL.costoAlto * medMes && (!conv || c.costo >= UMBRAL.conversacionCara)));
  const problemas = [];
  const vistos = new Set();
  for (const c of delPrincipal(cMes)) {
    if (!c.activo || !caro(c)) continue;
    const ctr = ctrMes.get(base(c))?.ctr ?? c.ctr;
    problemas.push({ ...c, ctr, nivel: ctr != null && ctr < UMBRAL.ctr ? "urgente" : "costo" });
    vistos.add(base(c));
  }
  // 2) CTR bajo de 2 % aunque el costo no sea alto (o que cayó bajo 2 % esta semana) → rotar.
  for (const c of ctrMes.values()) {
    if (!c.activo || vistos.has(c.clave) || c.impresiones < UMBRAL.minImpresiones || c.ctr == null) continue;
    const s = ctrSem.get(c.clave);
    const sem = s && s.impresiones >= 500 && s.ctr != null ? s.ctr : null;
    if (c.ctr < UMBRAL.ctr || (sem != null && sem < UMBRAL.ctr)) problemas.push({ ...c, ctr: sem != null && sem < c.ctr ? sem : c.ctr, nivel: "ctr" });
  }
  const orden = { urgente: 0, costo: 1, ctr: 2 };
  problemas.sort((a, b) => orden[a.nivel] - orden[b.nivel] || b.gasto - a.gasto);

  // 3) Escalar. Conversaciones: < $1 → pedir escalar (surf, vertical u horizontal); hasta $2 con CTR alto → evaluar.
  // Otros objetivos: barato vs. la mediana de la cuenta. Siempre: activo, con volumen, engancha y sigue bien esta semana.
  const escalar = [];
  for (const c of delPrincipal(cMes)) {
    if (!c.activo || c.cantidad < UMBRAL.minResultados || c.costo == null || vistos.has(base(c))) continue;
    const ctr = ctrMes.get(base(c))?.ctr ?? c.ctr ?? 0;
    const s = semDe.get(c.clave);
    const tope = conv ? UMBRAL.evaluar : medMes ?? 0;
    if (s && s.cantidad > 0 && s.costo > tope * 1.2) continue; // esta semana ya no está tan bien
    let nivel = null;
    if (conv) nivel = c.costo < UMBRAL.escalar && ctr >= UMBRAL.ctr ? "escalar" : c.costo <= UMBRAL.evaluar && ctr >= UMBRAL.ctrAlto ? "evaluar" : null;
    else if (medMes != null) nivel = c.costo <= medMes * 0.6 && ctr >= UMBRAL.ctr ? "escalar" : c.costo <= medMes && ctr >= UMBRAL.ctrAlto ? "evaluar" : null;
    if (nivel) escalar.push({ ...c, ctr, nivel, dias: c.desde ? diasEntre(c.desde, hoy) : null });
  }
  escalar.sort((a, b) => (a.nivel === b.nivel ? a.costo - b.costo : a.nivel === "escalar" ? -1 : 1));

  // 4) Frecuencia > 1.8 en el último mes, por anuncio activo (la frecuencia es de SU público).
  const frecuencia = (periodos?.mes?.filas || [])
    .filter((f) => porId.get(String(f.ad_id))?.effective_status === "ACTIVE" && n(f.frequency) > UMBRAL.frecuencia && n(f.spend) >= 5)
    .map((f) => ({ nombre: limpiarNombre(f.ad_name), conjunto: f.adset_name || "", frecuencia: n(f.frequency) }))
    .sort((a, b) => b.frecuencia - a.frecuencia);

  // Dos creativos distintos con el mismo nombre ("CREATIVO #2"): se distinguen por el día en que se crearon.
  const nombres = new Map();
  for (const c of [...cMax, ...cMes]) { const s = nombres.get(c.nombre) || new Set(); s.add(base(c)); nombres.set(c.nombre, s); }
  const distinguir = (c) => ((nombres.get(c.nombre)?.size ?? 0) > 1 && c.desde ? { ...c, etiqueta: `${corto(c.nombre, 28)} · del ${fecha(c.desde)}` } : c);

  const activos = (anuncios || []).filter((a) => a.effective_status === "ACTIVE");
  const est = campanas ? estructura(campanas, conjuntos, anuncios) : null;
  const a = { costos, principal, conv, mediana: medMes, problemas: problemas.map(distinguir), escalar: escalar.map(distinguir), frecuencia, estructura: est, activos: activos.length, sinGastoHoy: activos.length > 0 && !costos.hoy.gasto, sinGastoMes: !costos.mes.gasto };
  a.estado = estadoCuenta(a);
  return a;
}

// "Cuenta no optimizada" (Elvin: "para no ser tan drástico") si hay algo que corregir; si solo hay para escalar, es una
// oportunidad; si nada, está al día.
export function estadoCuenta(a) {
  if (a.sinGastoMes) return "sin-gasto";
  if (a.problemas.length || a.frecuencia.length || (a.estructura && !a.estructura.completa) || a.sinGastoHoy) return "no-optimizada";
  if (a.escalar.length) return "escalar";
  return "optimizada";
}
export const ETIQUETA_ESTADO = { "no-optimizada": "⚠️ *Cuenta no optimizada*", escalar: "✅ *Optimizada · hay para escalar*", optimizada: "✅ *Optimizada*", "sin-gasto": "⏸️ *Sin gasto en el último mes*" };

// ---------- lo que el estratega tiene que marcar en Ritmo ----------

const nombreCreativo = (c) => `${NOMBRE_FORMATO[c.formato] || "Anuncio"} "${c.etiqueta || corto(c.nombre, 40)}"`; // la etiqueta ya viene corta
const fecha = (d) => (d ? `${Number(d.slice(8, 10))}/${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][Number(d.slice(5, 7)) - 1]}` : "");

// Cada punto del resumen es una acción con id estable (así se marca ejecutada o se explica por qué no).
export function acciones(a) {
  if (!a) return [];
  const out = [];
  const costo = (c) => (c.cantidad ? `${usd(c.costo)} c/u` : `${usd0(c.gasto)} sin ${a.principal?.varios || "resultados"}`);
  if (a.sinGastoHoy) out.push({ id: "sin-gasto-hoy", tipo: "entrega", prioridad: 1, texto: "Revisar por qué no ha gastado hoy (pago, saldo o entrega)" });
  for (const c of a.problemas.slice(0, 4)) {
    const k = c.clave.split("|")[0];
    if (c.nivel === "urgente") out.push({ id: `reemplazar:${k}`, tipo: "reemplazar", prioridad: 1, texto: `Reemplazar ${nombreCreativo(c)} · ${costo(c)} · CTR ${pct(c.ctr)}` });
    else if (c.nivel === "costo") out.push({ id: `costo:${k}`, tipo: "costo", prioridad: 2, texto: `Revisar oferta o gancho de ${nombreCreativo(c)} · ${costo(c)} · CTR ${pct(c.ctr)}` });
    else out.push({ id: `rotar:${k}`, tipo: "rotar", prioridad: 2, texto: `Rotar ${nombreCreativo(c)} · CTR ${pct(c.ctr)}` });
  }
  for (const c of a.escalar.slice(0, 3)) {
    const k = c.clave.split("|")[0];
    out.push(c.nivel === "escalar"
      ? { id: `escalar:${k}`, tipo: "escalar", prioridad: 2, texto: `Escalar ${nombreCreativo(c)} · ${usd(c.costo)} c/u · CTR ${pct(c.ctr)} → ${c.costo < 0.99 ? "surf, vertical u horizontal" : "vertical u horizontal"}` }
      : { id: `evaluar:${k}`, tipo: "evaluar", prioridad: 3, texto: `Evaluar escalar ${nombreCreativo(c)} · ${usd(c.costo)} c/u · CTR ${pct(c.ctr)}` });
  }
  for (const f of a.estructura?.falta || []) out.push({ id: `estructura:${f.split(":")[0]}`, tipo: "estructura", prioridad: 2, texto: `Montar ${f}` });
  if (a.estructura?.sobran) out.push({ id: "estructura:sobran", tipo: "estructura", prioridad: 3, texto: `Consolidar: ${a.estructura.total} campañas activas (lo ideal es ${UMBRAL.campanasMin}-${UMBRAL.campanasMax})` });
  if (a.frecuencia.length) out.push({ id: "frecuencia", tipo: "frecuencia", prioridad: 3, texto: `Bajar la frecuencia (> ${UMBRAL.frecuencia}) en ${a.frecuencia.length === 1 ? "1 anuncio" : `${a.frecuencia.length} anuncios`}: rotar el creativo o abrir el público` });
  return out;
}

// ---------- el texto: corto, con espacios y pocos emojis (Slack y Telegram: *negrita*) ----------

export function textoReporte(cliente, a, { error, ritmo } = {}) {
  const cad = cliente.cadencia || cadencia(cliente);
  const L = [
    `📋 *${cliente.empresa || cliente.nombre}*${cliente.empresa && cliente.nombre && cliente.empresa !== cliente.nombre ? ` · ${cliente.nombre}` : ""}`,
    `Revisión ${cad.dias === 15 ? "dos veces al mes" : "mensual"} · ${cliente.estratega ? `Estratega: ${cliente.estratega}` : "sin estratega asignado"}`,
  ];
  if (!cliente.cuentaId) return [...L, "", "⚠️ No tiene el ID de la cuenta publicitaria en Pulse. Hay que ponerlo en la ficha."].join("\n");
  if (error) return [...L, "", `⚠️ No pude leer la cuenta ${cliente.cuentaId}: ${error}`].join("\n");
  L.push(ETIQUETA_ESTADO[a.estado] || "");
  if (a.estado === "sin-gasto") return [...L, "", "No ha gastado en el último mes: confirmar si sigue activo o si hay un problema de pago."].join("\n");

  const r = (p) => (a.principal ? a.costos[p].resultados.find((x) => x.tipo.clave === a.principal.clave) : null);
  L.push("", `💰 *Costo por ${a.principal?.uno || "resultado"}*`);
  L.push(PERIODOS.map((p) => `${p.nombre} ${r(p.clave)?.costo != null ? usd(r(p.clave).costo) : "—"}`).join(" · "));
  const mes = r("mes");
  L.push(`Mes: ${usd0(a.costos.mes.gasto)}${mes ? ` en ${entero(mes.cantidad)} ${mes.tipo.varios}` : ""}`);

  const lista = (titulo, xs, linea) => { if (xs.length) L.push("", titulo, ...xs.slice(0, 3).map(linea)); };
  const costo = (c) => (c.cantidad ? `${usd(c.costo)}` : `${usd0(c.gasto)} sin ${a.principal?.varios || "resultados"}`);
  lista("🔴 *Reemplazar ya* (costo alto y CTR bajo)", a.problemas.filter((c) => c.nivel === "urgente"), (c) => `• ${nombreCreativo(c)} · ${costo(c)} · CTR ${pct(c.ctr)}`);
  lista("🟠 *Costo alto* (el CTR está bien: revisar oferta o gancho)", a.problemas.filter((c) => c.nivel === "costo"), (c) => `• ${nombreCreativo(c)} · ${costo(c)} · CTR ${pct(c.ctr)}`);
  lista("🟡 *CTR bajo de 2 %* (rotar)", a.problemas.filter((c) => c.nivel === "ctr"), (c) => `• ${nombreCreativo(c)} · CTR ${pct(c.ctr)}`);
  lista("🚀 *Escalar*", a.escalar, (c) => `• ${nombreCreativo(c)} · ${usd(c.costo)} · CTR ${pct(c.ctr)} → ${c.nivel === "escalar" ? (c.costo < 0.99 ? "surf, vertical u horizontal" : "vertical u horizontal") : "evaluar"}${c.dias != null && c.dias < 10 ? ` (lleva ${c.dias} días)` : ""}`);

  const e = a.estructura;
  if (e) {
    L.push("", e.completa && !e.sobran ? `📐 *Estrategia completa* · ${e.total} campañas` : `📐 *Estrategia* · ${e.total} campañas activas (lo ideal: ${UMBRAL.campanasMin} a ${UMBRAL.campanasMax})`);
    for (const f of e.falta.slice(0, 4)) L.push(`• Falta ${f}`);
    if (e.sobran) L.push(`• Sobran campañas${e.fuera ? ` (${e.fuera} fuera de las 5 fases)` : ""}: consolidar`);
  }
  if (a.frecuencia.length) L.push("", `🔁 *Frecuencia > ${UMBRAL.frecuencia}* en ${a.frecuencia.length === 1 ? "1 anuncio" : `${a.frecuencia.length} anuncios`} → rotar o abrir público`);
  if (a.sinGastoHoy) L.push("", "⏸️ Hoy no ha gastado con anuncios prendidos: revisar pago o entrega.");
  if (acciones(a).length && ritmo) L.push("", `👉 Marca cada punto en Ritmo: *Ejecutado*, o por qué no. ${ritmo}`);
  return L.join("\n");
}
