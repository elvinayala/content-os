// node --test tests/contacto-plomero.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const { tieneContactoPersonal: t } = await import("../dist/contacto-plomero.js");

test("bloquea teléfonos, wa.me y @usuarios", () => {
  for (const m of ["llámame al 787-374-4450", "mi cel 7873744450", "(787) 374 4450", "374-4450", "wa.me/17873744450", "búscame @edgar_plomero"]) assert.equal(t(m), true, m);
});
test("deja pasar mensajes normales", () => {
  for (const m of ["Voy llegando en 10 minutos", "Te escribí por WhatsApp ayer", "llego @ la 1", "La mezcladora cuesta $65", "Estoy en la casa M5, calle Gema", "llego 1:30 pm"]) assert.equal(t(m), false, m);
});

const { mismoTelefono } = await import("../dist/proveedores.js");
test("el plomero entra con su número de 10 dígitos aunque el registro tenga el 1", () => {
  assert.equal(mismoTelefono("17873744450", "7873744450"), true);
  assert.equal(mismoTelefono("17873744450", "+1 (787) 374-4450"), true);
  assert.equal(mismoTelefono("17873744450", "7873744451"), false);
  assert.equal(mismoTelefono("", ""), false);
});
