// Leads — el CRM de clientes potenciales que reemplaza a Pipedrive (26/sep/2026), dentro de Pulse
// (mismas cuentas, misma base) pero en tablas propias, separadas de las fichas de clientes.
// Cada fila lleva `marca` (level_up | ai_borinquen): regla de Elvin, las marcas nunca se mezclan.
// Prefijo leads_ (tablesFilter en drizzle.config.ts). Sin "server-only" ni imports "@/": lo carga
// drizzle-kit fuera de Next.
import { sql } from "drizzle-orm";
import { boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { pulseUsers } from "../pulse/schema";

export const leadsEmbudos = pgTable(
  "leads_embudos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marca: text("marca").notNull(),
    nombre: text("nombre").notNull(),
    orden: integer("orden").notNull().default(0),
    archivado: boolean("archivado").notNull().default(false),
    // Días sin moverse en una etapa para marcar el lead "estancado" (el "rotting" de Pipedrive).
    diasEstancado: integer("dias_estancado").notNull().default(7),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_embudos_marca").on(t.marca, t.orden)],
);

export const leadsEtapas = pgTable(
  "leads_etapas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    embudoId: uuid("embudo_id")
      .notNull()
      .references(() => leadsEmbudos.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    orden: integer("orden").notNull().default(0),
    probabilidad: integer("probabilidad").notNull().default(100),
  },
  (t) => [index("leads_etapas_embudo").on(t.embudoId, t.orden)],
);

// Un lead = un trato (deal) de Pipedrive: la persona y la oportunidad en una sola tarjeta.
export const leadsTratos = pgTable(
  "leads_tratos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    marca: text("marca").notNull(),
    embudoId: uuid("embudo_id")
      .notNull()
      .references(() => leadsEmbudos.id, { onDelete: "restrict" }),
    etapaId: uuid("etapa_id")
      .notNull()
      .references(() => leadsEtapas.id, { onDelete: "restrict" }),
    nombre: text("nombre").notNull(), // persona
    negocio: text("negocio"),
    telefono: text("telefono"), // solo dígitos con código de país (llave de WhatsApp)
    email: text("email"),
    valor: integer("valor").notNull().default(0), // USD enteros
    duenoId: uuid("dueno_id").references(() => pulseUsers.id, { onDelete: "set null" }),
    estado: text("estado").notNull().default("abierto"), // abierto | ganado | perdido
    motivoPerdida: text("motivo_perdida"),
    origen: text("origen").notNull().default("manual"), // whatsapp | calendly | quiz | manual | …
    agendoPor: text("agendo_por"), // setter / utm_source
    etiquetas: jsonb("etiquetas").$type<string[]>().notNull().default([]),
    datos: jsonb("datos").$type<Record<string, unknown>>().notNull().default({}), // calendly, respuestas, ids externos
    orden: doublePrecision("orden").notNull().default(0), // posición dentro de la etapa
    etapaDesde: timestamp("etapa_desde", { withTimezone: true }).notNull().defaultNow(),
    proximaActividad: timestamp("proxima_actividad", { withTimezone: true }), // denormalizado para la tarjeta
    ultimoMensaje: timestamp("ultimo_mensaje", { withTimezone: true }),
    noLeidos: integer("no_leidos").notNull().default(0),
    chatId: text("chat_id"), // chat de Timelines (para contestar)
    cuentaWhatsapp: text("cuenta_whatsapp"), // número de WhatsApp de la empresa que lo atiende
    cerradoAt: timestamp("cerrado_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("leads_tratos_tablero").on(t.embudoId, t.estado, t.etapaId, t.orden),
    index("leads_tratos_telefono").on(t.marca, t.telefono),
    // Un solo lead ABIERTO por teléfono y marca: dos mensajes seguidos no crean dos leads.
    uniqueIndex("leads_tratos_tel_abierto").on(t.marca, t.telefono).where(sql`${t.estado} = 'abierto' and ${t.telefono} is not null`),
    index("leads_tratos_email").on(t.marca, t.email),
    index("leads_tratos_dueno").on(t.duenoId, t.estado),
  ],
);

// La línea de tiempo del lead: notas, mensajes de WhatsApp (entran/salen) y cambios del sistema.
export const leadsHistorial = pgTable(
  "leads_historial",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tratoId: uuid("trato_id")
      .notNull()
      .references(() => leadsTratos.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // nota | entrante | saliente | sistema
    texto: text("texto").notNull(),
    autorId: uuid("autor_id").references(() => pulseUsers.id, { onDelete: "set null" }),
    externoId: text("externo_id"), // message_uid de Timelines (sin duplicados)
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_historial_trato").on(t.tratoId, t.createdAt), uniqueIndex("leads_historial_externo").on(t.externoId)],
);

// Seguimientos (las "actividades" de Pipedrive): llamada, reunión, tarea, WhatsApp.
export const leadsActividades = pgTable(
  "leads_actividades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tratoId: uuid("trato_id")
      .notNull()
      .references(() => leadsTratos.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull().default("llamada"), // llamada | reunion | tarea | whatsapp
    asunto: text("asunto").notNull(),
    venceAt: timestamp("vence_at", { withTimezone: true }).notNull(),
    hecha: boolean("hecha").notNull().default(false),
    hechaAt: timestamp("hecha_at", { withTimezone: true }),
    asignadoId: uuid("asignado_id").references(() => pulseUsers.id, { onDelete: "set null" }),
    creadaPor: uuid("creada_por").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_actividades_trato").on(t.tratoId, t.hecha), index("leads_actividades_asignado").on(t.asignadoId, t.hecha, t.venceAt)],
);

// Qué número de WhatsApp (conectado en Timelines) alimenta qué embudo, y quién lo atiende.
export const leadsWhatsapp = pgTable("leads_whatsapp", {
  id: uuid("id").primaryKey().defaultRandom(),
  marca: text("marca").notNull(),
  cuenta: text("cuenta").notNull().unique(), // "17875551234" (dígitos del número de la empresa)
  nombre: text("nombre"),
  embudoId: uuid("embudo_id").references(() => leadsEmbudos.id, { onDelete: "set null" }),
  duenoId: uuid("dueno_id").references(() => pulseUsers.id, { onDelete: "set null" }),
  activo: boolean("activo").notNull().default(true),
});

// Quién entra a Leads de cada marca (admin/editor de Pulse: todo). "mios" = solo sus leads.
export const leadsAcceso = pgTable(
  "leads_acceso",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    marca: text("marca").notNull(),
    alcance: text("alcance").notNull().default("todos"), // todos | mios
  },
  (t) => [uniqueIndex("leads_acceso_pk").on(t.userId, t.marca)],
);

// Lo crudo de cada aviso de Timelines (los últimos días): para afinar el mapeo y auditar.
export const leadsWebhookLog = pgTable("leads_webhook_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  fuente: text("fuente").notNull(),
  marca: text("marca"),
  evento: text("evento"),
  resultado: text("resultado"),
  cuerpo: jsonb("cuerpo").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
