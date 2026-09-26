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

// Los embudos que Level Up usaba de verdad en Pipedrive (últimos 60 días al 26/sep/2026), con sus
// etapas. "Closed / Already purchased / No califica" no son etapas aquí: son Ganado y Perdido (con motivo).
export const SEMILLA: Record<Marca, { nombre: string; etapas: string[]; diasEstancado?: number }[]> = {
  level_up: [
    { nombre: "WhatsApp", etapas: ["Nuevo lead", "Llamado 1x", "Llamado 2x", "Llamado 3x", "Llamado 4x", "Llamado 5x", "Llamado 6x", "Llamar más tarde", "Cita agendada", "No show", "Seguimiento"], diasEstancado: 3 },
    { nombre: "Closers", etapas: ["Llamada agendada", "Llamada reprogramada", "Llamada cancelada", "No show", "No ofertado", "Seguimiento", "Pago de reserva"], diasEstancado: 5 },
    { nombre: "Clase Diego", etapas: ["Nuevo lead", "Llamado 1x", "Llamado 2x", "Llamado 3x", "Llamado 4x", "Llamado 5x", "Llamado 6x", "Cita agendada", "No show", "Seguimiento"] },
    { nombre: "Clase Frankie", etapas: ["Nuevo lead", "Llamado 1x", "Llamado 2x", "Llamado 3x", "Llamado 4x", "Llamado 5x", "Llamado 6x", "Cita agendada", "No show", "Seguimiento"] },
    { nombre: "Clase CF", etapas: ["Nuevo lead", "Llamado 1x", "Llamado 2x", "Llamado 3x", "Llamado 4x", "Llamado 5x", "Llamado 6x", "Cita agendada", "No show", "Seguimiento"] },
    { nombre: "Diagnóstico de Crecimiento", etapas: ["Nuevo lead", "Llamado 1x", "Llamado 2x", "Llamado 3x", "Cita agendada", "No show", "Seguimiento"] },
  ],
  ai_borinquen: [
    { nombre: "WhatsApp", etapas: ["Nuevo lead", "Llamado 1x", "Llamado 2x", "Llamado 3x", "Cita agendada", "No show", "Seguimiento"], diasEstancado: 3 },
  ],
};

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
