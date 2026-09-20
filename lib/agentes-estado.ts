import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { leerPipeline } from "@/lib/pipedrive";
import { leerZoomIntel } from "@/lib/zoom";
import { leerSlackBorinquen } from "@/lib/slack-borinquen";
import { leerVentasEAlive } from "@/lib/ea-market";
import type { EstadoAgente, StatAgente } from "@/lib/types";

// Estado REAL de cada agente ejecutivo, derivado de las fuentes que de verdad
// están conectadas (snapshots en data/ + tokens de Pipedrive). Reemplaza los
// estados mock de lib/ceo.ts: un agente está "working" solo si su fuente
// primaria responde; "waiting" si le falta algo clave; "idle" si no hay nada.

export interface FuenteAgente {
  label: string;
  vivo: boolean;
}

export interface EstadoRealAgente {
  estado: EstadoAgente;
  tareaActual: string;
  stats: StatAgente[];
  fuentes: FuenteAgente[];
}

const DATA_DIR = path.join(process.cwd(), "data");

async function existe(nombre: string): Promise<boolean> {
  try {
    await fs.access(path.join(DATA_DIR, nombre));
    return true;
  } catch {
    return false;
  }
}

async function leerJson<T>(nombre: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, nombre), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// working si la fuente primaria vive; waiting si vive a medias; idle si nada.
function derivar(fuentes: FuenteAgente[], primariaVive: boolean): EstadoAgente {
  const algunaVive = fuentes.some((f) => f.vivo);
  if (!algunaVive) return "idle";
  const todasViven = fuentes.every((f) => f.vivo);
  if (primariaVive && todasViven) return "working";
  if (primariaVive) return "working";
  return "waiting";
}

export async function estadoRealAgentes(): Promise<
  Record<string, EstadoRealAgente>
> {
  const [
    debrief,
    agenda,
    opsLevelup,
    opsBorinquen,
    competencia,
    tendencias,
    entregas,
    igShadow,
    metricas,
    ventasEA,
    zoom,
    encargos,
    pipeline,
  ] = await Promise.all([
    existe("debrief.json"),
    existe("agenda.json"),
    existe("ops-levelup.json"),
    leerSlackBorinquen()
      .then((s) => s.conectado)
      .catch(() => false),
    leerJson<{ cuentas?: unknown[] }>("competencia.json"),
    leerJson<{ cuentas?: unknown[] }>("tendencias.json"),
    leerJson<{ entregas?: unknown[] }>("entregas.json"),
    existe("ig-shadow-operator.json"),
    existe("metricas.json"),
    leerVentasEAlive()
      .then((v) => v != null)
      .catch(() => false),
    leerZoomIntel().catch(() => null),
    leerJson<{ encargos?: unknown[] }>("encargos.json"),
    leerPipeline().catch(() => null),
  ]);

  const zoomLive = zoom?.conectado ?? false;

  // --- Sales Rep: Pipedrive en vivo + Zoom Intelligence (llamadas) ---
  const pdLive = pipeline?.fuente === "pipedrive";
  const abiertos =
    pipeline?.leads.filter((l) =>
      ["nuevo", "contactado", "calificado", "propuesta"].includes(l.etapa),
    ) ?? [];
  const propuestas = abiertos.filter((l) => l.etapa === "propuesta").length;
  const luLive = pdLive && (pipeline?.unidadesLive.includes("level-up") ?? false);
  const aibLive =
    pdLive && (pipeline?.unidadesLive.includes("ai-borinquen") ?? false);

  const llamadasTotal = zoom
    ? zoom.metrics.setterCalls + zoom.metrics.closerCalls + zoom.metrics.adminCalls
    : 0;
  const calientes = zoom?.metrics.oportunidadesCalientes ?? 0;

  const salesTarea = [
    pdLive ? `${abiertos.length} leads abiertos` : null,
    zoomLive ? `${llamadasTotal} llamadas (7d)` : null,
    zoomLive && calientes > 0 ? `${calientes} oportunidades calientes` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const sales: EstadoRealAgente = {
    estado: pdLive || zoomLive ? "working" : "waiting",
    tareaActual: salesTarea || "Esperando conexión de Pipedrive / Zoom",
    stats: [
      { label: "LEADS", valor: abiertos.length },
      { label: "PROPUESTAS", valor: propuestas },
      { label: "CALIENTES", valor: calientes },
    ],
    fuentes: [
      { label: "Pipedrive Level Up", vivo: luLive },
      { label: "Pipedrive Borinquen", vivo: aibLive },
      { label: "Zoom Intelligence", vivo: zoomLive },
    ],
  };

  // --- CEO / Orchestrator: brief + Slack + Calendar ---
  const ceoFuentes: FuenteAgente[] = [
    { label: "Slack Level Up", vivo: opsLevelup },
    { label: "Slack Borinquen", vivo: opsBorinquen },
    { label: "Google Calendar", vivo: agenda },
    { label: "Brief diario", vivo: debrief },
  ];
  const ceo: EstadoRealAgente = {
    estado: derivar(ceoFuentes, debrief),
    tareaActual: debrief
      ? "Brief diario corrido (6:30 AM) · Slack + Calendar clasificados"
      : "Esperando el primer brief",
    stats: [
      { label: "FUENTES", valor: ceoFuentes.filter((f) => f.vivo).length },
      { label: "DE", valor: ceoFuentes.length },
    ],
    fuentes: ceoFuentes,
  };

  // --- Researcher: competencia + tendencias (Apify) ---
  const compN = competencia?.cuentas?.length ?? 0;
  const tendN = tendencias?.cuentas?.length ?? 0;
  const resFuentes: FuenteAgente[] = [
    { label: "Competencia (Apify)", vivo: compN > 0 },
    { label: "Tendencias IA (Apify)", vivo: tendN > 0 },
  ];
  const researcher: EstadoRealAgente = {
    estado: derivar(resFuentes, compN > 0 || tendN > 0),
    tareaActual: `Rastreando ${compN} referentes + ${tendN} fuentes de IA`,
    stats: [
      { label: "REFERENTES", valor: compN },
      { label: "IA", valor: tendN },
    ],
    fuentes: resFuentes,
  };

  // --- CMO: entregas del squad + IG Shadow ---
  const entN = entregas?.entregas?.length ?? 0;
  const cmoFuentes: FuenteAgente[] = [
    { label: "Entregas del squad", vivo: entN > 0 },
    { label: "IG Shadow Operator", vivo: igShadow },
  ];
  const cmo: EstadoRealAgente = {
    estado: derivar(cmoFuentes, entN > 0),
    tareaActual: `${entN} piezas producidas por el squad para revisar`,
    stats: [
      { label: "PIEZAS", valor: entN },
      { label: "SQUAD", valor: 6 },
    ],
    fuentes: cmoFuentes,
  };

  // --- Data Analyst: métricas IG + EA Market ---
  const analystFuentes: FuenteAgente[] = [
    { label: "Métricas IG", vivo: metricas },
    { label: "EA Market", vivo: ventasEA },
  ];
  const analyst: EstadoRealAgente = {
    estado: derivar(analystFuentes, metricas),
    tareaActual: ventasEA
      ? "Cruzando ventas EA Market con métricas de IG"
      : "Métricas de IG al día · falta conectar EA Market",
    stats: [
      { label: "FUENTES", valor: analystFuentes.filter((f) => f.vivo).length },
      { label: "DE", valor: analystFuentes.length },
    ],
    fuentes: analystFuentes,
  };

  // --- Dev: cuántas integraciones están vivas + cola de encargos ---
  const todas: FuenteAgente[] = [
    ...ceoFuentes,
    ...sales.fuentes,
    ...resFuentes,
    ...cmoFuentes,
    ...analystFuentes,
  ];
  const vivas = todas.filter((f) => f.vivo).length;
  const enCola = encargos?.encargos?.length ?? 0;
  const dev: EstadoRealAgente = {
    estado: "working",
    tareaActual: `${vivas}/${todas.length} integraciones vivas · ${enCola} encargos en cola`,
    stats: [
      { label: "VIVAS", valor: vivas },
      { label: "EN COLA", valor: enCola },
    ],
    fuentes: [
      { label: "Pipedrive x2", vivo: luLive && aibLive },
      { label: "Slack", vivo: opsLevelup },
      { label: "Calendar", vivo: agenda },
      { label: "Apify (IG)", vivo: metricas },
      { label: "EA Market", vivo: ventasEA },
      { label: "Zoom Intelligence", vivo: zoomLive },
    ],
  };

  return { ceo, researcher, cmo, sales, dev, analyst };
}
