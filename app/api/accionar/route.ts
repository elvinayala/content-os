import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";
import { RESPONSABLES } from "@/lib/equipo-slack";

export const runtime = "nodejs";

// Botón "Accionar" del Command Center: Elvin revisa/edita un mensaje en la UI y
// acá se envía por DM de Slack AL RESPONSABLE, con la identidad de Elvin (user
// token). Solo sesión CEO. El destinatario debe estar en el directorio
// (lib/equipo-slack.ts) — no se puede escribir a IDs arbitrarios.

interface Body {
  destinatario?: string; // Slack user id (del directorio)
  texto?: string;
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_SESION)?.value;
  if (!(await sesionValida(cookie))) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const token = process.env.SLACK_LEVELUP_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Falta SLACK_LEVELUP_TOKEN." },
      { status: 503 },
    );
  }

  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  const destinatario = RESPONSABLES.find((r) => r.id === b.destinatario);
  const texto = (b.texto ?? "").trim().slice(0, 2000);
  if (!destinatario || !texto) {
    return NextResponse.json(
      { ok: false, error: "destinatario-o-texto" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: destinatario.id, text: texto }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      return NextResponse.json(
        { ok: false, error: `slack: ${data.error ?? "?"}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, a: destinatario.nombre });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fetch" },
      { status: 502 },
    );
  }
}
