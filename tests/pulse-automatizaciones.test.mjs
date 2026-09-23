import assert from "node:assert/strict";
import test from "node:test";

import { REGLAS, reglaQueAplica } from "../lib/pulse/automatizaciones.ts";

const LUM = "24da2109-9ec0-46e1-acb4-a8dac1703999";
const PROGRESO = "8b775ed6-f6a2-43b8-b2de-94b80b5d8d54";
const ONBOARDING = "9738ee74-2cac-4c5c-bbdb-723f96b9de21";
const ACTIVO = "7055d5f3-1e73-4dc5-b918-88fc9a28f2c7";
const ACCELERATOR = "842a34bf-0677-4a7b-984a-962e2c74f8be";
const OFF = "ea44ba8c-a933-49c6-bcaf-a2c03b253d04";
const base = { boardId: LUM, columnId: PROGRESO, before: "m6", groupIdActual: ONBOARDING };

test("Onboarding Completado baja a CLIENTE ACTIVO", () => {
  assert.equal(reglaQueAplica({ ...base, after: "m1" })?.groupId, ACTIVO);
});

test("Decidió no continuar baja a OFFBOARDED, venga de donde venga", () => {
  assert.equal(reglaQueAplica({ ...base, after: "m5" })?.groupId, OFF);
  assert.equal(reglaQueAplica({ ...base, after: "m5", groupIdActual: ACTIVO })?.groupId, OFF);
  assert.equal(reglaQueAplica({ ...base, after: "m5", groupIdActual: ACCELERATOR })?.groupId, OFF);
});

test("no mueve si ya está en el grupo, si no cambió o si se borró la etiqueta", () => {
  assert.equal(reglaQueAplica({ ...base, after: "m1", groupIdActual: ACTIVO }), null);
  assert.equal(reglaQueAplica({ ...base, before: "m1", after: "m1" }), null);
  assert.equal(reglaQueAplica({ ...base, before: "m1", after: null }), null);
});

test("no saca a nadie de Accelerator/Inner Circle por marcar onboarding", () => {
  assert.equal(reglaQueAplica({ ...base, after: "m1", groupIdActual: ACCELERATOR }), null);
});

test("otras etiquetas, columnas o tableros no disparan nada", () => {
  assert.equal(reglaQueAplica({ ...base, after: "m3" }), null);
  assert.equal(reglaQueAplica({ ...base, columnId: "otra", after: "m1" }), null);
  assert.equal(reglaQueAplica({ ...base, boardId: "otro", after: "m5" }), null);
});

test("las reglas son 2 y todas completas", () => {
  assert.equal(REGLAS.length, 2);
  for (const r of REGLAS) for (const k of ["nombre", "boardId", "columnId", "labelId", "groupId"]) assert.ok(r[k], `${r.nombre}: falta ${k}`);
});
