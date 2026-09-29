import assert from "node:assert/strict";
import { test } from "node:test";

import { agenteIA, ladoAgente, ladoHumano, limpiarReporte, veces } from "../lib/desempeno/agentes-ia.ts";

test("agente: promedia solo días con actividad", () => {
  const l = ladoAgente([
    { agente: "max", fecha: "2026-09-21", tareas: 10, corridas: 5, minutos: 120, costoUsd: 4 },
    { agente: "max", fecha: "2026-09-22", tareas: 6, corridas: 3, minutos: 60, costoUsd: 2 },
    { agente: "max", fecha: "2026-09-23", tareas: null, corridas: 0, minutos: 0, costoUsd: 0 },
  ]);
  assert.deepEqual(l, { diasActivos: 2, tareasDia: 8, horasDia: 1.5, costoDia: 3, costoPorTarea: 0.38, totales: { tareas: 16, horas: 3, costo: 6 } });
  // Día trabajado sin reporte de tareas: el costo por tarea usa solo los días con tareas (caso Max, 28/sep).
  const m = ladoAgente([
    { agente: "max", fecha: "2026-09-27", tareas: null, corridas: 6, minutos: 5.8, costoUsd: 1.0669 },
    { agente: "max", fecha: "2026-09-28", tareas: 1, corridas: 6, minutos: 2, costoUsd: 0.9102 },
  ]);
  assert.equal(m.costoPorTarea, 0.91);
  assert.equal(m.totales.costo, 1.98);
  // Leo: su tiempo y costo no se miden → "—", no "0 h".
  const leo = ladoAgente([{ agente: "leo", fecha: "2026-09-28", tareas: 6, corridas: 6, minutos: 0, costoUsd: 0 }], { sinMedicion: true });
  assert.equal(leo.horasDia, null);
  assert.equal(leo.tareasDia, 6);
});

test("humano: por día trabajado, costo desde el salario", () => {
  const h = ladoHumano([
    { dias: [{ horas: 9, tareas: 4 }, { horas: 8, tareas: 2 }, { horas: 0, tareas: null }], salarioMensual: 1085 },
    { dias: [{ horas: 7, tareas: null }], salarioMensual: null },
  ]);
  assert.equal(h.personas, 2);
  assert.equal(h.diasActivos, 3);
  assert.equal(h.tareasDia, 3);
  assert.equal(h.horasDia, 8);
  assert.equal(h.costoDia, 50);
  assert.equal(h.costoPorTarea, 16.67);
});

test("humano: tareas de la ventana (Producción) ÷ días trabajados", () => {
  const h = ladoHumano([{ dias: [{ horas: 8, tareas: null }, { horas: 8, tareas: null }, { horas: 0, tareas: null }], salarioMensual: 868, tareasVentana: 10 }]);
  assert.equal(h.tareasDia, 5);
  assert.equal(h.costoDia, 40);
  assert.equal(h.costoPorTarea, 8);
});

test("sin datos no se inventa nada", () => {
  assert.deepEqual(ladoAgente([]), { diasActivos: 0, tareasDia: null, horasDia: null, costoDia: null, costoPorTarea: null, totales: { tareas: null, horas: null, costo: null } });
  assert.equal(ladoHumano([{ dias: [{ horas: 8, tareas: null }], salarioMensual: null }]).costoPorTarea, null);
  assert.equal(veces(8, null), null);
  assert.equal(veces(8, 3), 2.7);
});

test("reporte del agente se limpia", () => {
  const r = limpiarReporte({ resumen: "  Hice 3 flyers ", tareas: "3", entregables: "flyer LU|flyer AIB| ", bloqueos: "" });
  assert.deepEqual(r, { resumen: "Hice 3 flyers", tareas: 3, entregables: ["flyer LU", "flyer AIB"], bloqueos: null });
  assert.equal(limpiarReporte({ tareas: "abc" }).tareas, null);
  assert.equal(limpiarReporte({ tareas: 9999 }).tareas, 500);
  assert.equal(agenteIA("nico").comparaCon, "web");
});
