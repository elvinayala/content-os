// Flyers de CLIENTES por región (23/sep/2026, pedido de Elvin: "según vayan firmando los plomeros de las
// ciudades, se prenden anuncios ese mismo día"). Un feed 1080×1350 + una historia 1080×1920 por territorio.
// Regla: solo precios fijos que están en agente/data/menu.json (el agente cotiza igual) y solo los pueblos
// donde de verdad hay plomero activo — por eso se puede regenerar con la cobertura real del que firmó.
//
// Uso:  node generar.mjs                          → los 8 territorios (pueblos de territorios.json)
//       node generar.mjs T7 "Aguadilla,Aguada,Moca" → solo T7 con esos pueblos (la cobertura del plomero)
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(AQUI, "../../agente/data");
const TERR = JSON.parse(fs.readFileSync(path.join(DATA, "territorios.json"), "utf8")).territorios;
const MENU = JSON.parse(fs.readFileSync(path.join(DATA, "menu.json"), "utf8"));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WHATSAPP = "939-247-9234";

// El pueblo que el cliente reconoce, no el código interno.
const NOMBRE = { T1: "San Juan", T2: "Bayamón", T3: "Caguas", T4: "Ponce", T5: "Arecibo", T6: "Mayagüez", T7: "Aguadilla", T8: "Fajardo" };
const SLUG = { T1: "metro", T2: "bayamon", T3: "caguas", T4: "ponce", T5: "arecibo", T6: "mayaguez", T7: "aguadilla", T8: "fajardo" };

const precio = (id) => {
  const s = MENU.servicios.find((x) => x.id === id);
  if (!s?.precio) throw new Error(`El menú no tiene precio fijo para ${id}`);
  return s.precio;
};
const PRECIOS = [
  ["Destape simple", "Fregadero, lavamanos, ducha o inodoro", precio("destape-simple")],
  ["Reparación de inodoro", "Flapper, válvula o sello", precio("reparacion-inodoro")],
  ["Llave o mezcladora", "Cocina o baño", precio("llave-mezcladora")],
  ["Instalación de calentador", "De tanque", precio("calentador-tanque")],
];

const [soloT, pueblos] = process.argv.slice(2);
const regiones = TERR.filter((t) => !soloT || t.id === soloT).map((t) => ({
  slug: SLUG[t.id], nombre: NOMBRE[t.id],
  municipios: pueblos ? pueblos.split(",").map((s) => s.trim()).filter(Boolean) : t.municipios,
}));
if (!regiones.length) throw new Error(`No existe el territorio ${soloT}`);

const LOGO = `<div class="logo"><svg viewBox="0 0 64 64"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="#F2621F"/><path d="M20 35 L29 44 L46 26" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>resuelto</div>`;
const CHECK = `<i><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#1F9D6B" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></i>`;
const WA = `<svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>`;
// El pueblo va en UNA línea y lo más grande posible (se achica hasta caber, tras cargar las fuentes).
const AJUSTAR = `<script>document.fonts.ready.then(()=>{for(const el of document.querySelectorAll('.fit')){let t=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>el.clientWidth&&t>60){t-=2;el.style.fontSize=t+'px'}}})</script>`;

function html(r, formato) {
  const story = formato === "story";
  const alto = story ? 1920 : 1350;
  const chips = r.municipios.map((m) => `<span class="chip">${m}</span>`).join("");
  const filas = PRECIOS.map(([n, d, p]) => `<div class="fila"><div><b>${n}</b><small>${d}</small></div><span>$${p}</span></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../feed/src/_base.css"><style>
html,body{height:${alto}px}
.chip{display:inline-block;background:#fff;border:1.5px solid var(--line);color:var(--c1);font-weight:600;font-size:${story ? 27 : 23}px;padding:10px 20px;border-radius:999px;margin:0 10px 12px 0}
.nuevo{display:inline-flex;align-items:center;gap:14px;background:rgba(31,157,107,.12);border:2px solid rgba(31,157,107,.45);color:#157A53;font-weight:700;font-size:${story ? 30 : 26}px;padding:12px 24px;border-radius:999px}
.nuevo b{width:14px;height:14px;border-radius:50%;background:#1F9D6B;display:inline-block}
.precios{background:#fff;border-radius:28px;box-shadow:0 8px 30px rgba(8,36,58,.07);padding:${story ? "30px 40px" : "22px 36px"}}
.fila{display:flex;justify-content:space-between;align-items:center;padding:${story ? 18 : 13}px 0;border-bottom:1px solid var(--line)}
.fila:last-child{border-bottom:0}
.fila b{display:block;font-family:'Sora';font-size:${story ? 33 : 28}px;letter-spacing:-.5px;color:var(--c1)}
.fila small{display:block;font-size:${story ? 22 : 19}px;color:var(--c4);margin-top:3px}
.fila span{font-family:'Sora';font-weight:800;font-size:${story ? 50 : 42}px;color:var(--c2);letter-spacing:-1px}
.check{font-size:${story ? 30 : 25}px;color:var(--c1);margin-top:${story ? 16 : 10}px}
.check i{background:#E3F4EC;width:${story ? 44 : 38}px;height:${story ? 44 : 38}px}
.cta{display:flex;align-items:center;gap:16px;background:#1F9D6B;color:#fff;font-weight:700;font-size:${story ? 36 : 30}px;padding:${story ? "26px 40px" : "20px 32px"};border-radius:20px;font-family:'Sora'}
</style></head><body class="cream"><div class="blob"></div>
${LOGO}
<div style="margin-top:${story ? 90 : 56}px"><span class="nuevo"><b></b>Ya llegamos a tu zona</span></div>
<h1 style="font-size:${story ? 96 : 64}px;margin-top:${story ? 30 : 22}px;color:var(--c1)">Plomero con precio fijo en</h1>
<h1 class="o fit" style="font-size:${story ? 190 : 150}px;margin-top:4px;white-space:nowrap">${r.nombre}.</h1>
<div class="precios" style="margin-top:${story ? 44 : 26}px">${filas}</div>
<div style="margin-top:${story ? 34 : 20}px">
  <div class="check">${CHECK}Te decimos el precio antes de llegar</div>
  <div class="check">${CHECK}Plomero licenciado · 12 meses de garantía</div>
</div>
<div style="margin-top:${story ? 36 : 20}px">${chips}</div>
<div class="foot" style="align-items:center;border-top:1px solid var(--line);padding-top:${story ? 36 : 24}px">
  <div class="muted" style="font-size:${story ? 24 : 20}px;line-height:1.35;max-width:${story ? 430 : 400}px">Mano de obra · materiales aparte<br>+ $${MENU.cargo_coordinacion} de coordinación</div>
  <div class="cta">${WA}${WHATSAPP}</div>
</div>
${AJUSTAR}
</body></html>`;
}

fs.mkdirSync(path.join(AQUI, "src"), { recursive: true });
// En paralelo; cada Chrome se corta a los 40 s (la captura sale en ~5 s).
const correr = promisify(execFile);
const trabajos = regiones.flatMap((r) => ["feed", "story"].map((formato) => {
  const n = `cliente-${r.slug}-${formato}`;
  const f = path.join(AQUI, "src", n + ".html");
  fs.writeFileSync(f, html(r, formato));
  return correr(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${path.join(AQUI, "src", ".chrome-" + n)}`, `--window-size=1080,${formato === "story" ? 1920 : 1350}`, "--force-device-scale-factor=1", "--virtual-time-budget=10000", `--screenshot=${path.join(AQUI, n + ".png")}`, "file://" + f], { timeout: 40000 })
    // Chrome a veces se queda vivo después de guardar la captura: si la PNG existe, el timeout no es error.
    .catch((e) => { if (!fs.existsSync(path.join(AQUI, n + ".png"))) throw e; })
    .then(() => { fs.rmSync(path.join(AQUI, "src", ".chrome-" + n), { recursive: true, force: true }); return n + ".png"; });
}));
const hechos = await Promise.all(trabajos);
console.log(hechos.length + " flyers:\n" + hechos.join("\n"));
