import { test } from "node:test";
import assert from "node:assert/strict";
import { validarCierre, aplicarCierre, pagadoPorCliente } from "../dist/registro-pago.js";
import { ganancia, panelVentas, origenDe } from "../dist/ventas-panel.js";

const def = { fee: 19, recargo: 0 };
const base = { mano_obra: "249", piezas: "0", equipo: "280", otros_gastos: "", nota: "bomba de Resuelto", pagado: "si", total_pagado: "600", metodo: "ATH Móvil", pagos: "2", fecha_pago: "2026-10-03" };

test("valida: mano de obra, nota, gastos con explicación y cómo pagó", () => {
  assert.equal(validarCierre({ ...base, mano_obra: "" }, def).ok, false);
  assert.equal(validarCierre({ ...base, nota: " " }, def).ok, false);
  assert.match(validarCierre({ ...base, otros_gastos: "15" }, def).motivo, /otros gastos/);
  assert.equal(validarCierre({ ...base, metodo: "Bitcoin" }, def).ok, false);
  assert.equal(validarCierre({ ...base, total_pagado: "" }, def).ok, false);
  assert.equal(validarCierre({ ...base, pagado: "no", total_pagado: "" }, def).ok, true);
  const v = validarCierre(base, def); assert.equal(v.ok, true);
  assert.deepEqual({ fee: v.datos.fee, pagos: v.datos.pagos, total: v.datos.totalPagado }, { fee: 19, pagos: 2, total: 600 });
});

test("aplica: lo que correspondía, lo que pagó, comisión del plomero y cobrado con la fecha del pago", () => {
  const t = { id: "R-0005", estado: "completado", fee: 19, creado: "2026-10-01T00:00:00Z" };
  const v = validarCierre(base, def);
  const c = { ...v.datos, por: "Heileen", registrado: "2026-10-03T20:00:00Z" };
  const x = aplicarCierre(t, c, 20, "2026-10-03T20:00:00Z");
  assert.equal(x.estado, "cobrado"); assert.equal(x.cobradoEn, "2026-10-03T16:00:00.000Z");
  assert.equal(x.totalCliente, 604); assert.equal(x.pagoPlomero, 161.85); assert.equal(x.piezasPlomero, 0); assert.equal(x.materialesCosto, 280);
  const final = { ...t, ...x };
  assert.equal(pagadoPorCliente(final), 600);
  assert.equal(ganancia(final), 158.15); // 600 − 161.85 − 280
});

test("los otros gastos bajan lo que le queda a Resuelto y Ventas avisa lo que no tiene cierre", () => {
  const v = validarCierre({ ...base, otros_gastos: "20", gastos_nota: "gasolina extra" }, def);
  const t = { id: "A", contactoId: "messenger:1", nombre: "C", servicio: "S", municipio: "Gurabo", plomeroId: "luis", estado: "completado", inicio: "2026-10-03T10:00:00-04:00", fee: 19, creado: "2026-10-01T00:00:00Z" };
  const a = { ...t, ...aplicarCierre(t, { ...v.datos, por: "Heileen", registrado: "x" }, 20, "2026-10-03T20:00:00Z") };
  assert.equal(ganancia(a), 138.15);
  const b = { ...t, id: "B", estado: "cobrado", terminadoEn: "2026-10-03T12:00:00-04:00", totalCliente: 148, pagoPlomero: 83.85 };
  const p = panelVentas([a, b], { desde: Date.parse("2026-10-01T04:00:00Z"), hasta: Date.parse("2026-11-01T04:00:00Z") }, (x) => origenDe(x));
  assert.deepEqual(p.sinCierre, ["B"]);
  assert.equal(p.filas.find((f) => f.id === "A").metodo, "ATH Móvil (2 pagos)");
});
