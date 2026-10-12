// Reunión de estrategia mensual (Elvin, 30/sep): los clientes que pagaron $3,000 o más (o marcados "Alto" en la columna
// ALTO VALOR) piden UNA reunión al mes desde la app, con sus horarios preferidos; les llega a Jessica y a Carilin, que la
// crean y la confirman. Al cliente NUNCA se le dice que es "alto valor": eso es dato interno. Puro; tests en
// tests/clientes-app.test.mjs.

export const MONTO_ALTO_VALOR = 3000;

/** ¿Tiene derecho a la reunión mensual? */
export function esAltoValor(p: { marcadoAlto: boolean; montos: (number | undefined | null)[] }): boolean {
  return p.marcadoAlto || p.montos.some((m) => typeof m === "number" && m >= MONTO_ALTO_VALOR);
}

/** Mes de Puerto Rico ("2026-09") de una fecha. */
export const mesPR = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }).slice(0, 7);

export interface OpcionHorario {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM (hora de PR)
}

export const HORAS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

const diaSemana = (f: string) => new Date(`${f}T12:00:00`).getUTCDay(); // 0 domingo … 6 sábado

/** Valida los horarios que propone el cliente: 1 a 3, de lunes a viernes, desde mañana y hasta 21 días. */
export function validarSolicitud(p: { opciones: unknown; tema: unknown }, hoy: string): { error: string } | { ok: { opciones: OpcionHorario[]; tema: string } } {
  const lista = Array.isArray(p.opciones) ? p.opciones : [];
  const opciones: OpcionHorario[] = [];
  const max = new Date(`${hoy}T12:00:00`);
  max.setUTCDate(max.getUTCDate() + 21);
  const limite = max.toISOString().slice(0, 10);
  for (const o of lista) {
    const fecha = typeof o?.fecha === "string" ? o.fecha : "";
    const hora = typeof o?.hora === "string" ? o.hora : "";
    if (!fecha && !hora) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !HORAS.includes(hora)) return { error: "Escoge día y hora en cada opción." };
    if (fecha <= hoy || fecha > limite) return { error: "Escoge días desde mañana y dentro de las próximas 3 semanas." };
    if ([0, 6].includes(diaSemana(fecha))) return { error: "Las reuniones son de lunes a viernes." };
    if (!opciones.some((x) => x.fecha === fecha && x.hora === hora)) opciones.push({ fecha, hora });
  }
  if (!opciones.length) return { error: "Escoge al menos un día y una hora." };
  const tema = typeof p.tema === "string" ? p.tema.replace(/\s+/g, " ").trim().slice(0, 400) : "";
  return { ok: { opciones: opciones.slice(0, 3), tema } };
}

/** "martes 6 de octubre, 10:00 AM" */
export function textoHorario(o: OpcionHorario): string {
  const dia = new Date(`${o.fecha}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const [h, m] = o.hora.split(":").map(Number);
  return `${dia}, ${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** El DM para Jessica y Carilin (bot Command Center). Sin la palabra "alto valor" no hace falta: es interno, pero claro. */
export function textoAvisoEquipo(p: { negocio: string; contacto: string; opciones: OpcionHorario[]; tema: string; linkFicha: string }): string {
  const ops = p.opciones.map((o, i) => `${i + 1}. ${textoHorario(o)}`).join("\n");
  return `📅 *Reunión de estrategia solicitada* · ${p.negocio} (${p.contacto})\nCliente de alto valor: tiene derecho a 1 al mes.\nHorarios que prefiere (hora PR):\n${ops}${p.tema ? `\nQuiere revisar: “${p.tema}”` : ""}\nCréenla y confírmenla en su ficha (pestaña App) para que le llegue a su app: ${p.linkFicha}`;
}
