import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_CONTENIDO,
  COOKIE_SESION,
  sesionContenidoValida,
  sesionValida,
} from "@/lib/auth";

// Protege el portal con login. Dos roles:
//  - CEO (CEO_PORTAL_PASSWORD): acceso total.
//  - Contenido (CONTENIDO_PORTAL_PASSWORD): SOLO /pedir + /api/pedir-chat
//    (equipo de contenido: Valentina, Juan Diego, creadores).
// Sin CEO_PORTAL_PASSWORD (dev local), el portal está abierto.

function esRutaContenido(pathname: string): boolean {
  return (
    pathname === "/pedir" ||
    pathname.startsWith("/pedir/") ||
    pathname.startsWith("/api/pedir-chat")
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  // Webhook público de Slack (lo llama Slack, sin cookie): se autentica por firma
  // dentro del propio endpoint (SLACK_SIGNING_SECRET).
  if (pathname === "/api/slack-eventos") return NextResponse.next();

  // Quiz funnels de ClickFunnels (demos/auditorias): los llama el navegador del
  // prospecto, sin cookie. Escribe en Pipedrive; valida el payload adentro.
  if (pathname === "/api/auditoria") return NextResponse.next();
  // Voz de las demos de AutoFlow (Fábrica de Demos): las páginas en Netlify piden acá
  // el token efímero de Retell. Sin sesión, con CORS abierto; valida el agente adentro.
  if (pathname === "/api/demo-webcall") return NextResponse.next();
  // Webhook de Telegram (canal directo de Elvin con Sofi). Valida el secreto adentro.
  if (pathname === "/api/telegram") return NextResponse.next();
  // Snapshots de data/ para sincronizar Mac ↔ Railway (valida CRON_SECRET adentro).
  if (pathname === "/api/snapshot") return NextResponse.next();

  // Webhook de Calendly (citas de los closers → Pipedrive): lo llama Calendly,
  // sin cookie; se autentica por firma adentro (CALENDLY_WEBHOOK_SIGNING_KEY).
  if (pathname === "/api/calendly") return NextResponse.next();

  // Jobs de Vercel Cron (los llama Vercel, sin cookie): se autentican por CRON_SECRET
  // dentro del propio endpoint.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();

  const ceoCookie = request.cookies.get(COOKIE_SESION)?.value;
  if (await sesionValida(ceoCookie)) return NextResponse.next(); // CEO: todo

  // Equipo de contenido: solo su chat.
  const contCookie = request.cookies.get(COOKIE_CONTENIDO)?.value;
  if (await sesionContenidoValida(contCookie)) {
    if (esRutaContenido(pathname)) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/pedir", request.url));
  }

  // Sin sesión válida.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("desde", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Todo salvo assets estáticos e imágenes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
