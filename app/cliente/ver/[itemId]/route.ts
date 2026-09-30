import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_VER } from "@/lib/clientes-app/sesion";

// Vista previa del equipo ("Ver como el cliente" en la ficha de Pulse): deja el item en una cookie corta y abre la app.
// visorActual() vuelve a comprobar en cada página que quien mira tenga sesión de Pulse y pueda ver LEVEL UP MEDIA.
export async function GET(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const res = NextResponse.redirect(new URL("/cliente", req.url));
  if (/^[0-9a-f-]{36}$/.test(itemId)) res.cookies.set(COOKIE_VER, itemId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/cliente", maxAge: 60 * 60 * 4 });
  return res;
}
