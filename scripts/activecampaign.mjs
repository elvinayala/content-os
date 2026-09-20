#!/usr/bin/env node
// Monta el ecosistema de email en ActiveCampaign a partir de data/email-ecosistema/blueprint.json.
//
//   node scripts/activecampaign.mjs estado              # ¿hay API? ¿qué listas/tags existen?
//   node scripts/activecampaign.mjs setup               # crea listas, tags y campos (idempotente) → imprime AC_LISTA_*
//   node scripts/activecampaign.mjs newsletter <lu|aib> [YYYY-MM-DD 08:00]   # crea la campaña del último newsletter APROBADO de la bandeja (borrador o programada)
//   node scripts/activecampaign.mjs contacto <email> <lu|aib> [tag,tag]      # prueba de upsert
//
// Requiere en .env.local: ACTIVECAMPAIGN_URL (https://<cuenta>.api-us1.com) y ACTIVECAMPAIGN_KEY
// (Settings → Developer). Las automatizaciones (secuencias) NO se crean por API: se arman en la
// UI con el copy de vault/proyectos/ecosistema/emails/<marca>/ (ver README ahí).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try { const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } catch {}
  return "";
}
const URL = env("ACTIVECAMPAIGN_URL").replace(/\/$/, ""), KEY = env("ACTIVECAMPAIGN_KEY");
if (!URL || !KEY) { console.error("❌ Falta ACTIVECAMPAIGN_URL / ACTIVECAMPAIGN_KEY en .env.local (Settings → Developer en ActiveCampaign)"); process.exit(1); }
const bp = JSON.parse(fs.readFileSync(path.join(ROOT, "data/email-ecosistema/blueprint.json"), "utf8"));
async function v3(method, ruta, body) {
  const r = await fetch(`${URL}/api/3/${ruta}`, { method, headers: { "Api-Token": KEY, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${method} ${ruta} → ${r.status} ${j.errors?.[0]?.title ?? JSON.stringify(j).slice(0, 200)}`); return j;
}
const cmd = process.argv[2];
try {
  if (cmd === "estado") {
    const l = await v3("GET", "lists?limit=100"); const t = await v3("GET", "tags?limit=100"); const f = await v3("GET", "fields?limit=100");
    console.log("Listas:"); for (const x of l.lists) console.log(`  ${x.id}  ${x.name}`);
    console.log(`Tags (${t.meta?.total ?? t.tags.length}):`, t.tags.map((x) => x.tag).join(", "));
    console.log("Campos:", f.fields.map((x) => `${x.id}:${x.title}`).join(", "));
  } else if (cmd === "setup") {
    const existentes = (await v3("GET", "lists?limit=100")).lists;
    const salida = [];
    for (const L of bp.listas) {
      let lista = existentes.find((x) => x.name === L.nombre);
      if (!lista) { lista = (await v3("POST", "lists", { list: { name: L.nombre, stringid: L.clave === "lu" ? "level-up" : L.clave === "aib" ? "ai-borinquen" : "shadow-operator", sender_url: "https://levelupmediapr.net", sender_reminder: "Te suscribiste desde nuestro contenido, el diagnóstico o al agendar una llamada." } })).list; console.log(`✓ lista creada: ${L.nombre} (${lista.id})`); }
      else console.log(`= lista existe: ${L.nombre} (${lista.id})`);
      salida.push(`${L.env}=${lista.id}`);
    }
    const tagsAll = Object.values(bp.tags).flat().filter((t) => !t.includes("<"));
    const existT = (await v3("GET", "tags?limit=100")).tags.map((x) => x.tag);
    for (const t of tagsAll) { if (!existT.includes(t)) { await v3("POST", "tags", { tag: { tag: t, tagType: "contact" } }); console.log(`✓ tag ${t}`); } }
    const existF = (await v3("GET", "fields?limit=100")).fields.map((x) => x.title);
    for (const c of bp.campos) { if (!existF.includes(c.nombre)) { await v3("POST", "fields", { field: { type: c.tipo, title: c.nombre, visible: 1 } }); console.log(`✓ campo ${c.nombre}`); } }
    console.log("\nPegá en .env.local y en Vercel:\n" + salida.join("\n"));
  } else if (cmd === "contacto") {
    const [email, marca, tags] = process.argv.slice(3);
    const lista = env(marca === "aib" ? "AC_LISTA_AIB" : marca === "so" ? "AC_LISTA_SO" : "AC_LISTA_LU");
    const c = (await v3("POST", "contact/sync", { contact: { email } })).contact;
    if (lista) await v3("POST", "contactLists", { contactList: { list: Number(lista), contact: Number(c.id), status: 1 } }).catch(() => {});
    for (const t of [`marca:${marca}`, ...(tags ? tags.split(",") : [])]) {
      const found = (await v3("GET", `tags?search=${encodeURIComponent(t)}`)).tags.find((x) => x.tag === t);
      const id = found ? found.id : (await v3("POST", "tags", { tag: { tag: t, tagType: "contact" } })).tag.id;
      await v3("POST", "contactTags", { contactTag: { contact: Number(c.id), tag: Number(id) } }).catch(() => {});
    }
    console.log(`✓ contacto ${c.id} en lista ${lista || "(sin lista)"} con tags`);
  } else if (cmd === "newsletter") {
    const marca = process.argv[3] === "aib" ? "ai-borinquen" : "level-up";
    const cuando = process.argv[4] ? `${process.argv[4]} ${process.argv[5] ?? "08:00"}:00` : "";
    const e = JSON.parse(fs.readFileSync(path.join(ROOT, "data/entregas.json"), "utf8")).entregas
      .filter((x) => x.tipo === "email" && x.marca === marca && x.lista === "newsletter-general" && x.estado === "aprobado")
      .sort((a, b) => (b.creadoEl || "").localeCompare(a.creadoEl || ""))[0];
    if (!e) { console.error("❌ No hay newsletter APROBADO en la bandeja para esa marca"); process.exit(1); }
    const L = bp.listas.find((x) => x.clave === (marca === "level-up" ? "lu" : "aib"));
    const lista = env(L.env); if (!lista) { console.error(`❌ Falta ${L.env} (corre setup)`); process.exit(1); }
    const md = e.contenido || ""; const asunto = (md.match(/##\s*Asunto[^\n]*\n+\s*(?:1\.\s*)?([^\n]+)/i)?.[1] || e.titulo).replace(/^["“]|["”]$/g, "").trim();
    const cuerpo = (md.split(/##\s*Cuerpo/i)[1] || md).split(/##\s*CTA/i)[0].trim();
    const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.55;max-width:600px;margin:0 auto;color:#1a1a1a">` + cuerpo.split(/\n\n+/).map((p) => `<p>${p.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>`).join("") + `</div>`;
    const v1 = async (action, form) => { const r = await fetch(`${URL}/admin/api.php?api_key=${KEY}&api_action=${action}&api_output=json`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form) }); const j = await r.json(); if (j.result_code !== 1) throw new Error(`${action}: ${j.result_message}`); return j; };
    const m = await v1("message_create", { format: "mime", subject: asunto, fromemail: L.from.email, fromname: L.from.nombre, reply2: L.from.email, priority: "3", charset: "utf-8", encoding: "quoted-printable", htmlconstructor: "editor", html, textconstructor: "editor", text: cuerpo, [`p[${lista}]`]: lista });
    const c = await v1("campaign_create", { type: "single", name: `${bp.automatizaciones.find((a) => a.clave === "newsletter").nombre[marca === "level-up" ? "lu" : "aib"]} · ${new Date().toISOString().slice(0, 10)}`, sdate: cuando, status: cuando ? "1" : "0", public: "1", tracklinks: "all", trackreads: "1", [`p[${lista}]`]: lista, [`m[${m.id}]`]: "100" });
    console.log(`✓ Campaña ${c.id} (${cuando ? "programada " + cuando : "BORRADOR"}) — asunto: ${asunto}`);
  } else console.log("Uso: estado | setup | contacto <email> <lu|aib> [tags] | newsletter <lu|aib> [YYYY-MM-DD HH:MM]");
} catch (e) { console.error("❌", e.message); process.exit(1); }
