// Esquema de Pulse (Drizzle). Sin "server-only" ni imports "@/" porque lo carga drizzle-kit
// fuera de Next. Todas las tablas llevan prefijo pulse_ (tablesFilter en drizzle.config.ts).
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { SettingsColumna, ValorCelda } from "./types";

export const tipoColumnaEnum = pgEnum("pulse_tipo_columna", [
  "text",
  "long_text",
  "number",
  "status",
  "dropdown",
  "date",
  "people",
  "checkbox",
  "link",
  "email",
  "phone",
  "file",
  "relation",
]);
export const rolEnum = pgEnum("pulse_rol", ["admin", "editor", "miembro"]);
export const tipoActividadEnum = pgEnum("pulse_tipo_actividad", [
  "crear",
  "valor",
  "nombre",
  "mover",
  "eliminar",
  "comentario",
]);

export const pulseUsers = pgTable(
  "pulse_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    nombre: text("nombre").notNull(),
    passwordHash: text("password_hash"), // null = importado de Monday, sin clave todavía
    rol: rolEnum("rol").notNull().default("miembro"),
    activo: boolean("activo").notNull().default(true),
    color: text("color"),
    mondayId: text("monday_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pulse_users_email").on(t.email), uniqueIndex("pulse_users_monday").on(t.mondayId)],
);

export const pulseBoards = pgTable(
  "pulse_boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    color: text("color"),
    position: integer("position").notNull().default(0),
    privado: boolean("privado").notNull().default(false), // true = solo admins + pulse_board_members
    mondayId: text("monday_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pulse_boards_slug").on(t.slug), uniqueIndex("pulse_boards_monday").on(t.mondayId)],
);

// Quién puede ver un tablero privado (los admins siempre pueden).
export const pulseBoardMembers = pgTable(
  "pulse_board_members",
  {
    boardId: uuid("board_id")
      .notNull()
      .references(() => pulseBoards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("pulse_board_members_pk").on(t.boardId, t.userId)],
);

export const pulseColumns = pgTable(
  "pulse_columns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => pulseBoards.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: tipoColumnaEnum("type").notNull(),
    settings: jsonb("settings").$type<SettingsColumna>().notNull().default({}),
    position: integer("position").notNull().default(0),
    width: integer("width").notNull().default(160),
    mondayId: text("monday_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pulse_columns_board").on(t.boardId, t.position),
    uniqueIndex("pulse_columns_monday").on(t.boardId, t.mondayId),
  ],
);

export const pulseGroups = pgTable(
  "pulse_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => pulseBoards.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    color: text("color").notNull().default("grey"),
    position: integer("position").notNull().default(0),
    colapsadoDefault: boolean("colapsado_default").notNull().default(false),
    mondayId: text("monday_id"),
  },
  (t) => [
    index("pulse_groups_board").on(t.boardId, t.position),
    uniqueIndex("pulse_groups_monday").on(t.boardId, t.mondayId),
  ],
);

export const pulseItems = pgTable(
  "pulse_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => pulseBoards.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => pulseGroups.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0), // gaps de 1024
    values: jsonb("values").$type<Record<string, ValorCelda>>().notNull().default({}),
    mondayId: text("monday_id"),
    createdBy: uuid("created_by").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pulse_items_board_group").on(t.boardId, t.groupId, t.position),
    uniqueIndex("pulse_items_monday").on(t.mondayId),
    index("pulse_items_values_gin").using("gin", t.values),
  ],
);

export const pulseActivity = pgTable(
  "pulse_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => pulseItems.id, { onDelete: "cascade" }),
    boardId: uuid("board_id").notNull(),
    columnId: uuid("column_id"),
    tipo: tipoActividadEnum("tipo").notNull(),
    before: jsonb("before"),
    after: jsonb("after"), // comentario: { texto }
    userId: uuid("user_id").references(() => pulseUsers.id, { onDelete: "set null" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pulse_activity_item").on(t.itemId, t.at)],
);

export const pulseFiles = pgTable(
  "pulse_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => pulseItems.id, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => pulseColumns.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    storagePath: text("storage_path").notNull(), // bucket "pulse": <boardId>/<itemId>/<uuid>-<nombre>
    mime: text("mime"),
    bytes: integer("bytes"),
    mondayAssetId: text("monday_asset_id"),
    uploadedBy: uuid("uploaded_by").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pulse_files_item").on(t.itemId, t.columnId), uniqueIndex("pulse_files_monday").on(t.mondayAssetId)],
);
