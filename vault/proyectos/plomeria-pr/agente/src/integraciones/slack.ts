/**
 * Avisos al equipo por Slack (23/sep/2026): la reclutadora de Resuelto (Yaileen, excepción explícita de
 * Elvin a la regla de "nada de gente de las agencias") recibe un DM corto por cada entrevista agendada y
 * por cada gran candidato que no agendó. Bot = el de siempre del workspace (SLACK_BOT_TOKEN).
 * Sin token: se escribe en consola y no falla nada.
 */
import { config } from "../config.js";

export async function dmSlack(usuarioId: string, texto: string): Promise<boolean> {
  if (!config.slack.token || !usuarioId) { console.log(`[Slack simulado → ${usuarioId}] ${texto}`); return false; }
  const r = await fetch("https://slack.com/api/chat.postMessage", { method: "POST", headers: { Authorization: `Bearer ${config.slack.token}`, "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ channel: usuarioId, text: texto, unfurl_links: false }) }).catch(() => null);
  const j = (await r?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!j?.ok) console.error("Slack DM", j?.error ?? r?.status);
  return !!j?.ok;
}
