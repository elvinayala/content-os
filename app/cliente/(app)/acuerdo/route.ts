import { NextResponse } from "next/server";

import { fichaCliente } from "@/lib/clientes-app/datos";
import { visorActual } from "@/lib/clientes-app/sesion";
import { leerArchivo } from "@/lib/pulse/repo";
import { leerArchivoLocal, storageLocal, urlArchivo } from "@/lib/pulse/storage";

// El acuerdo firmado del cliente (lo único de Pulse que puede bajar): solo el suyo.
export async function GET() {
  const v = await visorActual();
  if (!v) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const ficha = await fichaCliente(v.itemId);
  const f = ficha?.acuerdo ? await leerArchivo(ficha.acuerdo.id) : null;
  if (!f) return NextResponse.json({ error: "no-existe" }, { status: 404 });
  if (!storageLocal) return NextResponse.redirect(await urlArchivo(f.storagePath, f.id));
  const datos = await leerArchivoLocal(f.storagePath);
  return new NextResponse(new Uint8Array(datos), { headers: { "Content-Type": f.mime ?? "application/pdf", "Content-Disposition": `inline; filename="${encodeURIComponent(f.nombre)}"` } });
}
