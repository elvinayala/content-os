// Familia de flyers de CLIENTES por área (25/sep/2026, Elvin: "cada campaña de un área sale con varios conjuntos,
// varios anuncios y varios creativos; tenemos flyers que no usamos, adáptalos al área").
// Rehace en HTML los flyers de kit/flyers-clientes/ que se pueden cumplir hoy (c1 menú, c2 promesa, c3 destape,
// c8 el problema, c9 sin sorpresas, c10 calentador) con el nombre del área, sus pueblos y el CTA neutro.
// Fuera a propósito: c4/c14 (cisterna "desde $899", no está en el menú del agente), c11 (filtración con cámara:
// depende del equipo del plomero), c5 (emergencias de noche/feriado: depende del horario del plomero), c12 (B2B).
// Mismas reglas que generar.mjs: sin teléfono ni "WhatsApp", solo precios fijos del menú.
//
// Uso:  node familia.mjs                            → las 8 áreas
//       node familia.mjs T3 "Caguas,Gurabo,…"        → solo esa área con los pueblos reales del plomero
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
const NOMBRE = { T1: "San Juan", T2: "Bayamón", T3: "Caguas", T4: "Ponce", T5: "Arecibo", T6: "Mayagüez", T7: "Aguadilla", T8: "Fajardo" };
const SLUG = { T1: "metro", T2: "bayamon", T3: "caguas", T4: "ponce", T5: "arecibo", T6: "mayaguez", T7: "aguadilla", T8: "fajardo" };
const $ = (id) => { const s = MENU.servicios.find((x) => x.id === id); if (!s?.precio) throw new Error(`Sin precio fijo: ${id}`); return s.precio; };
const FEE = MENU.cargo_coordinacion;

const [soloT, pueblos] = process.argv.slice(2);
const areas = TERR.filter((t) => !soloT || t.id === soloT).map((t) => ({ slug: SLUG[t.id], nombre: NOMBRE[t.id], municipios: pueblos ? pueblos.split(",").map((s) => s.trim()).filter(Boolean) : t.municipios }));
if (!areas.length) throw new Error(`No existe el territorio ${soloT}`);

const LOGO = `<div class="logo"><svg viewBox="0 0 64 64"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="#F2621F"/><path d="M20 35 L29 44 L46 26" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>resuelto</div>`;
const OK = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#1F9D6B" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const NO = `<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" stroke="#C2410C" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const CHAT = `<svg width="34" height="34" viewBox="0 0 24 24"><path d="M3.5 6A3 3 0 0 1 6.5 3h11a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H10.2l-4.6 3.7c-.6.5-1.6.1-1.6-.7V17a3 3 0 0 1-.5-1.7z" fill="#fff"/><circle cx="8.3" cy="10" r="1.35" fill="#F2621F"/><circle cx="12" cy="10" r="1.35" fill="#F2621F"/><circle cx="15.7" cy="10" r="1.35" fill="#F2621F"/></svg>`;

// Cada pieza devuelve el cuerpo (entre el logo y el pie). `s` = historia (1080×1920) o feed (1080×1350).
const PIEZAS = {
  menu: (a, s) => {
    const filas = [["Destape simple", "Fregadero, lavamanos, ducha o inodoro", $("destape-simple")], ["Reparación de inodoro", "Flapper, válvula o sello", $("reparacion-inodoro")], ["Válvula de paso o llave de ángulo", "", $("valvula-paso")], ["Llave o mezcladora", "Cocina o baño", $("llave-mezcladora")], ["Reemplazo de inodoro completo", "", $("inodoro-completo")], ["Bomba de cisterna", "Reemplazo", $("bomba-cisterna")], ["Calentador de tanque", "Instalación", $("calentador-tanque")], ["Calentador de línea", "Instalación", $("calentador-linea")]];
    return `<div class="fila-top"><div class="eyebrow">Plomería en ${a.nombre}</div><span class="sello">Precios publicados</span></div>
<h1 style="font-size:${s ? 96 : 76}px;margin-top:${s ? 26 : 18}px">Esto es lo que cobramos. <span class="o">Antes de ir a tu casa.</span></h1>
<div class="lista" style="margin-top:${s ? 40 : 22}px">${filas.map(([n, d, p]) => `<div class="li"><div><b>${n}</b>${d ? `<small>${d}</small>` : ""}</div><span>$${p}</span></div>`).join("")}</div>
<p style="font-size:${s ? 24 : 19}px;color:var(--c4);margin-top:${s ? 22 : 12}px">Precios de mano de obra + $${FEE} de coordinación por visita. Materiales al costo, con recibo. 12 meses de garantía.</p>`;
  },
  promesa: (a, s) => `<div class="eyebrow">Plomería en ${a.nombre}</div>
<h1 style="font-size:${s ? 104 : 84}px;margin-top:${s ? 30 : 22}px">Sabes el precio y la hora <span class="o">antes de que toquemos tu puerta.</span></h1>
<div style="margin-top:${s ? 60 : 36}px;display:grid;gap:${s ? 34 : 22}px">
${[["Llega cuando dice.", "Ventana de 2 horas y aviso 30 minutos antes, con el nombre del plomero."], ["Cobra lo que dijo.", "El precio que te damos por mensaje es el que pagas. Si aparece algo, lo apruebas tú antes."], ["Lo garantiza por escrito.", "12 meses de garantía en la mano de obra. Si algo falla, volvemos en 48 horas sin costo."]].map(([t, d]) => `<div class="pt"><i>${OK}</i><div><b>${t}</b><p>${d}</p></div></div>`).join("")}
</div>`,
  destape: (a, s) => `<div class="eyebrow">Lo más pedido en ${a.nombre}</div>
<h1 style="font-size:${s ? 150 : 118}px;margin-top:${s ? 26 : 16}px">¿Fregadero tapado?</h1>
<div class="precio" style="margin-top:${s ? 56 : 34}px"><div class="k">Destape simple · precio fijo</div><div class="n">$${$("destape-simple")}</div><p>Fregadero, lavamanos, ducha o inodoro · + $${FEE} de coordinación</p><div class="g">${OK}12 meses de garantía en la mano de obra</div></div>
<p class="nota" style="margin-top:${s ? 44 : 26}px">Mándanos una foto por mensaje y te damos el precio y la hora.</p>`,
  problema: (a, s) => `<div class="eyebrow">Plomería en ${a.nombre}</div>
<h1 style="font-size:${s ? 108 : 86}px;margin-top:${s ? 26 : 18}px">El problema no es el precio. <span class="o">Es no saberlo.</span></h1>
<div class="dos" style="margin-top:${s ? 50 : 30}px">
<div class="col antes"><div class="k">Como pasa siempre</div>${["Llamas a tres y contesta uno", "Viene, mira y ahí te dice un número", "No tienes con qué compararlo", "Aparece algo más y sube el precio"].map((x) => `<div class="it"><i>${NO}</i>${x}</div>`).join("")}</div>
<div class="col con"><div class="k">Con Resuelto</div>${["Escribes y te contestamos", "El precio sale del menú publicado", "Lo ves antes de que salgamos", "Si aparece algo, tú apruebas primero", "12 meses de garantía por escrito"].map((x) => `<div class="it"><i>${OK}</i>${x}</div>`).join("")}</div>
</div>`,
  sorpresas: (a, s) => `<div class="eyebrow">Lo que no te va a pasar en ${a.nombre}</div>
<h1 style="font-size:${s ? 116 : 92}px;margin-top:${s ? 26 : 18}px">5 sorpresas que aquí <span class="o">no existen.</span></h1>
<div style="margin-top:${s ? 46 : 26}px">${[["El precio no sube en tu casa.", "Lo que te dimos por mensaje es lo que pagas."], ["No cobramos la visita dos veces.", `El diagnóstico de $${$("diagnostico")} se acredita al trabajo.`], ["No aparecemos sin avisar.", "Ventana de 2 horas y aviso 30 minutos antes."], ["No dejamos reguero.", "El área queda limpia. Zapatones al entrar."], ["No desaparecemos si algo falla.", "12 meses de garantía. Volvemos en 48 horas."]].map(([t, d], i) => `<div class="num5"><span>${i + 1}</span><div><b>${t}</b><p>${d}</p></div></div>`).join("")}</div>`,
  calentador: (a, s) => `<div class="eyebrow">Calentador de agua · ${a.nombre}</div>
<h1 style="font-size:${s ? 140 : 110}px;margin-top:${s ? 26 : 16}px">¿Ducha fría otra vez?</h1>
<div class="precio" style="margin-top:${s ? 56 : 34}px"><div class="k">Instalación de calentador</div><div class="n">$${$("calentador-tanque")}<small> de tanque</small></div><p>De línea (tankless): $${$("calentador-linea")} · + $${FEE} de coordinación</p><div class="g">${OK}12 meses de garantía · precio de mano de obra</div></div>
<p class="nota" style="margin-top:${s ? 44 : 26}px">¿Tiene más de 8 años? Casi siempre sale más barato cambiarlo que repararlo.</p>`,
};

function html(a, pieza, formato) {
  const s = formato === "story", alto = s ? 1920 : 1350;
  const chips = a.municipios.map((m) => `<span class="chip">${m}</span>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../feed/src/_base.css"><style>
html,body{height:${alto}px}
h1{color:var(--c1)}
.fila-top{display:flex;justify-content:space-between;align-items:center;margin-top:${s ? 80 : 50}px}
.eyebrow{margin-top:${s ? 80 : 50}px}.fila-top .eyebrow{margin-top:0}
.sello{border:2px solid rgba(242,98,31,.45);color:var(--c2);font-weight:700;font-size:20px;letter-spacing:3px;text-transform:uppercase;padding:10px 18px;border-radius:999px}
.lista .li{display:flex;justify-content:space-between;align-items:center;padding:${s ? 20 : 11}px 0;border-bottom:1px solid var(--line)}
.lista b{font-family:'Sora';font-size:${s ? 34 : 27}px;color:var(--c1);letter-spacing:-.5px}.lista small{display:block;font-size:${s ? 22 : 18}px;color:var(--c4)}
.lista span{font-family:'Sora';font-weight:800;font-size:${s ? 46 : 36}px;color:var(--c1)}
.pt{display:flex;gap:24px;align-items:flex-start}.pt i{flex:none;width:${s ? 56 : 48}px;height:${s ? 56 : 48}px;border-radius:50%;background:#E3F4EC;display:flex;align-items:center;justify-content:center}.pt i svg{width:28px}
.pt b{font-family:'Sora';font-size:${s ? 44 : 36}px;color:var(--c1);letter-spacing:-1px}.pt p{font-size:${s ? 28 : 23}px;color:var(--c4);margin-top:6px;line-height:1.35}
.precio{background:#fff;border-radius:32px;box-shadow:0 10px 34px rgba(8,36,58,.08);padding:${s ? "44px 48px" : "34px 40px"}}
.precio .k{font-size:${s ? 24 : 20}px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--c4)}
.precio .n{font-family:'Sora';font-weight:800;font-size:${s ? 210 : 170}px;color:var(--c2);letter-spacing:-6px;line-height:1}
.precio .n small{font-size:${s ? 40 : 32}px;letter-spacing:0;color:var(--c1)}
.precio p{font-size:${s ? 27 : 23}px;color:var(--c4);margin-top:12px}
.precio .g{display:flex;align-items:center;gap:12px;margin-top:22px;padding-top:20px;border-top:1px solid var(--line);color:#157A53;font-weight:700;font-size:${s ? 26 : 22}px}.precio .g svg{width:26px}
.nota{font-size:${s ? 32 : 26}px;color:var(--c1);line-height:1.35;max-width:880px}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:18px}.col{border-radius:26px;padding:${s ? "34px 30px" : "26px 24px"}}
.col .k{font-size:18px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px}
.antes{background:#EFE9DF;color:#5C6670}.con{background:var(--c1);color:#fff}.con .k{color:#FFB48E}
.it{display:flex;gap:12px;align-items:flex-start;font-size:${s ? 28 : 23}px;line-height:1.3;margin-top:${s ? 18 : 12}px}.it i{flex:none;width:28px;margin-top:3px}.it svg{width:28px}
.con .it svg path{stroke:#3DD598}
.num5{display:flex;gap:26px;align-items:flex-start;padding:${s ? 24 : 15}px 0;border-bottom:1px solid var(--line)}
.num5 span{font-family:'Sora';font-weight:800;font-size:${s ? 44 : 36}px;color:var(--c2);width:44px}
.num5 b{font-family:'Sora';font-size:${s ? 36 : 29}px;color:var(--c1);letter-spacing:-.5px}.num5 p{font-size:${s ? 25 : 21}px;color:var(--c4);margin-top:4px}
.chip{display:inline-block;background:#fff;border:1.5px solid var(--line);color:var(--c1);font-weight:600;font-size:${s ? 25 : 21}px;padding:8px 18px;border-radius:999px;margin:0 8px 10px 0}
.cta{display:flex;align-items:center;gap:14px;background:#F2621F;color:#fff;font-weight:700;font-size:${s ? 34 : 28}px;padding:${s ? "24px 36px" : "18px 28px"};border-radius:20px;font-family:'Sora';white-space:nowrap}
</style></head><body class="cream"><div class="blob"></div>
${LOGO}
<div style="${s ? "margin:auto 0" : ""}">${PIEZAS[pieza](a, s)}</div>
<div style="margin-top:${s ? 0 : "auto"};padding-top:${s ? 30 : 18}px">${chips}</div>
<div class="foot" style="align-items:center;border-top:1px solid var(--line);padding-top:${s ? 30 : 20}px;margin-top:${s ? 10 : 6}px">
  <div class="muted" style="font-size:${s ? 24 : 19}px;line-height:1.35;max-width:${s ? 330 : 380}px">Plomeros licenciados · mano de obra, materiales aparte</div>
  <div class="cta">${CHAT}Escríbenos un mensaje</div>
</div>
</body></html>`;
}

// Regla de Elvin (23/sep/2026): ningún flyer lleva teléfono ni "WhatsApp".
const TELEFONO_PR = /\b(787|939)[-. ]?\d{3}[-. ]?\d{4}\b/;
function sinTelefono(n, h) {
  if (/whatsapp/i.test(h)) throw new Error(`${n}: dice "WhatsApp"`);
  if (TELEFONO_PR.test(h)) throw new Error(`${n}: trae un teléfono`);
  return h;
}

fs.mkdirSync(path.join(AQUI, "src"), { recursive: true });
const correr = promisify(execFile);
const trabajos = areas.flatMap((a) => Object.keys(PIEZAS).flatMap((pieza) => ["feed", "story"].map((formato) => {
  const n = `cliente-${a.slug}-${pieza}-${formato}`, f = path.join(AQUI, "src", n + ".html"), png = path.join(AQUI, n + ".png");
  fs.writeFileSync(f, sinTelefono(n, html(a, pieza, formato)));
  return () => correr(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${path.join(AQUI, "src", ".chrome-" + n)}`, `--window-size=1080,${formato === "story" ? 1920 : 1350}`, "--force-device-scale-factor=1", "--virtual-time-budget=10000", `--screenshot=${png}`, "file://" + f], { timeout: 40000 })
    .catch((e) => { if (!fs.existsSync(png)) throw e; })
    .then(() => { fs.rmSync(path.join(AQUI, "src", ".chrome-" + n), { recursive: true, force: true }); return n + ".png"; });
})));
// De a 12 para no ahogar la Mac (8 áreas × 6 piezas × 2 formatos = 96).
const hechos = [];
for (let i = 0; i < trabajos.length; i += 12) hechos.push(...(await Promise.all(trabajos.slice(i, i + 12).map((t) => t()))));
console.log(hechos.length + " flyers");
