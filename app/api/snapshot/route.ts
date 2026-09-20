import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

// Vercel como "bus" de snapshots: el puente en Railway y la Mac de Elvin escriben data/*.json
// cada uno por su lado y lo suben con deploy-snapshots; antes de trabajar, cada lado baja de acá
// la versión que esté en producción (scripts/sync-data.mjs pull) y se queda con la más nueva
// por `actualizadoEl`. Solo lectura, solo archivos de data/, solo con CRON_SECRET.
export const dynamic = "force-dynamic";

const PERMITIDOS = /^[a-z0-9-]+(\/[a-z0-9-]+)?\.json$/i;

export async function GET(req: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  const dado = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (!secreto || dado !== secreto) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const archivo = req.nextUrl.searchParams.get("archivo") ?? "";
  if (!PERMITIDOS.test(archivo) || archivo.includes("..")) return NextResponse.json({ error: "archivo-invalido" }, { status: 400 });
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", archivo), "utf-8");
    return new NextResponse(raw, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "no-existe" }, { status: 404 });
  }
}
