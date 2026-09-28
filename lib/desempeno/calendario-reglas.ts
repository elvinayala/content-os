// Calendario de ausencias y choques de fechas (28/sep/2026). Puro: tests en tests/calendario.test.mjs.
// Elvin: "quiero ver quién está de vacaciones, evitar que se vayan en las mismas fechas. Los estrategas no se
// pueden ir dos a la vez."

/** Cuántas personas del mismo puesto (y la misma empresa) pueden estar fuera el mismo día. */
export const TOPE_FUERA: Record<string, number> = { estratega: 1 };

export interface Tramo {
  id: string; // ausencia o solicitud
  userId: string;
  nombre: string;
  puesto: string;
  empresa: string;
  tipo: string; // vacaciones | dia_libre | permiso | enfermedad | maternidad | personal
  desde: string; // YYYY-MM-DD
  hasta: string;
  estado: "aprobada" | "pendiente";
}

const solapan = (a: { desde: string; hasta: string }, b: { desde: string; hasta: string }) => a.desde <= b.hasta && b.desde <= a.hasta;

/**
 * Con quién choca un pedido nuevo: gente del MISMO puesto y empresa con tope (hoy solo estrategas), fuera en
 * alguna de esas fechas. `bloquea` = ya aprobadas (esas mandan: el primero que se aprobó se queda con las fechas);
 * `pendientes` = otras solicitudes en curso que también las piden (se avisa, decide quien aprueba).
 */
export function choques(nuevo: { id?: string; userId: string; puesto: string; empresa: string; desde: string; hasta: string }, tramos: Tramo[]): { bloquea: Tramo[]; pendientes: Tramo[]; tope: number | null } {
  const tope = TOPE_FUERA[nuevo.puesto] ?? null;
  if (tope === null) return { bloquea: [], pendientes: [], tope };
  const otros = tramos.filter((t) => t.id !== nuevo.id && t.userId !== nuevo.userId && t.puesto === nuevo.puesto && t.empresa === nuevo.empresa && solapan(t, nuevo));
  const aprobadas = otros.filter((t) => t.estado === "aprobada");
  // Con tope 1 cualquier aprobada que se cruce bloquea; con tope N, bloquea si algún día ya hay N fuera.
  const lleno = dias(nuevo.desde, nuevo.hasta).some((d) => aprobadas.filter((t) => t.desde <= d && d <= t.hasta).length >= tope);
  return { bloquea: lleno ? aprobadas : [], pendientes: otros.filter((t) => t.estado === "pendiente"), tope };
}

export const PUESTO_PLURAL: Record<string, string> = { estratega: "estrategas" };

export function mensajeChoque(c: ReturnType<typeof choques>, puesto: string): string | null {
  if (!c.bloquea.length) return null;
  const quien = c.bloquea.map((t) => `${t.nombre.split(" ")[0]} (${rango(t.desde, t.hasta)})`).join(", ");
  return `En esas fechas ya está fuera ${quien}. No pueden estar fuera ${c.tope === 1 ? "dos" : `más de ${c.tope}`} ${PUESTO_PLURAL[puesto] ?? puesto} a la vez: escoge otras fechas.`;
}

export function avisoPendientes(c: ReturnType<typeof choques>): string | null {
  if (!c.pendientes.length) return null;
  return `Ojo: ${c.pendientes.map((t) => `${t.nombre.split(" ")[0]} (${rango(t.desde, t.hasta)})`).join(", ")} también pidió esas fechas y está por aprobarse.`;
}

// ─── Calendario ──────────────────────────────────────────────────────────────────────────────

export function dias(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${desde}T12:00:00Z`), fin = Date.parse(`${hasta}T12:00:00Z`); t <= fin && out.length < 400; t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

/** Semanas (lunes → domingo) que cubren el mes `YYYY-MM`. */
export function semanasDelMes(mes: string): string[][] {
  const [y, m] = mes.split("-").map(Number);
  const primero = `${mes}-01`;
  const ultimo = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const dow = (new Date(`${primero}T12:00:00Z`).getUTCDay() + 6) % 7;
  const inicio = new Date(Date.parse(`${primero}T12:00:00Z`) - dow * 86_400_000).toISOString().slice(0, 10);
  const todos = dias(inicio, ultimo);
  while (todos.length % 7) todos.push(new Date(Date.parse(`${todos[todos.length - 1]}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10));
  const out: string[][] = [];
  for (let i = 0; i < todos.length; i += 7) out.push(todos.slice(i, i + 7));
  return out;
}

/** Días del rango en que se pasa el tope de algún puesto (para pintarlos en rojo). */
export function diasEnConflicto(tramos: Tramo[], desde: string, hasta: string): Set<string> {
  const out = new Set<string>();
  for (const d of dias(desde, hasta)) {
    const fuera = tramos.filter((t) => t.desde <= d && d <= t.hasta);
    const cuenta = new Map<string, number>();
    for (const t of fuera) if (TOPE_FUERA[t.puesto] != null) cuenta.set(`${t.empresa}|${t.puesto}`, (cuenta.get(`${t.empresa}|${t.puesto}`) ?? 0) + 1);
    for (const [k, n] of cuenta) if (n > TOPE_FUERA[k.split("|")[1]]) out.add(d);
  }
  return out;
}

export const mesSiguiente = (mes: string, n: number) => {
  const [y, m] = mes.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1 + n, 1));
  return f.toISOString().slice(0, 7);
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const rango = (desde: string, hasta: string) => {
  const f = (x: string) => `${Number(x.slice(8, 10))} ${MESES[Number(x.slice(5, 7)) - 1]}`;
  return desde === hasta ? f(desde) : `${f(desde)} – ${f(hasta)}`;
};
