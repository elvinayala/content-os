// Video tutorial: cómo instalar Resuelto Pro en el celular y activar las alertas (24/oct/2026, Aure: "que detalle cómo
// sale en Android o iPhone para instalar la app; hay muchas personas que no son tecnológicas"). Pantallas de celular
// animadas con los colores reales de la app (agente/portal/pro.html), un dedo que toca cada botón y el paso escrito
// grande arriba. Mismo motor que render.mjs: HTML con animaciones CSS, cuadro por cuadro con Chrome, ffmpeg a 30 fps.
//
// Uso: node tutorial-app.mjs                 → completo, iphone y android
//      node tutorial-app.mjs iphone          → solo ese
// Sale en ../tutorial/resuelto-pro-instalar-<variante>.mp4 (con música suave).
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(AQUI, "../../../agente/package.json"));
const puppeteer = require("puppeteer-core");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FPS = 30;
const OUT = path.join(AQUI, "../tutorial");
const ICONO = "data:image/png;base64," + fs.readFileSync(path.join(AQUI, "../../../agente/portal/icon-192.png")).toString("base64");

const CASA = (px, oscuro) => `<svg width="${px}" height="${px}" viewBox="0 0 64 64"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="${oscuro ? "#fff" : "#0F3D5E"}"/><path d="M20 35 L29 44 L46 26" stroke="#F2621F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const COMPARTIR = `<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#0A84FF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16"/><path d="M12 14V3M8.5 6.5 12 3l3.5 3.5"/></svg>`;
const MAS_CUADRO = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;

const entra = (t, extra = "") => `style="animation-delay:${t.toFixed(2)}s;${extra}"`;
// Dedo: círculo que llega, toca (se encoge) y suelta una onda. Se coloca solo (al cargar la página) en el centro de lo
// marcado con data-blanco en la misma escena, así nunca cae fuera del botón.
const toque = (t) => `<div class="dedo" style="animation-delay:${t.toFixed(2)}s,${(t + 0.55).toFixed(2)}s"></div><div class="onda" style="animation-delay:${(t + 0.6).toFixed(2)}s"></div>`;
const marcar = (t) => `data-blanco style="animation-delay:${t.toFixed(2)}s"`; // brillo naranja en lo que hay que tocar

// Texto del paso, arriba del celular
const paso = (t, n, titulo, sub = "") => `<div class="paso e" ${entra(t + 0.1)}>${n ? `<span class="num">${n}</span>` : ""}<div><h3>${titulo}</h3>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
const tel = (pantalla, sistema = "ios") => `<div class="tel ${sistema}"><div class="pant">${pantalla}</div></div>`;
const barraEstado = (oscura) => `<div class="estado${oscura ? " osc" : ""}"><b>9:41</b><span>▮▮▮ ◔ ▭</span></div>`;

// La app (lo que ve el plomero al abrir su link)
const app = (cuerpo, conEstado = true) => `${conEstado ? barraEstado(true) : ""}<div class="app"><header>${CASA(40, true)}<span class="marca">resuelto</span><span class="pro">PRO</span><span class="quien">Samuel</span></header><main>${cuerpo}</main><nav><span class="on"><b>🔧</b>Trabajos</span><span><b>💵</b>Mis pagos</span><span><b>💬</b>Ayuda</span></nav></div>`;
const vacio = `<div class="vacio"><b>🔎</b>Todavía no hay trabajos en tu zona.<br>Te avisamos cuando salga uno.</div>`;
const cardIOS = `<div class="alertas"><b>🔔 Para que te suene cuando salga un trabajo:</b><br>toca <b>Compartir</b> (el cuadrito con la flecha) y luego <b>Añadir a pantalla de inicio</b>.</div>`;
const cardAlertas = (t) => `<div class="alertas"><b>🔔 Activa las alertas</b><br>Así te suena el celular cuando sale un trabajo en tu zona.<div class="btn${t >= 0 ? " brilla" : ""}" ${t >= 0 ? marcar(t) : ""}>Activar alertas</div></div>`;

// ── Pantallas de iPhone (Safari) ──
const safari = (t, marcarCompartir) => `${app(cardIOS + vacio)}<div class="safari"><div class="url">🔒 app.resueltopr.com</div><div class="iconos"><span>‹</span><span>›</span><span class="${marcarCompartir ? "brilla" : ""}" ${marcarCompartir ? marcar(t) : ""}>${COMPARTIR}</span><span>📖</span><span>⧉</span></div></div>`;
const hojaCompartir = (t) => `${app(cardIOS + vacio)}<div class="velo e2" ${entra(t)}></div><div class="hoja sube" ${entra(t)}><div class="hoja-top"><img src="${ICONO}"><div><b>Resuelto Pro</b><small>app.resueltopr.com</small></div></div>
  <div class="grupo"><div class="fila">Copiar<span>⧉</span></div><div class="fila">Añadir a lista de lectura<span>👓</span></div><div class="fila">Añadir marcador<span>📖</span></div></div>
  <div class="grupo"><div class="fila">Añadir a favoritos<span>☆</span></div><div class="fila brilla" ${marcar(t + 1.2)}><b>Añadir a pantalla de inicio</b>${MAS_CUADRO}</div><div class="fila">Buscar en la página<span>🔍</span></div></div></div>`;
const dialogoIOS = (t) => `${barraEstado()}<div class="ios-dialogo"><div class="nav-ios"><span>Cancelar</span><b>Añadir a pantalla de inicio</b><span class="azul brilla" ${marcar(t + 1.4)}>Añadir</span></div>
  <div class="grupo dlg"><div class="dlg-fila"><img src="${ICONO}"><div><div class="campo">Resuelto Pro</div><small>app.resueltopr.com</small></div></div></div>
  <div class="grupo dlg"><div class="dlg-fila sw">Abrir como app web<i class="switch"></i></div></div><p class="nota-ios">Se añadirá un ícono a tu pantalla de inicio para que puedas acceder rápidamente a este sitio web.</p></div>`;
const inicio = (t, sistema) => `${barraEstado(true)}<div class="inicio ${sistema}">${Array.from({ length: 15 }, (_, i) => `<div class="ico"><i style="background:${["#4C8BF5", "#34C759", "#FF9F0A", "#AF52DE", "#FF453A", "#5AC8FA", "#8E8E93"][i % 7]}"></i><small>${["Teléfono", "Mensajes", "Fotos", "Cámara", "Mapas", "Reloj", "Ajustes", "Correo", "Notas", "Clima", "Música", "Tienda", "Salud", "Wallet", "Calendario"][i]}</small></div>`).join("")}<div class="ico nuevo pop" ${entra(t + 0.5)}><img src="${ICONO}" class="brilla" ${marcar(t + 1.4)}><small>Resuelto Pro</small></div></div>`;

// ── Pantallas de Android (Chrome) ──
const chrome = (t, marcarPuntos) => `${barraEstado()}<div class="chrome"><span class="casita">⌂</span><div class="url">app.resueltopr.com/pro</div><span class="puntos ${marcarPuntos ? "brilla" : ""}" ${marcarPuntos ? marcar(t) : ""}>⋮</span></div>${app(vacio, false)}`;
const menuChrome = (t) => `${chrome(t, false)}<div class="menu-a e2" ${entra(t)}><div class="m-iconos">→ ☆ ⤓ ⓘ ↻</div>${["Nueva pestaña", "Nueva pestaña de incógnito", "Historial", "Descargas", "Favoritos", "Pestañas recientes"].map((x) => `<div class="m-fila">${x}</div>`).join("")}<div class="m-fila brilla" ${marcar(t + 1.2)}><b>📲 Instalar aplicación</b></div><div class="m-fila">Compartir…</div><div class="m-fila">Traducir…</div></div>`;
const dialogoAndroid = (t) => `${chrome(t, false)}<div class="velo e2" ${entra(t)}></div><div class="a-dialogo pop" ${entra(t)}><h4>¿Instalar la aplicación?</h4><div class="a-app"><img src="${ICONO}"><div><b>Resuelto Pro</b><small>app.resueltopr.com</small></div></div><div class="a-botones"><span>Cancelar</span><span class="brilla" ${marcar(t + 1.3)}>Instalar</span></div></div>`;

// ── Alertas (igual en los dos) ──
const permiso = (t, sistema) => sistema === "ios"
  ? `${app(cardAlertas(-1) + vacio)}<div class="velo e2" ${entra(t)}></div><div class="ios-permiso pop" ${entra(t)}><b>“Resuelto Pro” quiere enviarte notificaciones</b><p>Las notificaciones pueden incluir alertas, sonidos y globos de aviso.</p><div class="ios-bots"><span>No permitir</span><span class="brilla" ${marcar(t + 1.2)}><b>Permitir</b></span></div></div>`
  : `${app(cardAlertas(-1) + vacio)}<div class="velo e2" ${entra(t)}></div><div class="a-dialogo pop" ${entra(t)}><div class="a-campana">🔔</div><h4 class="centro">¿Permitir que Resuelto Pro te envíe notificaciones?</h4><div class="a-col"><span class="brilla" ${marcar(t + 1.2)}>Permitir</span><span>No permitir</span></div></div>`;
const trabajo = `<div class="card nuevo"><div class="que">Destape de fregadero</div><div class="dato"><span>📍</span><span>Quebradillas · a 8 min de ti</span></div><div class="dato"><span>🕘</span><span>Hoy, 2:00 PM</span></div><div class="cobras"><small>Tú cobras</small><b>$97</b></div><div class="btn verde">Aceptar trabajo</div></div>`;
const listo = (t) => `${app(trabajo)}<div class="noti baja" ${entra(t + 0.3)}><img src="${ICONO}"><div><b>Resuelto Pro · ahora</b><span>🔧 Trabajo nuevo en tu zona: destape en Quebradillas. El primero que acepta se lo lleva.</span></div></div>`;

// ── Escenas: [duración, (t0) => html] ──
const portada = (sub) => [4.2, (t) => `<div class="centro-v"><img class="logo-app pop" src="${ICONO}" ${entra(t + 0.1)}><div class="eye e" ${entra(t + 0.4)}>Resuelto Pro · para plomeros</div><h1 class="e" ${entra(t + 0.6)}>Instala tu app en 1 minuto</h1><p class="sub e" ${entra(t + 1.1)}>${sub}</p></div>`];
const abrirLink = [5.6, (t) => `${paso(t, 1, "Abre el link que te mandamos por WhatsApp", "Es tu link personal: no lo compartas.")}${tel(`${barraEstado()}<div class="wa"><div class="wa-top">‹ <b>Resuelto</b></div><div class="wa-chat"><div class="burbuja e" ${entra(t + 0.4)}>¡Bienvenido a Resuelto, Samuel! 🔧<br><br>Esta es tu app para recibir trabajos:<br><u class="brilla" ${marcar(t + 1.6)}>app.resueltopr.com/a/samuel/7KQ2</u></div></div></div>${toque(t + 1.6)}`)}`];
const titulo = (logo, nombre, nota) => [3.4, (t) => `<div class="centro-v"><div class="sis pop" ${entra(t + 0.1)}>${logo}</div><h1 class="e" ${entra(t + 0.35)}>${nombre}</h1><p class="sub e" ${entra(t + 0.8)}>${nota}</p></div>`];
const LOGO_APPLE = `<svg viewBox="0 0 24 24" width="150" height="150" fill="#fff"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8C6.9 7.3 5.5 8.2 4.7 9.6c-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.3 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6 0 0-2.4-.9-2.4-3.6zM14.2 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3z"/></svg>`;
const LOGO_ANDROID = `<svg viewBox="0 0 24 24" width="150" height="150" fill="#3DDC84"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>`;

const IPHONE = [
  titulo(LOGO_APPLE, "Si tienes iPhone", "Ábrelo en <b class='o'>Safari</b>, la brújula azul."),
  [6.2, (t) => `${paso(t, 2, "Toca Compartir", "Es el cuadrito con la flecha, abajo. Si no lo ves, toca primero los 3 puntitos ··· ")}${tel(safari(t + 1.2, true) + toque(t + 1.6))}`],
  [6.4, (t) => `${paso(t, 3, "Baja y toca “Añadir a pantalla de inicio”")}${tel(hojaCompartir(t + 0.3) + toque(t + 2.6))}`],
  [5.6, (t) => `${paso(t, 4, "Toca “Añadir”, arriba a la derecha", "Deja prendido “Abrir como app web”.")}${tel(dialogoIOS(t) + toque(t + 2))}`],
  [5.2, (t) => `${paso(t, 5, "Abre Resuelto Pro desde el ícono nuevo", "De ahora en adelante, entra siempre por ahí.")}${tel(inicio(t, "ios") + toque(t + 2.2))}`],
];
const ANDROID = [
  titulo(LOGO_ANDROID, "Si tienes Android", "Ábrelo en <b class='o'>Chrome</b>, el círculo de colores."),
  [5.6, (t) => `${paso(t, 2, "Toca los 3 puntitos ⋮", "Arriba, a la derecha.")}${tel(chrome(t + 1.1, true) + toque(t + 1.6), "android")}`],
  [6.2, (t) => `${paso(t, 3, "Toca “Instalar aplicación”", "En algunos celulares dice “Añadir a pantalla de inicio”.")}${tel(menuChrome(t + 0.3) + toque(t + 2.4), "android")}`],
  [5.2, (t) => `${paso(t, 4, "Toca “Instalar”")}${tel(dialogoAndroid(t + 0.3) + toque(t + 2.1), "android")}`],
  [5.2, (t) => `${paso(t, 5, "Abre Resuelto Pro desde el ícono nuevo", "De ahora en adelante, entra siempre por ahí.")}${tel(inicio(t, "android") + toque(t + 2.2), "android")}`],
];
const alertas = (n, sistema) => [
  [5.6, (t) => `${paso(t, n, "Toca “Activar alertas”", "Está en la primera pantalla de la app.")}${tel(app(cardAlertas(t + 1.2) + vacio) + toque(t + 1.8), sistema)}`],
  [5.2, (t) => `${paso(t, n + 1, "Toca “Permitir”", "Si no lo permites, el celular no te va a sonar.")}${tel(permiso(t + 0.3, sistema) + toque(t + 2), sistema)}`],
  [5.6, (t) => `${paso(t, "✓", "¡Listo! Te suena cuando salga un trabajo", "El primero que acepta se lo lleva.")}${tel(listo(t + 0.2), sistema)}`],
];
const cierre = [4.6, (t) => `<div class="centro-v"><img class="logo-app pop" src="${ICONO}" ${entra(t + 0.1)}><h2 class="e" ${entra(t + 0.4)}>¿Te trabaste en algún paso?</h2><p class="sub e" ${entra(t + 0.9)}>Escríbele a <b class="o">Resuelto</b> por WhatsApp<br>y te ayudamos a instalarla.</p></div>`];
const separador = (texto) => [2.6, (t) => `<div class="centro-v"><h2 class="e" ${entra(t + 0.1)}>${texto}</h2></div>`];

const VARIANTES = {
  iphone: [portada("Para <b class='o'>iPhone</b>"), abrirLink, ...IPHONE, ...alertas(6, "ios"), cierre],
  android: [portada("Para <b class='o'>Android</b>"), abrirLink, ...ANDROID, ...alertas(6, "android"), cierre],
  completo: [portada("iPhone y Android, paso a paso"), abrirLink, ...IPHONE, ...ANDROID, separador("Ya con la app en tu pantalla, en los dos:"), ...alertas(6, "android"), cierre],
};

const armar = (escenas) => {
  let t = 0; const html = [];
  for (const [d, f] of escenas) { html.push(`<section class="sc" style="animation:vis ${d.toFixed(2)}s linear ${t.toFixed(2)}s both">${f(t)}</section>`); t += d; }
  return { dur: +t.toFixed(2), html: html.join("") };
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#071B2C;font-family:'DM Sans',sans-serif;color:#fff}
.glow{position:absolute;right:-300px;top:-300px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(242,98,31,.28),rgba(242,98,31,0) 65%)}
.sc{position:absolute;inset:0}
.o{color:#F2621F}
.centro-v{position:absolute;inset:0;padding:0 90px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.centro-v h1{font-family:'Sora';font-weight:800;font-size:112px;line-height:1.03;letter-spacing:-4px}
.centro-v h2{font-family:'Sora';font-weight:800;font-size:88px;line-height:1.05;letter-spacing:-3px}
.eye{font-family:'Sora';font-weight:700;font-size:30px;letter-spacing:5px;text-transform:uppercase;color:#F2621F;margin:34px 0 22px}
.sub{font-size:50px;line-height:1.35;color:#C9D6E0;margin-top:30px;font-weight:500}.sub b{font-weight:700}
.logo-app{width:220px;height:220px;border-radius:52px;box-shadow:0 20px 60px rgba(242,98,31,.35)}
.sis{margin-bottom:30px}
/* paso arriba */
.paso{position:absolute;left:70px;right:70px;top:80px;height:330px;display:flex;gap:28px;align-items:flex-start}
.paso .num{flex:none;width:104px;height:104px;border-radius:52px;background:#F2621F;display:flex;align-items:center;justify-content:center;font-family:'Sora';font-weight:800;font-size:56px}
.paso h3{font-family:'Sora';font-weight:800;font-size:64px;line-height:1.08;letter-spacing:-2px}
.paso p{font-size:38px;line-height:1.3;color:#C9D6E0;margin-top:16px;font-weight:500}
/* celular: 720×1360 de pantalla */
.tel{position:absolute;left:160px;top:430px;transform:scale(.88);transform-origin:50% 0;width:760px;height:1560px;border-radius:96px;background:#1b1f24;padding:20px;box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 0 0 3px #3a414a}
.pant{position:relative;width:720px;height:1520px;border-radius:78px;overflow:hidden;background:#FBF7F0;color:#12283A;font-size:24px}
.tel.ios .pant:before{content:"";position:absolute;left:50%;top:18px;width:200px;height:58px;margin-left:-100px;background:#000;border-radius:30px;z-index:40}
.tel.android .pant:before{content:"";position:absolute;left:50%;top:24px;width:30px;height:30px;margin-left:-15px;background:#000;border-radius:50%;z-index:40}
.estado{position:absolute;left:0;right:0;top:0;height:92px;display:flex;justify-content:space-between;align-items:center;padding:14px 60px 0;font-size:26px;color:#12283A;z-index:30}
.estado.osc{color:#fff}.estado span{font-size:20px;letter-spacing:2px}
/* la app */
.app{position:absolute;inset:0;background:#FBF7F0}
.app header{background:#0F3D5E;color:#fff;padding:104px 26px 22px;display:flex;align-items:center;gap:12px}
.app .marca{font-family:Sora;font-weight:800;font-size:34px;letter-spacing:-1px}.app .pro{background:#F2621F;font-family:Sora;font-size:18px;font-weight:800;padding:4px 10px;border-radius:8px}
.app .quien{margin-left:auto;font-size:24px;color:#CFE0EC}
.app main{padding:24px}
.app nav{position:absolute;left:0;right:0;bottom:0;height:150px;background:#fff;border-top:1px solid #E6E1D8;display:flex;padding-top:14px}
.app nav span{flex:1;display:flex;flex-direction:column;align-items:center;font-size:22px;font-weight:700;color:#51606C}.app nav b{font-size:38px}.app nav .on{color:#F2621F}
.alertas{background:#FFF4EC;border:3px solid #F2621F;border-radius:22px;padding:24px;margin-bottom:20px;font-size:27px;line-height:1.4}
.btn{display:flex;align-items:center;justify-content:center;border-radius:22px;font-weight:700;font-size:30px;padding:26px;margin-top:16px;background:#F2621F;color:#fff}
.btn.verde{background:#1F9D6B}
.vacio{text-align:center;color:#51606C;padding:40px 20px;font-size:27px;line-height:1.4}.vacio b{display:block;font-size:60px;margin-bottom:8px}
.card{background:#fff;border-radius:24px;padding:26px;box-shadow:0 6px 24px rgba(8,36,58,.08)}.card.nuevo{border:4px solid #F2621F}
.que{font-family:Sora;font-size:32px;font-weight:800}.dato{display:flex;gap:14px;margin-top:14px;font-size:27px}
.cobras{margin-top:20px;background:#EAF7F1;border-radius:18px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center}.cobras b{font-family:Sora;font-size:46px;color:#17805A}.cobras small{font-size:24px;color:#51606C}
/* Safari */
.safari{position:absolute;left:0;right:0;bottom:0;height:200px;background:rgba(247,247,247,.97);border-top:1px solid #ddd;padding:16px 30px 0;z-index:20}
.safari .url{background:#E4E4E9;border-radius:22px;padding:18px;text-align:center;font-size:26px;color:#111}
.safari .iconos{display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0;font-size:40px;color:#0A84FF}.safari .iconos span{display:flex;width:70px;height:70px;align-items:center;justify-content:center;border-radius:20px}
.velo{position:absolute;inset:0;background:rgba(0,0,0,.4);z-index:21}
.hoja{position:absolute;left:0;right:0;bottom:0;height:1020px;background:#F2F2F7;border-radius:40px 40px 0 0;padding:30px 26px;z-index:22}
.hoja-top{display:flex;gap:20px;align-items:center;margin-bottom:26px}.hoja-top img{width:84px;height:84px;border-radius:20px}.hoja-top b{font-size:28px}.hoja-top small{display:block;color:#8E8E93;font-size:22px}
.grupo{background:#fff;border-radius:24px;margin-bottom:26px;overflow:hidden}
.fila{display:flex;justify-content:space-between;align-items:center;padding:30px 30px;font-size:29px;border-bottom:1px solid #E5E5EA;color:#111}.fila span{font-size:32px}
/* diálogo iOS */
.ios-dialogo{position:absolute;inset:0;background:#F2F2F7;padding-top:60px}
.nav-ios{display:flex;justify-content:space-between;align-items:center;padding:16px 26px 30px;font-size:27px;color:#0A84FF}.nav-ios b{color:#111;font-size:26px}.nav-ios span{padding:8px 12px;border-radius:14px}.azul{font-weight:700}
.dlg{margin:0 26px 20px}.dlg-fila{display:flex;gap:22px;align-items:center;padding:24px;font-size:28px;color:#111}.dlg-fila img{width:120px;height:120px;border-radius:28px}.dlg-fila .campo{font-size:32px;border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:8px;width:420px}.dlg-fila small{color:#8E8E93;font-size:22px}
.dlg-fila.sw{justify-content:space-between}.switch{width:100px;height:60px;border-radius:30px;background:#34C759;position:relative}.switch:after{content:"";position:absolute;right:4px;top:4px;width:52px;height:52px;border-radius:26px;background:#fff}
.nota-ios{margin:0 44px;color:#6D6D72;font-size:22px;line-height:1.4}
.ios-permiso{position:absolute;left:110px;right:110px;top:560px;background:rgba(242,242,247,.98);border-radius:34px;text-align:center;z-index:22;overflow:hidden}
.ios-permiso b{display:block;font-size:29px;padding:34px 30px 10px;color:#111}.ios-permiso p{font-size:22px;color:#333;padding:0 30px 30px;line-height:1.35}
.ios-bots{display:flex;border-top:1px solid #ccc}.ios-bots span{flex:1;padding:26px 0;font-size:28px;color:#0A84FF}.ios-bots span+span{border-left:1px solid #ccc}
/* inicio */
.inicio{position:absolute;inset:0;background:linear-gradient(160deg,#2b5876,#4e4376);padding:140px 40px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:46px 20px;align-content:start}
.inicio.android{background:linear-gradient(160deg,#1e3c72,#2a5298)}
.ico{display:flex;flex-direction:column;align-items:center;gap:10px}.ico i{width:128px;height:128px;border-radius:32px;opacity:.85}.inicio.android .ico i{border-radius:64px}
.ico small{font-size:20px;color:#fff}.ico img{width:128px;height:128px;border-radius:32px}.inicio.android .ico img{border-radius:64px}
.ico.nuevo{grid-column:1;grid-row:5}.ico.nuevo small{font-weight:700}
/* Chrome */
.chrome{position:absolute;left:0;right:0;top:92px;height:100px;background:#fff;display:flex;align-items:center;gap:16px;padding:0 20px;z-index:20;border-bottom:1px solid #ddd}
.chrome .url{flex:1;background:#EEF1F4;border-radius:40px;padding:18px 26px;font-size:26px;color:#222}.chrome .casita{font-size:38px;color:#444}
.chrome .puntos{font-size:48px;color:#333;width:70px;height:70px;display:flex;align-items:center;justify-content:center;border-radius:35px;font-weight:700}
.chrome~.app{top:192px}.chrome~.app header{padding-top:22px}
.menu-a{position:absolute;right:16px;top:110px;width:500px;background:#fff;border-radius:22px;box-shadow:0 12px 40px rgba(0,0,0,.3);z-index:25;padding:10px 0}
.m-iconos{display:flex;justify-content:space-around;font-size:34px;color:#444;padding:14px 0 18px;border-bottom:1px solid #eee}
.m-fila{padding:24px 30px;font-size:28px;color:#222}
.a-dialogo{position:absolute;left:60px;right:60px;top:520px;background:#F3EDF7;border-radius:40px;padding:44px 40px 30px;z-index:22;color:#1D1B20}
.a-dialogo h4{font-size:36px;font-weight:600;margin-bottom:30px}.a-dialogo h4.centro{text-align:center}
.a-app{display:flex;gap:22px;align-items:center;margin-bottom:34px}.a-app img{width:100px;height:100px;border-radius:50px}.a-app b{font-size:30px}.a-app small{display:block;font-size:22px;color:#555}
.a-botones{display:flex;justify-content:flex-end;gap:40px;font-size:29px;color:#6750A4;font-weight:600}.a-botones span{padding:14px 20px;border-radius:24px}
.a-campana{text-align:center;font-size:56px;margin-bottom:16px}
.a-col{display:flex;flex-direction:column;gap:14px}.a-col span{text-align:center;padding:24px;border-radius:40px;background:#D0BCFF;font-size:29px;font-weight:600;color:#21005D}.a-col span+span{background:#E8DEF8}
/* WhatsApp */
.wa{position:absolute;inset:0;background:#EFE7DE}.wa-top{background:#F6F6F6;padding:104px 30px 24px;font-size:30px;color:#111;border-bottom:1px solid #ddd}
.wa-chat{padding:40px 30px}.burbuja{background:#fff;border-radius:22px;padding:26px;font-size:27px;line-height:1.4;max-width:600px;box-shadow:0 2px 4px rgba(0,0,0,.08)}.burbuja u{color:#0A66C2;display:inline-block;border-radius:10px;padding:2px 4px}
/* notificación */
.noti{position:absolute;left:24px;right:24px;top:100px;background:rgba(245,245,247,.97);border-radius:34px;padding:24px;display:flex;gap:20px;z-index:30;box-shadow:0 14px 40px rgba(0,0,0,.25)}
.noti img{width:80px;height:80px;border-radius:20px}.noti b{display:block;font-size:22px;color:#555;margin-bottom:4px}.noti span{font-size:26px;line-height:1.3;color:#111}
/* dedo y brillo */
.dedo{position:absolute;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;background:rgba(255,255,255,.3);border:5px solid #fff;box-shadow:0 6px 20px rgba(0,0,0,.35);z-index:50;opacity:0;animation:dedo-llega .5s cubic-bezier(.2,.8,.2,1) both,dedo-toca .7s ease both}
.onda{position:absolute;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;border:6px solid #F2621F;z-index:49;opacity:0;animation:onda .7s ease-out both}
.brilla{animation:brilla 1.2s ease-in-out both;animation-iteration-count:3}
.e{animation:entra .5s cubic-bezier(.2,.8,.2,1) both}.e2{animation:aparece .35s ease both}
.pop{animation:pop .55s cubic-bezier(.2,1.4,.3,1) both}
.sube{animation:sube-hoja .45s cubic-bezier(.2,.8,.2,1) both}.baja{animation:baja .5s cubic-bezier(.2,1.2,.3,1) both}
@keyframes entra{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
@keyframes aparece{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes sube-hoja{from{transform:translateY(100%)}to{transform:none}}
@keyframes baja{from{opacity:0;transform:translateY(-140%)}to{opacity:1;transform:none}}
@keyframes dedo-llega{from{opacity:0;transform:translate(160px,220px) scale(1.2)}to{opacity:1;transform:none}}
@keyframes dedo-toca{0%{scale:1}35%{scale:.72}70%{scale:1}100%{scale:1}}
@keyframes onda{0%{opacity:0;transform:scale(.6)}1%{opacity:1;transform:scale(.6)}100%{opacity:0;transform:scale(2.2)}}
@keyframes brilla{0%,100%{box-shadow:0 0 0 0 rgba(242,98,31,0);background-color:transparent}50%{box-shadow:0 0 0 8px rgba(242,98,31,.9);background-color:rgba(242,98,31,.18)}}
.btn.brilla{animation-name:brilla-btn}@keyframes brilla-btn{0%,100%{box-shadow:0 0 0 0 rgba(242,98,31,0)}50%{box-shadow:0 0 0 12px rgba(242,98,31,.35)}}
.a-col span.brilla{animation-name:brilla-btn}
@keyframes vis{0%{opacity:0}3%{opacity:1}97%{opacity:1}100%{opacity:0}}`;

async function render(nombre, v, browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="glow"></div>${v.html}</body></html>`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = 1e7; } // medir con todo ya en su sitio
    for (const sc of document.querySelectorAll(".sc")) {
      const pant = sc.querySelector(".pant"), blancos = sc.querySelectorAll("[data-blanco]");
      if (!pant || !blancos.length) continue;
      sc.style.animationPlayState = "paused"; const vis = sc.style.opacity; sc.style.opacity = 1;
      const p = pant.getBoundingClientRect(), b = blancos[blancos.length - 1].getBoundingClientRect(), k = p.width / pant.offsetWidth;
      for (const d of sc.querySelectorAll(".dedo,.onda")) { d.style.left = (b.x + b.width / 2 - p.x) / k + "px"; d.style.top = (b.y + b.height / 2 - p.y) / k + "px"; }
      sc.style.opacity = vis;
    }
  });
  fs.mkdirSync(OUT, { recursive: true });
  // Revisión rápida: FOTOS="3.5,9" → solo PNG de esos segundos en FOTOS_DIR (no hace el video)
  if (process.env.FOTOS) {
    for (const s of process.env.FOTOS.split(",").map(Number)) {
      await page.evaluate((t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, s * 1000);
      await page.screenshot({ path: path.join(process.env.FOTOS_DIR, `${nombre}-${s}.png`) });
    }
    console.log(`${nombre}: ${v.dur}s`); await page.close(); return;
  }
  const mudo = path.join(OUT, `.${nombre}-mudo.mp4`);
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-r", String(FPS), mudo], { stdio: ["pipe", "inherit", "inherit"] });
  const cuadros = Math.round(v.dur * FPS);
  for (let f = 0; f < cuadros; f++) {
    await page.evaluate((t) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = t; } }, (f / FPS) * 1000);
    const img = await page.screenshot({ type: "jpeg", quality: 90, optimizeForSpeed: true });
    if (f % 150 === 0) console.log(`  ${nombre}: cuadro ${f}/${cuadros}`);
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((ok, ko) => ff.on("close", (c) => (c === 0 ? ok() : ko(new Error("ffmpeg " + c)))));
  await page.close();
  // Música suave: la pista de los reels de clientes en bucle, baja y con salida
  const pista = path.join(OUT, ".pista.wav");
  if (!fs.existsSync(pista)) {
    try { execFileSync("python3", [path.join(AQUI, "../audio/pista-clientes.py"), pista], { stdio: "ignore" }); }
    catch { execFileSync("ffmpeg", ["-v", "error", "-y", "-i", path.join(AQUI, "../oficios/resuelto-oficio-aire.mp4"), "-vn", pista]); } // sin numpy: la misma pista, sacada de un reel
  }
  const salida = path.join(OUT, `resuelto-pro-instalar-${nombre}.mp4`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mudo, "-stream_loop", "-1", "-i", pista, "-filter_complex", `[1:a]volume=0.32,afade=t=out:st=${(v.dur - 2).toFixed(2)}:d=2[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k", "-t", String(v.dur), "-movflags", "+faststart", salida]);
  fs.rmSync(mudo);
  console.log(`listo: tutorial/${path.basename(salida)} (${v.dur}s)`);
}

const pedidos = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VARIANTES);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--force-device-scale-factor=1", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"], protocolTimeout: 60000 });
try { for (const n of pedidos) await render(n, armar(VARIANTES[n]), browser); } finally { await browser.close(); fs.rmSync(path.join(OUT, ".pista.wav"), { force: true }); }
