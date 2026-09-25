#!/usr/bin/env node
// Pone la llave de Apify donde la usan los agentes (25/sep/2026): Max espía la competencia desde Railway
// y Bori (Max · trafficker) desde su servidor. La llave no se imprime nunca.
//
//   node scripts/apify-token.mjs            → la pide en pantalla (oculta) — correr en la app Terminal
//   APIFY_TOKEN=… node scripts/apify-token.mjs
//
// Dónde sacarla: console.apify.com → Settings → API & Integrations → Personal API tokens → copiar.
// Guarda en: .env.local (Mac) · Railway puente-telegram/max · Railway believable-amazement/bori.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESTINOS = [
  { nombre: "Max (Railway)", project: "a95d7de4-d283-43e0-9670-71562e31672c", service: "max" },
  { nombre: "Bori (Railway)", project: "ceefdfd5-e444-4a28-a22e-b93e01eddad2", service: "bori" },
];

async function pedirOculto(pregunta) {
  if (!process.stdin.isTTY) return "";
  process.stdout.write(pregunta);
  return new Promise((res) => {
    let v = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const alTeclear = (ch) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n" || c === "\u0004") { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off("data", alTeclear); process.stdout.write("\n"); return res(v.trim()); }
        if (c === "\u0003") process.exit(1);
        if (c === "\u007f") v = v.slice(0, -1); else v += c;
      }
    };
    process.stdin.on("data", alTeclear);
  });
}

const token = (process.env.APIFY_TOKEN || "").trim() || (await pedirOculto("Pega la llave de Apify (console.apify.com → Settings → API & Integrations) y Enter (no se ve al pegar): "));
if (!token) { console.error("✖ Sin llave. Córrelo en la app Terminal para que te la pida."); process.exit(1); }

// ¿Sirve? (sin gastar: solo lee el perfil)
const r = await fetch("https://api.apify.com/v2/users/me", { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
if (!r.ok) { console.error(`✖ Apify no acepta esa llave (${r.status}). Cópiala completa otra vez.`); process.exit(1); }
const yo = (await r.json()).data || {};
console.log(`✔ Llave válida · cuenta ${yo.username || "?"} · plan ${yo.plan?.id || "?"}`);

// Mac: .env.local
const envPath = path.join(ROOT, ".env.local");
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
env = /^APIFY_TOKEN=.*$/m.test(env) ? env.replace(/^APIFY_TOKEN=.*$/m, `APIFY_TOKEN=${token}`) : `${env.replace(/\n?$/, "\n")}APIFY_TOKEN=${token}\n`;
fs.writeFileSync(envPath, env);
console.log("✔ .env.local (Mac)");

// Railway (reinicia cada servicio para que la tome)
for (const d of DESTINOS) {
  try {
    execFileSync("npx", ["@railway/cli", "variables", "--project", d.project, "--environment", "production", "--service", d.service, "--set", `APIFY_TOKEN=${token}`], { stdio: ["ignore", "ignore", "pipe"], timeout: 90000 });
    console.log(`✔ ${d.nombre}`);
  } catch (e) {
    console.log(`⚠ ${d.nombre}: no pude (${String(e.stderr || e.message).split("\n")[0].slice(0, 120)})`);
  }
}
console.log("Listo: Max ya puede espiar la competencia (node scripts/meta-ads.mjs competencia …) y Bori también.");
