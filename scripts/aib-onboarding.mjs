#!/usr/bin/env node
// Onboarding de AI Borinquen por WhatsApp (Zernio). El agente vive en lib/aib-onboarding/ y corre en
// Vercel (webhook /api/aib/whatsapp + cron /api/cron/aib-onboarding a las 10 AM PR). Este script es
// para prepararlo:
//
//   node scripts/aib-onboarding.mjs telefonos            → propone teléfono/email de cada cliente activo
//                                                          del tablero AI BORINQUEN buscándolo en Pipedrive AIB
//   node scripts/aib-onboarding.mjs telefonos --escribir → agrega las columnas Teléfono/E-mail al tablero
//                                                          (si faltan) y guarda SOLO los que coinciden seguro
//   node scripts/aib-onboarding.mjs plantillas           → estado de las 3 plantillas en Zernio
//   node scripts/aib-onboarding.mjs plantillas crear     → las crea en Zernio (Meta las revisa)
//   node scripts/aib-onboarding.mjs simular              → corre el cron de prod y muestra qué mandaría hoy
//
// Env: DATABASE_URL, PIPEDRIVE_AIB_TOKEN, AIB_ZERNIO_ACCOUNT_ID, ZERNIO_API_KEY (o AIB_ZERNIO_API_KEY),
// CRON_SECRET.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const PROD = (env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const telNorm = (v) => { const d = String(v || "").replace(/\D/g, ""); return d.length === 10 ? `1${d}` : d.length >= 11 && d.length <= 15 ? d : null; };

async function db() {
  const { default: postgres } = await import("postgres");
  return postgres(env("DATABASE_URL_DIRECT") || env("DATABASE_URL"), { prepare: false, max: 2 });
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function pipedrive(token, ruta, params = {}) {
  const u = new URL(`https://api.pipedrive.com/v1${ruta}`);
  u.searchParams.set("api_token", token);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (let intento = 0; intento < 4; intento++) {
    await pausa(700); // Pipedrive corta con 429 si se le pega en ráfaga
    const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
    if (r.status === 429) { await pausa(4000 * (intento + 1)); continue; }
    if (!r.ok) throw new Error(`Pipedrive ${r.status} ${ruta}`);
    return r.json();
  }
  throw new Error(`Pipedrive 429 persistente ${ruta}`);
}

// Busca al cliente por su nombre y por la empresa; "seguro" = el nombre completo coincide y hay 1 solo teléfono.
async function buscarEnPipedrive(nombre, empresa) {
  const vistos = new Map();
  const tokens = [env("PIPEDRIVE_AIB_TOKEN"), env("PIPEDRIVE_LEVELUP_TOKEN")].filter(Boolean);
  for (const [i, token] of tokens.entries()) for (const term of [nombre, empresa].filter((t) => t && t.length >= 3)) {
    const j = await pipedrive(token, "/persons/search", { term: term.slice(0, 60), limit: "5" });
    for (const { item } of j.data?.items ?? []) vistos.set(`${i}:${item.id}`, item);
  }
  const candidatos = [...vistos.values()].map((p) => ({
    id: p.id,
    nombre: p.name,
    org: p.organization?.name ?? "",
    tel: (p.phones ?? []).map(telNorm).filter(Boolean)[0] ?? null,
    email: (p.emails ?? [])[0] ?? null,
  }));
  const n = norm(nombre);
  const exacto = candidatos.filter((c) => c.tel && (norm(c.nombre) === n || (empresa && norm(c.org) === norm(empresa) && norm(c.nombre).split(" ")[0] === n.split(" ")[0])));
  const telsDistintos = new Set(exacto.map((c) => c.tel));
  return { candidatos, seguro: exacto.length && telsDistintos.size === 1 ? exacto[0] : null };
}

async function telefonos(escribir) {
  const sql = await db();
  const [board] = await sql`select id from pulse_boards where slug = 'ai-borinquen'`;
  const cols = await sql`select id, title, type, position from pulse_columns where board_id = ${board.id} order by position`;
  const grupos = await sql`select id, title from pulse_groups where board_id = ${board.id}`;
  const fuera = new Set(grupos.filter((g) => /offboarded|inner circle/i.test(g.title)).map((g) => g.id));
  const grupo = new Map(grupos.map((g) => [g.id, g.title]));
  let cTel = cols.find((c) => /^(tel[eé]fono|whatsapp)$/i.test(c.title.trim()));
  let cEmail = cols.find((c) => /^(e-?mail|correo)$/i.test(c.title.trim()));
  const cEmpresa = cols.find((c) => c.title.trim() === "Empresa");
  if (escribir) {
    let pos = Math.max(0, ...cols.map((c) => c.position)) + 1024;
    if (!cTel) [cTel] = await sql`insert into pulse_columns (board_id, title, type, settings, position, width) values (${board.id}, 'Teléfono', 'phone', ${sql.json({})}, ${pos}, 150) returning id, title`, pos += 1024;
    if (!cEmail) [cEmail] = await sql`insert into pulse_columns (board_id, title, type, settings, position, width) values (${board.id}, 'E-mail', 'email', ${sql.json({})}, ${pos}, 220) returning id, title`;
    console.log(`Columnas listas: Teléfono (${cTel.id}) · E-mail (${cEmail.id})\n`);
  } else if (!cTel) console.log("(El tablero todavía no tiene columna Teléfono: con --escribir se crea.)\n");

  const items = await sql`select id, name, group_id, values from pulse_items where board_id = ${board.id} order by name`;
  // Muchos clientes de AIB también son (o fueron) de Level Up: su teléfono está en ese tablero.
  const [lu] = await sql`select id from pulse_boards where slug = 'level-up-media'`;
  const colsLu = await sql`select id, title from pulse_columns where board_id = ${lu.id}`;
  const luTel = colsLu.find((c) => c.title.trim() === "Teléfono"), luEmail = colsLu.find((c) => c.title.trim() === "E-mail"), luEmp = colsLu.find((c) => c.title.trim() === "Empresa");
  const itemsLu = await sql`select name, values from pulse_items where board_id = ${lu.id}`;
  const deLevelUp = (nombre, empresa) => {
    const hits = itemsLu.filter((x) => norm(x.name) === norm(nombre) || (empresa && luEmp && norm(x.values?.[luEmp.id]) === norm(empresa) && norm(x.name).split(" ")[0] === norm(nombre).split(" ")[0]));
    const tels = [...new Set(hits.map((x) => telNorm(x.values?.[luTel.id])).filter(Boolean))];
    if (tels.length !== 1) return null;
    const h = hits.find((x) => telNorm(x.values?.[luTel.id]) === tels[0]);
    return { tel: tels[0], email: luEmail ? h.values?.[luEmail.id] || null : null, fuente: "Pulse Level Up" };
  };
  let seguros = 0, dudosos = 0, nada = 0, yaTenian = 0;
  for (const it of items) {
    if (fuera.has(it.group_id)) continue;
    const v = it.values || {};
    if (cTel && telNorm(v[cTel.id])) { yaTenian++; continue; }
    const empresa = cEmpresa ? v[cEmpresa.id] : null;
    const desdeLu = deLevelUp(it.name, empresa);
    const { candidatos, seguro } = desdeLu ? { candidatos: [], seguro: desdeLu } : await buscarEnPipedrive(it.name, empresa);
    if (seguro) {
      seguros++;
      console.log(`✓ ${it.name}${empresa ? ` (${empresa})` : ""} · ${grupo.get(it.group_id)} → +${seguro.tel}${seguro.email ? ` · ${seguro.email}` : ""} [${seguro.fuente || "Pipedrive"}]`);
      if (escribir) {
        const patch = { [cTel.id]: `+${seguro.tel}`, ...(seguro.email && cEmail && !v[cEmail.id] ? { [cEmail.id]: seguro.email } : {}) };
        await sql`update pulse_items set values = values || ${sql.json(patch)}, updated_at = now() where id = ${it.id}`;
      }
    } else if (candidatos.length) {
      dudosos++;
      console.log(`? ${it.name}${empresa ? ` (${empresa})` : ""} → posibles: ${candidatos.slice(0, 3).map((c) => `${c.nombre}${c.org ? ` [${c.org}]` : ""} ${c.tel ? "+" + c.tel : "sin tel"}`).join(" · ")}`);
    } else {
      nada++;
      console.log(`✗ ${it.name}${empresa ? ` (${empresa})` : ""} → no está en Pipedrive AIB`);
    }
  }
  console.log(`\nSeguros ${seguros}${escribir ? " (guardados)" : ""} · dudosos ${dudosos} · sin match ${nada} · ya tenían teléfono ${yaTenian}`);
  console.log("Los dudosos y los sin match los completa Ángela a mano en la columna Teléfono del tablero AI BORINQUEN.");
  await sql.end();
}

async function zernio(ruta, init = {}) {
  const key = env("AIB_ZERNIO_API_KEY") || env("ZERNIO_API_KEY");
  const r = await fetch(`https://zernio.com/api/v1${ruta}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(20000) });
  const t = await r.text();
  if (!r.ok) throw new Error(`Zernio ${r.status} ${ruta}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
}

async function plantillas(crear) {
  const accountId = env("AIB_ZERNIO_ACCOUNT_ID");
  if (!accountId) throw new Error("Falta AIB_ZERNIO_ACCOUNT_ID (el número de WhatsApp de AIB conectado en Zernio).");
  // Las plantillas viven en lib/aib-onboarding/plantillas.ts (TS): se leen de ahí como texto.
  const src = fs.readFileSync(path.join(ROOT, "lib/aib-onboarding/plantillas.ts"), "utf8");
  const bloque = src.slice(src.indexOf("export const PLANTILLAS"), src.indexOf("} satisfies"));
  const PL = new Function(`return ${bloque.replace("export const PLANTILLAS =", "").trim()}}`)();
  const existentes = (await zernio(`/whatsapp/templates?accountId=${accountId}`)).data ?? [];
  for (const p of Object.values(PL)) {
    const e = existentes.find((x) => x.name === p.nombre);
    if (e) { console.log(`= ${p.nombre}: ${e.status}`); continue; }
    if (!crear) { console.log(`· ${p.nombre}: no existe (usa "plantillas crear")`); continue; }
    await zernio("/whatsapp/templates", { method: "POST", body: JSON.stringify({ accountId, name: p.nombre, category: p.categoria, language: "es", components: [{ type: "body", text: p.texto, example: { body_text: [p.ejemplo] } }] }) });
    console.log(`✓ ${p.nombre}: enviada a revisión de Meta`);
  }
}

async function simular() {
  const r = await fetch(`${PROD}/api/cron/aib-onboarding`, { headers: { Authorization: `Bearer ${env("CRON_SECRET")}` }, signal: AbortSignal.timeout(120000) });
  console.log(JSON.stringify(await r.json(), null, 2));
}

const [cmd, arg] = process.argv.slice(2);
try {
  if (cmd === "telefonos") await telefonos(process.argv.includes("--escribir"));
  else if (cmd === "plantillas") await plantillas(arg === "crear");
  else if (cmd === "simular") await simular();
  else { console.error("Comandos: telefonos [--escribir] | plantillas [crear] | simular"); process.exit(1); }
} catch (e) { console.error(`aib-onboarding: ${e.message}`); process.exit(1); }
