// node --test tests/adicionales.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const A = await import("../dist/adicionales.js");
const { servicioPorId } = await import("../dist/catalogo.js");

test("del menú con precio fijo: el precio sale solo y va al cliente", () => {
  const r = A.armarAdicional({ tipo: "adicional", servicioId: "reparacion-inodoro" }, servicioPorId("reparacion-inodoro"));
  assert.equal(r.ok, true); assert.equal(r.adicional.precio, 99); assert.equal(r.adicional.estado, "esperando-cliente");
});
test("por rango: exige precio dentro del rango", () => {
  const s = servicioPorId("reparacion-filtracion");
  assert.equal(A.armarAdicional({ servicioId: s.id }, s).ok, false);
  assert.equal(A.armarAdicional({ servicioId: s.id, precio: 9999 }, s).ok, false);
  const r = A.armarAdicional({ servicioId: s.id, precio: 400 }, s); assert.equal(r.ok, true); assert.equal(r.adicional.precio, 400);
});
test("fuera del menú: Resuelto aprueba el precio primero", () => {
  assert.equal(A.armarAdicional({ descripcion: "remover inodoro" }, undefined).ok, false);
  const r = A.armarAdicional({ descripcion: "remover y reinstalar el inodoro para destapar", precio: 90 }, undefined);
  assert.equal(r.ok, true); assert.equal(r.adicional.estado, "por-precio"); assert.equal(r.adicional.precio, null); assert.equal(r.adicional.precioPropuesto, 90);
});
test("recomendación: con o sin precio, siempre la decide el cliente", () => {
  const r = A.armarAdicional({ tipo: "recomendacion", descripcion: "pasar cámara por la línea principal" }, undefined);
  assert.equal(r.ok, true); assert.equal(r.adicional.precio, null); assert.equal(r.adicional.estado, "esperando-cliente");
});
test("solo lo aprobado se suma al cobro", () => {
  const t = { adicionales: [{ estado: "aprobado", precio: 99 }, { estado: "rechazado", precio: 150 }, { estado: "esperando-cliente", precio: 50 }, { estado: "aprobado", precio: null }] };
  assert.equal(A.manoObraAdicional(t), 99);
});
test("la firma del enlace distingue cliente y equipo", () => {
  const k = A.firma("R-0001", "A1", "cliente");
  assert.equal(A.firmaOk("R-0001", "A1", "cliente", k), true);
  assert.equal(A.firmaOk("R-0001", "A1", "equipo", k), false);
  assert.equal(A.firmaOk("R-0002", "A1", "cliente", k), false);
});

const { garantiaDe } = await import("../dist/catalogo.js");
test("destapes: 30 días de garantía; lo demás, 12 meses", () => {
  assert.equal(garantiaDe("destape-simple").texto, "30 días");
  assert.equal(garantiaDe("destape-maquina").dias, 30);
  assert.equal(garantiaDe("llave-mezcladora").texto, "12 meses");
});
test("servicio a cotizar: el plomero propone y Resuelto aprueba", () => {
  const r = A.armarAdicional({ servicioId: "valvula-salida-inodoro", precio: 85 }, servicioPorId("valvula-salida-inodoro"));
  assert.equal(r.ok, true); assert.equal(r.adicional.estado, "por-precio"); assert.match(r.adicional.descripcion, /válvula de salida/i);
});

const { citaDuplicada } = await import("../dist/herramientas.js");
test("no se crea una segunda cita para el mismo cliente el mismo día", () => {
  const ts = [{ id: "R-0004", contactoId: "messenger:1", estado: "agendado", inicio: "2026-10-03T10:00:00-04:00", servicio: "Mezcladora" }];
  assert.equal(citaDuplicada(ts, "messenger:1", "2026-10-03T14:00:00-04:00")?.id, "R-0004");
  assert.equal(citaDuplicada(ts, "messenger:1", "2026-10-04T10:00:00-04:00"), undefined);
  assert.equal(citaDuplicada(ts, "messenger:2", "2026-10-03T10:00:00-04:00"), undefined);
  assert.equal(citaDuplicada([{ ...ts[0], estado: "cancelado" }], "messenger:1", "2026-10-03T10:00:00-04:00"), undefined);
});
