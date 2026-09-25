// node --test tests/sms.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const S = await import("../dist/canales/sms.js");
test("e164: 10 dígitos de PR y 11 con el 1", () => {
  assert.equal(S.e164("787-555-0101"), "+17875550101");
  assert.equal(S.e164("17875550101"), "+17875550101");
  assert.equal(S.e164("123"), null);
});
test("baja: STOP, BAJA, parar", () => {
  for (const t of ["STOP", "stop", "Baja", "parar.", "no más"]) assert.ok(S.BAJA.test(t), t);
  assert.ok(!S.BAJA.test("no puedo mañana"));
});
test("parsearSMS: solo eventos de SMS entrantes", () => {
  const sms = { event: "message.received", message: { platform: "sms", direction: "incoming", from: "+17875550101", text: "sí, mañana a las 10", id: "m1" } };
  assert.deepEqual(S.parsearSMS(sms), { de: "+17875550101", texto: "sí, mañana a las 10", id: "m1" });
  assert.equal(S.parsearSMS({ ...sms, message: { ...sms.message, platform: "facebook" } }), null);
  assert.equal(S.parsearSMS({ ...sms, message: { ...sms.message, direction: "outgoing" } }), null);
});
