import {
  Activity,
  BarChart3,
  BookOpenText,
  CalendarClock,
  Clapperboard,
  Crown,
  Filter,
  Gauge,
  Hammer,
  Hexagon,
  Inbox,
  Layers,
  LineChart,
  ListChecks,
  Megaphone,
  Mic,
  Radar,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { AgenteEjecutivo, UnidadNegocio } from "@/lib/types";

// Agente ejecutivo + su icono (el icon no vive en types.ts para no acoplarlo a lucide).
export interface AgenteEjecutivoUI extends AgenteEjecutivo {
  icon: LucideIcon;
  // Fuentes reales del agente (vivo/pendiente) — las inyecta estadoRealAgentes().
  fuentes?: { label: string; vivo: boolean }[];
}

// Navegación de la sección /ceo (la sidebar propia del Command Center).
export interface CeoNavItem {
  titulo: string;
  href: string;
  icon: LucideIcon;
  descripcion: string;
}

export const ceoNavItems: CeoNavItem[] = [
  {
    titulo: "Command Center",
    href: "/ceo",
    icon: Gauge,
    descripcion: "Qué necesita tu atención hoy, en una pantalla.",
  },
  {
    titulo: "Portafolio",
    href: "/ceo/portafolio",
    icon: Layers,
    descripcion:
      "El holding en una pantalla: motores, productos, piloto y congelados con sus compuertas.",
  },
  {
    titulo: "Jarvis HUD",
    href: "/hud",
    icon: Hexagon,
    descripcion:
      "Métricas + Jarvis + Skills en una sola pantalla — tu centro de comando de contenido.",
  },
  {
    titulo: "Agents",
    href: "/ceo/agents",
    icon: UserRound,
    descripcion: "El orquestador y sus especialistas, con estado en vivo.",
  },
  {
    titulo: "Tasks",
    href: "/ceo/tasks",
    icon: ListChecks,
    descripcion: "Tareas del ecosistema por unidad, prioridad y estado.",
  },
  {
    titulo: "Actividad del equipo",
    href: "/ceo/equipo-actividad",
    icon: Activity,
    descripcion: "Actividad real en Slack: mensajes por persona y última vez activo.",
  },
  {
    titulo: "Práctica de ventas",
    href: "/ceo/practica",
    icon: Mic,
    descripcion:
      "Role play por voz contra un cliente difícil, calificado con el framework de Joe.",
  },
  {
    titulo: "Schedule",
    href: "/ceo/schedule",
    icon: CalendarClock,
    descripcion: "Agenda de la semana: reuniones, grabaciones y deadlines.",
  },
  {
    titulo: "Lead Pipeline",
    href: "/ceo/pipeline",
    icon: Filter,
    descripcion: "Leads por etapa con retainer estimado.",
  },
  {
    titulo: "Content",
    href: "/ceo/content",
    icon: Clapperboard,
    descripcion: "Resumen ejecutivo del sistema de contenido.",
  },
  {
    titulo: "Entregas",
    href: "/ceo/entregas",
    icon: Inbox,
    descripcion: "Lo que el equipo te dejó para revisar: ideas, ganchos, guiones, carruseles.",
  },
  {
    titulo: "Knowledge Vault",
    href: "/ceo/vault",
    icon: BookOpenText,
    descripcion: "SOPs, playbooks y prompts del ecosistema.",
  },
];

// Unidades de negocio del ecosistema. `activa` de las agencias refleja
// lib/agencias.ts (level-up prendida, ai-borinquen en standby).
export const UNIDADES: Record<
  UnidadNegocio,
  { nombre: string; abrev: string; activa: boolean }
> = {
  "level-up": { nombre: "Level Up Media", abrev: "LUM", activa: true },
  "ai-borinquen": { nombre: "AI Borinquen", abrev: "AIB", activa: false },
  "shadow-operator": { nombre: "Shadow Operator", abrev: "SO", activa: true },
  ecosistema: { nombre: "Ecosistema", abrev: "ECO", activa: true },
};

const UNIDAD_FALLBACK = { nombre: "Ecosistema", abrev: "ECO", activa: true };

// Lookup seguro de unidad. Los snapshots los escriben los agentes y a veces
// traen una unidad que no existe (p. ej. el brief escribió "personal" en los
// eventos de agenda) — hacer UNIDADES[x].abrev directo tumbaba TODO el
// Command Center. Nunca leas UNIDADES[...] directo en la UI: usá esto.
export function unidadInfo(u: string | null | undefined) {
  return UNIDADES[u as UnidadNegocio] ?? UNIDAD_FALLBACK;
}

// ---- Roster ejecutivo (PASO 01: estados y stats mock) ----
// El CEO/Orquestador coordina por encima; los 5 especialistas cubren
// las áreas reales del negocio. Sofi y su pipeline de contenido
// (lib/equipo.ts) quedan como squad debajo del CMO — no se reemplazan.

export const orquestador: AgenteEjecutivoUI = {
  id: "ceo",
  nombre: "CEO",
  rol: "Orchestrator",
  subtitulo: "COMMAND LAYER",
  descripcion:
    "Corre el brief diario (/brief-ceo): lee Slack y Calendar, clasifica wins y críticos, agenda action items y escribe el debrief.",
  capa: "command",
  estado: "working",
  tareaActual: "Brief diario de las 6:30 AM",
  modelo: "claude-opus-4-8",
  unidad: "ecosistema",
  stats: [
    { label: "ROUTES", valor: 28 },
    { label: "READS", valor: 63 },
  ],
  vinculos: [{ href: "/ceo", label: "Command Center" }],
  icon: Crown,
};

export const especialistas: AgenteEjecutivoUI[] = [
  {
    id: "researcher",
    nombre: "Researcher",
    rol: "Intel Gatherer",
    subtitulo: "INTEL GATHERER",
    descripcion:
      "Encuentra señales de mercado, tendencias y movimientos de la competencia para todo el ecosistema.",
    capa: "specialist",
    estado: "working",
    tareaActual: "Barrido diario de las 12 fuentes",
    modelo: "claude-sonnet-5",
    unidad: "ecosistema",
    stats: [
      { label: "FUENTES", valor: 12 },
      { label: "SEÑALES", valor: 9 },
    ],
    vinculos: [
      { href: "/tendencias", label: "Tendencias" },
      { href: "/competencia", label: "Competencia" },
    ],
    icon: Radar,
  },
  {
    id: "cmo",
    nombre: "CMO",
    rol: "Market Voice",
    subtitulo: "MARKET VOICE",
    descripcion:
      "Convierte estrategia en contenido y supervisa al squad. Lee los insights de IG de Shadow Operator para ajustar ángulos.",
    capa: "specialist",
    estado: "working",
    tareaActual: "Revisando los guiones de la semana",
    modelo: "claude-opus-4-8",
    unidad: "shadow-operator",
    stats: [
      { label: "PIEZAS", valor: 6 },
      { label: "SQUAD", valor: 6 },
    ],
    vinculos: [
      { href: "/ceo/content", label: "Content" },
      { href: "/tablero", label: "Tablero" },
    ],
    supervisaA: ["sofi", "mateo", "santi", "cami", "lauti", "facu"],
    icon: Megaphone,
  },
  {
    id: "sales",
    nombre: "Sales Rep",
    rol: "Revenue Ops",
    subtitulo: "REVENUE OPS",
    descripcion:
      "Vive en los dos Pipedrive (Level Up + AI Borinquen) y en Zoom Intelligence: deals por etapa, objeciones y revenue detectado en llamadas.",
    capa: "specialist",
    estado: "waiting",
    tareaActual: "Espera tu OK para enviar 2 propuestas",
    modelo: "claude-sonnet-5",
    unidad: "ecosistema",
    stats: [
      { label: "LEADS", valor: 10 },
      { label: "PROPUESTAS", valor: 2 },
    ],
    vinculos: [
      { href: "/ceo/pipeline", label: "Lead Pipeline" },
      {
        href: "https://portal.levelupmediapr.net/levelup-clientes/zoom-intelligence/",
        label: "Zoom Intelligence",
      },
    ],
    icon: LineChart,
  },
  {
    id: "dev",
    nombre: "Dev",
    rol: "Build System",
    subtitulo: "BUILD SYSTEM",
    descripcion:
      "Mantiene las integraciones del Command Center: Slack, Calendar, Pipedrive, Apify y los portales.",
    capa: "specialist",
    estado: "working",
    tareaActual: "Conectando las fuentes del PASO 02",
    modelo: "claude-sonnet-5",
    unidad: "ecosistema",
    stats: [
      { label: "FUENTES", valor: 2 },
      { label: "EN COLA", valor: 5 },
    ],
    vinculos: [{ href: "/ceo", label: "Estado de fuentes" }],
    icon: Hammer,
  },
  {
    id: "analyst",
    nombre: "Data Analyst",
    rol: "Signal Layer",
    subtitulo: "SIGNAL LAYER",
    descripcion:
      "Cruza ventas de Sheets, el consolidado EA Market y las métricas de contenido; alerta desvíos en el debrief.",
    capa: "specialist",
    estado: "working",
    tareaActual: "Cruzando ventas de Sheets con métricas de IG",
    modelo: "claude-sonnet-5",
    unidad: "ecosistema",
    stats: [
      { label: "REPORTES", valor: 4 },
      { label: "ALERTAS", valor: 1 },
    ],
    vinculos: [
      { href: "/dashboard", label: "Dashboard" },
      {
        href: "https://dashboard-ea-market.netlify.app/",
        label: "EA Market",
      },
    ],
    icon: BarChart3,
  },
];

export const agentesEjecutivos: AgenteEjecutivoUI[] = [
  orquestador,
  ...especialistas,
];
