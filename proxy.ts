import { NextResponse, type NextRequest } from "next/server";

import {
  COOKIE_CONTENIDO,
  COOKIE_SESION,
  sesionContenidoValida,
  sesionValida,
} from "@/lib/auth";
import { COOKIE_PORTAL, SLUG_RE, TTL_PORTAL, firmarAccesoPortal, tokenPortalValido, verificarAccesoPortal } from "@/lib/portal/acceso";
import { COOKIE_PULSE, verificarSesion } from "@/lib/pulse/session";

// Protege el portal con login. Dos roles:
//  - CEO (CEO_PORTAL_PASSWORD): acceso total.
//  - Contenido (CONTENIDO_PORTAL_PASSWORD): SOLO /pedir + /api/pedir-chat
//    (equipo de contenido: Valentina, Juan Diego, creadores).
//  - Portal AutoFlow (/portal/<slug>): el prospecto/cliente de AI Borinquen entra con el
//    token ?k= de su link (HMAC por slug, lib/portal/acceso.ts) y queda con cookie propia.
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
  // Dominio bonito de Pulse (pulse-eamarket.vercel.app): la raíz va directo al CRM.
  const host = request.headers.get("host") ?? "";
  // Dominios de marca del onboarding de Level Up (levelupmedia.vercel.app, bienvenida-levelup…):
  // ahí SOLO existe el formulario. La raíz lo muestra con la URL limpia y cualquier otra ruta
  // (links con basura pegada, /ceo, /pulse…) vuelve a la raíz: nunca un login ni nada interno.
  if (host === "levelupmedia.vercel.app" || host.startsWith("bienvenida-levelup")) {
    if (pathname === "/") return NextResponse.rewrite(new URL("/onboarding/level-up", request.url));
    if (pathname.startsWith("/api/onboarding/") || pathname.startsWith("/_next/") || pathname.startsWith("/marcas/") || pathname.startsWith("/onboarding/level-up/opengraph-image")) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  // Dominios de Ritmo (ritmo.levelupmediapr.net y ritmo-*.vercel.app): la raíz va directo a Ritmo, y
  // cualquier ruta que no sea de Ritmo (o sus archivos/acciones) también, para que nunca caiga en otra app.
  if (host.startsWith("ritmo.") && pathname !== "/" && !pathname.startsWith("/ritmo") && !pathname.startsWith("/_next/") && !pathname.startsWith("/api/") && !pathname.startsWith("/pulse/login")) {
    return NextResponse.redirect(new URL("/ritmo", request.url));
  }
  if ((host.startsWith("ritmo-") || host.startsWith("ritmo.")) && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/ritmo", request.url));
  }
  if (host.startsWith("pulse-") && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/pulse", request.url));
  }
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
  // Sitios estáticos de la Fábrica de MVPs servidos desde public/demos/ (respaldo cuando Netlify
  // no está disponible): propuesta, chat, voz, landing y "por dentro" del prospecto. Públicos.
  if (pathname.startsWith("/demos/")) return NextResponse.next();
  // Portal AutoFlow: webhook de Retell (valida RETELL_WEBHOOK_SECRET adentro), leads del chat
  // de demo (público con rate limit) y registro de portales desde la fábrica (CRON_SECRET).
  if (pathname === "/api/retell-webhook") return NextResponse.next();
  if (pathname === "/api/demo-lead") return NextResponse.next();
  if (pathname === "/api/autoflow/portales") return NextResponse.next();
  // Webhook de Telegram (canal directo de Elvin con Sofi). Valida el secreto adentro.
  if (pathname === "/api/telegram") return NextResponse.next();
  // Snapshots de data/ para sincronizar Mac ↔ Railway (valida CRON_SECRET adentro).
  if (pathname === "/api/snapshot") return NextResponse.next();
  // Buzón entre agentes (Sofi ↔ Nico ↔ Max ↔ Lola), lo consultan los puentes en Railway
  // (valida CRON_SECRET adentro).
  if (pathname === "/api/agentes") return NextResponse.next();
  // Max en Slack (24/sep): las manos de Max desde Railway (auth propia con CRON_SECRET).
  if (pathname === "/api/max") return NextResponse.next();

  // Webhook de Calendly (citas de los closers → Pipedrive): lo llama Calendly,
  // sin cookie; se autentica por firma adentro (CALENDLY_WEBHOOK_SIGNING_KEY).
  if (pathname === "/api/calendly") return NextResponse.next();
  // WhatsApp de onboarding de AI Borinquen (webhook de Zernio): valida la firma adentro.
  if (pathname === "/api/aib/whatsapp") return NextResponse.next();
  // Calendly de AI Borinquen (agendar onboarding = cliente): valida la firma adentro.
  if (pathname === "/api/aib/calendly") return NextResponse.next();
  // Puente de WhatsApp de Leads (Timelines.ai no firma: secreto en la URL, lo valida la ruta).
  if (pathname === "/api/leads/timelines") return NextResponse.next();
  // Entrada de formularios/Zapier a un embudo de Leads (secreto en la URL, lo valida la ruta).
  if (pathname === "/api/leads/entrada") return NextResponse.next();
  // Fathom → Slack (resúmenes de llamadas, solicitud de Aure #29): valida la firma adentro.
  if (pathname === "/api/fathom") return NextResponse.next();

  // Jobs de Vercel Cron (los llama Vercel, sin cookie): se autentican por CRON_SECRET
  // dentro del propio endpoint.
  if (pathname.startsWith("/api/cron/")) return NextResponse.next();

  // Pulse (CRM, reemplazo de Monday): usuarios propios en Postgres (Jessica, Carly…).
  // Entra con cookie pulse válida o con la cookie CEO. La sesión de contenido NO entra.
  if (pathname === "/pulse/login") return NextResponse.next();
  // Íconos de Pulse (favicon / apple-touch-icon): públicos, el navegador los pide sin cookie.
  if (pathname === "/pulse/icon.svg" || pathname.startsWith("/pulse/apple-icon") || pathname.startsWith("/pulse/opengraph-image")) return NextResponse.next();
  // Formulario público de onboarding de Level Up (lo llena el cliente, sin login).
  if (pathname.startsWith("/onboarding/") || pathname.startsWith("/api/onboarding/")) return NextResponse.next();
  // Webhook del Typeform de onboarding → ficha del cliente en Pulse (valida la firma adentro).
  if (pathname === "/api/pulse/typeform") return NextResponse.next();
  // Export de clientes para n8n (puente Pulse → NocoDB): la ruta valida x-pulse-secret.
  if (pathname.startsWith("/api/pulse/n8n/")) return NextResponse.next();
  // Ritmo (asistencia + desempeño): mismas cuentas y cookie que Pulse, su propia pantalla de entrada.
  if (pathname === "/ritmo/entrar" || pathname === "/ritmo/activar" || pathname === "/ritmo/icon.svg" || pathname.startsWith("/ritmo/apple-icon") || pathname === "/ritmo/manifest.webmanifest") return NextResponse.next();
  if (pathname === "/ritmo" || pathname.startsWith("/ritmo/")) {
    const pulseOk = !!(await verificarSesion(request.cookies.get(COOKIE_PULSE)?.value));
    const ceoOk = await sesionValida(request.cookies.get(COOKIE_SESION)?.value);
    if (pulseOk || ceoOk) return NextResponse.next();
    const entrar = new URL("/ritmo/entrar", request.url);
    if (pathname !== "/ritmo") entrar.searchParams.set("desde", pathname);
    return NextResponse.redirect(entrar);
  }
  if (pathname === "/pulse" || pathname.startsWith("/pulse/") || pathname.startsWith("/api/pulse/")) {
    const pulseOk = !!(await verificarSesion(request.cookies.get(COOKIE_PULSE)?.value));
    const ceoOk = await sesionValida(request.cookies.get(COOKIE_SESION)?.value);
    if (pulseOk || ceoOk) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
    }
    const login = new URL("/pulse/login", request.url);
    login.searchParams.set("desde", pathname);
    return NextResponse.redirect(login);
  }

  // Portal AutoFlow del prospecto/cliente: /portal/<slug>[?k=token].
  if (pathname.startsWith("/portal/")) {
    const slug = pathname.split("/")[2] ?? "";
    if (!SLUG_RE.test(slug)) return NextResponse.redirect(new URL("/login", request.url));
    const k = request.nextUrl.searchParams.get("k");
    if (k && (await tokenPortalValido(slug, k))) {
      const limpia = new URL(request.url);
      limpia.searchParams.delete("k");
      const res = NextResponse.redirect(limpia);
      res.cookies.set(COOKIE_PORTAL, await firmarAccesoPortal(slug), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/portal",
        maxAge: TTL_PORTAL,
      });
      return res;
    }
    if (await sesionValida(request.cookies.get(COOKIE_SESION)?.value)) return NextResponse.next(); // closer / CEO
    const acceso = await verificarAccesoPortal(request.cookies.get(COOKIE_PORTAL)?.value);
    if (acceso?.slug === slug) return NextResponse.next();
    if (pathname.endsWith("/acceso")) return NextResponse.next();
    return NextResponse.redirect(new URL(`/portal/${slug}/acceso`, request.url));
  }

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
