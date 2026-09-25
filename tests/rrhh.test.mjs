import assert from "node:assert/strict";
import { test } from "node:test";

import { cargosAusencias, cumpleDoceMesesHoy, diasLaborables, fechaMeses, mesesCompletos, mesSiguiente, nominaMes, saldos } from "../lib/desempeno/rrhh.ts";

test("meses completos y fecha de los 12 meses", () => {
  assert.equal(mesesCompletos("2025-09-26", "2026-09-25"), 11);
  assert.equal(mesesCompletos("2025-09-25", "2026-09-25"), 12);
  assert.equal(fechaMeses("2025-01-31", 1), "2025-02-28");
  assert.equal(cumpleDoceMesesHoy("2025-09-25", "2026-09-25"), true);
  assert.equal(cumpleDoceMesesHoy("2025-09-24", "2026-09-25"), false);
  assert.equal(mesSiguiente("2026-12-15"), "2027-01");
});

test("vacaciones: 7 al año acumuladas por mes; se solicitan a los 12 meses", () => {
  const s6 = saldos("2026-03-01", [], "2026-09-01");
  assert.equal(s6.vacaciones.acumuladas, 3.5);
  assert.equal(s6.puedeSolicitar, false);
  const s12 = saldos("2025-09-01", [], "2026-09-01");
  assert.equal(s12.vacaciones.acumuladas, 7);
  assert.equal(s12.puedeSolicitar, true);
});

test("enfermedad: con certificado usa el cupo de 3; sin certificado o pasado el cupo va a vacaciones", () => {
  const c = cargosAusencias("2025-01-01", [
    { tipo: "enfermedad", desde: "2026-02-02", hasta: "2026-02-03", dias: 2, certificado: true },
    { tipo: "enfermedad", desde: "2026-03-02", hasta: "2026-03-03", dias: 2, certificado: true },
    { tipo: "enfermedad", desde: "2026-04-01", hasta: "2026-04-01", dias: 1, certificado: false },
  ]);
  assert.deepEqual(c[0].cargo, { vacaciones: 0, enfermedad: 2, maternidad: 0, sinPaga: 0 });
  assert.deepEqual(c[1].cargo, { vacaciones: 1, enfermedad: 1, maternidad: 0, sinPaga: 0 });
  assert.deepEqual(c[2].cargo, { vacaciones: 1, enfermedad: 0, maternidad: 0, sinPaga: 0 });
});

test("ausencia antes de acumular: lo que falte queda sin paga", () => {
  const [a] = cargosAusencias("2026-07-01", [{ tipo: "personal", desde: "2026-09-10", hasta: "2026-09-11", dias: 2, certificado: false }]);
  // 2 meses → 1.17 días acumulados
  assert.equal(a.cargo.vacaciones, 1.17);
  assert.equal(a.cargo.sinPaga, 0.83);
});

test("maternidad: 15 días por evento", () => {
  const [a] = cargosAusencias("2024-01-01", [{ tipo: "maternidad", desde: "2026-05-01", hasta: "2026-05-21", dias: 15, certificado: false }]);
  assert.equal(a.cargo.maternidad, 15);
  assert.equal(a.cargo.sinPaga, 0);
});

test("nómina del mes: base + ajustes − días sin paga", () => {
  assert.equal(diasLaborables("2026-10-01", "2026-10-31"), 22);
  const n = nominaMes({
    salarioMensual: 1100,
    mes: "2026-10",
    ajustes: [{ concepto: "Bono", monto: 100 }, { concepto: "Adelanto", monto: -50 }],
    ingreso: "2026-09-01",
    ausencias: [{ tipo: "personal", desde: "2026-10-05", hasta: "2026-10-05", dias: 1, certificado: false }],
  });
  // 1 mes → 0.58 días acumulados → 0.42 sin paga → 1100/22 × 0.42 = 21
  assert.equal(n.diasSinPaga, 0.42);
  assert.equal(n.descuentoSinPaga, 21);
  assert.equal(n.total, 1129);
});
