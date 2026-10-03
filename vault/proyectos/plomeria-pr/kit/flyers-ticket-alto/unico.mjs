// Ticket alto, UN servicio por flyer (3/oct/2026, Elvin: "más variedad de creativos para subir el ticket… solamente de
// una cosa, por ejemplo cisternas, no de todos; varios por servicio; minimalista, elegante, oferta clara").
// Precios del menú del agente (agente/data/menu.json): un rango sale como "desde" su mínimo. Sin teléfono ni "WhatsApp".
// La pieza o el equipo SIEMPRE dice "aparte" (3/oct: queja de la clienta de la bomba de cisterna).
//
// Uso:  node unico.mjs [slug] ["Nombre"] ["Pueblo,Pueblo,…"]     (por defecto Caguas y sus pueblos)
//       SOLO=bomba-cisterna,filtro-casa node unico.mjs             → solo esos
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const MENU = JSON.parse(fs.readFileSync(path.join(AQUI, "../../agente/data/menu.json"), "utf8"));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FEE = MENU.cargo_coordinacion;
const [slug = "caguas", nombre = "Caguas", pueblos = "Caguas,Cidra,Gurabo,Cayey,Aguas Buenas,San Lorenzo,Juncos"] = process.argv.slice(2);

const precio = (id) => { const s = MENU.servicios.find((x) => x.id === id); if (!s) throw new Error(`No está en el menú: ${id}`); return s.precio != null ? { n: s.precio, desde: false } : { n: s.rango[0], desde: true }; };
const miles = (n) => n.toLocaleString("en-US");
const BASE = ["Precio por escrito antes de empezar", "Plomero licenciado de tu zona", `${MENU.garantia_meses} meses de garantía`];

// h1: lo de *asteriscos* sale en naranja. aparte: qué va aparte (o null). oscuro: fondo navy.
const PIEZAS = [
  { id: "cisterna-bomba", eyebrow: "Cisterna", h1: "Que el corte de agua *no te toque.*", que: "Cisterna con bomba, instalada", aparte: "cisterna y bomba aparte", oscuro: true },
  { id: "bomba-cisterna", eyebrow: "Bomba de cisterna", h1: "¿La bomba *no prende?*", que: "Reemplazo de bomba de cisterna", aparte: "la bomba aparte", checks: ["Apruebas la bomba antes de comprarla", ...BASE.slice(1)] },
  { id: "calentador-solar", eyebrow: "Calentador solar", h1: "Agua caliente *sin pagar luz.*", que: "Instalación de calentador solar", aparte: "equipo aparte" },
  { id: "calentador-tanque", eyebrow: "Calentador", h1: "¿Otra vez *agua fría?*", que: "Instalación de calentador de tanque", aparte: "calentador aparte", checks: ["¿Ya lo tienes? Solo la instalación", ...BASE.slice(1)] },
  { id: "calentador-linea", eyebrow: "Calentador de línea", h1: "Agua caliente *que no se acaba.*", que: "Calentador de línea (tankless)", aparte: "calentador aparte", oscuro: true },
  { id: "filtro-casa", eyebrow: "Filtro de agua", h1: "Agua limpia *en cada llave.*", que: "Filtro para toda la casa", aparte: "filtro aparte" },
  { id: "linea-principal-agua", eyebrow: "Línea principal", h1: "¿Poca presión o *un salidero?*", que: "Línea nueva, del contador a la casa", aparte: "materiales aparte" },
  { id: "retuberia-bano", eyebrow: "Re-tubería", h1: "Tubería nueva *en tu baño.*", que: "Re-tubería completa de un baño", aparte: "materiales aparte", oscuro: true },
  { id: "reparacion-filtracion", eyebrow: "Filtraciones", h1: "¿Humedad en la pared? *La arreglamos.*", que: "Reparación de filtración en pared o piso", aparte: "materiales aparte", checks: ["Precio fijo antes de romper", ...BASE.slice(1)] },
];

// Reglas de copy (guía de flyers de Elvin, 26/sep): título ≤ 8 palabras, bullets ≤ 6, sin "gratis", sin voseo.
const palabras = (t) => t.replace(/\*/g, "").trim().split(/\s+/).length;
for (const p of PIEZAS) {
  if (palabras(p.h1) > 8) throw new Error(`${p.id}: título de ${palabras(p.h1)} palabras`);
  for (const c of p.checks ?? BASE) if (palabras(c) > 6) throw new Error(`${p.id}: bullet largo "${c}"`);
  if (/gratis|whatsapp|\b(787|939)\b|vos\b|querés|tenés|podés/i.test(JSON.stringify(p))) throw new Error(`${p.id}: copy prohibido`);
}

const LOGO = (claro) => `<div class="logo"><svg viewBox="0 0 64 64"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="#F2621F"/><path d="M20 35 L29 44 L46 26" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span style="color:${claro ? "#fff" : "var(--c1)"}">resuelto</span></div>`;
const OK = (c) => `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHAT = `<svg width="34" height="34" viewBox="0 0 24 24"><path d="M3.5 6A3 3 0 0 1 6.5 3h11a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H10.2l-4.6 3.7c-.6.5-1.6.1-1.6-.7V17a3 3 0 0 1-.5-1.7z" fill="#fff"/><circle cx="8.3" cy="10" r="1.35" fill="#F2621F"/><circle cx="12" cy="10" r="1.35" fill="#F2621F"/><circle cx="15.7" cy="10" r="1.35" fill="#F2621F"/></svg>`;

function html(p, formato) {
  const s = formato === "story", alto = s ? 1920 : 1350, d = !!p.oscuro, { n, desde } = precio(p.id);
  const h1 = p.h1.replace(/\*(.+?)\*/g, '<span class="o">$1</span>');
  const checks = (p.checks ?? BASE).map((c) => `<li>${OK(d ? "#3DD598" : "#1F9D6B")}<span>${c}</span></li>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../feed/src/_base.css"><style>
html,body{height:${alto}px}
body{padding:${s ? "110px 84px" : "76px 80px"}}
.t1{color:${d ? "#fff" : "var(--c1)"}}.sub{color:${d ? "var(--ink2)" : "var(--c4)"}}
.eyebrow{margin-top:${s ? 150 : 64}px}
h1{font-size:${s ? 112 : 92}px;line-height:1.02;letter-spacing:-3.5px;margin-top:${s ? 30 : 20}px;max-width:900px}
.oferta{margin-top:${s ? 110 : 84}px}
.que{font-size:${s ? 30 : 25}px;font-weight:600;letter-spacing:.2px}
.n{display:flex;align-items:baseline;gap:14px;margin-top:4px}
.n small{font-family:'Sora';font-weight:700;font-size:${s ? 44 : 36}px}
.n b{font-family:'Sora';font-weight:800;font-size:${s ? 230 : 188}px;letter-spacing:-8px;line-height:1;color:var(--c2)}
.det{font-size:${s ? 26 : 22}px;margin-top:6px}
ul{list-style:none;margin-top:${s ? 80 : 60}px;padding-top:${s ? 50 : 40}px;border-top:1px solid ${d ? "rgba(255,255,255,.14)" : "var(--line)"};display:flex;flex-direction:column;gap:${s ? 28 : 22}px}
li{display:flex;align-items:center;gap:16px;font-size:${s ? 31 : 26}px;font-weight:600}li svg{flex:none;width:${s ? 34 : 30}px}
.pie{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:30px}
.zona{font-size:${s ? 24 : 20}px;line-height:1.4;max-width:${s ? 430 : 470}px}
.cta{display:flex;align-items:center;gap:14px;background:#F2621F;color:#fff;font-weight:700;font-size:${s ? 32 : 27}px;padding:${s ? "24px 34px" : "20px 28px"};border-radius:20px;font-family:'Sora';white-space:nowrap}
.navy .blob{background:#123A57;opacity:.6}
</style></head><body class="${d ? "navy" : "cream"}"><div class="blob"></div>
${LOGO(d)}
<div class="eyebrow">${p.eyebrow} · ${nombre}</div>
<h1 class="t1">${h1}</h1>
<div class="oferta">
  <div class="que t1">${p.que}</div>
  <div class="n">${desde ? '<small class="t1">desde</small>' : ""}<b>$${miles(n)}</b></div>
  <div class="det sub">Mano de obra · ${p.aparte} · + $${FEE} de coordinación</div>
</div>
<ul class="t1">${checks}</ul>
<div class="pie"><div class="zona sub">${pueblos.split(",").map((x) => x.trim()).join(" · ")}</div><div class="cta">${CHAT}Escríbenos</div></div>
</body></html>`;
}

const correr = promisify(execFile);
fs.mkdirSync(path.join(AQUI, "src"), { recursive: true });
const solo = process.env.SOLO?.split(",");
const hechos = [];
for (const p of PIEZAS.filter((x) => !solo || solo.includes(x.id))) {
  await Promise.all(["feed", "story"].map(async (formato) => {
    const nom = `ta-${slug}-${p.id}-${formato}`, f = path.join(AQUI, "src", nom + ".html"), png = path.join(AQUI, nom + ".png"), perfil = path.join(AQUI, "src", ".chrome-" + nom);
    fs.writeFileSync(f, html(p, formato));
    await correr(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${perfil}`, `--window-size=1080,${formato === "story" ? 1920 : 1350}`, "--force-device-scale-factor=1", "--virtual-time-budget=10000", `--screenshot=${png}`, "file://" + f], { timeout: 40000 }).catch((e) => { if (!fs.existsSync(png)) throw e; });
    fs.rmSync(perfil, { recursive: true, force: true });
    hechos.push(nom);
  }));
}
console.log(hechos.length + " flyers en " + AQUI);
