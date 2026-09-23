/**
 * GoHighLevel: contactos, etiquetas y oportunidades. Sin token → no hace nada y lo dice.
 * API v2: https://highlevel.stoplight.io/docs/integrations
 */
import { config } from "../config.js";

const BASE = "https://services.leadconnectorhq.com";
const headers = () => ({ Authorization: `Bearer ${config.ghl.token}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json" });

export async function upsertContacto(datos: { nombre?: string; telefono?: string; email?: string; municipio?: string; tags?: string[]; fuente?: string }): Promise<string | undefined> {
  if (!config.tiene.ghl()) return undefined;
  const [firstName, ...resto] = (datos.nombre ?? "").split(" ");
  const r = await fetch(`${BASE}/contacts/upsert`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({ locationId: config.ghl.locationId, firstName: firstName || undefined, lastName: resto.join(" ") || undefined, phone: datos.telefono, email: datos.email, city: datos.municipio, tags: datos.tags, source: datos.fuente ?? "agente" }),
  });
  if (!r.ok) { console.error("GHL upsert", r.status, await r.text()); return undefined; }
  const j = (await r.json()) as { contact?: { id?: string } };
  return j.contact?.id;
}

export async function crearOportunidad(datos: { contactId: string; nombre: string; valor: number; trabajoId: string; pipelineId?: string; stageId?: string }): Promise<string | undefined> {
  const pipelineId = datos.pipelineId ?? config.ghl.pipelineId;
  if (!config.tiene.ghl() || !pipelineId) return undefined;
  const r = await fetch(`${BASE}/opportunities/`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({ locationId: config.ghl.locationId, pipelineId, pipelineStageId: datos.stageId ?? (config.ghl.stageAgendado || undefined), contactId: datos.contactId, name: `${datos.trabajoId} · ${datos.nombre}`, monetaryValue: datos.valor, status: "open" }),
  });
  if (!r.ok) { console.error("GHL oportunidad", r.status, await r.text()); return undefined; }
  const j = (await r.json()) as { opportunity?: { id?: string } };
  return j.opportunity?.id;
}

export async function actualizarOportunidad(id: string, datos: { stageId?: string; monetaryValue?: number; status?: "open" | "won" | "lost" | "abandoned" }) {
  if (!config.tiene.ghl()) return;
  const body: Record<string, unknown> = {};
  if (datos.stageId) body.pipelineStageId = datos.stageId;
  if (datos.monetaryValue !== undefined) body.monetaryValue = datos.monetaryValue;
  if (datos.status) body.status = datos.status;
  const r = await fetch(`${BASE}/opportunities/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) });
  if (!r.ok) console.error("GHL actualizar oportunidad", r.status, await r.text());
}

export async function agregarNota(contactId: string, texto: string) {
  if (!config.tiene.ghl()) return;
  await fetch(`${BASE}/contacts/${contactId}/notes`, { method: "POST", headers: headers(), body: JSON.stringify({ body: texto }) }).catch(() => undefined);
}

// ── Calendario de entrevistas (23/sep/2026) ──
// La API de calendarios usa otra versión de cabecera que la de contactos.
const hCal = () => ({ ...headers(), Version: "2021-04-15" });

/** Huecos libres reales del calendario (ISO con zona de PR), entre dos fechas. [] sin token. */
export async function huecosLibres(calendarId: string, desde: Date, hasta: Date): Promise<string[]> {
  if (!config.tiene.ghl() || !calendarId) return [];
  const q = new URLSearchParams({ startDate: String(desde.getTime()), endDate: String(hasta.getTime()), timezone: config.zonaHoraria });
  const r = await fetch(`${BASE}/calendars/${calendarId}/free-slots?${q}`, { headers: hCal() });
  if (!r.ok) { console.error("GHL free-slots", r.status, (await r.text()).slice(0, 200)); return []; }
  const j = (await r.json()) as Record<string, { slots?: string[] } | unknown>;
  return Object.entries(j).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === "object").flatMap(([, v]) => (v as { slots?: string[] }).slots ?? []).sort();
}

/** Crea (o mueve, si ya hay `citaId`) la cita en GHL. GHL valida que el hueco esté libre. */
export async function guardarCita(datos: { calendarId: string; contactId: string; inicio: string; minutos: number; titulo: string; asignadoA?: string; citaId?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!config.tiene.ghl()) return { ok: false, error: "GHL sin configurar" };
  const inicio = new Date(datos.inicio);
  if (isNaN(inicio.getTime())) return { ok: false, error: "fecha inválida" };
  const cuerpo = { calendarId: datos.calendarId, locationId: config.ghl.locationId, contactId: datos.contactId, startTime: inicio.toISOString(), endTime: new Date(inicio.getTime() + datos.minutos * 60_000).toISOString(), title: datos.titulo, appointmentStatus: "confirmed", assignedUserId: datos.asignadoA || undefined, address: "Videollamada", ignoreDateRange: false };
  const url = datos.citaId ? `${BASE}/calendars/events/appointments/${datos.citaId}` : `${BASE}/calendars/events/appointments`;
  const r = await fetch(url, { method: datos.citaId ? "PUT" : "POST", headers: hCal(), body: JSON.stringify(cuerpo) });
  const texto = await r.text();
  if (!r.ok) { console.error("GHL cita", r.status, texto.slice(0, 300)); return { ok: false, error: texto.slice(0, 200) }; }
  let j: { id?: string } = {}; try { j = JSON.parse(texto); } catch { /* */ }
  return { ok: true, id: j.id ?? datos.citaId };
}
