import { NextResponse, type NextRequest } from "next/server";

import { evento } from "@/lib/desempeno/datos";
import { leerArchivoFicha, urlFirmada } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { leerArchivoLocal } from "@/lib/pulse/storage";

// Documento/video de una ficha: solo la vista maestra o la propia persona. Queda en la bitácora.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const a = await leerArchivoFicha(id);
  if (!a) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  if (!u.maestro && u.id !== a.userId) return NextResponse.json({ error: "no-autorizado" }, { status: 403 });
  await evento({ userId: a.userId, actorId: u.id, tipo: "archivo_visto", datos: { nombre: a.nombre } });
  const url = await urlFirmada(a.storagePath);
  if (url) return NextResponse.redirect(url);
  const datos = await leerArchivoLocal(a.storagePath);
  return new NextResponse(new Uint8Array(datos), { headers: { "Content-Type": a.mime ?? "application/octet-stream", "Content-Disposition": `inline; filename="${encodeURIComponent(a.nombre)}"` } });
}
