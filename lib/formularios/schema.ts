// Formularios propios (el "Typeform" de la casa, 26/sep/2026). Misma base de Pulse, tablas form_*
// (tablesFilter en drizzle.config.ts). Sin "server-only" ni imports "@/": lo carga drizzle-kit.
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { pulseUsers } from "../pulse/schema";
import type { Apariencia, ConfigFormulario, Respuestas } from "./reglas";

export const formFormularios = pgTable(
  "form_formularios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    titulo: text("titulo").notNull(),
    marca: text("marca").notNull().default("level_up"),
    apariencia: jsonb("apariencia").$type<Apariencia>().notNull(),
    config: jsonb("config").$type<ConfigFormulario>().notNull(),
    // Qué pasa con cada respuesta además de guardarse (ACCIONES en reglas.ts).
    accion: text("accion").notNull().default("ninguna"),
    activo: boolean("activo").notNull().default(true),
    archivado: boolean("archivado").notNull().default(false),
    creadoPor: uuid("creado_por").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("form_formularios_slug").on(t.slug)],
);

export const formRespuestas = pgTable(
  "form_respuestas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formularioId: uuid("formulario_id")
      .notNull()
      .references(() => formFormularios.id, { onDelete: "cascade" }),
    // Token del navegador: reenviar el mismo formulario no duplica.
    token: text("token").notNull(),
    respuestas: jsonb("respuestas").$type<Respuestas>().notNull(),
    // Copia de las preguntas al momento de responder (si después se editan, la respuesta se sigue leyendo bien).
    preguntas: jsonb("preguntas").$type<{ id: string; titulo: string }[]>().notNull(),
    resultado: text("resultado"), // p. ej. "ficha-nueva:<itemId>", "error: …"
    origen: text("origen"), // utm_source / ?origen= del link
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("form_respuestas_token").on(t.formularioId, t.token), index("form_respuestas_form").on(t.formularioId, t.createdAt)],
);
