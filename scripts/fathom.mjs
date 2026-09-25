#!/usr/bin/env node
// Fathom → Slack (Solicitud de Aure #29): registra el webhook de Fathom que apunta a /api/fathom.
//   FATHOM_API_KEY=… node scripts/fathom.mjs crear     → crea el webhook y guarda el secreto en Vercel
//   node scripts/fathom.mjs probar                        → manda una llamada de ejemplo en modo prueba (no publica)
//   node scripts/fathom.mjs registro                      → últimas llamadas procesadas (enviadas / con error)
//   FATHOM_API_KEY=… node scripts/fathom.mjs borrar <id> → apaga el webhook
// La API key es de la cuenta de elvin@levelupmediapr.net (Fathom → Settings → API Access).
// El secreto del webhook nunca se imprime: va directo a FATHOM_WEBHOOK_SECRET en Vercel (production).
import { execFileSync } from "node:child_process";

const API = "https://api.fathom.ai/external/v1";
const PROD = process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app";
const args = process.argv.slice(2);
const iCuenta = args.indexOf("--cuenta");
// --cuenta jessica → usa FATHOM_API_KEY_JESSICA, guarda FATHOM_WEBHOOK_SECRET_JESSICA e incluye la
// transcripción (para que Max arranque el onboarding con todo). Sin --cuenta = la de Elvin.
const CUENTA = iCuenta >= 0 ? String(args.splice(iCuenta, 2)[1] || "").toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
const [cmd, arg] = args;

async function fathom(path, init = {}) {
  const nombreKey = CUENTA ? `FATHOM_API_KEY_${CUENTA}` : "FATHOM_API_KEY";
  const key = process.env[nombreKey];
  if (!key) throw new Error(`Falta ${nombreKey} (Fathom → Settings → API Access de esa cuenta)`);
  const r = await fetch(`${API}${path}`, { ...init, headers: { "X-Api-Key": key, "Content-Type": "application/json", ...init.headers } });
  const t = await r.text();
  if (!r.ok) throw new Error(`Fathom ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
}

if (cmd === "crear") {
  const w = await fathom("/webhooks", {
    method: "POST",
    body: JSON.stringify({
      destination_url: `${PROD}/api/fathom`,
      triggered_for: ["my_recordings"],
      include_summary: true,
      include_action_items: true,
      ...(CUENTA ? { include_transcript: true } : {}),
    }),
  });
  console.log(`✓ Webhook creado: id ${w.id} → ${w.url}`);
  if (!w.secret) throw new Error("Fathom no devolvió el secreto");
  const nombreSecreto = CUENTA ? `FATHOM_WEBHOOK_SECRET_${CUENTA}` : "FATHOM_WEBHOOK_SECRET";
  const vc = ["vercel", "env", "add", nombreSecreto, "production", "--force", "--scope", "elvin-7614s-projects"];
  if (process.env.VERCEL_TOKEN) vc.push("--token", process.env.VERCEL_TOKEN);
  execFileSync("npx", ["--yes", ...vc], { input: w.secret, stdio: ["pipe", "ignore", "inherit"] });
  console.log(`✓ ${nombreSecreto} guardado en Vercel (production). Falta redeploy para que lo tome.`);
} else if (cmd === "borrar") {
  if (!arg) throw new Error("Uso: borrar <webhook_id>");
  await fathom(`/webhooks/${arg}`, { method: "DELETE" });
  console.log(`✓ Webhook ${arg} borrado`);
} else if (cmd === "probar" || cmd === "registro") {
  const s = process.env.CRON_SECRET;
  if (!s) throw new Error("Falta CRON_SECRET");
  const ejemplo = {
    recording_id: 1, meeting_title: "Prueba Fathom → Slack", share_url: "https://fathom.video/share/prueba",
    recording_start_time: new Date().toISOString(), recording_end_time: new Date(Date.now() + 15 * 60000).toISOString(),
    recorded_by: { name: "Elvin Ayala", email: "elvin@levelupmediapr.net" },
    calendar_invitees: [{ name: "Aure", email: null }],
    default_summary: { markdown_formatted: "## Propósito\nProbar el flujo.\n\n## Puntos clave\n- **Todo** llega al canal" },
    action_items: [{ description: "Confirmar que se ve bien", completed: false, assignee: { name: "Aure" } }],
  };
  const r = cmd === "probar"
    ? await fetch(`${PROD}/api/fathom?prueba=1`, { method: "POST", headers: { "x-cron-secret": s }, body: JSON.stringify(ejemplo) })
    : await fetch(`${PROD}/api/fathom`, { headers: { "x-cron-secret": s } });
  console.log(r.status, JSON.stringify(await r.json(), null, 1).slice(0, 4000));
} else {
  console.log("Uso: node scripts/fathom.mjs crear | probar | registro | borrar <id>");
}
