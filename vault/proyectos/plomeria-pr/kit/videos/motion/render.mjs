// Videos de CLIENTES en motion graphics (25/sep/2026, Elvin: "por lo menos 3 o 4 videos por área, y con un call to
// action suave"). Cada video es HTML con animaciones CSS; se captura cuadro por cuadro con Chrome (puppeteer-core),
// congelando las animaciones en el tiempo exacto de cada cuadro, y ffmpeg lo junta a 30 fps. Mismo look y mismos
// cortes que el video base (0 · 3.2 · 6.2 · 10.6 · 13.4 s), así la música de pista-clientes.py cae en su sitio.
// Salen sin el área: armar-regionales.sh les pega el cierre de cada ciudad y la tarjeta del CTA.
//
// Uso: node render.mjs            → destape, calentador, sorpresas y cta
//      node render.mjs destape    → solo ese
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(AQUI, "../../../agente/package.json"));
const puppeteer = require("puppeteer-core");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MENU = JSON.parse(fs.readFileSync(path.join(AQUI, "../../../agente/data/menu.json"), "utf8"));
const $ = (id) => MENU.servicios.find((x) => x.id === id).precio;
const FEE = MENU.cargo_coordinacion;
// Oficios nuevos (27/sep/2026): precios aprobados de agente/data/menus-oficios.json.
const OFI = JSON.parse(fs.readFileSync(path.join(AQUI, "../../../agente/data/menus-oficios.json"), "utf8")).oficios;
const o$ = (id) => { for (const o of Object.values(OFI)) { const x = o.servicios.find((y) => y.id === id); if (x) return x.precio ?? x.rango?.[0]; } throw new Error("Sin precio: " + id); };
const FPS = 30;

const CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#3DD598" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LOGO = `<svg viewBox="0 0 64 64" width="64" height="64"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="#F2621F"/><path d="M20 35 L29 44 L46 26" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const BURBUJA = `<svg viewBox="0 0 24 24" width="46" height="46"><path d="M3.5 6A3 3 0 0 1 6.5 3h11a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H10.2l-4.6 3.7c-.6.5-1.6.1-1.6-.7V17a3 3 0 0 1-.5-1.7z" fill="#fff"/><circle cx="8.3" cy="10" r="1.35" fill="#F2621F"/><circle cx="12" cy="10" r="1.35" fill="#F2621F"/><circle cx="15.7" cy="10" r="1.35" fill="#F2621F"/></svg>`;

// Texto que entra palabra por palabra desde `t` (segundos).
const palabras = (texto, t, clase = "") => texto.split(" ").map((w, i) => `<span class="w ${clase}" style="animation-delay:${(t + i * 0.09).toFixed(2)}s">${w}</span>`).join(" ");
const entra = (t, extra = "") => `style="animation-delay:${t}s;${extra}"`;
const checks = (items, t0, paso = 0.45) => items.map((x, i) => `<div class="ck e" ${entra(t0 + i * paso)}><i>${CHECK}</i>${x}</div>`).join("");
// Una escena visible de `a` a `b` segundos.
const escena = (a, b, html) => `<section class="sc" style="animation:vis ${(b - a).toFixed(2)}s linear ${a}s both">${html}</section>`;

const VIDEOS = {
  destape: {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Plomería en tu zona</div><h1>${palabras("¿El fregadero no baja?", 0.25)}</h1>`),
      escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Destape simple · precio fijo</div><div class="big pop" ${entra(3.45)}>$${$("destape-simple")}</div><p class="sub e" ${entra(3.9)}>+ $${FEE} de coordinación</p>`),
      escena(6.2, 10.6, `<div class="lista">${checks(["Fregadero, lavamanos, ducha o inodoro", "Te decimos el precio antes de llegar", "Plomero licenciado de tu zona", "12 meses de garantía por escrito"], 6.35)}</div>`),
      escena(10.6, 13.4, `<div class="chat pop" ${entra(10.7)}>${BURBUJA}</div><h2>${palabras("Mándanos una foto", 10.85)}</h2><p class="sub e" ${entra(11.5)}>y te damos el precio y la hora.</p>`),
    ].join(""),
  },
  calentador: {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Calentador de agua</div><h1>${palabras("¿Ducha fría otra vez?", 0.25)}</h1>`),
      escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Instalación de calentador</div><div class="big pop" ${entra(3.45)}>$${$("calentador-tanque")}</div><p class="sub e" ${entra(3.9)}>de tanque · de línea $${$("calentador-linea")}<br>+ $${FEE} de coordinación</p>`),
      escena(6.2, 10.6, `<h2>${palabras("¿Tiene más de 8 años?", 6.35)}</h2><p class="sub e" ${entra(7.3)} >Casi siempre sale más barato <b class="o">cambiarlo que repararlo.</b></p>`),
      escena(10.6, 13.4, `<div class="lista">${checks(["Plomero licenciado", "Precio antes de llegar", "12 meses de garantía"], 10.7, 0.4)}</div>`),
    ].join(""),
  },
  sorpresas: {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<h1 class="m">${palabras("¿Te dijeron un precio y al final te cobraron el doble?", 0.15)}</h1>`),
      escena(3.2, 6.2, `<h1>${palabras("Aquí eso", 3.3)}<br>${palabras("no pasa.", 3.6, "o")}</h1>`),
      escena(6.2, 10.6, `<div class="lista">${checks(["El precio no sube en tu casa", "Si aparece algo, tú apruebas primero", "Aviso 30 minutos antes de llegar"], 6.35, 0.55)}</div>`),
      escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Por escrito</div><h2>${palabras("12 meses de garantía.", 10.85)}</h2><p class="sub e" ${entra(11.6)}>Si algo falla, volvemos en 48 horas.</p>`),
    ].join(""),
  },
  // ── Clientes de los oficios nuevos (27/sep/2026): armar-clientes-oficios.sh les pega la ciudad y el CTA. ──
  "cli-aire-mantenimiento": { dur: 13.4, html: [
    escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Aire acondicionado</div><h1 class="m">${palabras("¿Tu split ya no enfría como antes?", 0.25)}</h1>`),
    escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Mantenimiento · precio fijo</div><div class="big pop" ${entra(3.45)}>$${o$("aire-mantenimiento")}</div><p class="sub e" ${entra(3.9)}>cada split adicional $${o$("aire-mantenimiento-adicional")}</p>`),
    escena(6.2, 10.6, `<div class="lista">${checks(["Lavado de evaporador y turbina", "Bandeja, drenaje y condensadora", "Técnico licenciado", "12 meses de garantía"], 6.35)}</div>`),
    escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Cada 6 meses</div><h2>${palabras("Enfría más y gasta menos luz.", 10.85)}</h2>`),
  ].join("") },
  "cli-aire-enfria": { dur: 13.4, html: [
    escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Aire acondicionado</div><h1>${palabras("¿El aire no enfría?", 0.25)}</h1>`),
    escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Visita de diagnóstico</div><div class="big pop" ${entra(3.45)}>$${o$("aire-diagnostico")}</div><p class="sub e" ${entra(3.9)}>se acredita al trabajo · + $${FEE} de coordinación</p>`),
    escena(6.2, 10.6, `<div class="lista">${checks(["Te decimos qué tiene", "El precio por escrito antes de tocar nada", "Técnico licenciado", "12 meses de garantía"], 6.35)}</div>`),
    escena(10.6, 13.4, `<div class="chat pop" ${entra(10.7)}>${BURBUJA}</div><h2>${palabras("Mándanos una foto", 10.85)}</h2><p class="sub e" ${entra(11.5)}>del split y te damos la hora.</p>`),
  ].join("") },
  "cli-hm-tv": { dur: 13.4, html: [
    escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Handyman</div><h1>${palabras("¿La TV sigue en el piso?", 0.25)}</h1>`),
    escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Montar TV · precio fijo</div><div class="big pop" ${entra(3.45)}>$${o$("hm-tv")}</div><p class="sub e" ${entra(3.9)}>hasta 65 pulgadas · base aparte</p>`),
    escena(6.2, 10.6, `<div class="lista">${checks(["Nivelada y segura", "El área queda limpia", "Precio antes de llegar", "12 meses de garantía"], 6.35)}</div>`),
    escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Y de paso</div><h2>${palabras("Repisas, cuadros, cortinas o esa puerta que roza.", 10.85)}</h2>`),
  ].join("") },
  "cli-hm-lista": { dur: 13.4, html: [
    escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Handyman</div><h1 class="m">${palabras("¿Tienes una lista de arreglos pendientes?", 0.25)}</h1>`),
    escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Precio fijo por tarea</div><h1>${palabras("Desde", 3.45)} <span class="w o" style="animation-delay:3.6s">$${o$("hm-mueble")}.</span></h1>`),
    escena(6.2, 10.6, `<div class="lista">${checks([`Montar TV · $${o$("hm-tv")}`, `Armar muebles · $${o$("hm-mueble")}`, `Cerraduras · $${o$("hm-cerradura")}`, `Parchar paredes · $${o$("hm-drywall")}`], 6.35)}</div>`),
    escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Registrado en DACO</div><h2>${palabras("12 meses de garantía.", 10.85)}</h2><p class="sub e" ${entra(11.6)}>Por escrito.</p>`),
  ].join("") },
  "cli-el-breaker": { dur: 13.4, html: [
    escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Electricidad</div><h1>${palabras("¿Se te dispara el breaker?", 0.25)}</h1>`),
    escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Visita de diagnóstico</div><div class="big pop" ${entra(3.45)}>$${o$("el-diagnostico")}</div><p class="sub e" ${entra(3.9)}>se acredita al trabajo · + $${FEE} de coordinación</p>`),
    escena(6.2, 10.6, `<div class="lista">${checks(["Perito electricista licenciado", "Te decimos qué lo causa", "El precio antes de tocar nada", "12 meses de garantía"], 6.35)}</div>`),
    escena(10.6, 13.4, `<h2>${palabras("No lo dejes así.", 10.7)}</h2><p class="sub e" ${entra(11.4)}>Un breaker que se dispara <b class="o">siempre avisa de algo.</b></p>`),
  ].join("") },
  "cli-el-abanico": { dur: 13.4, html: [
    escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Electricidad</div><h1 class="m">${palabras("¿Ese abanico lleva meses en la caja?", 0.25)}</h1>`),
    escena(3.2, 6.2, `<div class="eye e" ${entra(3.3)}>Instalar abanico · precio fijo</div><div class="big pop" ${entra(3.45)}>$${o$("el-abanico")}</div><p class="sub e" ${entra(3.9)}>con base existente</p>`),
    escena(6.2, 10.6, `<div class="lista">${checks([`Lámparas · $${o$("el-lampara")}`, `Receptáculos · $${o$("el-receptaculo")}`, `GFCI · $${o$("el-gfci")}`, "Perito electricista licenciado"], 6.35)}</div>`),
    escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Por escrito</div><h2>${palabras("12 meses de garantía.", 10.85)}</h2>`),
  ].join("") },
  // ── Reclutamiento de oficios (27/sep/2026, Elvin: "los 4 videos antes de prender"). Mismos cortes; sin cifras ni
  // porcentajes (se explican en la entrevista). armar-oficios.sh les pega la historia del puesto y cta-rec.
  "rec-aire": {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Técnicos de aire acondicionado</div><h1 class="m">${palabras("¿Tienes licencia de aire y te faltan clientes?", 0.25)}</h1>`),
      escena(3.2, 6.2, `<h1>${palabras("Nosotros te los", 3.3)}<br>${palabras("conseguimos.", 3.75, "o")}</h1>`),
      escena(6.2, 10.6, `<div class="lista">${checks(["Ponemos los clientes y la publicidad", "Tú decides qué trabajos coges", "Mantenimientos que se repiten", "Cobras todos los viernes"], 6.35)}</div>`),
      escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Requisito</div><h2>${palabras("Licencia de técnico de refrigeración", 10.85)}</h2><p class="sub e" ${entra(11.7)}>y EPA 608 · 2 cupos por área</p>`),
    ].join(""),
  },
  "rec-handyman": {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Handyman</div><h1 class="m">${palabras("¿Eres bueno con las manos y quieres más trabajo?", 0.25)}</h1>`),
      escena(3.2, 6.2, `<h2>${palabras("TV, muebles, puertas, cerraduras, drywall.", 3.3)}</h2><p class="sub e" ${entra(4.3)}>Clientes en tu zona, <b class="o">sin salir a buscarlos.</b></p>`),
      escena(6.2, 10.6, `<div class="lista">${checks(["Ponemos los clientes y la publicidad", "Tú decides qué trabajos coges", "Precio fijo: sin regatear", "Cobras todos los viernes"], 6.35)}</div>`),
      escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Requisito</div><h2>${palabras("Registro de contratista en DACO", 10.85)}</h2><p class="sub e" ${entra(11.7)}>o en trámite · 2 cupos por área</p>`),
    ].join(""),
  },
  "rec-perito": {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Peritos electricistas</div><h1 class="m">${palabras("¿Eres perito y quieres clientes sin buscarlos?", 0.25)}</h1>`),
      escena(3.2, 6.2, `<h1>${palabras("Nosotros te los", 3.3)}<br>${palabras("conseguimos.", 3.75, "o")}</h1>`),
      escena(6.2, 10.6, `<div class="lista">${checks(["Receptáculos, abanicos, breakers, 220", "Tú decides qué trabajos coges", "Pagamos la publicidad", "Cobras todos los viernes"], 6.35)}</div>`),
      escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Requisito</div><h2>${palabras("Licencia de Perito Electricista", 10.85)}</h2><p class="sub e" ${entra(11.6)}>2 cupos por área</p>`),
    ].join(""),
  },
  "rec-cotizador": {
    dur: 13.4,
    html: [
      escena(0, 3.2, `<div class="eye e" ${entra(0.1)}>Cotizador de proyectos</div><h1 style="font-size:92px">${palabras("¿Sabes cotizar remodelaciones?", 0.25)}</h1>`),
      escena(3.2, 6.2, `<h2>${palabras("Cocinas, baños, piscinas y techos.", 3.3)}</h2><p class="sub e" ${entra(4.2)}>Nosotros ponemos los clientes. <b class="o">Tú vas, mides y cotizas.</b></p>`),
      escena(6.2, 10.6, `<div class="lista">${checks(["Comisión por cada proyecto vendido", "Cotizas con nuestra app", "Tú organizas tu agenda", "Cobras todos los viernes"], 6.35)}</div>`),
      escena(10.6, 13.4, `<div class="eye e" ${entra(10.7)}>Buscamos</div><h2>${palabras("Experiencia en construcción", 10.85)}</h2><p class="sub e" ${entra(11.6)}>o venta de proyectos · pocos cupos</p>`),
    ].join(""),
  },
  // Cierre de los videos de reclutamiento.
  "cta-rec": {
    dur: 2.6,
    html: escena(0, 2.6, `<div class="marca e" ${entra(0.05)}>${LOGO}<span>resuelto</span></div><p class="sub e" ${entra(0.2)}>¿Eres tú?</p><h2 class="cta-h">${palabras("Escríbenos un mensaje", 0.35)}</h2><p class="sub e" ${entra(0.9)}>y cuadramos una entrevista por videollamada.</p>`),
  },
  // Tarjeta final con el CTA suave (va después del cierre de la ciudad en los 4 videos).
  cta: {
    dur: 2.6,
    html: escena(0, 2.6, `<div class="marca e" ${entra(0.05)}>${LOGO}<span>resuelto</span></div><p class="sub e" ${entra(0.2)}>¿Te pasó algo así?</p><h2 class="cta-h">${palabras("Escríbenos un mensaje", 0.35)}</h2><p class="sub e" ${entra(0.9)}>y te damos tu precio en minutos.</p><div class="boton e" ${entra(1.2)}>${BURBUJA}<span>Escríbenos un mensaje</span></div>`).replace("animation:vis 2.60s linear 0s both", "animation:vis-fin 2.6s linear 0s both"),
  },
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#071B2C;font-family:'DM Sans',sans-serif;color:#fff}
.glow{position:absolute;right:-300px;top:-300px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(242,98,31,.30),rgba(242,98,31,0) 65%)}
.sc{position:absolute;inset:0;padding:0 90px;display:flex;flex-direction:column;justify-content:center}
h1{font-family:'Sora';font-weight:800;font-size:124px;line-height:1.02;letter-spacing:-4px}
h1.m{font-size:100px}
h2{font-family:'Sora';font-weight:800;font-size:96px;line-height:1.05;letter-spacing:-3px}
.cta-h{font-size:92px;margin:10px 0 6px}
.o{color:#F2621F}
.eye{font-family:'Sora';font-weight:700;font-size:30px;letter-spacing:6px;text-transform:uppercase;color:#F2621F;margin-bottom:26px}
.big{font-family:'Sora';font-weight:800;font-size:330px;letter-spacing:-12px;line-height:1;color:#F2621F}
.sub{font-size:44px;line-height:1.35;color:#C9D6E0;margin-top:22px;font-weight:500}
.sub b{font-weight:700}
.lista{display:grid;gap:40px}
.ck{display:flex;align-items:center;gap:30px;font-size:52px;font-weight:600;line-height:1.2}
.ck i{flex:none;width:78px;height:78px;border-radius:50%;background:#153F33;display:flex;align-items:center;justify-content:center}.ck i svg{width:42px}
.chat{width:150px;height:150px;border-radius:40px;background:#F2621F;display:flex;align-items:center;justify-content:center;margin-bottom:40px}.chat svg{width:84px;height:84px}
.marca{display:flex;align-items:center;gap:16px;font-family:'Sora';font-weight:800;font-size:54px;letter-spacing:-2px;margin-bottom:40px}
.boton{display:inline-flex;align-self:flex-start;align-items:center;gap:18px;background:#F2621F;border-radius:28px;padding:30px 44px;font-family:'Sora';font-weight:700;font-size:44px;margin-top:50px;animation-name:entra,late!important;animation-duration:.5s,1.4s!important;animation-iteration-count:1,infinite!important}
.w{display:inline-block;animation:sube .45s cubic-bezier(.2,.8,.2,1) both}
.e{animation:entra .5s cubic-bezier(.2,.8,.2,1) both}
.pop{animation:pop .55s cubic-bezier(.2,1.4,.3,1) both}
@keyframes sube{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
@keyframes entra{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes late{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes vis{0%{opacity:0}4%{opacity:1}96%{opacity:1}100%{opacity:0}}
@keyframes vis-fin{0%{opacity:0}8%{opacity:1}100%{opacity:1}}`;

async function render(nombre, v, browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="glow"></div>${v.html}</body></html>`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  const salida = path.join(AQUI, `${nombre}.mp4`);
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-r", String(FPS), salida], { stdio: ["pipe", "inherit", "inherit"] });
  const cuadros = Math.round(v.dur * FPS);
  for (let f = 0; f < cuadros; f++) {
    const ms = (f / FPS) * 1000;
    await page.evaluate((t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, ms);
    const img = await page.screenshot({ type: "jpeg", quality: 92, optimizeForSpeed: true, captureBeyondViewport: false });
    if (f % 60 === 0) console.log(`  ${nombre}: cuadro ${f}/${cuadros}`);
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((ok, ko) => ff.on("close", (c) => (c === 0 ? ok() : ko(new Error("ffmpeg " + c)))));
  await page.close();
  console.log(`listo: motion/${nombre}.mp4 (${v.dur}s, ${cuadros} cuadros)`);
}

const pedidos = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VIDEOS);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--force-device-scale-factor=1", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"], protocolTimeout: 60000 });
try { for (const n of pedidos) await render(n, VIDEOS[n], browser); } finally { await browser.close(); }
