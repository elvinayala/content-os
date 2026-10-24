import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/lib/pulse/db";

import { pulseConsentimientos } from "./schema";

// Escribe el consentimiento DESDE EL SERVIDOR (IP, navegador y hora los pone el servidor/la base, nunca el cliente).
// Si otra sesión deja un registro común (lib/consentimientos), basta con cambiar el cuerpo de estas dos funciones.

export type TipoConsentimiento =
  | "terminos_app"
  | "privacidad_app"
  | "privacidad_empleado"
  | "avisos_push"
  | "grabacion_llamada_ia";

export async function registrarConsentimiento(p: {
  persona: string;
  tipo: TipoConsentimiento;
  accion?: "acepto" | "revoco";
  version: string;
  textoCasilla: string;
  origen: string;
}): Promise<boolean> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const d = await db();
    await d.insert(pulseConsentimientos).values({
      persona: p.persona.trim().toLowerCase().slice(0, 200),
      tipo: p.tipo,
      accion: p.accion ?? "acepto",
      versionDocumento: p.version,
      textoCasilla: p.textoCasilla.slice(0, 2000),
      origen: p.origen.slice(0, 500),
      ip,
      userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
    });
    return true;
  } catch (e) {
    // Sin la migración 0045 aplicada la tabla no existe: no tumba la pantalla, pero queda en el log.
    console.error("[legal] no se pudo registrar el consentimiento", p.tipo, e);
    return false;
  }
}

// ¿La última acción de esta persona para este tipo y versión es "acepto"? null = no se pudo leer (tabla ausente):
// quien llama decide no bloquear.
export async function aceptoVersion(persona: string, tipo: TipoConsentimiento, version: string): Promise<boolean | null> {
  try {
    const d = await db();
    const [ultima] = await d
      .select({ accion: pulseConsentimientos.accion })
      .from(pulseConsentimientos)
      .where(and(eq(pulseConsentimientos.persona, persona.trim().toLowerCase()), eq(pulseConsentimientos.tipo, tipo), eq(pulseConsentimientos.versionDocumento, version)))
      .orderBy(desc(pulseConsentimientos.fechaHora))
      .limit(1);
    return ultima?.accion === "acepto";
  } catch (e) {
    console.error("[legal] no se pudo leer el consentimiento", tipo, e);
    return null;
  }
}
