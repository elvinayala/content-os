// Esquema del agente de onboarding de AI Borinquen (Drizzle). Misma base de Pulse (Supabase; PGlite en
// dev). Prefijo aib_ (tablesFilter en drizzle.config.ts). Sin "server-only" ni imports "@/": lo carga
// drizzle-kit fuera de Next.
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/** Un turno de la conversación tal como se le vuelve a pasar a Claude (solo texto). */
export interface TurnoAib {
  role: "user" | "assistant";
  content: string;
  at: string;
}

/** Lo que el cliente contestó en las encuestas: { "10": {...}, "30": {...} }. */
export type RespuestasAib = Record<string, Record<string, string>>;

export const aibOnboardingClientes = pgTable(
  "aib_onboarding_clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Item del tablero AI BORINQUEN en Pulse; null si nos escribió alguien que no está en el tablero.
    pulseItemId: text("pulse_item_id"),
    nombre: text("nombre").notNull(),
    empresa: text("empresa"),
    telefono: text("telefono").notNull(), // solo dígitos, con código de país
    email: text("email"),
    servicio: text("servicio"), // grupo del tablero: MARKETING, DESARROLLO…
    fechaPago: text("fecha_pago"), // YYYY-MM-DD (hora de PR)
    estado: text("estado").notNull().default("activo"), // activo | historico | baja
    bienvenidaAt: timestamp("bienvenida_at", { withTimezone: true }),
    encuesta10At: timestamp("encuesta10_at", { withTimezone: true }),
    encuesta30At: timestamp("encuesta30_at", { withTimezone: true }),
    encuestaActiva: text("encuesta_activa"), // "10" | "30" | null
    respuestas: jsonb("respuestas").$type<RespuestasAib>().notNull().default({}),
    historial: jsonb("historial").$type<TurnoAib[]>().notNull().default([]),
    conversacionId: text("conversacion_id"), // conversación de Zernio
    humanoHasta: timestamp("humano_hasta", { withTimezone: true }), // el agente calla mientras un humano atiende
    ultimoMensajeAt: timestamp("ultimo_mensaje_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("aib_onboarding_tel").on(t.telefono), index("aib_onboarding_pulse").on(t.pulseItemId)],
);
