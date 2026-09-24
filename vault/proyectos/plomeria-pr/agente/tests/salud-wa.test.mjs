// node --test tests/salud-wa.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const S = await import("../dist/canales/salud-wa.js");

// La ficha real de Zernio la noche del bloqueo (23/sep/2026, 8:46 PM).
const bloqueada = { _id: "x", enabled: true, isActive: true, needsReconnection: false, metadata: { metaStatus: "CONNECTED", qualityRating: "GREEN", messagingLimitTier: "TIER_250", businessStatus: { lastEvent: { event: "ACCOUNT_VIOLATION", violation_info: { violation_type: "SCAM" } }, lastEventAt: "2026-09-24T00:46:15.302Z" } } };
const sana = { ...bloqueada, metadata: { ...bloqueada.metadata, businessStatus: undefined } };

test("evaluarSalud: la violación SCAM de Meta = caída, aunque la calidad esté en verde", () => {
  const s = S.evaluarSalud(bloqueada);
  assert.equal(s.ok, false); assert.match(s.motivo, /ACCOUNT_VIOLATION · SCAM/); assert.equal(s.eventoEn, "2026-09-24T00:46:15.302Z");
});
test("evaluarSalud: sana = ok; desconectada o Meta no CONNECTED = caída", () => {
  assert.equal(S.evaluarSalud(sana).ok, true);
  assert.equal(S.evaluarSalud({ ...sana, needsReconnection: true }).ok, false);
  assert.equal(S.evaluarSalud({ ...sana, metadata: { ...sana.metadata, metaStatus: "DISCONNECTED" } }).ok, false);
  assert.equal(S.evaluarSalud(undefined).ok, false);
});
test("evaluarSalud: calidad amarilla/roja = alerta sin tumbar", () => {
  const s = S.evaluarSalud({ ...sana, metadata: { ...sana.metadata, qualityRating: "YELLOW" } });
  assert.equal(s.ok, true); assert.match(s.alerta, /YELLOW/);
});
test("evaluarSalud: un evento marcado como resuelto ya no cuenta", () => {
  assert.equal(S.evaluarSalud(bloqueada, ["ACCOUNT_VIOLATION@2026-09-24T00:46:15.302Z"]).ok, true);
});
test("puedeEnviar: nunca iniciarle a un número interno (lo que causó el bloqueo); contestarle sí", () => {
  const base = { telefono: "17879517579", inicia: true, respuesta: false, caido: false, internos: ["7879517579"], iniciadosHoy: 0 };
  assert.equal(S.puedeEnviar(base).ok, false);
  assert.equal(S.puedeEnviar({ ...base, inicia: false }).ok, false); // aviso en conversación abierta: tampoco
  assert.equal(S.puedeEnviar({ ...base, inicia: false, respuesta: true }).ok, true);
});
test("puedeEnviar: cuenta caída = nada; tope diario para lo que inicia el negocio", () => {
  const base = { telefono: "19393812983", inicia: false, respuesta: true, caido: true, internos: [], iniciadosHoy: 0 };
  assert.equal(S.puedeEnviar(base).ok, false);
  assert.equal(S.puedeEnviar({ ...base, caido: false }).ok, true);
  assert.equal(S.puedeEnviar({ ...base, caido: false, inicia: true, respuesta: false, iniciadosHoy: S.TOPE_INICIADOS_DIA }).ok, false);
});
