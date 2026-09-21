import { NextRequest, NextResponse } from "next/server";

import { SLUG_RE } from "@/lib/portal/acceso";
import { leerPortalPorSlug, registrarMensajeChat, upsertLeadDesdeOrigen } from "@/lib/portal/repo";
import { limiteIp } from "@/lib/pulse/seguridad";

// El chat de demo (estático en Netlify) avisa acá lo que pasa en la conversación, para que el
// Portal AutoFlow muestre mensajes y leads REALES del prospecto probando su asistente.
//   POST { slug, sesion, tipo: "mensaje" | "lead", mensajes?, texto?, telefono?, email?, interes?, nombre? }
// Público con CORS abierto (como /api/demo-webcall); rate limit por IP y por portal.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

const limpio = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (!limiteIp(`demo-lead:${ip}`, 60, 10 * 60_000)) return json({ error: "Demasiadas solicitudes" }, 429);

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Body inválido" }, 400);
  }
  const slug = limpio(b.slug, 40) ?? "";
  const sesion = limpio(b.sesion, 64) ?? "";
  const tipo = b.tipo === "lead" ? "lead" : "mensaje";
  if (!SLUG_RE.test(slug) || !/^[a-z0-9-]{6,64}$/i.test(sesion)) return json({ error: "slug o sesión inválidos" }, 400);
  if (!limiteIp(`demo-lead:portal:${slug}`, 500, 60 * 60_000)) return json({ error: "Tope del portal" }, 429);

  const portal = await leerPortalPorSlug(slug);
  if (!portal || !portal.activo) return json({ error: "Portal no existe" }, 404);

  const mensajes = Math.min(500, Math.max(0, Number(b.mensajes ?? 0) || 0));
  await registrarMensajeChat(portal.id, sesion, mensajes, tipo === "lead");
  if (tipo === "lead") {
    const telefono = limpio(b.telefono, 40);
    const email = limpio(b.email, 120);
    const nombre = limpio(b.nombre, 80) ?? (telefono ? `Chat ${telefono}` : email ? `Chat ${email}` : "Visitante del chat");
    await upsertLeadDesdeOrigen(portal.id, `chat:${sesion}`, {
      nombre,
      telefono,
      email,
      interes: limpio(b.interes, 120),
      canal: "chat",
      etapa: "nuevo",
      nota: limpio(b.texto, 500),
    });
  }
  return json({ ok: true });
}
