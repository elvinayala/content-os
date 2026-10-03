/**
 * Recorte del historial del agente (3/oct/2026). `slice(-40)` podía cortar entre un tool_use y su tool_result: la
 * conversación empezaba con un tool_result huérfano y la API devolvía 400 en CADA mensaje nuevo de ese cliente (no se le
 * contestaba nunca más). El historial siempre empieza en un mensaje del cliente que no sea un resultado de herramienta. Pura.
 */
type Msg = { role: string; content: unknown };
const esResultado = (m: Msg) => Array.isArray(m.content) && m.content.some((b: any) => b?.type === "tool_result");

export function recortarHistorial<T extends Msg>(mensajes: T[], max = 40): T[] {
  let ms = mensajes.slice(-max);
  const i = ms.findIndex((m) => m.role === "user" && !esResultado(m));
  return i < 0 ? [] : ms.slice(i);
}
