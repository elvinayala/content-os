/** Reportes de Nina a Elvin por Telegram (mismo bot de Resuelto que usa el agente para escalaciones). */
import { config } from "../config.js";

export async function reportar(texto: string): Promise<boolean> {
  const { botToken, coordinadorChatId } = config.telegram;
  if (!botToken || !coordinadorChatId) { console.log(`[Nina → Telegram (sin configurar)]\n${texto}`); return false; }
  const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: coordinadorChatId, text: texto, disable_web_page_preview: false }),
  }).catch(() => null);
  return !!r?.ok;
}
