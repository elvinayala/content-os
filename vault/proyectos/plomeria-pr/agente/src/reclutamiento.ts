/**
 * Reclutamiento de plomeros → la reclutadora (Yaileen) por Slack (23/sep/2026, pedido de Elvin):
 *  - cada entrevista agendada: un DM de UNA línea con lo esencial (no párrafos)
 *  - gran candidato (licencia oficial/maestro + 5 años o más) que NO agendó: un DM para que lo llame y le dé
 *    seguimiento especial. Se espera 2 h desde que se registró (por si agenda solo) y se avisa una sola vez.
 * Las funciones de criterio y formato son puras (tests/reclutamiento.test.mjs).
 */
import type { Candidato } from "./almacen.js";

export const ANOS_GRAN_CANDIDATO = 5;
export const ESPERA_SEGUIMIENTO_MS = 2 * 3600_000;
const VENTANA_MS = 7 * 86_400_000; // no se desentierran candidatos de hace más de una semana

const NUMEROS: Record<string, number> = { un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, quince: 15, veinte: 20, treinta: 30 };
/** "más de 15 años", "como 12", "15+", "cinco años" → número; null si no se entiende. */
export function anosExperiencia(texto?: string): number | null {
  const t = String(texto ?? "").toLowerCase();
  const d = t.match(/\d{1,2}/);
  if (d) return Number(d[0]);
  for (const [palabra, n] of Object.entries(NUMEROS)) if (new RegExp(`\\b${palabra}\\b`).test(t)) return n;
  return null;
}

export const tieneLicencia = (c: Pick<Candidato, "nivelLicencia">) => ["oficial", "maestro"].includes(String(c.nivelLicencia).toLowerCase());
export function esGranCandidato(c: Candidato): boolean {
  const a = anosExperiencia(c.experiencia);
  return tieneLicencia(c) && a !== null && a >= ANOS_GRAN_CANDIDATO;
}
/** Maestros y grandes candidatos: se les persigue y se les da la hora que pidan (Elvin, 23/sep: Abilo). */
export const esPrioridad = (c: Pick<Candidato, "nivelLicencia" | "experiencia">) =>
  String(c.nivelLicencia).toLowerCase() === "maestro" || esGranCandidato(c as Candidato);

/** A un candidato prioritario se le da su hora si cae de lunes a sábado, 7:00 AM–6:00 PM, y en el futuro. */
export function horaPrioritariaValida(iso: string, ahora = Date.now(), zona = "America/Puerto_Rico"): boolean {
  const f = new Date(iso);
  if (isNaN(f.getTime()) || f.getTime() < ahora + 30 * 60_000) return false;
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zona, weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(f).map((x) => [x.type, x.value]));
  const min = (Number(p.hour) % 24) * 60 + Number(p.minute);
  return p.weekday !== "Sun" && min >= 7 * 60 && min <= 18 * 60;
}

/** Yaileen dura ~1 h por entrevista (25/sep, vía Aure: le cayeron 2 a las 9:00 y 1 a las 9:30). Ninguna entrevista
 *  puede empezar a menos de esto de otra, ni siquiera la hora que pide un gran candidato. */
export const MIN_ENTREVISTA = 60;
export function chocaEntrevista(iso: string, ocupadas: string[], minutos = MIN_ENTREVISTA): boolean {
  const t = new Date(iso).getTime();
  return ocupadas.some((o) => Math.abs(new Date(o).getTime() - t) < minutos * 60_000);
}
/** Horas ocupadas según el calendario de GHL (citas que Yaileen agenda o mueve a mano): sin canceladas/no-show,
 *  sin las del propio candidato (si está cambiando su hora) y unidas a las que el agente ya conoce. */
export function unirOcupadas(propias: string[], ghl: { inicio: string; contactId?: string; estado?: string }[], excluirContacto?: string): string[] {
  const deGhl = ghl.filter((e) => !/cancel|invalid|noshow|no_show/i.test(e.estado ?? "") && !(excluirContacto && e.contactId === excluirContacto) && !isNaN(new Date(e.inicio).getTime())).map((e) => new Date(e.inicio).toISOString());
  return [...new Set([...propias.map((o) => new Date(o).toISOString()), ...deGhl])];
}
/** Huecos para ofrecer: fuera de las entrevistas ya agendadas y separados entre sí al menos `minutos`. */
export function separarHuecos(huecos: string[], ocupadas: string[], minutos = MIN_ENTREVISTA): string[] {
  const out: string[] = [];
  for (const h of [...huecos].sort()) if (!chocaEntrevista(h, ocupadas, minutos) && !chocaEntrevista(h, out, minutos)) out.push(h);
  return out;
}

const sinTildes = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
/**
 * ¿El último mensaje del plomero ACEPTA la hora `iso`? (23/sep: Abilo escribió "No tengo trabajo a esa hora"
 * — quería decir "no, tengo trabajo" — y el agente lo agendó igual.) Acepta: un sí claro ("sí", "dale", "me
 * sirve"…) o que él mismo diga esa hora ("mañana 8:00 am"). Cualquier "no", "tengo trabajo", "ocupado"… o algo
 * que no se entienda = NO acepta: hay que preguntarle otra vez.
 */
export function aceptaHora(texto: string | undefined, iso: string, zona = "America/Puerto_Rico"): boolean {
  let t = sinTildes(String(texto ?? ""));
  if (!t) return false;
  t = t.replace(/\b(no hay problema|no problem|como no|por que no|no te preocupes)\b/g, " ");
  if (/\b(no|nop|nah|tengo trabajo|trabajando|ocupad[oa]|imposible|otra hora|otro dia|mas tarde|mas temprano|despues|luego)\b/.test(t)) return false;
  const f = new Date(iso);
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zona, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(f).map((x) => [x.type, x.value]));
  const hora = Number(p.hour) % 24, minuto = Number(p.minute);
  for (const m of t.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(y media|y cuarto)?\s*(a\.? ?m\.?|p\.? ?m\.?)?(?=\s|$|[,.!?])/g)) {
    let h = Number(m[1]); const mi = m[2] ? Number(m[2]) : m[3] === "y media" ? 30 : m[3] === "y cuarto" ? 15 : 0;
    if (h > 23) continue;
    if (m[4]?.startsWith("p") && h < 12) h += 12;
    if (m[4]?.startsWith("a") && h === 12) h = 0;
    if (mi === minuto && (h === hora || (!m[4] && h % 12 === hora % 12))) return true;
  }
  return /\b(si|sii+|dale|ok|okay|oki|perfecto|esta bien|ta bien|me sirve|me funciona|me queda bien|de acuerdo|claro|listo|confirmo|confirmado|va|vale|bueno|excelente|seguro|correcto|ahi estare|alli estare|cuenta conmigo|genial|super|👍)\b|👍/.test(t);
}

export function pendienteSeguimiento(c: Candidato, ahora = Date.now()): boolean {
  const creado = new Date(c.creado).getTime();
  return esGranCandidato(c) && !c.entrevista && !c.avisadoSeguimiento && ahora - creado >= ESPERA_SEGUIMIENTO_MS && ahora - creado <= VENTANA_MS;
}

export function telefonoBonito(tel?: string): string {
  const d = String(tel ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(tel ?? "");
}
export function fechaCorta(iso: string, zona = "America/Puerto_Rico"): string {
  const f = new Date(iso);
  const dia = f.toLocaleDateString("es-PR", { timeZone: zona, weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
  const hora = f.toLocaleTimeString("en-US", { timeZone: zona, hour: "numeric", minute: "2-digit" });
  return `${dia}, ${hora}`;
}
const ficha = (c: Candidato) => [c.nombre, `${c.nivelLicencia}${c.numeroLicencia ? " #" + c.numeroLicencia : ""}`, c.experiencia, c.municipio, telefonoBonito(c.whatsapp)].filter(Boolean).join(" · ");

export const mensajeCita = (c: Candidato, iso: string, fueraDeHorario = false) =>
  esPrioridad(c)
    ? `⭐ ${c.nivelLicencia === "maestro" ? "MAESTRO" : "Gran candidato"} — prioridad. Entrevista ${fechaCorta(iso)}${fueraDeHorario ? " (la hora que él pidió, fuera del horario normal)" : ""}: ${ficha(c)}. Atiéndelo a esa hora en punto (ya está en GHL).`
    : `🔧 Entrevista ${fechaCorta(iso)}: ${ficha(c)} (ya está en el calendario de GHL)`;
export const mensajeGranCandidato = (c: Candidato) => `⭐ Gran candidato sin cita: ${ficha(c)}. Llámalo y dale seguimiento especial.`;

// ── Recordatorio el día de la entrevista (plantilla de Meta `recordatorio_entrevista_resuelto`) ──
// Va 2 h antes (a las 8 AM para una de las 10), una sola vez. WhatsApp no deja escribir texto libre si
// pasaron más de 24 h desde el último mensaje del plomero: por eso es plantilla aprobada.
export const PLANTILLA_RECORDATORIO = "recordatorio_entrevista_resuelto";
export const ANTES_RECORDATORIO_MS = 2 * 3600_000;
export function pendienteRecordatorio(c: Candidato, ahora = Date.now()): boolean {
  if (!c.entrevista || c.recordado || !String(c.contactoId).startsWith("whatsapp:")) return false;
  const t = new Date(c.entrevista).getTime();
  return ahora >= t - ANTES_RECORDATORIO_MS && ahora < t - 15 * 60_000;
}
/** Los 3 parámetros de la plantilla: nombre · hora · cómo entrar. Sin saltos de línea (Meta los rechaza). */
export function paramsRecordatorio(c: Candidato, zoom?: string, zona = "America/Puerto_Rico"): [string, string, string] {
  const nombre = String(c.nombre || "").trim().split(/\s+/)[0] || "hola";
  const hora = new Date(c.entrevista as string).toLocaleTimeString("en-US", { timeZone: zona, hour: "numeric", minute: "2-digit" });
  const como = zoom ? `Entra por aquí a esa hora: ${zoom}` : "Te llamamos a este número a esa hora.";
  return [nombre, hora, como];
}
