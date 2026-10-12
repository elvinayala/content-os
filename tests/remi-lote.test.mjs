import test from "node:test";
import assert from "node:assert/strict";
import { leerCSV, rellenar, armarLote, camposDe, clave } from "../scripts/remi/lote.mjs";

const PLANTILLA = {
  id: "lu-cliente",
  marca: "level-up",
  formato: "9:16",
  titulo: "Video de {{Nombre}}",
  escenas: [
    { tipo: "gancho", dur: 90, lineas: ["*{{Nombre}}*", "{{Servicio}}"] },
    { tipo: "cierre", dur: 60, cta: "{{CTA|Escríbenos}}" },
  ],
};

test("leerCSV: comas, comillas, BOM y filas vacías", () => {
  const f = leerCSV('﻿Nombre,Servicio\n"Ana, la del café","Dijo ""hola"""\n\nLuis,Tenis\n');
  assert.deepEqual(f, [{ Nombre: "Ana, la del café", Servicio: 'Dijo "hola"' }, { Nombre: "Luis", Servicio: "Tenis" }]);
});

test("leerCSV: Excel en español usa punto y coma", () => {
  assert.deepEqual(leerCSV("Nombre;Servicio\r\nSofía;Lentes\r\n"), [{ Nombre: "Sofía", Servicio: "Lentes" }]);
});

test("clave y camposDe ignoran acentos, mayúsculas y espacios", () => {
  assert.equal(clave("Nombre del Cliente"), clave("nombre_del_cliente"));
  assert.deepEqual(camposDe(PLANTILLA).sort(), ["cta", "nombre", "servicio"]);
  assert.deepEqual(camposDe(PLANTILLA, { obligatorios: true }).sort(), ["nombre", "servicio"]);
});

test("rellenar: usa el valor de la fila, el defecto o marca lo que falta", () => {
  const { guion, faltan } = rellenar(PLANTILLA, { nombre: "Ana", SERVICIO: "Café" });
  assert.deepEqual(faltan, []);
  assert.deepEqual(guion.escenas[0].lineas, ["*Ana*", "Café"]);
  assert.equal(guion.escenas[1].cta, "Escríbenos");
  assert.equal(PLANTILLA.escenas[0].lineas[0], "*{{Nombre}}*", "no toca la plantilla");
  assert.deepEqual(rellenar(PLANTILLA, { Nombre: "Ana", Servicio: " " }).faltan, ["Servicio"]);
});

test("armarLote: un guion por fila, ids únicos y errores por fila", () => {
  const filas = leerCSV("Nombre,Servicio\nAna,Café\nLuis,\nAna,Tenis\n");
  const r = armarLote(PLANTILLA, filas);
  assert.deepEqual(r.guiones.map((g) => g.id), ["lu-cliente-ana", "lu-cliente-ana-2"]);
  assert.equal(r.guiones[1].escenas[0].lineas[1], "Tenis");
  assert.deepEqual(r.errores, [{ fila: 2, motivo: "vacío o sin columna: Servicio" }]);
});

test("armarLote: tope, columna de id y columnas que sobran", () => {
  const filas = [{ Cliente: "Café Ana", Nombre: "Ana", Servicio: "Café", Notas: "x" }];
  const r = armarLote(PLANTILLA, filas, { idColumna: "cliente" });
  assert.equal(r.guiones[0].id, "lu-cliente-cafe-ana");
  assert.deepEqual(r.columnasSobran, ["Cliente", "Notas"]);
  assert.deepEqual(r.camposSinColumna, [], "{{CTA|…}} tiene defecto: no falta");
  assert.equal(armarLote(PLANTILLA, Array(51).fill(filas[0])).errores[0].motivo.includes("tope es 50"), true);
  assert.equal(armarLote({ id: "x" }, filas).errores[0].motivo, "la plantilla no es un guion (falta escenas)");
});
