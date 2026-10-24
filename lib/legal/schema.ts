// Registro de consentimientos (skill legal-sitio-web, punto 5; 24/oct/2026). Sin "server-only" ni imports "@/"
// porque lo carga drizzle-kit. Prefijo pulse_ (misma base y tablesFilter de Pulse).
//
// SOLO AGREGAR: nunca se actualiza ni se borra una fila (la migración 0045 pone un trigger que lo impide).
// Revocar = fila nueva con accion "revoco". La fecha la pone la base (UTC), nunca el navegador.
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pulseConsentimientos = pgTable(
  "pulse_consentimientos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Quién: correo o teléfono normalizado, o "<tipo>:<id>" cuando no hay uno (p. ej. "cliente:<itemId>", "portal:<slug>").
    persona: text("persona").notNull(),
    // terminos_app · privacidad_app · privacidad_empleado · avisos_push · grabacion_llamada_ia …
    tipo: text("tipo").notNull(),
    accion: text("accion").notNull(), // acepto | revoco
    versionDocumento: text("version_documento").notNull(),
    textoCasilla: text("texto_casilla").notNull(),
    // URL de la pantalla o canal donde se aceptó.
    origen: text("origen").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    fechaHora: timestamp("fecha_hora", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pulse_consentimientos_persona").on(t.persona, t.tipo), index("pulse_consentimientos_fecha").on(t.fechaHora)],
);
