// Tareas de AI Core en Content OS: cómo corren Sofi y Max cuando el pedido viene de AI Core (12-oct-2026,
// ADR-066/067/070 del Core). Siempre en SOLO LECTURA, en una sesión nueva y con lo mínimo de contexto:
//
//  · `--bare`: NO se carga el CLAUDE.md del repo (138 KB, ~35 mil tokens en CADA turno; es de todas las
//    empresas y no hace falta para consultar). Medido el 12-oct: la misma consulta de Sofi bajó de
//    $0.28–0.92 a ~$0.03, con mejores respuestas.
//  · Sofi: solo Read/Glob/Grep (sin Bash: Sonnet gastaba turnos intentando correr comandos que se le
//    negaban) y un mapa corto de dónde está cada dato.
//  · Max: trabaja en una CARPETA APARTE que solo tiene los archivos de las marcas de la empresa que pide
//    (su ficha del portafolio, su estilo, sus públicos, sus planes). Claude Code no deja leer fuera de su
//    carpeta de trabajo, así que no puede ver datos de otra empresa ni "por accidente". Meta: solo los
//    comandos de lectura de esas marcas.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const COMANDOS_LECTURA = ["resumir", "cuentas", "campanas", "arbol", "resultados", "intereses"];
const esMarca = (m) => /^[a-z0-9-]+$/.test(m);

export function hoyPR(fecha = new Date()) {
  return fecha.toLocaleDateString("es-PR", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Puerto_Rico" });
}

const SOLO_LECTURA = "Es una tarea de AI Core en SOLO LECTURA: consulta y responde; no cambies, crees ni envíes nada, y no le escribas a nadie. Contesta solo con lo que encuentres en los archivos; si algo no está, dilo y no lo inventes.";

export function promptSofi(hoy) {
  return `Eres SOFI, la Coordinadora de Producción del Estudio de Elvin (Level Up Media, AI Borinquen, Shadow Operator, Bori). Respondes corto, en tuteo de Puerto Rico, y firmas — Sofi.
${SOLO_LECTURA}
Hoy es ${hoy} (hora de Puerto Rico). "Esta semana" = de lunes a domingo.

Dónde está cada cosa (repo content-os):
- data/estudio.json — el Estudio de grabación. \`diaDeGrabacion.proximo\` = fecha del próximo rodaje (null = sin fecha); \`diaDeGrabacion.propuesta\` y \`bloques\`; \`caras\` (quién graba, por marca); \`locaciones.propuestaActual\` e \`historial\`; \`contrataciones\`; \`plan.pendientesElvin\`; \`bitacora\` (lo último que pasó).
- data/calendario.json — calendario de PUBLICACIONES (no de rodajes): lista de {fecha, hora, titulo, marca, plataforma, estado, formato, cara}.
- data/tareas.json — tareas del equipo: {tareas: [{titulo, responsable, estado, vence, prioridad, unidad, requiereCEO}]}.
- data/produccion.json — guion y gancho vigentes por marca.
- data/entregas.json — ENORME (1.4 MB, ~1,000 entregas). Nunca lo leas completo: búscalo con Grep (por título, marca o estado).
- vault/proyectos/estudio/ — notas de rodajes y locaciones (p. ej. ritz-*.md).
- vault/ceo/cerebro-sofi.md — tu criterio. Léelo SOLO si la tarea pide una opinión, propuesta o idea; para consultas de datos no hace falta.
Para listas por fecha, usa Grep con la fecha (p. ej. "2026-10-1[2-8]") en lugar de leer el archivo entero. Cuenta con cuidado antes de dar totales.`;
}

export function promptMax(hoy, marcas, root) {
  const lista = marcas.length ? marcas.join(", ") : "(ninguna)";
  const comandos = marcas.length
    ? marcas.map((m) => `  node ${root}/scripts/meta-ads.mjs ${m} <${COMANDOS_LECTURA.join("|")}> [id] [last_3d|last_7d|last_14d|yesterday]`).join("\n")
    : "  (sin marcas: no consultes Meta y di que falta la marca)";
  return `Eres MAX, el estratega de Meta Ads de Elvin. Respondes corto, en tuteo de Puerto Rico, y firmas — Max.
${SOLO_LECTURA}
Hoy es ${hoy} (hora de Puerto Rico).

Esta tarea es SOLO de la(s) marca(s): ${lista}. No consultes ni menciones otras marcas o empresas.
En tu carpeta de trabajo tienes lo de esa(s) marca(s): marcas/<marca>.json (ids, reglas y compuertas), estilo/, publicos/, campanas/ (planes montados) y cerebro-max.md (tu método; léelo solo si la tarea pide estrategia o diagnóstico).
Para datos de Meta, SOLO estos comandos de lectura:
${comandos}
Al revisar resultados: gasto, costo por resultado, CTR, frecuencia y ROAS, y cierra con una recomendación con número (mantener / apagar / iterar / escalar). Recomendar no es ejecutar: no cambies nada.`;
}

function copiar(origen, destino) {
  if (!fs.existsSync(origen)) return false;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.cpSync(origen, destino, { recursive: true, dereference: true });
  return true;
}

/**
 * Carpeta de trabajo de Max con SOLO lo de esas marcas. La ruta depende de la sesión: si la corrida se queda sin
 * pasos y el puente la retoma (`--resume`), Claude Code busca la sesión por la carpeta, y tiene que ser la misma.
 */
export function carpetaMax(root, marcas, sesion) {
  const dir = path.join(os.tmpdir(), `aicore-max-${String(sesion).replace(/[^a-z0-9-]/gi, "")}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const portafolio = JSON.parse(fs.readFileSync(path.join(root, "data/meta-ads/portafolio.json"), "utf8"));
  copiar(path.join(root, "vault/ceo/cerebro-max.md"), path.join(dir, "cerebro-max.md"));
  for (const m of marcas.filter(esMarca)) {
    const ficha = portafolio.marcas?.[m];
    if (ficha) fs.mkdirSync(path.join(dir, "marcas"), { recursive: true }), fs.writeFileSync(path.join(dir, "marcas", `${m}.json`), JSON.stringify({ [m]: ficha }, null, 2));
    copiar(path.join(root, `vault/estilo/${m}.md`), path.join(dir, "estilo", `${m}.md`));
    copiar(path.join(root, `data/meta-ads/publicos-${m}.json`), path.join(dir, "publicos", `${m}.json`));
    copiar(path.join(root, `data/ig-${m}.json`), path.join(dir, "instagram", `${m}.json`));
    const planes = path.join(root, "data/meta-ads/campanas");
    if (fs.existsSync(planes)) for (const f of fs.readdirSync(planes).filter((x) => x.startsWith(`${m}-`))) copiar(path.join(planes, f), path.join(dir, "campanas", f));
  }
  return dir;
}

/**
 * Cómo correr una tarea de AI Core: carpeta de trabajo, argumentos de Claude y limpieza.
 * `persona`: "sofi" | "max". `marcas`: las que AI Core puso en la primera línea (solo cuentan para Max).
 */
export function prepararTareaAicore({ persona, root, marcas = [], sesion, hoy = hoyPR() }) {
  const sinPermisoDeEscritura = ["--permission-mode", "default", "--disallowedTools", "Edit", "Write", "NotebookEdit", "WebFetch", "WebSearch"];
  if (persona === "max") {
    const validas = marcas.filter(esMarca);
    const cwd = carpetaMax(root, validas, sesion);
    const permitidos = validas.flatMap((m) => COMANDOS_LECTURA.map((c) => `Bash(node ${root}/scripts/meta-ads.mjs ${m} ${c}*)`));
    return {
      cwd,
      maxTurnos: "12",
      args: ["--bare", "--tools", "Read,Glob,Grep,Bash", "--allowedTools", "Read", "Glob", "Grep", ...permitidos, ...sinPermisoDeEscritura, "--append-system-prompt", promptMax(hoy, validas, root)],
      limpiar: () => fs.rmSync(cwd, { recursive: true, force: true }),
    };
  }
  return {
    cwd: root,
    maxTurnos: "12",
    args: ["--bare", "--tools", "Read,Glob,Grep", "--allowedTools", "Read", "Glob", "Grep", ...sinPermisoDeEscritura, "--append-system-prompt", promptSofi(hoy)],
    limpiar: () => {},
  };
}

