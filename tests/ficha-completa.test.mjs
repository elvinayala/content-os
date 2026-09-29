import assert from "node:assert/strict";
import { test } from "node:test";

import { faltantesFicha, listaHumana } from "../lib/desempeno/ficha-completa.ts";

const llena = { fotoPath: "ritmo/u/foto.jpg", telefono: "7875551234", ciudad: "San Juan", pais: "PR", documentoNumero: "123", contactoEmergencia: "Mamá 787…" };

test("ficha completa no pide nada; sin ficha pide la ficha", () => {
  assert.deepEqual(faltantesFicha(llena, { identificacion: 1, contrato: 1 }), []);
  assert.deepEqual(faltantesFicha(null, { identificacion: 0, contrato: 0 }), ["ficha"]);
});

test("dice exactamente qué falta", () => {
  assert.deepEqual(faltantesFicha({ ...llena, fotoPath: null, contactoEmergencia: "  " }, { identificacion: 1, contrato: 0 }), ["foto", "contacto de emergencia", "contrato firmado"]);
  assert.deepEqual(faltantesFicha({ ...llena, pais: null }, { identificacion: 1, contrato: 1 }), ["ciudad y país"]);
  assert.equal(listaHumana(["foto", "teléfono", "contrato firmado"]), "foto, teléfono y contrato firmado");
  assert.equal(listaHumana(["foto"]), "foto");
});
