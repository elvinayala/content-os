import { after, NextResponse, type NextRequest } from "next/server";

import { avisarFirma, firmarContrato } from "@/lib/aib-contratos/firmar";
import { contratoPorToken } from "@/lib/aib-contratos/repo";

// Firma del contrato de AI Borinquen (público: el link lleva el token). Valida todo adentro.
export const maxDuration = 60;

const intentos = new Map<string, number[]>();
function demasiados(ip: string) {
  const ahora = Date.now(), xs = (intentos.get(ip) ?? []).filter((t) => ahora - t < 60_000);
  xs.push(ahora); intentos.set(ip, xs);
  return xs.length > 10;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "?";
  if (demasiados(ip)) return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera un minuto." }, { status: 429 });
  const c = await contratoPorToken(token);
  if (!c) return NextResponse.json({ ok: false, error: "Este enlace no es válido." }, { status: 404 });
  const cuerpo = await req.json().catch(() => null);
  try {
    const r = await firmarContrato(c, cuerpo, { ip, ua: req.headers.get("user-agent") ?? "?" });
    if (r.ok) after(() => avisarFirma(c, String(cuerpo?.datos?.nombre ?? c.oferta.cliente.nombre)).catch((e) => console.error("aib-contratos: aviso", e)));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch (e) {
    console.error("aib-contratos: firmar", e);
    return NextResponse.json({ ok: false, error: "No se pudo generar el contrato. Vuelve a intentarlo en un momento." }, { status: 500 });
  }
}
