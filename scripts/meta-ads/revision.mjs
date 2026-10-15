// Revisión de clientes de Level Up para Elvin (15/oct/2026) — reglas puras.
//
// Elvin: "clientes activos con acuerdos de $3,000+ los reviso cada 15 días, y los que pagan $1,500 o más de una;
// clientes con paquetes pequeños, cada 30 días. En la revisión analizo siempre primero los costos en máximo, luego en
// 1 mes, luego 7 días y luego hoy. Ver qué ha funcionado, qué tiene costos elevados para ir optimizando desde el
// creativo, no desde la campaña. También qué anuncios escalar. Luego revisar flyers y videos: su CTR, a ver si están
// arriba de 2 %; si están abajo, solicitar cambiarlos y rotarlos. También la frecuencia, no más de 1.8."
//
// Lo usa scripts/revision-clientes.mjs (datos de Pulse por /api/max + Marketing API); tests en
// tests/revision-clientes.test.mjs. CTR = CTR único (unique_ctr de Meta, "CTR único (todos)" en el Ads Manager).

export const PERIODOS = [
  { clave: "maximo", preset: "maximum", nombre: "Máximo" },
  { clave: "mes", preset: "last_30d", nombre: "Último mes" },
  { clave: "semana", preset: "last_7d", nombre: "7 días" },
  { clave: "hoy", preset: "today", nombre: "Hoy" },
];

export const UMBRAL = {
  ctr: 2, // CTR único < 2 % → cambiar y rotar el creativo
  frecuencia: 1.8, // más de 1.8 en el último mes → rotar o abrir público
  acuerdoAlto: 3000, // acuerdo ≥ $3,000 → cada 15 días
  pagoDeUna: 1500, // pagó ≥ $1,500 de una → cada 15 días
  costoAlto: 1.5, // costo por resultado ≥ 1.5× la mediana de la cuenta = caro
  minImpresiones: 1000, // menos que esto, el CTR todavía no dice nada
  minGasto: 15, // menos que esto, el costo todavía no dice nada
};

const n = (x) => Number(x || 0);
export const usd = (x, dec = 2) => (x == null ? "—" : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }));
const usd0 = (x) => usd(x, 0);
const pct = (x) => (x == null ? "—" : `${Number(x).toFixed(1)} %`);
const pct2 = (x) => (x == null ? "—" : `${(Math.floor(Number(x) * 100) / 100).toFixed(2)} %`); // 1.995 → "1.99 %", no "2.00 %"
const entero = (x) => Number(x || 0).toLocaleString("en-US");

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

export function cadencia({ acuerdo, pagoInicial } = {}) {
  const a = leerAcuerdo(acuerdo);
  const pago = n(pagoInicial);
  const desc = a ? (a.mensual ? `${usd0(a.monto)} al mes` : `acuerdo de ${usd0(a.monto)}`) : pago ? `pago de ${usd0(pago)}` : "sin acuerdo en Pulse";
  if (a && a.monto >= UMBRAL.acuerdoAlto) return { dias: 15, motivo: desc };
  if (pago >= UMBRAL.pagoDeUna) return { dias: 15, motivo: `${desc} · pagó ${usd0(pago)} de una` };
  return { dias: 30, motivo: `${desc} · paquete pequeño` };
}

export function sumarDias(dia, dias) {
  const d = new Date(dia + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
export const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00Z") - new Date(a + "T12:00:00Z")) / 86_400_000);

// Los que tocan hoy: vencidos primero (más días de atraso arriba), después los que nunca se han revisado (acuerdo
// más grande primero). Tope por día para que el reporte se pueda leer; el resto sigue en la fila mañana.
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
  const tipo = tipoResultado(r?.indicator);
  return { tipo, cantidad: n(r?.values?.[0]?.value) };
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
  if (c.video_id || /VIDEO/i.test(c.object_type || "")) return "video";
  if (c.image_hash || c.image_url || /PHOTO|IMAGE/i.test(c.object_type || "")) return "flyer";
  if (/video|reel/i.test(ad?.name || "")) return "video"; // post existente: Meta no dice el formato, el nombre sí
  if (/flyer|imagen|foto|arte/i.test(ad?.name || "")) return "flyer";
  return "anuncio";
}

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
    if (!porResultado && x.resultado && tipo && x.resultado.clave !== tipo.clave) x.mixto = true;
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
  return { gasto, impresiones: n(cuenta?.impressions), ctr: cuenta?.unique_ctr != null ? n(cuenta.unique_ctr) : null, frecuencia: cuenta?.frequency != null ? n(cuenta.frequency) : null, resultados, desde: cuenta?.date_start || null };
}

// ---------- el análisis (método de Elvin) ----------

export function analizar({ periodos, anuncios, hoy = new Date().toISOString().slice(0, 10) }) {
  const porId = new Map((anuncios || []).map((a) => [String(a.id), a]));
  const costos = Object.fromEntries(PERIODOS.map((p) => [p.clave, resumenPeriodo(periodos?.[p.clave])]));
  const principal = costos.maximo.resultados[0]?.tipo || costos.mes.resultados[0]?.tipo || null;
  const delPrincipal = (cs) => cs.filter((c) => principal && c.resultado?.clave === principal.clave);

  const cMax = agruparCreativos(periodos?.maximo?.filas, porId);
  const cMes = agruparCreativos(periodos?.mes?.filas, porId);
  const cSem = agruparCreativos(periodos?.semana?.filas, porId);
  const semDe = new Map(cSem.map((c) => [c.clave, c]));
  const medMax = mediana(delPrincipal(cMax).filter((c) => c.cantidad >= 3).map((c) => c.costo));
  const medMes = mediana(delPrincipal(cMes).filter((c) => c.cantidad >= 3).map((c) => c.costo)) ?? medMax;

  // 1. Lo que ha funcionado (en máximo): buen costo, engancha y con volumen.
  const funciono = delPrincipal(cMax)
    .filter((c) => c.cantidad >= 5 && c.gasto >= UMBRAL.minGasto && (medMax == null || c.costo <= medMax) && (c.ctr ?? 0) >= UMBRAL.ctr)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 3);

  // 2. Costos elevados (último mes, activos): se optimiza cambiando EL CREATIVO.
  const caros = delPrincipal(cMes)
    .filter((c) => c.activo && c.gasto >= UMBRAL.minGasto && (c.cantidad === 0 || (medMes != null && c.costo >= UMBRAL.costoAlto * medMes)))
    .sort((a, b) => b.gasto - a.gasto)
    .slice(0, 4)
    .map((c) => ({ ...c, veces: c.costo && medMes ? c.costo / medMes : null }));

  // 3. Para escalar: gana en el mes, sigue ganando esta semana, engancha y no está quemado.
  const escalar = delPrincipal(cMes)
    .filter((c) => {
      const s = semDe.get(c.clave);
      return c.activo && c.cantidad >= 5 && medMes != null && c.costo <= medMes && (c.ctr ?? 0) >= UMBRAL.ctr && (c.frecuencia ?? 0) <= UMBRAL.frecuencia
        && s && s.cantidad > 0 && s.costo <= medMes * 1.2;
    })
    .sort((a, b) => a.costo - b.costo)
    .slice(0, 3)
    .map((c) => ({ ...c, semana: semDe.get(c.clave), dias: c.desde ? diasEntre(c.desde, hoy) : null }));

  // 4. Flyers y videos activos con CTR único < 2 % → reemplazar y rotar. Aparte, los que todavía pasan pero se están
  // cansando (el CTR de 7 días cayó 25 % o más vs. el mes): hay que tenerles el relevo listo.
  const mesC = agruparCreativos(periodos?.mes?.filas, porId, { porResultado: false });
  const semC = new Map(agruparCreativos(periodos?.semana?.filas, porId, { porResultado: false }).map((c) => [c.clave, c]));
  const rotar = [], cansando = [];
  for (const c of mesC) {
    if (!c.activo || c.impresiones < UMBRAL.minImpresiones || c.ctr == null) continue;
    const s = semC.get(c.clave);
    const sem = s && s.impresiones >= 500 && s.ctr != null ? s.ctr : null;
    if (c.ctr < UMBRAL.ctr) rotar.push({ ...c, motivo: `CTR único ${pct2(c.ctr)}${sem != null ? ` (7 días: ${pct2(sem)})` : ""}` });
    else if (sem != null && sem < UMBRAL.ctr) rotar.push({ ...c, motivo: `CTR único bajó a ${pct2(sem)} esta semana (mes ${pct(c.ctr)})` });
    else if (sem != null && sem <= c.ctr * 0.75) cansando.push({ ...c, motivo: `CTR ${pct(c.ctr)} → ${pct(sem)} en 7 días` });
  }
  rotar.sort((a, b) => b.gasto - a.gasto);
  const yaSale = new Set([...rotar, ...caros].map((c) => c.clave.split("|")[0]));
  cansando.splice(0, cansando.length, ...cansando.filter((c) => !yaSale.has(c.clave)).sort((a, b) => b.gasto - a.gasto));

  // 5. Frecuencia > 1.8 en el último mes, por anuncio activo (la frecuencia es de SU público).
  const freSem = new Map((periodos?.semana?.filas || []).map((f) => [String(f.ad_id), n(f.frequency)]));
  const frecuencia = (periodos?.mes?.filas || [])
    .filter((f) => porId.get(String(f.ad_id))?.effective_status === "ACTIVE" && n(f.frequency) > UMBRAL.frecuencia && n(f.spend) >= 5)
    .map((f) => ({ nombre: limpiarNombre(f.ad_name), conjunto: f.adset_name || "", frecuencia: n(f.frequency), semana: freSem.get(String(f.ad_id)) ?? null, gasto: n(f.spend) }))
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 5);

  const claves = new Map();
  for (const c of [...cMax, ...mesC]) { const k = c.clave.split("|")[0]; const set = claves.get(c.nombre) || new Set(); set.add(k); claves.set(c.nombre, set); }
  // Se distinguen por cuándo se creó el anuncio (así se encuentra en el Ads Manager); si no, por su conjunto.
  const distinguir = (c) => ((claves.get(c.nombre)?.size ?? 0) > 1 ? { ...c, etiqueta: `${c.nombre.slice(0, 36)} · ${c.desde ? `del ${fecha(c.desde)}` : (c.conjuntos[0]?.nombre || "").slice(0, 22)}` } : c);
  const activos = (anuncios || []).filter((a) => a.effective_status === "ACTIVE").length;
  return { costos, principal, mediana: { maximo: medMax, mes: medMes }, funciono: funciono.map(distinguir), caros: caros.map(distinguir), escalar: escalar.map(distinguir), rotar: rotar.slice(0, 6).map(distinguir), cansando: cansando.slice(0, 3).map(distinguir), frecuencia, activos, creativosActivos: new Set((anuncios || []).filter((a) => a.effective_status === "ACTIVE").map(claveCreativo)).size };
}

// ---------- el texto (Telegram: corto, tuteo PR, sin markdown pesado) ----------

const lineaCosto = (nombre, c, principal) => {
  const r = principal ? c.resultados.find((x) => x.tipo.clave === principal.clave) : c.resultados[0];
  if (!c.gasto) return `- ${nombre}: sin gasto`;
  const partes = [usd(c.gasto, c.gasto >= 100 ? 0 : 2)];
  if (r) partes.push(`${entero(r.cantidad)} ${r.cantidad === 1 ? r.tipo.uno : r.tipo.varios}`, r.costo != null ? `${usd(r.costo)} c/u` : "sin resultados");
  if (c.ctr != null && c.impresiones >= 300) partes.push(`CTR ${pct(c.ctr)}`);
  if (c.frecuencia != null && nombre !== "Hoy") partes.push(`frec. ${c.frecuencia.toFixed(1)}`);
  return `- ${nombre}: ${partes.join(" · ")}`;
};

const nombreCreativo = (c) => `${c.formato === "video" ? "Video" : c.formato === "flyer" ? "Flyer" : "Anuncio"} "${(c.etiqueta || c.nombre).slice(0, 60)}"`;
const fecha = (d) => (d ? `${Number(d.slice(8, 10))}/${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][Number(d.slice(5, 7)) - 1]}` : "");

export function textoReporte(cliente, a, { error } = {}) {
  const cad = cliente.cadencia || cadencia(cliente);
  const cab = [
    `*📋 Revisión · ${cliente.empresa || cliente.nombre}*${cliente.empresa && cliente.nombre && cliente.empresa !== cliente.nombre ? ` (${cliente.nombre})` : ""}`,
    [cad.motivo, `cada ${cad.dias} días`, cliente.estratega ? `estratega: ${cliente.estratega}` : "sin estratega asignado", cliente.fechaInicio ? `desde ${fecha(cliente.fechaInicio)}` : ""].filter(Boolean).join(" · "),
  ];
  if (!cliente.cuentaId) return [...cab, "", "⚠️ No tiene el ID de la cuenta publicitaria en Pulse: no puedo revisarlo. Que el estratega lo ponga en la ficha.", "— Max"].join("\n");
  if (error) return [...cab, "", `⚠️ No pude leer la cuenta ${cliente.cuentaId}: ${error}`, "— Max"].join("\n");
  const L = [...cab, a.principal ? `Resultado que se mide: ${a.principal.varios} · ${a.activos} anuncios activos (${a.creativosActivos} creativos)` : `${a.activos} anuncios activos`, ""];

  L.push("1) Costos");
  for (const p of PERIODOS) L.push(lineaCosto(p.nombre, a.costos[p.clave], a.principal));
  const rm = a.costos.mes.resultados.find((x) => x.tipo.clave === a.principal?.clave), rs = a.costos.semana.resultados.find((x) => x.tipo.clave === a.principal?.clave);
  if (rm?.costo && rs?.costo) {
    const d = (rs.costo / rm.costo - 1) * 100;
    if (Math.abs(d) >= 15) L.push(`→ El costo ${d > 0 ? "subió" : "bajó"} ${Math.abs(d).toFixed(0)} % esta semana vs. el mes${d > 0 ? ": revisar creativos" : ""}.`);
  }
  if (a.activos && !a.costos.hoy.gasto) L.push("→ Hoy no ha gastado nada con anuncios activos: revisar pago/saldo o entrega.");
  if (!a.costos.mes.gasto) L.push("→ No ha gastado en el último mes.");

  L.push("", "2) Lo que ha funcionado (máximo)");
  if (a.funciono.length) for (const c of a.funciono) L.push(`- ${nombreCreativo(c)}: ${entero(c.cantidad)} ${c.resultado?.varios || ""} a ${usd(c.costo)} · CTR ${pct(c.ctr)}${c.activo ? "" : " · (apagado)"}`);
  else L.push("- Todavía ningún creativo con volumen, buen costo y CTR ≥ 2 %.");

  L.push("", "3) Costos elevados → cambiar el creativo");
  if (a.caros.length) for (const c of a.caros) L.push(`- ${nombreCreativo(c)}: ${usd(c.gasto)} en el mes · ${c.cantidad ? `${usd(c.costo)} c/u (${c.veces.toFixed(1)}× la mediana de ${usd(a.mediana.mes)})` : `sin ${a.principal?.varios || "resultados"}`} · CTR ${pct(c.ctr)}`);
  else L.push(`- Nada caro en el mes${a.mediana.mes != null ? ` (mediana ${usd(a.mediana.mes)} por ${a.principal?.uno || "resultado"})` : ""}.`);

  L.push("", "4) Para escalar (+10-20 % con tu OK)");
  if (a.escalar.length) for (const c of a.escalar) L.push(`- ${nombreCreativo(c)}: ${usd(c.costo)} en el mes y ${usd(c.semana.costo)} esta semana${c.dias != null && c.dias < 14 ? ` (lleva ${c.dias} días)` : ""} · CTR ${pct(c.ctr)} · frec. ${(c.frecuencia ?? 0).toFixed(1)} · conjunto ${c.conjuntos.map((x) => `"${x.nombre.slice(0, 30)}" (${x.id})`).slice(0, 2).join(", ")}`);
  else L.push("- Ninguno todavía: hace falta un creativo que gane en el mes Y siga ganando esta semana, con CTR ≥ 2 % y frecuencia ≤ 1.8.");

  L.push("", "5) Flyers y videos con CTR bajo → pedir reemplazo y rotar");
  if (a.rotar.length) for (const c of a.rotar) L.push(`- ${nombreCreativo(c)}: ${c.motivo} · ${usd(c.gasto)} en el mes`);
  else L.push("- Todos los activos están en 2 % o más.");
  if (a.cansando?.length) L.push(`Se están cansando (tener el relevo listo): ${a.cansando.map((c) => `${nombreCreativo(c)} (${c.motivo})`).join("; ")}`);

  L.push("", "6) Frecuencia (tope 1.8)");
  if (a.frecuencia.length) for (const f of a.frecuencia) L.push(`- "${f.nombre.slice(0, 40)}"${f.conjunto ? ` en "${f.conjunto.slice(0, 28)}"` : ""}: ${f.frecuencia.toFixed(1)} en el mes${f.semana != null ? ` (${f.semana.toFixed(1)} en 7 días)` : ""}`);
  else L.push("- Bien: ningún anuncio activo pasa de 1.8 en el mes.");

  const aj = ajustes(a);
  if (aj.length) L.push("", "Qué ajustaría", ...aj.map((x) => `- ${x}`));
  L.push("— Max");
  return L.join("\n");
}

const ylista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}` : xs[0] || "");

// Lo que Elvin lleva a la reunión: máximo 4 acciones, en orden de impacto. Creativos nuevos: máximo 3 por revisión
// (los más caros/que menos enganchan primero); lo que se está cansando va como relevo, no como reemplazo.
export function ajustes(a) {
  const out = [];
  const ganador = a.escalar[0] || a.funciono.find((c) => c.activo) || a.funciono[0];
  const reemplazar = [...new Map([...a.rotar, ...a.caros].map((c) => [c.clave.split("|")[0], c])).values()].slice(0, 3);
  if (reemplazar.length) {
    const fly = reemplazar.filter((c) => c.formato !== "video").length, vid = reemplazar.length - fly;
    const que = ylista([fly && `${fly} flyer${fly > 1 ? "s" : ""}`, vid && `${vid} video${vid > 1 ? "s" : ""}`].filter(Boolean));
    out.push(`Pedir ${que} para reemplazar ${ylista(reemplazar.map((c) => `"${(c.etiqueta || c.nombre).slice(0, 34)}"`))}${ganador ? `, con el ángulo de "${(ganador.etiqueta || ganador.nombre).slice(0, 34)}" (es el que funciona)` : ""}.`);
  } else if (a.cansando?.length) out.push(`Tener listo el relevo de ${ylista(a.cansando.slice(0, 2).map((c) => `"${c.nombre.slice(0, 30)}"`))}: se están cansando.`);
  if (a.escalar.length) out.push(`Escalar "${(a.escalar[0].etiqueta || a.escalar[0].nombre).slice(0, 40)}" +15 % (${usd(a.escalar[0].costo)} por ${a.principal?.uno || "resultado"}); si me dices que sí, te dejo la propuesta en #max-aprobaciones.`);
  else if (ganador && ganador.activo) out.push(`Duplicar "${ganador.nombre.slice(0, 32)}" a un público nuevo cuando confirme esta semana.`);
  if (a.frecuencia.length) out.push(`Bajar la frecuencia en ${a.frecuencia.length === 1 ? "1 anuncio" : `${a.frecuencia.length} anuncios`}: rotar el creativo o abrir el público.`);
  if (a.activos && !a.costos.hoy.gasto) out.push("Confirmar por qué no está gastando hoy (pago, saldo o entrega).");
  if (!out.length) out.push("Mantener: está dentro de los números. Seguir renovando creativos cada 10 días.");
  return out.slice(0, 4);
}
