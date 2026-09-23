// node --test tests/humanizar.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const { humanizar } = await import("../dist/humanizar.js");

test("quita los ¡ de apertura y nunca toca números, precios ni horas", () => {
  for (let i = 1; i <= 6; i++) {
    const t = humanizar("¡Hola Benito! La entrevista es el miércoles 23 a la 1:00pm y son $69.", i, "c1");
    assert.ok(!t.includes("¡"), t);
    assert.ok(t.includes("1:00pm") && t.includes("$69") && t.includes("23"), t);
    assert.ok(t.includes("Benito"), "no toca nombres propios: " + t);
  }
});
test("minúscula solo en palabras comunes, nunca en un nombre al inicio", () => {
  const vistos = new Set();
  for (let i = 1; i <= 20; i++) vistos.add(humanizar("Perfecto, ya lo tengo.", i, "c" + i)[0]);
  assert.ok(vistos.has("p") && vistos.has("P"), "a veces sí, a veces no");
  for (let i = 1; i <= 10; i++) assert.equal(humanizar("Benito, ya lo tengo.", i, "c" + i)[0], "B");
});
test("un solo error de tilde en toda la conversación, en el mensaje 3 o 4", () => {
  for (const id of ["a", "b", "c", "d", "e"]) {
    const frase = "Te escribo también después de la entrevista";
    const cambiados = [1, 2, 3, 4, 5, 6].filter((i) => !humanizar(frase, i, id).includes("también"));
    assert.equal(cambiados.length, 1, id + ": " + cambiados);
    assert.ok([3, 4].includes(cambiados[0]));
  }
});
test("no rompe preguntas ni exclamaciones al final, y a veces quita el punto final", () => {
  assert.ok(humanizar("¿Tienes licencia?", 1, "x").endsWith("?"));
  const finales = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((i) => humanizar("Dale, te aviso.", i, "z" + i).endsWith(".")));
  assert.ok(finales.has(false));
});
