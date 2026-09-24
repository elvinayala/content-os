import { NextResponse, type NextRequest } from "next/server";

import { altaDesdeFormulario } from "@/lib/onboarding/alta";
import { type Respuestas, validar } from "@/lib/onboarding/level-up";
import { limiteIp, secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Formulario público de onboarding de Level Up (/onboarding/level-up) → ficha en Pulse.
// Sin login (lo llena el cliente): límite por IP, campo trampa para bots y la misma validación
// que la página. `?prueba=1` con `x-prueba: CRON_SECRET` escribe en el tablero Demo.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (!limiteIp(`onboarding:${ip}`, 6, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Demasiados envíos seguidos. Espera unos minutos y vuelve a intentar." }, { status: 429 });
  }
  let body: { token?: string; respuestas?: Respuestas; empresa_web?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }
  // Campo trampa invisible: una persona nunca lo llena.
  if (body.empresa_web) return NextResponse.json({ ok: true });
  const token = String(body.token ?? "");
  if (!/^[a-z0-9-]{16,64}$/i.test(token)) return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  const respuestas = body.respuestas ?? {};
  const errores = validar(respuestas);
  if (Object.keys(errores).length) return NextResponse.json({ ok: false, errores }, { status: 422 });

  const prueba = req.nextUrl.searchParams.get("prueba") === "1" && secretoValido(req.headers.get("x-prueba"), process.env.CRON_SECRET);
  try {
    const r = await altaDesdeFormulario(`form-${token}`, respuestas, { tablero: prueba ? "demo" : undefined });
    return NextResponse.json({ ok: true, estado: r.estado });
  } catch (e) {
    console.error("[onboarding/level-up]", e);
    return NextResponse.json({ ok: false, error: "No pudimos guardar tus respuestas. Intenta de nuevo en un minuto." }, { status: 500 });
  }
}
