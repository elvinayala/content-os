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
