// Conecta Timelines.ai (el puente de WhatsApp) con Leads de Pulse. Una vez por marca.
//
//   node scripts/leads-timelines.mjs cuentas  <lu|aib>   → números de WhatsApp conectados en Timelines
//   node scripts/leads-timelines.mjs webhooks <lu|aib>   → webhooks registrados
//   node scripts/leads-timelines.mjs conectar <lu|aib> [--url https://content-os-chi-seven.vercel.app]
//        → registra message:received:new y message:sent:new hacia /api/leads/timelines (idempotente)
//
// Necesita TIMELINES_TOKEN_LU / TIMELINES_TOKEN_AIB (Timelines → Integrations → Public API) y
// LEADS_WEBHOOK_SECRET en .env.local (el mismo valor que en Vercel).
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const [cmd, m] = process.argv.slice(2);
const marca = { lu: { token: env.TIMELINES_TOKEN_LU, slug: "level-up" }, aib: { token: env.TIMELINES_TOKEN_AIB, slug: "ai-borinquen" } }[m];
if (!marca || !["cuentas", "webhooks", "conectar"].includes(cmd)) {
  console.error("uso: node scripts/leads-timelines.mjs <cuentas|webhooks|conectar> <lu|aib>");
  process.exit(1);
}
if (!marca.token) { console.error(`Falta TIMELINES_TOKEN_${m.toUpperCase()} en .env.local`); process.exit(1); }
const base = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "https://content-os-chi-seven.vercel.app";
const api = async (metodo, ruta, body) => {
  const r = await fetch(`https://app.timelines.ai/integrations/api${ruta}`, { method: metodo, headers: { Authorization: `Bearer ${marca.token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = t; }
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status} ${typeof d === "string" ? d.slice(0, 200) : JSON.stringify(d).slice(0, 300)}`);
  return d;
};
const lista = (d) => (Array.isArray(d) ? d : d?.data?.webhooks ?? d?.data?.whatsapp_accounts ?? d?.data ?? d?.webhooks ?? []);

if (cmd === "cuentas") {
  for (const c of lista(await api("GET", "/whatsapp_accounts"))) console.log(`${c.id ?? ""} | ${c.phone ?? c.phone_number ?? ""} | ${c.account_name ?? c.full_name ?? c.name ?? ""} | ${c.status ?? ""}`);
} else if (cmd === "webhooks") {
  for (const w of lista(await api("GET", "/webhooks"))) console.log(`${w.id} | ${w.event_type} | ${w.enabled ? "on" : "off"} | ${String(w.url).replace(/s=[^&]+/, "s=***")} | errores ${w.errors_counter ?? 0}`);
} else {
  if (!env.LEADS_WEBHOOK_SECRET) { console.error("Falta LEADS_WEBHOOK_SECRET en .env.local"); process.exit(1); }
  const url = `${base}/api/leads/timelines?marca=${marca.slug}&s=${env.LEADS_WEBHOOK_SECRET}`;
  const ya = lista(await api("GET", "/webhooks"));
  for (const evento of ["message:received:new", "message:sent:new"]) {
    if (ya.some((w) => w.event_type === evento && String(w.url).startsWith(`${base}/api/leads/timelines`))) { console.log(`= ${evento} ya estaba`); continue; }
    await api("POST", "/webhooks", { event_type: evento, url, enabled: true });
    console.log(`+ ${evento} → ${base}/api/leads/timelines?marca=${marca.slug}`);
  }
}
