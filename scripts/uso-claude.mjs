// Gasto de tokens de Claude Code en esta Mac (transcripciones de ~/.claude/projects), ponderado por costo:
// escritura de caché 2x, lectura 0.1x, salida 5x. Separa workflows/subagentes de sesiones principales y
// muestra qué sesiones lanzaron más subagentes. Uso: node scripts/uso-claude.mjs [días=7]
// Línea base del 19/oct/2026 (7 días): 1,470M equivalentes · workflows 66% · llamadas > 300K de contexto 31%.
import fs from "node:fs"; import path from "node:path"; import readline from "node:readline";
const iDesde = process.argv.indexOf("--desde"); // --desde 2026-10-19T15:00 = solo lo de después de un cambio
const desde = iDesde > 0 ? Date.parse(process.argv[iDesde + 1]) : Date.now() - Number(process.argv[2] || 7) * 864e5;
const DIAS = (Date.now() - desde) / 864e5;
const raiz = path.join(process.env.HOME, ".claude/projects");
const W = (u)=> (u.input_tokens||0) + 2*(u.cache_creation_input_tokens||0) + 0.1*(u.cache_read_input_tokens||0) + 5*(u.output_tokens||0);
const vistos = new Set(); const padres = {}; let totW = 0, subW = 0, mainW = 0, calls = 0, bigW = 0;
async function leer(f) { const rl = readline.createInterface({ input: fs.createReadStream(f) }); let w = 0, p = null, n = 0, big = 0;
  for await (const l of rl) { let j; try { j = JSON.parse(l) } catch { continue }
    if (!p && j.type==="user") { const c=j.message?.content; p = (typeof c==="string"?c:(Array.isArray(c)?c.find(x=>x.type==="text")?.text:""))||""; p=p.replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim().slice(0,70) }
    const u=j.message?.usage; if(!u||j.type!=="assistant"||!(Date.parse(j.timestamp)>=desde)) continue;
    const id=(j.message.id||"")+(j.requestId||""); if(vistos.has(id)) continue; vistos.add(id);
    const x=W(u); w+=x; n++; const ctx=(u.cache_read_input_tokens||0)+(u.cache_creation_input_tokens||0)+(u.input_tokens||0); if(ctx>300000) big+=x; }
  return { w, p, n, big } }
for (const proj of fs.readdirSync(raiz)) { const d = path.join(raiz, proj); if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) { const full = path.join(d, f), st = fs.statSync(full);
    if (f.endsWith(".jsonl") && st.mtimeMs >= desde) { const r = await leer(full); totW += r.w; mainW += r.w; calls += r.n; bigW += r.big; padres[f.replace(".jsonl","")] ??= { sub: 0, nsub: 0 }; Object.assign(padres[f.replace(".jsonl","")], { main: r.w, p: r.p }) }
    else if (st.isDirectory()) { const todos=[]; const walk=(d)=>{for(const x of fs.readdirSync(d)){const y=path.join(d,x); const s=fs.statSync(y); if(s.isDirectory()) walk(y); else if(x.endsWith(".jsonl")&&s.mtimeMs>=desde) todos.push(y)}}; walk(full);
      for (const gf of todos) {
        const r = await leer(gf); totW += r.w; subW += r.w; calls += r.n; padres[f] ??= { sub: 0, nsub: 0 }; padres[f].sub += r.w; padres[f].nsub++ } } } }
const M = x => (x/1e6).toFixed(0)+"M";
console.log(`${DIAS.toFixed(1)} días · ${M(totW / DIAS)} por día (línea base 19/oct: 210M/día) · costo equivalente (tokens de entrada; escritura caché 2x, lectura 0.1x, salida 5x): total ${M(totW)}`);
console.log(`  subagentes/workflows ${M(subW)} (${(100*subW/totW).toFixed(0)}%) · sesiones principales ${M(mainW)} (${(100*mainW/totW).toFixed(0)}%)`);
console.log(`  llamadas con contexto > 300K tokens: ${M(bigW)} (${(100*bigW/totW).toFixed(0)}% del costo)`);
console.log(`  CLAUDE.md hoy ≈ ${Math.round(fs.statSync("CLAUDE.md").size / 2.07 / 1000)}K tokens por llamada (antes del 19/oct: 73K) · ${calls} llamadas`);
console.log(`\nSesiones que más subagentes lanzaron:`);
for (const [k, v] of Object.entries(padres).filter(([,v])=>v.nsub).sort((a,b)=>b[1].sub-a[1].sub).slice(0,10)) console.log(`  ${M(v.sub).padStart(6)} en ${String(v.nsub).padStart(3)} subagentes | propia ${M(v.main||0).padStart(5)} | ${v.p||"(sesión fuera de rango)"}`);
