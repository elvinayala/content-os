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
  /** Audios, fotos, videos y documentos del mensaje (el link de Timelines vence a los 15 min). */
  adjuntos: AdjuntoWa[];
  /** Cuándo se mandó el mensaje (si el aviso lo trae); Timelines a veces avisa horas después. */
  fecha: string | null;
}

export type TipoAdjunto = "audio" | "imagen" | "video" | "documento" | "otro";
export interface AdjuntoWa {
  url: string | null;
  mime: string;
  nombre: string;
  bytes: number | null;
}

export function tipoAdjunto(mime: string): TipoAdjunto {
  const m = mime.toLowerCase();
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("image/")) return "imagen";
  if (m.startsWith("video/")) return "video";
  if (m === "application/pdf" || m.startsWith("application/") || m.startsWith("text/")) return "documento";
  return "otro";
}

const ETIQUETA_ADJUNTO: Record<TipoAdjunto, string> = { audio: "🎤 Audio", imagen: "📷 Foto", video: "🎬 Video", documento: "📄 Documento", otro: "📎 Archivo" };
export const etiquetaAdjunto = (mime: string) => ETIQUETA_ADJUNTO[tipoAdjunto(mime)];

/** Audios, fotos y documentos se guardan en nuestro Storage; los videos (pesan hasta 40+ MB) no. */
export const MAX_BYTES_ADJUNTO = 16 * 1024 * 1024;
export function seGuardaAdjunto(a: { mime: string; bytes: number | null }): boolean {
  const t = tipoAdjunto(a.mime);
  return (t === "audio" || t === "imagen" || t === "documento") && (a.bytes ?? 0) <= MAX_BYTES_ADJUNTO;
}

const EXT: Record<string, string> = { "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf", "video/mp4": "mp4" };
export function extensionAdjunto(a: { mime: string; nombre: string }): string {
  return EXT[a.mime.toLowerCase().split(";")[0]] ?? a.nombre.match(/\.([a-z0-9]{1,5})$/i)?.[1]?.toLowerCase() ?? "bin";
}

function leerAdjuntos(msg: Obj): AdjuntoWa[] {
  const lista = Array.isArray(msg.attachments) ? msg.attachments : [];
  const out: AdjuntoWa[] = [];
  for (const a of lista) {
    if (!esObj(a)) continue;
    const mime = String(a.mimetype ?? a.mime_type ?? a.content_type ?? "application/octet-stream");
    const url = (a.temporary_download_url ?? a.download_url ?? a.url ?? null) as string | null;
    const bytes = Number(a.size ?? a.bytes);
    out.push({ url: url ? String(url) : null, mime, nombre: String(a.filename ?? a.name ?? "archivo").slice(0, 120), bytes: Number.isFinite(bytes) ? bytes : null });
  }
  // Formato viejo/API: un solo attachment_url.
  if (!out.length && typeof msg.attachment_url === "string") {
    const nombre = String(msg.attachment_filename ?? "archivo");
    const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
    const mime = Object.entries(EXT).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
    out.push({ url: msg.attachment_url, mime, nombre, bytes: null });
  }
  return out;
}

/** "2026-10-09 05:46:04 -0400" → ISO. */
export function fechaTimelines(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?\s*([+-]\d{2}):?(\d{2})$/);
  const d = m ? new Date(`${m[1]}T${m[2]}${m[3]}:${m[4]}`) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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
  const adjuntos = leerAdjuntos(msg);

  return {
    evento,
    direccion,
    telefono,
    nombre: nombre ? String(nombre).slice(0, 120) : null,
    texto: texto || (adjuntos[0] ? etiquetaAdjunto(adjuntos[0].mime) : adjunto ? "📎 Archivo adjunto" : ""),
    mensajeId: (buscar(msg, ["message_uid", "message_id", "uid"]) as string | undefined)?.toString() ?? null,
    chatId: (buscar(chat, ["chat_id", "id"]) as string | number | undefined)?.toString() ?? null,
    cuenta,
    esGrupo,
    adjunto: adjunto ?? adjuntos[0]?.url ?? null,
    adjuntos,
    fecha: fechaTimelines(buscar(msg, ["timestamp", "sent_at", "created_at"])),
  };
}

// ---------- Reparto de leads nuevos por embudo (30/sep, Elvin: "como el round robin de Pipedrive") ----------

export type ModoReparto = "ninguno" | "fijo" | "rotacion";
export interface Reparto {
  modo: ModoReparto;
  personas: string[];
}

export const MODOS_REPARTO: { id: ModoReparto; nombre: string; ayuda: string }[] = [
  { id: "ninguno", nombre: "Nadie", ayuda: "Los leads nuevos quedan sin dueño hasta que alguien los tome." },
  { id: "fijo", nombre: "Una persona", ayuda: "Todos los leads nuevos de este embudo van a la misma persona." },
  { id: "rotacion", nombre: "Rotación", ayuda: "Uno a cada persona, en orden (round robin)." },
];

export function normalizarReparto(x: unknown): Reparto {
  const r = (x ?? {}) as { modo?: unknown; personas?: unknown };
  const modo: ModoReparto = r.modo === "fijo" || r.modo === "rotacion" ? r.modo : "ninguno";
  const personas = Array.isArray(r.personas) ? [...new Set(r.personas.filter((p): p is string => typeof p === "string" && p.length > 0))] : [];
  if (modo === "ninguno" || !personas.length) return { modo: "ninguno", personas: [] };
  return { modo, personas: modo === "fijo" ? personas.slice(0, 1) : personas };
}

/**
 * Dueño del próximo lead nuevo. `turno` = cuántos leads repartió ya el embudo. Las personas que ya no
 * tienen acceso (o están desactivadas) se saltan sin romper el orden de las demás.
 */
export function duenoPorReparto(reparto: Reparto, turno: number, habilitados: ReadonlySet<string>): string | null {
  const r = normalizarReparto(reparto);
  const personas = r.personas.filter((p) => habilitados.has(p));
  if (!personas.length || r.modo === "ninguno") return null;
  if (r.modo === "fijo") return personas[0];
  return personas[((turno % personas.length) + personas.length) % personas.length];
}

/** Los leads de estos orígenes no se reparten: el manual lo asigna quien lo crea y los grupos no son leads. */
export function seReparte(origen: string | null | undefined): boolean {
  return origen !== "manual" && origen !== "grupo";
}

// ---------- Vigía de WhatsApp (9/oct, Elvin): avisar si una marca deja de recibir mensajes ----------
// El 6/oct el plan de Timelines de AIB perdió la API y no entró un lead en ~20 h sin que nadie se enterara.

export interface ChequeoTimelines {
  apiStatus: number; // 200 ok · 401 token · 403 plan · 0 red
  cuentas: { phone: string; status: string }[];
  webhooks: { event_type: string; enabled: boolean; url: string }[];
  slug: string; // level-up | ai-borinquen
  horasSilencio: number | null; // desde el último aviso que llegó
}

export function problemaTimelines(c: ChequeoTimelines): { clave: string; texto: string } | null {
  if (c.apiStatus === 401) return { clave: "token", texto: "la llave de la API de Timelines dejó de servir (vencida o la cambiaron)." };
  if (c.apiStatus === 403) return { clave: "plan", texto: "el plan de Timelines ya no incluye la API (¿se venció o falló el pago?). Sin eso no entra ningún mensaje a Leads." };
  if (c.apiStatus === 200) {
    const caida = c.cuentas.find((x) => x.status && x.status !== "active");
    if (caida) return { clave: `desconectado:${caida.phone}`, texto: `el WhatsApp ${caida.phone} está desconectado de Timelines (${caida.status}). Hay que volver a escanear el QR.` };
    const nuestros = c.webhooks.filter((w) => w.enabled && w.url.includes("/api/leads/timelines") && w.url.includes(`marca=${c.slug}`));
    const falta = ["message:received:new", "message:sent:new"].filter((e) => !nuestros.some((w) => w.event_type === e));
    if (falta.length) return { clave: "webhooks", texto: `faltan o están apagados los webhooks de Timelines hacia Leads (${falta.join(", ")}).` };
  }
  if (c.horasSilencio != null && c.horasSilencio >= HORAS_SILENCIO) return { clave: "silencio", texto: `hace ${Math.floor(c.horasSilencio)} h que no entra ni un mensaje de WhatsApp a Leads, aunque Timelines dice que todo está bien. Revisa que el número esté recibiendo.` };
  return null;
}

export const HORAS_SILENCIO = 3;
/** El silencio solo alarma de 9 AM a 9 PM de PR (de noche es normal). */
export const horarioVigia = (horaPR: number) => horaPR >= 9 && horaPR < 21;

/** previo = el último estado guardado ("alerta:<clave>" | "ok" | null). */
export function decisionVigia(previo: string | null, problema: { clave: string } | null, enHorario: boolean): "alertar" | "recuperado" | null {
  if (problema) {
    if (previo === `alerta:${problema.clave}`) return null;
    if (problema.clave === "silencio" && !enHorario) return null;
    return "alertar";
  }
  return previo?.startsWith("alerta:") ? "recuperado" : null;
}
