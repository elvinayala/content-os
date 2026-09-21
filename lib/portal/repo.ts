import "server-only";

import { and, asc, avg, count, desc, eq, inArray, ne, sql, sum } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { normalizarCanal, normalizarEtapa } from "./mapear-llamada";
import type { PatchLlamada } from "./mapear-llamada";
import { autoflowChats, autoflowLeads, autoflowLlamadas, autoflowPortales, autoflowSolicitudes } from "./schema";
import type {
  CanalLead,
  EstadoSolicitud,
  EtapaLeadCliente,
  LeadCliente,
  LlamadaPortal,
  MetricasPortal,
  ModoPortal,
  PayloadPortal,
  PortalAutoFlow,
  SolicitudCambio,
} from "./types";

// Data access del Portal AutoFlow. Queries fijas y cortas (patrón de lib/pulse/repo.ts).

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

function aPortal(p: typeof autoflowPortales.$inferSelect): PortalAutoFlow {
  return {
    id: p.id,
    slug: p.slug,
    negocio: p.negocio,
    nicho: p.nicho,
    contacto: p.contacto,
    color: p.color,
    asistente: p.asistente,
    modo: (p.modo as ModoPortal) ?? "demo",
    activo: p.activo,
    agentIdVoz: p.agentIdVoz,
    urls: p.urls ?? {},
    pipedriveDealId: p.pipedriveDealId,
    creadoEl: p.createdAt.toISOString(),
    actualizadoEl: p.updatedAt.toISOString(),
  };
}
function aLead(l: typeof autoflowLeads.$inferSelect): LeadCliente {
  return {
    id: l.id,
    portalId: l.portalId,
    nombre: l.nombre,
    telefono: l.telefono,
    email: l.email,
    interes: l.interes,
    canal: l.canal as CanalLead,
    etapa: l.etapa as EtapaLeadCliente,
    esEjemplo: l.esEjemplo,
    origenRef: l.origenRef,
    nota: l.nota,
    hora: l.hora,
    creadoEl: l.createdAt.toISOString(),
    actualizadoEl: l.updatedAt.toISOString(),
  };
}
function aLlamada(c: typeof autoflowLlamadas.$inferSelect): LlamadaPortal {
  return {
    id: c.id,
    portalId: c.portalId,
    callId: c.callId,
    agentId: c.agentId,
    estado: c.estado as LlamadaPortal["estado"],
    inicio: iso(c.inicio),
    fin: iso(c.fin),
    duracionSeg: c.duracionSeg,
    turnos: c.turnos ?? [],
    resumen: c.resumen,
    resultado: c.resultado,
    exitosa: c.exitosa,
    sentimiento: c.sentimiento,
    grabacionUrl: c.grabacionUrl,
    datosExtraidos: c.datosExtraidos ?? null,
    latenciaP50Ms: c.latenciaP50Ms,
    latenciaP95Ms: c.latenciaP95Ms,
    creadoEl: c.createdAt.toISOString(),
    actualizadoEl: c.updatedAt.toISOString(),
  };
}
function aSolicitud(s: typeof autoflowSolicitudes.$inferSelect): SolicitudCambio {
  return {
    id: s.id,
    portalId: s.portalId,
    texto: s.texto,
    autor: s.autor,
    estado: s.estado as EstadoSolicitud,
    respuesta: s.respuesta,
    creadoEl: s.createdAt.toISOString(),
    actualizadoEl: s.updatedAt.toISOString(),
  };
}

// ---------- Portales ----------

export async function leerPortalPorSlug(slug: string): Promise<PortalAutoFlow | null> {
  const d = await db();
  const [p] = await d.select().from(autoflowPortales).where(eq(autoflowPortales.slug, slug)).limit(1);
  return p ? aPortal(p) : null;
}

export async function leerPortalPorAgente(agentId: string): Promise<PortalAutoFlow | null> {
  const d = await db();
  const [p] = await d.select().from(autoflowPortales).where(eq(autoflowPortales.agentIdVoz, agentId)).limit(1);
  return p ? aPortal(p) : null;
}

export async function listarPortales(): Promise<PortalAutoFlow[]> {
  const d = await db();
  const rows = await d.select().from(autoflowPortales).orderBy(desc(autoflowPortales.updatedAt));
  return rows.map(aPortal);
}

// Crea o actualiza el portal por slug y siembra los leads de ejemplo (una sola vez).
export async function upsertPortal(p: PayloadPortal): Promise<PortalAutoFlow> {
  const d = await db();
  const valores = {
    slug: p.slug,
    negocio: p.negocio,
    nicho: p.nicho ?? null,
    contacto: p.contacto ?? null,
    color: p.color ?? "#10b981",
    asistente: p.asistente ?? "Asistente",
    ...(p.modo ? { modo: p.modo } : {}),
    ...(p.agentIdVoz !== undefined ? { agentIdVoz: p.agentIdVoz } : {}),
    ...(p.urls ? { urls: p.urls } : {}),
    ...(p.pipedriveDealId !== undefined ? { pipedriveDealId: p.pipedriveDealId } : {}),
    updatedAt: new Date(),
  };
  const [row] = await d
    .insert(autoflowPortales)
    .values(valores)
    .onConflictDoUpdate({ target: autoflowPortales.slug, set: valores })
    .returning();
  const portal = aPortal(row);
  if (p.leadsEjemplo?.length && !row.leadsEjemploCargados) {
    await sembrarLeadsEjemplo(portal.id, p.leadsEjemplo);
  }
  return portal;
}

export async function actualizarPortal(slug: string, patch: Partial<Pick<PortalAutoFlow, "modo" | "activo" | "agentIdVoz" | "urls" | "pipedriveDealId">>): Promise<void> {
  const d = await db();
  await d.update(autoflowPortales).set({ ...patch, updatedAt: new Date() }).where(eq(autoflowPortales.slug, slug));
}

// ---------- Leads ----------

export async function sembrarLeadsEjemplo(portalId: string, leads: NonNullable<PayloadPortal["leadsEjemplo"]>): Promise<void> {
  const d = await db();
  const filas = leads.slice(0, 12).map((l, i) => ({
    portalId,
    nombre: l.nombre,
    interes: l.interes ?? null,
    canal: normalizarCanal(l.canal),
    etapa: normalizarEtapa(l.etapa),
    esEjemplo: true,
    origenRef: `ejemplo:${i}`,
    hora: l.hora ?? null,
  }));
  if (filas.length) await d.insert(autoflowLeads).values(filas).onConflictDoNothing();
  await d.update(autoflowPortales).set({ leadsEjemploCargados: true }).where(eq(autoflowPortales.id, portalId));
}

export async function listarLeads(portalId: string, opts: { incluirEjemplos: boolean }): Promise<LeadCliente[]> {
  const d = await db();
  const where = opts.incluirEjemplos
    ? eq(autoflowLeads.portalId, portalId)
    : and(eq(autoflowLeads.portalId, portalId), eq(autoflowLeads.esEjemplo, false));
  const rows = await d.select().from(autoflowLeads).where(where).orderBy(desc(autoflowLeads.createdAt));
  return rows.map(aLead);
}

export async function moverLead(portalId: string, leadId: string, etapa: EtapaLeadCliente): Promise<void> {
  const d = await db();
  await d
    .update(autoflowLeads)
    .set({ etapa, updatedAt: new Date() })
    .where(and(eq(autoflowLeads.id, leadId), eq(autoflowLeads.portalId, portalId)));
}

// Idempotente por (portal, origen_ref): la misma llamada o la misma sesión de chat no duplica.
export async function upsertLeadDesdeOrigen(
  portalId: string,
  origenRef: string,
  datos: { nombre: string; telefono?: string | null; email?: string | null; interes?: string | null; canal: CanalLead; etapa?: EtapaLeadCliente; nota?: string | null },
): Promise<void> {
  const d = await db();
  const valores = {
    portalId,
    origenRef,
    nombre: datos.nombre,
    telefono: datos.telefono ?? null,
    email: datos.email ?? null,
    interes: datos.interes ?? null,
    canal: datos.canal,
    etapa: datos.etapa ?? "nuevo",
    nota: datos.nota ?? null,
    esEjemplo: false,
    updatedAt: new Date(),
  };
  await d
    .insert(autoflowLeads)
    .values(valores)
    .onConflictDoUpdate({
      target: [autoflowLeads.portalId, autoflowLeads.origenRef],
      set: { nombre: valores.nombre, telefono: valores.telefono, email: valores.email, interes: valores.interes, updatedAt: valores.updatedAt },
    });
}

// ---------- Llamadas ----------

export async function registrarLlamadaIniciada(portalId: string, callId: string, agentId: string): Promise<void> {
  const d = await db();
  await d
    .insert(autoflowLlamadas)
    .values({ portalId, callId, agentId, estado: "iniciada", inicio: new Date() })
    .onConflictDoNothing();
}

export async function upsertLlamada(portalId: string, patch: PatchLlamada): Promise<void> {
  const d = await db();
  const valores = {
    portalId,
    callId: patch.callId,
    agentId: patch.agentId,
    estado: patch.estado,
    inicio: patch.inicio ? new Date(patch.inicio) : null,
    fin: patch.fin ? new Date(patch.fin) : null,
    duracionSeg: patch.duracionSeg,
    turnos: patch.turnos,
    resumen: patch.resumen,
    resultado: patch.resultado,
    exitosa: patch.exitosa,
    sentimiento: patch.sentimiento,
    grabacionUrl: patch.grabacionUrl,
    datosExtraidos: patch.datosExtraidos,
    latenciaP50Ms: patch.latenciaP50Ms,
    latenciaP95Ms: patch.latenciaP95Ms,
    updatedAt: new Date(),
  };
  const { portalId: _p, callId: _c, ...set } = valores;
  void _p; void _c;
  // Si Retell todavía no manda inicio, conservamos el que registró demo-webcall.
  const setSinNulos = Object.fromEntries(Object.entries(set).filter(([k, v]) => !(k === "inicio" && v === null)));
  await d.insert(autoflowLlamadas).values(valores).onConflictDoUpdate({ target: autoflowLlamadas.callId, set: setSinNulos });
}

export async function listarLlamadas(portalId: string, limite = 50): Promise<LlamadaPortal[]> {
  const d = await db();
  const rows = await d
    .select()
    .from(autoflowLlamadas)
    .where(eq(autoflowLlamadas.portalId, portalId))
    .orderBy(desc(autoflowLlamadas.inicio), desc(autoflowLlamadas.createdAt))
    .limit(limite);
  return rows.map(aLlamada);
}

export async function listarLlamadasPorAgente(agentId: string, limite = 30): Promise<LlamadaPortal[]> {
  const d = await db();
  const rows = await d
    .select()
    .from(autoflowLlamadas)
    .where(eq(autoflowLlamadas.agentId, agentId))
    .orderBy(desc(autoflowLlamadas.inicio))
    .limit(limite);
  return rows.map(aLlamada);
}

// Llamadas de las últimas `horas` que todavía no están analizadas (para el cron de re-sync).
export async function llamadasPendientesDeSync(horas = 24): Promise<{ callId: string; portalId: string }[]> {
  const d = await db();
  const desde = new Date(Date.now() - horas * 3600_000);
  const rows = await d
    .select({ callId: autoflowLlamadas.callId, portalId: autoflowLlamadas.portalId })
    .from(autoflowLlamadas)
    .where(and(ne(autoflowLlamadas.estado, "analizada"), ne(autoflowLlamadas.estado, "error"), sql`${autoflowLlamadas.createdAt} > ${desde}`))
    .orderBy(asc(autoflowLlamadas.createdAt))
    .limit(50);
  return rows;
}

export async function llamadaPorCallId(callId: string): Promise<{ portalId: string } | null> {
  const d = await db();
  const [r] = await d.select({ portalId: autoflowLlamadas.portalId }).from(autoflowLlamadas).where(eq(autoflowLlamadas.callId, callId)).limit(1);
  return r ?? null;
}

// ---------- Solicitudes de cambio ----------

export async function crearSolicitud(portalId: string, texto: string, autor: string | null): Promise<SolicitudCambio> {
  const d = await db();
  const [row] = await d.insert(autoflowSolicitudes).values({ portalId, texto, autor }).returning();
  return aSolicitud(row);
}

export async function listarSolicitudes(portalId: string): Promise<SolicitudCambio[]> {
  const d = await db();
  const rows = await d.select().from(autoflowSolicitudes).where(eq(autoflowSolicitudes.portalId, portalId)).orderBy(desc(autoflowSolicitudes.createdAt));
  return rows.map(aSolicitud);
}

export async function cambiarEstadoSolicitud(portalId: string, id: string, estado: EstadoSolicitud, respuesta?: string | null): Promise<void> {
  const d = await db();
  await d
    .update(autoflowSolicitudes)
    .set({ estado, ...(respuesta !== undefined ? { respuesta } : {}), updatedAt: new Date() })
    .where(and(eq(autoflowSolicitudes.id, id), eq(autoflowSolicitudes.portalId, portalId)));
}

// ---------- Chats (mensajes del chat de demo) ----------

export async function registrarMensajeChat(portalId: string, sesionId: string, mensajes: number, lead: boolean): Promise<void> {
  const d = await db();
  await d
    .insert(autoflowChats)
    .values({ portalId, sesionId, mensajes, lead, ultimoMensajeAt: new Date() })
    .onConflictDoUpdate({
      target: [autoflowChats.portalId, autoflowChats.sesionId],
      set: { mensajes: sql`GREATEST(${autoflowChats.mensajes}, ${mensajes})`, lead: sql`${autoflowChats.lead} OR ${lead}`, ultimoMensajeAt: new Date() },
    });
}

// ---------- Métricas (solo lo real; null = sin dato) ----------

export async function calcularMetricas(portalId: string): Promise<MetricasPortal> {
  const d = await db();
  const [ll] = await d
    .select({ n: count(), p50: avg(autoflowLlamadas.latenciaP50Ms) })
    .from(autoflowLlamadas)
    .where(and(eq(autoflowLlamadas.portalId, portalId), inArray(autoflowLlamadas.estado, ["terminada", "analizada"])));
  const [ch] = await d.select({ n: sum(autoflowChats.mensajes) }).from(autoflowChats).where(eq(autoflowChats.portalId, portalId));
  const [ld] = await d
    .select({ n: count() })
    .from(autoflowLeads)
    .where(and(eq(autoflowLeads.portalId, portalId), eq(autoflowLeads.esEjemplo, false)));
  const llamadas = Number(ll?.n ?? 0);
  const mensajes = ch?.n == null ? 0 : Number(ch.n);
  const leads = Number(ld?.n ?? 0);
  const p50 = ll?.p50 == null ? null : Math.round(Number(ll.p50));
  return {
    llamadasAtendidas: llamadas > 0 ? llamadas : null,
    mensajesChat: mensajes > 0 ? mensajes : null,
    leadsCapturados: leads > 0 ? leads : null,
    tiempoRespuestaMs: p50 && p50 > 0 ? p50 : null,
  };
}

// Conteos rápidos para la tabla del closer.
export async function resumenPortales(): Promise<Record<string, { llamadas: number; leadsReales: number; solicitudes: number }>> {
  const d = await db();
  const [llam, leads, sols] = await Promise.all([
    d.select({ portalId: autoflowLlamadas.portalId, n: count() }).from(autoflowLlamadas).groupBy(autoflowLlamadas.portalId),
    d.select({ portalId: autoflowLeads.portalId, n: count() }).from(autoflowLeads).where(eq(autoflowLeads.esEjemplo, false)).groupBy(autoflowLeads.portalId),
    d.select({ portalId: autoflowSolicitudes.portalId, n: count() }).from(autoflowSolicitudes).where(ne(autoflowSolicitudes.estado, "lista")).groupBy(autoflowSolicitudes.portalId),
  ]);
  const out: Record<string, { llamadas: number; leadsReales: number; solicitudes: number }> = {};
  const get = (id: string) => (out[id] ??= { llamadas: 0, leadsReales: 0, solicitudes: 0 });
  for (const r of llam) get(r.portalId).llamadas = Number(r.n);
  for (const r of leads) get(r.portalId).leadsReales = Number(r.n);
  for (const r of sols) get(r.portalId).solicitudes = Number(r.n);
  return out;
}
