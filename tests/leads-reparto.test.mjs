import assert from "node:assert/strict";
import { test } from "node:test";

import { duenoPorReparto, normalizarReparto, seReparte } from "../lib/leads/reglas.ts";

const todos = new Set(["luis", "joaquin", "ana"]);

test("rotación: uno a cada uno, en orden, y vuelve a empezar", () => {
  const r = { modo: "rotacion", personas: ["luis", "joaquin", "ana"] };
  assert.deepEqual([0, 1, 2, 3, 4].map((t) => duenoPorReparto(r, t, todos)), ["luis", "joaquin", "ana", "luis", "joaquin"]);
});

test("rotación: quien perdió el acceso se salta", () => {
  const r = { modo: "rotacion", personas: ["luis", "joaquin", "ana"] };
  const sinJoaquin = new Set(["luis", "ana"]);
  assert.deepEqual([0, 1, 2].map((t) => duenoPorReparto(r, t, sinJoaquin)), ["luis", "ana", "luis"]);
});

test("una persona fija recibe todo; nadie = sin dueño", () => {
  assert.equal(duenoPorReparto({ modo: "fijo", personas: ["ana", "luis"] }, 7, todos), "ana");
  assert.equal(duenoPorReparto({ modo: "ninguno", personas: ["ana"] }, 0, todos), null);
  assert.equal(duenoPorReparto({ modo: "rotacion", personas: ["otro"] }, 0, todos), null);
});

test("normalizar: sin personas o modo raro = nadie; sin repetidos", () => {
  assert.deepEqual(normalizarReparto({ modo: "rotacion", personas: [] }), { modo: "ninguno", personas: [] });
  assert.deepEqual(normalizarReparto({ modo: "x", personas: ["a"] }), { modo: "ninguno", personas: [] });
  assert.deepEqual(normalizarReparto({ modo: "rotacion", personas: ["a", "a", "b"] }), { modo: "rotacion", personas: ["a", "b"] });
  assert.deepEqual(normalizarReparto(null), { modo: "ninguno", personas: [] });
});

test("lo manual y los grupos de WhatsApp no se reparten", () => {
  assert.equal(seReparte("whatsapp"), true);
  assert.equal(seReparte("formulario"), true);
  assert.equal(seReparte("manual"), false);
  assert.equal(seReparte("grupo"), false);
});
