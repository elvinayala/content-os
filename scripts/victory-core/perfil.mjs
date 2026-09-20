// Aplica perfiles armados por Claude (JSON: { "<id>": { ...perfil } }) a las
// cuentas y las pasa a "enriquecida". Campos ausentes → null; nunca inventa.
// Uso: node scripts/victory-core/perfil.mjs <perfiles.json>
import { readFileSync, writeFileSync } from "node:fs";
const DIR = "data/victory-core";
const store = JSON.parse(readFileSync(`${DIR}/cuentas.json`, "utf8"));
const perfiles = JSON.parse(readFileSync(process.argv[2], "utf8"));
const hoy = new Date().toISOString().slice(0, 10);
const base = { tipoFacility: null, aptaParaLimpiezaRecurrente: null, nLocations: null, matriz: null, clasificacion: null, empleadosEst: null, sqftEst: null, senales: [], evidencia: null, activaYLegitima: true };
let n = 0;
for (const c of store.cuentas) {
  const p = perfiles[c.id];
  if (!p) continue;
  c.perfil = { ...base, ...p, fuente: p.fuente ?? `web:${c.dominio}+claude`, estado: p.estado ?? "estimado", fecha: hoy };
  c.etapa = "enriquecida";
  n++;
}
store.actualizadoEl = new Date().toISOString();
writeFileSync(`${DIR}/cuentas.json`, JSON.stringify(store, null, 2) + "\n");
console.log(`Perfiles aplicados: ${n}`);
