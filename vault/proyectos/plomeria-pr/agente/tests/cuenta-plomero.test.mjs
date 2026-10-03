import { test } from "node:test";
import assert from "node:assert/strict";
import { cuentaPlomero, viernesDePago, partesDelPago } from "../dist/cuenta-plomero.js";

const PR = (s) => Date.parse(s + "-04:00");
const t = (id, o) => ({ id, plomeroId: "luis", servicio: "Destape", municipio: "Cidra", estado: "cobrado", inicio: "2026-10-05T08:00:00-04:00", manoObra: 100, ...o });
const trabajos = [
  t("A", { terminadoEn: "2026-10-07T14:00:00-04:00", cobradoEn: "2026-10-07T23:30:00-04:00", pagoPlomero: 100 }),   // pagó el miércoles → este viernes
  t("B", { terminadoEn: "2026-10-07T16:00:00-04:00", cobradoEn: "2026-10-08T10:00:00-04:00", pagoPlomero: 50 }),    // pagó el jueves → viernes siguiente
  t("C", { estado: "completado", terminadoEn: "2026-10-08T11:00:00-04:00", pagoPlomero: 80 }),                     // cliente no ha pagado
  t("D", { terminadoEn: "2026-09-30T10:00:00-04:00", cobradoEn: "2026-09-30T12:00:00-04:00", pagoPlomero: 60, pagadoAlPlomero: "2026-10-02" }),
  t("E", { estado: "agendado", inicio: "2026-10-10T09:00:00-04:00" }),                                            // sábado: por hacer
  t("F", { estado: "agendado", inicio: "2026-10-12T09:00:00-04:00" }),                                            // otra semana
  t("G", { plomeroId: "edgar", terminadoEn: "2026-10-07T10:00:00-04:00", pagoPlomero: 999 }),
  t("H", { terminadoEn: "2026-10-06T10:00:00-04:00", pagoPlomero: 40 }),                                          // viejo, sin cobradoEn
  t("X", { estado: "cancelado", inicio: "2026-10-09T09:00:00-04:00" }),
];
const ofertas = [{ referencia: "E", aceptadoPor: "luis", pagoProveedor: 120 }, { referencia: "E", aceptadoPor: "edgar", pagoProveedor: 7 }];

test("el viernes de pago es el próximo viernes (hoy si es viernes) y el corte es el miércoles a medianoche", () => {
  const { viernes, corte } = viernesDePago(PR("2026-10-08T15:00:00"));
  assert.equal(viernes, PR("2026-10-09T00:00:00")); assert.equal(corte, PR("2026-10-08T00:00:00"));
  assert.equal(viernesDePago(PR("2026-10-09T23:00:00")).viernes, PR("2026-10-09T00:00:00"));
  assert.equal(viernesDePago(PR("2026-10-10T08:00:00")).viernes, PR("2026-10-16T00:00:00"));
  assert.equal(viernesDePago(PR("2026-10-04T23:59:00")).viernes, PR("2026-10-09T00:00:00")); // domingo de noche, hora PR
});

test("reparte el dinero: este viernes, el siguiente, esperando al cliente y por hacer", () => {
  const c = cuentaPlomero(trabajos, ofertas, "luis", PR("2026-10-08T15:00:00"));
  assert.equal(c.esteViernes.fecha, "2026-10-09");
  assert.deepEqual(c.esteViernes.trabajos.map((x) => x.id).sort(), ["A", "H"]); assert.equal(c.esteViernes.total, 140);
  assert.equal(c.siguienteViernes.fecha, "2026-10-16");
  assert.deepEqual(c.siguienteViernes.trabajos.map((x) => x.id), ["B"]); assert.equal(c.siguienteViernes.total, 50);
  assert.deepEqual(c.esperandoCliente.trabajos.map((x) => x.id), ["C"]); assert.equal(c.esperandoCliente.total, 80);
  assert.deepEqual(c.porHacer.trabajos.map((x) => x.id), ["E"]); assert.equal(c.porHacer.total, 120);
});

test("lo ganado en la semana, lo ya pagado y el acumulado", () => {
  const c = cuentaPlomero(trabajos, ofertas, "luis", PR("2026-10-08T15:00:00"));
  assert.equal(c.semana.desde, "2026-10-05"); assert.equal(c.semana.total, 270); assert.equal(c.semana.trabajos.length, 4);
  assert.deepEqual(c.pagados, [{ fecha: "2026-10-02", total: 60, trabajos: 1 }]);
  assert.equal(c.acumulado, 330); assert.equal(c.trabajosTotales, 5);
});

test("el sábado, todo lo cobrado sin pagar va al viernes que viene", () => {
  const c = cuentaPlomero(trabajos, ofertas, "luis", PR("2026-10-10T08:00:00"));
  assert.equal(c.esteViernes.fecha, "2026-10-16"); assert.equal(c.esteViernes.total, 190); assert.equal(c.siguienteViernes.total, 0);
});

test("sin oferta, el estimado de lo por hacer es el 65 % de la mano de obra", () => {
  const c = cuentaPlomero([t("Z", { estado: "agendado", inicio: "2026-10-09T09:00:00-04:00", manoObra: 200 })], [], "luis", PR("2026-10-08T15:00:00"));
  assert.equal(c.porHacer.total, 130);
});

test("comisiona solo de la mano de obra: las piezas (costo + 10 %) van aparte", () => {
  assert.deepEqual(partesDelPago({ pagoPlomero: 97.5, piezasPlomero: 33, materialesCosto: 30 }), { comision: 97.5, piezas: 33 });
  // cerrado antes del 2/oct: pagoPlomero traía 65 % de $150 + $30 × 1.10 junto
  assert.deepEqual(partesDelPago({ pagoPlomero: 130.5, materialesCosto: 30 }), { comision: 97.5, piezas: 33 });
  assert.deepEqual(partesDelPago({ pagoPlomero: 40, materialesCosto: 40, garantiaDe: "R-1" }), { comision: 0, piezas: 40 });
});

test("el viernes suma solo comisión; las piezas salen en su bloque hasta que se devuelven", () => {
  const ts = [
    t("P1", { terminadoEn: "2026-10-06T10:00:00-04:00", cobradoEn: "2026-10-06T12:00:00-04:00", pagoPlomero: 97.5, piezasPlomero: 33, materialesCosto: 30 }),
    t("P2", { terminadoEn: "2026-10-06T15:00:00-04:00", cobradoEn: "2026-10-06T16:00:00-04:00", pagoPlomero: 65, piezasPlomero: 11, materialesCosto: 10, piezasDevueltas: "2026-10-07" }),
    t("P3", { terminadoEn: "2026-09-29T10:00:00-04:00", pagoPlomero: 130.5, materialesCosto: 30, pagadoAlPlomero: "2026-10-02" }), // viejo y ya pagado
  ];
  const c = cuentaPlomero(ts, [], "luis", PR("2026-10-08T15:00:00"));
  assert.equal(c.esteViernes.total, 162.5);
  assert.deepEqual(c.piezas.porDevolver.trabajos.map((x) => x.id), ["P1"]); assert.equal(c.piezas.porDevolver.total, 33);
  assert.equal(c.piezas.devueltas, 44);
  assert.equal(c.acumulado, 260);
});

test("montos del cierre: cliente paga piezas + 20 %, plomero 65 % de la mano de obra y piezas + 10 %", async () => {
  const { montosDeCierre } = await import("../dist/cuenta-plomero.js");
  assert.deepEqual(montosDeCierre({ manoObra: 129, fee: 19, recargo: 0, piezasCosto: 65, margenClientePct: 20 }), { total: 226, matCliente: 78, pago: 83.85, piezas: 71.5 });
  assert.deepEqual(montosDeCierre({ manoObra: 249, fee: 19, recargo: 0, piezasCosto: 0, margenClientePct: 20 }), { total: 268, matCliente: 0, pago: 161.85, piezas: 0 });
});

test("equipo que pone Resuelto: el cliente lo paga con 20 %, al plomero no se le devuelve", async () => {
  const { montosDeCierre } = await import("../dist/cuenta-plomero.js");
  assert.deepEqual(montosDeCierre({ manoObra: 249, fee: 19, recargo: 0, piezasCosto: 10, equipoResuelto: 280, margenClientePct: 20 }), { total: 616, matCliente: 348, pago: 161.85, piezas: 11 });
});
