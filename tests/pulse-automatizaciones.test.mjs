import assert from "node:assert/strict";
import test from "node:test";

import { REGLAS, reglaQueAplica } from "../lib/pulse/automatizaciones.ts";

const LUM = "24da2109-9ec0-46e1-acb4-a8dac1703999";
const PROGRESO = "8b775ed6-f6a2-43b8-b2de-94b80b5d8d54";
const ONBOARDING = "9738ee74-2cac-4c5c-bbdb-723f96b9de21";
const ANALISIS = "6e36ba61-5ff4-4758-a5ca-8305e09c9e55";
const ACTIVO = "7055d5f3-1e73-4dc5-b918-88fc9a28f2c7";
const ACCELERATOR = "842a34bf-0677-4a7b-984a-962e2c74f8be";
const INNER = "f2974c4f-fc8e-4e40-bc10-71f8fbdb7c05";
const OFF = "ea44ba8c-a933-49c6-bcaf-a2c03b253d04";
const base = { boardId: LUM, columnId: PROGRESO, before: "m6", groupIdActual: ONBOARDING };
const destino = (after, groupIdActual = ONBOARDING) => reglaQueAplica({ ...base, after, groupIdActual })?.groupId ?? null;

test("cada etiqueta baja a su grupo", () => {
  assert.equal(destino("m1"), ACTIVO); // Onboarding Completado
  assert.equal(destino("m3"), ANALISIS); // SET UP LISTO
  assert.equal(destino("m11"), ACCELERATOR); // Programa Acelerator
  assert.equal(destino("m5"), OFF); // Decidió no continuar
});

test("Onboarding Completado sube a CLIENTE ACTIVO desde OFFBOARDED y desde Accelerator", () => {
  assert.equal(destino("m1", OFF), ACTIVO);
  assert.equal(destino("m1", ACCELERATOR), ACTIVO);
  assert.equal(destino("m1", ANALISIS), ACTIVO);
});

test("Inner Circle no se mueve con ninguna regla", () => {
  for (const l of ["m1", "m3", "m11", "m5"]) assert.equal(destino(l, INNER), null, l);
});

test("no mueve si ya está en el grupo, si no cambió o si se borró la etiqueta", () => {
  assert.equal(destino("m1", ACTIVO), null);
  assert.equal(reglaQueAplica({ ...base, before: "m1", after: "m1" }), null);
  assert.equal(reglaQueAplica({ ...base, before: "m1", after: null }), null);
});

test("otras etiquetas, columnas o tableros no disparan nada", () => {
  for (const l of ["m0", "m2", "m4", "m6", "m7", "m8", "m9", "m10"]) assert.equal(destino(l), null, l);
  assert.equal(reglaQueAplica({ ...base, columnId: "otra", after: "m1" }), null);
  assert.equal(reglaQueAplica({ ...base, boardId: "otro", after: "m5" }), null);
});

test("las reglas son 4 y todas completas", () => {
  assert.equal(REGLAS.length, 4);
  for (const r of REGLAS) for (const k of ["nombre", "boardId", "columnId", "labelId", "groupId"]) assert.ok(r[k], `${r.nombre}: falta ${k}`);
});
