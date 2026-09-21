// Esquema del Portal AutoFlow (Drizzle). Vive en la misma base de Pulse (Supabase; PGlite en
// dev) porque data/*.json es efímero en Vercel. Prefijo autoflow_ (tablesFilter en
// drizzle.config.ts). Sin "server-only" ni imports "@/": lo carga drizzle-kit fuera de Next.
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import type { TurnoLlamada, UrlsPortal } from "./types";

export const autoflowPortales = pgTable(
  "autoflow_portales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    negocio: text("negocio").notNull(),
    nicho: text("nicho"),
    contacto: text("contacto"),
    color: text("color").notNull().default("#10b981"),
    asistente: text("asistente").notNull().default("Asistente"),
    modo: text("modo").notNull().default("demo"), // demo | produccion
    activo: boolean("activo").notNull().default(true),
    agentIdVoz: text("agent_id_voz"),
    urls: jsonb("urls").$type<UrlsPortal>().notNull().default({}),
    leadsEjemploCargados: boolean("leads_ejemplo_cargados").notNull().default(false),
    pipedriveDealId: text("pipedrive_deal_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("autoflow_portales_slug").on(t.slug), index("autoflow_portales_agente").on(t.agentIdVoz)],
);

export const autoflowLlamadas = pgTable(
  "autoflow_llamadas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portalId: uuid("portal_id")
      .notNull()
      .references(() => autoflowPortales.id, { onDelete: "cascade" }),
    callId: text("call_id").notNull(),
    agentId: text("agent_id"),
    estado: text("estado").notNull().default("iniciada"), // iniciada | terminada | analizada | error
    inicio: timestamp("inicio", { withTimezone: true }),
    fin: timestamp("fin", { withTimezone: true }),
    duracionSeg: integer("duracion_seg"),
    turnos: jsonb("turnos").$type<TurnoLlamada[]>().notNull().default([]),
    resumen: text("resumen"),
    resultado: text("resultado"),
    exitosa: boolean("exitosa"),
    sentimiento: text("sentimiento"),
    grabacionUrl: text("grabacion_url"),
    datosExtraidos: jsonb("datos_extraidos").$type<Record<string, unknown>>(),
    latenciaP50Ms: integer("latencia_p50_ms"),
    latenciaP95Ms: integer("latencia_p95_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("autoflow_llamadas_call").on(t.callId), index("autoflow_llamadas_portal").on(t.portalId, t.inicio)],
);

export const autoflowLeads = pgTable(
  "autoflow_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portalId: uuid("portal_id")
      .notNull()
      .references(() => autoflowPortales.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    telefono: text("telefono"),
    email: text("email"),
    interes: text("interes"),
    canal: text("canal").notNull().default("manual"),
    etapa: text("etapa").notNull().default("nuevo"),
    esEjemplo: boolean("es_ejemplo").notNull().default(false),
    origenRef: text("origen_ref"),
    nota: text("nota"),
    hora: text("hora"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("autoflow_leads_origen").on(t.portalId, t.origenRef), index("autoflow_leads_portal").on(t.portalId)],
);

export const autoflowSolicitudes = pgTable(
  "autoflow_solicitudes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portalId: uuid("portal_id")
      .notNull()
      .references(() => autoflowPortales.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    autor: text("autor"),
    estado: text("estado").notNull().default("recibida"), // recibida | en_progreso | lista
    respuesta: text("respuesta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("autoflow_solicitudes_portal").on(t.portalId, t.createdAt)],
);

export const autoflowChats = pgTable(
  "autoflow_chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portalId: uuid("portal_id")
      .notNull()
      .references(() => autoflowPortales.id, { onDelete: "cascade" }),
    sesionId: text("sesion_id").notNull(),
    mensajes: integer("mensajes").notNull().default(0),
    lead: boolean("lead").notNull().default(false),
    ultimoMensajeAt: timestamp("ultimo_mensaje_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("autoflow_chats_sesion").on(t.portalId, t.sesionId)],
);
