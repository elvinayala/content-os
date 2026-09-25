/**
 * Almacén simple en archivos JSON (data/estado/*.json).
 * Suficiente para arrancar con un plomero; cuando haya 3+ se migra a Postgres
 * sin tocar el resto: solo esta capa.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Anthropic from "@anthropic-ai/sdk";

const aqui = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(aqui, "..");
const DIR = path.join(RAIZ, "data", "estado");
fs.mkdirSync(DIR, { recursive: true });

function leer<T>(archivo: string, porDefecto: T): T {
  const p = path.join(DIR, archivo);
  if (!fs.existsSync(p)) return porDefecto;
  try { return JSON.parse(fs.readFileSync(p, "utf8")) as T; } catch { return porDefecto; }
}
function escribir(archivo: string, datos: unknown) {
  const p = path.join(DIR, archivo);
  fs.writeFileSync(p + ".tmp", JSON.stringify(datos, null, 2));
  fs.renameSync(p + ".tmp", p);
}

export type Canal = "whatsapp" | "instagram" | "messenger" | "web" | "sms";

export interface Contacto {
  id: string;              // `${canal}:${identificador}`
  canal: Canal;
  identificador: string;   // teléfono (WA), PSID/IGSID (Meta) o sessionId (web)
  nombre?: string;
  telefono?: string;
  municipio?: string;
  direccion?: string;
  tipo?: "cliente" | "plomero-candidato" | "cliente-proyecto" | "contratista" | "otro";
  notas: string[];
  ghlContactId?: string;
  ghlOpportunityId?: string; // tarjeta en el pipeline (Candidatos / Contratistas / Trabajos) creada al clasificar
  /** Conversación de Messenger/Instagram en Zernio, para escribirle después (confirmación, en camino, cobro). */
  dm?: { conversationId: string; accountId: string };
  /** Seguimientos automáticos enviados por Messenger/IG (ISO); ver seguimiento.ts. */
  seguimientos?: string[];
  /** SMS (canales/sms.ts): cuántos le mandamos, si pidió la baja y cuándo fue el seguimiento por SMS. */
  smsEnviados?: number;
  smsBaja?: boolean;
  smsSeguimiento?: string;
  humano: boolean;         // true = un humano tomó la conversación; el agente calla
  humanoDesde?: string;
  enviadosWa?: number;     // cuántos mensajes le hemos mandado por WhatsApp (el humanizador lo usa)    // cuándo contestó por última vez un humano (para retomar solo pasadas HUMANO_HORAS)
  creado: string;
  actualizado: string;
}

export interface Conversacion {
  contactoId: string;
  mensajes: Anthropic.Beta.BetaMessageParam[];
  actualizado: string;
}

export interface Trabajo {
  id: string;
  contactoId: string;
  nombre: string;
  telefono: string;
  municipio: string;
  territorio: string;
  plomeroId: string;
  servicioId: string;
  servicio: string;
  nivel: "P" | "M" | "G";
  manoObra: number | null;
  rango?: [number, number];
  fee: number;
  emergencia: boolean;
  direccion: string;
  referencia?: string;
  inicio: string;          // ISO
  fin: string;             // ISO
  estado: "agendado" | "en-camino" | "en-sitio" | "completado" | "cobrado" | "cancelado";
  eventoCalendarId?: string;
  // Ciclo en la app del plomero (ciclo-trabajo.ts)
  enCaminoEn?: string;
  llegadaEn?: string;
  terminadoEn?: string;
  manoObraFinal?: number;
  materialesCosto?: number;
  totalCliente?: number;
  pagoPlomero?: number;
  fotosAntes?: string[];
  fotosDespues?: string[];
  notaCierre?: string;
  pagadoAlPlomero?: string;   // fecha del viernes en que se le pagó
  garantiaDe?: string;        // si es un re-trabajo de garantía: id del trabajo original
  notasInternas?: { fecha: string; autor: string; texto: string }[];
  ghlOpportunityId?: string;
  linkPago?: string;
  fotos: string[];
  creado: string;
}

export interface Candidato {
  id: string;
  contactoId: string;
  nombre: string;
  whatsapp: string;
  nivelLicencia: string;
  numeroLicencia?: string;
  municipio: string;
  experiencia?: string;    // años que lleva de plomero (texto tal como lo dijo)
  equipo: string;
  disponibilidad: string;
  entrevista?: string;     // ISO
  ghlCitaId?: string;      // la cita en el calendario de entrevistas de GHL
  avisadoSeguimiento?: string; // cuándo se le avisó a la reclutadora que es un gran candidato sin cita
  recordado?: string;      // cuándo se le mandó el recordatorio de la entrevista
  estado: "nuevo" | "verificando" | "entrevista" | "prueba" | "activo" | "descartado";
  creado: string;
}

export interface ListaEspera { municipio: string; nombre: string; contactoId: string; creado: string }

/** División Proyectos: un proyecto de mejora vendido por Resuelto y ejecutado por un contratista verificado. */
export interface Proyecto {
  id: string;                 // PR-0001
  contactoId: string;
  categoriaId: string;
  nombre: string;
  telefono: string;
  municipio: string;
  territorio?: string;
  descripcion: string;
  tamano?: string;
  presupuestoCliente?: string;
  plazo?: string;
  propiedad: "propia" | "autorizado" | "alquiler" | "desconocida";
  fotos: number;
  estado: "precalificado" | "descartado" | "visita-agendada" | "visita-realizada" | "propuesta" | "aprobacion-pendiente" | "pendiente-deposito" | "cerrado" | "asignado" | "en-ejecucion" | "inspeccion" | "completado" | "cancelado";
  motivoDescarte?: string;
  visita?: { inicio: string; fin: string; cotizadorId: string; eventoCalendarId?: string };
  cotizadorId?: string;
  contratistaId?: string;
  precio?: number; costoTotal?: number; margenPct?: number; deposito?: number;
  cotizacion?: {
    partidas: { id: string; nombre: string; unidad?: string; cantidad: number; costoUnitario: number }[];
    precioFinal: number; costoEjecucion: number; margenFinal: number; requiereAprobacion: boolean;
    aprobado?: boolean; aprobadoEn?: string;
    hitos: { id: string; nombre: string; pct: number; monto: number; retencion?: boolean }[];
    propuestaUrl: string; contratoUrl?: string; depositoLink?: string;
    depositoRecibidoEn?: string; depositoMetodo?: string;
    notas?: string; actualizado: string;
  };
  encuesta?: import("./encuestas.js").Encuesta;
  ghlContactId?: string; ghlOpportunityId?: string;
  fuente?: string;
  creado: string;
}

export interface Contratista {
  id: string;                 // C-001
  contactoId: string;
  nombre: string;
  empresa?: string;
  whatsapp: string;
  categorias: string[];
  zonas: string[];
  registroDaco?: string;
  seguro?: string;
  licencias?: string;
  experienciaAnos?: number;
  capacidadMensual?: string;
  portfolio?: string;
  estado: "nuevo" | "documentos" | "entrevista" | "levantamiento" | "verified" | "preferido" | "pausado" | "descartado";
  rating?: number;
  proyectos: number;
  creado: string;
}

const ahora = () => new Date().toISOString();

export const almacen = {
  contactos(): Contacto[] { return Object.values(leer<Record<string, Contacto>>("contactos.json", {})); },
  contacto(id: string): Contacto | undefined {
    return leer<Record<string, Contacto>>("contactos.json", {})[id];
  },
  guardarContacto(c: Contacto) {
    const todos = leer<Record<string, Contacto>>("contactos.json", {});
    todos[c.id] = { ...c, actualizado: ahora() };
    escribir("contactos.json", todos);
  },
  obtenerOCrearContacto(canal: Canal, identificador: string): Contacto {
    const id = `${canal}:${identificador}`;
    const existente = this.contacto(id);
    if (existente) return existente;
    const nuevo: Contacto = { id, canal, identificador, notas: [], humano: false, creado: ahora(), actualizado: ahora() };
    if (canal === "whatsapp") nuevo.telefono = identificador;
    this.guardarContacto(nuevo);
    return nuevo;
  },

  /** Ids de contacto con conversación tocada desde `desdeMs` (epoch). */
  conversacionesDesde(desdeMs: number): string[] {
    return Object.values(leer<Record<string, Conversacion>>("conversaciones.json", {})).filter((c) => new Date(c.actualizado).getTime() >= desdeMs).map((c) => c.contactoId);
  },
  conversacion(contactoId: string): Conversacion {
    return leer<Record<string, Conversacion>>("conversaciones.json", {})[contactoId] ?? { contactoId, mensajes: [], actualizado: ahora() };
  },
  guardarConversacion(c: Conversacion) {
    const todas = leer<Record<string, Conversacion>>("conversaciones.json", {});
    // Nos quedamos con los últimos 40 turnos para no crecer sin límite; el resto lo resume el CRM.
    todas[c.contactoId] = { ...c, mensajes: c.mensajes.slice(-40), actualizado: ahora() };
    escribir("conversaciones.json", todas);
  },

  trabajos(): Trabajo[] { return leer<Trabajo[]>("trabajos.json", []); },
  guardarTrabajo(t: Trabajo) {
    const todos = this.trabajos().filter((x) => x.id !== t.id);
    todos.push(t);
    escribir("trabajos.json", todos);
  },
  nuevoIdTrabajo(): string {
    return "R-" + String(this.trabajos().length + 1).padStart(4, "0");
  },

  candidatos(): Candidato[] { return leer<Candidato[]>("candidatos.json", []); },
  guardarCandidato(c: Candidato) {
    const todos = this.candidatos().filter((x) => x.id !== c.id);
    todos.push(c);
    escribir("candidatos.json", todos);
  },

  proyectos(): Proyecto[] { return leer<Proyecto[]>("proyectos.json", []); },
  guardarProyecto(p: Proyecto) { const t = this.proyectos().filter((x) => x.id !== p.id); t.push(p); escribir("proyectos.json", t); },
  nuevoIdProyecto(): string { return "PR-" + String(this.proyectos().length + 1).padStart(4, "0"); },

  contratistas(): Contratista[] { return leer<Contratista[]>("contratistas.json", []); },
  guardarContratista(c: Contratista) { const t = this.contratistas().filter((x) => x.id !== c.id); t.push(c); escribir("contratistas.json", t); },
  nuevoIdContratista(): string { return "C-" + String(this.contratistas().length + 1).padStart(3, "0"); },

  listaEspera(): ListaEspera[] { return leer<ListaEspera[]>("lista-espera.json", []); },
  agregarListaEspera(e: ListaEspera) {
    const todos = this.listaEspera();
    todos.push(e);
    escribir("lista-espera.json", todos);
  },
};
