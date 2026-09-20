import { type NextRequest, NextResponse } from "next/server";

import {
  COOKIE_CONTENIDO,
  COOKIE_SESION,
  sesionContenidoValida,
  sesionValida,
} from "@/lib/auth";
import { pasarPedidoASlack, responderSofi, type MsgSofi } from "@/lib/sofi";

export const runtime = "nodejs";
export const maxDuration = 30;

// Chat del equipo de contenido: Valentina, Juan Diego y creadores le hablan a SOFI
// (jefa de contenido) para pedir lo que necesitan. Sofi responde y el pedido se pasa
// al equipo por Slack para que se produzca y caiga en la bandeja de Entregas.

async function autorizado(req: NextRequest): Promise<boolean> {
  const ceo = req.cookies.get(COOKIE_SESION)?.value;
  if (await sesionValida(ceo)) return true;
  const cont = req.cookies.get(COOKIE_CONTENIDO)?.value;
  return sesionContenidoValida(cont);
}

export async function POST(req: NextRequest) {
  if (!(await autorizado(req))) {
    return NextResponse.json({ error: "no-auth" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "sin-key", texto: "El chat no está disponible (falta la API key)." },
      { status: 503 },
    );
  }

  let body: { mensajes?: MsgSofi[]; usuario?: string };
  try {
    body = (await req.json()) as { mensajes?: MsgSofi[]; usuario?: string };
  } catch {
    return NextResponse.json({ error: "body" }, { status: 400 });
  }
  const mensajes = (body.mensajes ?? []).slice(-12);
  const usuario = (body.usuario ?? "").slice(0, 40);
  const ultimo = mensajes.filter((m) => m.role === "user").at(-1)?.content ?? "";

  try {
    const texto = await responderSofi(mensajes);

    // Si el mensaje del usuario es un pedido real (no un "hola"), lo pasamos a Slack.
    if (ultimo.trim().length >= 15) {
      await pasarPedidoASlack(usuario, ultimo.trim());
    }

    return NextResponse.json({ texto });
  } catch {
    return NextResponse.json(
      { error: "modelo", texto: "Se me trabó la respuesta, probá de nuevo." },
      { status: 502 },
    );
  }
}
