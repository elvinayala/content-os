import assert from "node:assert/strict";
import test from "node:test";

import { consultar, cumple } from "../lib/pulse/preguntar.ts";

const fila = (id, nombre, grupo, campos) => ({ id, nombre, tablero: "level-up-media", tableroNombre: "LEVEL UP MEDIA", grupo, campos });
const FILAS = [
  fila("1", "Solar PR", "OFFBOARDED", { Industria: "Energía Solar", "Razón de Baja": "Presupuesto", "Presupuesto mensual ($)": 1500, "Fecha de Inicio": "2026-03-01" }),
  fila("2", "Sol y Luz", "OFFBOARDED", { Industria: "Energía Solar", "Razón de Baja": "Resultados", "Presupuesto mensual ($)": 800, "Fecha de Inicio": "2026-05-10" }),
  fila("3", "Clínica Ana", "CLIENTE ACTIVO", { Industria: "Salud", "Razón de Baja": null, "Presupuesto mensual ($)": 2500, Personas: "Jessica, Carilin" }),
];

test("es / contiene sin acentos ni mayúsculas", () => {
  const r = consultar(FILAS, { condiciones: [{ columna: "industria", op: "contiene", valor: "solar" }, { columna: "razon de baja", op: "es", valor: "presupuesto" }] });
  assert.equal(r.total, 1);
  assert.equal(r.items[0].nombre, "Solar PR");
  assert.deepEqual(Object.keys(r.items[0].campos), ["industria", "razon de baja"]);
});

test("grupos, números y fechas", () => {
  assert.equal(consultar(FILAS, { grupos: ["offboard"] }).total, 2);
  assert.equal(consultar(FILAS, { excluir_grupos: ["offboard"] }).total, 1);
  assert.equal(consultar(FILAS, { condiciones: [{ columna: "Presupuesto mensual ($)", op: "mayor", valor: 1000 }] }).total, 2);
  assert.equal(consultar(FILAS, { condiciones: [{ columna: "Fecha de Inicio", op: "entre", valor: "2026-04-01", valor2: "2026-06-30" }] }).items[0].id, "2");
  assert.equal(consultar(FILAS, { condiciones: [{ columna: "Razón de Baja", op: "vacio" }] }).total, 1);
});

test("multi-valor y conteo", () => {
  assert.ok(cumple(FILAS[2], { columna: "Personas", op: "es", valor: "carilin" }));
  const r = consultar(FILAS, { contar_por: "Industria" });
  assert.deepEqual(r.conteo, { "Energía Solar": 2, Salud: 1 });
});

test("avisa columnas que no existen y respeta el límite", () => {
  const r = consultar(FILAS, { condiciones: [{ columna: "Color favorito", op: "no_vacio" }], limite: 1 });
  assert.equal(r.total, 0);
  assert.match(r.avisos[0], /Color favorito/);
  assert.equal(consultar(FILAS, { limite: 1 }).items.length, 1);
});
