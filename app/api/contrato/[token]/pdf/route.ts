import { NextResponse, type NextRequest } from "next/server";

import { archivoPdf } from "@/lib/aib-contratos/firmar";
import { contratoPorToken } from "@/lib/aib-contratos/repo";

// Copia en PDF del contrato firmado (la baja el cliente con su link y el equipo desde Pulse).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await contratoPorToken(token);
  const a = c ? await archivoPdf(c) : null;
  if (!c || !a) return NextResponse.json({ error: "No hay contrato firmado con este enlace." }, { status: 404 });
  if ("url" in a) return NextResponse.redirect(a.url);
  return new NextResponse(new Uint8Array(a.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${c.codigo}.pdf"`, "Cache-Control": "private, no-store" } });
}
