import assert from "node:assert/strict";
import test from "node:test";

import { errorDe, PREGUNTAS, texto, validar } from "../lib/onboarding/level-up.ts";

const p = (id) => PREGUNTAS.find((x) => x.id === id);
const completas = {
  nombre: "María Rivera", telefono: "787 555 1234", email: "maria@negocio.com", negocio: "Solar Boricua", industria: "Solar",
  pueblo: "Bayamón", oferta: "Placas", precios: "$5,000", diferenciador: "Garantía", tipoCliente: "A personas (B2C)",
  edad: ["28 a 40"], zonas: ["Área Metro"], meta: "Más ventas", presupuesto: "600", cuentaAds: "No",
};

test("un formulario completo pasa", () => assert.deepEqual(validar(completas), {}));

test("faltan requeridas", () => {
  const e = validar({});
  assert.ok(e.nombre && e.email && e.industria && e.presupuesto);
  assert.equal(e.competencia, undefined);
});

test("valida e-mail, teléfono, monto y opciones", () => {
  assert.ok(errorDe(p("email"), { email: "maria@" }));
  assert.equal(errorDe(p("telefono"), { telefono: "(787) 555-1234" }), null);
  assert.ok(errorDe(p("telefono"), { telefono: "555-1234" }));
  assert.equal(errorDe(p("presupuesto"), { presupuesto: "$1,200" }), null);
  assert.ok(errorDe(p("presupuesto"), { presupuesto: "mil" }));
  assert.ok(errorDe(p("industria"), { industria: "Inventada" }));
  assert.equal(errorDe(p("industria"), { industria: "Otra: Veterinaria" }), null);
  assert.ok(errorDe(p("industria"), { industria: "Otra:  " }));
  assert.ok(errorDe(p("zonas"), { zonas: ["Marte"] }));
});

test("el ID de cuenta solo se pide si dijo que sí tiene", () => {
  assert.equal(errorDe(p("idCuenta"), { cuentaAds: "No", idCuenta: "abc" }), null);
});

test("texto de redes y listas", () => {
  assert.equal(texto({ Instagram: "@solar", Web: " " }), "Instagram: @solar");
  assert.equal(texto(["Norte", "Sur"]), "Norte, Sur");
});
