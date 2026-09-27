import assert from "node:assert/strict";
import test from "node:test";

import { contarAgendas, detectarOrden, diaPR, parseFecha, parseMonto, pestanasDelMes, textoResumen, ventasDelDia } from "../lib/resumen-dia.ts";

test("montos en los dos formatos de las hojas", () => {
  assert.equal(parseMonto("$3.500,00"), 3500);
  assert.equal(parseMonto("$3,500.00"), 3500);
  assert.equal(parseMonto("$723,75"), 723.75);
  assert.equal(parseMonto("$1,250"), 1250);
  assert.equal(parseMonto("500"), 500);
  assert.equal(parseMonto("-$250,00"), -250);
  assert.equal(parseMonto(""), null);
  assert.equal(parseMonto("N/A"), null);
});

test("fechas día/mes y mes/día", () => {
  assert.equal(parseFecha("27/9/2026", "dmy"), "2026-09-27");
  assert.equal(parseFecha("9/27/2026", "mdy"), "2026-09-27");
  assert.equal(parseFecha("2026-09-27", "dmy"), "2026-09-27");
  assert.equal(parseFecha("40/9/2026", "dmy"), null);
  assert.equal(detectarOrden(["1/9/2026", "27/9/2026"], "mdy"), "dmy");
  assert.equal(detectarOrden(["9/1/2026", "9/27/2026"], "dmy"), "mdy");
  assert.equal(detectarOrden(["1/9/2026"], "mdy"), "mdy");
});

test("pestaña del mes", () => {
  assert.deepEqual(pestanasDelMes("level_up", "2026-09-27"), ["lum sales septiembre 2026"]);
  assert.deepEqual(pestanasDelMes("ai_borinquen", "2026-10-01"), ["octubre 2026", "octubre"]);
});

test("ventas del día: nuevas vs renovaciones y cuotas (formato de la hoja de AIB)", () => {
  const filas = [
    ["Fecha de pago", "Nombre del cliente", "Tipo de venta", "Costo Total", "Pago Inicial", "Valor Neto de la venta", "Tipo de Transacción"],
    ["1/9/2026", "Henryk", "Mensualidad", "$750,00", "$750,00", "$723,75", "Payment of debt"],
    ["27/9/2026", "Ana", "Pago Único", "$3.500,00", "$3.500,00", "$3.377,50", "New Sale"],
    ["27/9/2026", "Luis", "Mensualidad", "$333,00", "$333,00", "$321,35", "Payment of debt"],
    ["27/9/2026", "Pepe", "Pago Único", "$1.000,00", "$1.000,00", "$965,00", "New Sale"],
    ["27/9/2026", "", "", "", "", "", ""],
  ];
  const r = ventasDelDia(filas, "2026-09-27", "dmy");
  assert.deepEqual(r.nuevas, { monto: 4342.5, n: 2 });
  assert.deepEqual(r.renovaciones, { monto: 321.35, n: 1 });
  assert.equal(r.error, undefined);
  assert.match(ventasDelDia([["a", "b"]], "2026-09-27", "dmy").error, /columnas/);
});

test("llamadas agendadas HOY (por fecha de reserva), onboardings aparte", () => {
  const dia = "2026-09-27";
  const ev = [
    { name: "VIDEOLLAMADA POR ZOOM", status: "active", created_at: "2026-09-27T15:00:00Z" },
    { name: "VIDEOLLAMADA POR ZOOM", status: "active", created_at: "2026-09-28T02:00:00Z" }, // 10 PM PR del 27
    { name: "VIDEOLLAMADA POR ZOOM", status: "active", created_at: "2026-09-26T15:00:00Z" }, // ayer
    { name: "Onboarding", status: "active", created_at: "2026-09-27T16:00:00Z" },
    { name: "VIDEOLLAMADA POR ZOOM", status: "canceled", created_at: "2026-09-20T15:00:00Z", updated_at: "2026-09-27T13:00:00Z" },
  ];
  assert.deepEqual(contarAgendas(ev, dia, (n) => /onboarding/i.test(n)), { llamadas: 2, onboardings: 1, canceladas: 1 });
  assert.equal(diaPR(new Date("2026-09-28T03:59:00Z")), "2026-09-27");
});

test("mensaje: por marca y total; sin hoja no inventa ventas", () => {
  const t = textoResumen("2026-09-27", [
    { marca: "level_up", agendas: { llamadas: 9, onboardings: 2, canceladas: 0 }, ventas: { nuevas: { monto: 7000, n: 2 }, renovaciones: { monto: 1500, n: 1 } } },
    { marca: "ai_borinquen", agendas: { llamadas: 6, onboardings: 0, canceladas: 1 }, ventas: null },
  ]);
  assert.match(t, /Level Up\*\n📞 Llamadas agendadas hoy: \*9\* \(\+ 2 onboardings\)/);
  assert.match(t, /Ventas nuevas: \*\$7,000\* \(2\)/);
  assert.match(t, /falta conectar la hoja/);
  assert.match(t, /\*Total:\* 15 llamadas\n/); // sin montos totales si falta una hoja
});
