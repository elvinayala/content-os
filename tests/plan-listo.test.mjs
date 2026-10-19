import assert from "node:assert/strict";
import { test } from "node:test";

import { emparejarCliente, esPlanListo, negocioDelTexto, textoAlerta } from "../lib/estrategia/plan-listo-reglas.ts";

test("solo el aviso de plan listo, no las piezas sueltas que revisa Leo", () => {
  assert.equal(esPlanListo("PLAN LISTO | Fancy Halo | Repostería fina"), true);
  assert.equal(esPlanListo("*Plan completo* | PG Electrical | todas las fases"), true);
  assert.equal(esPlanListo("Med Spa Infusion: todo listo para arrancar con las 5 fases"), true);
  assert.equal(esPlanListo("Cliente nuevo Quiroplaza, plan para arrancar"), true);
  assert.equal(esPlanListo("Fancy Halo | Repostería fina | Fase 2"), false);
  assert.equal(esPlanListo("F3 | REMARKETING | TT ROOM"), false);
  assert.equal(esPlanListo("SA ELECTRICAL | Fase 3 enfoque Black Friday"), false);
  assert.equal(esPlanListo("PLAN LISTO | X", { esRespuesta: true }), false, "las respuestas en el hilo no cuentan");
});

test("el negocio sale de la primera línea", () => {
  assert.equal(negocioDelTexto("PLAN LISTO | Fancy Halo | Repostería"), "Fancy Halo");
  assert.equal(negocioDelTexto("*Plan completo* | PG Electrical Contractors | todas"), "PG Electrical Contractors");
});

const c = (itemId, nombre, empresa, grupo = "ANÁLISIS Y ESTRATEGIA", extra = {}) => ({ itemId, nombre, empresa, grupo, acuerdo: "3000 x 90 dias", pagoInicial: 1500, servicio: "Marketing", fechaInicio: "2026-10-10", fechaPago: "2026-10-08", estratega: "Daisy Buendia", industria: "Belleza", pueblo: "Bayamón", ...extra });
const clientes = [
  c("1", "Nitza Sanchez", "Fancy Halo By Nixalee", "CLIENTE ACTIVO"),
  c("2", "Pedro Gómez", "PG Electrical Contractors"),
  c("3", "Damaris Rivera", "Med Spa Infusion Med Beauty"),
  c("4", "Steven La Torre", "Sa Electrical service LLC", "CLIENTE ACTIVO"),
];

test("encuentra al cliente en Pulse por el negocio (o el dueño)", () => {
  assert.equal(emparejarCliente("PLAN LISTO | PG Electrical Contractors | todas las fases", clientes).cliente?.itemId, "2");
  assert.equal(emparejarCliente("PLAN LISTO | Fancy Halo | Repostería", clientes).cliente?.itemId, "1");
  assert.equal(emparejarCliente("Plan completo de Damaris Rivera, listo para arrancar", clientes).cliente?.itemId, "3");
  assert.equal(emparejarCliente("PLAN LISTO | Negocio que no existe", clientes).cliente, null);
});

test("la alerta: breve, con dueño, negocio, pago inicial y acuerdo", () => {
  const { cliente, candidatos } = emparejarCliente("PLAN LISTO | PG Electrical Contractors", clientes);
  const t = textoAlerta({ cliente, candidatos, negocio: "PG Electrical Contractors", autor: "Daisy Buendia", texto: "PLAN LISTO | PG Electrical Contractors | F1 a F4 con flyers y videos", archivos: 3, link: "https://slack.test/x" });
  assert.match(t, /^🚀 \*Plan listo para arrancar\* · PG Electrical Contractors/);
  assert.match(t, /Dueño: Pedro Gómez · Bayamón · Belleza/);
  assert.match(t, /Pago inicial: \$1,500 \(8\/oct\) · Acuerdo: 3000 x 90 dias/);
  assert.match(t, /En Pulse: ANÁLISIS Y ESTRATEGIA/);
  assert.match(t, /3 archivos/);
  assert.match(t, /Lo aprueban tú o Carilin/);
  assert.ok(t.split("\n").length <= 10);
  assert.match(textoAlerta({ cliente: null, candidatos: [], negocio: "Nuevo", autor: "Felipe", texto: "PLAN LISTO | Nuevo", archivos: 0, link: null }), /No lo encontré en Pulse/);
});
