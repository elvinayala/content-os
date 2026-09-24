import { NextResponse, type NextRequest } from "next/server";

import { altaDesdeTypeform } from "@/lib/pulse/alta-typeform";
import { firmaTypeformValida, mapearRespuesta, type PayloadTypeform } from "@/lib/pulse/typeform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook del Typeform de onboarding (lo llama Typeform, sin cookie; proxy.ts lo deja pasar).
// Se autentica por la firma `Typeform-Signature` con TYPEFORM_WEBHOOK_SECRET. `?prueba=1`
// escribe en el tablero Demo en vez de LEVEL UP MEDIA (para probar sin tocar clientes reales).
export async function POST(req: NextRequest) {
  const cuerpo = await req.text();
  if (!(await firmaTypeformValida(cuerpo, req.headers.get("typeform-signature"), process.env.TYPEFORM_WEBHOOK_SECRET))) {
    return NextResponse.json({ ok: false, error: "firma-invalida" }, { status: 401 });
  }
  let payload: PayloadTypeform;
  try {
    payload = JSON.parse(cuerpo);
  } catch {
    return NextResponse.json({ ok: false, error: "json-invalido" }, { status: 400 });
  }
  const datos = mapearRespuesta(payload);
  if (!datos) return NextResponse.json({ ok: true, ignorado: "sin respuestas" });
  try {
    const r = await altaDesdeTypeform(datos, { tablero: req.nextUrl.searchParams.get("prueba") === "1" ? "demo" : undefined });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.error("[pulse/typeform]", e);
    // 500 → Typeform reintenta; el alta es idempotente por token.
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
