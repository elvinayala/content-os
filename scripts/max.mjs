#!/usr/bin/env node
// Las manos de MAX en Slack (Elvin, 24/sep/2026: "Max debe de vivir en Slack"). Habla con
// /api/max (CONTENT_OS_URL + CRON_SECRET). Max NO puede escribirle al cliente con esto: solo
// PROPONE (va a #max-aprobaciones) y deja notas ahí. Lo que llega al cliente lo publica el servidor
// cuando Elvin o Carilin dicen "ok <id>".
//
//   node scripts/max.mjs clientes                                   expedientes (slug, canal, etapa)
//   node scripts/max.mjs cliente <slug>                             expediente completo (ficha, meta)
//   node scripts/max.mjs alta <slug> --nombre "Negocio (Persona)" [--canal C…]
//   node scripts/max.mjs canales [filtro]                           canales donde está el bot (para vincular)
//   node scripts/max.mjs vincular <slug> <C…|nombre-del-canal>      liga el canal de Slack del cliente
//   node scripts/max.mjs etapa <slug> <onboarding|estrategia|estrategia-aprobada|creativos|campanas|activo|pausado>
//   node scripts/max.mjs ficha <slug> '<json>'                      fusiona datos en la ficha
//   node scripts/max.mjs meta <slug> --cuenta act_… --pagina … [--ig …] [--pixel …] [--minimo 10]
//   node scripts/max.mjs leer <slug> [n]                            últimos mensajes del canal del cliente
//   node scripts/max.mjs hilo <ts> [--canal <slug|C…>]              un hilo (por defecto de #max-aprobaciones)
//   node scripts/max.mjs llamada "<nombre o negocio>"               resumen de la llamada de venta (Fathom)
//   node scripts/max.mjs proponer <slug> <mensaje|plan|creativos|campana|interno> --titulo "…" --texto "…" [--hilo <ts del cliente>] [--nota "…"] [--imagenes url1,url2] [--videos url1]
//   node scripts/max.mjs pendientes [slug]                          lo que espera OK
//   node scripts/max.mjs item <id>
//   node scripts/max.mjs nota "<texto>" [--hilo <ts>]               hablar con Elvin/Carilin en #max-aprobaciones
//   node scripts/max.mjs cerrar <id> ejecutado|fallido "<resultado>"
//   node scripts/max.mjs enviar <id>                                reintenta enviar algo YA aprobado
//   node scripts/max.mjs carpeta <slug>                             carpeta de Drive del cliente (la crea si no existe; Pulse + Slack)
//   node scripts/max.mjs drive-doc <slug> <branding|estrategia|creativos|videos|reportes|documentos> --titulo "…" --texto "…"
//   node scripts/max.mjs drive-archivo <slug> <subcarpeta> --url https://… [--nombre archivo.png]   (flyer/imagen/video de fal…)
//   node scripts/max.mjs drive-listar <slug>                        qué hay en la carpeta
// ("publicar" no se propone aquí: lo crea meta-ads.mjs proponer-publicar con los ids exactos.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const BASE = (env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
const SECRETO = env("CRON_SECRET");

const CON_VALOR = new Set(["nombre", "canal", "titulo", "texto", "hilo", "nota", "cuenta", "pagina", "ig", "pixel", "minimo", "url", "imagenes", "videos"]);
const pos = [];
const val = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--") && CON_VALOR.has(a.slice(2).split("=")[0])) {
    const [k, inline] = a.slice(2).split("=");
    val[k] = inline ?? argv[++i];
  } else pos.push(a);
}
const [cmd, ...rest] = pos;

async function api(metodo, q, cuerpo) {
  if (!SECRETO) throw new Error("Falta CRON_SECRET");
  const url = `${BASE}/api/max${q ? "?" + new URLSearchParams(q) : ""}`;
  const r = await fetch(url, { method: metodo, headers: { "x-cron-secret": SECRETO, "Content-Type": "application/json" }, body: cuerpo ? JSON.stringify(cuerpo) : undefined, signal: AbortSignal.timeout(60000) });
  const j = await r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` }));
  if (!r.ok || j.ok === false) throw new Error(j.error || j.texto || `HTTP ${r.status}`);
  return j;
}
const salir = (msg, code = 1) => { console.error("✖", msg); process.exit(code); };

try {
  switch (cmd) {
    case "clientes": {
      const { clientes } = await api("GET", { clientes: "1" });
      if (!clientes.length) console.log("Sin clientes todavía.");
      for (const c of clientes) console.log(`${c.slug} · ${c.nombre} · etapa ${c.etapa} · canal ${c.canal || "SIN VINCULAR"}`);
      break;
    }
    case "cliente": {
      if (!rest[0]) salir("Uso: cliente <slug>");
      const { cliente } = await api("GET", { cliente: rest[0] });
      console.log(cliente ? JSON.stringify(cliente, null, 2) : `No existe ${rest[0]}.`);
      break;
    }
    case "alta": {
      if (!rest[0] || !val.nombre) salir('Uso: alta <slug> --nombre "…" [--canal C…]');
      const { cliente } = await api("POST", null, { accion: "cliente", slug: rest[0], nombre: val.nombre, canal: val.canal });
      console.log(`✔ ${cliente.slug} · ${cliente.nombre} · canal ${cliente.canal || "sin vincular"}`);
      break;
    }
    case "canales": {
      const { canales } = await api("GET", { canales: "1" });
      const f = (rest[0] || "").toLowerCase();
      for (const c of canales.filter((x) => !f || x.nombre.includes(f))) console.log(`${c.id} · #${c.nombre} · ${c.miembros} miembros`);
      break;
    }
    case "vincular": {
      const [slug, canalArg] = rest;
      if (!slug || !canalArg) salir("Uso: vincular <slug> <C…|nombre-del-canal>");
      let canal = canalArg.replace(/^#/, "");
      if (!/^[CG][A-Z0-9]{6,}$/.test(canal)) {
        const { canales } = await api("GET", { canales: "1" });
        const hit = canales.find((c) => c.nombre === canal.toLowerCase());
        if (!hit) salir(`El bot no está en #${canal}. Pide que lo inviten (/invite @Command Center) y vuelve a correr esto.`);
        canal = hit.id;
      }
      const { cliente } = await api("POST", null, { accion: "cliente", slug, canal });
      console.log(`✔ ${cliente.slug} ↔ ${canal}`);
      break;
    }
    case "etapa": {
      const [slug, etapa] = rest;
      if (!slug || !etapa) salir("Uso: etapa <slug> <etapa>");
      await api("POST", null, { accion: "cliente", slug, etapa });
      console.log(`✔ ${slug} → ${etapa}`);
      break;
    }
    case "ficha": {
      const [slug, json] = rest;
      if (!slug || !json) salir("Uso: ficha <slug> '<json>'");
      let ficha;
      try { ficha = JSON.parse(json); } catch { salir("La ficha tiene que ser JSON válido."); }
      await api("POST", null, { accion: "cliente", slug, ficha });
      console.log(`✔ ficha de ${slug}: ${Object.keys(ficha).join(", ")}`);
      break;
    }
    case "meta": {
      const slug = rest[0];
      if (!slug || !val.cuenta) salir("Uso: meta <slug> --cuenta act_… --pagina … [--ig …] [--pixel …] [--minimo 10]");
      const meta = { cuentaId: String(val.cuenta).replace(/^act_/, ""), pageId: val.pagina, igUserId: val.ig, pixelId: val.pixel, minPorConjunto: val.minimo ? Number(val.minimo) : undefined };
      for (const k of Object.keys(meta)) if (meta[k] === undefined) delete meta[k];
      await api("POST", null, { accion: "cliente", slug, meta });
      console.log(`✔ Meta de ${slug}: ${JSON.stringify(meta)} → ya puedes usar node scripts/meta-ads.mjs cliente:${slug} …`);
      break;
    }
    case "leer": {
      if (!rest[0]) salir("Uso: leer <slug> [n]");
      console.log((await api("GET", { leer: rest[0], n: rest[1] || "30" })).texto);
      break;
    }
    case "hilo": {
      if (!rest[0]) salir("Uso: hilo <ts> [--canal <slug|C…>]");
      console.log((await api("GET", { hilo: rest[0], ...(val.canal ? { canal: val.canal } : {}) })).texto);
      break;
    }
    case "llamada": {
      if (!rest.length) salir('Uso: llamada "<nombre o negocio>"');
      console.log((await api("GET", { llamadas: rest.join(" ") })).texto);
      break;
    }
    case "proponer": {
      const [slug, tipo] = rest;
      if (!slug || !tipo || !val.texto) salir('Uso: proponer <slug> <mensaje|plan|creativos|campana|interno> --titulo "…" --texto "…" [--hilo ts] [--nota "…"]');
      if (tipo === "publicar") salir("Publicar se propone con: node scripts/meta-ads.mjs <marca|cliente:slug> proponer-publicar <campaignIds> --cliente <slug>");
      // --imagenes / --videos: los flyers y videos (URLs de fal) se ven dentro del mensaje de aprobación.
      const lista = (v) => String(v || "").split(",").map((x) => x.trim()).filter((x) => /^https:\/\//.test(x));
      const datos = val.imagenes || val.videos ? { imagenes: lista(val.imagenes), videos: lista(val.videos) } : undefined;
      const r = await api("POST", null, { accion: "proponer", cliente: slug, tipo, titulo: val.titulo || "", contenido: val.texto, hilo: val.hilo, nota: val.nota, datos });
      console.log(`✔ #${r.id} en #max-aprobaciones (${tipo} · ${slug}). Esperando el ok de Elvin o Carilin.${r.aviso ? " ⚠ " + r.aviso : ""}`);
      break;
    }
    case "pendientes": {
      const { items } = await api("GET", { items: "esperando", ...(rest[0] ? { cliente: rest[0] } : {}) });
      if (!items.length) console.log("Nada esperando OK.");
      for (const i of items) console.log(`#${i.id} · ${i.tipo} · ${i.cliente} · ${i.titulo || i.contenido.slice(0, 60)} · ${String(i.creado_el).slice(0, 16)}`);
      break;
    }
    case "item": {
      const { item } = await api("GET", { item: rest[0] });
      console.log(item ? JSON.stringify(item, null, 2) : "No existe.");
      break;
    }
    case "nota": {
      const texto = rest.join(" ") || val.texto;
      if (!texto) salir('Uso: nota "<texto>" [--hilo ts]');
      await api("POST", null, { accion: "nota", texto: `${texto}\n— Max`, hilo: val.hilo });
      console.log("✔ nota en #max-aprobaciones");
      break;
    }
    case "cerrar": {
      const [id, estado, ...res] = rest;
      if (!id || !estado) salir('Uso: cerrar <id> ejecutado|fallido "<resultado>"');
      await api("POST", null, { accion: "cerrar", id: Number(id), estado, resultado: res.join(" ") });
      console.log(`✔ #${id} ${estado}`);
      break;
    }
    case "enviar": {
      const r = await api("POST", null, { accion: "enviar", id: Number(rest[0]) });
      console.log(r.texto);
      break;
    }
    case "carpeta": {
      if (!rest[0]) salir("Uso: carpeta <slug>");
      const r = await api("POST", null, { accion: "drive-carpeta", cliente: rest[0], hilo: val.hilo });
      console.log(`${r.nueva ? "✔ Carpeta creada" : "✔ Ya existía"}: ${r.carpeta.url} · Pulse: ${r.pulse}`);
      break;
    }
    case "drive-doc": {
      const [slug, sub] = rest;
      if (!slug || !sub || !val.texto) salir('Uso: drive-doc <slug> <subcarpeta> --titulo "…" --texto "…"');
      const r = await api("POST", null, { accion: "drive-doc", cliente: slug, sub, nombre: val.titulo || "Documento", texto: val.texto });
      console.log(`✔ Doc en Drive: ${r.url}`);
      break;
    }
    case "drive-archivo": {
      const [slug, sub] = rest;
      if (!slug || !sub || !val.url) salir("Uso: drive-archivo <slug> <subcarpeta> --url https://… [--nombre x.png]");
      const r = await api("POST", null, { accion: "drive-archivo", cliente: slug, sub, url: val.url, nombre: val.nombre });
      console.log(`✔ Archivo en Drive: ${r.url}`);
      break;
    }
    case "drive-listar": {
      if (!rest[0]) salir("Uso: drive-listar <slug>");
      const { archivos } = await api("POST", null, { accion: "drive-listar", cliente: rest[0] });
      if (!archivos.length) console.log("La carpeta está vacía (o todavía no existe).");
      for (const a of archivos) console.log(`${a.carpeta || "(raíz)"} · ${a.nombre} · ${a.url}`);
      break;
    }
    default:
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//   ")).map((l) => l.slice(5)).join("\n"));
  }
} catch (e) {
  salir(e.message);
}
