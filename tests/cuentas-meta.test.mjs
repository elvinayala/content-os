import test from "node:test";
import assert from "node:assert/strict";
import { clasificar, decidir, limpiarId, textoAviso, textoFicha } from "../lib/pulse/cuentas-meta-reglas.ts";

test("limpiarId acepta act_ y espacios, rechaza lo que no parece un ID", () => {
  assert.equal(limpiarId("act_1234567890123"), "1234567890123");
  assert.equal(limpiarId(" 1588 3197 9518 4399 "), "1588319795184399");
  assert.equal(limpiarId("no tengo"), null);
  assert.equal(limpiarId("12345"), null);
  assert.equal(limpiarId(null), null);
});

test("clasificar: permisos, ID inexistente, pago y errores transitorios", () => {
  assert.equal(clasificar({ error: { code: 200, message: "(#200) Ad account owner has NOT grant ads_management or ads_read permission" } }).estado, "sin-permiso");
  assert.equal(clasificar({ error: { code: 100, message: "Unsupported get request" } }).estado, "no-existe");
  assert.equal(clasificar({ error: { code: 190, message: "token expired" } }).estado, "transitorio");
  assert.equal(clasificar({ account_status: 1 }).estado, "ok");
  assert.equal(clasificar({ account_status: 3 }).estado, "pago");
  assert.equal(clasificar({ account_status: 9 }).estado, "pago");
  assert.equal(clasificar({ account_status: 2 }).estado, "inactiva");
  assert.equal(clasificar({ account_status: 101 }).estado, "inactiva");
});

test("decidir: avisa solo al cambiar; no llena la ficha de ✅ ni alerta por errores transitorios", () => {
  assert.deepEqual(decidir(null, "sin-permiso"), { escribir: true, avisar: "nuevo" });
  assert.deepEqual(decidir("sin-permiso", "sin-permiso"), { escribir: false, avisar: null });
  assert.deepEqual(decidir("sin-permiso", "no-existe"), { escribir: true, avisar: "nuevo" });
  assert.deepEqual(decidir("sin-permiso", "ok"), { escribir: true, avisar: "recuperado" });
  assert.deepEqual(decidir(null, "ok"), { escribir: false, avisar: null });
  assert.deepEqual(decidir("ok", "pago"), { escribir: true, avisar: "nuevo" });
  assert.deepEqual(decidir("sin-permiso", "transitorio"), { escribir: false, avisar: null });
});

test("los textos traen los pasos y el portafolio", () => {
  const t = textoFicha("sin-permiso", "123456789012345", "x");
  assert.match(t, /836808821982174/);
  assert.match(t, /Administrar campañas/);
  const a = textoAviso({ nuevos: [{ nombre: "Ana", empresa: "Spa", id: "123456789012345", estado: "sin-permiso", detalle: "d", admin: "Jessica" }], recuperados: [] });
  assert.match(a ?? "", /Ana · Spa/);
  assert.equal(textoAviso({ nuevos: [], recuperados: [] }), null);
});
