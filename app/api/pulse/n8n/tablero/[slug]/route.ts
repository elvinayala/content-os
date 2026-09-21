import { NextRequest, NextResponse } from "next/server";

import { exportarTablero } from "@/lib/pulse/export-n8n";

// Un tablero de Pulse con la forma de la API de Monday (items[].column_values con column.title,
// text, value, display_value). Lo usan los workflows de n8n que antes leían Monday directo:
// Agente Cobros y Recordatorio 60-90 (tesoreria), Agente supervisor (level-up-media?idMonday=…).
// Solo con x-pulse-secret (proxy.ts deja pasar /api/pulse/n8n/*).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const secreto = process.env.PULSE_N8N_SECRET;
  if (!secreto || req.headers.get("x-pulse-secret") !== secreto) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  const idMonday = req.nextUrl.searchParams.get("idMonday") ?? undefined;
  const r = await exportarTablero(slug, { idMonday });
  if (!r) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  return NextResponse.json({ generadoEl: new Date().toISOString(), board: r.board, total: r.items.length, items: r.items }, { headers: { "Cache-Control": "no-store" } });
}
