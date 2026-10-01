// Reporte diario del equipo (30/sep, Elvin: "un reporte de hoy: si todo estuvo en normalidad, si hubo alguna alerta, algo
// que verificar… envíaselo a Yaileen y déjamelo por ahí para verlo"). Puro: lo usan la tarjeta de Equipo y el cron.

export interface PersonaReporte {
  nombre: string;
  estado: string; // libre | pendiente | trabajando | a_tiempo | tarde | ausente
  minutosTarde: number;
  sigueAbierta: boolean; // entrada abierta pasada su hora de salida
  almuerzoMin: number | null;
  bloqueos: string | null;
}

export interface Alerta {
  tipo: "sin-marcar" | "racha" | "tarde" | "abierta" | "almuerzo" | "bloqueo" | "manual" | "red";
  titulo: string;
  detalle: string;
  grave: boolean;
}

export const ALMUERZO_LARGO_MIN = 65;

export function reporteDelDia(gente: PersonaReporte[], extra: { manualPendientes: number; redesNuevas: string[]; rendimiento?: { nivel: "amarilla" | "roja"; texto: string }[] }): { normal: boolean; resumen: string; alertas: Alerta[] } {
  const tocaba = gente.filter((g) => g.estado !== "libre");
  const marcaron = tocaba.filter((g) => ["trabajando", "a_tiempo", "tarde"].includes(g.estado));
  const alertas: Alerta[] = [];
  const nombres = (xs: string[]) => xs.join(", ");

  const sin = tocaba.filter((g) => g.estado === "ausente");
  if (sin.length) alertas.push({ tipo: "sin-marcar", titulo: `${sin.length} sin marcar`, detalle: nombres(sin.map((g) => g.nombre)), grave: true });
  // Rendimiento (30/sep, Elvin): 🔴 4+ días malos en el mes · 🟡 2+ días malos seguidos (ver alertaRendimiento).
  const rojas = (extra.rendimiento ?? []).filter((r) => r.nivel === "roja");
  const amarillas = (extra.rendimiento ?? []).filter((r) => r.nivel === "amarilla");
  if (rojas.length) alertas.push({ tipo: "racha", titulo: `${rojas.length} en alerta roja de rendimiento (4+ días malos este mes)`, detalle: rojas.map((r) => r.texto.replace(/^🔴 /, "")).join(" · "), grave: true });
  if (amarillas.length) alertas.push({ tipo: "racha", titulo: `${amarillas.length} en alerta amarilla (días malos seguidos)`, detalle: amarillas.map((r) => r.texto.replace(/^🟡 /, "")).join(" · "), grave: false });
  const tarde = marcaron.filter((g) => g.minutosTarde > 15).sort((a, b) => b.minutosTarde - a.minutosTarde);
  if (tarde.length) alertas.push({ tipo: "tarde", titulo: `${tarde.length} llegaron tarde`, detalle: nombres(tarde.map((g) => `${g.nombre} (${g.minutosTarde} min)`)), grave: false });
  const abierta = gente.filter((g) => g.sigueAbierta);
  if (abierta.length) alertas.push({ tipo: "abierta", titulo: `${abierta.length} con la entrada abierta`, detalle: `${nombres(abierta.map((g) => g.nombre))} (ya pasó su hora de salida)`, grave: false });
  const largo = gente.filter((g) => (g.almuerzoMin ?? 0) > ALMUERZO_LARGO_MIN);
  if (largo.length) alertas.push({ tipo: "almuerzo", titulo: `${largo.length} con almuerzo de más de 1 hora`, detalle: nombres(largo.map((g) => `${g.nombre} (${g.almuerzoMin} min)`)), grave: false });
  const bloq = gente.filter((g) => g.bloqueos?.trim());
  if (bloq.length) alertas.push({ tipo: "bloqueo", titulo: `${bloq.length} reportaron bloqueos`, detalle: bloq.map((g) => `${g.nombre}: ${g.bloqueos!.trim().slice(0, 140)}`).join(" · "), grave: false });
  if (extra.manualPendientes) alertas.push({ tipo: "manual", titulo: `${extra.manualPendientes} ${extra.manualPendientes === 1 ? "ponche manual" : "ponches manuales"} por autorizar`, detalle: "En Ritmo → Seguridad", grave: false });
  if (extra.redesNuevas.length) alertas.push({ tipo: "red", titulo: `${extra.redesNuevas.length} poncharon desde una red nueva`, detalle: nombres(extra.redesNuevas), grave: false });

  const resumen = tocaba.length ? `${marcaron.length} de ${tocaba.length} marcaron entrada${tarde.length ? ` · ${tarde.length} tarde` : ""}` : "Hoy no le tocaba trabajar a nadie";
  return { normal: alertas.length === 0, resumen, alertas };
}

/** El mensaje para Slack (RR.HH.). `esc` limpia lo que escribió el equipo (bloqueos, nombres). */
export function textoReporte(r: ReturnType<typeof reporteDelDia>, fecha: string, url: string, esc: (s: string) => string = (s) => s): string {
  const dia = new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });
  if (r.normal) return `✅ *Reporte del equipo · ${dia}*\nTodo en normalidad. ${r.resumen}. <${url}|Ver en Ritmo>`;
  const lineas = r.alertas.map((a) => `${a.grave ? "🔴" : "🟡"} *${a.titulo}*: ${esc(a.detalle)}`);
  return `📋 *Reporte del equipo · ${dia}*\n${r.resumen}.\n\n*Para verificar:*\n${lineas.join("\n")}\n\n<${url}|Ver en Ritmo>`;
}
