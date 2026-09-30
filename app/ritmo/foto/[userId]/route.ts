import { NextResponse, type NextRequest } from "next/server";

import { leerFicha, tipoPermitido, urlFirmada } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { leerArchivoLocal } from "@/lib/pulse/storage";

// Foto de la ficha: la vista maestra o la propia persona.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return new NextResponse(null, { status: 401 });
  const { userId } = await ctx.params;
  if (!u.maestro && u.id !== userId) return new NextResponse(null, { status: 403 });
  const f = await leerFicha(userId);
  if (!f?.fotoPath) return new NextResponse(null, { status: 404 });
  const mime = tipoPermitido("foto", f.fotoPath);
  if (!mime) return new NextResponse(null, { status: 404 }); // fotos viejas con otro tipo no se sirven
  // 29/sep: la foto se guarda en el navegador un día (la URL lleva ?v= con la foto, así que un cambio se ve al
  // instante). Antes era no-store: cada visita a Equipo/Personas volvía a pedir ~20 fotos al servidor y a la base,
  // y la pestaña siguiente esperaba detrás de ellas. Solo fotos: documentos y nómina siguen con URL de 5 min.
  const url = await urlFirmada(f.fotoPath, undefined, 86_400);
  if (url) return NextResponse.redirect(url, { headers: { "Cache-Control": "private, max-age=82800" } });
  const datos = await leerArchivoLocal(f.fotoPath);
  return new NextResponse(new Uint8Array(datos), { headers: { "Content-Type": mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=300" } });
}
