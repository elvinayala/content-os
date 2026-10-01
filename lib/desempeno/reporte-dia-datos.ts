import "server-only";

import { and, eq, gte, inArray } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import type { FilaPersona } from "./datos";
import { aMinutos, fechaPR, minutosPR } from "./reglas";
import { reporteDelDia, type PersonaReporte } from "./reporte-dia";
import { desempenoEventos, desempenoPoncheManual } from "./schema";

/** El reporte de hoy a partir de las filas del panel (las mismas que ve Equipo). */
export async function reporteDeHoy(filas: FilaPersona[]) {
  const ahoraMin = minutosPR(Date.now());
  const gente: PersonaReporte[] = filas.map((f) => {
    const alm = f.hoy.almuerzo;
    const almuerzoMin = alm?.vuelta ? Math.round((Date.parse(alm.vuelta) - Date.parse(alm.salida)) / 60000) : null;
    return {
      nombre: f.perfil.nombre,
      estado: f.hoy.asistencia.estado,
      minutosTarde: f.hoy.asistencia.minutosTarde,
      sigueAbierta: f.ponchesAbiertos.length > 0 && ahoraMin >= aMinutos(f.perfil.horaSalida) + 30,
      almuerzoMin,
      bloqueos: f.hoy.reporte?.bloqueos ?? null,
    };
  });
  const d = await db();
  const inicioDia = new Date(`${fechaPR(Date.now())}T00:00:00-04:00`);
  const ids = filas.map((f) => f.perfil.userId);
  const [manual, redes] = await Promise.all([
    d.select({ id: desempenoPoncheManual.id }).from(desempenoPoncheManual).where(eq(desempenoPoncheManual.estado, "pendiente")).catch(() => []),
    ids.length
      ? d
          .selectDistinct({ nombre: pulseUsers.nombre })
          .from(desempenoEventos)
          .innerJoin(pulseUsers, eq(pulseUsers.id, desempenoEventos.userId))
          .where(and(eq(desempenoEventos.tipo, "ponche-otra-red"), gte(desempenoEventos.at, inicioDia), inArray(desempenoEventos.userId, ids)))
          .catch(() => [])
      : Promise.resolve([] as { nombre: string }[]),
  ]);
  return reporteDelDia(gente, { manualPendientes: manual.length, redesNuevas: redes.map((r) => r.nombre) });
}
