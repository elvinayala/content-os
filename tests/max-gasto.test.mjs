import assert from "node:assert/strict";
import { test } from "node:test";

import { dentroDelTope, diaPR, gastoHoy, gastoSemana, lunesPR, MODELO_BARATO, MODELO_PLAN, modeloParaSlack, modeloParaTelegram, registrarGasto } from "../scripts/max-gasto.mjs";

test("modelo: Opus para planear/investigar/producir, el barato para mensajes", () => {
  assert.equal(MODELO_PLAN, "claude-opus-5-5");
  assert.equal(MODELO_BARATO, "claude-haiku-4-5-20251001");
  assert.equal(modeloParaSlack("[Onboarding nuevo · cliente x · fuente fathom]\n…"), MODELO_PLAN);
  assert.equal(modeloParaSlack("[Slack cliente · cliente x · canal C1 · hilo 1.2 · de Iván]\n¿Cuándo salen los anuncios?"), MODELO_BARATO);
  assert.equal(modeloParaSlack("[Max aprobación · evento rechazado · item #3 · cliente x · tipo plan · por Carilin]\n…"), MODELO_PLAN);
  assert.equal(modeloParaSlack("[Max aprobación · evento rechazado · item #4 · cliente x · tipo mensaje · por Elvin]\n…"), MODELO_BARATO);
  assert.equal(modeloParaSlack("[Max aprobación · evento montar · item #5 · cliente x · tipo campana · por Elvin]\n…"), MODELO_PLAN);
  assert.equal(modeloParaSlack("[Max aprobación · evento enviado · item #6 · cliente x · tipo plan]\n…"), MODELO_PLAN);
  assert.equal(modeloParaSlack("[Max aprobación · evento enviado · item #7 · cliente x · tipo mensaje]\n…"), MODELO_BARATO);
  assert.equal(modeloParaSlack("[Max aprobación · evento publicar · item #8 · cliente x · tipo publicar · por Carilin]\n…"), MODELO_BARATO);
  assert.equal(modeloParaSlack("[Max canal · de Jessica · hilo 1.2 · canal C]\n" + "resumen ".repeat(80)), MODELO_PLAN);
  assert.equal(modeloParaSlack("[Max canal · de Carilin · hilo 1.2 · canal C]\n¿ya está lo de Biowest?"), MODELO_BARATO);
  assert.equal(modeloParaTelegram("hazme la estrategia de Resuelto"), MODELO_PLAN);
  assert.equal(modeloParaTelegram("¿cómo vas?"), MODELO_BARATO);
});

test("topes: $10 al día y $25 a la semana (lunes a domingo, hora de PR)", () => {
  const jueves = new Date("2026-09-24T20:00:00Z"); // 4 PM en PR
  assert.equal(diaPR(jueves), "2026-09-24");
  assert.equal(lunesPR(jueves), "2026-09-21");
  assert.equal(diaPR(new Date("2026-09-25T02:30:00Z")), "2026-09-24", "10:30 PM del jueves en PR sigue siendo jueves");

  let g = registrarGasto({}, 4, jueves);
  g = registrarGasto(g, 3.5, jueves);
  assert.equal(gastoHoy(g, jueves), 7.5);
  assert.equal(dentroDelTope(g, jueves).ok, true);
  g = registrarGasto(g, 2.6, jueves);
  assert.equal(dentroDelTope(g, jueves).ok, false, "pasó de $10 hoy");

  const semana = { "2026-09-21": 9, "2026-09-22": 9, "2026-09-23": 7.5, "2026-09-20": 50 };
  assert.equal(gastoSemana(semana, jueves), 25.5, "el domingo 20 es de la semana anterior");
  const r = dentroDelTope(semana, jueves);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /semanal/);
  assert.equal(dentroDelTope(semana, new Date("2026-09-28T15:00:00Z")).ok, true, "el lunes arranca la semana nueva");
});
