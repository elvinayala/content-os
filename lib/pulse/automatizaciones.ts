import type { ValorCelda } from "./types";

// Automatizaciones de Pulse (lo que Monday hacía solo): "cuando la columna X queda en la
// etiqueta Y, mover el elemento al grupo Z". Pedido de Carilin (#13, 23/sep/2026), v1 con
// las reglas fijas en código; si hace falta, v2 con pantalla para que ellas las creen.
// Todo por id (columna, etiqueta, grupo): renombrar en la UI no rompe nada. Puro y
// testeado (tests/pulse-automatizaciones.test.mjs); la action aplica exactamente esto.

export interface ReglaMover {
  nombre: string;
  boardId: string;
  columnId: string; // columna de status que dispara
  labelId: string; // etiqueta que dispara (id de settings.labels)
  groupId: string; // grupo destino
  noDesde?: string[]; // grupos de los que NO se mueve (p. ej. programas especiales)
}

const LUM = "24da2109-9ec0-46e1-acb4-a8dac1703999"; // LEVEL UP MEDIA
const LUM_PROGRESO = "8b775ed6-f6a2-43b8-b2de-94b80b5d8d54";
const LUM_GRUPO = {
  clienteActivo: "7055d5f3-1e73-4dc5-b918-88fc9a28f2c7",
  accelerator: "842a34bf-0677-4a7b-984a-962e2c74f8be",
  innerCircle: "f2974c4f-fc8e-4e40-bc10-71f8fbdb7c05",
  offboarded: "ea44ba8c-a933-49c6-bcaf-a2c03b253d04",
};

export const REGLAS: ReglaMover[] = [
  {
    nombre: "Onboarding Completado → CLIENTE ACTIVO",
    boardId: LUM,
    columnId: LUM_PROGRESO,
    labelId: "m1", // "Onboarding Completado"
    groupId: LUM_GRUPO.clienteActivo,
    noDesde: [LUM_GRUPO.accelerator, LUM_GRUPO.innerCircle],
  },
  {
    nombre: "Decidió no continuar → OFFBOARDED",
    boardId: LUM,
    columnId: LUM_PROGRESO,
    labelId: "m5", // "Decidió no continuar" (el "OFF" de Monday)
    groupId: LUM_GRUPO.offboarded,
  },
];

/** Si este cambio de celda dispara una regla, devuelve la regla (la primera que aplique). */
export function reglaQueAplica(
  p: { boardId: string; columnId: string; before: ValorCelda; after: ValorCelda; groupIdActual: string },
  reglas: ReglaMover[] = REGLAS,
): ReglaMover | null {
  if (p.after === null || p.after === p.before) return null; // solo cuando CAMBIA a la etiqueta
  for (const r of reglas) {
    if (r.boardId !== p.boardId || r.columnId !== p.columnId || r.labelId !== p.after) continue;
    if (r.groupId === p.groupIdActual) continue; // ya está ahí
    if (r.noDesde?.includes(p.groupIdActual)) continue;
    return r;
  }
  return null;
}
