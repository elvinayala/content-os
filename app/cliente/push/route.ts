import { NextResponse, type NextRequest } from "next/server";

import { borrarSuscripcionCliente, enviarPushCliente, guardarSuscripcionCliente } from "@/lib/clientes-app/push";
import { visorActual } from "@/lib/clientes-app/sesion";
import { pushConfigurado, suscripcionValida } from "@/lib/push/enviar";
import { nombreDispositivo } from "@/lib/push/texto";

// Suscribir / quitar / probar los avisos en el teléfono del CLIENTE. Solo el cliente con su sesión (la vista previa
// del equipo no suscribe teléfonos a nombre del cliente). También la llama el service worker al renovarse.
export async function POST(req: NextRequest) {
  const origen = req.headers.get("origin");
  if (origen && new URL(origen).host !== req.headers.get("host")) return NextResponse.json({ ok: false, error: "origen" }, { status: 403 });
  const v = await visorActual();
  if (!v) return NextResponse.json({ ok: false, error: "no-autorizado" }, { status: 401 });
  if (v.modo !== "cliente") return NextResponse.json({ ok: false, error: "Es la vista previa del equipo: los avisos los activa el cliente en su teléfono." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { accion?: string; sub?: unknown; endpoint?: string; anterior?: string; instalada?: boolean } | null;

  if (body?.accion === "suscribir") {
    if (!suscripcionValida(body.sub)) return NextResponse.json({ ok: false, error: "suscripcion" }, { status: 400 });
    if (typeof body.anterior === "string") await borrarSuscripcionCliente(v.itemId, body.anterior);
    await guardarSuscripcionCliente(v.itemId, body.sub, nombreDispositivo(req.headers.get("user-agent") ?? "", !!body.instalada));
    return NextResponse.json({ ok: true });
  }
  if (body?.accion === "quitar" && typeof body.endpoint === "string") {
    await borrarSuscripcionCliente(v.itemId, body.endpoint);
    return NextResponse.json({ ok: true });
  }
  if (body?.accion === "probar") {
    if (!pushConfigurado()) return NextResponse.json({ ok: false, error: "Faltan las llaves de avisos en el servidor" }, { status: 503 });
    const n = await enviarPushCliente(v.itemId, { titulo: "Level Up Media", texto: "¡Listo! Así te van a llegar los avisos de tu cuenta.", url: "/cliente", tag: "lu-prueba" });
    return NextResponse.json({ ok: n > 0, enviados: n, ...(n ? {} : { error: "No llegó a ningún teléfono: vuelve a activar los avisos" }) });
  }
  return NextResponse.json({ ok: false, error: "accion" }, { status: 400 });
}
