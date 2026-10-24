import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { emailNormalizado, metaDeHeaders, type TipoConsentimiento as TipoRegistro } from "@/lib/consentimientos/reglas";
import { legalConsentimientos } from "@/lib/consentimientos/schema";
import { db } from "@/lib/pulse/db";

// Escribe el consentimiento DESDE EL SERVIDOR (IP y navegador del request; la hora la pone la base con un trigger).
// Desde el 24/oct/2026 todo va al registro común `legal_consentimientos` (lib/consentimientos, migración 0045,
// solo de agregar). Esta firma se queda igual para Ritmo, la app de clientes LU, el Portal AutoFlow y los avisos push.

export type TipoConsentimiento =
  | "terminos_app"
  | "privacidad_app"
  | "privacidad_empleado"
  | "avisos_push"
  | "grabacion_llamada_ia";

// Tipo de esta API → tipo del registro común. Términos y privacidad de la app LU son los mismos documentos
// (/terminos y /privacidad) que aceptan los formularios de /f/.
const TIPO_REGISTRO: Record<TipoConsentimiento, TipoRegistro> = {
  terminos_app: "terminos",
  privacidad_app: "privacidad",
  privacidad_empleado: "privacidad_equipo",
  avisos_push: "avisos_push",
  grabacion_llamada_ia: "grabacion_ia",
};

const personaNormalizada = (persona: string) => persona.trim().toLowerCase().slice(0, 200);

export async function registrarConsentimiento(p: {
  persona: string;
  tipo: TipoConsentimiento;
  accion?: "acepto" | "revoco";
  version: string;
  textoCasilla: string;
  origen: string;
}): Promise<boolean> {
  try {
    const meta = metaDeHeaders(await headers());
    const persona = personaNormalizada(p.persona);
    const d = await db();
    await d.insert(legalConsentimientos).values({
      // Quién: el correo (Ritmo) o "<tipo>:<id>" cuando no hay contacto ("cliente:<itemId>", "portal:<slug>:<quien>").
      persona,
      email: emailNormalizado(persona),
      telefono: null,
      tipo: TIPO_REGISTRO[p.tipo],
      accion: p.accion ?? "acepto",
      versionDocumento: p.version,
      textoCasilla: p.textoCasilla.slice(0, 1000),
      origen: p.origen.slice(0, 300),
      // Sin referencia: cada aceptación/revocación es su propia fila (el índice único solo aplica con referencia).
      referencia: null,
      ip: meta.ip?.slice(0, 80) ?? null,
      userAgent: meta.userAgent?.slice(0, 500) ?? null,
      datos: { tipoOrigen: p.tipo },
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
      .select({ accion: legalConsentimientos.accion })
      .from(legalConsentimientos)
      .where(
        and(
          eq(legalConsentimientos.persona, personaNormalizada(persona)),
          eq(legalConsentimientos.tipo, TIPO_REGISTRO[tipo]),
          eq(legalConsentimientos.versionDocumento, version),
        ),
      )
      .orderBy(desc(legalConsentimientos.createdAt))
      .limit(1);
    return ultima?.accion === "acepto";
  } catch (e) {
    console.error("[legal] no se pudo leer el consentimiento", tipo, e);
    return null;
  }
}
