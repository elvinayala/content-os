// node --test tests/catalogo.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const C = await import("../dist/catalogo.js");
const primero = (t) => C.buscar(t)[0];
test("cada pedido cae en su oficio", () => {
  assert.equal(primero("quiero montar la tv en la pared").categoria, "handyman");
  assert.equal(primero("necesito cambiar la cerradura de la puerta").id, "hm-cerradura");
  assert.equal(primero("se me dispara el breaker").categoria, "electricidad");
  assert.equal(primero("instalar un abanico de techo").id, "el-abanico");
  assert.equal(primero("el aire no enfria").categoria, "aire");
  assert.equal(primero("mantenimiento del split").id, "aire-mantenimiento");
});
test("plomería sigue igual: destape y calentador", () => {
  assert.equal(primero("el fregadero esta tapado").categoria, "plomeria");
  assert.equal(primero("instalar calentador de agua").categoria, "plomeria");
});
test("precios aprobados del catálogo", () => {
  assert.equal(C.servicioPorId("hm-tv").precio, 89);
  assert.equal(C.servicioPorId("el-diagnostico").precio, 69);
  assert.deepEqual(C.servicioPorId("aire-instalacion-12").rango, [449, 599]);
  assert.equal(C.servicioPorId("hm-tv").nivel, "P");
});
