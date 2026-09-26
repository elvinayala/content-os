import "server-only";

import { and, eq, or } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { cerrarTrato, etapasDe, ingestarLead, moverTrato } from "./repo";
import { normalizarTelefono } from "./reglas";
import { leadsEmbudos, leadsTratos } from "./schema";

// Las fuentes que hoy escriben en Pipedrive también escriben en Leads (semana 2 de la migración,
// 26/sep/2026). Corren EN PARALELO con Pipedrive y nunca rompen el flujo que las llama: todo va
// en try/catch y se loguea. Por ahora solo Level Up (Elvin: "primero el de Level Up").

const TZ = "America/Puerto_Rico";
const fechaCita = (iso: string) =>
  new Date(iso).toLocaleString("es-PR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

async function seguro(nombre: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    console.error(`[leads/cables] ${nombre}`, e instanceof Error ? e.message : e);
  }
}

/** Cita agendada/reagendada en el Calendly de Level Up → embudo Closers. */
export function leadCalendlyAgendo(v: { nombre: string; email: string; telefono: string; negocio: string; inicio: string; evento: string; closer?: string | null; agendoPor?: string | null; reagenda: boolean; uri: string }) {
  return seguro("calendly-agendo", () =>
    ingestarLead({
      marca: "level_up",
      embudo: "CLOSERS",
      etapa: v.reagenda ? "Llamada reprogramada" : "Llamada agendada",
      nombre: v.nombre,
      email: v.email,
      telefono: v.telefono,
      negocio: v.negocio || null,
      origen: "calendly",
      agendoPor: v.agendoPor ?? null,
      duenoNombre: v.closer ?? null,
      nota: `📅 ${v.reagenda ? "Reagendó" : "Agendó"}: ${fechaCita(v.inicio)} · ${v.evento}${v.closer ? ` · closer ${v.closer}` : ""}${v.agendoPor ? ` · agendó ${v.agendoPor}` : ""}`,
      datos: { citaInicio: v.inicio, citaEvento: v.evento, calendlyUri: v.uri, ...(v.closer ? { closer: v.closer } : {}) },
    }),
  );
}

async function abiertoPorContacto(email: string | null, telefono: string | null) {
  const d = await db();
  const conds = [];
  if (email) conds.push(eq(leadsTratos.email, email.trim().toLowerCase()));
  const tel = normalizarTelefono(telefono);
  if (tel) conds.push(eq(leadsTratos.telefono, tel));
  if (!conds.length) return null;
  const [t] = await d.select().from(leadsTratos).where(and(eq(leadsTratos.marca, "level_up"), eq(leadsTratos.estado, "abierto"), or(...conds))).limit(1);
  return t ?? null;
}

/** Canceló (no reagendó) → etapa "Llamada cancelada" del embudo Closers, si el lead existe. */
export function leadCalendlyCancelo(email: string, telefono: string | null) {
  return seguro("calendly-cancelo", async () => {
    const t = await abiertoPorContacto(email, telefono);
    if (!t) return;
    const d = await db();
    const [emb] = await d.select().from(leadsEmbudos).where(eq(leadsEmbudos.id, t.embudoId)).limit(1);
    const etapas = await etapasDe(emb.id);
    const cancelada = etapas.find((e) => /cancelad/i.test(e.nombre));
    if (cancelada) await moverTrato(t.id, cancelada.id, null, null);
  });
}

/** Agendó el onboarding = ya es cliente → el lead abierto se marca GANADO. */
export function leadCalendlyOnboarding(email: string, telefono: string | null) {
  return seguro("calendly-onboarding", async () => {
    const t = await abiertoPorContacto(email, telefono);
    if (t) await cerrarTrato(t.id, "ganado", null);
  });
}

/** Quiz "Diagnóstico de Crecimiento" de Level Up → embudo del mismo nombre. */
export function leadQuiz(v: { evento: string; nombre: string; email: string; telefono: string; negocio: string; resultado?: string | null; avatar?: string | null; utm?: string | null }) {
  return seguro("quiz", () =>
    ingestarLead({
      marca: "level_up",
      embudo: "LUM DIAGNÓSTICO DE CRECIMIENTO",
      nombre: v.nombre,
      email: v.email,
      telefono: v.telefono,
      negocio: v.negocio || null,
      origen: "quiz",
      agendoPor: v.utm ?? null,
      moverSiExiste: false,
      nota: v.evento === "resultado" ? `🧭 Terminó el diagnóstico${v.resultado ? `: ${v.resultado}` : ""}` : "🧭 Empezó el diagnóstico de crecimiento",
      datos: { ...(v.avatar ? { avatar: v.avatar } : {}), ...(v.resultado ? { resultadoQuiz: v.resultado } : {}) },
    }),
  );
}
