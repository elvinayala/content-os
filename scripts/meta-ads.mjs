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
//
// Token: variable de entorno que indica portafolio.json (META_ADS_TOKEN…); si no está en el
// entorno se lee de .env.local. Nunca se imprime.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as M from "./meta-ads/core.mjs";
import { PLANTILLAS, opcionesDesdeFlags } from "./meta-ads/plantillas.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTAFOLIO = resolve(ROOT, "data/meta-ads/portafolio.json");
const args = process.argv.slice(2);
// Flags booleanas (--dry-run) y con valor (--reels a,b · --presupuesto 15 · --edad 18-35 · --url …).
const CON_VALOR = new Set(["reels", "posts", "videos", "presupuesto", "edad", "url", "nombre", "cta", "excluir"]);
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

const portafolio = JSON.parse(readFileSync(PORTAFOLIO, "utf8"));
const cfg = portafolio.marcas[marca];
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
const guardarPortafolio = () => { portafolio.actualizadoEl = new Date().toISOString().slice(0, 10); writeFileSync(PORTAFOLIO, JSON.stringify(portafolio, null, 2) + "\n"); };
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
    tabla(r.filas.map((f) => ({ nombre: f.nombre.slice(0, 40), gasto: usd(f.gasto), impr: num(f.impresiones), ctr: f.ctr.toFixed(2) + "%", cpc: usd(f.cpc), clics: f.clicsEnlace, seguidores: f.seguidores, "$/seguidor": f.costoSeguidor == null ? "—" : usd(f.costoSeguidor), conv: f.conversaciones, leads: f.leads, cpl: f.cpl == null ? "—" : usd(f.cpl), recomendacion: f.recomendacion })));
    const cp = cfg.compuertas || {};
    console.log(`Total ${preset}: gasto ${usd(r.gastoTotal)} · leads ${r.leadsTotal} · CPL mediana ${r.mediana == null ? "—" : usd(r.mediana)} · compuertas ${[cp.cplMax && "CPL ≤ $" + cp.cplMax, cp.ctrMin && "CTR ≥ " + cp.ctrMin + "%", cp.costoPorSeguidorMax && "≤ $" + cp.costoPorSeguidorMax + "/seguidor"].filter(Boolean).join(", ")}`);
    if (flags.has("--json")) console.log(JSON.stringify(r, null, 2));
  } else if (cmd === "pausar") {
    if (!rest[0]) throw new Error("Falta el id");
    await c.graph("POST", "/" + rest[0], { status: "PAUSED" });
    console.log("Pausado", rest[0]);
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
