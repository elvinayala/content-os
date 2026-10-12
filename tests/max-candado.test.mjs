import assert from "node:assert/strict";
import { test } from "node:test";

import { cambiaGasto, conCandado, CandadoError, verificarAprobacion } from "../scripts/meta-ads/candado.mjs";

const aprobadoEscalar = { id: 41, tipo: "publicar", estado: "aprobado", decidido_por: "elvin", datos: { marca: "levelup", accion: "escalar", adsetId: "123", pct: 15 } };
const aprobadoActivar = { id: 42, tipo: "publicar", estado: "aprobado", decidido_por: "elvin", datos: { marca: "levelup", ids: [{ id: "900", tipo: "campana" }] } };

test("cambiaGasto: presupuesto y prender gastan; leer, pausar y renombrar no", () => {
  assert.equal(cambiaGasto("POST", { daily_budget: 2000 }), true);
  assert.equal(cambiaGasto("POST", { lifetime_budget: 50000 }), true);
  assert.equal(cambiaGasto("POST", { bid_amount: 300 }), true);
  assert.equal(cambiaGasto("POST", { status: "ACTIVE" }), true);
  assert.equal(cambiaGasto("POST", { status: "PAUSED" }), false);
  assert.equal(cambiaGasto("GET", { daily_budget: 1 }), false);
  assert.equal(cambiaGasto("POST", { name: "nuevo nombre" }), false);
});

test("verificarAprobacion: escalar solo con el ítem exacto", () => {
  const base = { marca: "levelup", accion: "escalar", objetivo: "123", pct: 15 };
  assert.equal(verificarAprobacion(aprobadoEscalar, base).ok, true);
  assert.equal(verificarAprobacion(aprobadoEscalar, { ...base, pct: 10 }).ok, true);
  assert.match(verificarAprobacion(aprobadoEscalar, { ...base, pct: 20 }).motivo, /\+15/);
  assert.match(verificarAprobacion(aprobadoEscalar, { ...base, objetivo: "999" }).motivo, /otro conjunto/);
  assert.match(verificarAprobacion(aprobadoEscalar, { ...base, marca: "resuelto" }).motivo, /otra marca/);
  assert.match(verificarAprobacion({ ...aprobadoEscalar, estado: "esperando" }, base).motivo, /no aprobada/);
  assert.match(verificarAprobacion({ ...aprobadoEscalar, estado: "ejecutado" }, base).motivo, /no aprobada/);
  assert.match(verificarAprobacion({ ...aprobadoEscalar, decidido_por: "jessica" }, base).motivo, /solo él autoriza gasto/);
  assert.match(verificarAprobacion(aprobadoActivar, base).motivo, /no autoriza escalar/);
  assert.match(verificarAprobacion(undefined, base).motivo, /no hay/);
});

test("verificarAprobacion: prender solo lo que la aprobación incluye, y nunca con una de escalar", () => {
  const base = { marca: "levelup", accion: "activar", objetivo: "900" };
  assert.equal(verificarAprobacion(aprobadoActivar, base).ok, true);
  assert.match(verificarAprobacion(aprobadoActivar, { ...base, objetivo: "901" }).motivo, /no incluye/);
  assert.match(verificarAprobacion(aprobadoEscalar, base).motivo, /para escalar/);
});

function clienteFalso() {
  const llamadas = [];
  return { llamadas, graph: async (method, path, params) => { llamadas.push({ method, path, params }); return { ok: true }; } };
}

test("conCandado: sin aprobación, subir presupuesto NO llega a Meta", async () => {
  const c = clienteFalso();
  const g = conCandado(c, { marca: "levelup", obtenerItem: async () => aprobadoEscalar });
  await assert.rejects(() => g.graph("POST", "/123", { daily_budget: 2300 }), CandadoError);
  await assert.rejects(() => g.graph("POST", "/900", { status: "ACTIVE" }), CandadoError);
  assert.equal(c.llamadas.length, 0);
});

test("conCandado: con el ítem aprobado exacto, una sola llamada a Meta", async () => {
  const c = clienteFalso();
  const pedidos = [];
  const g = conCandado(c, { marca: "levelup", obtenerItem: async (id) => (pedidos.push(id), id === 41 ? aprobadoEscalar : undefined) });
  await g.graph("POST", "/123", { daily_budget: 2300 }, { item: 41, accion: "escalar", objetivo: "123", pct: 15 });
  assert.deepEqual(c.llamadas, [{ method: "POST", path: "/123", params: { daily_budget: 2300 } }]);
  assert.deepEqual(pedidos, [41]); // el ítem se trae del servidor, no se confía en lo que diga el agente
});

test("conCandado: un ítem de otra marca, otro conjunto o mayor % no deja pasar", async () => {
  const c = clienteFalso();
  const g = conCandado(c, { marca: "levelup", obtenerItem: async () => aprobadoEscalar });
  await assert.rejects(() => g.graph("POST", "/999", { daily_budget: 1 }, { item: 41, accion: "escalar", objetivo: "999", pct: 15 }), /otro conjunto/);
  await assert.rejects(() => g.graph("POST", "/123", { daily_budget: 1 }, { item: 41, accion: "escalar", objetivo: "123", pct: 20 }), /\+15/);
  assert.equal(c.llamadas.length, 0);
});

test("conCandado: leer y pausar pasan sin aprobación (no gastan)", async () => {
  const c = clienteFalso();
  const g = conCandado(c, { marca: "levelup", obtenerItem: async () => undefined });
  await g.graph("GET", "/act_1/insights", { fields: "spend" });
  await g.graph("POST", "/123", { status: "PAUSED" });
  assert.equal(c.llamadas.length, 2);
});

test("cambiaGasto: montar EN PAUSA no gasta (estrategia, crear, plantilla); crear prendido o sin estado sí", () => {
  assert.equal(cambiaGasto("POST", { name: "F1", status: "PAUSED", daily_budget: 1500 }, "/act_1/adsets"), false);
  assert.equal(cambiaGasto("POST", { name: "C", status: "PAUSED", objective: "OUTCOME_SALES" }, "/act_1/campaigns"), false);
  assert.equal(cambiaGasto("POST", { name: "A", status: "PAUSED" }, "/act_1/ads"), false);
  assert.equal(cambiaGasto("POST", { deep_copy: false, status_option: "PAUSED" }, "/123/copies"), false);
  assert.equal(cambiaGasto("POST", { name: "F1", status: "ACTIVE", daily_budget: 1500 }, "/act_1/adsets"), true);
  assert.equal(cambiaGasto("POST", { name: "F1", daily_budget: 1500 }, "/act_1/adsets"), true);
  assert.equal(cambiaGasto("POST", { deep_copy: false, status_option: "ACTIVE" }, "/123/copies"), true);
  // Cambiar el presupuesto de algo que YA existe es escalar: siempre con aprobación, aunque esté en pausa.
  assert.equal(cambiaGasto("POST", { daily_budget: 2000 }, "/123"), true);
  assert.equal(cambiaGasto("POST", { status: "PAUSED" }, "/123"), false);
});

test("conCandado: montar en pausa llega a Meta sin aprobación; prender no", async () => {
  const c = clienteFalso();
  const g = conCandado(c, { marca: "levelup", obtenerItem: async () => undefined });
  await g.graph("POST", "/act_1/adsets", { status: "PAUSED", daily_budget: 1500 });
  await g.graph("POST", "/act_1/campaigns", { status: "PAUSED" });
  assert.equal(c.llamadas.length, 2);
  await assert.rejects(() => g.graph("POST", "/act_1/adsets", { status: "ACTIVE", daily_budget: 1500 }), CandadoError);
  assert.equal(c.llamadas.length, 2);
});

test("solo Elvin autoriza gasto: una aprobación de Carilin (o de Jessica) no sirve para prender ni escalar", () => {
  const deCarilin = { ...aprobadoEscalar, decidido_por: "carilin" };
  assert.match(verificarAprobacion(deCarilin, { marca: "levelup", accion: "escalar", objetivo: "123", pct: 15 }).motivo, /solo él autoriza gasto/);
  const activarCarilin = { ...aprobadoActivar, decidido_por: "carilin" };
  assert.match(verificarAprobacion(activarCarilin, { marca: "levelup", accion: "activar", objetivo: "900" }).motivo, /solo él autoriza gasto/);
});
