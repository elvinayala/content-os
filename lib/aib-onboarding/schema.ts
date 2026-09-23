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
    // Legado de la primera versión (fuente = tablero de Pulse). Hoy la fuente es el Calendly de AIB.
    pulseItemId: text("pulse_item_id"),
    // Invitee de Calendly que lo hizo cliente (agendó el onboarding en el Calendly de AI Borinquen).
    calendlyInvitee: text("calendly_invitee"),
    citaAt: timestamp("cita_at", { withTimezone: true }), // hora de la llamada de onboarding
    evento: text("evento"), // nombre del tipo de evento de Calendly
    nombre: text("nombre").notNull(),
    empresa: text("empresa"),
    telefono: text("telefono").notNull(), // solo dígitos, con código de país
    email: text("email"),
    servicio: text("servicio"), // lo que contestó en Calendly, si lo preguntan
    fechaPago: text("fecha_pago"), // YYYY-MM-DD (hora de PR) del día que agendó el onboarding = día 0
    estado: text("estado").notNull().default("activo"), // activo | historico | baja | desconocido
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
