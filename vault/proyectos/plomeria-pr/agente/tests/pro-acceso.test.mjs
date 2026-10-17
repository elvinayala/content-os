// node --test tests/pro-acceso.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const A = await import("../dist/pro-acceso.js");
const M = await import("../dist/push-nativo.js");
test("soloDiez: quita el 1 y los símbolos", () => {
  assert.equal(A.soloDiez("1 (787) 555-0101"), "7875550101");
  assert.equal(A.soloDiez("787.555.0101"), "7875550101");
});
test("máximo 3 códigos cada 15 minutos", () => {
  const ahora = Date.now();
  assert.ok(A.puedePedir([ahora - 1000, ahora - 2000], ahora));
  assert.ok(!A.puedePedir([ahora - 1000, ahora - 2000, ahora - 3000], ahora));
  assert.ok(A.puedePedir([ahora - 16 * 60_000, ahora - 17 * 60_000, ahora - 18 * 60_000], ahora));
});
test("el código correcto entra una sola vez; el incorrecto cuenta intentos; vence a los 10 min", () => {
  const tel = "7875550199";
  const c = A.nuevoCodigo(tel);
  assert.match(c, /^\d{6}$/);
  const malo = c === "000000" ? "111111" : "000000";
  assert.equal(A.verificarCodigo(tel, malo), "incorrecto");
  assert.equal(A.verificarCodigo(tel, c), "ok");
  assert.equal(A.verificarCodigo(tel, c), "vencido"); // ya se usó
  const c2 = A.nuevoCodigo("7875550198", Date.now() - 11 * 60_000);
  assert.equal(A.verificarCodigo("7875550198", c2), "vencido");
});
test("5 intentos malos bloquean el código", () => {
  const tel = "7875550197"; const c = A.nuevoCodigo(tel); const malo = c === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++) assert.equal(A.verificarCodigo(tel, malo), "incorrecto");
  assert.equal(A.verificarCodigo(tel, c), "bloqueado");
});
test("mensaje FCM: la oferta urgente suena con la alerta y prioridad alta", () => {
  const m = M.mensajeFcm("tok", { titulo: "Nuevo trabajo · $96", cuerpo: "Caguas", url: "/pro", tag: "OF-1", ofertaId: "OF-1", urgente: true }).message;
  assert.equal(m.android.priority, "HIGH");
  assert.equal(m.android.notification.channel_id, "trabajos");
  assert.equal(m.apns.payload.aps.sound, "alerta.caf");
  assert.equal(m.apns.payload.aps["interruption-level"], "time-sensitive");
});
test("APNs: la oferta urgente suena con alerta.caf y es time-sensitive", () => {
  const m = M.mensajeApns({ titulo: "Nuevo trabajo", cuerpo: "Caguas", url: "/pro", tag: "OF-1", ofertaId: "OF-1", urgente: true });
  assert.equal(m.aps.sound, "alerta.caf");
  assert.equal(m.aps["interruption-level"], "time-sensitive");
  assert.equal(m.ofertaId, "OF-1");
});

test("el plomero pide su código por WhatsApp (T-Mobile no entrega los SMS del 787-956-1111)", async () => {
  const { pideCodigo, ventanaAbierta, textoCodigo } = await import("../dist/pro-acceso.js");
  assert.ok(pideCodigo("Código Resuelto Pro"));
  assert.ok(pideCodigo("codigo"));
  assert.ok(pideCodigo("mándame el código porfa"));
  assert.ok(!pideCodigo("tengo un tubo roto en la cocina y el agua no para, ¿cuánto cuesta arreglarlo con todo y código de construcción?"));
  assert.ok(!pideCodigo("hola"));
  assert.match(textoCodigo("123456"), /123456/);
  const ahora = Date.parse("2026-10-17T15:00:00Z");
  assert.ok(ventanaAbierta([{ fecha: "2026-10-17T10:00:00Z", autor: "cliente" }], ahora));
  assert.ok(!ventanaAbierta([{ fecha: "2026-09-23T21:44:31Z", autor: "cliente" }, { fecha: "2026-10-17T14:00:00Z", autor: "resuelto" }], ahora));
  assert.ok(!ventanaAbierta([], ahora));
});
