/**
 * Cuándo NO contestar (22/sep/2026, caso David): si el último mensaje nuestro ya cerró (no preguntó nada)
 * y la persona solo responde "ok", "gracias" o un emoji, cualquier respuesta sobra y delata al bot
 * ("Wepa! Cuídate, David"). Módulo puro, con test.
 */
const ACUSE = /^\s*(ok(ay|i)?|oki|okey|dale|gracias+|mil gracias|perfecto|listo|bien|excelente|bendiciones|igualmente|👍|🙏|👌|✅|💪|😊|🙂)[\s!.👍🙏👌😊🙂]*$/iu;
export function esSoloAcuse(t?: string): boolean { return !!t && ACUSE.test(t); }

type Msg = { role: string; content: unknown };
/** true si nuestro último mensaje con texto hizo una pregunta (o si todavía no hemos dicho nada). */
export function ultimoPregunto(mensajes: Msg[]): boolean {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    const m = mensajes[i];
    if (m.role !== "assistant") continue;
    const texto = typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.filter((b: any) => b?.type === "text").map((b: any) => b.text).join(" ") : "";
    if (!texto.trim()) continue;
    return texto.includes("?");
  }
  return true;
}
