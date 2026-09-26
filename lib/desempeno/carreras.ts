import "server-only";

import { and, desc, eq, gt, inArray } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisarPersona, avisarRrhh, esc } from "./avisar";
import { correspondeBono, errorAplicacion, errorReferido, esEstadoValido, nombreEstado, puedeRetirar, type DatosReferido } from "./carreras-reglas";
import { evento } from "./datos";
import { crearAjuste } from "./fichas";
import { mesSiguiente } from "./rrhh";
import { desempenoPostulaciones, desempenoVacantes } from "./schema";

// Carreras: vacantes internas + aplicaciones + referidos (reglas puras en carreras-reglas.ts).
// Solo RR.HH./maestra ve quién aplicó o a quién refirieron; cada quien ve lo suyo.

export type Vacante = typeof desempenoVacantes.$inferSelect;
export type Postulacion = typeof desempenoPostulaciones.$inferSelect;

const base = () => process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";
const enlaceRitmo = () => `<${base()}/ritmo/carreras|Ver en Ritmo>`;
const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });

export async function listarVacantes(todas: boolean): Promise<Vacante[]> {
  const d = await db();
  const q = d.select().from(desempenoVacantes);
  return (todas ? q : q.where(eq(desempenoVacantes.estado, "abierta"))).orderBy(desc(desempenoVacantes.createdAt)).limit(200);
}

export async function leerVacante(id: string): Promise<Vacante | null> {
  const d = await db();
  const [v] = await d.select().from(desempenoVacantes).where(eq(desempenoVacantes.id, id));
  return v ?? null;
}

/** Vacantes abiertas publicadas en los últimos 7 días (punto "nuevo" en el menú). */
export async function vacantesNuevas(): Promise<number> {
  const d = await db();
  const r = await d.select({ id: desempenoVacantes.id }).from(desempenoVacantes).where(and(eq(desempenoVacantes.estado, "abierta"), gt(desempenoVacantes.createdAt, new Date(Date.now() - 7 * 86_400_000))));
  return r.length;
}

export type DatosVacante = Pick<Vacante, "titulo" | "empresa" | "departamento" | "modalidad" | "ubicacion" | "descripcion" | "requisitos" | "salario" | "bonoReferido" | "estado">;

export async function guardarVacante(id: string | null, v: DatosVacante, actorId: string): Promise<Vacante> {
  const d = await db();
  const [fila] = id
    ? await d.update(desempenoVacantes).set({ ...v, updatedAt: new Date() }).where(eq(desempenoVacantes.id, id)).returning()
    : await d.insert(desempenoVacantes).values({ ...v, createdBy: actorId }).returning();
  if (!fila) throw new Error("No encontré la vacante");
  await evento({ actorId, tipo: id ? "vacante_editada" : "vacante_publicada", datos: { id: fila.id, titulo: fila.titulo, estado: fila.estado } });
  return fila;
}

/** Lo mío (aplicaciones y referidos), con el título de la vacante. */
export async function misPostulaciones(userId: string) {
  const d = await db();
  const filas = await d.select().from(desempenoPostulaciones).where(eq(desempenoPostulaciones.userId, userId)).orderBy(desc(desempenoPostulaciones.createdAt)).limit(100);
  return conVacante(filas);
}

/** Todo (vista maestra), con nombres de quien aplicó/refirió. */
export async function todasLasPostulaciones() {
  const d = await db();
  const filas = await d.select().from(desempenoPostulaciones).orderBy(desc(desempenoPostulaciones.createdAt)).limit(500);
  const ids = [...new Set(filas.map((f) => f.userId))];
  const nombres = ids.length ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre, email: pulseUsers.email }).from(pulseUsers).where(inArray(pulseUsers.id, ids)) : [];
  return (await conVacante(filas)).map((f) => ({ ...f, persona: nombres.find((n) => n.id === f.userId)?.nombre ?? "—" }));
}

async function conVacante(filas: Postulacion[]) {
  const d = await db();
  const ids = [...new Set(filas.map((f) => f.vacanteId))];
  const vs = ids.length ? await d.select({ id: desempenoVacantes.id, titulo: desempenoVacantes.titulo, bono: desempenoVacantes.bonoReferido }).from(desempenoVacantes).where(inArray(desempenoVacantes.id, ids)) : [];
  return filas.map((f) => ({ ...f, vacante: vs.find((v) => v.id === f.vacanteId)?.titulo ?? "—", bono: vs.find((v) => v.id === f.vacanteId)?.bono ?? 100 }));
}

async function vacanteAbierta(id: string): Promise<Vacante> {
  const v = await leerVacante(id);
  if (!v || v.estado !== "abierta") throw new Error("Esta vacante ya no está abierta");
  return v;
}

export async function aplicar(u: { id: string; nombre: string }, vacanteId: string, a: { motivo: string; enlace: string }) {
  const v = await vacanteAbierta(vacanteId);
  const d = await db();
  const previas = await d.select({ id: desempenoPostulaciones.id, estado: desempenoPostulaciones.estado }).from(desempenoPostulaciones).where(and(eq(desempenoPostulaciones.vacanteId, v.id), eq(desempenoPostulaciones.userId, u.id), eq(desempenoPostulaciones.tipo, "interna")));
  const err = errorAplicacion(a, previas.some((p) => p.estado !== "retirada"));
  if (err) throw new Error(err);
  await d.insert(desempenoPostulaciones).values({ vacanteId: v.id, tipo: "interna", userId: u.id, motivo: a.motivo.trim().slice(0, 2000), enlace: a.enlace.trim().slice(0, 500) || null });
  await evento({ userId: u.id, actorId: u.id, tipo: "carreras_aplico", datos: { vacante: v.id } });
  await avisarRrhh(`🚀 *${esc(u.nombre)}* aplicó a la vacante *${esc(v.titulo)}* (crecimiento interno). ${enlaceRitmo()}`).catch(() => 0);
}

export async function referir(u: { id: string; nombre: string; email: string }, vacanteId: string, r: DatosReferido) {
  const v = await vacanteAbierta(vacanteId);
  const d = await db();
  const ya = await d.select({ email: desempenoPostulaciones.candidatoEmail }).from(desempenoPostulaciones).where(and(eq(desempenoPostulaciones.vacanteId, v.id), eq(desempenoPostulaciones.tipo, "referido")));
  const err = errorReferido(r, u, ya);
  if (err) throw new Error(err);
  await d.insert(desempenoPostulaciones).values({
    vacanteId: v.id,
    tipo: "referido",
    userId: u.id,
    candidatoNombre: r.nombre.trim().slice(0, 120),
    candidatoEmail: r.email.trim().toLowerCase().slice(0, 200) || null,
    candidatoTelefono: r.telefono.trim().slice(0, 40) || null,
    relacion: r.relacion.trim().slice(0, 120) || null,
    motivo: r.motivo.trim().slice(0, 2000),
    enlace: r.enlace.trim().slice(0, 500) || null,
  });
  await evento({ userId: u.id, actorId: u.id, tipo: "carreras_refirio", datos: { vacante: v.id } });
  await avisarRrhh(`🤝 *${esc(u.nombre)}* refirió a *${esc(r.nombre.trim())}* para *${esc(v.titulo)}*. ${enlaceRitmo()}`).catch(() => 0);
}

export async function retirar(u: { id: string }, id: string) {
  const d = await db();
  const [p] = await d.select().from(desempenoPostulaciones).where(eq(desempenoPostulaciones.id, id));
  if (!p || !puedeRetirar(p, u.id)) throw new Error("Ya no se puede retirar");
  await d.update(desempenoPostulaciones).set({ estado: "retirada", updatedAt: new Date() }).where(eq(desempenoPostulaciones.id, id));
}

/** RR.HH. mueve el caso. Referido + onboarding completo → bono como ajuste de nómina (una sola vez). */
export async function cambiarEstado(actor: { id: string; nombre: string }, id: string, estado: string, nota: string | null): Promise<{ bono: number | null }> {
  const d = await db();
  const [p] = await d.select().from(desempenoPostulaciones).where(eq(desempenoPostulaciones.id, id));
  if (!p) throw new Error("No encontré la postulación");
  if (!esEstadoValido(p.tipo, estado)) throw new Error("Estado inválido");
  const v = await leerVacante(p.vacanteId);
  const actualizada = { ...p, estado };
  let bono: number | null = null;
  let bonoAjusteId = p.bonoAjusteId;
  let bonoMes = p.bonoMes;
  if (correspondeBono(actualizada)) {
    bono = v?.bonoReferido ?? 100;
    bonoMes = mesSiguiente(hoyPR());
    bonoAjusteId = await crearAjuste({ userId: p.userId, mes: bonoMes, concepto: `Bono por referido: ${p.candidatoNombre ?? "—"} (${v?.titulo ?? "vacante"})`, monto: bono }, actor.id);
  }
  await d
    .update(desempenoPostulaciones)
    .set({ estado, notaRrhh: nota ?? p.notaRrhh, decididoPor: actor.id, bonoAjusteId, bonoMes, updatedAt: new Date() })
    .where(eq(desempenoPostulaciones.id, id));
  await evento({ userId: p.userId, actorId: actor.id, tipo: "carreras_estado", datos: { id, estado, bono } });
  if (estado !== p.estado) {
    const quien = p.tipo === "referido" ? `tu referido *${esc(p.candidatoNombre)}*` : "tu aplicación";
    const extra = bono ? ` 🎉 Te ganaste el bono de *US$${bono}*: va en tu nómina de ${bonoMes}.` : "";
    await avisarPersona(p.userId, `💼 Carreras · ${quien} para *${esc(v?.titulo ?? "")}*: *${nombreEstado(estado)}*.${extra} ${enlaceRitmo()}`).catch(() => false);
  }
  return { bono };
}
