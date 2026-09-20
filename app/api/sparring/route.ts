import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";
import {
  personajePorId,
  promptPersonaje,
  promptScorecard,
} from "@/lib/sparring";

// Sparring de ventas por voz. Dos acciones:
//  - "turno": el personaje (cliente difícil) responde al vendedor.
//  - "scorecard": al colgar, califica la práctica contra el framework de Joe.
// Sin streaming a propósito: las respuestas del personaje son cortas (1-3
// frases) y se leen con TTS del navegador, así que conviene el texto completo.

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-5";

interface Body {
  accion?: "turno" | "scorecard";
  personaje?: string;
  mensajes?: { rol: "vendedor" | "cliente"; texto: string }[];
}

export async function POST(req: NextRequest) {
  if (!(await sesionValida(req.cookies.get(COOKIE_SESION)?.value))) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "Falta ANTHROPIC_API_KEY" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  const p = personajePorId(body.personaje ?? "");
  if (!p) {
    return NextResponse.json(
      { ok: false, error: "personaje desconocido" },
      { status: 400 },
    );
  }

  // Se trunca el historial: una práctica es corta y no queremos que crezca.
  const historial = (body.mensajes ?? []).slice(-24);
  const client = new Anthropic();

  try {
    // ---- Scorecard: califica la práctica completa ----
    if (body.accion === "scorecard") {
      if (historial.length < 2) {
        return NextResponse.json(
          { ok: false, error: "practica-muy-corta" },
          { status: 400 },
        );
      }
      const transcripcion = historial
        .map(
          (m) => `${m.rol === "vendedor" ? "VENDEDOR" : p.nombre}: ${m.texto}`,
        )
        .join("\n");

      const r = await client.messages.create({
        model: MODEL,
        max_tokens: 1600,
        thinking: { type: "disabled" },
        output_config: { effort: "medium" },
        messages: [
          { role: "user", content: promptScorecard(p, transcripcion) },
        ],
      });
      const txt = r.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      // El modelo puede envolver el JSON en ```json … ```
      const limpio = txt
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      try {
        return NextResponse.json({ ok: true, scorecard: JSON.parse(limpio) });
      } catch {
        return NextResponse.json(
          { ok: false, error: "scorecard-invalido", crudo: limpio.slice(0, 400) },
          { status: 502 },
        );
      }
    }

    // ---- Turno del personaje ----
    const mensajes: Anthropic.MessageParam[] = historial.map((m) => ({
      role: m.rol === "vendedor" ? ("user" as const) : ("assistant" as const),
      content: m.texto,
    }));
    // La conversación tiene que arrancar con el vendedor.
    if (mensajes.length === 0 || mensajes[0].role !== "user") {
      mensajes.unshift({ role: "user", content: "(el vendedor te llama)" });
    }

    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 300, // respuestas cortas, como en una llamada real
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: promptPersonaje(p),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: mensajes,
    });

    const texto = r.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({ ok: true, texto });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 502 },
    );
  }
}
