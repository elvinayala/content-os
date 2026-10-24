// Consentimientos (24/oct/2026, Elvin: "no quiero que mi sitio web sea demandado"; skill legal-sitio-web,
// puntos 4 y 5). Casillas separadas, nunca marcadas por defecto, y un registro SOLO DE AGREGAR de cada
// aceptación con el texto exacto que vio la persona, la versión de los documentos, IP, navegador y hora
// del servidor. Lo usan los formularios de /f/ y, después, el Portal AutoFlow y la app de clientes LU.
// Puro (sin server-only ni imports "@/"): lo cargan la página, el servidor, drizzle-kit y los tests
// (tests/consentimientos.test.mjs).

import { CASILLAS, ENTIDAD, LEGAL } from "../legal/versiones.ts";

// Las tres últimas vienen de lib/legal/consentimiento.ts (Ritmo, app LU, Portal AutoFlow): aviso de privacidad
// del equipo, avisos push de la app de clientes y "hablas con una IA y la llamada se graba" del Portal. Son
// avisos distintos de `privacidad` y de `llamadas_ia` (permiso TCPA para recibir llamadas), por eso van aparte.
export const TIPOS_CONSENTIMIENTO = ["terminos", "privacidad", "marketing_sms", "marketing_email", "llamadas_ia", "cookies", "privacidad_equipo", "avisos_push", "grabacion_ia"] as const;
export type TipoConsentimiento = (typeof TIPOS_CONSENTIMIENTO)[number];
/** Las que una persona puede dejar sin marcar (nunca condición para enviar ni para comprar: TCPA). */
export const TIPOS_OPCIONALES = ["marketing_sms", "marketing_email", "llamadas_ia"] as const;
export type TipoOpcional = (typeof TIPOS_OPCIONALES)[number];

/** Páginas legales públicas (app/(legal)/). Una sola fuente: lib/legal/versiones.ts. */
export const RUTAS_LEGALES = {
  terminos: LEGAL.terminos.ruta,
  privacidad: LEGAL.privacidad.ruta,
  privacidadEquipo: LEGAL.privacidadEquipo.ruta,
  cookies: LEGAL.cookies.ruta,
  reembolsos: LEGAL.reembolsos.ruta,
  accesibilidad: LEGAL.accesibilidad.ruta,
} as const;

/**
 * Versión de los documentos que vio la persona (va en cada fila del registro). Sale de lib/legal/versiones.ts:
 * si una página cambia, se sube su versión allí y las aceptaciones nuevas quedan con la nueva. Cada casilla
 * guarda la versión de SU documento (`Casilla.version`); esta queda como valor por defecto.
 */
export const VERSION_DOCUMENTOS: string = LEGAL.terminos.version;

/** Entidad legal que firma los documentos. [PENDIENTE ELVIN] confirmar que EA Market LLC cubre todas las marcas. */
export const ENTIDAD_LEGAL = ENTIDAD;

/** Nombre comercial que la persona reconoce en la casilla de marketing, según la marca del formulario. */
export function nombreMarca(marca: string | null | undefined): string {
  switch (marca) {
    case "level_up":
      return "Level Up Media";
    case "ai_borinquen":
      return "AI Borinquen";
    default:
      return ENTIDAD_LEGAL;
  }
}

export interface Casilla {
  tipo: TipoConsentimiento;
  obligatoria: boolean;
  /** El texto exacto que se ve al lado de la casilla (es lo que se guarda en el registro). */
  texto: string;
  /** Parte del texto que es enlace a la página legal (debe aparecer tal cual dentro de `texto`). */
  enlace?: { texto: string; href: string };
  /** Versión del documento que acepta (lib/legal/versiones.ts); si falta, VERSION_DOCUMENTOS. */
  version?: string;
}

/** Qué casillas lleva un formulario (o el portal, o la app). Términos y privacidad siempre van. */
export interface OpcionesLegales {
  /** Casillas opcionales de marketing que se ofrecen (desmarcadas). */
  marketing?: TipoOpcional[];
  /** Solo para algo que NO recoge datos de nadie (p. ej. una página sin preguntas). */
  apagado?: boolean;
}

export function casillaDe(tipo: TipoConsentimiento, marca?: string | null): Casilla {
  const quien = nombreMarca(marca);
  switch (tipo) {
    case "terminos":
      return { tipo, obligatoria: true, texto: CASILLAS.terminosApp, enlace: { texto: "Términos y condiciones", href: RUTAS_LEGALES.terminos }, version: LEGAL.terminos.version };
    case "privacidad":
      return { tipo, obligatoria: true, texto: CASILLAS.privacidadApp, enlace: { texto: "Política de privacidad", href: RUTAS_LEGALES.privacidad }, version: LEGAL.privacidad.version };
    case "marketing_sms":
      return {
        tipo,
        obligatoria: false,
        texto: `Acepto recibir mensajes de marketing de ${quien} por SMS, WhatsApp y llamadas (incluida voz automatizada o de IA) al número que di. No es condición de compra. Responde STOP para salir; pueden aplicar cargos de tu proveedor.`,
      };
    case "marketing_email":
      return { tipo, obligatoria: false, texto: `Acepto recibir correos promocionales de ${quien}. Puedes darte de baja en cualquier momento.` };
    case "llamadas_ia":
      return {
        tipo,
        obligatoria: false,
        texto: `Acepto recibir llamadas de ${quien} con voz automatizada o de inteligencia artificial al número que di. No es condición de compra.`,
      };
    case "cookies":
      return { tipo, obligatoria: false, texto: "Acepto las cookies y píxeles no esenciales.", enlace: { texto: "cookies", href: RUTAS_LEGALES.cookies }, version: LEGAL.cookies.version };
    case "privacidad_equipo":
      return { tipo, obligatoria: true, texto: CASILLAS.privacidadEmpleado, enlace: { texto: "Aviso de privacidad del equipo", href: RUTAS_LEGALES.privacidadEquipo }, version: LEGAL.privacidadEquipo.version };
    case "avisos_push":
      return { tipo, obligatoria: false, texto: 'Botón "Activar notificaciones" en la app + permiso de notificaciones del sistema', version: LEGAL.privacidad.version };
    case "grabacion_ia":
      return { tipo, obligatoria: true, texto: CASILLAS.grabacionLlamada, version: LEGAL.privacidad.version };
  }
}

/** Las casillas en el orden en que se muestran: las dos obligatorias y después las opcionales pedidas. */
export function casillasDe(o: OpcionesLegales & { marca?: string | null } = {}): Casilla[] {
  if (o.apagado) return [];
  const opcionales = [...new Set(o.marketing ?? [])].filter((t) => (TIPOS_OPCIONALES as readonly string[]).includes(t));
  return [casillaDe("terminos", o.marca), casillaDe("privacidad", o.marca), ...opcionales.map((t) => casillaDe(t, o.marca))];
}

/** Lo que llega del navegador → solo tipos conocidos y que esta lista de casillas ofrece. Nunca se confía en el texto del cliente. */
export function aceptadasValidas(casillas: Casilla[], recibido: unknown): TipoConsentimiento[] {
  if (!Array.isArray(recibido)) return [];
  const ofrecidas = new Set(casillas.map((c) => c.tipo));
  return [...new Set(recibido.filter((x): x is TipoConsentimiento => typeof x === "string" && ofrecidas.has(x as TipoConsentimiento)))];
}

/** Las obligatorias que faltan por marcar (vacío = puede seguir). */
export function faltanObligatorias(casillas: Casilla[], aceptadas: readonly string[]): TipoConsentimiento[] {
  const s = new Set(aceptadas);
  return casillas.filter((c) => c.obligatoria && !s.has(c.tipo)).map((c) => c.tipo);
}

export const MENSAJE_FALTAN = "Para seguir, marca que aceptas los Términos y condiciones y la Política de privacidad.";

// ---------- Persona ----------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function emailNormalizado(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return EMAIL.test(s) ? s.slice(0, 200) : null;
}

/** Teléfono en E.164 (+1 para los 10 dígitos de PR/EE.UU.), o null si no parece un teléfono. */
export function telefonoNormalizado(v: unknown): string | null {
  const d = typeof v === "string" ? v.replace(/\D/g, "") : "";
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length >= 8 && d.length <= 15) return `+${d}`;
  return null;
}

/**
 * Clave de la persona en el registro: el e-mail si hay, si no el teléfono, si no la referencia (p. ej. la
 * encuesta de fin de onboarding, que llega sin contacto y se identifica por `?origen=`).
 */
export function personaDe(v: { email?: unknown; telefono?: unknown; referencia?: string | null }): string {
  return emailNormalizado(v.email) ?? telefonoNormalizado(v.telefono) ?? `ref:${(v.referencia ?? "anonimo").slice(0, 120)}`;
}

// ---------- Filas del registro ----------

export interface FilaConsentimiento {
  persona: string;
  email: string | null;
  telefono: string | null;
  tipo: TipoConsentimiento;
  accion: "acepto" | "revoco";
  versionDocumento: string;
  textoCasilla: string;
  origen: string;
  referencia: string | null;
  ip: string | null;
  userAgent: string | null;
  datos: Record<string, string> | null;
}

/**
 * Una fila por casilla aceptada, con el texto que tenía la casilla del lado del SERVIDOR (no el del
 * navegador). Las opcionales que no marcó no se guardan: sin fila no hay consentimiento.
 */
export function filasAceptacion(v: {
  casillas: Casilla[];
  aceptadas: readonly string[];
  email?: unknown;
  telefono?: unknown;
  origen: string;
  referencia?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  datos?: Record<string, string> | null;
  version?: string;
}): FilaConsentimiento[] {
  const s = new Set(v.aceptadas);
  const email = emailNormalizado(v.email);
  const telefono = telefonoNormalizado(v.telefono);
  const persona = personaDe({ email, telefono, referencia: v.referencia });
  return v.casillas
    .filter((c) => s.has(c.tipo))
    .map((c) => ({
      persona,
      email,
      telefono,
      tipo: c.tipo,
      accion: "acepto" as const,
      versionDocumento: v.version ?? c.version ?? VERSION_DOCUMENTOS,
      textoCasilla: c.texto,
      origen: v.origen.slice(0, 300),
      referencia: v.referencia?.slice(0, 200) ?? null,
      ip: v.ip?.slice(0, 80) ?? null,
      userAgent: v.userAgent?.slice(0, 500) ?? null,
      datos: v.datos ?? null,
    }));
}

/** IP y navegador de un request (los pone el servidor; nunca los manda el navegador en el cuerpo). */
export function metaDeHeaders(h: { get(n: string): string | null }): { ip: string | null; userAgent: string | null } {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent") };
}
