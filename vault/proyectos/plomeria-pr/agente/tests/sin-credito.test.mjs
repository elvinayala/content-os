// node --test tests/sin-credito.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const S = await import("../dist/sin-credito.js");

test("reconoce el error de crédito de Anthropic", () => {
  assert.equal(S.esSinCredito(new Error('400 {"type":"error","error":{"message":"Your credit balance is too low to access the Anthropic API."}}')), true);
  assert.equal(S.esSinCredito(new Error("529 overloaded")), false);
});
test("solo se reintenta dentro de la ventana de Messenger", () => {
  const ahora = Date.parse("2026-09-29T12:00:00Z");
  const h = (n) => new Date(ahora - n * 3600_000).toISOString();
  const l = [{ tipo: "dm", clave: "a", fecha: h(2), m: {} }, { tipo: "dm", clave: "b", fecha: h(23.5), m: {} }, { tipo: "sms", clave: "c", fecha: h(23.5), m: {} }];
  assert.deepEqual(S.vigentes(l, ahora).map((p) => p.clave), ["a", "c"]);
});

test("si la persona escribe dos veces, se contestan los dos mensajes juntos", () => {
  const a = { tipo: "dm", clave: "h", fecha: "2026-09-29T02:12:08Z", m: { texto: "Reemplazo de inodoro" } };
  const b = { tipo: "dm", clave: "h", fecha: "2026-09-29T02:12:17Z", m: { texto: "Precio" } };
  const l = S.juntar(S.juntar([], a), b);
  assert.equal(l.length, 1);
  assert.equal(l[0].m.texto, "Reemplazo de inodoro\nPrecio");
  assert.equal(l[0].fecha, a.fecha);
});
