import type { ValorCelda } from "./types";

// Automatizaciones de Pulse (lo que Monday hacía solo). v1 (Carilin #13/#16) eran 4 reglas fijas
// "etiqueta → grupo"; v2 (24/sep/2026) las guarda en la base (tabla pulse_reglas) para que se
// creen y editen desde la pantalla, y suma acciones. Todo por id (columna, etiqueta, grupo,
// usuario): renombrar en la UI no rompe nada. Puro y testeado (tests/pulse-automatizaciones.test.mjs);
// el motor del servidor (lib/pulse/motor-reglas.ts) aplica exactamente esto.

export type Cuando =
  // cuando la columna (status/dropdown) CAMBIA a la etiqueta `valor`
  | { tipo: "valor"; columnId: string; valor: string; excepto?: string[] }
  // cuando el elemento se mueve (a mano) al grupo `groupId`
  | { tipo: "grupo"; groupId: string; excepto?: string[] };

export type Accion =
  | { tipo: "mover"; groupId: string }
  | { tipo: "fecha"; columnId: string; dias: number; soloSiVacia?: boolean } // hoy + dias
  | { tipo: "valor"; columnId: string; valor: string } // poner una etiqueta
  | { tipo: "persona"; columnId: string; userId: string } // asignar a alguien
  | { tipo: "exigir"; columnId: string } // no deja hacer el cambio si esa columna está vacía
  | { tipo: "avisar"; userId: string }; // DM por Slack

export interface Regla {
  id: string;
  boardId: string;
  nombre: string;
  activa: boolean;
  cuando: Cuando;
  entonces: Accion[];
}

export type Evento =
  | { tipo: "valor"; columnId: string; antes: ValorCelda; despues: ValorCelda; grupoActual: string }
  | { tipo: "grupo"; desde: string; hacia: string };

const incluye = (v: ValorCelda, id: string) => (Array.isArray(v) ? (v as string[]).includes(id) : v === id);

/** ¿Esta regla se dispara con este evento? Solo cuando CAMBIA a la etiqueta o al grupo. */
export function dispara(r: Regla, e: Evento): boolean {
  if (!r.activa) return false;
  if (r.cuando.tipo === "valor" && e.tipo === "valor") {
    if (r.cuando.columnId !== e.columnId) return false;
    if (!incluye(e.despues, r.cuando.valor) || incluye(e.antes, r.cuando.valor)) return false;
    return !r.cuando.excepto?.includes(e.grupoActual);
  }
  if (r.cuando.tipo === "grupo" && e.tipo === "grupo") {
    if (r.cuando.groupId !== e.hacia || e.desde === e.hacia) return false;
    return !r.cuando.excepto?.includes(e.desde);
  }
  return false;
}

export const reglasDisparadas = (reglas: Regla[], e: Evento) => reglas.filter((r) => dispara(r, e));

const vacio = (v: ValorCelda | undefined) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Columnas que estas reglas exigen y que el elemento tiene vacías (bloquea el cambio). */
export function requisitosFaltantes(disparadas: Regla[], valores: Record<string, ValorCelda>): string[] {
  const faltan = new Set<string>();
  for (const r of disparadas) for (const a of r.entonces) if (a.tipo === "exigir" && vacio(valores[a.columnId])) faltan.add(a.columnId);
  return [...faltan];
}

export function sumarDias(hoyISO: string, dias: number): string {
  const d = new Date(`${hoyISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export interface Plan {
  valores: Record<string, ValorCelda>; // columnId → valor nuevo
  moverA: string | null;
  avisar: string[]; // userIds
  reglas: string[]; // nombres de las reglas que hicieron algo
}

/** Qué hay que hacerle al elemento. No repite lo que ya está (no mueve si ya está en el grupo). */
export function planDeAcciones(disparadas: Regla[], item: { groupId: string; values: Record<string, ValorCelda> }, hoyISO: string): Plan {
  const plan: Plan = { valores: {}, moverA: null, avisar: [], reglas: [] };
  const actual = (col: string) => (col in plan.valores ? plan.valores[col] : item.values[col]);
  for (const r of disparadas) {
    let hizo = false;
    for (const a of r.entonces) {
      if (a.tipo === "mover") {
        if (a.groupId !== item.groupId) {
          plan.moverA = a.groupId;
          hizo = true;
        }
      } else if (a.tipo === "fecha") {
        if ((a.soloSiVacia ?? true) && !vacio(actual(a.columnId))) continue;
        plan.valores[a.columnId] = sumarDias(hoyISO, a.dias);
        hizo = true;
      } else if (a.tipo === "valor") {
        if (actual(a.columnId) === a.valor) continue;
        plan.valores[a.columnId] = a.valor;
        hizo = true;
      } else if (a.tipo === "persona") {
        const lista = (actual(a.columnId) as string[] | null) ?? [];
        if (lista.includes(a.userId)) continue;
        plan.valores[a.columnId] = [...lista, a.userId];
        hizo = true;
      } else if (a.tipo === "avisar") {
        if (!plan.avisar.includes(a.userId)) plan.avisar.push(a.userId);
        hizo = true;
      }
    }
    if (hizo) plan.reglas.push(r.nombre);
  }
  return plan;
}

// ---------- Reglas iniciales de LEVEL UP MEDIA (las 4 de Carilin + razón de baja) ----------

export const LUM = "24da2109-9ec0-46e1-acb4-a8dac1703999";
export const LUM_PROGRESO = "8b775ed6-f6a2-43b8-b2de-94b80b5d8d54";
export const LUM_GRUPO = {
  analisis: "6e36ba61-5ff4-4758-a5ca-8305e09c9e55",
  clienteActivo: "7055d5f3-1e73-4dc5-b918-88fc9a28f2c7",
  accelerator: "842a34bf-0677-4a7b-984a-962e2c74f8be",
  innerCircle: "f2974c4f-fc8e-4e40-bc10-71f8fbdb7c05",
  offboarded: "ea44ba8c-a933-49c6-bcaf-a2c03b253d04",
};
// Inner Circle no se mueve con ninguna regla (Carilin, #16): a esos los mueven a mano.
const NO_DESDE = [LUM_GRUPO.innerCircle];

/** Reglas semilla. `razonBaja` = id de la columna "Razón de Baja" (se resuelve al sembrar). */
export function reglasInicialesLUM(razonBaja: string | null): Omit<Regla, "id">[] {
  const exigir: Accion[] = razonBaja ? [{ tipo: "exigir", columnId: razonBaja }] : [];
  return [
    { boardId: LUM, nombre: "Onboarding Completado → CLIENTE ACTIVO", activa: true, cuando: { tipo: "valor", columnId: LUM_PROGRESO, valor: "m1", excepto: NO_DESDE }, entonces: [{ tipo: "mover", groupId: LUM_GRUPO.clienteActivo }] },
    { boardId: LUM, nombre: "SET UP LISTO → ANÁLISIS Y ESTRATEGIA", activa: true, cuando: { tipo: "valor", columnId: LUM_PROGRESO, valor: "m3", excepto: NO_DESDE }, entonces: [{ tipo: "mover", groupId: LUM_GRUPO.analisis }] },
    { boardId: LUM, nombre: "Programa Acelerator → PROGRAMA ACCELERATOR", activa: true, cuando: { tipo: "valor", columnId: LUM_PROGRESO, valor: "m11", excepto: NO_DESDE }, entonces: [{ tipo: "mover", groupId: LUM_GRUPO.accelerator }] },
    // "Decidió no continuar" es el "OFF" de Monday: pide la razón antes de dar de baja.
    { boardId: LUM, nombre: "Decidió no continuar → OFFBOARDED (con razón de baja)", activa: true, cuando: { tipo: "valor", columnId: LUM_PROGRESO, valor: "m5", excepto: NO_DESDE }, entonces: [...exigir, { tipo: "mover", groupId: LUM_GRUPO.offboarded }] },
    ...(razonBaja ? [{ boardId: LUM, nombre: "Pasar a OFFBOARDED exige razón de baja", activa: true, cuando: { tipo: "grupo" as const, groupId: LUM_GRUPO.offboarded }, entonces: exigir }] : []),
  ];
}
