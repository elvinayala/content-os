import { test } from "node:test";
import assert from "node:assert/strict";
import { validarDatos, rutaValida, ultimos4, CAMPOS, NOMBRE_DOC } from "../dist/firmas/documento.js";
import { planAlta } from "../dist/alta-automatica.js";

const base = { nombre: "Luis Rivera", telefono: "787-555-0123", municipio: "Caguas", banco: "Banco Popular", titular: "Luis Rivera", tipo_cuenta: "cheques", ruta: "021502011", cuenta: "123 456 789", cuenta2: "123456789" };

test("depósito directo: ruta con dígito verificador, cuenta confirmada y sin el campo de confirmar", () => {
  assert.equal(NOMBRE_DOC.deposito, "Autorización de depósito directo");
  assert.ok(CAMPOS.deposito.some((c) => c.id === "cuenta2"));
  assert.equal(rutaValida("021502011"), true); // Banco Popular de PR
  assert.equal(rutaValida("021502012"), false);
  const r = validarDatos("deposito", base);
  assert.equal(r.ok, true);
  assert.equal(r.datos.cuenta, "123456789");
  assert.equal("cuenta2" in r.datos, false);
  assert.match(validarDatos("deposito", { ...base, ruta: "12345" }).error, /ruta/);
  assert.match(validarDatos("deposito", { ...base, cuenta2: "123456780" }).error, /no son iguales/);
  assert.match(validarDatos("deposito", { ...base, tipo_cuenta: "otra" }).error, /Tipo de cuenta/);
  assert.equal(ultimos4("123456789"), "••••6789");
});

test("firmar el depósito no da de alta a nadie ni manda la bienvenida", () => {
  const p = planAlta({ tipo: "deposito", municipio: "Caguas", firmado: { datos: { municipio: "Caguas" } } }, () => "T3");
  assert.equal(p.activar, false);
});
