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

export const mensajeCita = (c: Candidato, iso: string) => `🔧 Entrevista ${fechaCorta(iso)}: ${ficha(c)} (ya está en el calendario de GHL)`;
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
