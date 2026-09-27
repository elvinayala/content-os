// node --test tests/telefono-texto.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const { telefonoEnTexto: t } = await import("../dist/agente.js");

test("reconoce el teléfono escrito de varias formas", () => {
  assert.equal(t("787 321 9437"), "7873219437");
  assert.equal(t("mi cel es (939)555-1234 gracias"), "9395551234");
  assert.equal(t("+1 787.555.1234"), "7875551234");
  assert.equal(t("17875551234"), "7875551234");
});
test("no confunde precios, fechas ni códigos", () => {
  assert.equal(t("son $179 y $19"), null);
  assert.equal(t("el 28/09/2026 a las 2"), null);
  assert.equal(t("código 123456"), null);
  assert.equal(t(""), null);
});
