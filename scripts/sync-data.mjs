#!/usr/bin/env node
// Sincroniza data/*.json entre la Mac, el puente en Railway y producción (Vercel), usando
// Vercel como bus: `pull` baja de producción cada archivo y se queda con el más nuevo por
// `actualizadoEl` (o si el local no existe); `push` es deploy-snapshots (sube todo).
//
//   node scripts/sync-data.mjs pull            # antes de trabajar (lo corren las tareas y el puente)
//   node scripts/sync-data.mjs push            # después de escribir (= bash scripts/deploy-snapshots.sh)
//
// Requiere CRON_SECRET (mismo valor en .env.local, Vercel y Railway). Nunca rompe: si prod no
// responde, deja el local como está y avisa.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const PROD = process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app";
const ARCHIVOS = ["estudio.json", "calendario.json", "entregas.json", "tareas.json", "portafolio.json", "prioridades.json", "demos/index.json", "email-ecosistema/blueprint.json"];
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try { const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } catch {}
  return "";
}
const fecha = (o) => { const v = o?.actualizadoEl || o?.actualizado || ""; const t = Date.parse(v); return Number.isNaN(t) ? 0 : t; };

async function pull() {
  const secreto = env("CRON_SECRET"); if (!secreto) { console.log("sync: sin CRON_SECRET, no sincronizo"); return; }
  let bajados = 0;
  for (const a of ARCHIVOS) {
    try {
      const r = await fetch(`${PROD}/api/snapshot?archivo=${encodeURIComponent(a)}`, { headers: { "x-cron-secret": secreto }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) continue;
      const remoto = await r.json();
      const local = path.join(ROOT, "data", a);
      let localObj = null; try { localObj = JSON.parse(fs.readFileSync(local, "utf8")); } catch {}
      const remotoEsMasNuevo = !localObj || (fecha(remoto) > fecha(localObj));
      if (remotoEsMasNuevo) { fs.mkdirSync(path.dirname(local), { recursive: true }); fs.writeFileSync(local, JSON.stringify(remoto, null, 2) + "\n"); bajados++; console.log(`↓ ${a} (prod más nuevo)`); }
    } catch (e) { console.log(`sync ${a}: ${e.message}`); }
  }
  console.log(`sync pull: ${bajados} archivo(s) actualizados desde producción`);
}
function push() {
  execSync("bash scripts/deploy-snapshots.sh", { cwd: ROOT, stdio: "inherit", env: { ...process.env, VERCEL_TOKEN: process.env.VERCEL_TOKEN || env("VERCEL_TOKEN") } });
}
const cmd = process.argv[2];
if (cmd === "pull") await pull(); else if (cmd === "push") push(); else console.log("Uso: sync-data.mjs pull|push");
