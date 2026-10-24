import "server-only";

import { desc, eq, or, type SQL } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { type Casilla, emailNormalizado, filasAceptacion, metaDeHeaders, personaDe, type TipoConsentimiento, telefonoNormalizado, VERSION_DOCUMENTOS } from "./reglas";
import { legalConsentimientos } from "./schema";

export type Consentimiento = typeof legalConsentimientos.$inferSelect;

/**
 * Escribe (solo agrega) una fila por casilla aceptada. Para cualquier pantalla pública que recoja datos:
 * formularios de /f/, Portal AutoFlow, app de clientes LU. `headers` = los del request (IP y navegador
 * los pone el servidor). Con `referencia` (p. ej. "form:<slug>:<token>") repetir la llamada no duplica.
 * Devuelve cuántas filas nuevas quedaron.
 */
export async function registrarConsentimientos(v: {
  casillas: Casilla[];
  aceptadas: readonly string[];
  email?: unknown;
  telefono?: unknown;
  origen: string;
  referencia?: string | null;
  headers: { get(n: string): string | null };
  datos?: Record<string, string> | null;
}): Promise<number> {
  const filas = filasAceptacion({ ...v, ...metaDeHeaders(v.headers) });
  if (!filas.length) return 0;
  const d = await db();
  const r = await d.insert(legalConsentimientos).values(filas).onConflictDoNothing().returning({ id: legalConsentimientos.id });
  return r.length;
}

/** Revocar (p. ej. "STOP" por WhatsApp o una baja de correo): otra fila, nunca se borra la aceptación. */
export async function revocarConsentimiento(v: {
  tipo: TipoConsentimiento;
  email?: unknown;
  telefono?: unknown;
  origen: string;
  referencia?: string | null;
  texto: string;
  headers?: { get(n: string): string | null };
}): Promise<void> {
  const email = emailNormalizado(v.email);
  const telefono = telefonoNormalizado(v.telefono);
  const meta = v.headers ? metaDeHeaders(v.headers) : { ip: null, userAgent: null };
  const d = await db();
  await d
    .insert(legalConsentimientos)
    .values({
      persona: personaDe({ email, telefono, referencia: v.referencia }),
      email,
      telefono,
      tipo: v.tipo,
      accion: "revoco",
      versionDocumento: VERSION_DOCUMENTOS,
      textoCasilla: v.texto.slice(0, 1000),
      origen: v.origen.slice(0, 300),
      referencia: v.referencia?.slice(0, 200) ?? null,
      ip: meta.ip,
      userAgent: meta.userAgent,
    })
    .onConflictDoNothing();
}

/** Historial de una persona por su e-mail o su teléfono (más reciente primero), para probar qué aceptó y cuándo. */
export async function consentimientosDe(contacto: { email?: unknown; telefono?: unknown }): Promise<Consentimiento[]> {
  const email = emailNormalizado(contacto.email);
  const telefono = telefonoNormalizado(contacto.telefono);
  const por: SQL[] = [];
  if (email) por.push(eq(legalConsentimientos.email, email));
  if (telefono) por.push(eq(legalConsentimientos.telefono, telefono));
  if (!por.length) return [];
  const d = await db();
  return d.select().from(legalConsentimientos).where(or(...por)).orderBy(desc(legalConsentimientos.createdAt));
}

/** ¿Tiene hoy vigente este consentimiento? (la última fila de ese tipo es "acepto"). Para antes de mandar marketing. */
export async function tieneConsentimiento(contacto: { email?: unknown; telefono?: unknown }, tipo: TipoConsentimiento): Promise<boolean> {
  const ultima = (await consentimientosDe(contacto)).find((c) => c.tipo === tipo);
  return ultima?.accion === "acepto";
}
