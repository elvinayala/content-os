// node --test tests/aviso-cliente.test.mjs  (usa el build en dist/)
// Aure (22/oct): con la cita agendada la IA calla; después del cobro (o 30 días quieto) vuelve a atender.
import { test } from "node:test";
import assert from "node:assert/strict";
const A = await import("../dist/aviso-cliente.js");
const D = 86_400_000, AHORA = Date.UTC(2026, 9, 24, 12);
const t = (estado, diasAtras = 1, contactoId = "c1") => ({ id: `R-${estado}`, contactoId, estado, creado: new Date(AHORA - diasAtras * D).toISOString() });

test("agendado, en camino, en sitio y completado (esperando cobro) silencian el chat", () => {
  for (const e of ["agendado", "en-camino", "en-sitio", "completado"]) assert.equal(A.trabajoActivoDe([t(e)], "c1", AHORA)?.estado, e);
});
test("cobrado o cancelado: el agente vuelve a atender", () => {
  assert.equal(A.trabajoActivoDe([t("cobrado"), t("cancelado")], "c1", AHORA), undefined);
});
test("solo el contacto del trabajo, y no si lleva más de 30 días quieto", () => {
  assert.equal(A.trabajoActivoDe([t("agendado", 1, "otro")], "c1", AHORA), undefined);
  assert.equal(A.trabajoActivoDe([t("agendado", 40)], "c1", AHORA), undefined);
  assert.ok(A.trabajoActivoDe([{ ...t("agendado", 40), inicio: new Date(AHORA + 2 * D).toISOString() }], "c1", AHORA));
});
