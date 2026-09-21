import { after, NextResponse, type NextRequest } from "next/server";

import { sincronizarLlamada } from "@/lib/portal/retell";
import { secretoValido } from "@/lib/pulse/seguridad";

// Webhook de Retell para el Portal AutoFlow. Lo registra la fábrica en cada agente
// (`demo.mjs portal <slug>` → update-agent.webhook_url = /api/retell-webhook?s=RETELL_WEBHOOK_SECRET).
// Eventos: call_started · call_ended · call_analyzed. No confiamos en el payload: respondemos
// 200 rápido y re-leemos la llamada con GET /v2/get-call en after(). Idempotente por call_id.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const esperado = process.env.RETELL_WEBHOOK_SECRET;
  if (!esperado) return NextResponse.json({ error: "Falta RETELL_WEBHOOK_SECRET" }, { status: 503 });
  if (!secretoValido(req.nextUrl.searchParams.get("s"), esperado)) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  let body: { event?: string; call?: { call_id?: string } } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const callId = body.call?.call_id;
  const evento = body.event ?? "";
  if (!callId || !/^call_[a-z0-9]+$/i.test(callId)) return NextResponse.json({ ok: true, ignorado: "sin call_id" });
  if (!["call_started", "call_ended", "call_analyzed"].includes(evento)) return NextResponse.json({ ok: true, ignorado: evento });

  after(async () => {
    try {
      const r = await sincronizarLlamada(callId);
      if (r !== "guardada") console.warn(`[retell-webhook] ${evento} ${callId}: ${r}`);
    } catch (e) {
      console.error("[retell-webhook]", e);
    }
  });
  return NextResponse.json({ ok: true });
}
