// Viajes (puro; tests en tests/viajes.test.mjs): planificar vacaciones y el "viaje del año" por mérito.
// El viaje NO se sortea ni se regala: califica quien cumple antigüedad y un índice alto de asistencia +
// desempeño, y la dirección escoge al ganador entre los que califican.

export const TIPOS_VIAJE = [
  { id: "local", nombre: "Escapada local", detalle: "En tu ciudad o cerca", emoji: "🌴" },
  { id: "domestico", nombre: "Dentro de tu país", detalle: "Otra ciudad o región", emoji: "🚌" },
  { id: "internacional", nombre: "Internacional", detalle: "Otro país", emoji: "✈️" },
] as const;
export const tipoViaje = (id: string) => TIPOS_VIAJE.find((t) => t.id === id) ?? TIPOS_VIAJE[0];

export const VIAJE_MIN_MESES = 6; // antigüedad mínima al día del anuncio
export const VIAJE_MIN_INDICE = 90; // índice mínimo (0-100)
export const VIAJE_MIN_DIAS = 20; // días laborables con dato para que el índice cuente
export const PESO_ASISTENCIA = 0.4; // si hay score de desempeño: 40 % asistencia + 60 % desempeño

const prom = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function mesesEntre(desde: string, hasta: string) {
  const a = new Date(`${desde}T12:00:00Z`), b = new Date(`${hasta}T12:00:00Z`);
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) m--;
  return Math.max(0, m);
}

export type Elegibilidad = {
  meses: number;
  cumpleAntiguedad: boolean;
  dias: number;
  asistencia: number | null; // promedio del puntaje diario de asistencia
  desempeno: number | null; // promedio del score diario (si ya hay)
  indice: number | null;
  enCarrera: boolean;
  falta: string[];
};

/**
 * ¿Califica para el viaje del año? `asistencia` = puntajes diarios (0-100) de días laborables;
 * `scores` = score diario cuando existe. `ingreso` y `anuncio` en YYYY-MM-DD.
 */
export function elegibilidadViaje(p: { ingreso: string | null; anuncio: string; asistencia: number[]; scores: number[] }): Elegibilidad {
  const meses = p.ingreso ? mesesEntre(p.ingreso, p.anuncio) : 0;
  const asistencia = prom(p.asistencia);
  const desempeno = prom(p.scores);
  const indiceCrudo = asistencia === null ? null : desempeno === null ? asistencia : PESO_ASISTENCIA * asistencia + (1 - PESO_ASISTENCIA) * desempeno;
  const indice = indiceCrudo === null ? null : Math.round(indiceCrudo * 10) / 10;
  const falta: string[] = [];
  const cumpleAntiguedad = meses >= VIAJE_MIN_MESES;
  if (!cumpleAntiguedad) falta.push(`Llegar a ${VIAJE_MIN_MESES} meses en la empresa (llevas ${meses})`);
  if (p.asistencia.length < VIAJE_MIN_DIAS) falta.push(`Acumular al menos ${VIAJE_MIN_DIAS} días laborables marcados (llevas ${p.asistencia.length})`);
  if (indice !== null && indice < VIAJE_MIN_INDICE) falta.push(`Subir tu índice a ${VIAJE_MIN_INDICE} (hoy ${indice})`);
  return {
    meses,
    cumpleAntiguedad,
    dias: p.asistencia.length,
    asistencia: asistencia === null ? null : Math.round(asistencia * 10) / 10,
    desempeno: desempeno === null ? null : Math.round(desempeno * 10) / 10,
    indice,
    enCarrera: falta.length === 0 && indice !== null,
    falta,
  };
}

/** Días hasta una fecha (para la cuenta regresiva del viaje). Negativo = ya pasó. */
export function diasHasta(fecha: string, hoy: string): number {
  return Math.round((Date.parse(`${fecha}T12:00:00Z`) - Date.parse(`${hoy}T12:00:00Z`)) / 86_400_000);
}

/** Valida un plan de viaje. Devuelve el error o null. */
export function errorPlan(p: { tipo: string; destino: string; desde: string; hasta: string; presupuesto: string }, hoy: string): string | null {
  if (!TIPOS_VIAJE.some((t) => t.id === p.tipo)) return "Escoge el tipo de viaje";
  if ((p.destino ?? "").trim().length < 2) return "¿A dónde quieres ir?";
  const F = /^\d{4}-\d{2}-\d{2}$/;
  if (p.desde && !F.test(p.desde)) return "Fecha de salida inválida";
  if (p.hasta && !F.test(p.hasta)) return "Fecha de regreso inválida";
  if (p.desde && p.desde < hoy) return "La salida no puede ser en el pasado";
  if (p.desde && p.hasta && p.hasta < p.desde) return "El regreso tiene que ser después de la salida";
  if (p.presupuesto && (!Number.isFinite(Number(p.presupuesto)) || Number(p.presupuesto) < 0 || Number(p.presupuesto) > 100000)) return "Presupuesto inválido";
  return null;
}
