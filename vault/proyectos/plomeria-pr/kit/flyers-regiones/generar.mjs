// Regla de Elvin (23/sep/2026): los flyers NO llevan número de teléfono (Meta bloqueó el WhatsApp del negocio).
// Y tampoco "WhatsApp": la campaña va por Messenger + Instagram DM, así que el CTA es NEUTRO
// ("Escríbenos un mensaje" + burbuja de chat genérica, botón naranja de marca). Si el HTML trae un
// teléfono de PR o la palabra WhatsApp, el script falla y no genera nada.
// Flyers de reclutamiento de plomeros POR REGIÓN (22/sep/2026, pedido de Elvin).
// Regla: el creativo NO promete cifras ni porcentajes (eso se explica en la entrevista);
// dice dónde buscamos, que son 2 cupos por área y cómo escribirnos.
// Uso: node generar.mjs   → src/*.html + *.png (feed 1080×1350 y story 1080×1920)
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url)); // decodifica el espacio de "AGENTE CONTENIDO"
const TERR = JSON.parse(fs.readFileSync(path.join(AQUI, "../../agente/data/territorios.json"), "utf8")).territorios;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CTA = "Escríbenos un mensaje"; // sin número y sin canal: sirve para Messenger, IG DM o cualquier chat

// Nombre que ve el plomero (el pueblo que reconoce), no el código interno del territorio.
const NOMBRE = { T1: "el Área Metro", T2: "Bayamón", T3: "Caguas", T4: "Ponce", T5: "Arecibo", T6: "Mayagüez", T7: "Aguadilla", T8: "Fajardo" };
const SLUG = { T1: "metro", T2: "bayamon", T3: "caguas", T4: "ponce", T5: "arecibo", T6: "mayaguez", T7: "aguadilla", T8: "fajardo" };

const regiones = [
  ...TERR.map((t) => ({ slug: SLUG[t.id], nombre: NOMBRE[t.id], municipios: t.municipios, cupos: "Solo 2 cupos en la región" })),
  { slug: "puerto-rico", titulo: "Buscamos plomeros en", nombre: "Puerto Rico", municipios: ["Área Metro", "Bayamón", "Caguas", "Ponce", "Arecibo", "Mayagüez", "Aguadilla", "Fajardo"], cupos: "2 cupos por área" },
];

const LOGO = `<div class="logo"><svg viewBox="0 0 64 64"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="#F2621F"/><path d="M20 35 L29 44 L46 26" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>resuelto</div>`;
const CHECK = `<i><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#3DD598" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></i>`;
// Burbuja de chat genérica (NO el logo de WhatsApp ni el de Messenger); los puntos van del naranja del botón.
const CHAT = `<svg width="36" height="36" viewBox="0 0 24 24"><path d="M3.5 6A3 3 0 0 1 6.5 3h11a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H10.2l-4.6 3.7c-.6.5-1.6.1-1.6-.7V17a3 3 0 0 1-.5-1.7z" fill="#fff"/><circle cx="8.3" cy="10" r="1.35" fill="#F2621F"/><circle cx="12" cy="10" r="1.35" fill="#F2621F"/><circle cx="15.7" cy="10" r="1.35" fill="#F2621F"/></svg>`;

// El nombre de la región va en UNA línea y lo más grande posible: el script de la página lo achica
// hasta que quepa (espera a que carguen las fuentes, si no mide con la de respaldo).
const AJUSTAR = `<script>document.fonts.ready.then(()=>{for(const el of document.querySelectorAll('.fit')){let t=parseFloat(getComputedStyle(el).fontSize);while(el.scrollWidth>el.clientWidth&&t>60){t-=2;el.style.fontSize=t+'px'}}})</script>`;
const PASOS = [["1", "Toca el botón y escríbenos"], ["2", "Te hacemos 4 preguntas"], ["3", "Entrevista por videollamada"]];

function html(r, formato) {
  const story = formato === "story";
  const alto = story ? 1920 : 1350;
  const chips = r.municipios.map((m) => `<span class="chip">${m}</span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../feed/src/_base.css"><style>
html,body{height:${alto}px}
.chip{display:inline-block;background:rgba(255,255,255,.08);color:#DCE8F1;font-weight:600;font-size:${story ? 28 : 24}px;padding:12px 22px;border-radius:999px;margin:0 10px 12px 0}
.cupos{display:inline-flex;align-items:center;gap:14px;background:rgba(242,98,31,.14);border:2px solid rgba(242,98,31,.55);color:#FFB48E;font-weight:700;font-size:${story ? 32 : 28}px;padding:14px 26px;border-radius:999px}
.cupos b{width:14px;height:14px;border-radius:50%;background:#F2621F;display:inline-block}
.check{font-size:${story ? 34 : 29}px;margin-top:${story ? 22 : 16}px}
.cta{display:flex;align-items:center;gap:16px;background:#F2621F;color:#fff;font-weight:700;font-size:${story ? 36 : 31}px;padding:${story ? "26px 40px" : "22px 34px"};border-radius:20px;font-family:'Sora'}
</style></head><body class="navy" style="background:#071B2C"><div class="glow"></div>
${LOGO}
<div class="eyebrow" style="margin-top:${story ? 110 : 96}px">Estamos contratando · Plomería</div>
<h1 style="font-size:${story ? 118 : 100}px;margin-top:24px">${r.titulo ?? "Buscamos plomero en"}</h1>
<h1 class="o fit" style="font-size:${story ? 200 : 178}px;margin-top:6px;white-space:nowrap">${r.nombre}.</h1>
<div style="margin-top:${story ? 44 : 30}px"><span class="cupos"><b></b>${r.cupos}</span></div>
<div style="margin-top:${story ? 52 : 40}px">
  <div class="check">${CHECK}Nosotros ponemos los clientes</div>
  <div class="check">${CHECK}Pagamos la publicidad</div>
  <div class="check">${CHECK}Tú haces la plomería</div>
</div>
<div style="margin-top:${story ? 48 : 38}px">${chips}</div>
${story ? `<div class="card" style="margin-top:36px;padding:36px 44px"><div class="eyebrow" style="font-size:22px;margin-bottom:26px">Así aplicas</div>${PASOS.map(([n, t]) => `<div class="step" style="align-items:center;margin-top:18px"><div class="num" style="width:56px;height:56px;font-size:26px">${n}</div><p style="font-size:32px;font-weight:600">${t}</p></div>`).join("")}</div>` : ""}
<div class="foot" style="align-items:center;border-top:1px solid rgba(255,255,255,.12);padding-top:${story ? 40 : 30}px">
  <div class="muted" style="font-size:${story ? 28 : 24}px;line-height:1.35;max-width:${story ? 440 : 400}px">Licencia vigente<br>(oficial o maestro)</div>
  <div class="cta">${CHAT}${CTA}</div>
</div>
${AJUSTAR}
</body></html>`;
}

// Regla de Elvin (23/sep/2026): ningún flyer lleva teléfono (ni WhatsApp). Si se cuela uno, no se genera nada.
const TELEFONO_PR = /\b(787|939)[-. ]?\d{3}[-. ]?\d{4}\b/;
function sinTelefono(nombre, h) {
  if (/whatsapp/i.test(h)) throw new Error(`${nombre}: el flyer dice "WhatsApp". Regla de Elvin: CTA neutro (Escríbenos un mensaje), sin canal.`);
  if (TELEFONO_PR.test(h)) throw new Error(`${nombre}: el flyer trae un número de teléfono (${h.match(TELEFONO_PR)[0]}). Regla de Elvin: los flyers NO llevan número.`);
  return h;
}

fs.mkdirSync(path.join(AQUI, "src"), { recursive: true });
// En paralelo, con perfil propio y corte a los 40 s: Chrome a veces se queda vivo después de guardar la captura
// (si la PNG nueva existe, el timeout no es error).
const correr = promisify(execFile);
const trabajos = regiones.flatMap((r) => ["feed", "story"].map((formato) => {
  const n = `plomero-${r.slug}-${formato}`;
  const f = path.join(AQUI, "src", n + ".html");
  fs.writeFileSync(f, sinTelefono(n, html(r, formato)));
  const png = path.join(AQUI, n + ".png");
  const perfil = path.join(AQUI, "src", ".chrome-" + n);
  fs.rmSync(png, { force: true });
  return correr(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${perfil}`, `--window-size=1080,${formato === "story" ? 1920 : 1350}`, "--force-device-scale-factor=1", "--virtual-time-budget=10000", `--screenshot=${png}`, "file://" + f], { timeout: 40000 })
    .catch((e) => { if (!fs.existsSync(png)) throw e; })
    .then(() => { fs.rmSync(perfil, { recursive: true, force: true }); return n + ".png"; });
}));
const hechos = await Promise.all(trabajos);
console.log(hechos.length + " flyers:\n" + hechos.join("\n"));
