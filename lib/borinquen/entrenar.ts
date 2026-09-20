import type { Entrenamiento, TipoAgente } from "@/lib/types";

// Entrena el agente = arma su prompt de sistema desde la info del negocio +
// las conversaciones recientes que pega el cliente. Determinístico por ahora
// (más adelante, una pasada de Claude que destile estilo/FAQ de las convos).

export function armarPromptEntrenado(
  tipo: TipoAgente,
  nombreNegocio: string,
  proposito: string,
  ent?: Entrenamiento,
): string {
  const base =
    tipo === "voz"
      ? `Sos el asistente telefónico de ${nombreNegocio}. Hablás claro, cálido y directo, en español. Respuestas cortas: 1 o 2 frases, nunca párrafos.`
      : `Sos el asistente de chat de ${nombreNegocio} (WhatsApp, Instagram y web). Respondés en español, humano y al grano; mensajes cortos, uno a la vez.`;

  const objetivo = `Tu objetivo: ${proposito || ent?.cta || "atender y calificar al cliente"}.`;

  if (!ent) {
    return `${base} ${objetivo} Si no sabés algo, no inventes: tomá los datos y decí que alguien confirma enseguida.`;
  }

  const contexto = [
    ent.nicho && `Rubro: ${ent.nicho}.`,
    ent.oferta && `Lo que ofrece: ${ent.oferta}.`,
    ent.publico && `Público: ${ent.publico}.`,
    ent.tono && `Tono de la marca: ${ent.tono}.`,
    ent.cta && `Meta de cada conversación: ${ent.cta}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const convos = ent.conversaciones?.trim()
    ? `\n\nEjemplos de conversaciones reales del negocio (imitá el estilo y el tipo de respuesta; NO copies datos viejos como fechas o precios puntuales):\n"""\n${ent.conversaciones.trim().slice(0, 4000)}\n"""`
    : "";

  return `${base} ${objetivo} ${contexto}${convos}\n\nSi no sabés algo, no inventes: tomá los datos y decí que alguien del equipo confirma enseguida.`;
}

// Resumen corto de qué tan entrenado está (para la UI).
export function entrenamientoCompleto(ent?: Entrenamiento): {
  campos: number;
  total: number;
  tieneConversaciones: boolean;
} {
  const claves: (keyof Entrenamiento)[] = [
    "nicho",
    "oferta",
    "tono",
    "publico",
    "cta",
  ];
  const campos = ent
    ? claves.filter((k) => (ent[k] ?? "").trim().length > 0).length
    : 0;
  return {
    campos,
    total: claves.length,
    tieneConversaciones: !!ent?.conversaciones?.trim(),
  };
}
