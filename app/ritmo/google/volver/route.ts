import { NextResponse, type NextRequest } from "next/server";

import { baseRitmo } from "@/lib/desempeno/google-base";
import { conectar, userDeState } from "@/lib/desempeno/google-cal";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

// Regreso de Google: guarda el calendario SOLO si quien vuelve es quien empezó la conexión (state firmado + sesión).
export async function GET(req: NextRequest) {
  const base = await baseRitmo();
  const q = req.nextUrl.searchParams;
  const u = await usuarioRitmo();
  const userId = userDeState(q.get("state"));
  if (!u || !userId || userId !== u.id) return NextResponse.redirect(`${base}/ritmo?google=error`);
  if (q.get("error") || !q.get("code")) return NextResponse.redirect(`${base}/ritmo?google=cancelado`);
  try {
    await conectar(u.id, q.get("code")!, base);
    return NextResponse.redirect(`${base}/ritmo?google=ok`);
  } catch (e) {
    console.error("[google] conectar", e);
    return NextResponse.redirect(`${base}/ritmo?google=error`);
  }
}
