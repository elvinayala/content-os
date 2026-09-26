// Archivo COMPLETO de una cuenta de Pipedrive antes de cancelarla (26/sep/2026).
// Baja todo por la API (costo $0: usa el plan que ya se paga) y lo deja en JSON crudo + un Excel
// por cuenta, FUERA del repo (datos personales de ~20K leads no van a git).
//
//   node scripts/pipedrive-archivo.mjs <lu|aib> [--dir "~/Documents/Archivo Pipedrive"]
//
// Hojas: Tratos (todos los estados), Personas, Empresas, Notas, Actividades, Leads (bandeja),
// Embudos y etapas, Usuarios, Campos. Los campos personalizados salen con su NOMBRE real.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const marca = process.argv[2];
const TOKEN = { lu: env.PIPEDRIVE_LEVELUP_TOKEN, aib: env.PIPEDRIVE_AIB_TOKEN }[marca];
if (!TOKEN) { console.error("uso: node scripts/pipedrive-archivo.mjs <lu|aib>"); process.exit(1); }
const dirArg = process.argv.includes("--dir") ? process.argv[process.argv.indexOf("--dir") + 1] : "~/Documents/Archivo Pipedrive";
const hoy = new Date().toISOString().slice(0, 10);
const DIR = path.join(dirArg.replace(/^~/, os.homedir()), `${hoy}`, marca === "lu" ? "level-up" : "ai-borinquen");
fs.mkdirSync(DIR, { recursive: true });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(ruta, params = {}) {
  const q = new URLSearchParams({ ...params, api_token: TOKEN });
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(`https://api.pipedrive.com/v1/${ruta}?${q}`, { signal: AbortSignal.timeout(60_000) });
      if (r.status === 429) { await espera(2000 * (i + 1)); continue; }
      const d = await r.json();
      if (!d.success) throw new Error(`${ruta}: ${d.error || r.status}`);
      return d;
    } catch (e) {
      if (i === 5) throw e;
      await espera(1500 * (i + 1));
    }
  }
}

// Paginación por start/limit (v1). Devuelve todo.
async function todo(ruta, params = {}) {
  const filas = [];
  let start = 0;
  for (;;) {
    const d = await get(ruta, { ...params, start: String(start), limit: "500" });
    filas.push(...(d.data ?? []));
    const p = d.additional_data?.pagination;
    process.stdout.write(`\r  ${ruta}: ${filas.length}      `);
    if (!p?.more_items_in_collection) break;
    start = p.next_start;
  }
  process.stdout.write("\n");
  return filas;
}

const t0 = Date.now();
console.log(`Archivo de Pipedrive ${marca.toUpperCase()} → ${DIR}`);
const datos = {};
datos.usuarios = (await get("users")).data ?? [];
datos.embudos = (await get("pipelines")).data ?? [];
datos.etapas = await todo("stages");
datos.camposTrato = await todo("dealFields");
datos.camposPersona = await todo("personFields");
datos.camposEmpresa = await todo("organizationFields");
datos.tratos = await todo("deals", { status: "all_not_deleted" });
datos.personas = await todo("persons");
datos.empresas = await todo("organizations");
datos.notas = await todo("notes");
datos.actividades = await todo("activities", { user_id: "0" }); // 0 = de todos los usuarios
datos.leads = await todo("leads", { archived_status: "all" }).catch(() => []);

for (const [k, v] of Object.entries(datos)) fs.writeFileSync(path.join(DIR, `${k}.json`), JSON.stringify(v));
const resumen = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, v.length]));
fs.writeFileSync(path.join(DIR, "resumen.json"), JSON.stringify({ marca, fecha: new Date().toISOString(), ...resumen }, null, 2));
console.log("JSON listo:", resumen, `(${Math.round((Date.now() - t0) / 1000)} s)`);

// Excel (openpyxl): una hoja por entidad, campos personalizados con su nombre.
const xlsx = path.join(DIR, `Pipedrive ${marca === "lu" ? "Level Up" : "AI Borinquen"} ${hoy}.xlsx`);
execFileSync("python3", [path.join(path.dirname(fileURLToPath(import.meta.url)), "pipedrive-archivo-xlsx.py"), DIR, xlsx], { stdio: "inherit" });
console.log("Excel:", xlsx);
