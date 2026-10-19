import assert from "node:assert/strict";
import { test } from "node:test";

import { aTransacciones, enlaceDe, montoDe, resumenRegistro, validarVenta } from "../lib/ventas/registro-reglas.ts";
import { carrera, transaccionesDe } from "../lib/ventas/reglas.ts";
import { puestoPorId } from "../lib/desempeno/reglas.ts";

const HOY = "2026-10-19";
const base = { fecha: HOY, cliente: "Tinos Pizza", vendedor: "Roger Arteaga", agendo: "Valentina", tipo: "nueva", fuente: "Anuncio de Meta", anuncio: "", referidoPor: "", cash: "1,500", acuerdo: "3500", metodo: "Stripe", nota: "" };

test("venta válida: montos con coma, sin anuncio, agendó opcional", () => {
  const r = validarVenta(base, HOY);
  assert.ok(r.ok);
  assert.equal(r.v.cash, 1500);
  assert.equal(r.v.acuerdo, 3500);
  assert.equal(r.v.anuncio, null);
  assert.equal(r.v.referidoPor, null);
});

test("cash collected en 0 vale; los dos en 0 no", () => {
  assert.ok(validarVenta({ ...base, cash: "0" }, HOY).ok);
  assert.equal(validarVenta({ ...base, cash: "0", acuerdo: "0" }, HOY).ok, false);
  assert.equal(validarVenta({ ...base, cash: "" }, HOY).ok, false);
});

test("el cash no puede pasar el acuerdo", () => {
  const r = validarVenta({ ...base, cash: "4000" }, HOY);
  assert.equal(r.ok, false);
  assert.match(r.error, /mayor/);
});

test("referido exige de quién vino y su fuente es Referido", () => {
  assert.equal(validarVenta({ ...base, tipo: "referido" }, HOY).ok, false);
  const r = validarVenta({ ...base, tipo: "referido", referidoPor: "María López", fuente: "" }, HOY);
  assert.ok(r.ok);
  assert.equal(r.v.fuente, "Referido");
  assert.equal(r.v.referidoPor, "María López");
});

test("el enlace del anuncio solo en nueva venta y tiene que ser válido", () => {
  const r = validarVenta({ ...base, anuncio: "facebook.com/ads/library/?id=123" }, HOY);
  assert.ok(r.ok);
  assert.equal(r.v.anuncio, "https://facebook.com/ads/library/?id=123");
  assert.equal(validarVenta({ ...base, anuncio: "no es un link" }, HOY).ok, false);
  const rec = validarVenta({ ...base, tipo: "recurrente", anuncio: "facebook.com/x" }, HOY);
  assert.ok(rec.ok);
  assert.equal(rec.v.anuncio, null);
});

test("sin fuente, día futuro o muy viejo, sin tipo → error", () => {
  assert.equal(validarVenta({ ...base, fuente: "" }, HOY).ok, false);
  assert.equal(validarVenta({ ...base, fecha: "2026-10-20" }, HOY).ok, false);
  assert.equal(validarVenta({ ...base, fecha: "2026-08-01" }, HOY).ok, false);
  assert.equal(validarVenta({ ...base, tipo: "otro" }, HOY).ok, false);
});

test("montoDe y enlaceDe", () => {
  assert.equal(montoDe("$1,500.50"), 1500.5);
  assert.equal(montoDe("1.500,50"), 1500.5);
  assert.equal(montoDe(""), null);
  assert.equal(enlaceDe("javascript:alert(1)"), null);
});

test("a transacciones: nueva/referido cuentan como nuevas, el neto descuenta la pasarela y el chatter se reconoce", () => {
  const ventas = [
    validarVenta(base, HOY).v,
    validarVenta({ ...base, tipo: "referido", referidoPor: "Ana", agendo: "Dilan", metodo: "Klarna", cash: "1000" }, HOY).v,
    validarVenta({ ...base, tipo: "balance", agendo: "", metodo: "Transferencia", cash: "500" }, HOY).v,
  ];
  const txs = aTransacciones(ventas, ["Dilan Torres"]);
  assert.deepEqual(txs.map((t) => t.tipo), ["nueva", "nueva", "cuota"]);
  assert.equal(txs[0].neto, 1447.5);
  assert.equal(txs[0].setter, "Valentina");
  assert.equal(txs[1].chatter, "Dilan");
  assert.equal(txs[1].setter, "");
  assert.equal(txs[2].neto, 500);
  // Le cuentan a Roger en la carrera y en su marcador.
  assert.equal(transaccionesDe(txs, "closer", "Roger Arteaga").length, 3);
  assert.equal(carrera(txs, "closer", [{ userId: "r", nombre: "Roger Arteaga" }])[0].monto, 3000);
});

test("resumen: cobrado, por tipo, por fuente y lo que falta por cobrar de lo nuevo", () => {
  const ventas = [validarVenta(base, HOY).v, validarVenta({ ...base, tipo: "recurrente", cash: "297", acuerdo: "297", fuente: "Cliente actual" }, HOY).v];
  const r = resumenRegistro(ventas);
  assert.equal(r.cash, 1797);
  assert.equal(r.porTipo.nueva.n, 1);
  assert.equal(r.porCobrarNuevas, 2000);
  assert.equal(r.porFuente[0].fuente, "Anuncio de Meta");
});

test("el videógrafo no ve Empresa", () => {
  assert.equal(puestoPorId("videografo").sinEmpresa, true);
  assert.equal(puestoPorId("tesoreria").sinEmpresa, undefined);
});
