import { NextResponse, type NextRequest } from "next/server";

import { secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Diagnóstico temporal de Nico (1/oct) para el caso de Ángelo (Quality Care / Angelorum):
// por qué +17876659913 da un mensaje en inglés y cuelga. Se borra al cerrar el caso.
export async function GET(req: NextRequest) {
  if (!secretoValido(req.headers.get("x-debug-token"), process.env.DEBUG_RETELL_TOKEN ?? "")) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const key = process.env.RETELL_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "sin RETELL_API_KEY" }, { status: 500 });
  const headers = { Authorization: `Bearer ${key}` };
  const agentId = req.nextUrl.searchParams.get("agent") || "agent_7be94f38b8988350cf0cef1ec6";
  const numero = req.nextUrl.searchParams.get("numero") || "+17876659913";

  const [agenteR, numeroR, llamadasR] = await Promise.all([
    fetch(`https://api.retellai.com/get-agent/${encodeURIComponent(agentId)}`, { headers }),
    fetch(`https://api.retellai.com/get-phone-number/${encodeURIComponent(numero)}`, { headers }),
    fetch("https://api.retellai.com/v2/list-calls", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ filter_criteria: { agent_id: [agentId] }, sort_order: "descending", limit: 10 }),
    }),
  ]);

  const agente = agenteR.ok ? await agenteR.json() : { error: agenteR.status, texto: await agenteR.text() };
  const numeroInfo = numeroR.ok ? await numeroR.json() : { error: numeroR.status, texto: await numeroR.text() };
  const llamadas = llamadasR.ok ? await llamadasR.json() : { error: llamadasR.status, texto: await llamadasR.text() };

  return NextResponse.json({ ok: true, agente, numeroInfo, llamadas });
}
