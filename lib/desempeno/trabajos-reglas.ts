// Trabajos del día del videógrafo (12/oct, Elvin: "Derek Toro, videógrafo, sin ponchar… viaja la isla y debe poner trabajo
// realizado, negocio, pueblo, cantidad de videos trabajados para ese cliente, hora y día"). Puro: lo usan la pantalla,
// las acciones y los tests. Cada trabajo alimenta su reporte del día (trabajos · videos · negocios) para Equipo y Ranking.

export const PUEBLOS_PR = [
  "Adjuntas", "Aguada", "Aguadilla", "Aguas Buenas", "Aibonito", "Añasco", "Arecibo", "Arroyo", "Barceloneta", "Barranquitas",
  "Bayamón", "Cabo Rojo", "Caguas", "Camuy", "Canóvanas", "Carolina", "Cataño", "Cayey", "Ceiba", "Ciales", "Cidra", "Coamo",
  "Comerío", "Corozal", "Culebra", "Dorado", "Fajardo", "Florida", "Guánica", "Guayama", "Guayanilla", "Guaynabo", "Gurabo",
  "Hatillo", "Hormigueros", "Humacao", "Isabela", "Jayuya", "Juana Díaz", "Juncos", "Lajas", "Lares", "Las Marías", "Las Piedras",
  "Loíza", "Luquillo", "Manatí", "Maricao", "Maunabo", "Mayagüez", "Moca", "Morovis", "Naguabo", "Naranjito", "Orocovis",
  "Patillas", "Peñuelas", "Ponce", "Quebradillas", "Rincón", "Río Grande", "Sabana Grande", "Salinas", "San Germán", "San Juan",
  "San Lorenzo", "San Sebastián", "Santa Isabel", "Toa Alta", "Toa Baja", "Trujillo Alto", "Utuado", "Vega Alta", "Vega Baja",
  "Vieques", "Villalba", "Yabucoa", "Yauco",
] as const;

/** Días hacia atrás que puede anotar (viaja y a veces llena al otro día). */
export const DIAS_ATRAS_TRABAJOS = 7;

export interface TrabajoNuevo {
  fecha: string; // YYYY-MM-DD (día del trabajo, hora de PR)
  hora: string; // HH:MM
  trabajo: string; // qué hizo
  negocio: string;
  pueblo: string;
  videos: number;
}

export interface Trabajo extends TrabajoNuevo {
  id: string;
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** El pueblo escrito como sea ("mayaguez", "SAN JUAN ") → el nombre oficial, o null si no es de PR. */
export function puebloOficial(p: string): string | null {
  const k = sinAcentos(p.replace(/\s+/g, " "));
  return PUEBLOS_PR.find((x) => sinAcentos(x) === k) ?? null;
}

const sumarDias = (f: string, n: number) => new Date(Date.parse(`${f}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Limpia y valida un trabajo. Devuelve el trabajo listo o el error para la persona. */
export function validarTrabajo(t: Partial<Record<keyof TrabajoNuevo, unknown>>, hoy: string): { ok: true; t: TrabajoNuevo } | { ok: false; error: string } {
  const texto = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
  const fecha = texto(t.fecha);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > hoy) return { ok: false, error: "Escoge el día del trabajo (no puede ser en el futuro)" };
  if (fecha < sumarDias(hoy, -DIAS_ATRAS_TRABAJOS)) return { ok: false, error: `Solo puedes anotar trabajos de los últimos ${DIAS_ATRAS_TRABAJOS} días` };
  const hora = texto(t.hora);
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { ok: false, error: "Pon la hora del trabajo" };
  const trabajo = texto(t.trabajo);
  if (trabajo.length < 3) return { ok: false, error: "Describe el trabajo que hiciste" };
  if (trabajo.length > 300) return { ok: false, error: "La descripción es muy larga (máx. 300 letras)" };
  const negocio = texto(t.negocio);
  if (negocio.length < 2 || negocio.length > 120) return { ok: false, error: "Escribe el nombre del negocio" };
  const pueblo = puebloOficial(texto(t.pueblo));
  if (!pueblo) return { ok: false, error: "Escoge un pueblo de Puerto Rico de la lista" };
  const videos = Number(t.videos);
  if (!Number.isInteger(videos) || videos < 0 || videos > 200) return { ok: false, error: "Pon cuántos videos trabajaste (0 a 200)" };
  return { ok: true, t: { fecha, hora: `${m[1].padStart(2, "0")}:${m[2]}`, trabajo, negocio, pueblo, videos } };
}

/** Lo que va al reporte del día: números para KPIs/Ranking y el detalle legible (lo que se ve en Ranking → Ayer). */
export function resumenTrabajos(ts: TrabajoNuevo[]): { datos: Record<string, number>; detalles: Record<string, string> } {
  const orden = [...ts].sort((a, b) => a.hora.localeCompare(b.hora));
  const negocios = [...new Set(orden.map((t) => t.negocio.toLowerCase()))].length;
  const videos = orden.reduce((n, t) => n + t.videos, 0);
  return {
    datos: { trabajos: orden.length, videos, negocios },
    detalles: orden.length
      ? {
          trabajos: orden.map((t) => `${t.hora} ${t.negocio} (${t.pueblo}): ${t.trabajo}`).join(" · "),
          videos: orden.map((t) => `${t.negocio} ${t.videos}`).join(" · "),
          negocios: [...new Set(orden.map((t) => `${t.negocio} (${t.pueblo})`))].join(" · "),
        }
      : {},
  };
}

/** 14:30 → 2:30 PM. */
export function horaBonita(h: string): string {
  const [hh, mm] = h.split(":").map(Number);
  return `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
}
