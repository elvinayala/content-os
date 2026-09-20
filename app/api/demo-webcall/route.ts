import { NextRequest, NextResponse } from "next/server";

// Endpoint central de voz para las demos de la Fábrica de Demos (jugada 3).
// Cada demo estática en Netlify le pide acá un access_token efímero de Retell
// para su agente. La API key vive SOLO en Vercel; la demo nunca la ve.
// Seguridad: solo agentes cuyo nombre empieza con "Demo AutoFlow" (los crea
// scripts/demo-cliente/demo.mjs). El tope real de gasto está en Retell.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS });
}

export async function POST(req: NextRequest) {
  const key = process.env.RETELL_API_KEY;
  if (!key) return json({ error: "Falta RETELL_API_KEY" }, 503);

  let agentId = "";
  try {
    const body = (await req.json()) as { agent_id?: string };
    agentId = String(body.agent_id ?? "");
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  if (!/^agent_[a-z0-9]+$/i.test(agentId)) {
    return json({ error: "agent_id inválido" }, 400);
  }

  const H = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  try {
    const info = await fetch(`https://api.retellai.com/get-agent/${agentId}`, {
      headers: H,
      signal: AbortSignal.timeout(8000),
    });
    if (!info.ok) return json({ error: "Agente no existe" }, 404);
    const agente = (await info.json()) as { agent_name?: string };
    if (!(agente.agent_name ?? "").startsWith("Demo AutoFlow")) {
      return json({ error: "Agente no habilitado para demos" }, 403);
    }

    const r = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: H,
      body: JSON.stringify({ agent_id: agentId }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return json({ error: `Retell ${r.status}`, detail: detail.slice(0, 300) }, 502);
    }
    const data = (await r.json()) as { access_token: string; call_id: string };
    return json({ access_token: data.access_token, call_id: data.call_id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
