import { NextResponse, type NextRequest } from "next/server";

import { notificarCEO } from "@/lib/notificar-ceo";
import { enlaceValido } from "@/lib/whatsapp-qr/enlace";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Estado + QR fresco del WhatsApp de Level Up para la página /vincular-whatsapp (enlace temporal firmado).
export async function GET(req: NextRequest) {
  const v = enlaceValido(req.nextUrl.searchParams.get("e"), req.nextUrl.searchParams.get("k"));
  if (v !== "ok") return NextResponse.json({ error: v }, { status: v === "vencido" ? 410 : 403 });
  try {
    const r = await fetch(`${(process.env.N8N_URL ?? "").replace(/\/$/, "")}/webhook/whatsapp-qr`, {
      method: "POST",
      headers: { "x-pulse-secret": process.env.PULSE_N8N_SECRET ?? "", "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(20000),
    });
    const j = (await r.json()) as { estado?: string; base64?: string | null };
    if (j.estado === "open") await notificarCEO("✅ El WhatsApp de Level Up (939-244-4237) quedó vinculado de nuevo.").catch(() => null);
    return NextResponse.json({ estado: j.estado ?? "error", base64: j.base64 ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ estado: "error", base64: null }, { status: 502 });
  }
}
