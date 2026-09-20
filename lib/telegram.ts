// Telegram = el canal directo de Elvin con sus agentes (decisión 18/sep/2026: "todas las
// comunicaciones de mi agente serán por mi Telegram directo"). Bot API sin dependencias.
// Requiere TELEGRAM_BOT_TOKEN (de @BotFather) y TELEGRAM_CEO_CHAT_ID (el chat de Elvin).
// Sin esas dos vars, telegramListo() es false y todo cae a Slack (lib/notificar-ceo.ts).

const API = (token: string) => `https://api.telegram.org/bot${token}`;

export function telegramListo(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CEO_CHAT_ID);
}

// Slack usa *negrita* y _cursiva_; Telegram (HTML) usa <b>/<i>. Convertimos lo mínimo
// para que el mismo texto sirva en los dos canales sin escribirlo dos veces.
export function slackAHtml(texto: string): string {
  const esc = texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/:([a-z0-9_+-]+):/g, "") // emojis de Slack (:clapper:) no existen en Telegram
    .replace(/\*([^*\n]+)\*/g, "<b>$1</b>")
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,;:!?])/g, "$1<i>$2</i>")
    .replace(/&lt;(https?:\/\/[^|&]+)\|([^&]+)&gt;/g, '<a href="$1">$2</a>')
    .trim();
}

// Telegram corta en 4096 caracteres: partimos por párrafo.
function partir(texto: string, max = 3900): string[] {
  if (texto.length <= max) return [texto];
  const partes: string[] = [];
  let actual = "";
  for (const parrafo of texto.split("\n\n")) {
    if ((actual + "\n\n" + parrafo).length > max && actual) {
      partes.push(actual);
      actual = parrafo;
    } else {
      actual = actual ? actual + "\n\n" + parrafo : parrafo;
    }
  }
  if (actual) partes.push(actual);
  return partes;
}

export async function enviarTelegram(
  texto: string,
  opts: { chatId?: string; html?: boolean } = {},
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = opts.chatId ?? process.env.TELEGRAM_CEO_CHAT_ID;
  if (!token || !chatId) return { ok: false, error: "telegram-no-configurado" };
  const cuerpo = opts.html === false ? texto : slackAHtml(texto);
  for (const parte of partir(cuerpo)) {
    const res = await fetch(`${API(token)}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: parte,
        parse_mode: opts.html === false ? undefined : "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!data.ok) {
      // Si el HTML falla (etiqueta mal cerrada), reintentamos en texto plano.
      if (opts.html !== false) return enviarTelegram(texto, { ...opts, html: false });
      return { ok: false, error: data.description ?? `http-${res.status}` };
    }
  }
  return { ok: true };
}

// Forma mínima del update que nos interesa (mensajes de texto en chat privado).
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    date: number;
    chat: { id: number; type: string; first_name?: string; username?: string };
    from?: { id: number; first_name?: string; username?: string };
  };
}
