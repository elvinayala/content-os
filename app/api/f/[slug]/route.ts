import { after, NextResponse, type NextRequest } from "next/server";

import { marcarResultado, formularioPorSlug, guardarRespuesta } from "@/lib/formularios/repo";
import { limpiar, type Respuestas, validar } from "@/lib/formularios/reglas";
import { iniciarClienteMax } from "@/lib/max/onboarding";
import { altaDesdeFormulario } from "@/lib/onboarding/alta";
import { limiteIp, secretoValido } from "@/lib/pulse/seguridad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Envío de un formulario propio (/f/<slug>). Público (lo llena cualquiera con el link): límite por
// IP, campo trampa, la misma validación que la página y un token por navegador para no duplicar.
// La respuesta SIEMPRE se guarda primero; la acción (p. ej. ficha en Pulse) corre después y si
// falla queda marcada en la respuesta, sin perder nada. `?prueba=1` + `x-prueba: CRON_SECRET` →
// la ficha va al tablero Demo.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (!limiteIp(`form:${slug}:${ip}`, 8, 10 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Demasiados envíos seguidos. Espera unos minutos y vuelve a intentar." }, { status: 429 });
  }
  let body: { token?: string; respuestas?: Respuestas; empresa_web?: string; origen?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }
  if (body.empresa_web) return NextResponse.json({ ok: true }); // trampa: una persona nunca la llena
  const token = String(body.token ?? "");
  if (!/^[a-z0-9-]{16,64}$/i.test(token)) return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });

  const f = await formularioPorSlug(slug);
  if (!f || f.archivado) return NextResponse.json({ ok: false, error: "Este formulario no existe." }, { status: 404 });
  if (!f.activo) return NextResponse.json({ ok: false, error: "Este formulario ya no está recibiendo respuestas." }, { status: 410 });

  const preguntas = f.config.preguntas;
  const errores = validar(preguntas, body.respuestas ?? {});
  if (Object.keys(errores).length) return NextResponse.json({ ok: false, errores }, { status: 422 });
  const respuestas = limpiar(preguntas, body.respuestas ?? {});

  const r = await guardarRespuesta({
    formularioId: f.id,
    token,
    respuestas,
    preguntas: preguntas.map((p) => ({ id: p.id, titulo: p.titulo })),
    origen: body.origen ? String(body.origen).slice(0, 80) : null,
  });
  if (!r.nueva) return NextResponse.json({ ok: true, repetido: true });

  if (f.accion === "pulse-onboarding-lu") {
    const prueba = req.nextUrl.searchParams.get("prueba") === "1" && secretoValido(req.headers.get("x-prueba"), process.env.CRON_SECRET);
    try {
      // Mismo token que usaba /api/onboarding/level-up: si llegara por los dos lados, no duplica la ficha.
      const alta = await altaDesdeFormulario(`form-${token}`, respuestas, { tablero: prueba ? "demo" : undefined, preguntas });
      await marcarResultado(r.id, `ficha-${alta.estado}:${alta.itemId}${prueba ? " (demo)" : ""}`);
      // Cliente nuevo de verdad → Max abre su expediente (arranca con el Fathom del onboarding).
      if (!prueba && alta.estado !== "repetido") after(() => iniciarClienteMax(alta).catch((e) => console.error("[formulario → max]", e instanceof Error ? e.message : e)));
    } catch (e) {
      console.error(`[f/${slug}] acción`, e);
      await marcarResultado(r.id, `error: ${e instanceof Error ? e.message : String(e)}`).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}
