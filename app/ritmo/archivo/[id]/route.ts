import { NextResponse, type NextRequest } from "next/server";

import { evento } from "@/lib/desempeno/datos";
import { extension, leerArchivoFicha, seAbreEnLinea, tipoPermitido, urlFirmada } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { leerArchivoLocal } from "@/lib/pulse/storage";

// Documento/video de una ficha: solo la vista maestra o la propia persona. Queda en la bitácora.
// El tipo sale de la extensión permitida (nunca del navegador) y lo que no es foto/PDF/video se descarga.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const a = await leerArchivoFicha(id);
  if (!a) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  if (!u.maestro && u.id !== a.userId) return NextResponse.json({ error: "no-autorizado" }, { status: 403 });
  await evento({ userId: a.userId, actorId: u.id, tipo: "archivo_visto", datos: { nombre: a.nombre } });
  const mime = tipoPermitido(a.categoria, a.nombre) ?? "application/octet-stream";
  const enLinea = seAbreEnLinea(mime);
  const nombre = a.nombre.replace(/[^\w.\- ]+/g, "_") || `archivo.${extension(a.nombre)}`;
  const url = await urlFirmada(a.storagePath, enLinea ? undefined : nombre);
  if (url) return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
  const datos = await leerArchivoLocal(a.storagePath);
  return new NextResponse(new Uint8Array(datos), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `${enLinea ? "inline" : "attachment"}; filename="${encodeURIComponent(nombre)}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
