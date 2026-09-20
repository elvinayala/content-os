import { after, type NextRequest, NextResponse } from "next/server";

import { notificarSlackCEO } from "@/lib/notificar-ceo";
import { responderSofi, type MsgSofi } from "@/lib/sofi";
import { enviarTelegram, type TelegramUpdate } from "@/lib/telegram";

// Webhook de Telegram: el canal directo de Elvin con Sofi (y después con el resto de agentes).
// Seguridad: Telegram manda el header X-Telegram-Bot-Api-Secret-Token con el secreto que
// registramos en setWebhook (scripts/telegram-bot.mjs setup). Solo atendemos el chat de Elvin.
// Vercel no puede escribir archivos: cada mensaje (suyo y de Sofi) se ESPEJA al DM de Slack
// con el prefijo [Telegram], así la ronda diaria de Sofi lo lee como parte de la bitácora.

export const dynamic = "force-dynamic";

// Memoria corta por instancia (suficiente para hilar 2-3 mensajes seguidos; no persiste).
const hilo: MsgSofi[] = [];

export async function POST(req: NextRequest) {
  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secreto && req.headers.get("x-telegram-bot-api-secret-token") !== secreto) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const msg = update.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat.id);
  const ceo = process.env.TELEGRAM_CEO_CHAT_ID;

  // Primer contacto (o alguien ajeno): devolvemos el chat id para configurarlo, nada más.
  if (!ceo || chatId !== ceo) {
    if (msg.text.startsWith("/start") || !ceo) {
      await enviarTelegram(
        `Hola${msg.chat.first_name ? " " + msg.chat.first_name : ""}. Tu chat id es <code>${chatId}</code>. Ponlo en TELEGRAM_CEO_CHAT_ID y vuelve a escribirme.`,
        { chatId },
      );
    }
    return NextResponse.json({ ok: true });
  }

  // Telegram reintenta si no respondemos en ~60 s: ack rápido y trabajo después.
  after(async () => {
    const texto = msg.text!.trim();
    await notificarSlackCEO(`[Telegram] Elvin: ${texto}`);
    if (texto === "/start") {
      await enviarTelegram("Listo, Elvin. Por aquí te escribo yo y por aquí me contestas. Lo que me digas lo anoto en la ronda de las 7:30. — Sofi");
      return;
    }
    hilo.push({ role: "user", content: texto });
    const respuesta = await responderSofi(hilo.slice(-10));
    hilo.push({ role: "assistant", content: respuesta });
    await enviarTelegram(respuesta);
    await notificarSlackCEO(`[Telegram] Sofi: ${respuesta}`);
  });

  return NextResponse.json({ ok: true });
}
