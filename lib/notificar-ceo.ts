import "server-only";

import { enviarTelegram, telegramListo } from "@/lib/telegram";

// Un solo lugar para "avisarle a Elvin". Telegram es el canal principal cuando está
// configurado; Slack (DM del bot Command Center) queda siempre como espejo, porque la
// ronda diaria de Sofi (/coordinar-produccion) lee ese DM como bitácora.
const CEO_SLACK_ID = process.env.CEO_SLACK_ID ?? "U08U9777PUY";

export async function notificarSlackCEO(texto: string): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel: CEO_SLACK_ID, text: texto }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

export async function notificarCEO(texto: string): Promise<{ telegram: boolean; slack: boolean }> {
  const [tg, sl] = await Promise.all([
    telegramListo() ? enviarTelegram(texto).then((r) => r.ok) : Promise.resolve(false),
    notificarSlackCEO(texto),
  ]);
  return { telegram: tg, slack: sl };
}
