import assert from "node:assert/strict";
import test from "node:test";

import { dispara, LUM_GRUPO, LUM_PROGRESO, planDeAcciones, reglasDisparadas, reglasInicialesLUM, requisitosFaltantes, sumarDias } from "../lib/pulse/automatizaciones.ts";

const RAZON = "col-razon";
const REGLAS = reglasInicialesLUM(RAZON).map((r, i) => ({ ...r, id: `r${i}` }));
const ONBOARDING = "9738ee74-2cac-4c5c-bbdb-723f96b9de21";
const { analisis: ANALISIS, clienteActivo: ACTIVO, accelerator: ACCELERATOR, innerCircle: INNER, offboarded: OFF } = LUM_GRUPO;
const HOY = "2026-09-24";

const cambio = (despues, grupoActual = ONBOARDING, antes = "m6") => ({ tipo: "valor", columnId: LUM_PROGRESO, antes, despues, grupoActual });
const destino = (despues, grupoActual = ONBOARDING, valores = { [RAZON]: "m2" }) =>
  planDeAcciones(reglasDisparadas(REGLAS, cambio(despues, grupoActual)), { groupId: grupoActual, values: valores }, HOY).moverA;

test("cada etiqueta baja a su grupo (las 4 reglas de Carilin, igual que la v1)", () => {
  assert.equal(destino("m1"), ACTIVO);
  assert.equal(destino("m3"), ANALISIS);
  assert.equal(destino("m11"), ACCELERATOR);
  assert.equal(destino("m5"), OFF);
});

test("Onboarding Completado sube a CLIENTE ACTIVO desde OFFBOARDED y desde Accelerator", () => {
  assert.equal(destino("m1", OFF), ACTIVO);
  assert.equal(destino("m1", ACCELERATOR), ACTIVO);
});

test("Inner Circle no se mueve con ninguna regla", () => {
  for (const l of ["m1", "m3", "m11", "m5"]) assert.equal(destino(l, INNER), null, l);
});

test("no mueve si ya está en el grupo, si no cambió o si se borró la etiqueta", () => {
  assert.equal(destino("m1", ACTIVO), null);
  assert.equal(reglasDisparadas(REGLAS, cambio("m1", ONBOARDING, "m1")).length, 0);
  assert.equal(reglasDisparadas(REGLAS, cambio(null)).length, 0);
});

test("otras etiquetas o columnas no disparan nada", () => {
  for (const l of ["m0", "m2", "m4", "m6", "m7", "m8", "m9", "m10"]) assert.equal(destino(l), null, l);
  assert.equal(reglasDisparadas(REGLAS, { ...cambio("m1"), columnId: "otra" }).length, 0);
});

test("dar de baja exige la razón: por etiqueta y moviendo a mano a OFFBOARDED", () => {
  assert.deepEqual(requisitosFaltantes(reglasDisparadas(REGLAS, cambio("m5")), {}), [RAZON]);
  assert.deepEqual(requisitosFaltantes(reglasDisparadas(REGLAS, cambio("m5")), { [RAZON]: "m2" }), []);
  assert.deepEqual(requisitosFaltantes(reglasDisparadas(REGLAS, { tipo: "grupo", desde: ACTIVO, hacia: OFF }), {}), [RAZON]);
  assert.deepEqual(requisitosFaltantes(reglasDisparadas(REGLAS, { tipo: "grupo", desde: OFF, hacia: OFF }), {}), []);
});

test("acciones nuevas: fecha (solo si vacía), etiqueta, persona y aviso", () => {
  const r = { id: "x", boardId: "b", nombre: "Arranque", activa: true, cuando: { tipo: "grupo", groupId: "g2" }, entonces: [
    { tipo: "fecha", columnId: "inicio", dias: 0 },
    { tipo: "fecha", columnId: "seguimiento", dias: 10 },
    { tipo: "valor", columnId: "estado", valor: "m1" },
    { tipo: "persona", columnId: "personas", userId: "u1" },
    { tipo: "avisar", userId: "u2" },
  ] };
  const plan = planDeAcciones([r], { groupId: "g2", values: { inicio: "2026-01-01", personas: ["u9"] } }, HOY);
  assert.equal(plan.valores.inicio, undefined);
  assert.equal(plan.valores.seguimiento, "2026-10-04");
  assert.equal(plan.valores.estado, "m1");
  assert.deepEqual(plan.valores.personas, ["u9", "u1"]);
  assert.deepEqual(plan.avisar, ["u2"]);
  assert.equal(plan.moverA, null);
});

test("una regla apagada no hace nada", () => {
  assert.equal(dispara({ ...REGLAS[0], activa: false }, cambio("m1")), false);
});

test("sumarDias cruza meses", () => assert.equal(sumarDias("2026-09-28", 5), "2026-10-03"));
