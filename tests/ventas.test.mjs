import assert from "node:assert/strict";
import { test } from "node:test";

import { carrera, equipo, errorBono, errorDiario, leerHojaVentas, marcador, mismaPersona, pasarelaDe, pctChatter, pctCloser, semanaDe, siguienteTramo, tasasDelMes, transaccionesDe } from "../lib/ventas/reglas.ts";

test("closer: 7 % base; 8-10 % solo con show-up ≥ 60 % (reglas de Nahuel)", () => {
  assert.equal(pctCloser(null, null), 0.07);
  assert.equal(pctCloser(0.8, 0.15), 0.07); // menos del 20 % = 7 %
  assert.equal(pctCloser(0.8, 0.2), 0.07);
  assert.equal(pctCloser(0.6, 0.25), 0.08);
  assert.equal(pctCloser(0.7, 0.3), 0.09);
  assert.equal(pctCloser(0.7, 0.35), 0.1);
  assert.equal(pctCloser(0.7, 0.5), 0.1);
  assert.equal(pctCloser(0.59, 0.4), 0.07); // sin 60 % de show-up se queda en 7 % aunque cierre 35 %+
});

test("chatter: 5 % solo si pasa de 200 agendas propias", () => {
  assert.equal(pctChatter(120), 0.04);
  assert.equal(pctChatter(200), 0.04);
  assert.equal(pctChatter(201), 0.05);
  assert.match(siguienteTramo("chatter", { showUp: null, cierre: null, agendas: 150 }), /51 agendas/);
});

test("pasarelas: Stripe/PayPal/ATH 3.5 %, Klarna 4.5 %, transferencia 0 %", () => {
  assert.equal(pasarelaDe("Stripe").fee, 0.035);
  assert.equal(pasarelaDe("PAYPAL").fee, 0.035);
  assert.equal(pasarelaDe("ATH Móvil").fee, 0.035);
  assert.equal(pasarelaDe("Klarna").fee, 0.045);
  assert.equal(pasarelaDe("Transferencia").fee, 0);
  assert.equal(pasarelaDe("Transferencia").desconocida, false);
  assert.equal(pasarelaDe("Afterpay").desconocida, true);
});

const HOJA = [
  ["LUM Sales Septiembre 2026"],
  ["Fecha", "Cliente", "Tipo de Transacción", "Monto cobrado", "Método de pago", "Closer", "Setter", "Chatter", "Valor Neto"],
  ["9/1/2026", "Ana", "New Sale", "$2,000.00", "Stripe", "Roger Arteaga", "Luis Fernández", "Ana Cecilio", "$1,930.00"],
  ["9/2/2026", "Beto", "New Sale", "$1,000.00", "Klarna", "Roger", "Luis F.", "Dilan Torres", ""],
  ["9/15/2026", "Carla", "Payment of debt", "$500.00", "Transferencia", "Laura Bernal", "-", "", ""],
  ["9/27/2026", "Dani", "New Sale", "$3,000.00", "ATH Movil", "Laura Bernal", "Luis Fernandez", "Ana Cecilio", ""],
  ["", "", "", "", "", "", "", "", ""],
];

test("hoja: lee columnas, neto por pasarela y tipo", () => {
  const h = leerHojaVentas(HOJA, "mdy");
  assert.equal(h.error, undefined);
  assert.equal(h.metodoNeto, "pasarela");
  assert.equal(h.transacciones.length, 4);
  const [a, b, c] = h.transacciones;
  assert.equal(a.fecha, "2026-09-01");
  assert.equal(a.neto, 1930);
  assert.equal(b.neto, 955);
  assert.equal(c.tipo, "cuota");
  assert.equal(c.neto, 500);
  assert.equal(c.setter, "");
});

test("personas: la hoja escribe los nombres como quiere", () => {
  assert.ok(mismaPersona("Roger", "Roger Arteaga"));
  assert.ok(mismaPersona("Luis F.", "Luis Fernández"));
  assert.ok(mismaPersona("luis fernandez", "Luis Fernández"));
  assert.ok(!mismaPersona("Laura Bernal", "Luis Fernández"));
  assert.ok(!mismaPersona("", "Roger Arteaga"));
  assert.ok(mismaPersona("Rogelio", "Roger Arteaga", ["Rogelio"]));
  assert.ok(mismaPersona("Santiago Gutiérrez", "Santiago Alejandro Gutiérrez Castaño"));
  assert.ok(!mismaPersona("Santiago Pérez", "Santiago Alejandro Gutiérrez Castaño"));
  assert.ok(!mismaPersona("Juan José", "Juan David Guzman Escobar"));
});

test("marcador del closer: comisión privada sobre el neto del mes", () => {
  const { transacciones } = leerHojaVentas(HOJA, "mdy");
  const mias = transaccionesDe(transacciones, "closer", "Roger Arteaga");
  assert.equal(mias.length, 2);
  const tasas = tasasDelMes({ diario: [{ fecha: "2026-09-01", citas: 5, presentaron: 4, conversaciones: 0, agendas: 0 }, { fecha: "2026-09-02", citas: 3, presentaron: 2, conversaciones: 0, agendas: 0 }], cierresHoja: 2, agendasLeads: 0 });
  assert.equal(tasas.showUp, 0.75);
  assert.equal(Math.round(tasas.cierre * 100), 33);
  const m = marcador({ txs: mias, rol: "closer", hoy: "2026-09-02", semana: semanaDe("2026-09-02"), tasas });
  assert.equal(m.mes, 3000);
  assert.equal(m.hoy, 1000);
  assert.equal(m.netoMes, 2885);
  assert.equal(m.pct, 0.09);
  assert.equal(m.comision, 259.65);
});

test("carrera por rol y equipo con alerta", () => {
  const { transacciones } = leerHojaVentas(HOJA, "mdy");
  const personas = [{ userId: "r", nombre: "Roger Arteaga" }, { userId: "l", nombre: "Laura Bernal" }];
  const c = carrera(transacciones, "closer", personas);
  assert.deepEqual(c.map((x) => [x.userId, x.monto]), [["l", 3500], ["r", 3000]]);
  const e = equipo(transacciones, "level_up", "2026-09-28", 13);
  assert.equal(e.mes, 6500);
  assert.equal(e.alerta?.nivel, "rojo");
  assert.equal(equipo(transacciones, "level_up", "2026-09-27", 16).alerta?.nivel, "ambar");
  assert.equal(semanaDe("2026-09-27")[0], "2026-09-21");
});

test("validaciones de diario y bonos", () => {
  assert.equal(errorDiario({ citas: 3, presentaron: 4, conversaciones: 0, agendas: 0 }), "No pueden presentarse más de las citas que tenías");
  assert.equal(errorDiario({ citas: 3, presentaron: 2, conversaciones: 10, agendas: 1 }), null);
  assert.equal(errorBono({ titulo: "Primero en cerrar 5", monto: 200, desde: "2026-09-28", hasta: "2026-10-04" }), null);
  assert.match(errorBono({ titulo: "x", monto: 200, desde: "2026-09-28", hasta: null }), /título/);
});
