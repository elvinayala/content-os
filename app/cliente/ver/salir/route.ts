import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_VER } from "@/lib/clientes-app/sesion";

// Cierra la vista previa del equipo.
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/cliente", req.url));
  res.cookies.set(COOKIE_VER, "", { path: "/cliente", maxAge: 0 });
  return res;
}
