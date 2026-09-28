import assert from "node:assert/strict";
import { test } from "node:test";

import { aplicar, describir, diferencias, necesitaAprobacion, SENSIBLES_FICHA, SENSIBLES_PERFIL, separar, valorLegible } from "../lib/desempeno/cambios-reglas.ts";

const perfil = { userId: "u1", puesto: "estratega", empresa: "level_up", liderId: null, activo: true, soloRitmo: false, tipoContrato: "contratista", horaEntrada: "09:00", horaSalida: "18:00" };

test("solo Elvin aplica lo sensible directo", () => {
  assert.equal(necesitaAprobacion("admin"), false);
  assert.equal(necesitaAprobacion("editor"), true);
  assert.equal(necesitaAprobacion("miembro"), true);
});

test("separar: lo menor pasa ya, lo sensible espera", () => {
  const despues = { ...perfil, puesto: "tesoreria", horaEntrada: "08:00" };
  const r = separar(SENSIBLES_PERFIL, perfil, despues);
  assert.deepEqual(r.pendientes, [{ campo: "puesto", antes: "estratega", despues: "tesoreria" }]);
  assert.equal(r.aplicarYa.puesto, "estratega"); // se queda como estaba hasta el OK
  assert.equal(r.aplicarYa.horaEntrada, "08:00"); // lo menor se aplica
});

test("sin cambios sensibles no hay nada pendiente", () => {
  const r = separar(SENSIBLES_PERFIL, perfil, { ...perfil, horaSalida: "17:00" });
  assert.equal(r.pendientes.length, 0);
  assert.equal(r.aplicarYa.horaSalida, "17:00");
});

test("perfil nuevo: todo espera", () => {
  const r = separar(SENSIBLES_PERFIL, null, perfil);
  assert.equal(r.aplicarYa, null);
  assert.ok(r.pendientes.some((p) => p.campo === "puesto"));
});

test("aplicar sobre el estado de hoy y describir", () => {
  const hoy = { ...perfil, horaEntrada: "10:00" };
  const r = aplicar(hoy, [{ campo: "puesto", antes: "estratega", despues: "tesoreria" }]);
  assert.equal(r.puesto, "tesoreria");
  assert.equal(r.horaEntrada, "10:00");
  const salario = diferencias(SENSIBLES_FICHA, { salarioMensual: 1200 }, { salarioMensual: 1400 });
  assert.equal(describir(salario[0], valorLegible), "Salario mensual: US$1,200 → US$1,400");
  assert.equal(valorLegible("soloRitmo", true), "solo Ritmo");
  assert.equal(valorLegible("liderId", null), "—");
});
