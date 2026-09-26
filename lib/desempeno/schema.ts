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
  empresa: text("empresa").notNull().default("level_up"), // level_up | ai_borinquen (misma plataforma, separado)
  slackId: text("slack_id"), // para los avisos del bot (el bot no puede buscar por correo); se busca solo por nombre
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

// ─── Ficha del empleado (RR.HH., 25/sep/2026) ──────────────────────────────────────────────────
// Solo empleados de operaciones con sueldo fijo. La llena Yaileen (RR.HH.); la ven la vista
// maestra y la propia persona. Salario en USD.
export const desempenoFichas = pgTable("desempeno_fichas", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => pulseUsers.id, { onDelete: "cascade" }),
  fotoPath: text("foto_path"),
  telefono: text("telefono"),
  telefonoAlterno: text("telefono_alterno"),
  ciudad: text("ciudad"),
  pais: text("pais"),
  documentoTipo: text("documento_tipo"), // cédula, pasaporte, licencia…
  documentoNumero: text("documento_numero"),
  salarioMensual: doublePrecision("salario_mensual"), // USD
  notas: text("notas"),
  contactoEmergencia: text("contacto_emergencia"), // nombre y teléfono
  // Alta de empleado nuevo: al firmar contrato RR.HH. lo registra y la persona completa su ficha con el
  // link de bienvenida. Mientras sea null, Ritmo la manda a /ritmo/bienvenida.
  completadaAt: timestamp("completada_at", { withTimezone: true }),
  updatedBy: uuid("updated_by").references(() => pulseUsers.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Documentos, certificaciones, entrenamientos (videos incluidos) y demás archivos de la ficha.
// Bucket privado "pulse" en ruta ritmo/<userId>/<id>-<nombre>.
export const desempenoArchivos = pgTable(
  "desempeno_archivos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    categoria: text("categoria").notNull(), // identificacion | contrato | certificacion | entrenamiento | nomina | otro
    nombre: text("nombre").notNull(),
    storagePath: text("storage_path").notNull(),
    mime: text("mime"),
    bytes: integer("bytes"),
    subidoPor: uuid("subido_por").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desempeno_archivos_user").on(t.userId, t.createdAt)],
);

// Ausencias que registra RR.HH. (vacaciones, enfermedad, maternidad, personal). El cobro contra los
// saldos (vacaciones / enfermedad / sin paga) lo calcula lib/desempeno/rrhh.ts.
export const desempenoAusencias = pgTable(
  "desempeno_ausencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // vacaciones | enfermedad | maternidad | personal
    desde: text("desde").notNull(),
    hasta: text("hasta").notNull(),
    dias: doublePrecision("dias").notNull(),
    certificado: boolean("certificado").notNull().default(false), // enfermedad con certificado médico válido
    nota: text("nota"),
    registradoPor: uuid("registrado_por").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desempeno_ausencias_user").on(t.userId, t.desde)],
);

// Ajustes de nómina del mes (bono, comisión, descuento…), en USD: + suma, − resta.
export const desempenoAjustes = pgTable(
  "desempeno_ajustes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    mes: text("mes").notNull(), // YYYY-MM
    concepto: text("concepto").notNull(),
    monto: doublePrecision("monto").notNull(),
    createdBy: uuid("created_by").references(() => pulseUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desempeno_ajustes_user_mes").on(t.userId, t.mes)],
);

// Canal ético (25/sep/2026): cualquier persona reporta algo antiético, con su nombre o de forma
// anónima (userId null). SOLO lo ve Elvin (admin): un reporte puede ser sobre un líder o RR.HH.
export const desempenoEtica = pgTable(
  "desempeno_etica",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => pulseUsers.id, { onDelete: "set null" }), // null = anónimo
    categoria: text("categoria").notNull(),
    descripcion: text("descripcion").notNull(),
    involucrados: text("involucrados"),
    estado: text("estado").notNull().default("nuevo"), // nuevo | revisando | cerrado
    notaInterna: text("nota_interna"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desempeno_etica_estado").on(t.estado, t.createdAt)],
);

// Solicitudes a RR.HH. (25/sep/2026): día libre, vacaciones, permiso programado, carta/documento u otro.
// Flujo: la persona pide → su supervisor (lider_id) aprueba → RR.HH. firma. Sin supervisor va directo a
// RR.HH. Al firmar un día libre/vacaciones/permiso con días se registra la ausencia sola.
export const desempenoSolicitudes = pgTable(
  "desempeno_solicitudes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => pulseUsers.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // dia_libre | vacaciones | permiso | documento | otro
    desde: text("desde"),
    hasta: text("hasta"),
    dias: doublePrecision("dias"),
    detalle: text("detalle").notNull(),
    estado: text("estado").notNull(), // supervisor | rrhh | aprobada | rechazada | cancelada
    supervisorId: uuid("supervisor_id").references(() => pulseUsers.id, { onDelete: "set null" }),
    supervisorAt: timestamp("supervisor_at", { withTimezone: true }),
    supervisorNota: text("supervisor_nota"),
    rrhhId: uuid("rrhh_id").references(() => pulseUsers.id, { onDelete: "set null" }),
    rrhhAt: timestamp("rrhh_at", { withTimezone: true }),
    rrhhNota: text("rrhh_nota"),
    ausenciaId: uuid("ausencia_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("desempeno_solicitudes_estado").on(t.estado, t.createdAt), index("desempeno_solicitudes_user").on(t.userId)],
);
