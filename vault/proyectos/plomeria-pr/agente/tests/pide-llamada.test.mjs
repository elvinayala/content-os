// node --test tests/pide-llamada.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const { pideLlamada: p } = await import("../dist/ventas.js");
test("reconoce cuando el cliente pide que lo llamen", () => {
  for (const t of ["tengo problemas con la ducha llama al 939 253 2377", "llámame al 787-555-1234", "me pueden llamar?", "llamenme por favor", "Llame a este número 7875551234"]) assert.equal(p(t), true, t);
});
test("no confunde otras palabras", () => {
  for (const t of ["la llave de paso gotea", "cuánto cuesta el destape", "se llama Pedro", ""]) assert.equal(p(t), false, t);
});
