// Cambios que esperan el OK de Elvin (28/sep/2026): "Carilin y Aure editan a mano, con aprobación mía". Solo lo
// sensible espera; lo menor se aplica al momento. Puro (tests en tests/cambios.test.mjs).

// Lo que cambia quién es, dónde está, a quién responde, si entra o cuánto gana.
export const SENSIBLES_PERFIL = ["puesto", "empresa", "tambienEn", "liderId", "activo", "soloRitmo", "tipoContrato"] as const;
export const SENSIBLES_FICHA = ["salarioMensual"] as const;

export type TipoCambio = "perfil" | "ficha";

export interface CambioCampo {
  campo: string;
  antes: unknown;
  despues: unknown;
}

export const ETIQUETA_CAMPO: Record<string, string> = {
  puesto: "Puesto",
  empresa: "Empresa",
  tambienEn: "También vende en",
  liderId: "Supervisor",
  activo: "Activo en Ritmo",
  soloRitmo: "Acceso a Pulse",
  tipoContrato: "Tipo de contrato",
  salarioMensual: "Salario mensual",
};

/** Solo Elvin (admin) aplica lo sensible directo; cualquier otra persona de la dirección o RR.HH. lo propone. */
export const necesitaAprobacion = (rol: string) => rol !== "admin";

const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Diferencias en los campos sensibles. Sin "antes" (perfil nuevo) todo lo sensible cuenta como cambio. */
export function diferencias(campos: readonly string[], antes: Record<string, unknown> | null, despues: Record<string, unknown>): CambioCampo[] {
  return campos.filter((c) => c in despues && (!antes || !igual(antes[c], despues[c]))).map((c) => ({ campo: c, antes: antes ? (antes[c] ?? null) : null, despues: despues[c] ?? null }));
}

/**
 * Parte un guardado en lo que se aplica YA (lo menor, con lo sensible como estaba) y lo que espera a Elvin.
 * Perfil nuevo (sin "antes"): no se puede crear a medias → todo espera (aplicarYa = null).
 */
export function separar<T extends Record<string, unknown>>(campos: readonly string[], antes: T | null, despues: T): { aplicarYa: T | null; pendientes: CambioCampo[] } {
  const pendientes = diferencias(campos, antes, despues);
  if (!pendientes.length) return { aplicarYa: despues, pendientes };
  if (!antes) return { aplicarYa: null, pendientes };
  const ya = { ...despues };
  for (const p of pendientes) (ya as Record<string, unknown>)[p.campo] = antes[p.campo];
  return { aplicarYa: ya, pendientes };
}

/** Aplica los cambios aprobados sobre el estado de HOY (lo menor que se editó después no se pisa). */
export function aplicar<T extends Record<string, unknown>>(actual: T, cambios: CambioCampo[]): T {
  const r = { ...actual };
  for (const c of cambios) (r as Record<string, unknown>)[c.campo] = c.despues;
  return r;
}

/** Texto para Elvin: "Puesto: Estratega → Tesorera". */
export function describir(c: CambioCampo, nombre: (campo: string, valor: unknown) => string): string {
  return `${ETIQUETA_CAMPO[c.campo] ?? c.campo}: ${nombre(c.campo, c.antes)} → ${nombre(c.campo, c.despues)}`;
}

/** Valor legible por defecto (sí/no, vacío, dinero). */
export function valorLegible(campo: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (campo === "soloRitmo") return v ? "solo Ritmo" : "Ritmo + Pulse";
  if (typeof v === "boolean") return v ? "sí" : "no";
  if (campo === "salarioMensual" && typeof v === "number") return `US$${v.toLocaleString("en-US")}`;
  return String(v);
}
