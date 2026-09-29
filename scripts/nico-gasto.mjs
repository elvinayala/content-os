// Nico: qué modelo usa en cada tarea (Elvin, 28/sep/2026).
//   "Mira a ver si necesita Opus 5.5 para todo o si puede manejarse con Sonnet. Hay cosas de diseño,
//    de desarrollo, planeación, comenzar estructuras, definir planes: eso no lo vamos a escatimar.
//    Pero hay cosas breves que se pueden automatizar para Sonnet."
// Contexto: el 28/sep Nico gastó $22.25 en un día (26 corridas, TODO con Opus 5.5) contra $1.00 de Max,
// que ya escogía modelo por tarea (scripts/max-gasto.mjs). Esto le pone el mismo criterio.
// Puro (sin red): lo usa scripts/telegram-puente.mjs y lo prueba tests/nico-gasto.test.mjs.

export const NICO_OPUS = process.env.NICO_MODELO_PLAN || "claude-opus-5-5";
export const NICO_SONNET = process.env.NICO_MODELO_MEDIO || "claude-sonnet-5";
export const NICO_HAIKU = process.env.NICO_MODELO_BARATO || "claude-haiku-4-5-20251001";
export const NICO_TOPE_DIA = Number(process.env.NICO_TOPE_DIA || 15);

// CONSTRUIR / DISEÑAR / PLANEAR → Opus 5.5. Aquí no se escatima: es donde Nico produce valor real.
// Son VERBOS de hacer algo nuevo o de fondo, no sustantivos sueltos ("respaldo", "seguridad"): decir
// "revisa si el respaldo corrió" es una consulta, no un trabajo.
const OPUS = new RegExp(
  "\\b(" +
    [
      // construir
      "constru", "cre(a|á|e)(r|me|le|n)?", "implementa", "programa(r|me)?", "desarroll", "monta",
      "arma(r|me|le)?", "levanta", "integr(a|e)", "migra(r|le)?", "refactor", "reescrib", "rehac",
      "redise[ñn]", "dise[ñn]", "prototip", "automatiza", "instala(r|le)?",
      // planear / estructurar
      "plan\\b", "planes\\b", "plan(ea|ifica|tea)", "estructura(r|le)?", "arquitectura", "estrategia",
      "propuesta", "roadmap", "modelo de datos", "documento t[ée]cnico", "spec\\b",
      // trabajos de fondo
      "de punta a punta", "desde cero", "audita", "depura", "investiga a fondo",
      "arregla[^.]{0,40}(bug|error|fallo|ca[íi]d|roto|producci[óo]n)",
      "bug[^.]{0,40}(arregla|resuelv|corrig)",
    ].join("|") +
    ")",
  "i",
);
// Piezas grandes: solo mandan a Opus si además hay un verbo de cambiar algo.
const PIEZA_GRANDE = /\b(plataforma|m[óo]dulo|agente nuevo|pipeline|autoflow|migraci[óo]n|seguridad|arquitectura|tablero nuevo|endpoint nuevo)\b/i;
const VERBO_CAMBIO = /\b(arregla|ajusta|cambia|mejora|optimiza|corrig|resuelv|actualiza|mueve|reorganiza)/i;

// Trámites: nada que pensar, solo responder o registrar → Haiku.
const HAIKU = new RegExp(
  "^[\\s¿¡\"'(-]*(" +
    ["ok\\b", "okay", "dale", "gracias", "listo", "perfecto", "s[íi]\\b", "no\\b", "para\\b",
     "estado\\b", "status\\b", "c[óo]mo va", "qu[ée] tal va", "qu[ée] hora", "confirma", "avisa(le)?",
     "an[óo]ta", "recuerda", "apunta", "buenas", "hola"].join("|") +
    ")",
  "i",
);

/**
 * Qué modelo usa Nico para este trabajo.
 * @param {string} texto  lo que pidieron (mensaje de Telegram, del buzón o de una solicitud).
 * @param {string} origen "telegram" | "ronda" | "cierre" | "buzon:…" | "solicitud:…" | "aprobada:…" | "seguir"
 */
export function modeloParaNico(texto, origen = "telegram") {
  const t = String(texto || "");
  const o = String(origen || "");

  // Rutinas fijas: nunca necesitan Opus.
  if (o === "cierre") return NICO_HAIKU;                    // reporte de jornada de 3 líneas
  if (o === "ronda" || /ronda-nico/.test(t)) return NICO_SONNET; // leer logs y resumir

  // Diagnóstico de una solicitud del equipo: es SOLO LECTURA (mirar y proponer) → Sonnet.
  // La ejecución llega después con `aprobada:` y ahí sí se clasifica por lo que hay que hacer.
  if (/^solicitud:/.test(o)) return NICO_SONNET;

  if (HAIKU.test(t) && t.trim().length < 60) return NICO_HAIKU;
  if (OPUS.test(t)) return NICO_OPUS;
  if (PIEZA_GRANDE.test(t) && VERBO_CAMBIO.test(t)) return NICO_OPUS;

  // Un brief largo casi siempre es un trabajo de verdad; uno corto, una consulta.
  return t.trim().length > 600 ? NICO_OPUS : NICO_SONNET;
}

export function nombreCorto(modelo) {
  if (!modelo) return "?";
  if (/opus/.test(modelo)) return "opus";
  if (/sonnet/.test(modelo)) return "sonnet";
  if (/haiku/.test(modelo)) return "haiku";
  if (/fable/.test(modelo)) return "fable";
  return modelo;
}
