import { timingSafeEqual } from "node:crypto";

import { after, NextResponse, type NextRequest } from "next/server";

import { registrarMensaje, registrarWebhook } from "@/lib/leads/repo";
import { leerTimelines, MARCAS, normalizarTelefono } from "@/lib/leads/reglas";
import { chatTimelines } from "@/lib/leads/timelines";

// Puente WhatsApp → Leads. Timelines.ai llama aquí con cada mensaje (entrante y saliente) de los
// números conectados: /api/leads/timelines?marca=level-up&s=LEADS_WEBHOOK_SECRET
// Timelines no firma los avisos → secreto en la URL. Hay que contestar 2xx en < 5 s (si no,
// reintenta 2 veces): se contesta ya y se procesa con after().
export const runtime = "nodejs";
export const maxDuration = 60;

function secretoOk(s: string | null): boolean {
  const esperado = process.env.LEADS_WEBHOOK_SECRET ?? "";
  if (!esperado || !s) return false;
  const a = Buffer.from(s);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const u = new URL(req.url);
  if (!secretoOk(u.searchParams.get("s"))) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const m = MARCAS[u.searchParams.get("marca") ?? ""];
  if (!m) return NextResponse.json({ error: "marca" }, { status: 400 });
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  after(async () => {
    const ev = leerTimelines(cuerpo);
    let resultado = "";
    try {
      // Si el aviso no trae el teléfono del cliente, se lo pedimos a Timelines por el chat.
      if (!ev.telefono && ev.chatId) {
        const c = await chatTimelines(m.marca, ev.chatId);
        const d = (c.data?.data ?? c.data ?? {}) as Record<string, unknown>;
        ev.telefono = normalizarTelefono(d.phone ?? d.phone_number ?? d.jid);
        ev.nombre ??= (d.full_name ?? d.name ?? null) as string | null;
        if (d.is_group) ev.esGrupo = true;
      }
      resultado = await registrarMensaje(m.marca, ev);
    } catch (e) {
      resultado = `error:${e instanceof Error ? e.message : String(e)}`.slice(0, 300);
      console.error("[leads/timelines]", resultado);
    }
    await registrarWebhook("timelines", m.marca, ev.evento, resultado, cuerpo).catch(() => {});
  });
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, servicio: "Leads · puente de WhatsApp (Timelines.ai)" });
}
