import { NextResponse, type NextRequest } from "next/server";

import { usuarioActual } from "@/lib/pulse/auth";
import { leerArchivo } from "@/lib/pulse/repo";
import { leerArchivoLocal, storageLocal, urlArchivo } from "@/lib/pulse/storage";

// Sirve un archivo de Pulse. Con Supabase redirige a la URL firmada; en dev local
// (sin SUPABASE_URL) lo lee de ./.pulse-db/archivos.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await usuarioActual())) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const { id } = await ctx.params;
  const f = await leerArchivo(id);
  if (!f) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  if (!storageLocal) return NextResponse.redirect(await urlArchivo(f.storagePath, f.id));
  const datos = await leerArchivoLocal(f.storagePath);
  return new NextResponse(new Uint8Array(datos), {
    headers: {
      "Content-Type": f.mime ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(f.nombre)}"`,
    },
  });
}
