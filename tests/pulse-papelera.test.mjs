import assert from "node:assert/strict";
import { test } from "node:test";

import { agruparLotes, archivosDelLote, nombreTabla, ordenRestaurar, puedeRestaurar, resumenFila, rutaPapelera, tablaValida } from "../lib/pulse/papelera-reglas.ts";

const f = (id, tabla, fila, borradoAt, extra = {}) => ({ id, tabla, fila, borradoAt, borradoPor: "u1", restauradoAt: null, ...extra });

test("agruparLotes: lo borrado junto es un lote y el principal es el padre", () => {
  const t1 = "2026-09-27T20:00:00.000Z";
  const t2 = "2026-09-27T21:00:00.000Z";
  const lotes = agruparLotes([
    f(1, "pulse_activity", { texto: "hola" }, t1),
    f(2, "pulse_items", { name: "Carol Andrews" }, t1),
    f(3, "pulse_items", { name: "Omar Vázquez" }, t1),
    f(4, "leads_tratos", { nombre: "José Luis" }, t2),
  ]);
  assert.equal(lotes.length, 2);
  assert.equal(lotes[0].borradoAt, t2); // más reciente primero
  assert.equal(lotes[1].principal, "2 fichas");
  assert.deepEqual(lotes[1].ejemplos, ["Carol Andrews", "Omar Vázquez"]);
  assert.equal(lotes[1].total, 3);
  assert.equal(lotes[0].principal, "1 lead");
  assert.equal(lotes[0].restaurado, false);
});

test("orden de restauración: padres antes que hijos", () => {
  assert.ok(ordenRestaurar("pulse_boards") < ordenRestaurar("pulse_items"));
  assert.ok(ordenRestaurar("pulse_items") < ordenRestaurar("pulse_activity"));
  assert.ok(ordenRestaurar("leads_tratos") < ordenRestaurar("leads_historial"));
  assert.ok(ordenRestaurar("tabla_nueva") > ordenRestaurar("pulse_activity"));
});

test("puedeRestaurar: admin siempre; quien borró, 15 min", () => {
  const lote = { borradoPor: "u1", borradoAt: "2026-09-27T20:00:00.000Z" };
  assert.equal(puedeRestaurar({ rol: "admin", userId: "x", lote }), true);
  assert.equal(puedeRestaurar({ rol: "miembro", userId: "u1", lote, ahora: new Date("2026-09-27T20:10:00Z") }), true);
  assert.equal(puedeRestaurar({ rol: "miembro", userId: "u1", lote, ahora: new Date("2026-09-27T20:20:00Z") }), false);
  assert.equal(puedeRestaurar({ rol: "editor", userId: "u2", lote, ahora: new Date("2026-09-27T20:01:00Z") }), false);
  assert.equal(puedeRestaurar({ rol: "miembro", userId: "u1", lote: { ...lote, borradoPor: null } }), false);
});

test("resumen, nombres, archivos y rutas", () => {
  assert.equal(resumenFila({ id: "a", name: "Natacha" }), "Natacha");
  assert.equal(resumenFila({ id: "a" }), "a");
  assert.equal(nombreTabla("pulse_items", 1), "ficha");
  assert.equal(nombreTabla("max_items"), "items");
  assert.deepEqual(archivosDelLote([{ tabla: "pulse_files", fila: { storage_path: "b/i/x.pdf" } }, { tabla: "pulse_items", fila: {} }]), ["b/i/x.pdf"]);
  assert.equal(rutaPapelera("b/i/x.pdf", "2026-09-27"), "papelera/2026-09-27/b/i/x.pdf");
  assert.equal(tablaValida("pulse_items"), true);
  assert.equal(tablaValida('pulse_items"; drop table x'), false);
});
