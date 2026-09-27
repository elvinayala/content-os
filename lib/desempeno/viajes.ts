import "server-only";

import { and, desc, eq } from "drizzle-orm";

import type { UsuarioPulse } from "../pulse/types";
import { db } from "../pulse/db";
import { avisarPersona, esc } from "./avisar";
import { armarPanel, evento, perfilDe, type FilaPersona } from "./datos";
import { publicarNoticia } from "./noticias";
import { fechaPR } from "./reglas";
import { diasLaborables } from "./rrhh";
import { desempenoViajeAnual, desempenoViajesPlan } from "./schema";
import { crearSolicitud } from "./solicitudes";
import { elegibilidadViaje, tipoViaje, type Elegibilidad } from "./viajes-reglas";

// Viajes: el plan de vacaciones de cada quien y el "viaje del año" por mérito (reglas en viajes-reglas.ts).

const base = () => process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";

export async function misPlanes(userId: string) {
  const d = await db();
  return d.select().from(desempenoViajesPlan).where(eq(desempenoViajesPlan.userId, userId)).orderBy(desc(desempenoViajesPlan.createdAt)).limit(20);
}

export async function crearPlan(userId: string, p: { tipo: string; destino: string; desde: string | null; hasta: string | null; presupuestoUsd: number | null; notas: string | null }) {
  const d = await db();
  await d.insert(desempenoViajesPlan).values({ userId, ...p });
}

export async function borrarPlan(userId: string, id: string) {
  const d = await db();
  await d.delete(desempenoViajesPlan).where(and(eq(desempenoViajesPlan.id, id), eq(desempenoViajesPlan.userId, userId)));
}

/** Convierte el plan en una solicitud de vacaciones (supervisor aprueba → RR.HH. firma). */
export async function pedirVacaciones(u: { id: string; nombre: string }, id: string) {
  const d = await db();
  const [plan] = await d.select().from(desempenoViajesPlan).where(and(eq(desempenoViajesPlan.id, id), eq(desempenoViajesPlan.userId, u.id)));
  if (!plan) throw new Error("No encontré tu plan");
  if (plan.solicitudId) throw new Error("Ya pediste estas vacaciones");
  if (!plan.desde || !plan.hasta) throw new Error("Ponle fecha de salida y de regreso para poder pedirlas");
  const perfil = await perfilDe(u.id);
  const dias = diasLaborables(plan.desde, plan.hasta, perfil?.diasLaborables ?? [1, 2, 3, 4, 5]);
  if (dias <= 0) throw new Error("Esas fechas no tienen días laborables: no necesitas pedirlas");
  const s = await crearSolicitud({ userId: u.id, nombre: u.nombre, tipo: "vacaciones", desde: plan.desde, hasta: plan.hasta, dias, detalle: `${tipoViaje(plan.tipo).emoji} Viaje: ${plan.destino}` });
  await d.update(desempenoViajesPlan).set({ solicitudId: s.id }).where(eq(desempenoViajesPlan.id, plan.id));
  return { dias };
}

// ---- Viaje del año ----

export async function programaDelAnio(anio: number) {
  const d = await db();
  const [p] = await d.select().from(desempenoViajeAnual).where(eq(desempenoViajeAnual.anio, anio));
  return p ?? null;
}

export async function guardarPrograma(p: { anio: number; premio: string; topeUsd: number | null; anuncio: string; nota: string | null }, actorId: string) {
  const d = await db();
  await d
    .insert(desempenoViajeAnual)
    .values({ ...p })
    .onConflictDoUpdate({ target: desempenoViajeAnual.anio, set: { premio: p.premio, topeUsd: p.topeUsd, anuncio: p.anuncio, nota: p.nota, updatedAt: new Date() } });
  await evento({ actorId, tipo: "viaje_programa", datos: { anio: p.anio } });
}

/** Elegibilidad de cada persona del panel en el año (asistencia y score diario desde el 1 de enero o su activación). */
function elegibilidadDe(f: FilaPersona, anuncio: string): Elegibilidad {
  const laborables = f.dias.filter((x) => x.asistencia.puntaje !== null);
  return elegibilidadViaje({
    ingreso: f.perfil.fechaIngreso,
    anuncio,
    asistencia: laborables.map((x) => x.asistencia.puntaje!),
    scores: f.dias.map((x) => x.score.score).filter((s): s is number => s !== null),
  });
}

/** Para el panel: la elegibilidad de quien pregunta (empleado) o de todos (maestra), del año en curso. */
export async function elegibilidadAnio(actor: UsuarioPulse & { rrhh?: boolean }, anio: number, anuncio: string) {
  const hoy = fechaPR(Date.now());
  const panel = await armarPanel(actor, `${anio}-01-01`, hoy < anuncio ? hoy : anuncio);
  return panel.filas.map((f) => ({ userId: f.perfil.userId, nombre: f.perfil.nombre, puesto: f.puestoNombre, empresa: f.perfil.empresa, e: elegibilidadDe(f, anuncio) }));
}

/** La dirección escoge al ganador: queda en el programa, sale en Noticias (fijada) y se le avisa. */
export async function elegirGanador(anio: number, ganador: { id: string; nombre: string }, actor: { id: string; nombre: string }) {
  const prog = await programaDelAnio(anio);
  if (!prog) throw new Error("Primero configura el viaje del año");
  if (prog.ganadorId) throw new Error("Ya se anunció el ganador de este año");
  const d = await db();
  await d.update(desempenoViajeAnual).set({ ganadorId: ganador.id, anunciadoAt: new Date(), updatedAt: new Date() }).where(eq(desempenoViajeAnual.anio, anio));
  await publicarNoticia(
    { categoria: "logro", titulo: `✈️ ${ganador.nombre} se ganó el viaje del año ${anio}`, cuerpo: `Por su constancia y su desempeño durante el año. El premio: ${prog.premio}. ¡Felicidades!`, personaId: ganador.id, enlace: null, fijada: true },
    actor,
  );
  await avisarPersona(ganador.id, `✈️ ¡Te ganaste el *viaje del año ${anio}*! ${esc(prog.premio)}. RR.HH. te contacta para coordinarlo. <${base()}/ritmo/viajes|Ver en Ritmo>`).catch(() => false);
  await evento({ userId: ganador.id, actorId: actor.id, tipo: "viaje_ganador", datos: { anio } });
}
