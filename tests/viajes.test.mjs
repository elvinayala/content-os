import assert from "node:assert/strict";
import { test } from "node:test";

import { diasHasta, elegibilidadViaje, errorPlan } from "../lib/desempeno/viajes-reglas.ts";

const n = (v, k) => Array.from({ length: k }, () => v);

test("viaje del año: califica con antigüedad, días y índice ≥ 90", () => {
  const e = elegibilidadViaje({ ingreso: "2025-01-10", anuncio: "2026-12-15", asistencia: n(95, 30), scores: n(92, 30) });
  assert.equal(e.meses, 23);
  assert.equal(e.indice, 93.2); // 0.4·95 + 0.6·92
  assert.equal(e.enCarrera, true);
  assert.deepEqual(e.falta, []);
});

test("viaje del año: sin score usa solo asistencia", () => {
  const e = elegibilidadViaje({ ingreso: "2025-01-10", anuncio: "2026-12-15", asistencia: n(97, 25), scores: [] });
  assert.equal(e.indice, 97);
  assert.equal(e.desempeno, null);
  assert.equal(e.enCarrera, true);
});

test("viaje del año: dice exactamente qué falta", () => {
  const e = elegibilidadViaje({ ingreso: "2026-09-01", anuncio: "2026-12-15", asistencia: n(80, 5), scores: [] });
  assert.equal(e.enCarrera, false);
  assert.equal(e.falta.length, 3);
  assert.match(e.falta[0], /6 meses en la empresa \(llevas 3\)/);
  assert.match(e.falta[1], /20 días/);
  assert.match(e.falta[2], /hoy 80/);
  assert.equal(elegibilidadViaje({ ingreso: null, anuncio: "2026-12-15", asistencia: [], scores: [] }).indice, null);
});

test("planes de viaje y cuenta regresiva", () => {
  const ok = { tipo: "internacional", destino: "Cartagena", desde: "2026-12-20", hasta: "2026-12-27", presupuesto: "800" };
  assert.equal(errorPlan(ok, "2026-09-27"), null);
  assert.match(errorPlan({ ...ok, tipo: "luna" }, "2026-09-27"), /tipo/);
  assert.match(errorPlan({ ...ok, hasta: "2026-12-01" }, "2026-09-27"), /después/);
  assert.match(errorPlan({ ...ok, desde: "2026-09-01", hasta: "" }, "2026-09-27"), /pasado/);
  assert.equal(errorPlan({ ...ok, desde: "", hasta: "", presupuesto: "" }, "2026-09-27"), null); // una idea sin fechas vale
  assert.equal(diasHasta("2026-12-20", "2026-09-27"), 84);
});
