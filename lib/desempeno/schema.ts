// Esquema de Desempeño (ponche + métricas por puesto + score) en la base de Pulse (Drizzle).
// Prefijo desempeno_ (tablesFilter en drizzle.config.ts). Sin "server-only" ni imports "@/":
// lo carga drizzle-kit fuera de Next.
import { boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { pulseUsers } from "../pulse/schema";

// Quién se mide: el puesto define el departamento y los KPIs (lib/desempeno/reglas.ts → PUESTOS).
// El horario va en hora de PR (9-6 PR = 8-5 Colombia): una sola zona, sin cambios de hora.
export const desempenoPerfiles = pgTable("desempeno_perfiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => pulseUsers.id, { onDelete: "cascade" }),
  puesto: text("puesto").notNull(),
  liderId: uuid("lider_id").references(() => pulseUsers.id, { onDelete: "set null" }),
  horaEntrada: text("hora_entrada").notNull().default("09:00"),
  horaSalida: text("hora_salida").notNull().default("18:00"),
  diasLaborables: jsonb("dias_laborables").$type<number[]>().notNull().default([1, 2, 3, 4, 5]),
  tipoContrato: text("tipo_contrato").notNull().default("contratista"), // contratista | nomina | eor
  fechaIngreso: text("fecha_ingreso"), // YYYY-MM-DD
  activo: boolean("activo").notNull().default(true),
  // Desde cuándo se mide (día PR en que se activó el perfil): los días anteriores no cuentan.
  desde: text("desde").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cada entrada/salida. La hora la pone el servidor. Varias por día (horario flexible).
// Una salida olvidada se corrige después (`correccion`: pendiente → aprobada | rechazada por el líder).
export const desempenoPonches = pgTable(
  "desempeno_ponches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    fecha: text("fecha").notNull(), // día PR de la entrada (YYYY-MM-DD)
    entradaAt: timestamp("entrada_at", { withTimezone: true }).notNull().defaultNow(),
    salidaAt: timestamp("salida_at", { withTimezone: true }),
    ipEntrada: text("ip_entrada"),
    ipSalida: text("ip_salida"),
    userAgent: text("user_agent"),
    correccion: text("correccion"), // null | pendiente | aprobada | rechazada
    correccionPor: uuid("correccion_por").references(() => pulseUsers.id, { onDelete: "set null" }),
    nota: text("nota"),
  },
  (t) => [index("desempeno_ponches_user_fecha").on(t.userId, t.fecha)],
);

// Métricas que vienen de fuentes externas (Meta, n8n, Chatwoot, Slack…), una fila por persona/día/KPI.
// Las de Pulse (tablero Producción) se calculan en vivo desde la actividad y no se guardan.
export const desempenoMetricas = pgTable(
  "desempeno_metricas",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    fecha: text("fecha").notNull(),
    kpi: text("kpi").notNull(),
    valor: doublePrecision("valor"),
    fuente: text("fuente").notNull(),
    detalle: jsonb("detalle"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("desempeno_metricas_pk").on(t.userId, t.fecha, t.kpi)],
);

// Metas y pesos por puesto (override de los valores por defecto de reglas.ts). Las edita Carilin.
export const desempenoMetas = pgTable(
  "desempeno_metas",
  {
    puesto: text("puesto").notNull(),
    kpi: text("kpi").notNull(),
    meta: doublePrecision("meta").notNull(),
    peso: integer("peso").notNull(),
    updatedBy: uuid("updated_by").references(() => pulseUsers.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("desempeno_metas_pk").on(t.puesto, t.kpi)],
);

// Lo único que escribe el empleado: bloqueos y los datos que el sistema no ve (al marcar salida).
export const desempenoReportes = pgTable(
  "desempeno_reportes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    fecha: text("fecha").notNull(),
    bloqueos: text("bloqueos"),
    datos: jsonb("datos").$type<Record<string, number>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("desempeno_reportes_pk").on(t.userId, t.fecha)],
);

// Bitácora append-only (evidencia): ponches, correcciones, cambios de perfil/metas.
export const desempenoEventos = pgTable(
  "desempeno_eventos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    actorId: uuid("actor_id"),
    tipo: text("tipo").notNull(),
    datos: jsonb("datos"),
    ip: text("ip"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desempeno_eventos_user_at").on(t.userId, t.at)],
);
