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

test("alertas de rendimiento: un día malo no alerta; 2 seguidos = amarilla; 4 en el mes = roja", async () => {
  const { alertaRendimiento, motivoDiaMalo, produccionNormal, vaACarilin } = await import("../lib/desempeno/ranking.ts");
  const bien = (f, n = 10) => dia(f, "a_tiempo", { reporto: true, datos: { campanas: n } });
  const persona = (dias) => ({ id: "a", nombre: "Ana", puesto: "estratega", puestoNombre: "Estratega Digital", departamento: "x", kpis: K, dias });
  const base = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-07"].map((f) => bien(f));

  // Un solo día malo: nada.
  assert.equal(alertaRendimiento(persona([...base, bien("2026-09-08", 2)]), "2026-09"), null);
  // Baja producción = menos de la mitad de lo normal suyo.
  assert.equal(produccionNormal(persona(base)), 10);
  assert.equal(motivoDiaMalo(bien("2026-09-08", 4), true, 10), "baja producción");
  assert.equal(motivoDiaMalo(bien("2026-09-08", 6), true, 10), null);
  // Dos seguidos (el fin de semana libre no corta): amarilla nueva.
  const a = alertaRendimiento(persona([...base, bien("2026-09-11", 2), dia("2026-09-12", "libre"), dia("2026-09-14", "ausente")]), "2026-09");
  assert.equal(a.nivel, "amarilla");
  assert.equal(a.racha, 2);
  assert.equal(a.nueva, true);
  assert.deepEqual(a.motivos.sort(), ["baja producción", "sin marcar"]);
  // Cuatro días malos sueltos en el mes (uno por semana): roja, y avisa el día del 4.º.
  const sueltos = persona([...base, dia("2026-09-08", "ausente"), bien("2026-09-09"), dia("2026-09-15", "ausente"), bien("2026-09-16"), dia("2026-09-22", "ausente"), bien("2026-09-23"), dia("2026-09-29", "ausente")]);
  const r = alertaRendimiento(sueltos, "2026-09");
  assert.equal(r.nivel, "roja");
  assert.equal(r.malosMes, 4);
  assert.equal(r.nueva, true);
  // Los días malos del mes pasado no cuentan para la roja.
  assert.equal(alertaRendimiento(sueltos, "2026-10"), null);
  // Hoy (todavía trabajando) no cuenta.
  assert.equal(alertaRendimiento(persona([...base, dia("2026-09-08", "ausente"), dia("2026-09-09", "trabajando")]), "2026-09"), null);
  // A Carilin: amarillas de estrategas/PM; de otros puestos solo rojas.
  assert.equal(vaACarilin("estratega", a), true);
  assert.equal(vaACarilin("disenador", a), false);
  assert.equal(vaACarilin("disenador", r), true);
});
