// node --test tests/cierre.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const { esSoloAcuse, ultimoPregunto } = await import("../dist/cierre.js");

test("reconoce acuses cortos y no confunde respuestas reales", () => {
  for (const t of ["Ok", "ok!", "Gracias", "graciasss", "dale", "👍", "Perfecto.", "bendiciones 🙏"]) assert.ok(esSoloAcuse(t), t);
  for (const t of ["ok, y cuánto pagan?", "No", "Caguas", "gracias, el martes me sirve", "", undefined]) assert.ok(!esSoloAcuse(t), String(t));
});
test("solo se calla si nuestro último mensaje no preguntó nada", () => {
  const cerro = [{ role: "user", content: "No" }, { role: "assistant", content: [{ type: "tool_use" }, { type: "text", text: "te dejo anotado, cualquier cosa me escribes por aquí" }] }];
  const pregunto = [{ role: "assistant", content: "¿Te sirve el jueves a las 10?" }];
  assert.equal(ultimoPregunto(cerro), false);
  assert.equal(ultimoPregunto(pregunto), true);
  assert.equal(ultimoPregunto([]), true);
});
