#!/usr/bin/env node
// Black Friday 2026 · cupos de las landings (demos/bf2026/).
//   node scripts/bf2026.mjs cupos                 → ver los 3 contadores
//   node scripts/bf2026.mjs cupos <lu|aib> <vendidos> [--total N]
//   node scripts/bf2026.mjs desplegar <lu|aib|bori|todas>   → sube demos/bf2026/<marca> a Netlify (zip)
// Bori se cuenta solo en Stripe (heybori.ai). Necesita CRON_SECRET para escribir y NETLIFY_AUTH_TOKEN para subir.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
const SITIOS = { lu: "bf2026-levelup", aib: "bf2026-aiborinquen", bori: "bf2026-bori" };
const REG = "data/bf2026.json";
async function desplegar(m) {
  const marcas = m === "todas" ? Object.keys(SITIOS) : [m];
  const token = process.env.NETLIFY_AUTH_TOKEN; if (!token) { console.error("Falta NETLIFY_AUTH_TOKEN"); process.exit(1); }
  const api = async (p, o = {}) => { const r = await fetch("https://api.netlify.com/api/v1" + p, { ...o, headers: { Authorization: `Bearer ${token}`, ...(o.headers || {}) } }); const t = await r.text(); if (!r.ok) { const e = new Error(`${p} → ${r.status}: ${t.slice(0, 200)}`); e.status = r.status; throw e; } return JSON.parse(t); };
  const reg = fs.existsSync(REG) ? JSON.parse(fs.readFileSync(REG, "utf8")) : { sitios: {} };
  for (const x of marcas) {
    if (!SITIOS[x]) { console.error("marca desconocida:", x); process.exit(1); }
    let id = reg.sitios[x]?.id;
    if (!id) { const s = await api("/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: SITIOS[x] }) }); id = s.id; }
    const zip = `/tmp/${SITIOS[x]}.zip`; fs.rmSync(zip, { force: true });
    execSync(`zip -qr "${zip}" .`, { cwd: path.join("demos/bf2026", x) });
    const dep = await api(`/sites/${id}/deploys`, { method: "POST", headers: { "Content-Type": "application/zip" }, body: fs.readFileSync(zip) });
    let st = dep.state, n = 0; while (st !== "ready" && st !== "error" && n++ < 40) { await new Promise((r) => setTimeout(r, 2500)); st = (await api(`/deploys/${dep.id}`)).state; }
    const sitio = await api(`/sites/${id}`);
    reg.sitios[x] = { id, url: (sitio.ssl_url || sitio.url).replace(/\/$/, "") + "/", estado: st, desplegado: new Date().toISOString() };
    console.log(x, st, reg.sitios[x].url);
  }
  fs.writeFileSync(REG, JSON.stringify(reg, null, 2) + "\n");
  process.exit(0);
}
const BASE = process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app";
const [cmd, marca, vendidos] = process.argv.slice(2);
const total = process.argv.includes("--total") ? Number(process.argv[process.argv.indexOf("--total") + 1]) : undefined;
if (cmd === "desplegar") await desplegar(marca);
if (cmd !== "cupos") { console.log("uso: node scripts/bf2026.mjs cupos [lu|aib <vendidos> [--total N]] | desplegar <lu|aib|bori|todas>"); process.exit(1); }
if (!marca) {
  for (const m of ["lu", "aib", "bori"]) console.log(m, JSON.stringify(await (await fetch(`${BASE}/api/bf2026/cupos?marca=${m}`)).json()));
  process.exit(0);
}
const r = await fetch(`${BASE}/api/bf2026/cupos`, { method: "POST", headers: { "content-type": "application/json", "x-cron-secret": process.env.CRON_SECRET ?? "" }, body: JSON.stringify({ marca, vendidos: Number(vendidos), total }) });
console.log(r.status, JSON.stringify(await r.json()));
