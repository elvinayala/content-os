import { redirect } from "next/navigation";

// El monitor viejo (huecos de actividad en Slack → rojo) se retiró el 25/sep/2026: marcaba rojo a
// todo el equipo y medía presión, no resultados. Lo reemplaza Ritmo (asistencia + KPIs por puesto).
export default function ActividadEquipoPage() {
  redirect("/ritmo/equipo");
}
