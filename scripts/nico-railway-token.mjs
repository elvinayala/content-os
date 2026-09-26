#!/usr/bin/env node
// Le da a Nico acceso a TODOS los proyectos de Railway (26/sep/2026). Hasta hoy su RAILWAY_API_TOKEN solo veía
// puente-telegram: no podía desplegar ni leer Resuelto (#34, #41, #42 de Aure quedaron "tienes que subirlo tú desde la
// Mac"). Con un token de cuenta, Nico despliega Resuelto y lee sus variables (clave de admin, GHL) sin pedírtelas.
// El token no se imprime nunca.
//
//   node scripts/nico-railway-token.mjs      → lo pide en pantalla (oculto) — correr en la app Terminal
//
// Dónde sacarlo: railway.com → tu avatar → Account Settings → Tokens → "Create token" con Workspace = el tuyo
// (NO un token de proyecto) → copiar. Queda en Railway puente-telegram/nico como RAILWAY_API_TOKEN (reinicia a Nico).
import { execFileSync } from "node:child_process";

const PROYECTO_NICO = "a95d7de4-d283-43e0-9670-71562e31672c";

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

const token = (process.env.NICO_RAILWAY_TOKEN || "").trim() || (await pedirOculto("Pega el token de cuenta de Railway (Account Settings → Tokens) y Enter (no se ve al pegar): "));
if (!token) { console.error("✖ Sin token. Córrelo en la app Terminal para que te lo pida."); process.exit(1); }

// ¿Sirve y ve Resuelto? (solo lee la lista de proyectos)
const r = await fetch("https://backboard.railway.com/graphql/v2", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: "query { projects { edges { node { id name } } } }" }),
  signal: AbortSignal.timeout(20000),
});
const j = await r.json().catch(() => ({}));
const proyectos = (j.data?.projects?.edges || []).map((e) => e.node.name);
if (!r.ok || j.errors || !proyectos.length) {
  console.error(`✖ Railway no acepta ese token o no ve proyectos (${r.status}${j.errors ? `: ${String(j.errors[0]?.message).slice(0, 120)}` : ""}). Tiene que ser un token de CUENTA (no de proyecto).`);
  process.exit(1);
}
console.log(`✔ Token válido · ve ${proyectos.length} proyecto(s): ${proyectos.join(", ")}`);
if (!proyectos.some((n) => /resuelto|plomer/i.test(n))) console.log("⚠ No veo el proyecto de Resuelto con este token: revisa que sea del workspace correcto.");

try {
  execFileSync("npx", ["@railway/cli", "variables", "--project", PROYECTO_NICO, "--environment", "production", "--service", "nico", "--set", `RAILWAY_API_TOKEN=${token}`], { stdio: ["ignore", "ignore", "pipe"], timeout: 90000 });
  console.log("✔ Nico (Railway) — se reinicia solo en ~2 min con el acceso nuevo.");
} catch (e) {
  console.error(`✖ No pude ponérselo a Nico: ${String(e.stderr || e.message).split("\n")[0].slice(0, 160)}`);
  process.exit(1);
}
