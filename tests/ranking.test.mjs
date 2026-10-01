import assert from "node:assert/strict";
import { test } from "node:test";

import { diaBajo, rachaBaja, rankingMes, textoRankingMes } from "../lib/desempeno/ranking.ts";

const dia = (fecha, estado, extra = {}) => ({ fecha, estado, puntaje: estado === "ausente" ? 0 : estado === "libre" ? null : 100, minutosTarde: 0, almuerzoMin: null, reporto: false, datos: {}, ...extra });
const K = [{ id: "campanas", nombre: "Campañas realizadas" }];

test("día bajo: sin marcar, muy tarde o sin KPIs", () => {
  assert.equal(diaBajo(dia("2026-09-28", "ausente"), true), true);
  assert.equal(diaBajo(dia("2026-09-28", "tarde", { minutosTarde: 45, reporto: true, datos: { campanas: 2 } }), true), true);
  assert.equal(diaBajo(dia("2026-09-28", "a_tiempo", { reporto: true, datos: { campanas: 0 } }), true), true);
  assert.equal(diaBajo(dia("2026-09-28", "a_tiempo", { reporto: true, datos: { campanas: 1 } }), true), false);
  assert.equal(diaBajo(dia("2026-09-27", "libre"), true), false);
  assert.equal(diaBajo(dia("2026-09-28", "a_tiempo"), false), false); // sin KPIs en su puesto
});

test("racha baja: 3 días seguidos (los libres no cortan ni cuentan)", () => {
  const p = { id: "a", nombre: "Ana", puesto: "estratega", puestoNombre: "Estratega Digital", departamento: "x", kpis: K, dias: [
    dia("2026-09-24", "a_tiempo", { reporto: true, datos: { campanas: 2 } }),
    dia("2026-09-25", "ausente"),
    dia("2026-09-26", "a_tiempo"),
    dia("2026-09-27", "libre"),
    dia("2026-09-28", "tarde", { minutosTarde: 60, reporto: true, datos: { campanas: 1 } }),
    dia("2026-09-29", "trabajando"),
  ] };
  const r = rachaBaja(p);
  assert.equal(r.dias, 3);
  assert.match(r.motivo, /sin marcar/);
  p.dias[2] = dia("2026-09-26", "a_tiempo", { reporto: true, datos: { campanas: 3 } });
  assert.equal(rachaBaja(p), null);
});

test("ranking: índice 0-100, comparado con su mismo puesto, con bueno / malo / mejorar", () => {
  const bueno = { id: "a", nombre: "Ana", puesto: "estratega", puestoNombre: "Estratega Digital", departamento: "x", kpis: K, dias: [
    dia("2026-09-01", "a_tiempo", { reporto: true, datos: { campanas: 3 } }),
    dia("2026-09-02", "a_tiempo", { reporto: true, datos: { campanas: 3 } }),
    dia("2026-09-03", "a_tiempo", { reporto: true, datos: { campanas: 4 } }),
  ] };
  const flojo = { id: "b", nombre: "Beto", puesto: "estratega", puestoNombre: "Estratega Digital", departamento: "x", kpis: K, dias: [
    dia("2026-09-01", "ausente"),
    dia("2026-09-02", "tarde", { puntaje: 50, minutosTarde: 40, reporto: false }),
    dia("2026-09-03", "tarde", { puntaje: 70, minutosTarde: 20, reporto: true, datos: { campanas: 0 } }),
  ] };
  const sinKpis = { id: "c", nombre: "Caro", puesto: "rrhh", puestoNombre: "RRHH", departamento: "y", kpis: [], dias: [dia("2026-09-01", "a_tiempo"), dia("2026-09-02", "a_tiempo")] };
  const r = rankingMes([flojo, bueno, sinKpis]);
  assert.deepEqual(r.map((f) => f.nombre), ["Ana", "Caro", "Beto"]);
  assert.equal(r[0].indice, 100);
  assert.ok(r[0].bueno.some((b) => b.startsWith("Líder en campañas")));
  assert.equal(r[1].indice, 100); // sin KPIs: solo asistencia
  const b = r[2];
  assert.ok(b.indice < 40);
  assert.ok(b.malo.some((m) => m.includes("sin marcar")));
  assert.ok(b.malo.some((m) => m.startsWith("Llegó tarde 2 días")));
  assert.ok(b.malo.some((m) => m.startsWith("0 en campañas")));
  assert.ok(b.mejorar.length >= 1);
  const t = textoRankingMes(r, "septiembre", "https://x");
  assert.match(t, /🥇 \*Ana\* · 100\/100/);
  assert.match(t, /Qué tienen que mejorar/);
});
