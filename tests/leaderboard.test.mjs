import assert from "node:assert/strict";
import { test } from "node:test";

import { armarCloser, armarSetter, dinero, mesPR } from "../lib/leaderboard/reglas.ts";

// Ejemplo de junio que mandó Aure (#51): New Sales $37,834 + Paying Off Debt $42,723 = Totals $80,557.
const csv = (filas) => filas.map((f) => [...f]);
const hojaJunio = () =>
  csv([
    ["", "New Sales", "$37,834.00"],
    ["", "Paying Off Debt", "$42,723.00"],
    ["", "Totals", "$80,557.00"],
    [],
    ["", "Closer", "Total recaudado por Closer", "Comisión", "Bonos"],
    ["", "Carilin Sofía", "$19,994.00", "$1.00", ""],
    ["", "Carilin Sofía PDC", "$9,729.00", "$1.00", ""],
    ["", "Carilin Sofía BORI", "$0.00", "$0.00", ""],
    ["", "Laura Bernal", "$12,000.00", "", ""],
    ["", "Laura Bernal PDC", "$0.00", "", ""],
    ["", "Juan David Ramirez", "$8,550.00", "", ""],
    ["", "Juan David PDC", "$3,000.00", "", ""],
    ["", "Juan David BORI", "$996.00", "", ""],
    ["", "Daren Rivera", "$0.00", "", ""],
    ["", "Roger Arteaga", "$14,500.00", "", ""],
    ["", "Roger Arteaga PDC", "$0.00", "", ""],
    ["", "Roger Arteaga BORI", "$249.00", "", ""],
    ["", "Valentina Contreras", "$1,500.00", "", ""],
    ["", "Valentina Contreras PDC", "$2,250.00", "", ""],
    ["", "Valentina PDC 10%", "$0.00", "", ""],
    ["", "Valentina - Renovación", "$0.00", "", ""],
    ["", "Valentina BORI", "$39.00", "", ""],
    ["", "Aurenny Lopez", "$0.00", "", ""],
    ["", "Aurenny PDC", "$0.00", "", ""],
    ["", "Inactive Closer PDC", "$0.00", "", ""],
    ["", "Totales", "$72,807.00", "", ""],
    [],
    ["", "Setter", "Total recaudado por setter", "Comisión", "Bonos"],
    ["", "Ana Cecilio", "$29,249.00", "", ""],
    ["", "Dilan Torres", "$1,000.00", "", ""],
    ["", "Carilin Sofía", "$750.00", "", ""],
    ["", "Luis Fernandez", "$0.00", "", ""],
    ["", "Joaquin La Valle", "", "", ""],
    ["", "Inactive Setter", "$6,938.00", "", ""],
    ["", "Totales", "$37,937.00", "", ""],
  ]);

test("dinero de la hoja", () => {
  assert.equal(dinero("$14,749.00"), 14749);
  assert.equal(dinero("$0.00"), 0);
  assert.equal(dinero(""), null);
  assert.equal(dinero("Closer"), null);
});

test("closer: podio de venta nueva y abajo pago de cuota, como el ejemplo de junio", () => {
  const r = armarCloser(hojaJunio());
  assert.deepEqual(r.errores, []);
  assert.equal(r.total, 80557);
  assert.deepEqual(r.podio.map((p) => [p.nombre, p.monto]), [
    ["Roger Arteaga", 14749], // 14,500 + BORI 249
    ["Laura Bernal", 12000],
    ["CLOSER INACTIVOS", 11085], // Juan David 8,550 + 996 · Valentina 1,500 + 39
  ]);
  assert.deepEqual(r.abajo.map((p) => [p.nombre, p.monto]), [
    ["Carilin Sofía", 29723],
    ["Renovación & Otros", 13000],
  ]);
});

test("closer: si algo no cuadra, no hay imagen", () => {
  const h = hojaJunio();
  h[0][2] = "$38,000.00"; // New Sales distinto
  const r = armarCloser(h);
  assert.ok(r.errores.some((e) => e.includes("no da Totals")));
  assert.ok(r.errores.some((e) => e.includes("parte de arriba")));

  const h2 = hojaJunio();
  h2.splice(9, 0, ["", "Pedro Nuevo", "$500.00", "", ""]); // closer nuevo: sin foto y 4.º con venta nueva
  const r2 = armarCloser(h2);
  assert.ok(r2.errores.length > 0);
});

test("setter: directo de la columna, ordenado, inactivos como categoría, sin inventar montos", () => {
  const r = armarSetter(hojaJunio());
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.podio.map((p) => [p.nombre, p.monto]), [
    ["Ana Cecilio", 29249],
    ["SETTER INACTIVOS", 6938],
    ["Dilan Torres", 1000],
  ]);
  assert.deepEqual(r.abajo.map((p) => [p.nombre, p.monto]), [
    ["Carilin Sofía", 750],
    ["Luis Fernandez", null],
    ["Joaquin La Valle", null],
  ]);
});

test("setter: nombre nuevo sin foto frena el envío", () => {
  const h = hojaJunio();
  h.splice(h.length - 1, 0, ["", "Santiago Villarreal", "$100.00", "", ""]);
  h[h.length - 1][2] = "$38,037.00";
  const r = armarSetter(h);
  assert.ok(r.errores.some((e) => e.includes("Santiago Villarreal")));
});

test("mes en PR", () => {
  assert.equal(mesPR(new Date("2026-10-01T03:00:00Z")), "SEPTEMBER"); // 11 PM del 30/sep en PR
});
