// Versión y fecha de cada documento legal (24/oct/2026). Al cambiar el TEXTO de un documento: sube la versión aquí
// (la casilla que lo acepta guarda esta versión en el registro de consentimientos) y deja la anterior en git:
// cada versión publicada queda archivada en el historial del archivo de su página (app/(legal)/…).
// Esto es un borrador: un abogado de PR lo revisa antes de publicarlo.

export const LEGAL = {
  terminos: { version: "2026-10-24", fecha: "24 de octubre de 2026", ruta: "/terminos" },
  privacidad: { version: "2026-10-24", fecha: "24 de octubre de 2026", ruta: "/privacidad" },
  privacidadEquipo: { version: "2026-10-24", fecha: "24 de octubre de 2026", ruta: "/privacidad/equipo" },
  reembolsos: { version: "2026-10-24", fecha: "24 de octubre de 2026", ruta: "/reembolsos" },
  cookies: { version: "2026-10-24", fecha: "24 de octubre de 2026", ruta: "/cookies" },
  accesibilidad: { version: "2026-10-24", fecha: "24 de octubre de 2026", ruta: "/accesibilidad" },
} as const;

export const ENTIDAD = "EA Market LLC";

// Texto EXACTO de cada casilla (se guarda tal cual en el registro de consentimientos junto a la versión).
export const CASILLAS = {
  privacidadEmpleado: "Leí el Aviso de privacidad del equipo y entiendo qué datos guarda Ritmo y quién los ve.",
  terminosApp: "Acepto los Términos y condiciones.",
  privacidadApp: "Acepto la Política de privacidad.",
  grabacionLlamada:
    "Entiendo que voy a hablar con un agente de inteligencia artificial y que la llamada se graba y se transcribe para mostrarla en este portal.",
} as const;
