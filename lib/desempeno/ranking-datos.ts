import "server-only";

import type { FilaPersona } from "./datos";
import type { PersonaRank } from "./ranking";
import { puestoPorId } from "./reglas";

/** Las filas del panel de Ritmo en el formato del ranking (KPIs que reporta su puesto, asistencia y almuerzo por día). */
export function personasRank(filas: FilaPersona[]): PersonaRank[] {
  return filas.map((f) => ({
    id: f.perfil.userId,
    nombre: f.perfil.nombre,
    puesto: f.perfil.puesto,
    puestoNombre: f.puestoNombre,
    departamento: f.departamento,
    kpis: (puestoPorId(f.perfil.puesto)?.manual ?? []).map((m) => ({ id: m.id, nombre: m.nombre })),
    dias: f.dias.map((d) => ({
      fecha: d.fecha,
      estado: d.asistencia.estado,
      puntaje: d.asistencia.puntaje,
      minutosTarde: d.asistencia.minutosTarde,
      almuerzoMin: d.almuerzo?.vuelta ? Math.round((Date.parse(d.almuerzo.vuelta) - Date.parse(d.almuerzo.salida)) / 60000) : null,
      reporto: !!d.reporte,
      datos: d.reporte?.datos ?? {},
    })),
  }));
}
