import assert from "node:assert/strict";
import { test } from "node:test";

import { avisoPendientes, choques, diasEnConflicto, mensajeChoque, semanasDelMes } from "../lib/desempeno/calendario-reglas.ts";

const t = (id, userId, nombre, puesto, desde, hasta, estado = "aprobada", empresa = "level_up") => ({ id, userId, nombre, puesto, empresa, tipo: "vacaciones", desde, hasta, estado });

test("dos estrategas no pueden estar fuera a la vez", () => {
  const tramos = [t("a", "u1", "Daisy Buendia", "estratega", "2026-10-12", "2026-10-16")];
  const c = choques({ userId: "u2", puesto: "estratega", empresa: "level_up", desde: "2026-10-15", hasta: "2026-10-20" }, tramos);
  assert.equal(c.bloquea.length, 1);
  assert.match(mensajeChoque(c, "estratega"), /Daisy \(12 oct – 16 oct\).*dos estrategas/);
  // Fechas que no se cruzan: libre.
  assert.equal(choques({ userId: "u2", puesto: "estratega", empresa: "level_up", desde: "2026-10-17", hasta: "2026-10-20" }, tramos).bloquea.length, 0);
});

test("otros puestos, otra empresa o la misma persona no chocan", () => {
  const tramos = [t("a", "u1", "Daisy", "estratega", "2026-10-12", "2026-10-16"), t("b", "u3", "Manuel", "disenador", "2026-10-12", "2026-10-16")];
  assert.equal(choques({ userId: "u4", puesto: "disenador", empresa: "level_up", desde: "2026-10-12", hasta: "2026-10-12" }, tramos).bloquea.length, 0);
  assert.equal(choques({ userId: "u2", puesto: "estratega", empresa: "ai_borinquen", desde: "2026-10-12", hasta: "2026-10-12" }, tramos).bloquea.length, 0);
  assert.equal(choques({ userId: "u1", puesto: "estratega", empresa: "level_up", desde: "2026-10-13", hasta: "2026-10-13" }, tramos).bloquea.length, 0);
});

test("pendientes: se avisa pero no bloquea", () => {
  const tramos = [t("a", "u1", "Felipe Durán", "estratega", "2026-10-12", "2026-10-13", "pendiente")];
  const c = choques({ userId: "u2", puesto: "estratega", empresa: "level_up", desde: "2026-10-13", hasta: "2026-10-14" }, tramos);
  assert.equal(c.bloquea.length, 0);
  assert.match(avisoPendientes(c), /Felipe/);
});

test("calendario: semanas de lunes a domingo y días en conflicto", () => {
  const s = semanasDelMes("2026-10");
  assert.equal(s[0][0], "2026-09-28"); // lunes
  assert.ok(s.every((w) => w.length === 7));
  assert.ok(s.flat().includes("2026-10-31"));
  const c = diasEnConflicto([t("a", "u1", "A", "estratega", "2026-10-12", "2026-10-14"), t("b", "u2", "B", "estratega", "2026-10-14", "2026-10-15")], "2026-10-01", "2026-10-31");
  assert.deepEqual([...c], ["2026-10-14"]);
});

// ─── 19/oct: una ausencia de unas horas no cuenta como "fuera" ─────
import { choques as choques2, cuentaFuera, diasEnConflicto as conflicto2 } from "../lib/desempeno/calendario-reglas.ts";

test("una cita de 2 h de un estratega no bloquea ni pinta choque", () => {
  const base = { userId: "a", nombre: "A", puesto: "estratega", empresa: "level_up", desde: "2026-10-19", hasta: "2026-10-19", estado: "aprobada" };
  const cita = { ...base, id: "c", tipo: "enfermedad", horas: 2 };
  const vac = { ...base, id: "v", userId: "b", nombre: "B", tipo: "vacaciones", horas: null };
  assert.equal(cuentaFuera(cita), false);
  assert.equal(cuentaFuera(vac), true);
  assert.equal(choques2({ userId: "z", puesto: "estratega", empresa: "level_up", desde: "2026-10-19", hasta: "2026-10-19" }, [cita]).bloquea.length, 0);
  assert.equal(conflicto2([cita, vac], "2026-10-19", "2026-10-19").size, 0);
});

test("medio día de vacaciones de un estratega sigue contando como fuera", () => {
  assert.equal(cuentaFuera({ horas: 4, tipo: "vacaciones" }), true);
  assert.equal(cuentaFuera({ horas: 2, tipo: "cita_medica" }), false);
});
