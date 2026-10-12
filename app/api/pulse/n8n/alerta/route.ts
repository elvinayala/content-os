import { NextRequest, NextResponse } from "next/server";

import { notificarPorNico } from "@/lib/notificar-ceo";
import { secretoValido } from "@/lib/pulse/seguridad";

// Alertas técnicas de n8n para Elvin (Telegram de Nico + espejo en Slack). Solo con x-pulse-secret.
// Nació el 11/oct/2026: el WhatsApp de Level Up estuvo 5 días desconectado y la alerta de las 7 AM solo salía
// en un canal de Slack que nadie mira. El flujo avisa una vez al día (su propio horario), aquí no se repite.
//  POST {texto}  → { ok, telegram, slack }
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!secretoValido(req.headers.get("x-pulse-secret"), process.env.PULSE_N8N_SECRET)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { texto?: unknown };
  const texto = typeof b.texto === "string" ? b.texto.replace(/\s+/g, " ").trim().slice(0, 600) : "";
  if (!texto) return NextResponse.json({ error: "texto" }, { status: 400 });
  const r = await notificarPorNico(`🔧 n8n: ${texto}`);
  return NextResponse.json({ ok: r.telegram || r.slack, ...r });
}
