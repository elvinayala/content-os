// Tipos del Portal AutoFlow: el dashboard que el closer de AI Borinquen abre en la llamada y
// que el prospecto (y luego el cliente) puede tocar. Sin imports "@/" ni "server-only" porque
// lo cargan drizzle-kit y los tests fuera de Next.

export type ModoPortal = "demo" | "produccion";
export type EtapaLeadCliente = "nuevo" | "contactado" | "cita_agendada" | "confirmada" | "cerrado";
export type CanalLead = "voz" | "chat" | "whatsapp" | "instagram" | "ejemplo" | "manual";
export type EstadoLlamada = "iniciada" | "terminada" | "analizada" | "error";
export type EstadoSolicitud = "recibida" | "en_progreso" | "lista";

export const ETAPAS_LEAD: { etapa: EtapaLeadCliente; titulo: string }[] = [
  { etapa: "nuevo", titulo: "Nuevos" },
  { etapa: "contactado", titulo: "Contactados" },
  { etapa: "cita_agendada", titulo: "Cita agendada" },
  { etapa: "confirmada", titulo: "Confirmadas" },
  { etapa: "cerrado", titulo: "Cerrados" },
];

export const ESTADOS_SOLICITUD: { estado: EstadoSolicitud; titulo: string }[] = [
  { estado: "recibida", titulo: "Recibida" },
  { estado: "en_progreso", titulo: "En progreso" },
  { estado: "lista", titulo: "Lista" },
];

export interface UrlsPortal {
  chat?: string;
  voz?: string;
  landing?: string;
  propuesta?: string;
  deck?: string;
  sistema?: string;
}

export interface PortalAutoFlow {
  id: string;
  slug: string;
  negocio: string;
  nicho: string | null;
  contacto: string | null;
  color: string;
  asistente: string;
  modo: ModoPortal;
  activo: boolean;
  agentIdVoz: string | null;
  urls: UrlsPortal;
  pipedriveDealId: string | null;
  creadoEl: string; // ISO
  actualizadoEl: string; // ISO
}

export interface LeadCliente {
  id: string;
  portalId: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  interes: string | null;
  canal: CanalLead;
  etapa: EtapaLeadCliente;
  esEjemplo: boolean;
  origenRef: string | null; // "ejemplo:3" · call_id · "chat:<sesion>"
  nota: string | null;
  hora: string | null; // texto libre de ejemplo ("9:14 p.m.")
  creadoEl: string;
  actualizadoEl: string;
}

export interface TurnoLlamada {
  rol: "agente" | "cliente";
  texto: string;
  latenciaMs?: number;
}

export interface LlamadaPortal {
  id: string;
  portalId: string;
  callId: string;
  agentId: string | null;
  estado: EstadoLlamada;
  inicio: string | null;
  fin: string | null;
  duracionSeg: number | null;
  turnos: TurnoLlamada[];
  resumen: string | null;
  resultado: string | null;
  exitosa: boolean | null;
  sentimiento: string | null;
  grabacionUrl: string | null;
  datosExtraidos: Record<string, unknown> | null;
  latenciaP50Ms: number | null;
  latenciaP95Ms: number | null;
  creadoEl: string;
  actualizadoEl: string;
}

export interface SolicitudCambio {
  id: string;
  portalId: string;
  texto: string;
  autor: string | null;
  estado: EstadoSolicitud;
  respuesta: string | null;
  creadoEl: string;
  actualizadoEl: string;
}

// Solo números reales. null = todavía no hay dato (la UI pinta "—", nunca inventa).
export interface MetricasPortal {
  llamadasAtendidas: number | null;
  mensajesChat: number | null;
  leadsCapturados: number | null;
  tiempoRespuestaMs: number | null;
}

// Lo que la fábrica (scripts/demo-cliente/demo.mjs) manda para registrar un portal.
export interface PayloadPortal {
  slug: string;
  negocio: string;
  nicho?: string;
  contacto?: string;
  color?: string;
  asistente?: string;
  modo?: ModoPortal;
  agentIdVoz?: string | null;
  urls?: UrlsPortal;
  pipedriveDealId?: string | null;
  leadsEjemplo?: { nombre: string; canal?: string; interes?: string; etapa?: string; hora?: string }[];
}
