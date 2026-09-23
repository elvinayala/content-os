// ESPIAR LA COMPETENCIA (23/sep/2026) — el hábito de Elvin: "a mí me gusta investigar
// la competencia que está funcionando en el mercado en mi nicho para sacar algo de ahí;
// no toda la estrategia, pero sacar algo de ahí".
//
// Fuente: la Biblioteca de Anuncios de Meta (lo que está CORRIENDO hoy), vía el actor
// oficial de Apify `apify/facebook-ads-scraper` (~$0.005 por anuncio: 30 anuncios ≈ $0.15,
// ~20-40 s). La API oficial de Meta (ads_archive) solo devuelve anuncios políticos fuera
// de la UE, por eso Apify.
//
// La señal de "está funcionando": un anuncio que sigue activo después de muchos días
// (nadie paga 60 días por un anuncio que no vende) y que tiene VARIANTES (el anunciante
// lo duplicó = escaló). El ranking y el resumen son CÓDIGO (cero tokens): el modelo solo
// lee el resumen corto (top 10, ~1.5K tokens) y decide qué robar.
//
// Módulo PURO salvo `buscarEnBiblioteca` (red). Tests: tests/competencia.test.mjs.

export const ACTOR = "apify~facebook-ads-scraper";
const DIA = 86400000;

// URL de búsqueda de la Biblioteca (lo mismo que se ve en facebook.com/ads/library).
export function urlBiblioteca({ termino, pais = "PR", activos = true, pageId } = {}) {
  const u = new URL("https://www.facebook.com/ads/library/");
  u.searchParams.set("active_status", activos ? "active" : "all");
  u.searchParams.set("ad_type", "all");
  u.searchParams.set("country", pais);
  u.searchParams.set("media_type", "all");
  if (pageId) { u.searchParams.set("view_all_page_id", String(pageId)); u.searchParams.set("search_type", "page"); }
  else { u.searchParams.set("q", termino); u.searchParams.set("search_type", "keyword_unordered"); }
  return u.toString();
}

// Normaliza un item crudo del actor (acepta la forma anidada `snapshot.body.text` o plana).
const g = (o, ruta) => ruta.split(".").reduce((x, k) => (x == null ? x : x[k]), o) ?? o?.[ruta];
export function normalizar(item, ahora = Date.now()) {
  const inicio = g(item, "startDateFormatted") || (item.startDate ? new Date(Number(item.startDate) * 1000).toISOString() : null);
  const dias = inicio ? Math.max(0, Math.round((ahora - new Date(inicio).getTime()) / DIA)) : null;
  const cuerpo = String(g(item, "snapshot.body.text") ?? (typeof g(item, "snapshot.body") === "string" ? g(item, "snapshot.body") : "") ?? "").trim();
  const tarjetas = g(item, "snapshot.cards") || [];
  const texto = cuerpo && !/^\{\{/.test(cuerpo) ? cuerpo : String(tarjetas[0]?.body || "").trim();
  return {
    id: String(item.adArchiveID || item.adArchiveId || item.adId || ""),
    pagina: item.pageName || g(item, "snapshot.pageName") || "",
    pageId: String(item.pageID || item.pageId || ""),
    inicio: inicio ? inicio.slice(0, 10) : null,
    dias,
    variantes: Number(item.collationCount) || 1,
    formato: g(item, "snapshot.displayFormat") || (tarjetas.length > 1 ? "CAROUSEL" : ""),
    cta: g(item, "snapshot.ctaType") || "",
    plataformas: (item.publisherPlatform || []).map((p) => String(p).toLowerCase()),
    // Los anuncios dinámicos (DCO) traen plantillas "{{product.name}}": no son copy real.
    titulo: String(g(item, "snapshot.title") || tarjetas[0]?.title || "").trim().replace(/^\{\{.*\}\}$/, ""),
    texto,
    destino: g(item, "snapshot.linkUrl") || tarjetas[0]?.linkUrl || "",
    activo: item.isActive !== false,
  };
}

// Gancho = primera línea con sustancia (lo que se lee antes del "Ver más").
export function gancho(texto = "") {
  let linea = String(texto).split(/\n+/).map((l) => l.trim()).find((l) => l.replace(/[^\p{L}\p{N}]/gu, "").length >= 8) || "";
  const frase = linea.match(/^.{12,}?[.!?](?=\s|$)/u); // primera oración si la línea es un párrafo
  if (frase && frase[0].length < linea.length) linea = frase[0];
  return linea.length > 140 ? linea.slice(0, 137) + "…" : linea;
}
// Señales de oferta: precios, descuentos, garantías, urgencia, prueba social.
export function senales(texto = "") {
  const t = String(texto);
  const s = [];
  const precios = t.match(/\$\s?\d[\d,]*(\.\d{2})?/g);
  if (precios) s.push("precio " + [...new Set(precios)].slice(0, 3).join(" / "));
  if (/\d+\s?%\s?(off|de descuento|descuento)|descuento|oferta|promoci[oó]n|especial/i.test(t)) s.push("oferta/descuento");
  if (/garant[ií]a/i.test(t)) s.push("garantía");
  if (/(últim[oa]s?|cupos?|limitad[oa]|solo por|por tiempo|termina|antes del|quedan)/i.test(t)) s.push("urgencia/escasez");
  if (/(\+?\d{2,}[\d,]*\s?(clientes|familias|casas|hogares|negocios|reseñas|trabajos)|años de experiencia|estrellas|testimonio|casos? de [ée]xito)/i.test(t)) s.push("prueba social");
  if (/(whats ?app|escr[ií]benos|dm|mensaje)/i.test(t)) s.push("pide mensaje");
  if (/(ll[aá]manos|llama|787|939)/i.test(t)) s.push("pide llamada");
  if (/\?/.test(gancho(t))) s.push("gancho con pregunta");
  return s;
}
const DESTINO = { WHATSAPP_MESSAGE: "WhatsApp", MESSAGE_PAGE: "Messenger/DM", CALL_NOW: "llamada", LEARN_MORE: "web", SHOP_NOW: "tienda", SIGN_UP: "registro", APPLY_NOW: "formulario", BOOK_TRAVEL: "reserva", GET_QUOTE: "cotización", SEE_DETAILS: "web", LIKE_PAGE: "me gusta" };
export const destinoDe = (a) => DESTINO[a.cta] || (a.destino ? "web" : a.cta || "—");

// Puntaje de "está funcionando": días activo (satura en 90) + variantes (escaló) +
// multiplataforma. Un anuncio de 3 días no dice nada todavía.
export function puntaje(a) {
  const d = a.dias == null ? 0 : Math.min(a.dias, 90);
  return Math.round(d * 1 + Math.min(a.variantes - 1, 10) * 6 + (a.plataformas.includes("instagram") ? 4 : 0));
}

// Ranking: dedup por (página + gancho), fuera los de <7 días y los de plantilla vacía.
export function rankear(items, { ahora = Date.now(), excluirPaginas = [] } = {}) {
  const fuera = new Set(excluirPaginas.map((x) => String(x).toLowerCase()));
  const vistos = new Map();
  for (const it of items.map((i) => normalizar(i, ahora))) {
    if (!it.texto && !it.titulo) continue;
    if (/INSTALL_MOBILE_APP|INSTALL_APP|PLAY_GAME/.test(it.cta)) continue; // la búsqueda por palabra trae apps que no son del nicho
    if (fuera.has(it.pagina.toLowerCase()) || fuera.has(it.pageId)) continue;
    const k = it.pagina.toLowerCase() + "|" + gancho(it.texto || it.titulo).toLowerCase().slice(0, 60);
    const previo = vistos.get(k);
    if (!previo || (it.dias || 0) > (previo.dias || 0)) vistos.set(k, { ...it, variantes: Math.max(it.variantes, previo?.variantes || 1) });
  }
  return [...vistos.values()].map((a) => ({ ...a, puntaje: puntaje(a), gancho: gancho(a.texto || a.titulo), senales: senales(a.texto) }))
    .sort((a, b) => b.puntaje - a.puntaje || (b.dias || 0) - (a.dias || 0));
}

// Resumen corto que lee el modelo (y Elvin por Telegram). Cero adornos.
export function resumen(rank, { termino = "", pais = "PR", top = 10 } = {}) {
  const lideres = rank.filter((a) => (a.dias || 0) >= 30);
  const porPagina = new Map();
  for (const a of rank) porPagina.set(a.pagina, (porPagina.get(a.pagina) || 0) + 1);
  const activosFuertes = [...porPagina.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p, n]) => `${p} (${n})`);
  const cuenta = (f) => { const m = new Map(); for (const a of rank) { const v = f(a); if (v) m.set(v, (m.get(v) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(" · "); };
  const lineas = [
    `COMPETENCIA · "${termino}" · ${pais} · ${rank.length} anuncios únicos activos · ${lideres.length} con 30+ días (esos son los que funcionan)`,
    `Quién más pauta: ${activosFuertes.join(", ") || "—"}`,
    `Formatos: ${cuenta((a) => a.formato) || "—"}`,
    `Destinos: ${cuenta((a) => destinoDe(a)) || "—"}`,
    `Señales más usadas: ${cuenta((a) => a.senales[0]) || "—"}`,
    "",
    "TOP (más días activo + variantes = el anunciante lo sostiene/escaló):",
  ];
  rank.slice(0, top).forEach((a, i) => {
    lineas.push(`${i + 1}. ${a.pagina} · ${a.dias ?? "?"} días · ${a.variantes} var · ${a.formato || "?"} → ${destinoDe(a)}${a.plataformas.length ? " · " + a.plataformas.join("/") : ""}`);
    lineas.push(`   Gancho: "${a.gancho}"${a.senales.length ? "  [" + a.senales.join(", ") + "]" : ""}`);
    if (a.titulo && a.titulo !== a.pagina && !/^\{\{/.test(a.titulo)) lineas.push(`   Título: ${a.titulo.slice(0, 80)}`);
  });
  return lineas.join("\n");
}

// Llama al actor y devuelve los items crudos. `token` = APIFY_TOKEN. Tope de gasto
// por corrida (maxTotalChargeUsd) para que un error de búsqueda no queme créditos.
export async function buscarEnBiblioteca({ terminos = [], paginas = [], pais = "PR", max = 30, token, fetchImpl = fetch, topeUsd = 0.5 } = {}) {
  if (!token) throw new Error("Falta APIFY_TOKEN (Apify → Settings → API & Integrations → Personal API token). Ponlo en .env.local y en Railway (servicio max).");
  const startUrls = [
    ...terminos.filter(Boolean).map((t) => ({ url: urlBiblioteca({ termino: t, pais }) })),
    ...paginas.filter(Boolean).map((p) => ({ url: /^https?:/.test(p) ? p : urlBiblioteca({ pageId: p, pais }) })),
  ];
  if (!startUrls.length) throw new Error("Dame al menos un término o una página");
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=150&maxTotalChargeUsd=${topeUsd}`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ startUrls, resultsLimit: Math.min(Math.max(Number(max) || 30, 5), 100), activeStatus: "active", isDetailsPerAd: false }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`Apify ${res.status}: ${txt.slice(0, 200)}`);
  const data = JSON.parse(txt);
  return Array.isArray(data) ? data : data.items || [];
}
