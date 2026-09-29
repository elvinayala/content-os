// Trabajo de un agente hecho FUERA de su bot (una sesión de Claude en la Mac trabajando como Remi, Lola, Max…) → se
// suma a su reporte del día en Ritmo (equipo digital). Elvin, 28/sep: "que Remi, Lola y cualquier agente reporte lo de
// la Mac". Dentro de un bot (PUENTE_BOT) no hace nada: ahí el cierre de las 6:30 PM ya lo cuenta y se duplicaría.
//
//   import { reportarDesdeMac } from "./reportar-mac.mjs";
//   await reportarDesdeMac("remi", { resumen: "…", entregables: ["…"], tareas: 1 });
//   node scripts/reportar-mac.mjs <agente> "resumen" [--tareas N] [--entregables "a|b"]
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

export async function reportarDesdeMac(agente, { resumen, entregables = [], tareas = 1 } = {}) {
  if (process.env.PUENTE_BOT) return false; // corre dentro de un bot: su cierre ya lo cuenta
  const secreto = env("CRON_SECRET");
  if (!secreto || !agente || !resumen) return false;
  try {
    const r = await fetch(`${env("CONTENT_OS_URL") || "https://content-os-chi-seven.vercel.app"}/api/ritmo/agentes`, {
      method: "POST",
      headers: { "x-cron-secret": secreto, "Content-Type": "application/json" },
      body: JSON.stringify({ agente: agente.toLowerCase(), sumar: true, reporte: { resumen: `${resumen} (desde la Mac)`, tareas, entregables: entregables.filter(Boolean).join("|") } }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json().catch(() => ({}));
    if (j.ok) console.log(`✓ Sumado al reporte de hoy de ${agente} en Ritmo`);
    else console.warn(`⚠ No se sumó al reporte de ${agente}: ${j.error || r.status}`);
    return !!j.ok;
  } catch (e) {
    console.warn(`⚠ No se sumó al reporte de ${agente}: ${e.message}`);
    return false;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [agente, resumen, ...resto] = process.argv.slice(2);
  const val = (k) => { const i = resto.indexOf(`--${k}`); return i >= 0 ? resto[i + 1] : undefined; };
  if (!agente || !resumen) {
    console.error('Uso: node scripts/reportar-mac.mjs <agente> "qué hiciste" [--tareas N] [--entregables "a|b"]');
    process.exit(1);
  }
  const ok = await reportarDesdeMac(agente, { resumen, tareas: Number(val("tareas") ?? 1), entregables: (val("entregables") ?? "").split("|") });
  process.exit(ok || process.env.PUENTE_BOT ? 0 : 1);
}
