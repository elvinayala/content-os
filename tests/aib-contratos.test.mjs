import assert from "node:assert/strict";
import { test } from "node:test";

import { hojas, pareceNumeroSensible, textoCostos, validarDatos, validarOferta } from "../lib/aib-contratos/documento.ts";

const oferta = { nombre: "María Rivera", telefono: "(787) 555-1234", email: "", negocio: "Spa Rivera", servicio: "Agente de ventas por WhatsApp\nAgente de voz", total: "$3,500", hoy: "1500", mensual: "497", nota: "" };

test("el equipo llena a mano: nombre, teléfono, lo que se ofreció y el costo", () => {
  const r = validarOferta(oferta);
  assert.equal(r.ok, true);
  assert.deepEqual(r.v.costos, { total: 3500, hoy: 1500, mensual: 497, nota: "", cuotas: [] });
  assert.equal(r.v.cliente.telefono, "7875551234");
  assert.equal(validarOferta({ ...oferta, telefono: "555" }).ok, false);
  assert.equal(validarOferta({ ...oferta, servicio: "" }).ok, false);
  assert.equal(validarOferta({ ...oferta, total: "" }).ok, false);
  assert.match(validarOferta({ ...oferta, hoy: "5000" }).error, /no pasar del total/);
  assert.equal(textoCostos(r.v.costos), "Total: $3,500.00 · Pago de hoy: $1,500.00 · Mensualidad: $497.00 al mes");
});

const cliente = { nombre: "María Rivera", email: "maria@spa.com", telefono: "7875551234", negocio: "", metodo: "credito", titular: "María Rivera", tarjeta: "visa", ultimos4: "4242", banco: "", tipoCuenta: "", calle: "Calle 1", ciudad: "Mayagüez", estado: "PR", postal: "00680" };

test("nunca acepta el número completo de la tarjeta ni el CVV", () => {
  assert.equal(validarDatos(cliente).ok, true);
  assert.match(validarDatos({ ...cliente, ultimos4: "4242424242424242" }).error, /seguridad/);
  assert.match(validarDatos({ ...cliente, calle: "4242 4242 4242 4242" }).error, /seguridad/);
  assert.equal(validarDatos({ ...cliente, ultimos4: "424" }).ok, false);
  assert.equal(pareceNumeroSensible("787-555-1234"), false);
});

test("tarjeta y ACH piden facturación; ATH no", () => {
  assert.match(validarDatos({ ...cliente, postal: "" }).error, /postal/);
  const ath = validarDatos({ ...cliente, metodo: "ath", calle: "", ciudad: "", postal: "" });
  assert.equal(ath.ok, true);
  assert.equal(ath.v.ultimos4, "", "los datos de tarjeta se borran si no paga con tarjeta");
  assert.match(validarDatos({ ...cliente, metodo: "bitcoin" }).error, /método/);
  assert.match(validarDatos({ ...cliente, email: "x" }).error, /correo/);
});

test("las hojas llevan los datos, las 14 cláusulas y el resumen con lo ofrecido", () => {
  const o = validarOferta(oferta).v, hs = hojas(o, validarDatos(cliente).v, "2026-10-09T17:00:00Z");
  assert.equal(hs.length, 6);
  const todo = JSON.stringify(hs);
  for (let n = 1; n <= 14; n++) assert.ok(todo.includes(`"${n}. `), `falta la cláusula ${n}`);
  assert.ok(todo.includes("•••• 4242") && !todo.includes("CVV:"));
  assert.ok(todo.includes("9 de octubre de 2026"));
  assert.ok(todo.includes("Agente de voz") && todo.includes("Pago de servicios") && todo.includes("$1,500.00"));
  assert.equal(hs.at(-1).bloques.at(-1).t, "firmas");
  assert.ok(hs[0].bloques.find((b) => b.t === "opciones").opciones.find((x) => x.marcado).texto.startsWith("Tarjeta de crédito"));
});

test("costo total más cuotas: tienen que cuadrar con el total y salen con su fecha", async () => {
  const conCuotas = { ...oferta, mensual: "", cuotas: JSON.stringify([{ monto: "1000", fecha: "2026-12-15" }, { monto: "1,000", fecha: "2026-11-15" }, { monto: "", fecha: "" }]) };
  const r = validarOferta(conCuotas);
  assert.equal(r.ok, true);
  assert.deepEqual(r.v.costos.cuotas, [{ monto: 1000, fecha: "2026-11-15" }, { monto: 1000, fecha: "2026-12-15" }]);
  assert.equal(textoCostos(r.v.costos), "Total: $3,500.00 · Pago de hoy: $1,500.00 · 2 cuotas: $1,000.00 el 15 de noviembre de 2026, $1,000.00 el 15 de diciembre de 2026");
  assert.match(validarOferta({ ...conCuotas, total: "4000" }).error, /suman \$3,500.00/);
  assert.match(validarOferta({ ...conCuotas, hoy: "" }).error, /pago de hoy/);
  assert.match(validarOferta({ ...oferta, cuotas: JSON.stringify([{ monto: "500" }]) }).error, /fecha de la cuota 1/);
  const h1 = hojas(r.v, validarDatos(cliente).v, "2026-10-09T17:00:00Z")[0];
  const filas = h1.bloques.filter((b) => b.t === "datos").flatMap((b) => b.filas);
  assert.deepEqual(filas.find(([k]) => k === "Cuota 2 de 2"), ["Cuota 2 de 2", "$1,000.00 · 15 de diciembre de 2026"]);
  assert.equal(h1.bloques.at(-1).t, "firmaCliente", "firma y fecha debajo de la autorización");
});
