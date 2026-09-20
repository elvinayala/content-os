import type {
  AgenteVoz,
  AsistenteChat,
  AsistentePersonal,
  InstanciaAutoFlow,
  TranscriptoLlamada,
} from "@/lib/types";
import { configDesdePreset } from "@/lib/voz/preset";
import { armarPromptEntrenado } from "@/lib/borinquen/entrenar";

// ============================================================================
// Datos seed de AI Borinquen ("Bori") — PASO 01 mock.
// El Voice Studio, el CRM, AutoFlow y el asistente arrancan con esto; se van
// reemplazando por datos reales (Retell/Vapi, Pipedrive) sin tocar la UI.
// Fechas relativas a "hoy" (2026-07) para que se vean frescas.
// ============================================================================

export const agentesVozMock: AgenteVoz[] = [
  {
    id: "av-calificador",
    nombre: "Calificador de Leads",
    proveedor: "retell",
    unidad: "ai-borinquen",
    proposito: "Califica leads entrantes 24/7 y agenda la llamada de cierre",
    estado: "activo",
    numero: "+1 787 555 0110",
    config: configDesdePreset({
      negocio: "AI Borinquen",
      proposito: "calificar el lead y agendar una demo",
    }),
    externalId: "agent_mock_calificador",
    fuente: "mock",
    creadoEl: "2026-06-12T14:00:00Z",
    actualizadoEl: "2026-07-04T18:30:00Z",
    metricas: {
      llamadas: 156,
      latenciaP50Ms: 890,
      latenciaP95Ms: 1090,
      duracionPromMin: 2.8,
    },
  },
  {
    id: "av-recepcion-sonrisa",
    nombre: "Recepción — Clínica Sonrisa",
    proveedor: "retell",
    unidad: "ai-borinquen",
    cliente: "Clínica Dental Sonrisa",
    proposito: "Agenda citas, responde dudas y toma recados fuera de horario",
    estado: "activo",
    numero: "+1 787 555 0142",
    config: configDesdePreset({
      negocio: "Clínica Dental Sonrisa",
      proposito: "agendar una cita y responder dudas comunes",
    }),
    externalId: "agent_mock_sonrisa",
    fuente: "mock",
    creadoEl: "2026-05-28T15:00:00Z",
    actualizadoEl: "2026-07-05T12:10:00Z",
    metricas: {
      llamadas: 214,
      latenciaP50Ms: 940,
      latenciaP95Ms: 1180,
      duracionPromMin: 3.2,
    },
  },
  {
    id: "av-reservas-surf",
    nombre: "Reservas — Borinquen Surf School",
    proveedor: "vapi",
    unidad: "ai-borinquen",
    cliente: "Borinquen Surf School",
    proposito: "Reserva clases y coordina horarios según la marea",
    estado: "activo",
    numero: "+1 787 555 0177",
    config: configDesdePreset({
      negocio: "Borinquen Surf School",
      proposito: "reservar una clase y confirmar el horario",
    }),
    externalId: "agent_mock_surf",
    fuente: "mock",
    creadoEl: "2026-06-20T16:00:00Z",
    actualizadoEl: "2026-07-05T11:40:00Z",
    metricas: {
      llamadas: 98,
      latenciaP50Ms: 910,
      latenciaP95Ms: 1150,
      duracionPromMin: 2.4,
    },
  },
  {
    id: "av-cobros-coqui",
    nombre: "Cobros — Taller El Coquí",
    proveedor: "retell",
    unidad: "ai-borinquen",
    cliente: "Taller Mecánico El Coquí",
    proposito: "Recordatorios de pago y confirmación de recogida",
    estado: "pausado",
    numero: "+1 787 555 0163",
    config: configDesdePreset({
      negocio: "Taller Mecánico El Coquí",
      proposito: "recordar el pago pendiente y coordinar la recogida",
    }),
    externalId: "agent_mock_coqui",
    fuente: "mock",
    creadoEl: "2026-06-30T17:00:00Z",
    actualizadoEl: "2026-07-02T09:00:00Z",
    metricas: {
      llamadas: 41,
      latenciaP50Ms: 980,
      latenciaP95Ms: 1240,
      duracionPromMin: 1.9,
    },
  },
  {
    id: "av-demo",
    nombre: "Demo AutoFlow",
    proveedor: "retell",
    unidad: "ai-borinquen",
    proposito: "Agente de demostración para prospectos de AI Borinquen",
    estado: "borrador",
    config: configDesdePreset({
      negocio: "AI Borinquen",
      proposito: "mostrar cómo trabaja un agente de voz de AutoFlow",
    }),
    fuente: "mock",
    creadoEl: "2026-07-05T10:00:00Z",
    actualizadoEl: "2026-07-05T10:00:00Z",
    metricas: {
      llamadas: 0,
      latenciaP50Ms: null,
      latenciaP95Ms: null,
      duracionPromMin: null,
    },
  },
];

// Transcripción de ejemplo (para la pestaña del detalle del agente).
export const transcriptosMock: TranscriptoLlamada[] = [
  {
    id: "call-001",
    agenteId: "av-recepcion-sonrisa",
    fecha: "2026-07-05T13:42:00Z",
    duracionSeg: 148,
    resultado: "Cita agendada — martes 10:30 AM",
    turnos: [
      { rol: "agente", texto: "Gracias por llamar a Clínica Sonrisa, ¿en qué te puedo ayudar?", latenciaMs: 820 },
      { rol: "cliente", texto: "Hola, quiero sacar una cita para una limpieza." },
      { rol: "agente", texto: "¡Claro! ¿Te queda mejor esta semana o la próxima?", latenciaMs: 910 },
      { rol: "cliente", texto: "Esta semana si se puede." },
      { rol: "agente", texto: "Tengo el martes a las 10:30 de la mañana. ¿Te sirve?", latenciaMs: 880 },
      { rol: "cliente", texto: "Perfecto." },
      { rol: "agente", texto: "Listo, te agendé el martes 10:30. ¿A qué nombre?", latenciaMs: 900 },
    ],
  },
];

// ---- Instancias AutoFlow (DFY) ----
export const instanciasMock: InstanciaAutoFlow[] = [
  {
    id: "af-sonrisa",
    cliente: "Clínica Dental Sonrisa",
    negocio: "Salud / dental",
    unidad: "ai-borinquen",
    estado: "activo",
    canales: ["whatsapp", "instagram"],
    crm: "GoHighLevel",
    numero: "+1 787 555 0142",
    agentesVoz: ["av-recepcion-sonrisa"],
    tier: "$3,500",
    etapaPipeline: 4,
    pasosOnboarding: [
      { paso: "CRM (GHL) montado", hecho: true },
      { paso: "Número YCloud conectado", hecho: true },
      { paso: "Agente de voz entrenado", hecho: true },
      { paso: "Workflow n8n en vivo", hecho: true },
    ],
    creadoEl: "2026-05-28T15:00:00Z",
    actualizadoEl: "2026-07-05T12:10:00Z",
  },
  {
    id: "af-surf",
    cliente: "Borinquen Surf School",
    negocio: "Turismo / clases",
    unidad: "ai-borinquen",
    estado: "activo",
    canales: ["whatsapp", "messenger"],
    crm: "GoHighLevel",
    numero: "+1 787 555 0177",
    agentesVoz: ["av-reservas-surf"],
    tier: "$1,200",
    etapaPipeline: 4,
    pasosOnboarding: [
      { paso: "CRM (GHL) montado", hecho: true },
      { paso: "Número YCloud conectado", hecho: true },
      { paso: "Agente de voz entrenado", hecho: true },
      { paso: "Workflow n8n en vivo", hecho: true },
    ],
    creadoEl: "2026-06-20T16:00:00Z",
    actualizadoEl: "2026-07-05T11:40:00Z",
  },
  {
    id: "af-coqui",
    cliente: "Taller Mecánico El Coquí",
    negocio: "Automotriz",
    unidad: "ai-borinquen",
    estado: "onboarding",
    canales: ["whatsapp"],
    crm: "GoHighLevel",
    agentesVoz: ["av-cobros-coqui"],
    tier: "$1,200",
    etapaPipeline: 2,
    pasosOnboarding: [
      { paso: "CRM (GHL) montado", hecho: true },
      { paso: "Número YCloud conectado", hecho: true },
      { paso: "Agente de voz entrenado", hecho: false },
      { paso: "Workflow n8n en vivo", hecho: false },
    ],
    creadoEl: "2026-06-30T17:00:00Z",
    actualizadoEl: "2026-07-02T09:00:00Z",
  },
];

// ---- Asistentes de Chat (WhatsApp/IG/web) — el otro tipo de agente ----
export const asistentesChatMock: AsistenteChat[] = [
  {
    id: "ch-sonrisa-ventas",
    nombre: "Ventas WhatsApp — Clínica Sonrisa",
    proveedor: "borinquen",
    unidad: "ai-borinquen",
    cliente: "Clínica Dental Sonrisa",
    proposito: "Responde precios, agenda evaluaciones y filtra emergencias",
    estado: "activo",
    canales: ["whatsapp", "instagram"],
    entrenamiento: {
      nicho: "Clínica dental",
      oferta: "Limpiezas, blanqueamiento, ortodoncia y evaluaciones gratis",
      tono: "Cálido, profesional, boricua",
      publico: "Familias de la zona metro que buscan dentista de confianza",
      cta: "Agendar una evaluación",
      conversaciones:
        "Cliente: cuánto cuesta una limpieza?\nNegocio: La limpieza está en $75 e incluye evaluación. ¿Te agendo esta semana?",
    },
    promptSistema: armarPromptEntrenado(
      "chat",
      "Clínica Dental Sonrisa",
      "Responde precios, agenda evaluaciones y filtra emergencias",
      {
        nicho: "Clínica dental",
        oferta: "Limpiezas, blanqueamiento, ortodoncia y evaluaciones gratis",
        tono: "Cálido, profesional, boricua",
        publico: "Familias de la zona metro",
        cta: "Agendar una evaluación",
        conversaciones: "",
      },
    ),
    creadoEl: "2026-06-02T15:00:00Z",
    actualizadoEl: "2026-07-05T12:00:00Z",
    metricas: { chats: 342, resueltosPct: 88, leads: 61 },
  },
  {
    id: "ch-surf-soporte",
    nombre: "Soporte — Borinquen Surf School",
    proveedor: "borinquen",
    unidad: "ai-borinquen",
    cliente: "Borinquen Surf School",
    proposito: "Responde dudas de clases, precios y coordina por marea",
    estado: "activo",
    canales: ["whatsapp", "messenger", "web"],
    promptSistema: armarPromptEntrenado(
      "chat",
      "Borinquen Surf School",
      "Responde dudas de clases y coordina reservas",
    ),
    creadoEl: "2026-06-22T16:00:00Z",
    actualizadoEl: "2026-07-05T10:30:00Z",
    metricas: { chats: 156, resueltosPct: 84, leads: 33 },
  },
  {
    id: "ch-demo",
    nombre: "Demo — Asistente de Chat",
    proveedor: "borinquen",
    unidad: "ai-borinquen",
    proposito: "Demostración para prospectos de AI Borinquen",
    estado: "borrador",
    canales: ["whatsapp"],
    promptSistema: armarPromptEntrenado("chat", "AI Borinquen", "mostrar cómo responde un asistente entrenado"),
    creadoEl: "2026-07-05T10:00:00Z",
    actualizadoEl: "2026-07-05T10:00:00Z",
    metricas: { chats: 0, resueltosPct: null, leads: 0 },
  },
];

// ---- Asistente personal (Telegram/WhatsApp) ----
export const asistentesMock: AsistentePersonal[] = [
  {
    id: "as-elvin",
    cliente: "Elvin (interno)",
    canal: "telegram",
    estado: "activo",
    tools: ["crear_lead", "buscar_lead", "agendar", "resumen_del_dia"],
    promptSistema:
      "Sos el asistente personal de Elvin en Telegram. Ejecutás acciones: creás y buscás leads, agendás y resumís el día. Directo, en español, sin relleno.",
    creadoEl: "2026-07-01T14:00:00Z",
    actualizadoEl: "2026-07-05T08:00:00Z",
  },
];

// ---- KPIs y widgets del Centro de Comando (mock) ----
// Números "de arriba" del overview. Los reales saldrán de Retell/Vapi + CRM.
export interface KpiAgentes {
  key: string;
  label: string;
  valor: string;
  delta: string;
  deltaBueno: boolean; // true = verde (mejora), false = rojo/ámbar
  nota?: string;
}

export const kpisAgentesMock: KpiAgentes[] = [
  { key: "activos", label: "Agentes activos", valor: "3", delta: "+1 vs. semana pasada", deltaBueno: true },
  { key: "llamadas", label: "Llamadas hoy", valor: "128", delta: "+23", deltaBueno: true },
  { key: "latencia", label: "Latencia p50", valor: "0.94s", delta: "−0.12s", deltaBueno: true, nota: "Objetivo < 1.0s" },
  { key: "leads", label: "Leads capturados", valor: "37", delta: "+9 este mes", deltaBueno: true },
];

// Serie de llamadas de los últimos 14 días (para el gráfico de área).
export const serieLlamadas14dMock: number[] = [
  38, 41, 36, 44, 52, 48, 55, 61, 58, 66, 72, 69, 84, 128,
];

// Top agentes por resolución (equivalente a "Top creativos").
export interface TopAgente {
  agenteId: string;
  nombre: string;
  detalle: string; // "Teléfono · Recepción"
  score: number; // % de resolución
}

export const topAgentesMock: TopAgente[] = [
  { agenteId: "av-calificador", nombre: "Calificador de Leads", detalle: "Teléfono · Calificación", score: 94 },
  { agenteId: "av-recepcion-sonrisa", nombre: "Recepción — Clínica Sonrisa", detalle: "Teléfono · Recepción", score: 91 },
  { agenteId: "av-reservas-surf", nombre: "Reservas — Surf School", detalle: "Teléfono · Reservas", score: 88 },
];
