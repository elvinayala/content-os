import "server-only";

import { aLlamadaPortal, leadDeLlamada, type RetellCall } from "./mapear-llamada";
import { leerPortalPorAgente, leerPortalPorSlug, llamadaPorCallId, upsertLeadDesdeOrigen, upsertLlamada } from "./repo";

// Lectura de llamadas reales de Retell para el Portal AutoFlow. La key nunca sale del server.
// Nunca confiamos en el payload del webhook: siempre re-leemos la llamada con GET /v2/get-call.

const BASE = "https://api.retellai.com";

function headers() {
  const key = process.env.RETELL_API_KEY;
  if (!key) throw new Error("Falta RETELL_API_KEY");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function obtenerLlamada(callId: string): Promise<RetellCall | null> {
  const r = await fetch(`${BASE}/v2/get-call/${encodeURIComponent(callId)}`, { headers: headers(), signal: AbortSignal.timeout(8000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Retell get-call ${r.status}`);
  return (await r.json()) as RetellCall;
}

export async function listarLlamadasRetell(agentId: string, limite = 50): Promise<RetellCall[]> {
  const r = await fetch(`${BASE}/v2/list-calls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ filter_criteria: { agent_id: [agentId] }, sort_order: "descending", limit: limite }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Retell list-calls ${r.status}`);
  return (await r.json()) as RetellCall[];
}

// Análisis post-llamada que le pedimos al agente para que el portal pueda crear el lead.
export const POST_CALL_ANALYSIS = [
  { type: "string", name: "nombre", description: "Nombre de la persona que llamó, si lo dijo." },
  { type: "string", name: "telefono", description: "Teléfono que dejó la persona, con dígitos, si lo dio." },
  { type: "string", name: "interes", description: "Servicio, producto o tratamiento por el que preguntó." },
  { type: "boolean", name: "quiere_cita", description: "true si pidió o aceptó una cita, visita o llamada de seguimiento." },
  { type: "string", name: "fecha_preferida", description: "Día u horario que prefirió para la cita, si lo dijo." },
];

// Resuelve el portal de una llamada: por metadata.slug, por registro previo (demo-webcall) o por agente.
async function portalDeLlamada(call: RetellCall): Promise<string | null> {
  const slug = typeof call.metadata?.slug === "string" ? call.metadata.slug : null;
  if (slug) {
    const p = await leerPortalPorSlug(slug);
    if (p) return p.id;
  }
  const previa = await llamadaPorCallId(call.call_id);
  if (previa) return previa.portalId;
  if (call.agent_id) {
    const p = await leerPortalPorAgente(call.agent_id);
    if (p) return p.id;
  }
  return null;
}

// Trae la llamada de Retell y la guarda (idempotente por call_id). Devuelve qué pasó.
export async function sincronizarLlamada(callId: string): Promise<"guardada" | "sin-portal" | "no-existe"> {
  const call = await obtenerLlamada(callId);
  if (!call) return "no-existe";
  const portalId = await portalDeLlamada(call);
  if (!portalId) return "sin-portal";
  await upsertLlamada(portalId, aLlamadaPortal(call));
  const lead = leadDeLlamada(call);
  if (lead) {
    await upsertLeadDesdeOrigen(portalId, lead.origenRef, {
      nombre: lead.nombre,
      telefono: lead.telefono,
      interes: lead.interes,
      canal: lead.canal,
      etapa: lead.etapa,
      nota: call.call_analysis?.call_summary ?? null,
    });
  }
  return "guardada";
}

// Importa el historial del agente del portal (modo producción o backfill de demos).
export async function importarHistorial(agentId: string): Promise<{ total: number; guardadas: number }> {
  const calls = await listarLlamadasRetell(agentId);
  let guardadas = 0;
  for (const c of calls) {
    const portalId = await portalDeLlamada(c);
    if (!portalId) continue;
    await upsertLlamada(portalId, aLlamadaPortal(c));
    const lead = leadDeLlamada(c);
    if (lead) await upsertLeadDesdeOrigen(portalId, lead.origenRef, { ...lead, nota: c.call_analysis?.call_summary ?? null });
    guardadas++;
  }
  return { total: calls.length, guardadas };
}

// Deja al agente listo para el portal: webhook + análisis post-llamada (PATCH update-agent).
export async function prepararAgenteParaPortal(agentId: string): Promise<boolean> {
  const secreto = process.env.RETELL_WEBHOOK_SECRET;
  const base = (process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
  if (!secreto) return false;
  const r = await fetch(`${BASE}/update-agent/${encodeURIComponent(agentId)}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ webhook_url: `${base}/api/retell-webhook?s=${secreto}`, post_call_analysis_data: POST_CALL_ANALYSIS }),
    signal: AbortSignal.timeout(8000),
  });
  return r.ok;
}
