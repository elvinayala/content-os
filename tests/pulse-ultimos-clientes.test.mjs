import assert from "node:assert/strict";
import { test } from "node:test";

import { nichoDe, cuentaComoNuevo, detalleDePago, diaDeSlack, esAltoValor, montoDePago } from "../lib/pulse/ultimos-clientes.ts";

test("montoDePago lee como escriben los closers", () => {
  assert.equal(montoDePago("$3.000 usd por 90 dias"), 3000);
  assert.equal(montoDePago("$3,500 usd por 90 días"), 3500);
  assert.equal(montoDePago("$1.500,50"), 1500.5);
  assert.equal(montoDePago("$997.00"), 997);
  assert.equal(montoDePago("2500 USD"), 2500);
  assert.equal(montoDePago("Pago dividido en 3 cuotas de $1.000 USD cada 30 días"), 3000);
  assert.equal(montoDePago("pendiente"), undefined);
  assert.equal(montoDePago(undefined), undefined);
});

test("detalleDePago junta plan y duración", () => {
  assert.equal(detalleDePago("$3.000 usd por 90 dias", "Done For you"), "Done For you · 90 días");
  assert.equal(detalleDePago("3 cuotas de $1.000 cada 30 días", undefined), "3 cuotas de $1.000");
  assert.equal(detalleDePago(undefined, undefined), undefined);
});

test("diaDeSlack saca el día del permalink en hora de PR", () => {
  assert.equal(diaDeSlack("venta: https://x.slack.com/archives/C08/p1790104735022819?thread_ts=1"), "2026-09-22");
  assert.equal(diaDeSlack("1790104735.022819"), "2026-09-22");
  assert.equal(diaDeSlack("sin link"), undefined);
});

test("alto valor y quién cuenta como nuevo", () => {
  assert.equal(esAltoValor({ monto: 3000 }), true);
  assert.equal(esAltoValor({ monto: 1500 }), false);
  assert.equal(esAltoValor({}), false);
  assert.equal(cuentaComoNuevo("Joshua Díaz (copy)", "MARKETING"), false);
  assert.equal(cuentaComoNuevo("Joshua Díaz", "OFFBOARDED"), false);
  assert.equal(cuentaComoNuevo("Carol N. Andrews", "ONBOARDING & SETUP"), true);
});

test("nichoDe: 'Otro' cede al formulario", () => {
  assert.equal(nichoDe("Otro", "Medicina estética"), "Medicina estética");
  assert.equal(nichoDe("Otro", undefined), "Otro");
  assert.equal(nichoDe("Restaurante", "Comida"), "Restaurante");
  assert.equal(nichoDe(undefined, undefined), undefined);
});
