// Arma los bloques para pegar en GHL (ghl/) y las vistas previas (vista-previa/) desde fuente/.
// Uso: node demos/drg-landing/armar.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = dirname(fileURLToPath(import.meta.url));
const leer = (f) => readFileSync(join(raiz, "fuente", f), "utf8");
const css = leer("base.css");
const fuentes =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,800&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">';
const flecha =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>';

// Slugs de GHL (la guía dice cómo ponerlos). En la vista previa apuntan a los archivos locales.
const rutas = {
  ghl: { P1: "/programa-drg", P2: "/clinica-peptidos", URL_PRIVACIDAD: "/privacidad", URL_TERMINOS: "/terminos" },
  previa: { P1: "pagina-1-landing.html", P2: "pagina-2-peptidos.html", URL_PRIVACIDAD: "#", URL_TERMINOS: "#" },
};
rutas.demo = rutas.previa;

// Versión demo para enseñársela al cliente: sin notas internas y con franja de "demo para aprobación"
const paraCliente = (html) =>
  html
    .replace("PENDIENTE: vigencia y restricciones exactas del cliente", "Por confirmar: vigencia y restricciones")
    .replace("PENDIENTE: información de péptidos del cliente (las imágenes recibidas eran de sueroterapia)", "Por confirmar: información de los péptidos")
    .replace(/Aquí va el botón de pago nativo de GHL[^<]*<br>PENDIENTE:[^<]*/, "Aquí irá el botón de compra del producto destacado.<br>Por confirmar: cuál producto se destaca y si se vende en línea.")
    .replace(/↓ Sección nativa de GHL[^<]*/, "Así se verán el formulario y el calendario en la página final");
const franjaDemo = `<div style="background:#ffe14d;color:#0a0a0a;font:600 13px/1.4 Inter,system-ui,sans-serif;text-align:center;padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px))">Demo para aprobación · Preparado por Level Up Media · Las fotos y lo marcado “Por confirmar” se completan antes de publicar</div>`;
const waTexto = {
  p1: encodeURIComponent("Hola, quiero información del Programa DRG"),
  p2: encodeURIComponent("Hola, quiero información de la Clínica de Péptidos DRG"),
};

const rellenar = (html, vars) => html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
const bloque = (titulo, cuerpo) =>
  `<!-- Programa DRG · ${titulo} · pegar completo en un elemento "Custom JS/HTML" de GHL -->\n` +
  `${fuentes}\n<style>\n${css}</style>\n<div class="drg">\n${cuerpo}\n</div>\n`;

// Imitación de la sección nativa de GHL, solo para la vista previa
const nativa = (conCalendario) => `
<div class="previa-nativa">
  <div class="previa-aviso">↓ Sección nativa de GHL (no va en el código): ${conCalendario ? "formulario de preevaluación + calendario" : "formulario de preevaluación"}</div>
  <div class="previa-cols${conCalendario ? "" : " previa-una"}">
    <div class="previa-caja">
      <b>Formulario “Preevaluación DRG” (varios pasos)</b>
      <label>Nombre</label><i></i><label>Apellido</label><i></i><label>WhatsApp *</label><i></i><label>Correo</label><i></i>
      <label>¿Qué buscas?</label><i></i><label>¿Cuándo quieres empezar?</label><i></i>
      <small>☐ Acepto que me contacten por WhatsApp, SMS y correo. *</small>
      <span class="previa-btn">Comenzar mi preevaluación</span>
    </div>
    ${conCalendario ? `<div class="previa-caja"><b>Calendario “Evaluación inicial sin costo”</b><div class="previa-cal">${"<em></em>".repeat(35)}</div><span class="previa-btn">Quiero agendar mi cita</span></div>` : ""}
  </div>
</div>`;
const cssPrevia = `
body{margin:0;background:#0a0a0a}
.previa-nativa{background:#141414;padding:8px 20px 64px;font-family:Inter,system-ui,sans-serif;color:#222}
.previa-aviso{max-width:1056px;margin:0 auto 14px;color:#ffe14d;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-align:center}
.previa-cols{max-width:1056px;margin:0 auto;display:grid;gap:16px}
.previa-caja{background:#fff;border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:6px}
.previa-caja b{font-size:16px;margin-bottom:8px}
.previa-caja label{font-size:12px;color:#555;margin-top:6px}
.previa-caja i{display:block;height:40px;border:1px solid #ddd;border-radius:8px}
.previa-caja small{font-size:12px;color:#555;margin:10px 0}
.previa-btn{display:block;text-align:center;background:#b8ff2c;color:#0a0a0a;font-weight:800;text-transform:uppercase;border-radius:999px;padding:14px;margin-top:auto}
.previa-cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:8px 0 16px}
.previa-cal em{aspect-ratio:1;border-radius:8px;background:#f1f1f1}
@media(min-width:760px){.previa-cols{grid-template-columns:1fr 1fr}.previa-una{grid-template-columns:minmax(0,560px);justify-content:center}}`;

const paginas = [
  { id: "p1", fuente: "p1-contenido.html", archivo: "pagina-1-landing.html", calendario: true,
    titulo: "Programa DRG | Bajar de peso en Puerto Rico con supervisión médica | Dr. Ricardo Guerrero" },
  { id: "p2", fuente: "p2-contenido.html", archivo: "pagina-2-peptidos.html", calendario: false,
    titulo: "Clínica de Péptidos DRG | Programa DRG | Dr. Ricardo Guerrero" },
];

mkdirSync(join(raiz, "ghl"), { recursive: true });
mkdirSync(join(raiz, "vista-previa"), { recursive: true });
mkdirSync(join(raiz, "demo"), { recursive: true });

for (const p of paginas) {
  for (const modo of ["ghl", "previa", "demo"]) {
    const vars = { ...rutas[modo], FLECHA: flecha, WA_TEXTO: waTexto[p.id] };
    const contenido = rellenar(leer(p.fuente), vars);
    const pie = rellenar(leer("pie.html"), vars);
    if (modo === "ghl") {
      writeFileSync(join(raiz, "ghl", `${p.id}-bloque-1-contenido.html`), bloque(`${p.id} bloque 1 (contenido)`, contenido));
      writeFileSync(join(raiz, "ghl", `${p.id}-bloque-2-pie.html`), bloque(`${p.id} bloque 2 (pie + WhatsApp)`, pie));
    } else {
      const demo = modo === "demo";
      const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.titulo}</title>
${fuentes}
<style>${css}${cssPrevia}</style>
</head>
<body>
${demo ? franjaDemo : ""}
<div class="drg">
${contenido}
</div>
${nativa(p.calendario)}
<div class="drg">
${pie}
</div>
</body>
</html>
`;
      if (!demo) { writeFileSync(join(raiz, "vista-previa", p.archivo), html); continue; }
      const limpio = paraCliente(html).replace("<style>", "<style>:root{color-scheme:dark;background:#0a0a0a}");
      writeFileSync(join(raiz, "demo", p.archivo), limpio);
      // La portada del artifact (página 1) va sin <!doctype>/<html>/<head>/<body>: el artifact pone el esqueleto
      if (p.id === "p1") {
        const portada = limpio.replace(/^<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport"[^>]*>\n/, "").replace("</head>\n<body>\n", "").replace("</body>\n</html>\n", "");
        writeFileSync(join(raiz, "demo", "index.html"), portada);
      }
    }
  }
}
console.log("Listo: ghl/ (4 bloques), vista-previa/ (2 páginas) y demo/ (para el cliente)");
