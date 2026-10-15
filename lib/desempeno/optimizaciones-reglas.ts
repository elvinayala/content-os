// Cuentas por optimizar (Ritmo · 15/oct/2026) — reglas puras. Tests: tests/optimizaciones.test.mjs.
//
// Elvin: "¿Cómo nos aseguramos de que lo hagan? Que marquen ejecutado cuando se soliciten los cambios, y si no se va a
// ejecutar, que expliquen por qué. Esa cuenta con margen de mejora pasa a Ritmo como cuenta no optimizada, y ahí la
// revisan el director de tráfico (María del Carmen, Juan Diego) y Carilin, y la marcan cuando ya esté bien. Se le puede
// pedir optimización de algún caso en riesgo."
//
// Cada revisión de Max (scripts/revision-clientes.mjs) con algo que hacer abre un CASO por cliente con sus ACCIONES
// (los puntos del resumen). El estratega marca cada acción: ejecutado, o no + por qué. La dirección de tráfico cierra el
// caso ("ya está bien") o le pide más. Una revisión nueva del mismo cliente reemplaza al caso abierto (lo que quedó sin
// marcar cuenta como no cumplido).

export type TipoAccion = "entrega" | "reemplazar" | "costo" | "rotar" | "escalar" | "evaluar" | "estructura" | "frecuencia";
export type EstadoAccion = "pendiente" | "ejecutado" | "no";
export type EstadoCaso = "abierta" | "bien" | "reemplazada";
export type EstadoCuentaRevision = "no-optimizada" | "escalar";

export interface Accion {
  id: string;
  tipo: TipoAccion;
  prioridad: 1 | 2 | 3;
  texto: string;
  estado: EstadoAccion;
  motivo?: string;
  por?: string; // nombre de quien marcó
  at?: string; // ISO
}
export interface Pedido { por: string; texto: string; at: string }
export interface Caso {
  id: number;
  itemId: string;
  cliente: string;
  empresa: string | null;
  cuentaId: string | null;
  estrategaId: string | null;
  estratega: string | null;
  fecha: string; // día de la revisión (PR)
  estadoCuenta: EstadoCuentaRevision;
  estado: EstadoCaso;
  resumen: string;
  acciones: Accion[];
  pedidos: Pedido[];
  simulacion: boolean;
  cerradoPor: string | null;
  cerradoAt: string | null;
  notaCierre: string | null;
}

const TIPOS: TipoAccion[] = ["entrega", "reemplazar", "costo", "rotar", "escalar", "evaluar", "estructura", "frecuencia"];

/** Lo que llega del script de Max (no confiable): se limpia y se recorta. */
export function limpiarAcciones(xs: unknown): Accion[] {
  if (!Array.isArray(xs)) return [];
  const vistos = new Set<string>();
  const out: Accion[] = [];
  for (const x of xs.slice(0, 15)) {
    const a = (x ?? {}) as Record<string, unknown>;
    const id = String(a.id ?? "").trim().slice(0, 80);
    const texto = String(a.texto ?? "").replace(/\s+/g, " ").trim().slice(0, 240);
    const tipo = TIPOS.includes(a.tipo as TipoAccion) ? (a.tipo as TipoAccion) : null;
    if (!id || !texto || !tipo || vistos.has(id)) continue;
    vistos.add(id);
    const p = Number(a.prioridad);
    out.push({ id, tipo, prioridad: p === 1 || p === 3 ? p : 2, texto, estado: "pendiente" });
  }
  return out;
}

/** Marcar: "ejecutado", o "no" con el porqué (obligatorio, mínimo unas palabras). */
export function validarMarca(estado: string, motivo?: string | null): { ok: true; estado: EstadoAccion; motivo?: string } | { ok: false; error: string } {
  if (estado === "ejecutado") return { ok: true, estado: "ejecutado" };
  if (estado === "pendiente") return { ok: true, estado: "pendiente" };
  if (estado !== "no") return { ok: false, error: "Estado no válido" };
  const m = (motivo ?? "").replace(/\s+/g, " ").trim();
  if (m.length < 8) return { ok: false, error: "Explica por qué no se hizo (una frase)" };
  return { ok: true, estado: "no", motivo: m.slice(0, 400) };
}

export function progreso(acciones: Accion[]) {
  const total = acciones.length;
  const ejecutadas = acciones.filter((a) => a.estado === "ejecutado").length;
  const no = acciones.filter((a) => a.estado === "no").length;
  const pendientes = total - ejecutadas - no;
  return { total, ejecutadas, no, pendientes, completo: total > 0 && pendientes === 0 };
}

/** Quién ve y qué puede hacer. Dirección de tráfico = María del Carmen, Juan Diego, Carilin (+ admin/editoras). */
export type RolCuentas = "direccion" | "estratega" | null;
export function rolCuentas(u: { id: string; email: string; rol: string }, directores: string[], tieneCasos: boolean): RolCuentas {
  if (u.rol === "admin" || u.rol === "editor" || directores.includes(u.email.toLowerCase())) return "direccion";
  return tieneCasos ? "estratega" : null;
}
export function puedeMarcar(caso: Pick<Caso, "estrategaId" | "estado">, u: { id: string }, rol: RolCuentas): boolean {
  if (caso.estado !== "abierta") return false;
  return rol === "direccion" || caso.estrategaId === u.id;
}

/** Días hábiles (L-V) entre dos días YYYY-MM-DD, sin contar el primero. */
export function diasHabiles(desde: string, hasta: string): number {
  let n = 0;
  const d = new Date(desde + "T12:00:00Z");
  const fin = new Date(hasta + "T12:00:00Z");
  while (d < fin) {
    d.setUTCDate(d.getUTCDate() + 1);
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

/** Seguimiento: la revisión sale el lunes y vence el miércoles. Jueves (3 días hábiles) con puntos sin marcar → recordatorio
 * al estratega; viernes (4) → aviso a la dirección de tráfico. */
export const RECORDAR_DIAS = 3;
export const ESCALAR_DIAS = 4;
export function seguimientoDe(caso: Pick<Caso, "fecha" | "estado" | "acciones" | "simulacion"> & { recordado: boolean; escalado: boolean }, hoy: string): "recordar" | "escalar" | null {
  if (caso.estado !== "abierta" || caso.simulacion || !progreso(caso.acciones).pendientes) return null;
  const d = diasHabiles(caso.fecha, hoy);
  if (d >= ESCALAR_DIAS && !caso.escalado) return "escalar";
  if (d >= RECORDAR_DIAS && !caso.recordado) return "recordar";
  return null;
}

/** Cumplimiento por estratega (casos de la ventana): marcó (ejecutado o explicó) y ejecutó, sobre el total. */
export function cumplimiento(casos: Caso[]) {
  const por = new Map<string, { estratega: string; casos: number; abiertos: number; total: number; ejecutadas: number; no: number; pendientes: number }>();
  for (const c of casos) {
    if (c.simulacion) continue;
    const k = c.estrategaId ?? "—";
    const x = por.get(k) ?? { estratega: c.estratega ?? "Sin estratega", casos: 0, abiertos: 0, total: 0, ejecutadas: 0, no: 0, pendientes: 0 };
    const p = progreso(c.acciones);
    x.casos++;
    if (c.estado === "abierta") x.abiertos++;
    x.total += p.total;
    x.ejecutadas += p.ejecutadas;
    x.no += p.no;
    x.pendientes += p.pendientes;
    por.set(k, x);
  }
  return [...por.entries()]
    .map(([id, x]) => ({ id, ...x, marcado: x.total ? Math.round(((x.ejecutadas + x.no) / x.total) * 100) : null, ejecutado: x.total ? Math.round((x.ejecutadas / x.total) * 100) : null }))
    .sort((a, b) => b.pendientes - a.pendientes || a.estratega.localeCompare(b.estratega));
}

export const ETIQUETA_CUENTA: Record<EstadoCuentaRevision, string> = { "no-optimizada": "Cuenta no optimizada", escalar: "Para escalar" };

/** Fecha límite: el miércoles de la semana de la revisión. */
export function venceEl(dia: string): string {
  const d = new Date(dia + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + ((3 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}
export function plazo(dia: string, hoy: string): "a-tiempo" | "vence-hoy" | "vencido" {
  const v = venceEl(dia);
  return hoy < v ? "a-tiempo" : hoy === v ? "vence-hoy" : "vencido";
}
