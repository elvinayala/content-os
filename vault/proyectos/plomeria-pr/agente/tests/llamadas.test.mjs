// node --test tests/llamadas.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const L = await import("../dist/canales/llamadas.js");
const N = "+17879561111";
const base = { direction: "inbound", from: "+17875550101", to: N };
test("mensaje de voz, sin contestar o rechazada = perdida", () => {
  assert.equal(L.clasificarLlamada({ ...base, isVoicemail: true, durationSeconds: 40 }, N), "perdida");
  assert.equal(L.clasificarLlamada({ ...base, endReason: "no_answer" }, N), "perdida");
  assert.equal(L.clasificarLlamada({ ...base, endReason: "rejected" }, N), "perdida");
});
test("colgó en menos de 15 s = perdida; conversación real = contestada", () => {
  assert.equal(L.clasificarLlamada({ ...base, endReason: "hangup", durationSeconds: 6 }, N), "perdida");
  assert.equal(L.clasificarLlamada({ ...base, endReason: "hangup", durationSeconds: 180 }, N), "contestada");
});
test("salientes, a otro número o sin número configurado: se ignoran", () => {
  assert.equal(L.clasificarLlamada({ ...base, direction: "outbound", endReason: "no_answer" }, N), null);
  assert.equal(L.clasificarLlamada({ ...base, to: "+19392479234", endReason: "no_answer" }, N), null);
  assert.equal(L.clasificarLlamada({ ...base, endReason: "no_answer" }, undefined), null);
});
