import "server-only";

import { desc, eq, inArray, or } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { avisarPersona, avisarRrhh, esc } from "./avisar";
import { evento, perfilDe } from "./datos";
import { crearAusencia } from "./fichas";
import { alAprobar, ausenciaDeSolicitud, estadoInicial, TIPOS_SOLICITUD } from "./rrhh";
import { desempenoAusencias, desempenoSolicitudes } from "./schema";

// Solicitudes a RR.HH.: la persona pide → su supervisor aprueba → RR.HH. firma (lib/desempeno/rrhh.ts).
// Avisos por Slack (bot) solo con DESEMPENO_AVISOS=real; siempre quedan en la bandeja de Ritmo.

export type Solicitud = typeof desempenoSolicitudes.$inferSelect;

const base = () => process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";
const tipoNombre = (t: string) => TIPOS_SOLICITUD.find((x) => x.id === t)?.nombre ?? t;

export async function crearSolicitud(p: { userId: string; nombre: string; tipo: string; desde: string | null; hasta: string | null; dias: number | null; detalle: string }) {
  const perfil = await perfilDe(p.userId);
  const supervisorId = perfil?.liderId ?? null;
  const d = await db();
  const [s] = await d.insert(desempenoSolicitudes).values({ userId: p.userId, tipo: p.tipo, desde: p.desde, hasta: p.hasta, dias: p.dias, detalle: p.detalle, estado: estadoInicial(supervisorId), supervisorId }).returning();
  await evento({ userId: p.userId, actorId: p.userId, tipo: "solicitud", datos: { id: s.id, tipo: p.tipo } });
  const texto = `📝 ${esc(p.nombre)} pidió: *${tipoNombre(p.tipo)}*${p.desde ? ` (${p.desde}${p.hasta && p.hasta !== p.desde ? ` → ${p.hasta}` : ""})` : ""}. Te toca ${s.estado === "supervisor" ? "aprobarla como supervisor" : "firmarla (RR.HH.)"}: <${base()}/ritmo/solicitudes|Ver en Ritmo>`;
  if (s.estado === "supervisor") await avisarPersona(supervisorId, texto).catch(() => false);
  else await avisarRrhh(texto).catch(() => 0);
  return s;
}

export async function leerSolicitud(id: string): Promise<Solicitud | null> {
  const d = await db();
  const [s] = await d.select().from(desempenoSolicitudes).where(eq(desempenoSolicitudes.id, id));
  return s ?? null;
}

/** Aprueba (supervisor → RR.HH., o RR.HH. firma) o rechaza. Al firmar registra la ausencia si aplica. */
export async function decidirSolicitud(s: Solicitud, actor: { id: string; nombre: string }, aprobar: boolean, nota: string | null) {
  const d = await db();
  const ahora = new Date();
  const enSupervisor = s.estado === "supervisor";
  const estado = aprobar ? alAprobar(s.estado) : "rechazada";
  const firma = enSupervisor ? { supervisorId: actor.id, supervisorAt: ahora, supervisorNota: nota } : { rrhhId: actor.id, rrhhAt: ahora, rrhhNota: nota };
  let ausenciaId: string | null = null;
  if (estado === "aprobada") {
    const a = ausenciaDeSolicitud(s);
    if (a) {
      await crearAusencia({ userId: s.userId, tipo: a.tipo, desde: a.desde, hasta: a.hasta, dias: a.dias, certificado: false, nota: `Solicitud firmada por ${actor.nombre}` }, actor.id);
      const [ult] = await d.select({ id: desempenoAusencias.id }).from(desempenoAusencias).where(eq(desempenoAusencias.userId, s.userId)).orderBy(desc(desempenoAusencias.createdAt)).limit(1);
      ausenciaId = ult?.id ?? null;
    }
  }
  await d.update(desempenoSolicitudes).set({ ...firma, estado, ausenciaId }).where(eq(desempenoSolicitudes.id, s.id));
  await evento({ userId: s.userId, actorId: actor.id, tipo: `solicitud_${estado}`, datos: { id: s.id, nota } });
  if (estado === "rrhh") await avisarRrhh(`📝 ${esc(actor.nombre)} aprobó como supervisor una solicitud (*${tipoNombre(s.tipo)}*). Falta tu firma: <${base()}/ritmo/solicitudes|Ver en Ritmo>`).catch(() => 0);
  if (estado === "aprobada" || estado === "rechazada")
    await avisarPersona(s.userId, `${estado === "aprobada" ? "✅ Aprobada y firmada" : "❌ No aprobada"}: tu solicitud de *${tipoNombre(s.tipo)}*${nota ? ` — “${esc(nota)}”` : ""}. <${base()}/ritmo/solicitudes|Ver en Ritmo>`).catch(() => false);
  return estado;
}

export async function cancelarSolicitud(s: Solicitud, userId: string) {
  if (s.userId !== userId || !["supervisor", "rrhh"].includes(s.estado)) throw new Error("Ya no se puede cancelar");
  const d = await db();
  await d.update(desempenoSolicitudes).set({ estado: "cancelada" }).where(eq(desempenoSolicitudes.id, s.id));
}

/** Lo que ve cada quien: las suyas, las de su gente (supervisor) y, si es maestra, todas. */
export async function solicitudesPara(actor: { id: string; maestro: boolean }) {
  const d = await db();
  const filas = actor.maestro
    ? await d.select().from(desempenoSolicitudes).orderBy(desc(desempenoSolicitudes.createdAt)).limit(300)
    : await d.select().from(desempenoSolicitudes).where(or(eq(desempenoSolicitudes.userId, actor.id), eq(desempenoSolicitudes.supervisorId, actor.id))).orderBy(desc(desempenoSolicitudes.createdAt)).limit(300);
  const ids = [...new Set(filas.flatMap((s) => [s.userId, s.supervisorId, s.rrhhId]).filter((x): x is string => !!x))];
  const nombres = ids.length ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers).where(inArray(pulseUsers.id, ids)) : [];
  const nombre = (id: string | null) => (id ? (nombres.find((n) => n.id === id)?.nombre ?? "—") : null);
  return filas.map((s) => ({ ...s, nombre: nombre(s.userId)!, supervisorNombre: nombre(s.supervisorId), rrhhNombre: nombre(s.rrhhId) }));
}

/** Pendientes que le tocan al actor (para el numerito del menú). */
export async function pendientesDe(actor: { id: string; maestro: boolean }): Promise<number> {
  const { puedeDecidir } = await import("./rrhh");
  return (await solicitudesPara(actor)).filter((s) => puedeDecidir(s, actor)).length;
}
