// Diagnóstico TEMPORAL de Nico (21/oct) para la solicitud #360 de Lis: ubicar leads que no
// llegaron al embudo SEGUIMIENTO. Se borra cuando se cierre el caso.
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { seguimientoDesdeFathom } from "@/lib/leads/seguimiento";
import { leadsEmbudos, leadsEtapas, leadsTratos, leadsWebhookLog } from "@/lib/leads/schema";
import { db } from "@/lib/pulse/db";

const SECRETO = "nico-diag-360-21oct-xk92q";

export async function POST(req: NextRequest) {
  if (req.nextUrl.searchParams.get("s") !== SECRETO) return NextResponse.json({ error: "no" }, { status: 401 });
  const recordingId = req.nextUrl.searchParams.get("recording_id");
  if (!recordingId) return NextResponse.json({ error: "pasa ?recording_id=" }, { status: 400 });
  const key = process.env.FATHOM_API_KEY;
  if (!key) return NextResponse.json({ error: "falta FATHOM_API_KEY en el entorno" }, { status: 500 });

  // Busca el item en /meetings (misma fuente que fathom.mjs reenviar) por recording_id.
  let cursor = "";
  let item: Record<string, unknown> | null = null;
  const desde = new Date(Date.now() - 5 * 86400000).toISOString();
  do {
    const q = new URLSearchParams({ include_summary: "true", include_action_items: "true", created_after: desde });
    if (cursor) q.set("cursor", cursor);
    const res = await fetch(`https://api.fathom.ai/external/v1/meetings?${q}`, { headers: { "X-Api-Key": key } });
    const j = (await res.json().catch(() => ({}))) as { items?: Record<string, unknown>[]; next_cursor?: string };
    item = (j.items || []).find((m) => String(m.recording_id) === recordingId) || item;
    cursor = item ? "" : j.next_cursor || "";
  } while (cursor);
  if (!item) return NextResponse.json({ error: "no encontré ese recording_id en los últimos 5 días" }, { status: 404 });

  const resultado = await seguimientoDesdeFathom(item as never).catch((e) => `error: ${e instanceof Error ? e.message : String(e)}`);
  return NextResponse.json({ recording_id: recordingId, resultado });
}

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("s") !== SECRETO) return NextResponse.json({ error: "no" }, { status: 401 });
  const d = await db();

  if (req.nextUrl.searchParams.get("errores") === "1") {
    const log = await d
      .select({ id: leadsWebhookLog.id, marca: leadsWebhookLog.marca, resultado: leadsWebhookLog.resultado, cuerpo: leadsWebhookLog.cuerpo, createdAt: leadsWebhookLog.createdAt })
      .from(leadsWebhookLog)
      .where(ilike(leadsWebhookLog.resultado, "error%"))
      .orderBy(desc(leadsWebhookLog.createdAt))
      .limit(50);
    return NextResponse.json({ errores: log });
  }

  if (req.nextUrl.searchParams.get("huecos") === "1") {
    // Llamadas que SÍ llegaron al webhook de Fathom (closers) pero cuyo recording_id nunca generó
    // una fila en leads_webhook_log (fuente=fathom, evento=seguimiento): el after() nunca completó.
    const r = await d.execute(sql`
      select fl.recording_id, fl.titulo, fl.creado_el
      from fathom_llamadas fl
      where fl.estado = 'enviado'
        and not exists (
          select 1 from leads_webhook_log w
          where w.fuente = 'fathom' and w.evento = 'seguimiento'
            and (w.cuerpo->>'recording_id')::bigint = fl.recording_id
        )
      order by fl.creado_el desc
      limit 100`);
    const filas = Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? []);
    return NextResponse.json({ huecos: filas });
  }

  if (req.nextUrl.searchParams.get("fathom") === "1") {
    const log = await d
      .select({ id: leadsWebhookLog.id, fuente: leadsWebhookLog.fuente, evento: leadsWebhookLog.evento, marca: leadsWebhookLog.marca, resultado: leadsWebhookLog.resultado, cuerpo: leadsWebhookLog.cuerpo, createdAt: leadsWebhookLog.createdAt })
      .from(leadsWebhookLog)
      .where(eq(leadsWebhookLog.fuente, "fathom"))
      .orderBy(desc(leadsWebhookLog.createdAt))
      .limit(250);
    return NextResponse.json({ fathom: log });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 3) return NextResponse.json({ error: "pasa ?q=nombre o telefono, o ?errores=1" }, { status: 400 });
  const dig = q.replace(/\D/g, "");
  const like = `%${q}%`;

  const tratos = await d
    .select({
      id: leadsTratos.id,
      marca: leadsTratos.marca,
      nombre: leadsTratos.nombre,
      telefono: leadsTratos.telefono,
      email: leadsTratos.email,
      estado: leadsTratos.estado,
      embudo: leadsEmbudos.nombre,
      etapa: leadsEtapas.nombre,
      datos: leadsTratos.datos,
      createdAt: leadsTratos.createdAt,
      updatedAt: leadsTratos.updatedAt,
    })
    .from(leadsTratos)
    .innerJoin(leadsEmbudos, eq(leadsEmbudos.id, leadsTratos.embudoId))
    .leftJoin(leadsEtapas, eq(leadsEtapas.id, leadsTratos.etapaId))
    .where(or(ilike(leadsTratos.nombre, like), ...(dig.length >= 4 ? [ilike(leadsTratos.telefono, `%${dig}%`)] : []))!)
    .orderBy(desc(leadsTratos.updatedAt))
    .limit(10);

  const log = await d
    .select({ id: leadsWebhookLog.id, marca: leadsWebhookLog.marca, resultado: leadsWebhookLog.resultado, cuerpo: leadsWebhookLog.cuerpo, createdAt: leadsWebhookLog.createdAt })
    .from(leadsWebhookLog)
    .orderBy(desc(leadsWebhookLog.createdAt))
    .limit(400);
  const relacionados = log.filter((f) => JSON.stringify(f).toLowerCase().includes(q.toLowerCase()) || (dig.length >= 4 && JSON.stringify(f).includes(dig)));

  return NextResponse.json({ tratos, webhookLogRelacionados: relacionados });
}
