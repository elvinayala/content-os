#!/usr/bin/env node
// Onboarding de AI Borinquen por WhatsApp (Zernio). Igual que Level Up: quien agenda el onboarding en el
// Calendly de AI Borinquen ya es cliente. El agente vive en lib/aib-onboarding/ y corre en Vercel
// (webhooks /api/aib/calendly y /api/aib/whatsapp + cron /api/cron/aib-onboarding a las 10 AM PR).
// Este script es para prepararlo:
//
//   node scripts/aib-onboarding.mjs calendly info        → cuenta, tipos de evento (cuáles cuentan como
//                                                          onboarding) y webhooks del Calendly de AIB
//   node scripts/aib-onboarding.mjs calendly webhook     → suscribe /api/aib/calendly y guarda la signing
//                                                          key en .env.local (AIB_CALENDLY_WEBHOOK_SIGNING_KEY)
//   node scripts/aib-onboarding.mjs plantillas           → estado de las 3 plantillas en Zernio
//   node scripts/aib-onboarding.mjs plantillas crear     → las crea en Zernio (Meta las revisa)
//   node scripts/aib-onboarding.mjs simular              → corre el cron de prod y muestra qué mandaría hoy
//
// Env: CALENDLY_TOKEN_AIB (NO el de Level Up), AIB_ZERNIO_ACCOUNT_ID, ZERNIO_API_KEY (o AIB_ZERNIO_API_KEY),
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

const EVENTO = new RegExp(env("AIB_CALENDLY_ONBOARDING_REGEX") || "onboarding", "i");
async function calendlyApi(ruta, init = {}) {
  const token = env("CALENDLY_TOKEN_AIB");
  if (!token) throw new Error("Falta CALENDLY_TOKEN_AIB en .env.local (token del Calendly de AI Borinquen, no el de Level Up)");
  const r = await fetch(`https://api.calendly.com${ruta}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Calendly ${r.status} ${ruta}: ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}

async function calendly(sub) {
  const yo = (await calendlyApi("/users/me")).resource;
  const org = yo.current_organization;
  const q = `organization=${encodeURIComponent(org)}&scope=organization`;
  if (sub === "info") {
    console.log(`Cuenta: ${yo.name} <${yo.email}>`);
    if (/level ?up/i.test(`${yo.name} ${yo.email}`)) console.log("⚠️  Esto parece el Calendly de Level Up, no el de AI Borinquen.");
    const ets = await calendlyApi(`/event_types?organization=${encodeURIComponent(org)}&count=100&active=true`);
    console.log(`\nTipos de evento (✓ = cuenta como onboarding con ${EVENTO}):`);
    for (const e of ets.collection) console.log(` ${EVENTO.test(e.name) ? "✓" : "·"} ${e.name} · ${e.duration} min · ${e.profile?.name ?? ""}`);
    const wh = await calendlyApi(`/webhook_subscriptions?${q}`);
    console.log("\nWebhooks:");
    for (const w of wh.collection) console.log(` ${w.state} · ${w.callback_url} · ${w.events.join(",")}`);
    if (!wh.collection.length) console.log(" (ninguno)");
    return;
  }
  if (sub === "webhook") {
    const url = `${PROD}/api/aib/calendly`;
    const wh = await calendlyApi(`/webhook_subscriptions?${q}`);
    if (wh.collection.some((w) => w.callback_url === url && w.state === "active")) return console.log(`Ya existe el webhook activo a ${url}.`);
    const key = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const r = await calendlyApi("/webhook_subscriptions", { method: "POST", body: JSON.stringify({ url, events: ["invitee.created", "invitee.canceled"], organization: org, scope: "organization", signing_key: key }) });
    const f = path.join(ROOT, ".env.local");
    const txt = fs.readFileSync(f, "utf8").replace(/^AIB_CALENDLY_WEBHOOK_SIGNING_KEY=.*\n?/m, "");
    fs.writeFileSync(f, `${txt.replace(/\n?$/, "\n")}AIB_CALENDLY_WEBHOOK_SIGNING_KEY=${key}\n`);
    console.log(`✓ Webhook creado → ${r.resource.callback_url}`);
    console.log("✓ Signing key guardada en .env.local. Súbela a Vercel:");
    console.log("   npx vercel env add AIB_CALENDLY_WEBHOOK_SIGNING_KEY production   (pega el valor de .env.local)");
    return;
  }
  throw new Error("calendly info | calendly webhook");
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
  if (cmd === "calendly") await calendly(arg);
  else if (cmd === "plantillas") await plantillas(arg === "crear");
  else if (cmd === "simular") await simular();
  else { console.error("Comandos: calendly info|webhook | plantillas [crear] | simular"); process.exit(1); }
} catch (e) { console.error(`aib-onboarding: ${e.message}`); process.exit(1); }
