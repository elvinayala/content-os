import { NextResponse, type NextRequest } from "next/server";

import { SLUG_RE, urlPortal } from "@/lib/portal/acceso";
import { listarPortales, upsertPortal } from "@/lib/portal/repo";
import { prepararAgenteParaPortal } from "@/lib/portal/retell";
import type { PayloadPortal } from "@/lib/portal/types";

// Registro de portales desde la fábrica de MVPs (scripts/demo-cliente/demo.mjs portal <slug>).
//   POST { slug, negocio, nicho, contacto, color, asistente, agentIdVoz, urls, leadsEjemplo, modo? }
//   GET  → lista (para scripts)
// Auth: header x-cron-secret = CRON_SECRET (igual que /api/agentes y /api/snapshot).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function autorizado(req: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  const dado = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  return Boolean(secreto) && dado === secreto;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  return NextResponse.json({ portales: await listarPortales() });
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  let body: PayloadPortal;
  try {
    body = (await req.json()) as PayloadPortal;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  if (!body?.slug || !SLUG_RE.test(body.slug) || !body.negocio) {
    return NextResponse.json({ error: "Faltan slug o negocio" }, { status: 400 });
  }
  const portal = await upsertPortal(body);
  let agentePreparado: boolean | null = null;
  if (portal.agentIdVoz && process.env.RETELL_API_KEY) {
    agentePreparado = await prepararAgenteParaPortal(portal.agentIdVoz).catch(() => false);
  }
  return NextResponse.json({ ok: true, portal, url: await urlPortal(portal.slug), agentePreparado });
}
