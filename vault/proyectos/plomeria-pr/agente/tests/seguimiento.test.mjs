// node --test tests/seguimiento.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const S = await import("../dist/seguimiento.js");
const H = 3600_000, T0 = Date.UTC(2026, 8, 25, 18, 0);
const base = { ultimoCliente: T0, ultimoTextoCliente: "cuánto sale el destape?", ultimoNuestro: T0 + 60_000, enviados: [], agendo: false, humano: false, ahora: T0 + 3 * H, hora: 14 };

test("a las 2 h sin respuesta y en horario: sí", () => assert.ok(S.tocaSeguimiento(base)));
test("antes de 2 h, después de 23 h o de noche: no", () => {
  assert.ok(!S.tocaSeguimiento({ ...base, ahora: T0 + 1 * H }));
  assert.ok(!S.tocaSeguimiento({ ...base, ahora: T0 + 23.5 * H }));
  assert.ok(!S.tocaSeguimiento({ ...base, hora: 21 }));
  assert.ok(!S.tocaSeguimiento({ ...base, hora: 7 }));
});
test("si agendó, lo tiene una persona, o preguntó algo sin respuesta: no", () => {
  assert.ok(!S.tocaSeguimiento({ ...base, agendo: true }));
  assert.ok(!S.tocaSeguimiento({ ...base, humano: true }));
  assert.ok(!S.tocaSeguimiento({ ...base, ultimoNuestro: T0 - 60_000 }));
});
test("si su último mensaje fue un 'ok gracias': sí", () => assert.ok(S.tocaSeguimiento({ ...base, ultimoNuestro: T0 - 60_000, ultimoTextoCliente: "Ok gracias!!!" })));
test("máximo 2 por ventana y 6 h entre uno y otro", () => {
  assert.ok(!S.tocaSeguimiento({ ...base, enviados: [T0 + 2 * H], ahora: T0 + 5 * H }));
  assert.ok(S.tocaSeguimiento({ ...base, enviados: [T0 + 2 * H], ahora: T0 + 15 * H }));
  assert.ok(!S.tocaSeguimiento({ ...base, enviados: [T0 + 2 * H, T0 + 15 * H], ahora: T0 + 22 * H }));
});
test("si el cliente vuelve a escribir, la ventana nueva arranca de cero", () => {
  const nuevo = T0 + 30 * H;
  assert.ok(S.tocaSeguimiento({ ...base, ultimoCliente: nuevo, ultimoNuestro: nuevo + 60_000, enviados: [T0 + 2 * H, T0 + 15 * H], ahora: nuevo + 3 * H }));
});
