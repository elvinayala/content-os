// Reglas puras de Leads (sin base ni Next): marcas, teléfonos, semillas de embudos, estados de
// seguimiento y el lector tolerante de los avisos de Timelines.ai. Testeado en tests/leads.test.mjs.

export type Marca = "level_up" | "ai_borinquen";
export const MARCAS: Record<string, { marca: Marca; nombre: string; slug: string }> = {
  "level-up": { marca: "level_up", nombre: "Level Up", slug: "level-up" },
  "ai-borinquen": { marca: "ai_borinquen", nombre: "AI Borinquen", slug: "ai-borinquen" },
};
export const slugDeMarca = (m: Marca) => (m === "level_up" ? "level-up" : "ai-borinquen");

export const MOTIVOS_PERDIDA = ["No contesta", "No califica", "Precio", "Ya compró / ya tiene", "No es el momento", "Otro"] as const;

/** Teléfono a dígitos con código de país (10 dígitos → le antepone 1, PR/EE.UU.). null si no hay número. */
export function normalizarTelefono(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).split("@")[0]; // "17875551234@s.whatsapp.net"
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return `1${d}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

/** "+1 (787) 555-1234" para mostrar. */
export function telefonoLegible(d: string | null | undefined): string {
  if (!d) return "";
  if (d.length === 11 && d.startsWith("1")) return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+${d}`;
}

// Copia EXACTA de los embudos de Pipedrive de Level Up (26/sep/2026, pedido de Elvin: "copia los pipelines
// que tenemos creados en Pipedrive"), mismos nombres y orden de etapas, ordenados por uso. Las etapas de
// cierre del equipo ("Closed", "NO CALIFICA"…) se conservan; Ganado/Perdido siguen disponibles aparte.
// `entrada` = de dónde le llegan los leads (lo que conectaba Pipedrive).
export const SEMILLA: Record<Marca, { nombre: string; etapas: string[]; diasEstancado?: number; entrada?: string }[]> = {
  level_up: [
    { nombre: "WHATSAPP", entrada: "timelines", diasEstancado: 3, etapas: ["New Lead - WhatsApp", "Called 1x", "Called 2x", "Called 3x", "Called 4x", "Called 5x", "Called 6x", "Reasignar", "//", "Grupos", "Appointment Set", "Llamar mas tarde", "No Show", "Follow-Up", "Closed", "NO CALIFICA", "Already Purchased", "ERRORES DEL SISTEMA", "Setters - Reclutamiento", "REMARKETING M"] },
    { nombre: "LUM CLASS DIEGO", entrada: "zapier", diasEstancado: 3, etapas: ["NEW LEAD/LUM CLASS DIEGO", "X1", "X2", "X3", "X4", "X5", "X6", "APPOINTMENT SET", "NO SHOW", "FOLLOW UP", "CLOSED", "ALREADY PURCHASED", "DON'T QUALIFIED"] },
    { nombre: "LUM CLASS FRANKIE", entrada: "zapier", diasEstancado: 3, etapas: ["NEW LEAD / FRANKIE CLASS", "CALLED 1X", "CALLED 2X", "CALLED 3X", "CALLED 4X", "CALLED 5X", "CALLED 6X", "APPOINTMENT SET", "NO SHOW", "FOLLOW UP", "CLOSED", "ALREADY PURCHASED", "DON'T QUALIFIED"] },
    { nombre: "CLOSERS", entrada: "calendly", diasEstancado: 5, etapas: ["Llamada agendada", "Llamada reprogramada", "Llamada cancelada", "No show", "No ofertado", "Follow up", "Pago reserva", "Closed win", "Closed lost"] },
    { nombre: "LUM CLASS VALENTINA CONTRERAS", entrada: "zapier", diasEstancado: 3, etapas: ["NEW LEAD / VC CLASS", "CALLED 1X", "CALLED 2X", "CALLED 3X", "CALLED 4X", "CALLED 5X", "CALLED 6X", "APPOINTMENT SET", "NO SHOW", "FOLLOW UP", "CLOSED", "ALREADY PURCHASED", "DON'T QUALIFIED"] },
    { nombre: "LUM CF CLASS", entrada: "zapier", diasEstancado: 3, etapas: ["NEW LEAD / CF CLASS", "CALLED 1X", "CALLED 2X", "CALLED 3X", "CALLED 4X", "CALLED 5X", "CALLED 6X", "APPOINTMENT SET", "NO SHOW", "FOLLOW UP", "CLOSED", "ALREADY PURCHASED", "DON'T QUALIFIED"] },
    { nombre: "LUM DIAGNÓSTICO DE CRECIMIENTO", entrada: "quiz", diasEstancado: 3, etapas: ["NEW LEAD / DIAGNÓSTICO", "CALLED 1X", "CALLED 2X", "CALLED 3X", "APPOINTMENT SET", "NO SHOW", "FOLLOW UP", "CLOSED", "DON'T QUALIFIED"] },
    { nombre: "LUM DELIVERY", etapas: ["ONBOARDING", "SETUP", "RECOPILACIÓN Y/O CREACIÓN DE CONTENIDO", "SESIÓN ESTRÁTEGICA", "SEGUIMIENTOS Y REPORTES", "CLIENTE ACTIVO", "CLIENTE RECURRENTE", "CLIENTE INACTIVO"], diasEstancado: 0 },
    { nombre: "WHATSAPP NEW LUM", etapas: ["NEW LEAD", "CALLED 1X", "CALLED 2X", "CALLED 3X", "CLOSED"] },
    { nombre: "Bori · Seguimiento", etapas: ["Por contactar", "Mensaje enviado", "Respondió", "Registrado en Bori", "No interesa"] },
    { nombre: "SHADOW · AUDITORÍA NEGOCIO DIGITAL", etapas: ["NEW LEAD / AUDITORÍA", "DM ENVIADO", "RESPONDIÓ", "LLAMADA AGENDADA", "NO SHOW", "FOLLOW UP", "COMUNIDAD $55", "CONSULTORÍA CERRADA", "NO CALIFICA"] },
  ],
  // Copia EXACTA de los 4 embudos de Pipedrive AIB (27/sep/2026), ordenados por uso. WHATSAPP y
  // RECUPERACIÓN 2026 entraban por Timelines.ai; el Diagnóstico por el quiz (/api/auditoria).
  ai_borinquen: [
    { nombre: "WHATSAPP", entrada: "timelines", diasEstancado: 3, etapas: ["New Lead - Whatsapp", "Llamar mas tarde", "CALLED X1", "CALLED 2X", "CALLED 3X", "CALLED 4X", "CALLED 5X", "CALLED 6X", "Reasignar", "//", "Grupos", "Appointment", "No show", "FOLLOW UP", "RESCHEDULE", "Closed", "Not Ready", "Allready purch", "Creadoras UGC", "Fallos del sistema", "REMARKETING MATEO"] },
    { nombre: "RECUPERACIÓN 2026", entrada: "timelines", diasEstancado: 3, etapas: ["A · Agendaron", "B · Conversaron", "C · Fríos", "Contactado", "Conversando", "Probó el agente", "Llamada agendada", "No asistio", "Seguimiento", "Retirado (día 14)"] },
    { nombre: "DIAGNÓSTICO DE AUTOMATIZACIÓN", entrada: "quiz", diasEstancado: 3, etapas: ["NEW LEAD / DIAGNÓSTICO", "CALLED 1X", "CALLED 2X", "CALLED 3X", "APPOINTMENT SET", "NO SHOW", "FOLLOW UP", "CLOSED", "DON'T QUALIFIED"] },
    { nombre: "Bori · Seguimiento", etapas: ["Por contactar", "Mensaje enviado", "Respondió", "Registrado en Bori", "No interesa"] },
  ],
};

/** La columna de grupos de WhatsApp (el grupo closer + setter + administración que se arma al agendar):
 * no son leads, van aparte, angosta y al final del embudo, y no cuentan en los totales. */
export const esEtapaGrupos = (nombre: string) => /^grupos?\b/i.test(nombre.trim());
export const ETAPA_GRUPOS = "Grupos";

/** Para buscar un embudo/etapa por nombre sin importar mayúsculas, acentos ni espacios. */
export const clave = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/** Cuándo cayó el lead, corto y en hora de PR: "hoy 9:46 AM", "ayer 3:10 PM", "25 sep 3:10 PM". */
export function horaLlegada(fecha: Date | string, ahora = new Date()): string {
  const f = new Date(fecha);
  const dia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  const hora = f.toLocaleTimeString("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", minute: "2-digit" });
  const ayer = new Date(ahora.getTime() - 86_400_000);
  if (dia(f) === dia(ahora)) return `hoy ${hora}`;
  if (dia(f) === dia(ayer)) return `ayer ${hora}`;
  const fechaCorta = f.toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" }).replace(".", "");
  return `${fechaCorta} ${hora}`;
}

// Filtro "ver leads de hoy" (29/sep, Nahuel por el grupo de ventas: "¿cómo se filtra por hoy?").
// Puerto Rico no tiene horario de verano (siempre UTC-4), así que el borde del día es fijo.
export type FiltroFecha = "hoy" | "ayer" | "semana" | "mes";
export const FILTROS_FECHA: { id: FiltroFecha; nombre: string }[] = [
  { id: "hoy", nombre: "Hoy" },
  { id: "ayer", nombre: "Ayer" },
  { id: "semana", nombre: "Esta semana" },
  { id: "mes", nombre: "Este mes" },
];

/** [desde, hasta) en UTC para un filtro de fecha, contado por el día calendario en hora de PR. */
export function rangoFecha(filtro: FiltroFecha, ahora = new Date()): { desde: Date; hasta: Date } {
  const diaPR = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }); // YYYY-MM-DD
  const inicioDia = (yyyyMMdd: string) => new Date(`${yyyyMMdd}T00:00:00-04:00`);
  const hoy = diaPR(ahora);
  const inicioHoy = inicioDia(hoy);
  if (filtro === "hoy") return { desde: inicioHoy, hasta: new Date(inicioHoy.getTime() + 86_400_000) };
  if (filtro === "ayer") {
    const desde = new Date(inicioHoy.getTime() - 86_400_000);
    return { desde, hasta: inicioHoy };
  }
  if (filtro === "semana") {
    const diaSemana = new Date(`${hoy}T12:00:00-04:00`).getDay(); // 0=domingo
    const offset = diaSemana === 0 ? 6 : diaSemana - 1; // días desde el lunes
    const desde = new Date(inicioHoy.getTime() - offset * 86_400_000);
    return { desde, hasta: new Date(inicioHoy.getTime() + 86_400_000) };
  }
  const desde = inicioDia(`${hoy.slice(0, 7)}-01`);
  return { desde, hasta: new Date(inicioHoy.getTime() + 86_400_000) };
}

/** Lo que Claude devuelve al leer los primeros mensajes: {"negocio": …, "nicho": …}. Tolerante. */
export function leerNichoIA(texto: string): { negocio: string | null; nicho: string | null } {
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) return { negocio: null, nicho: null };
  try {
    const j = JSON.parse(m[0]) as { negocio?: unknown; nicho?: unknown };
    const limpio = (v: unknown, n: number) => (typeof v === "string" && v.trim() && !/^(null|n\/a|ninguno|desconocido)$/i.test(v.trim()) ? v.trim().slice(0, n) : null);
    return { negocio: limpio(j.negocio, 80), nicho: limpio(j.nicho, 40) };
  } catch {
    return { negocio: null, nicho: null };
  }
}

export type EstadoActividad = "ninguna" | "vencida" | "hoy" | "futura";
const TZ = "America/Puerto_Rico";
const diaPR = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });

/** El puntito de la tarjeta, como en Pipedrive: gris sin actividad, rojo vencida, verde hoy, gris claro futura. */
export function estadoActividad(proxima: Date | string | null | undefined, ahora = new Date()): EstadoActividad {
  if (!proxima) return "ninguna";
  const p = new Date(proxima);
  if (diaPR(p) === diaPR(ahora)) return p.getTime() < ahora.getTime() ? "vencida" : "hoy";
  return p.getTime() < ahora.getTime() ? "vencida" : "futura";
}

/** Estancado = lleva más de N días en la misma etapa (Pipedrive lo pinta de rojo). */
export function estancado(etapaDesde: Date | string, dias: number, ahora = new Date()): boolean {
  return dias > 0 && ahora.getTime() - new Date(etapaDesde).getTime() > dias * 86_400_000;
}

export function diasEnEtapa(etapaDesde: Date | string, ahora = new Date()): number {
  return Math.max(0, Math.floor((ahora.getTime() - new Date(etapaDesde).getTime()) / 86_400_000));
}

/** Orden para insertar entre dos tarjetas (float, sin reindexar toda la columna). */
export function ordenEntre(antes: number | null, despues: number | null): number {
  if (antes == null && despues == null) return 1000;
  if (antes == null) return (despues as number) - 1000;
  if (despues == null) return antes + 1000;
  return (antes + despues) / 2;
}

// ---------------------------------------------------------------------------------------------
// Timelines.ai → evento normalizado. Timelines no publica el esquema completo del aviso, así que
// se busca por nombre de campo en cualquier nivel (chat, message, whatsapp_account, data…) y lo
// crudo queda en leads_webhook_log para afinar con los avisos reales.
// ---------------------------------------------------------------------------------------------
export interface EventoWhatsapp {
  evento: string;
  direccion: "entrante" | "saliente" | null;
  telefono: string | null; // del cliente
  nombre: string | null;
  texto: string;
  mensajeId: string | null;
  chatId: string | null;
  cuenta: string | null; // dígitos del número de la empresa
  esGrupo: boolean;
  adjunto: string | null;
}

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

function buscar(o: unknown, claves: string[], prof = 0): unknown {
  if (!esObj(o) || prof > 4) return undefined;
  for (const k of claves) if (o[k] != null && o[k] !== "") return o[k];
  for (const v of Object.values(o)) {
    const r = buscar(v, claves, prof + 1);
    if (r != null) return r;
  }
  return undefined;
}
const sub = (o: unknown, k: string): Obj | undefined => (esObj(o) && esObj(o[k]) ? (o[k] as Obj) : undefined);

export function leerTimelines(body: unknown): EventoWhatsapp {
  const raiz = esObj(body) ? body : {};
  const data = sub(raiz, "data") ?? raiz;
  const evento = String(raiz.event_type ?? raiz.event ?? data.event_type ?? "desconocido");
  const chat = sub(data, "chat") ?? data;
  const msg = sub(data, "message") ?? data;
  const cuentaObj = sub(data, "whatsapp_account") ?? sub(chat, "whatsapp_account");

  let direccion: EventoWhatsapp["direccion"] = null;
  const dirTxt = String(buscar(msg, ["direction"]) ?? "").toLowerCase();
  const fromMe = buscar(msg, ["from_me", "fromMe", "is_outgoing", "outgoing"]);
  if (/in|received|entrante/.test(dirTxt)) direccion = "entrante";
  else if (/out|sent|saliente/.test(dirTxt)) direccion = "saliente";
  else if (typeof fromMe === "boolean") direccion = fromMe ? "saliente" : "entrante";
  else if (/received/.test(evento)) direccion = "entrante";
  else if (/sent/.test(evento)) direccion = "saliente";

  const cuenta = normalizarTelefono(buscar(cuentaObj ?? {}, ["phone", "phone_number", "id", "account_id"]) ?? buscar(data, ["whatsapp_account_id", "whatsapp_account_phone"]));
  // Teléfono del cliente: del chat primero (en un saliente, el "sender" es la empresa).
  const telChat = buscar(chat, ["phone", "phone_number", "chat_phone", "jid", "recipient_phone"]);
  const telSender = direccion === "entrante" ? buscar(sub(msg, "sender") ?? msg, ["phone", "sender_phone", "from"]) : undefined;
  let telefono = normalizarTelefono(telChat) ?? normalizarTelefono(telSender);
  if (telefono && cuenta && telefono === cuenta) telefono = null; // nunca el número propio

  const nombre = (buscar(chat, ["full_name", "name", "chat_name", "contact_name"]) ?? buscar(sub(msg, "sender") ?? {}, ["full_name", "name"])) as string | undefined;
  const texto = String(buscar(msg, ["text", "body", "message_text", "caption"]) ?? "").trim();
  const adjunto = (buscar(msg, ["attachment_url", "file_url", "url", "media_url"]) as string | undefined) ?? null;
  const esGrupo = Boolean(buscar(chat, ["is_group", "group"])) || /@g\.us/.test(String(telChat ?? ""));

  return {
    evento,
    direccion,
    telefono,
    nombre: nombre ? String(nombre).slice(0, 120) : null,
    texto: texto || (adjunto ? "📎 Archivo adjunto" : ""),
    mensajeId: (buscar(msg, ["message_uid", "message_id", "uid"]) as string | undefined)?.toString() ?? null,
    chatId: (buscar(chat, ["chat_id", "id"]) as string | number | undefined)?.toString() ?? null,
    cuenta,
    esGrupo,
    adjunto,
  };
}
