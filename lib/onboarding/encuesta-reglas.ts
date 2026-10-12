// Encuesta al terminar el onboarding de Level Up (11/oct/2026). Elvin: "una encuesta apenas termina el
// onboarding, para saber que Jessica hizo un buen onboarding, que nada raro pasó y que se cumplió todo".
// Puro (sin server-only): lo usan el cron, la acción del formulario y los tests (tests/encuesta-onboarding.test.mjs).

import type { Respuestas } from "../formularios/reglas.ts";

export const SLUG_ENCUESTA = "onboarding-experiencia";

export const OPC_CLARO = ["Sí, todo claro", "Más o menos", "No, me quedaron dudas"];
export const OPC_CUMPLIO = ["Sí, todo lo que esperaba", "Casi todo, faltó algo", "No, faltaron cosas importantes"];
export const OPC_MOTIVO = ["Se me olvidó o no pude conectarme", "Tuve un imprevisto", "Hubo un problema con el link o la hora", "Nadie me atendió"];

// ---------- Cuándo mandarla ----------

export const MINUTOS_DESPUES = 15; // después de la hora de fin de la llamada
export const HORAS_MAXIMO = 4; // pasado esto ya no se manda (no tiene sentido una encuesta de "hoy" al otro día)
export const HORA_DESDE = 8; // hora PR
export const HORA_HASTA = 20;

const horaPR = (d: Date) => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", hour12: false }).format(d)) % 24;

/** ¿Toca mandar la encuesta de una llamada que terminó en `fin`? Ventana 15 min – 4 h y solo de 8 AM a 8 PM (PR). */
export function tocaEnviar(fin: Date | string, ahora: Date = new Date()): { ok: boolean; motivo?: "pronto" | "tarde" | "horario" } {
  const f = new Date(fin).getTime();
  const min = (ahora.getTime() - f) / 60_000;
  if (!Number.isFinite(min) || min < MINUTOS_DESPUES) return { ok: false, motivo: "pronto" };
  if (min > HORAS_MAXIMO * 60) return { ok: false, motivo: "tarde" };
  const h = horaPR(ahora);
  if (h < HORA_DESDE || h >= HORA_HASTA) return { ok: false, motivo: "horario" };
  return { ok: true };
}

export const esEventoOnboarding = (nombreEvento: string, regex = process.env.CALENDLY_IGNORAR_REGEX || "onboarding") => new RegExp(regex, "i").test(nombreEvento);

/** Teléfono de PR/EE.UU. a dígitos con código de país (10 dígitos → antepone 1). null si no sirve. */
export function telefonoWhatsApp(v: string | null | undefined): string | null {
  const d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 10) return `1${d}`;
  if (d.length >= 11 && d.length <= 15) return d;
  return null;
}

export const primerNombre = (nombre: string) => (nombre.trim().split(/\s+/)[0] || "").replace(/^./, (c) => c.toUpperCase());

export function linkEncuesta(ref: string, base = process.env.ENCUESTA_ONBOARDING_BASE || "https://levelupmedia.vercel.app"): string {
  return `${base.replace(/\/$/, "")}/f/${SLUG_ENCUESTA}?origen=ob-${ref}`;
}

/** El WhatsApp que recibe el cliente. */
export function textoWhatsApp(v: { nombre: string; host: string; link: string }): string {
  const nombre = primerNombre(v.nombre);
  const con = v.host ? `con ${primerNombre(v.host)}` : "con nuestro equipo";
  return (
    `Hola${nombre ? ` ${nombre}` : ""} 👋 Gracias por tu onboarding ${con}.\n\n` +
    `Para asegurarnos de que todo salió como debía, ¿nos regalas 1 minutito? Son unas preguntas rápidas:\n${v.link}\n\n` +
    `Tu opinión nos ayuda a que tu arranque sea excelente 🙌`
  );
}

// ---------- Cómo salió ----------

export type Nivel = "verde" | "ambar" | "rojo";

export interface Evaluacion {
  nivel: Nivel;
  nota: number | null;
  tuvo: boolean;
  motivos: string[]; // por qué no es verde (vacío si todo bien)
  resumen: string; // una línea para la ficha y los avisos
}

const t = (v: Respuestas[string]) => (Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v.trim() : "");

export function evaluar(r: Respuestas): Evaluacion {
  const tuvo = t(r.tuvo) !== "No";
  if (!tuvo) {
    const motivo = t(r.motivo) || "no dijo por qué";
    const atendio = /^Nadie/i.test(motivo);
    return {
      nivel: "rojo",
      nota: null,
      tuvo: false,
      motivos: [atendio ? "dice que NADIE lo atendió en la llamada" : `no tuvo el onboarding (${motivo})`],
      resumen: `no tuvo su onboarding: ${motivo}`,
    };
  }
  const nota = Number.isFinite(Number(t(r.nota))) && t(r.nota) !== "" ? Number(t(r.nota)) : null;
  const claro = t(r.claro);
  const cumplio = t(r.cumplio);
  const incomodo = t(r.incomodo) === "Sí";
  const rojo: string[] = [];
  const ambar: string[] = [];
  if (nota != null && nota <= 6) rojo.push(`nota ${nota}/10`);
  else if (nota != null && nota <= 8) ambar.push(`nota ${nota}/10`);
  if (/^No/i.test(cumplio)) rojo.push("faltaron cosas importantes");
  else if (/^Casi/i.test(cumplio)) ambar.push("faltó algo");
  if (/^No/i.test(claro)) rojo.push("le quedaron dudas de qué sigue");
  else if (/^Más o menos/i.test(claro)) ambar.push("no le quedó del todo claro qué sigue");
  if (incomodo) rojo.push(`algo no le gustó${t(r.que) ? `: «${t(r.que).slice(0, 160)}»` : ""}`);
  const nivel: Nivel = rojo.length ? "rojo" : ambar.length ? "ambar" : "verde";
  const motivos = [...rojo, ...ambar];
  const partes = [nota != null ? `${nota}/10` : null, claro ? claro.toLowerCase() : null, cumplio ? cumplio.toLowerCase() : null, incomodo ? "algo no le gustó" : "nada raro"].filter(Boolean);
  return { nivel, nota, tuvo: true, motivos, resumen: partes.join(" · ") };
}

const ICONO: Record<Nivel, string> = { verde: "🟢", ambar: "🟡", rojo: "🔴" };

/** Aviso corto para Elvin (Telegram) y Carilin (DM). */
export function textoAviso(v: { nombre: string; negocio?: string | null; host?: string | null; ev: Evaluacion; mejora?: string }): string {
  const quien = `${v.nombre}${v.negocio ? ` (${v.negocio})` : ""}`;
  const con = v.host ? ` con ${primerNombre(v.host)}` : "";
  let s = `${ICONO[v.ev.nivel]} Onboarding de ${quien}${con}: ${v.ev.resumen}.`;
  if (v.ev.nivel !== "verde") s += `\n⚠️ ${v.ev.motivos.join(" · ")}`;
  if (v.mejora) s += `\n💬 «${v.mejora.slice(0, 200)}»`;
  return s;
}
