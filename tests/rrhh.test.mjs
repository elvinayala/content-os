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

test("vacaciones: 8 al año acumuladas por mes; se solicitan a los 12 meses", () => {
  const s6 = saldos("2026-03-01", [], "2026-09-01");
  assert.equal(s6.vacaciones.acumuladas, 4);
  assert.equal(s6.puedeSolicitar, false);
  const s12 = saldos("2025-09-01", [], "2026-09-01");
  assert.equal(s12.vacaciones.acumuladas, 8);
  assert.equal(s12.puedeSolicitar, true);
});

test("vacaciones: tope de 8 días; se cuentan desde las últimas vacaciones (30/sep)", () => {
  // 2 años sin registro de vacaciones: no pasa de 8.
  assert.equal(saldos("2024-09-01", [], "2026-09-30").vacaciones.disponibles, 8);
  // Volvió de vacaciones el 1/mar/2026: 6 meses → 4 días.
  const s = saldos("2024-09-01", [], "2026-09-30", "2026-03-01");
  assert.equal(s.vacaciones.acumuladas, 4);
  assert.equal(s.vacaciones.disponibles, 4);
  // Lo usado ANTES de esa fecha no se descuenta otra vez; lo de después sí.
  const aus = [
    { tipo: "vacaciones", desde: "2026-02-20", hasta: "2026-02-27", dias: 6, certificado: false },
    { tipo: "personal", desde: "2026-06-01", hasta: "2026-06-01", dias: 1, certificado: false },
  ];
  assert.equal(saldos("2024-09-01", aus, "2026-09-30", "2026-03-01").vacaciones.disponibles, 3);
  // Más de un año desde las últimas: vuelve a 8, no más.
  assert.equal(saldos("2023-01-01", [], "2026-09-30", "2025-02-01").vacaciones.disponibles, 8);
});

test("enfermedad: con certificado usa el cupo de 5; sin certificado o pasado el cupo va a vacaciones", () => {
  const c = cargosAusencias("2025-01-01", [
    { tipo: "enfermedad", desde: "2026-02-02", hasta: "2026-02-03", dias: 2, certificado: true },
    { tipo: "enfermedad", desde: "2026-03-02", hasta: "2026-03-03", dias: 2, certificado: true },
    { tipo: "enfermedad", desde: "2026-03-16", hasta: "2026-03-17", dias: 2, certificado: true },
    { tipo: "enfermedad", desde: "2026-04-01", hasta: "2026-04-01", dias: 1, certificado: false },
  ]);
  assert.deepEqual(c[0].cargo, { vacaciones: 0, enfermedad: 2, maternidad: 0, sinPaga: 0 });
  assert.deepEqual(c[1].cargo, { vacaciones: 0, enfermedad: 2, maternidad: 0, sinPaga: 0 });
  assert.deepEqual(c[2].cargo, { vacaciones: 1, enfermedad: 1, maternidad: 0, sinPaga: 0 });
  assert.deepEqual(c[3].cargo, { vacaciones: 1, enfermedad: 0, maternidad: 0, sinPaga: 0 });
});

test("ausencia antes de acumular: lo que falte queda sin paga", () => {
  const [a] = cargosAusencias("2026-07-01", [{ tipo: "personal", desde: "2026-09-10", hasta: "2026-09-11", dias: 2, certificado: false }]);
  // 2 meses → 1.33 días acumulados
  assert.equal(a.cargo.vacaciones, 1.33);
  assert.equal(a.cargo.sinPaga, 0.67);
});

test("maternidad: 30 días por evento", () => {
  const [a] = cargosAusencias("2024-01-01", [{ tipo: "maternidad", desde: "2026-05-01", hasta: "2026-06-11", dias: 30, certificado: false }]);
  assert.equal(a.cargo.maternidad, 30);
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
  // 1 mes → 0.67 días acumulados → 0.33 sin paga → 1100/22 × 0.33 = 16.5
  assert.equal(n.diasSinPaga, 0.33);
  assert.equal(n.descuentoSinPaga, 16.5);
  assert.equal(n.total, 1133.5);
});

test("solicitudes: supervisor aprueba, RR.HH. firma; nadie decide lo suyo", async () => {
  const { puedeDecidir, alAprobar, estadoInicial, ausenciaDeSolicitud } = await import("../lib/desempeno/rrhh.ts");
  assert.equal(estadoInicial("jefe"), "supervisor");
  assert.equal(estadoInicial(null), "rrhh");
  const s = { userId: "emp", estado: "supervisor", supervisorId: "jefe" };
  assert.equal(puedeDecidir(s, { id: "jefe", maestro: false }), true);
  assert.equal(puedeDecidir(s, { id: "otro", maestro: false }), false);
  assert.equal(puedeDecidir(s, { id: "yaileen", maestro: true, rol: "miembro" }), false); // RR.HH. no se salta al supervisor
  assert.equal(puedeDecidir(s, { id: "elvin", maestro: true, rol: "admin" }), true);
  assert.equal(puedeDecidir(s, { id: "elvin", maestro: false, rol: "admin" }), false); // sin segundo paso, no
  assert.equal(puedeDecidir({ ...s, estado: "rrhh" }, { id: "jefe", maestro: false }), false);
  assert.equal(puedeDecidir({ ...s, estado: "rrhh" }, { id: "yaileen", maestro: true }), true);
  assert.equal(puedeDecidir({ ...s, userId: "yaileen", estado: "rrhh" }, { id: "yaileen", maestro: true }), false);
  assert.equal(alAprobar("supervisor"), "rrhh");
  assert.equal(alAprobar("rrhh"), "aprobada");
  assert.deepEqual(ausenciaDeSolicitud({ tipo: "dia_libre", desde: "2026-10-02", hasta: null, dias: 1 }), { tipo: "personal", desde: "2026-10-02", hasta: "2026-10-02", dias: 1, certificado: false });
  assert.equal(ausenciaDeSolicitud({ tipo: "documento", desde: null, hasta: null, dias: null }), null);
});

test("saldo en días y horas", async () => {
  const { diasYHoras } = await import("../lib/desempeno/rrhh.ts");
  assert.equal(diasYHoras(11.08, 8), "11 días y 1 h");
  assert.equal(diasYHoras(7, 8), "7 días");
  assert.equal(diasYHoras(1, 8), "1 día");
  assert.equal(diasYHoras(2.97, 8), "3 días");
  assert.equal(diasYHoras(0.5, 8), "0 días y 4 h");
});

// ─── 17/oct (Elvin): citas médicas → enfermedad, enfermedad por 12 meses, vacaciones con 60 días ─────
import { ausenciaDeSolicitud as ausenciaSol, errorAnticipacion, periodoEnfermedad, primerDiaVacaciones, saldos as saldosDe, TIPOS_SOLICITUD as TIPOS } from "../lib/desempeno/rrhh.ts";

test("cita médica aprobada = enfermedad certificada y se descuenta del cupo", () => {
  assert.ok(TIPOS.some((t) => t.id === "cita_medica" && t.conFechas));
  const a = ausenciaSol({ tipo: "cita_medica", desde: "2026-10-20", hasta: null, dias: 0.5 });
  assert.deepEqual(a, { tipo: "enfermedad", desde: "2026-10-20", hasta: "2026-10-20", dias: 0.5, certificado: true });
  const s = saldosDe("2025-03-10", [{ ...a, id: "x" }], "2026-10-21");
  assert.equal(s.enfermedad.usadas, 0.5);
  assert.equal(s.enfermedad.disponibles, 4.5);
});

test("los días de enfermedad se renuevan cada 12 meses desde el ingreso (no el 1 de enero)", () => {
  assert.deepEqual(periodoEnfermedad("2025-03-10", "2026-10-17"), { desde: "2026-03-10", hasta: "2027-03-09", renueva: "2027-03-10" });
  assert.equal(periodoEnfermedad("2025-03-10", "2026-03-09").desde, "2025-03-10");
  // 5 días usados en febrero 2026 (período 2025-26) no cuentan para el período que empezó el 10/mar/2026.
  const enf = (desde, dias) => ({ tipo: "enfermedad", desde, hasta: desde, dias, certificado: true });
  const s = saldosDe("2025-03-10", [enf("2026-02-02", 5), enf("2026-04-01", 1)], "2026-10-17");
  assert.equal(s.enfermedad.usadas, 1);
  assert.equal(s.enfermedad.disponibles, 4);
  assert.equal(s.enfermedad.renueva, "2027-03-10");
  // Pasado el cupo, lo que sobra se va a vacaciones/sin paga.
  const t = saldosDe("2025-03-10", [enf("2026-04-01", 6)], "2026-10-17");
  assert.equal(t.enfermedad.disponibles, 0);
});

test("vacaciones: mínimo 60 días de anticipación; las otras solicitudes no", () => {
  assert.equal(primerDiaVacaciones("2026-10-17"), "2026-12-16");
  assert.match(errorAnticipacion("vacaciones", "2026-10-30", "2026-10-17"), /60 días/);
  assert.match(errorAnticipacion("vacaciones", "2026-12-15", "2026-10-17"), /16 de diciembre/);
  assert.equal(errorAnticipacion("vacaciones", "2026-12-16", "2026-10-17"), null);
  assert.equal(errorAnticipacion("cita_medica", "2026-10-18", "2026-10-17"), null);
  assert.equal(errorAnticipacion("dia_libre", "2026-10-18", "2026-10-17"), null);
});
