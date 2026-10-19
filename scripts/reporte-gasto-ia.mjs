// Reporte semanal del gasto de IA → Telegram de Elvin por el bot de Nico (+ espejo Slack), SIN usar Claude (cero tokens).
// Sale por Nico, el guardián de las plataformas y del gasto.
//  · Claude Code en esta Mac: scripts/uso-claude.mjs (transcripciones, costo ponderado) vs. la línea base del 19/oct.
//  · Agentes en la nube (API, dólares reales): desempeno_agentes_reportes (/ritmo/agentes), semana vs. semana anterior.
// Uso: node --env-file=.env.local scripts/reporte-gasto-ia.mjs [--dry]   (--dry = solo imprime el mensaje)
// Lo corre launchd los lunes 8 AM: scripts/launchd/com.iamarket.gasto-ia.plist
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_MAC_DIA = 210e6; // 19/oct/2026: 1,470M equivalentes en 7 días (66 % workflows, 31 % contexto > 300K)
const dry = process.argv.includes("--dry");

const M = (x) => Math.round(x / 1e6).toLocaleString("en-US") + "M";
const pct = (x) => Math.round(x * 100) + "%";
const cambio = (ahora, antes) => {
  if (!antes) return "—";
  const p = Math.round((ahora / antes - 1) * 100);
  return p === 0 ? "igual" : `${p < 0 ? "−" : "+"}${Math.abs(p)}%`;
};

function mac() {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/uso-claude.mjs"), "7", "--json"], { cwd: ROOT, encoding: "utf8", timeout: 600000 });
  if (r.status !== 0) return `Claude Code (Mac): no se pudo medir (${(r.stderr || "").trim().slice(0, 80)})`;
  const u = JSON.parse(r.stdout.trim().split("\n").pop());
  const lineas = [
    `💻 Claude Code (Mac): ${M(u.porDia)}/día (línea base 210M/día: ${cambio(u.porDia, BASE_MAC_DIA)})`,
    `   workflows ${pct(u.workflows)} (antes 66%) · contexto > 300K ${pct(u.grandes)} (antes 31%)`,
  ];
  const t = u.top[0];
  if (t && t.sub / u.total > 0.15) lineas.push(`   lo que más gastó: "${t.p.slice(0, 45)}…" (${t.nsub} subagentes, ${pct(t.sub / u.total)})`);
  return lineas.join("\n");
}

async function nube() {
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) return "☁️ Agentes en la nube: falta DATABASE_URL";
  const postgres = createRequire(path.join(ROOT, "package.json"))("postgres");
  const sql = postgres(url, { max: 1, prepare: false, idle_timeout: 5 });
  try {
    const filas = await sql`
      select agente,
        sum(costo_usd) filter (where fecha >= to_char(now() - interval '7 days', 'YYYY-MM-DD'))::float as ahora,
        sum(costo_usd) filter (where fecha < to_char(now() - interval '7 days', 'YYYY-MM-DD'))::float as antes
      from desempeno_agentes_reportes
      where fecha >= to_char(now() - interval '14 days', 'YYYY-MM-DD')
      group by agente order by 2 desc nulls last`;
    const tA = filas.reduce((a, f) => a + (f.ahora || 0), 0), tB = filas.reduce((a, f) => a + (f.antes || 0), 0);
    const detalle = filas.filter((f) => f.ahora >= 0.5).map((f) => `${f.agente[0].toUpperCase() + f.agente.slice(1)} $${f.ahora.toFixed(0)}`).join(" · ");
    return `☁️ Agentes en la nube (API): $${tA.toFixed(2)} (semana anterior $${tB.toFixed(2)}: ${cambio(tA, tB)})${detalle ? "\n   " + detalle : ""}`;
  } catch (e) {
    return `☁️ Agentes en la nube: no se pudo leer (${e.message.slice(0, 80)})`;
  } finally {
    await sql.end();
  }
}

const hoy = new Date().toLocaleDateString("es-PR", { day: "numeric", month: "short", timeZone: "America/Puerto_Rico" });
const texto = [`📊 Gasto de IA · semana al ${hoy}`, mac(), await nube(), "Detalle: node scripts/uso-claude.mjs · /ritmo/agentes"].join("\n");

if (dry) { console.log(texto); process.exit(0); }
const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/agentes.mjs"), "elvin", texto], { cwd: ROOT, encoding: "utf8", env: { ...process.env, AGENTE: "nico" }, timeout: 60000 });
console.log(new Date().toISOString(), (r.stdout || r.stderr || "").trim());
process.exit(r.status ?? 1);
