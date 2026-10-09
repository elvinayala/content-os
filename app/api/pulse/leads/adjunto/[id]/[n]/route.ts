import { NextResponse, type NextRequest } from "next/server";

import { adjuntoDeMensaje, guardarAhora, urlFrescaTimelines } from "@/lib/leads/adjuntos";
import { seGuardaAdjunto } from "@/lib/leads/reglas";
import { accesoLeads } from "@/lib/leads/repo";
import { usuarioVerificado } from "@/lib/pulse/auth";
import { leerArchivoLocal, storageLocal, urlArchivo } from "@/lib/pulse/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Audio, foto o documento de una conversación de WhatsApp en Leads, con los mismos permisos del lead.
// Lo guardado en Storage va por URL firmada; lo que no (videos, o algo que no se pudo copiar al llegar)
// se pide fresco a Timelines.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string; n: string }> }) {
  const u = await usuarioVerificado();
  if (!u) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const { id, n } = await ctx.params;
  const i = Number(n);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(i) || i < 0 || i > 9) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  const a = await adjuntoDeMensaje(id, i);
  if (!a) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  const acc = await accesoLeads(u, a.marca);
  if (!acc.puede || (acc.alcance === "mios" && a.duenoId !== u.id)) return NextResponse.json({ error: "no-autorizado" }, { status: 403 });

  const ruta = a.ruta ?? (seGuardaAdjunto(a) ? await guardarAhora(a, i) : null);
  if (ruta) {
    if (!storageLocal) return NextResponse.redirect(await urlArchivo(ruta, ""));
    const datos = await leerArchivoLocal(ruta);
    return new NextResponse(new Uint8Array(datos), { headers: { "Content-Type": a.mime, "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff" } });
  }
  const fresca = a.externoId ? await urlFrescaTimelines(a.marca, a.externoId) : null;
  if (fresca) return NextResponse.redirect(fresca);
  return NextResponse.json({ error: "Ya no está disponible en WhatsApp" }, { status: 404 });
}
