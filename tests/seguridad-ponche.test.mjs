import assert from "node:assert/strict";
import { test } from "node:test";

import { decisionPonche, duracionAlmuerzo, errorAlmuerzo, errorPoncheManual, esMovil, estadoAlRegistrar, redDe, resumenAgente } from "../lib/desempeno/seguridad-reglas.ts";

const WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

test("teléfonos no; computadoras sí", () => {
  assert.equal(esMovil(IPHONE), true);
  assert.equal(esMovil(WIN), false);
  assert.equal(resumenAgente(WIN), "Chrome · Windows");
  assert.deepEqual(estadoAlRegistrar({ aprobadosQueTiene: 0, movil: true }), { error: "Solo se registran computadoras (no teléfonos ni tablets)." });
  assert.deepEqual(estadoAlRegistrar({ aprobadosQueTiene: 0, movil: false }), { estado: "aprobado" });
  assert.deepEqual(estadoAlRegistrar({ aprobadosQueTiene: 1, movil: false }), { estado: "pendiente" });
});

test("redes: IPv4 exacta, IPv6 por prefijo /64", () => {
  assert.equal(redDe("24.139.10.5"), "24.139.10.5");
  assert.equal(redDe("::ffff:24.139.10.5"), "24.139.10.5");
  assert.equal(redDe("2600:1700:abcd:12::1"), "2600:1700:abcd:12::/64");
  assert.equal(redDe("2600:1700:abcd:0012:aaaa:bbbb:cccc:dddd"), "2600:1700:abcd:12::/64");
  assert.equal(redDe(""), null);
});

test("decisión del ponche", () => {
  const ok = { estado: "aprobado", ips: ["24.139.10.5", "2600:1700:abcd:12::/64"] };
  assert.deepEqual(decisionPonche({ equipo: ok, ip: "24.139.10.5", movil: false }), { ok: true });
  assert.deepEqual(decisionPonche({ equipo: ok, ip: "2600:1700:abcd:12:9:9:9:9", movil: false }), { ok: true });
  assert.deepEqual(decisionPonche({ equipo: ok, ip: "8.8.8.8", movil: false }), { ok: false, motivo: "red-nueva" });
  assert.deepEqual(decisionPonche({ equipo: ok, ip: "24.139.10.5", movil: true }), { ok: false, motivo: "movil" });
  assert.deepEqual(decisionPonche({ equipo: null, ip: "24.139.10.5", movil: false }), { ok: false, motivo: "sin-equipo" });
  assert.deepEqual(decisionPonche({ equipo: { ...ok, estado: "pendiente" }, ip: "24.139.10.5", movil: false }), { ok: false, motivo: "equipo-pendiente" });
  assert.deepEqual(decisionPonche({ equipo: { ...ok, estado: "revocado" }, ip: "24.139.10.5", movil: false }), { ok: false, motivo: "equipo-revocado" });
});

test("almuerzo: 11 AM a 2 PM (PR), una vez, 1 hora", () => {
  const pr = (hhmm) => new Date(`2026-09-28T${hhmm}:00-04:00`);
  assert.equal(errorAlmuerzo({ ahora: pr("12:15"), yaAlmorzo: false, trabajando: true }), null);
  assert.equal(errorAlmuerzo({ ahora: pr("13:59"), yaAlmorzo: false, trabajando: true }), null);
  assert.match(errorAlmuerzo({ ahora: pr("10:59"), yaAlmorzo: false, trabajando: true }), /11:00 AM/);
  assert.match(errorAlmuerzo({ ahora: pr("14:00"), yaAlmorzo: false, trabajando: true }), /2:00 PM/);
  assert.equal(errorAlmuerzo({ ahora: pr("12:00"), yaAlmorzo: true, trabajando: true }), "Ya tomaste tu almuerzo hoy");
  assert.equal(errorAlmuerzo({ ahora: pr("12:00"), yaAlmorzo: false, trabajando: false }), "Primero marca tu entrada");
  assert.deepEqual(duracionAlmuerzo(pr("12:00"), pr("13:04")), { minutos: 64, largo: false });
  assert.deepEqual(duracionAlmuerzo(pr("12:00"), pr("13:10")), { minutos: 70, largo: true });
});

test("ponche manual", () => {
  const ahora = new Date("2026-09-28T15:00:00Z");
  assert.equal(errorPoncheManual({ tipo: "entrada", hora: new Date("2026-09-28T12:00:00Z"), motivo: "Se fue la luz en casa", ahora }), null);
  assert.equal(errorPoncheManual({ tipo: "entrada", hora: new Date("2026-09-28T17:00:00Z"), motivo: "Se fue la luz", ahora }), "No se puede pedir un ponche en el futuro");
  assert.match(errorPoncheManual({ tipo: "salida", hora: new Date("2026-09-20T12:00:00Z"), motivo: "olvido total", ahora }), /3 días/);
  assert.match(errorPoncheManual({ tipo: "salida", hora: new Date("2026-09-28T12:00:00Z"), motivo: "x", ahora }), /por qué/);
  assert.equal(errorPoncheManual({ tipo: "otro", hora: ahora, motivo: "motivo largo", ahora }), "Escoge entrada o salida");
});

test("noEsComputadora: teléfono, iPad disfrazado de Mac y la app instalada no ponchan", async () => {
  const { noEsComputadora } = await import("../lib/desempeno/seguridad-reglas.ts");
  const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
  assert.equal(noEsComputadora(mac, {}), null);
  assert.equal(noEsComputadora(mac, null), null);
  assert.equal(noEsComputadora(iphone, {}), "movil");
  assert.equal(noEsComputadora(mac, { ipad: true }), "movil");
  assert.equal(noEsComputadora(mac, { app: true }), "app");
  assert.equal(noEsComputadora(iphone, { app: true }), "movil");
});
