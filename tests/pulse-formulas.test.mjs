import assert from "node:assert/strict";
import test from "node:test";

import { evaluar, recalcular } from "../lib/pulse/formulas.ts";

test("evaluar: aritmética, paréntesis, faltantes y división por cero", () => {
  const v = { a: 10, b: 4, cero: 0 };
  const de = (t) => (t in v ? v[t] : null);
  assert.equal(evaluar("{a} / {b} * 100", de), 250);
  assert.equal(evaluar("({a} + {b}) * 2 - 1", de), 27);
  assert.equal(evaluar("-{b} + 1", de), -3);
  assert.equal(evaluar("{a} / 3", de), 3.33);
  assert.equal(evaluar("{a} / {cero}", de), null);
  assert.equal(evaluar("{a} + {nada}", de), null);
  assert.equal(evaluar("{a} +", de), null);
  assert.equal(evaluar("alert(1)", de), null);
});

test("recalcular en cadena (churn → ticket → LTV)", () => {
  const cols = [
    { id: "nuevas", title: "Ventas nuevas ($)", type: "number", settings: {} },
    { id: "rec", title: "Ventas recurrentes ($)", type: "number", settings: {} },
    { id: "ing", title: "Ingresos totales ($)", type: "number", settings: { formula: "{Ventas nuevas ($)} + {Ventas recurrentes ($)}" } },
    { id: "ini", title: "Clientes activos al inicio", type: "number", settings: {} },
    { id: "fin", title: "Clientes activos al cierre", type: "number", settings: {} },
    { id: "bajas", title: "Bajas del mes", type: "number", settings: {} },
    { id: "ltv", title: "Lifetime value ($)", type: "number", settings: { formula: "{Ticket promedio ($)} / ({Churn (%)} / 100)" } },
    { id: "churn", title: "Churn (%)", type: "number", settings: { formula: "{Bajas del mes} / {Clientes activos al inicio} * 100" } },
    { id: "ticket", title: "Ticket promedio ($)", type: "number", settings: { formula: "{Ingresos totales ($)} / {Clientes activos al cierre}" } },
  ];
  const r = recalcular(cols, { nuevas: 5000, rec: 45000, ini: 100, fin: 100, bajas: 5 });
  assert.deepEqual(r, { ing: 50000, churn: 5, ticket: 500, ltv: 10000 });
  // sin bajas → churn 0 → LTV sin dato (no infinito)
  assert.equal(recalcular(cols, { nuevas: 5000, rec: 45000, ini: 100, fin: 100, bajas: 0 }).ltv, undefined);
  // si ya está al día, no hay cambios
  assert.deepEqual(recalcular(cols, { nuevas: 5000, rec: 45000, ini: 100, fin: 100, bajas: 5, ing: 50000, churn: 5, ticket: 500, ltv: 10000 }), {});
});
