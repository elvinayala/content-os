// Registro de consentimientos (24/oct/2026, skill legal-sitio-web punto 5). SOLO DE AGREGAR: la migración
// le pone un trigger que rechaza UPDATE y DELETE (revocar = fila nueva con accion "revoco"). Se guarda al
// menos 5 años (la TCPA da 4 para demandar). Sin "server-only" ni imports "@/": lo carga drizzle-kit.
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const legalConsentimientos = pgTable(
  "legal_consentimientos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // E-mail normalizado, si no el teléfono E.164, si no "ref:<referencia>" (personaDe en reglas.ts).
    persona: text("persona").notNull(),
    email: text("email"),
    telefono: text("telefono"),
    // terminos · privacidad · marketing_sms · marketing_email · llamadas_ia · cookies
    tipo: text("tipo").notNull(),
    // acepto · revoco
    accion: text("accion").notNull(),
    versionDocumento: text("version_documento").notNull(),
    // El texto exacto que tenía la casilla al lado (el del servidor, no el que mande el navegador).
    textoCasilla: text("texto_casilla").notNull(),
    // Dónde: "/f/agenda-roger", "portal:<slug>", "app-clientes", "whatsapp:STOP"…
    origen: text("origen").notNull(),
    // Qué envío: el token de la respuesta del formulario, el código del contrato… (evita filas repetidas).
    referencia: text("referencia"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    datos: jsonb("datos").$type<Record<string, string>>(),
    // Hora del servidor (la base), nunca la del navegador.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("legal_consentimientos_persona").on(t.persona, t.createdAt),
    index("legal_consentimientos_email").on(t.email),
    index("legal_consentimientos_telefono").on(t.telefono),
    // Reintentos del mismo envío (guardado a medias + envío final) no duplican la aceptación.
    uniqueIndex("legal_consentimientos_unico").on(t.referencia, t.tipo, t.accion, t.versionDocumento),
  ],
);
