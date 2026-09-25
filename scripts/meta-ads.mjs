#!/usr/bin/env node
// CLI del agente de Meta Ads del Content OS (las "manos"; el cerebro es /meta-ads).
//
//   node scripts/meta-ads.mjs <marca> cuentas                 cuentas, páginas, IG y pixel del token → completa portafolio.json
//   node scripts/meta-ads.mjs <marca> publicos                inventario de públicos (custom + similares) con tamaño y estado
//   node scripts/meta-ads.mjs <marca> videos                  últimos videos de la biblioteca (para el marcador)
//   node scripts/meta-ads.mjs <marca> intereses <q> [q2…]     busca intereses (ids) para el targeting
//   node scripts/meta-ads.mjs <marca> pixel                   estado del pixel + eventos recibidos
//   node scripts/meta-ads.mjs <marca> crear <plan.json> [--dry-run]   monta la campaña (TODO EN PAUSA); escribe ids al plan
//   node scripts/meta-ads.mjs <marca> crear-publicos <plan.json> [--dry-run]  crea los públicos faltantes que pide el plan
//   node scripts/meta-ads.mjs <marca> subir-lista <publicoId> <csv>   sube emails/teléfonos (hasheados) a un público de lista
//   node scripts/meta-ads.mjs <marca> arbol <campaignId>      lee la campaña creada (verificación)
//   node scripts/meta-ads.mjs <marca> resultados [campaignId] [last_7d|last_3d|yesterday|last_14d]
//   node scripts/meta-ads.mjs <marca> campanas                lista campañas de la cuenta
//   node scripts/meta-ads.mjs <marca> pausar <id>             pausa campaña/conjunto/anuncio (única escritura de estado permitida)
//   node scripts/meta-ads.mjs <marca> plantilla <tipo> [--reels a,b] [--videos a,b] [--presupuesto 15] [--edad 18-35] [--url …] [--nombre …] [--dry-run]
//       tipos: follow-me | trafico-url | dm-instagram | quiz  → escribe data/meta-ads/campanas/<marca>-<tipo>-<fecha>.json y la monta EN PAUSA
//   node scripts/meta-ads.mjs <marca> estrategia --destino dm-ig|leads|enlace --presupuesto 100 --reels a,b,c [--videos …] [--edad 25-55] [--intereses id:nombre,…] [--url …] [--nombre …] [--dry-run]
//       EL MÉTODO DE ELVIN · 5 FASES: crea los públicos primero y monta F1 tráfico · F2 ventas (≥70 %) · F3 remarketing ventas · F4 ThruPlay 365, TODO EN PAUSA (~30-60 s)
//   node scripts/meta-ads.mjs <marca> escalar <adsetId> [--pct 15] [--ok]   F5: sin --ok solo PROPONE; con --ok (tras el "dale" de Elvin) sube ≤ 20 %
//   node scripts/meta-ads.mjs competencia "término, término" [--pais PR] [--para slug] [--paginas id,url]   espía la Biblioteca de Anuncios (APIFY_TOKEN)
//
// Token: variable de entorno que indica portafolio.json (META_ADS_TOKEN…); si no está en el
// entorno se lee de .env.local. Nunca se imprime.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./meta-ads/core.mjs";
import { PLANTILLAS, opcionesDesdeFlags, planEstrategia5Fases } from "./meta-ads/plantillas.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTAFOLIO = resolve(ROOT, "data/meta-ads/portafolio.json");
const args = process.argv.slice(2);
// Flags booleanas (--dry-run) y con valor (--reels a,b · --presupuesto 15 · --edad 18-35 · --url …).
const CON_VALOR = new Set(["item", "cliente", "pct", "reels", "posts", "videos", "presupuesto", "edad", "url", "nombre", "cta", "excluir", "pais", "max", "paginas", "para", "top", "destino", "flyers", "intereses"]);
const flags = new Set();
const valores = {};
const posicionales = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) { posicionales.push(a); continue; }
  const [k, inline] = a.slice(2).split("=");
  if (CON_VALOR.has(k)) valores[k] = inline ?? args[++i]; else flags.add(a);
}
let [marca, cmd, ...rest] = posicionales;
const dry = flags.has("--dry-run");

// ESPIAR LA COMPETENCIA — no necesita marca ni token de Meta (usa APIFY_TOKEN):
//   node scripts/meta-ads.mjs competencia "plomero, destape" [--pais PR] [--max 30] [--paginas id1,id2] [--para resuelto] [--excluir "Resuelto PR"]
//   node scripts/meta-ads.mjs competencia resumir <raw.json> [--para …]   (items que bajó el MCP de Apify)
if (marca === "competencia") {
  const C = await import("./meta-ads/competencia.mjs");
  const leerEnvLocal = (n) => process.env[n] || (existsSync(resolve(ROOT, ".env.local")) ? (readFileSync(resolve(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}=(.*)$`, "m"))?.[1] || "").trim().replace(/^["']|["']$/g, "") : "") || null;
  try {
    const hoy = new Date().toISOString().slice(0, 10);
    let items, termino;
    if (cmd === "resumir") { items = JSON.parse(readFileSync(resolve(ROOT, rest[0]), "utf8")); items = Array.isArray(items) ? items : items.items || items.crudos || []; termino = valores.nombre || rest[0]; }
    else {
      termino = [cmd, ...rest].filter(Boolean).join(" ");
      const terminos = termino.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      const paginas = (valores.paginas || "").split(",").map((s) => s.trim()).filter(Boolean);
      console.error(`Buscando en la Biblioteca de Anuncios (${valores.pais || "PR"}): ${terminos.join(" | ")}${paginas.length ? " + " + paginas.length + " página(s)" : ""}…`);
      items = await C.buscarEnBiblioteca({ terminos, paginas, pais: valores.pais || "PR", max: Number(valores.max) || 30, token: leerEnvLocal("APIFY_TOKEN") });
    }
    const excluir = (valores.excluir || "").split(",").map((s) => s.trim()).filter(Boolean);
    const rank = C.rankear(items, { excluirPaginas: excluir });
    const para = (valores.para || termino).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "mercado";
    const dir = resolve(ROOT, "data/meta-ads/competencia");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dir, { recursive: true });
    const archivo = resolve(dir, `${para}-${hoy}.json`);
    writeFileSync(archivo, JSON.stringify({ termino, pais: valores.pais || "PR", fecha: hoy, total: items.length, ranking: rank.slice(0, 40) }, null, 2) + "\n");
    console.log(C.resumen(rank, { termino, pais: valores.pais || "PR", top: Number(valores.top) || 10 }));
    console.log(`\nGuardado: ${archivo.replace(ROOT + "/", "")} (top 40 con texto completo). Regla de Elvin: saca 1-3 cosas (gancho, oferta, formato, destino), no copies la estrategia entera.`);
  } catch (e) { console.error("✖", e.message); process.exit(1); }
  process.exit(0);
}

const portafolio = JSON.parse(readFileSync(PORTAFOLIO, "utf8"));
// Clientes de Level Up que maneja Max desde Slack (24/sep): `cliente:<slug>` lee cuenta/página/IG/
// pixel/públicos del expediente en /api/max (scripts/max.mjs meta <slug> …) en vez de portafolio.json.
async function apiMax(metodo, q, cuerpo) {
  const base = (leerEnv("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
  const r = await fetch(`${base}/api/max${q ? "?" + new URLSearchParams(q) : ""}`, { method: metodo, headers: { "x-cron-secret": leerEnv("CRON_SECRET") || "", "Content-Type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined, signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({ ok: false, error: "HTTP " + r.status }));
  if (!r.ok || j.ok === false) throw new Error("api/max: " + (j.error || j.texto || r.status));
  return j;
}
const esCliente = Boolean(marca?.startsWith("cliente:"));
let cfg = portafolio.marcas[marca];
if (esCliente && cmd) {
  const slug = marca.slice(8);
  const { cliente: exp } = await apiMax("GET", { cliente: slug });
  if (!exp) { console.error(`No existe el cliente ${slug} (node scripts/max.mjs clientes).`); process.exit(1); }
  const m = exp.meta || {};
  if (!m.cuentaId) { console.error(`${slug} no tiene cuenta de Meta: node scripts/max.mjs meta ${slug} --cuenta … --pagina … [--ig …] [--pixel …]`); process.exit(1); }
  cfg = { nombre: exp.nombre, etiqueta: m.etiqueta || exp.nombre.split(" (")[0].toUpperCase().slice(0, 24), tokenEnv: m.tokenEnv || "META_ADS_TOKEN", cuentaId: m.cuentaId, pageId: m.pageId || null, igUserId: m.igUserId || null, pixelId: m.pixelId || null, igHandle: m.igHandle || null, landing: m.landing || null, compuertas: { ctrMin: 2, frecuenciaMax: 2.5, ...(m.compuertas || {}) }, reglas: { minPorConjunto: m.minPorConjunto || 10, ...(m.reglas || {}) }, publicosClave: m.publicosClave || {}, clienteSlug: slug };
}
if (!cfg || !cmd) {
  console.error("Uso: node scripts/meta-ads.mjs <marca> <comando> …  (marcas: " + Object.keys(portafolio.marcas).join(", ") + ")");
  process.exit(1);
}
function leerEnv(nombre) {
  if (process.env[nombre]) return process.env[nombre];
  const f = resolve(ROOT, ".env.local");
  if (!existsSync(f)) return null;
  const m = readFileSync(f, "utf8").match(new RegExp(`^${nombre}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}
const token = leerEnv(cfg.tokenEnv);
if (!token) {
  console.error(`Falta ${cfg.tokenEnv} (token de usuario del sistema de Meta). Genéralo en Business Settings → Usuarios del sistema y ponlo en .env.local.`);
  process.exit(2);
}
const c = M.crearCliente(token, { log: flags.has("--verbose") ? (...a) => console.error("→", ...a) : undefined });
const guardarPortafolio = () => {
  if (esCliente) return apiMax("POST", null, { accion: "cliente", slug: cfg.clienteSlug, meta: { pageId: cfg.pageId, igUserId: cfg.igUserId, publicosClave: cfg.publicosClave } }).catch((e) => console.error("⚠ no pude guardar en el expediente:", e.message));
  portafolio.actualizadoEl = new Date().toISOString().slice(0, 10); writeFileSync(PORTAFOLIO, JSON.stringify(portafolio, null, 2) + "\n");
};
const tabla = (rows) => console.table(rows);
const num = (n) => (n == null ? "—" : Number(n).toLocaleString("en-US"));
const usd = (n) => (n == null ? "—" : "$" + Number(n).toFixed(2));

try {
  if (cmd === "cuentas") {
    const cuentas = await M.cuentasDelToken(c);
    console.log("Cuentas publicitarias visibles con este token:");
    tabla(cuentas.map((a) => ({ id: a.id, nombre: a.name, estado: a.account_status, moneda: a.currency, negocio: a.business?.name || "" })));
    if (cfg.cuentaId) {
      const info = await M.infoCuenta(c, cfg.cuentaId);
      console.log("\nCuenta de la marca:", info.name, "| estado", info.account_status, "| gastado", usd(Number(info.amount_spent) / 100), "| tz", info.timezone_name, info.disable_reason ? "| ⚠ disable_reason " + info.disable_reason : "");
    }
    const paginas = await M.paginasDelToken(c, cfg.negocioId);
    console.log("\nPáginas (perfil + negocio):");
    tabla(paginas.map((p) => ({ id: p.id, nombre: p.name, ig: p.instagram_business_account?.username || "", igId: p.instagram_business_account?.id || "" })));
    if (cfg.pixelId) {
      const px = await M.infoPixel(c, cfg.pixelId);
      console.log("\nPixel:", px.name, px.id, "| último evento", px.last_fired_time || "nunca", px.is_unavailable ? "| ⚠ no disponible" : "");
    }
    const pg = rest[0] ? paginas.find((p) => p.id === rest[0]) : (paginas.length === 1 ? paginas[0] : paginas.find((p) => new RegExp(cfg.nombre.split(" ")[0], "i").test(p.name)));
    if (pg && (!cfg.pageId || rest[0])) {
      cfg.pageId = pg.id; cfg.igUserId = pg.instagram_business_account?.id || cfg.igUserId || null;
      guardarPortafolio();
      console.log(`\n✔ portafolio.json: pageId=${cfg.pageId} igUserId=${cfg.igUserId} (${pg.name}). Para elegir otra: cuentas <pageId>`);
    } else if (!cfg.pageId) console.log("\n⚠ No pude elegir la página sola: corre `cuentas <pageId>` con la que corresponde.");
  } else if (cmd === "publicos") {
    if (!cfg.cuentaId) throw new Error("La marca no tiene cuentaId en portafolio.json");
    const pubs = await M.listarPublicos(c, cfg.cuentaId);
    const filas = pubs.map((p) => ({
      id: p.id, nombre: p.name.slice(0, 60), tipo: p.subtype, similar: p.lookalike_spec ? `${Math.round((p.lookalike_spec.ratio || 0) * 100)}% ${p.lookalike_spec.country || ""}` : "",
      tamano: p.approximate_count_lower_bound != null ? `${num(p.approximate_count_lower_bound)}–${num(p.approximate_count_upper_bound)}` : "—",
      entrega: p.delivery_status?.description || p.delivery_status?.code || "", op: p.operation_status?.description || "", actualizado: String(p.time_updated || "").slice(0, 10),
    }));
    tabla(filas);
    console.log(`${pubs.length} públicos. Mapea los que uses en portafolio.json → marcas.${marca}.publicosClave ({ "clave": "id" }).`);
    if (flags.has("--json")) writeFileSync(resolve(ROOT, `data/meta-ads/publicos-${marca}.json`), JSON.stringify({ actualizadoEl: new Date().toISOString(), publicos: pubs }, null, 2) + "\n");
  } else if (cmd === "videos") {
    const vids = await M.listarVideos(c, cfg.cuentaId, Number(rest[0]) || 25);
    tabla(vids.map((v) => ({ id: v.id, titulo: (v.title || "").slice(0, 50), seg: v.length, creado: String(v.created_time).slice(0, 10) })));
  } else if (cmd === "intereses") {
    for (const q of rest) {
      console.log("\n" + q + ":");
      tabla(await M.buscarIntereses(c, q));
    }
  } else if (cmd === "pixel") {
    const px = await M.infoPixel(c, cfg.pixelId);
    console.log(px);
    tabla(await M.estadisticasPixel(c, cfg.pixelId));
  } else if (cmd === "campanas") {
    tabla((await M.listarCampanas(c, cfg.cuentaId)).map((x) => ({ id: x.id, nombre: x.name.slice(0, 60), estado: x.effective_status, objetivo: x.objective, actualizado: String(x.updated_time).slice(0, 10) })));
  } else if (cmd === "arbol") {
    const { camp, adsets, ads } = await M.arbolCampana(c, rest[0]);
    console.log("Campaña:", camp.name, "|", camp.status, "|", camp.objective, "| ABO:", camp.is_adset_budget_sharing_enabled === false ? "sí" : camp.is_adset_budget_sharing_enabled);
    tabla(adsets.map((a) => ({
      id: a.id, nombre: a.name.slice(0, 48), estado: a.status, "$/día": Number(a.daily_budget) / 100, opt: a.optimization_goal,
      pixel: a.promoted_object?.pixel_id || "", evento: a.promoted_object?.custom_event_type || "",
      plataformas: (a.targeting?.publisher_platforms || []).join(","), incluye: (a.targeting?.custom_audiences || []).map((x) => x.name || x.id).join("|").slice(0, 40),
      excluye: (a.targeting?.excluded_custom_audiences || []).length, advantage: a.targeting?.targeting_automation?.advantage_audience ?? "",
    })));
    tabla(ads.map((a) => ({ id: a.id, nombre: a.name.slice(0, 48), estado: a.status, adset: a.adset_id, video: a.creative?.object_story_spec?.video_data?.video_id || "", url_tags: (a.creative?.url_tags || "").slice(0, 50) })));
    const suma = adsets.reduce((s, a) => s + Number(a.daily_budget) / 100, 0);
    console.log(`Suma presupuestos: $${suma}/día · todo en pausa: ${[...adsets, ...ads].every((x) => x.status === "PAUSED") && camp.status === "PAUSED" ? "sí ✔" : "NO ⚠"}`);
  } else if (cmd === "resultados") {
    const campaignId = rest[0] && /^\d+$/.test(rest[0]) ? rest[0] : undefined;
    const preset = rest.find((r) => /^(last_|yesterday|today|this_)/.test(r)) || "last_7d";
    const rows = await M.insights(c, cfg.cuentaId, { campaignId, nivel: flags.has("--ads") ? "ad" : "adset", preset });
    const r = M.resumirInsights(rows, { compuertas: cfg.compuertas });
    tabla(r.filas.map((f) => ({ nombre: f.nombre.slice(0, 40), gasto: usd(f.gasto), impr: num(f.impresiones), ctr: f.ctr.toFixed(2) + "%", frec: f.frecuencia.toFixed(1), cpc: usd(f.cpc), clics: f.clicsEnlace, seguidores: f.seguidores, "$/seguidor": f.costoSeguidor == null ? "—" : usd(f.costoSeguidor), conv: f.conversaciones, leads: f.leads, cpl: f.cpl == null ? "—" : usd(f.cpl), ventas: f.ventas, roas: f.roas ? f.roas.toFixed(1) + "x" : "—", recomendacion: f.recomendacion + (f.aviso ? " · ⚠ " + f.aviso : "") })));
    if (r.escalar.length) console.log("🚀 ESCALAR:", r.escalar.map((f) => f.nombre).join(" | "));
    if (r.pausar.length) console.log("⛔ PAUSAR:", r.pausar.map((f) => f.nombre).join(" | "));
    const cp = cfg.compuertas || {};
    console.log(`Total ${preset}: gasto ${usd(r.gastoTotal)} · leads ${r.leadsTotal} · ventas ${r.ventasTotal} · ROAS ${r.roasTotal ? r.roasTotal.toFixed(1) + "x" : "—"} · CPL mediana ${r.mediana == null ? "—" : usd(r.mediana)} · compuertas ${[cp.cplMax && "CPL ≤ $" + cp.cplMax, cp.ctrMin && "CTR ≥ " + cp.ctrMin + "%", cp.costoPorSeguidorMax && "≤ $" + cp.costoPorSeguidorMax + "/seguidor"].filter(Boolean).join(", ")}`);
    if (flags.has("--json")) console.log(JSON.stringify(r, null, 2));
  } else if (cmd === "escalar") {
    // F5 · escalar VERTICAL un conjunto ganador. Regla de Elvin: Max PROPONE y pide permiso;
    // solo corre con --ok (que Max pone únicamente después del "dale" explícito de Elvin en el chat).
    // Tope +20 % por vez y no sobre conjuntos que no están activos o no tienen presupuesto propio.
    const [adsetId] = rest;
    const pct = Number(valores.pct || rest[1] || 15);
    if (!adsetId) throw new Error("Uso: escalar <adsetId> [--pct 15] --ok");
    if (!(pct > 0 && pct <= 20)) throw new Error("El método escala 10-20 % por vez (Ramiro: 10-15 %). Usa --pct entre 1 y 20.");
    const a = await c.graph("GET", "/" + adsetId, { fields: "name,daily_budget,effective_status,campaign{name}" });
    if (!a.daily_budget) throw new Error("Ese conjunto no tiene presupuesto propio (¿CBO?). Escala en la campaña a mano.");
    const antes = Number(a.daily_budget) / 100, despues = Math.round(antes * (1 + pct / 100) * 100) / 100;
    console.log(`${a.campaign?.name} → ${a.name} · ${a.effective_status} · $${antes}/día → $${despues}/día (+${pct} %)`);
    if (!flags.has("--ok")) { console.log("Propuesta, no ejecutada. Pídele el OK a Elvin; con su \"dale\" corre lo mismo con --ok."); process.exit(0); }
    await c.graph("POST", "/" + adsetId, { daily_budget: M.centavos(despues) });
    console.log(`✔ Escalado: $${despues}/día. Próxima revisión en 3-4 días (no volver a subir antes).`);
  } else if (cmd === "proponer-publicar") {
    // Max en Slack (24/sep): pide en #max-aprobaciones el "publica <id>" para campañas YA montadas en
    // borrador. Guarda los ids EXACTOS (campaña + conjuntos + anuncios) que se prenderán; `activar`
    // solo prende esos y solo si Elvin o Carilin lo autorizaron.
    const campanas = (rest[0] || "").split(",").map((x) => x.trim()).filter((x) => /^\d+$/.test(x));
    const slug = valores.cliente || cfg.clienteSlug;
    if (!campanas.length || !slug) throw new Error("Uso: proponer-publicar <campaignId,campaignId> --cliente <slug>");
    const ids = []; const lineas = []; let total = 0;
    for (const id of campanas) {
      const { camp, adsets, ads } = await M.arbolCampana(c, id);
      const suma = adsets.reduce((s, a) => s + Number(a.daily_budget || 0) / 100, 0);
      total += suma;
      ids.push({ id: camp.id, tipo: "campana" }, ...adsets.map((a) => ({ id: a.id, tipo: "conjunto" })), ...ads.map((a) => ({ id: a.id, tipo: "anuncio" })));
      lineas.push(`• ${camp.name} (${camp.objective}) · ${adsets.length} conjunto(s) · ${ads.length} anuncio(s) · $${suma}/día · hoy ${camp.status}`);
      for (const a of adsets) lineas.push(`   – ${a.name} · $${Number(a.daily_budget || 0) / 100}/día`);
    }
    if (!esCliente) await apiMax("POST", null, { accion: "cliente", slug, nombre: cfg.nombre });
    const contenido = `${lineas.join("\n")}\n\nTotal: $${Math.round(total * 100) / 100}/día (~$${Math.round(total * 30)}/mes) · cuenta ${cfg.cuentaId}\nAds Manager: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${cfg.cuentaId}&selected_campaign_ids=${campanas.join(",")}`;
    const r = await apiMax("POST", null, { accion: "proponer", cliente: slug, tipo: "publicar", titulo: valores.nombre || `Prender ${campanas.length} campaña(s) · $${Math.round(total * 100) / 100}/día`, contenido, datos: { marca, ids, campanas, totalDiario: total } });
    console.log(`✔ #${r.id} en #max-aprobaciones: "publica ${r.id}" las prende (${ids.length} objetos, $${total}/día).${r.aviso ? " ⚠ " + r.aviso : ""}`);
  } else if (cmd === "activar") {
    // Único camino para prender algo por API: una aprobación "publicar" de Elvin o Carilin en
    // #max-aprobaciones (estado aprobado) para ESTA marca. Prende exactamente sus ids: anuncios →
    // conjuntos → campaña (así nada entrega a medias).
    const id = Number(valores.item);
    if (!id) throw new Error("Uso: activar --item <id> (el #id del 🚀 aprobado en #max-aprobaciones)");
    const { item: it } = await apiMax("GET", { item: String(id) });
    if (!it) throw new Error(`No existe la #${id}.`);
    if (it.tipo !== "publicar") throw new Error(`La #${id} no es un pedido de publicar.`);
    if (it.estado !== "aprobado") throw new Error(`La #${id} está ${it.estado}: solo se prende lo que Elvin o Carilin autorizaron con "publica ${id}".`);
    if (!["elvin", "carilin"].includes(it.decidido_por)) throw new Error(`La #${id} no la autorizó Elvin ni Carilin.`);
    if (it.datos?.marca !== marca) throw new Error(`La #${id} es de ${it.datos?.marca}, no de ${marca}.`);
    const orden = { anuncio: 0, conjunto: 1, campana: 2 };
    const objetos = [...(it.datos.ids || [])].sort((a, b) => orden[a.tipo] - orden[b.tipo]);
    const hechos = []; const fallos = [];
    for (const o of objetos) {
      try { await c.graph("POST", "/" + o.id, { status: "ACTIVE" }); hechos.push(o); }
      catch (e) { fallos.push(`${o.tipo} ${o.id}: ${e.message.slice(0, 120)}`); }
    }
    const estados = [];
    for (const camp of it.datos.campanas || []) {
      const x = await c.graph("GET", "/" + camp, { fields: "name,effective_status" }).catch(() => null);
      estados.push(`${x?.name || camp}: ${x?.effective_status || "?"}`);
    }
    const resultado = `${hechos.length}/${objetos.length} activados · ${estados.join(" · ")}${fallos.length ? " · fallos: " + fallos.join(" | ") : ""}`;
    await apiMax("POST", null, { accion: "cerrar", id, estado: fallos.length && !hechos.length ? "fallido" : "ejecutado", resultado });
    console.log((fallos.length ? "⚠ " : "✔ ") + resultado);
  } else if (cmd === "pausar") {
    if (!rest[0]) throw new Error("Falta el id");
    await c.graph("POST", "/" + rest[0], { status: "PAUSED" });
    console.log("Pausado", rest[0]);
  } else if (cmd === "estrategia") {
    // EL MÉTODO DE ELVIN · 5 FASES: públicos primero → F1 tráfico · F2 ventas (≥70 %) · F3 remarketing ventas · F4 ThruPlay 365 · F5 escalar (operación).
    const t0 = Date.now();
    const opts = opcionesDesdeFlags(valores);
    const est = planEstrategia5Fases({ ...cfg, clave: marca }, opts);
    const archivo = resolve(ROOT, `data/meta-ads/campanas/${marca}-5fases-${est.fecha}${valores.nombre ? "-" + valores.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 30) : ""}.json`);
    const guardarEst = () => writeFileSync(archivo, JSON.stringify(est, null, 2) + "\n");
    if (existsSync(archivo)) { const previo = JSON.parse(readFileSync(archivo, "utf8")); if (previo.fases?.some((f) => f.meta?.campaignId)) { Object.assign(est, previo); console.log("Retomando la estrategia ya empezada (idempotente)."); } }
    guardarEst();
    const disponibles = new Map(Object.entries(cfg.publicosClave || {}));
    console.log(`${est.nombre} · $${est.presupuestoDiario}/día · destino ${est.destino}`);
    tabla(est.fases.map((f) => ({ fase: f.fase.toUpperCase(), campaña: f.nombre.slice(0, 55), modo: f.modo, conjuntos: f.conjuntos.length, "$/día": f.conjuntos.reduce((s, x) => s + Number(x.presupuestoDiario), 0), creativos: f.creativos.map((c) => c.clave).join(",") })));
    for (const [f, motivo] of Object.entries(est.omitidas || {})) console.log(`⚠ ${f.toUpperCase()} omitida: ${motivo}`);
    console.log("Públicos que se crean ANTES de lanzar:", Object.keys(est.publicosACrear).map((k) => (disponibles.has(k) ? k + " (ya existe)" : k)).join(" · "));
    // 1) Públicos primero (regla de Elvin). Un público que Meta rechace no tumba la estrategia.
    for (const [clave, def] of Object.entries(est.publicosACrear)) {
      if (disponibles.has(clave)) continue;
      if (dry) continue;
      try {
        let spec;
        if (def.tipo === "web") spec = M.specPublicoWeb({ nombre: def.nombre, pixelId: cfg.pixelId, dias: def.dias, evento: def.evento });
        else if (def.tipo === "similar") { const origen = disponibles.get(def.origen); if (!origen) throw new Error("origen " + def.origen + " no creado"); spec = M.specSimilar({ nombre: def.nombre, origenId: origen, ratio: def.ratio, pais: def.pais }); }
        else spec = M.specPublicoEngagement({ nombre: def.nombre, pageId: cfg.pageId, igUserId: cfg.igUserId, dias: def.dias, tipo: def.tipo });
        const id = await M.crearPublico(c, cfg.cuentaId, spec);
        cfg.publicosClave ||= {}; cfg.publicosClave[clave] = id; disponibles.set(clave, id); guardarPortafolio();
        console.log("  ✔ público", clave, id);
      } catch (e) { (est.publicosFallidos ||= {})[clave] = e.message.slice(0, 160); console.log("  ⚠ público", clave, "no se creó:", e.message.slice(0, 120)); }
    }
    // Los públicos que no existen (todavía) se quitan de F3/F4 en vez de romper el plan.
    const simulados = new Map([...disponibles, ...(dry ? Object.keys(est.publicosACrear).map((k) => [k, "nuevo"]) : [])]);
    for (const f of est.fases) {
      f.cuentaId ||= cfg.cuentaId; f.pixelId ||= cfg.pixelId; f.pageId ||= cfg.pageId; f.igUserId ||= cfg.igUserId;
      for (const p of Object.values(f.publicos || {})) {
        p.incluir = (p.incluir || []).filter((r) => /^\d+$/.test(String(r)) || simulados.has(r));
        p.excluir = (p.excluir || []).filter((r) => /^\d+$/.test(String(r)) || simulados.has(r));
      }
      f.topeDiario = f.conjuntos.reduce((s, x) => s + Number(x.presupuestoDiario), 0);
      const vacios = Object.entries(f.publicos || {}).filter(([, p]) => f.dependeDePublicos && !(p.incluir || []).length);
      if (vacios.length) { f.omitida = "sin públicos de remarketing creados"; continue; }
      const errores = M.validarPlan(f, { publicosDisponibles: new Map([...simulados].map(([k, v]) => [k, v === "nuevo" ? "0" : v])) });
      if (errores.length) { f.errores = errores; console.log(`✖ ${f.fase.toUpperCase()} inválida:\n - ` + errores.join("\n - ")); }
    }
    guardarEst();
    if (dry) { console.log(`[dry-run] no se creó nada · plan en ${archivo.replace(ROOT + "/", "")} · ${((Date.now() - t0) / 1000).toFixed(1)} s`); process.exit(0); }
    // 2) Las campañas, EN PAUSA, en orden de fase.
    for (const f of est.fases) {
      if (f.omitida || f.errores?.length) { console.log(`⏭ ${f.fase.toUpperCase()}: ${f.omitida || "plan inválido"}`); continue; }
      let marcador = null;
      if (f.creativos.some((x) => !x.videoId && !x.igMediaId && !x.postId)) marcador = (await M.listarVideos(c, f.cuentaId, 5))[0]?.id || null;
      try { await M.crearEnMeta(c, f, { publicosDisponibles: disponibles, videoMarcador: marcador, log: () => {} }); console.log(`✔ ${f.fase.toUpperCase()} campaña ${f.meta.campaignId} EN PAUSA`); }
      catch (e) { f.errorMeta = e.message.slice(0, 300); console.log(`✖ ${f.fase.toUpperCase()}: ${e.message.slice(0, 200)}`); }
      guardarEst();
    }
    est.creadoEl ||= new Date().toISOString(); guardarEst();
    const ids = est.fases.filter((f) => f.meta?.campaignId).map((f) => f.meta.campaignId);
    console.log(`Listo en ${((Date.now() - t0) / 1000).toFixed(0)} s · ${ids.length}/${est.fases.length} campañas EN PAUSA · plan ${archivo.replace(ROOT + "/", "")}`);
    if (ids.length) console.log(`Ads Manager: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${cfg.cuentaId}&selected_campaign_ids=${ids.join(",")}`);
    console.log("F5 (escalar): " + est.f5);
  } else if (cmd === "crear" || cmd === "crear-publicos" || cmd === "plantilla") {
    let planPath, plan;
    if (cmd === "plantilla") {
      const tipo = rest[0];
      if (!PLANTILLAS[tipo]) throw new Error("Plantilla desconocida: " + tipo + " (" + Object.keys(PLANTILLAS).join(" | ") + ")");
      plan = PLANTILLAS[tipo]({ ...cfg, clave: marca }, opcionesDesdeFlags(valores));
      planPath = resolve(ROOT, `data/meta-ads/campanas/${marca}-${tipo}-${new Date().toISOString().slice(0, 10)}${valores.nombre ? "" : ""}.json`);
      let n = 2; const basePath = planPath;
      while (existsSync(planPath) && JSON.parse(readFileSync(planPath, "utf8")).meta?.campaignId) planPath = basePath.replace(/\.json$/, `-${n++}.json`);
      writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n");
      console.log("Plan:", planPath.replace(ROOT + "/", ""));
      cmd = "crear";
    } else {
      planPath = resolve(ROOT, rest[0] || "");
      plan = JSON.parse(readFileSync(planPath, "utf8"));
    }
    plan.cuentaId ||= cfg.cuentaId; plan.pixelId ||= cfg.pixelId; plan.pageId ||= cfg.pageId; plan.igUserId ||= cfg.igUserId;
    const disponibles = new Map(Object.entries(cfg.publicosClave || {}));
    if (cmd === "crear-publicos") {
      // plan.publicosACrear: { "clave": { tipo: "web"|"engagers"|"video50"|"video25"|"mensajes"|"lista"|"similar", ... } }
      for (const [clave, def] of Object.entries(plan.publicosACrear || {})) {
        if (disponibles.has(clave)) { console.log("ya existe", clave, disponibles.get(clave)); continue; }
        let spec;
        if (def.tipo === "web") spec = M.specPublicoWeb({ nombre: def.nombre, pixelId: plan.pixelId, dias: def.dias, evento: def.evento, urlContiene: def.urlContiene });
        else if (def.tipo === "lista") spec = M.specPublicoLista({ nombre: def.nombre, descripcion: def.descripcion });
        else if (def.tipo === "similar") spec = M.specSimilar({ nombre: def.nombre, origenId: /^\d+$/.test(def.origen) ? def.origen : disponibles.get(def.origen), ratio: def.ratio, pais: def.pais });
        else spec = M.specPublicoEngagement({ nombre: def.nombre, pageId: plan.pageId, igUserId: plan.igUserId, dias: def.dias, tipo: def.tipo });
        if (def.tipo === "similar" && !spec.origin_audience_id) { console.log("⚠", clave, "origen no resuelto:", def.origen); continue; }
        console.log(dry ? "[dry-run] crearía" : "creando", clave, JSON.stringify(spec).slice(0, 160));
        if (!dry) { const id = await M.crearPublico(c, plan.cuentaId, spec); cfg.publicosClave[clave] = id; disponibles.set(clave, id); guardarPortafolio(); console.log("  ✔", id); }
      }
    } else {
      const errores = M.validarPlan(plan, { publicosDisponibles: disponibles });
      if (errores.length) { console.error("Plan inválido:\n - " + errores.join("\n - ")); process.exit(3); }
      const arbol = M.expandirPlan(plan, { publicosDisponibles: disponibles });
      const suma = plan.conjuntos.reduce((s, x) => s + Number(x.presupuestoDiario), 0);
      console.log(`Campaña: ${plan.nombre} · ${arbol.campana.objective} · ${plan.modo || "leads"} · ${arbol.conjuntos.length} conjuntos · $${suma}/día (tope $${plan.topeDiario})`);
      tabla(arbol.conjuntos.map((n) => ({
        clave: n.clave, conjunto: n.adset.name.slice(0, 50), "$/día": Number(n.adset.daily_budget) / 100, creativo: n.creativo.clave, video: n.creativo.existente || n.creativo.videoId || "marcador",
        incluye: (n.adset.targeting.custom_audiences || []).map((x) => x.id).join("|"), excluye: (n.adset.targeting.excluded_custom_audiences || []).map((x) => x.id).join("|"),
        intereses: (n.adset.targeting.flexible_spec?.[0]?.interests || []).map((i) => i.name).join(",").slice(0, 40), advantage: n.adset.targeting.targeting_automation.advantage_audience,
      })));
      if (dry) { console.log("[dry-run] no se creó nada."); process.exit(0); }
      let marcador = plan.videoMarcador || null;
      if (!marcador && plan.creativos.some((x) => !x.videoId && !x.igMediaId && !x.postId)) {
        const vids = await M.listarVideos(c, plan.cuentaId, 5);
        marcador = vids[0]?.id || null;
        console.log("Video marcador:", marcador, vids[0]?.title || "");
      }
      await M.crearEnMeta(c, plan, { publicosDisponibles: disponibles, videoMarcador: marcador });
      plan.creadoEl ||= new Date().toISOString();
      writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n");
      console.log(`✔ Campaña ${plan.meta.campaignId} montada EN PAUSA. Ads Manager: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${plan.cuentaId}&selected_campaign_ids=${plan.meta.campaignId}`);
    }
  } else if (cmd === "subir-lista") {
    const [publicoId, csv] = rest;
    const filas = readFileSync(resolve(ROOT, csv), "utf8").split(/\r?\n/).slice(1).map((l) => l.split(",")).filter((r) => r.length >= 1);
    const out = await M.subirLista(c, publicoId, filas.map((r) => [r[0], r[1] || ""]));
    console.log("Subidas", filas.length, "filas →", JSON.stringify(out).slice(0, 300));
  } else {
    console.error("Comando desconocido:", cmd);
    process.exit(1);
  }
} catch (e) {
  console.error("✖", e.message, e.code ? `(código Meta ${e.code}${e.subcode ? "/" + e.subcode : ""})` : "");
  process.exit(1);
}
