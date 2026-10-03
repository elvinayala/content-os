import { test } from "node:test";
import assert from "node:assert/strict";
import { origenDe, ganancia, panelVentas } from "../dist/ventas-panel.js";

test("quién cerró: lo guardado manda; los viejos se deducen", () => {
  assert.equal(origenDe({ origen: "setter", creado: "x" }), "setter");
  assert.equal(origenDe({ origen: "agente", humanoAntes: true, creado: "x" }), "agente-humano");
  assert.equal(origenDe({ origen: "agente", creado: "x" }), "agente");
  assert.equal(origenDe({ creado: "2026-10-01T10:00:00Z" }, { reservoPorPagina: true }), "web");
  assert.equal(origenDe({ creado: "2026-10-01T10:00:00Z" }, { humanoDesde: "2026-09-30T10:00:00Z" }), "agente-humano");
  assert.equal(origenDe({ creado: "2026-10-01T10:00:00Z" }, { humanoDesde: "2026-10-03T10:00:00Z" }), "agente"); // Heileen habló después
});

test("ganancia de Resuelto: cliente − comisión − piezas del plomero − equipo de Resuelto", () => {
  // R-0001: $129 + $19 + pieza $65 (+20 %) = $226; plomero $83.85 + $71.50
  assert.equal(ganancia({ totalCliente: 226, pagoPlomero: 155.35, materialesCosto: 65 }), 70.65);
  // bomba de $280 que puso Resuelto: $249 + $19 + $336 = $604; plomero $161.85
  assert.equal(ganancia({ totalCliente: 604, pagoPlomero: 161.85, piezasPlomero: 0, materialesCosto: 280 }), 162.15);
});

test("panel: ventas del rango, totales por origen y plomero, agendados aparte", () => {
  const t = (id, o) => ({ id, contactoId: "messenger:1", nombre: "C", servicio: "S", municipio: "Gurabo", territorio: "T3", plomeroId: "edgar", estado: "cobrado", inicio: "2026-10-02T10:00:00-04:00", terminadoEn: "2026-10-02T12:00:00-04:00", fee: 19, manoObra: 129, creado: "2026-10-01T00:00:00Z", fotos: [], ...o });
  const ts = [
    t("A", { totalCliente: 226, pagoPlomero: 155.35, materialesCosto: 65, origen: "agente" }),
    t("B", { estado: "completado", totalCliente: 268, pagoPlomero: 161.85, piezasPlomero: 0, origen: "setter", plomeroId: "luis" }),
    t("C", { estado: "completado", origen: "agente" }),                                    // cerrado sin montos
    t("G", { totalCliente: 0, pagoPlomero: 0, garantiaDe: "A" }),                           // garantía: no es venta
    t("V", { terminadoEn: "2026-09-20T12:00:00-04:00", totalCliente: 500, pagoPlomero: 100 }), // fuera del rango
    t("P", { estado: "agendado", plomeroId: "", terminadoEn: undefined, manoObra: 249 }),
  ];
  const p = panelVentas(ts, { desde: Date.parse("2026-10-01T00:00:00-04:00"), hasta: Date.parse("2026-11-01T00:00:00-04:00") }, (x) => origenDe(x));
  assert.equal(p.kpis.ventas, 3); assert.equal(p.kpis.total, 494); assert.equal(p.kpis.cobrado, 226); assert.equal(p.kpis.porCobrar, 268);
  assert.equal(p.kpis.comisiones, 245.7); assert.equal(p.kpis.ticket, 247);
  assert.deepEqual(p.sinMontos, ["C"]);
  assert.deepEqual(p.porOrigen.map((g) => [g.clave, g.ventas]), [["setter", 1], ["agente", 2]]);
  assert.deepEqual(p.agendados.map((a) => [a.id, a.estimado]), [["P", 268]]); assert.equal(p.kpis.sinPlomero, 1);
});
