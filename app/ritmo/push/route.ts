import { NextResponse, type NextRequest } from "next/server";

import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { borrarSuscripcion, enviarPush, guardarSuscripcion, pushConfigurado, suscripcionValida } from "@/lib/push/enviar";
import { nombreDispositivo } from "@/lib/push/texto";

// Suscribir / quitar / probar las notificaciones push del teléfono de la persona (app de Ritmo).
// Ruta y no server action: también la llama el service worker cuando Apple/Google renuevan la suscripción.
export async function POST(req: NextRequest) {
  // Solo desde la propia app (misma origen): nada de formularios de otros sitios.
  const origen = req.headers.get("origin");
  if (origen && new URL(origen).host !== req.headers.get("host")) return NextResponse.json({ ok: false, error: "origen" }, { status: 403 });
  const u = await usuarioRitmo();
  if (!u) return NextResponse.json({ ok: false, error: "no-autorizado" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { accion?: string; sub?: unknown; endpoint?: string; anterior?: string; instalada?: boolean } | null;
  if (!body?.accion) return NextResponse.json({ ok: false, error: "pedido" }, { status: 400 });

  if (body.accion === "suscribir") {
    if (!suscripcionValida(body.sub)) return NextResponse.json({ ok: false, error: "suscripcion" }, { status: 400 });
    if (body.anterior && typeof body.anterior === "string") await borrarSuscripcion(u.id, body.anterior);
    await guardarSuscripcion(u.id, body.sub, nombreDispositivo(req.headers.get("user-agent") ?? "", !!body.instalada));
    return NextResponse.json({ ok: true });
  }
  if (body.accion === "quitar") {
    if (typeof body.endpoint !== "string") return NextResponse.json({ ok: false, error: "endpoint" }, { status: 400 });
    await borrarSuscripcion(u.id, body.endpoint);
    return NextResponse.json({ ok: true });
  }
  if (body.accion === "probar") {
    if (!pushConfigurado()) return NextResponse.json({ ok: false, error: "Faltan las llaves VAPID en el servidor" }, { status: 503 });
    const n = await enviarPush(u.id, { titulo: "Ritmo", texto: `¡Listo, ${u.nombre.split(" ")[0]}! Así te van a llegar los avisos de Ritmo.`, url: "/ritmo/app", tag: "ritmo-prueba" });
    return NextResponse.json({ ok: n > 0, enviados: n, ...(n ? {} : { error: "No llegó a ningún teléfono: vuelve a activar las notificaciones" }) });
  }
  return NextResponse.json({ ok: false, error: "accion" }, { status: 400 });
}
