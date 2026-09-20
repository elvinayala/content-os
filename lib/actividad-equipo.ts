import "server-only";

import { promises as fs } from "fs";
import path from "path";

// Productividad/asistencia del equipo en Slack. El snapshot lo escribe
// scripts/actividad-equipo.mjs (tareas al fin de la jornada) y también manda el
// reporte del día al DM de Carilin. La app solo LEE el JSON.

export type EstadoActividad = "rojo" | "amarillo" | "verde" | "na";

export interface PersonaActividad {
  id: string;
  nombre: string;
  rol: string;
  mensajesHoy: number;
  mensajes7d: number;
  ultimaActividad: string | null; // ISO
  ultimaHace: string; // "hace 2h"
  maxGapMin: number; // hueco más grande hoy en la ventana laboral (min)
  estado: EstadoActividad;
  motivo: string;
  respuestaMin: number | null; // tiempo de respuesta aprox (min, 7d)
}

export interface ActividadEquipo {
  actualizadoEl: string;
  ventana: { fecha: string; sabado: boolean } | null;
  canalesLeidos: number;
  personas: PersonaActividad[];
}

export async function leerActividadEquipo(): Promise<ActividadEquipo | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "actividad-equipo.json"),
      "utf-8",
    );
    return JSON.parse(raw) as ActividadEquipo;
  } catch {
    return null;
  }
}

export function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}
