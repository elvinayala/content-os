// Plantillas de WhatsApp del onboarding de AI Borinquen. Meta solo deja abrir una conversación con una
// plantilla aprobada; cuando el cliente contesta, el agente sigue libre durante 24 h. Se crean en Zernio
// con `node scripts/aib-onboarding.mjs plantillas crear` (POST /v1/whatsapp/templates) y Meta las revisa.
// Sin "server-only": también las usa el script. {{1}} = primer nombre del cliente.

export interface PlantillaAib {
  nombre: string;
  categoria: "UTILITY" | "MARKETING";
  texto: string;
  ejemplo: string[];
}

export const PLANTILLAS = {
  bienvenida: {
    nombre: "aib_bienvenida",
    categoria: "UTILITY",
    texto:
      "¡Hola {{1}}! Te damos la bienvenida a AI Borinquen. Ya recibimos tu pago y tu proyecto está en marcha. " +
      "Ángela, tu project manager, se va a comunicar contigo para coordinar la llamada de arranque. " +
      "Si tienes cualquier duda sobre los próximos pasos, escríbenos por aquí.",
    ejemplo: ["Carlos"],
  },
  encuesta10: {
    nombre: "aib_encuesta_10_dias",
    categoria: "UTILITY",
    texto:
      "Hola {{1}}, ya llevas 10 días con AI Borinquen y queremos asegurarnos de que tu arranque va bien. " +
      "¿Nos regalas un minuto para dos preguntas rápidas? Contesta este mensaje y te las hago.",
    ejemplo: ["Carlos"],
  },
  encuesta30: {
    nombre: "aib_encuesta_30_dias",
    categoria: "UTILITY",
    texto:
      "Hola {{1}}, ya cumpliste tu primer mes con AI Borinquen. Queremos saber cómo te ha ido: " +
      "¿nos regalas un minuto para una pregunta rápida? Contesta este mensaje y seguimos.",
    ejemplo: ["Carlos"],
  },
} satisfies Record<string, PlantillaAib>;

export type PasoAib = keyof typeof PLANTILLAS;

/** El texto que vio el cliente, para guardarlo en el historial que lee el agente. */
export function textoPlantilla(paso: PasoAib, nombre: string): string {
  return PLANTILLAS[paso].texto.replace("{{1}}", nombre);
}
