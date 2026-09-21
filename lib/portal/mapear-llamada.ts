// Mapeo puro de una llamada de Retell (GET /v2/get-call) al modelo del portal. Sin imports de
// Next ni de la base para poder testearlo con node --test (tests/portal.test.mjs).
import type { CanalLead, EstadoLlamada, EtapaLeadCliente, LlamadaPortal, TurnoLlamada } from "./types";

export interface RetellCall {
  call_id: string;
  agent_id?: string;
  call_status?: string; // registered | ongoing | ended | error
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  transcript_object?: { role: string; content: string; words?: unknown[] }[];
  recording_url?: string;
  metadata?: Record<string, unknown>;
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: string;
    call_successful?: boolean;
    custom_analysis_data?: Record<string, unknown>;
  };
  latency?: { e2e?: { p50?: number; p95?: number } };
  disconnection_reason?: string;
}

export function aTurnos(call: RetellCall): TurnoLlamada[] {
  const obj = call.transcript_object ?? [];
  const turnos: TurnoLlamada[] = [];
  for (const t of obj) {
    if (t.role !== "agent" && t.role !== "user") continue; // ignora transfer_target y tool calls
    const texto = (t.content ?? "").trim();
    if (!texto) continue;
    turnos.push({ rol: t.role === "agent" ? "agente" : "cliente", texto });
  }
  return turnos;
}

export function estadoDe(call: RetellCall): EstadoLlamada {
  if (call.call_status === "error") return "error";
  if (call.call_analysis && Object.keys(call.call_analysis).length > 0) return "analizada";
  if (call.call_status === "ended") return "terminada";
  return "iniciada";
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
}
function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (/^(true|s[ií]|yes|1)$/i.test(v)) return true;
    if (/^(false|no|0)$/i.test(v)) return false;
  }
  return null;
}

export function resultadoDe(call: RetellCall): string | null {
  if (call.call_status === "error") return "No conectó";
  const c = call.call_analysis?.custom_analysis_data ?? {};
  if (bool(c.quiere_cita) === true) return "Cita solicitada";
  if (str(c.telefono) || str(c.nombre)) return "Datos tomados";
  if (call.call_analysis?.call_successful === true) return "Atendida";
  if (call.call_analysis?.call_successful === false) return "Sin resolver";
  return null;
}

export type PatchLlamada = Omit<LlamadaPortal, "id" | "portalId" | "creadoEl" | "actualizadoEl">;

export function aLlamadaPortal(call: RetellCall): PatchLlamada {
  const iso = (ms?: number) => (typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null);
  const dur = typeof call.duration_ms === "number"
    ? Math.round(call.duration_ms / 1000)
    : call.start_timestamp && call.end_timestamp
      ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
      : null;
  const p50 = call.latency?.e2e?.p50;
  const p95 = call.latency?.e2e?.p95;
  return {
    callId: call.call_id,
    agentId: call.agent_id ?? null,
    estado: estadoDe(call),
    inicio: iso(call.start_timestamp),
    fin: iso(call.end_timestamp),
    duracionSeg: dur,
    turnos: aTurnos(call),
    resumen: str(call.call_analysis?.call_summary),
    resultado: resultadoDe(call),
    exitosa: typeof call.call_analysis?.call_successful === "boolean" ? call.call_analysis.call_successful : null,
    sentimiento: /^unknown$/i.test(call.call_analysis?.user_sentiment ?? "") ? null : str(call.call_analysis?.user_sentiment),
    grabacionUrl: str(call.recording_url),
    datosExtraidos: call.call_analysis?.custom_analysis_data ?? null,
    latenciaP50Ms: typeof p50 === "number" ? Math.round(p50) : null,
    latenciaP95Ms: typeof p95 === "number" ? Math.round(p95) : null,
  };
}

// El lead que dejó la llamada (si el análisis sacó nombre o teléfono). null si no hay nada.
export function leadDeLlamada(call: RetellCall): {
  nombre: string;
  telefono: string | null;
  interes: string | null;
  canal: CanalLead;
  etapa: EtapaLeadCliente;
  origenRef: string;
} | null {
  const c = call.call_analysis?.custom_analysis_data ?? {};
  const nombre = str(c.nombre);
  const telefono = str(c.telefono);
  if (!nombre && !telefono) return null;
  return {
    nombre: nombre ?? `Llamada ${telefono}`,
    telefono,
    interes: str(c.interes),
    canal: "voz",
    etapa: bool(c.quiere_cita) === true ? "cita_agendada" : "nuevo",
    origenRef: call.call_id,
  };
}

// Etapas libres que Claude escribe en generado.json.sistema.etapas → etapas fijas del portal.
export function normalizarEtapa(etapa: string | undefined): EtapaLeadCliente {
  const e = (etapa ?? "").toLowerCase();
  if (/nuev|entr/.test(e)) return "nuevo";
  if (/cerr|gan|vend|pag/.test(e)) return "cerrado";
  if (/confirm|atend/.test(e)) return "confirmada";
  if (/cita|agend/.test(e)) return "cita_agendada";
  if (/calif|contact|segui/.test(e)) return "contactado";
  return "contactado";
}

export function normalizarCanal(canal: string | undefined): CanalLead {
  const c = (canal ?? "").toLowerCase();
  if (/insta|ig/.test(c)) return "instagram";
  if (/llam|tel|voz|phone/.test(c)) return "voz";
  if (/whats|wa/.test(c)) return "whatsapp";
  if (/chat|web/.test(c)) return "chat";
  return "ejemplo";
}
