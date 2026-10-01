import assert from "node:assert/strict";
import { test } from "node:test";

import { reporteDelDia, textoReporte } from "../lib/desempeno/reporte-dia.ts";

const p = (nombre, estado, extra = {}) => ({ nombre, estado, minutosTarde: 0, sigueAbierta: false, almuerzoMin: null, bloqueos: null, ...extra });

test("reporte: todo normal", () => {
  const r = reporteDelDia([p("Ana", "a_tiempo"), p("Beto", "trabajando"), p("Caro", "libre")], { manualPendientes: 0, redesNuevas: [] });
  assert.equal(r.normal, true);
  assert.equal(r.resumen, "2 de 2 marcaron entrada");
  assert.match(textoReporte(r, "2026-09-30", "https://x"), /Todo en normalidad/);
});

test("reporte: alertas con nombres, la grave primero", () => {
  const r = reporteDelDia(
    [p("Ana", "ausente"), p("Beto", "tarde", { minutosTarde: 84 }), p("Caro", "a_tiempo", { almuerzoMin: 80, bloqueos: "espero acceso a Meta" }), p("Dani", "trabajando", { sigueAbierta: true })],
    { manualPendientes: 2, redesNuevas: ["Eva"], rachas: [{ nombre: "Fito", dias: 4, motivo: "sin KPIs o en 0" }] },
  );
  assert.ok(r.alertas.some((a) => a.tipo === "racha" && a.grave && a.detalle.includes("Fito (4 días")));
  assert.equal(r.normal, false);
  assert.equal(r.alertas[0].tipo, "sin-marcar");
  assert.equal(r.alertas[0].detalle, "Ana");
  assert.ok(r.alertas.some((a) => a.tipo === "tarde" && a.detalle.includes("Beto (84 min)")));
  assert.ok(r.alertas.some((a) => a.tipo === "almuerzo" && a.detalle.includes("Caro (80 min)")));
  assert.ok(r.alertas.some((a) => a.tipo === "bloqueo" && a.detalle.includes("espero acceso")));
  assert.ok(r.alertas.some((a) => a.tipo === "abierta"));
  assert.ok(r.alertas.some((a) => a.tipo === "manual" && a.titulo.startsWith("2 ponches")));
  assert.ok(r.alertas.some((a) => a.tipo === "red" && a.detalle === "Eva"));
  assert.equal(r.resumen, "3 de 4 marcaron entrada · 1 tarde");
  assert.match(textoReporte(r, "2026-09-30", "https://x"), /Para verificar/);
});
