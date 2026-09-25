import assert from "node:assert/strict";
import { test } from "node:test";

import {
  asistenciaDia,
  colorScore,
  fechaPR,
  kpisDe,
  kpisProduccion,
  puedeAprobar,
  puedeVer,
  puntajeKpi,
  scoreDia,
  valoresProduccion,
} from "../lib/desempeno/reglas.ts";

const H = { horaEntrada: "09:00", horaSalida: "18:00", diasLaborables: [1, 2, 3, 4, 5] };
// jueves 24/sep/2026, hora PR (UTC-4)
const pr = (hhmm, fecha = "2026-09-24") => new Date(`${fecha}T${hhmm}:00-04:00`).toISOString();
const DESPUES = Date.parse("2026-09-25T12:00:00-04:00");

test("fechaPR usa la hora de Puerto Rico", () => {
  assert.equal(fechaPR(Date.parse("2026-09-25T02:00:00Z")), "2026-09-24"); // 10 PM PR
});

test("asistencia: a tiempo dentro de la tolerancia y jornada completa", () => {
  const a = asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [{ entradaAt: pr("09:10"), salidaAt: pr("18:05") }] });
  assert.equal(a.estado, "a_tiempo");
  assert.equal(a.puntaje, 100);
  assert.equal(a.minutosTarde, 10);
});

test("asistencia: tarde escalonado", () => {
  const p = (h) => asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [{ entradaAt: pr(h), salidaAt: pr("19:30") }] }).puntaje;
  assert.equal(p("09:20"), 85);
  assert.equal(p("09:45"), 70);
  assert.equal(p("10:30"), 50);
});

test("asistencia: horario flexible — se va temprano pero vuelve de noche y completa horas", () => {
  const a = asistenciaDia({
    fecha: "2026-09-24",
    horario: H,
    ahora: DESPUES,
    ponches: [
      { entradaAt: pr("09:00"), salidaAt: pr("14:00") },
      { entradaAt: pr("19:00"), salidaAt: pr("22:30") },
    ],
  });
  assert.equal(a.salidaTemprana, false);
  assert.equal(a.puntaje, 100);
  assert.equal(a.horas, 8.5);
});

test("asistencia: salida temprana sin completar horas resta", () => {
  const a = asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [{ entradaAt: pr("09:00"), salidaAt: pr("14:00") }] });
  assert.equal(a.salidaTemprana, true);
  assert.equal(a.puntaje, 85);
});

test("asistencia: ausente, pendiente, libre y sin salida", () => {
  assert.equal(asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [] }).estado, "ausente");
  assert.equal(asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [] }).puntaje, 0);
  const temprano = Date.parse("2026-09-24T09:05:00-04:00");
  assert.equal(asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: temprano, ponches: [] }).estado, "pendiente");
  assert.equal(asistenciaDia({ fecha: "2026-09-26", horario: H, ahora: DESPUES + 2 * 86400000, ponches: [] }).puntaje, null); // sábado
  const olvido = asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [{ entradaAt: pr("09:00"), salidaAt: null }] });
  assert.equal(olvido.sinSalida, true);
  assert.equal(olvido.puntaje, 90);
});

test("asistencia: hoy con tramo abierto = trabajando", () => {
  const ahora = Date.parse("2026-09-24T12:00:00-04:00");
  const a = asistenciaDia({ fecha: "2026-09-24", horario: H, ahora, ponches: [{ entradaAt: pr("09:00"), salidaAt: null }] });
  assert.equal(a.estado, "trabajando");
  assert.equal(a.horas, 3);
});

const U = "diseñador", PM = "pm";
const tarea = (id, o = {}) => ({ id, createdAt: pr("08:00", "2026-09-20"), responsables: [U], pidio: [PM], estado: "por_hacer", fechaLimite: null, ...o });
const cambio = (itemId, estado, at, userId = U) => ({ itemId, estado, at, userId });

test("producción: entregas a tiempo, revisiones, vencidas y backlog", () => {
  const tareas = [
    tarea("a", { fechaLimite: "2026-09-23" }),
    tarea("b", { fechaLimite: "2026-09-21" }),
    tarea("c", { fechaLimite: "2026-09-22" }), // sigue abierta y vencida
    tarea("d"),
  ];
  const cambios = [
    cambio("a", "revision", pr("10:00", "2026-09-22")),
    cambio("a", "cambios", pr("12:00", "2026-09-22"), PM),
    cambio("a", "revision", pr("15:00", "2026-09-22")),
    cambio("a", "listo", pr("16:00", "2026-09-22"), PM),
    cambio("b", "revision", pr("10:00", "2026-09-23")), // tarde
    cambio("b", "listo", pr("11:00", "2026-09-23"), U), // autoaprobada
    cambio("c", "proceso", pr("10:00", "2026-09-21")),
  ];
  const k = kpisProduccion({ userId: U, fecha: "2026-09-24", tareas, cambios });
  assert.equal(k.terminadas, 2);
  assert.equal(k.entregas, 2);
  assert.equal(k.entregasATiempo, 1);
  assert.equal(k.revisiones, 1);
  assert.equal(k.vencidas, 1);
  assert.equal(k.backlog, 2);
  assert.equal(k.autoaprobadas, 1);
  const v = valoresProduccion(k);
  assert.equal(v.entregas_a_tiempo, 50);
  assert.equal(v.revisiones, 0.5);
  // El PM ve lo que pidió y está vencido
  assert.equal(kpisProduccion({ userId: PM, fecha: "2026-09-24", tareas, cambios }).vencidasPedidas, 1);
});

test("producción: reconstruye el estado de un día pasado", () => {
  const tareas = [tarea("x", { fechaLimite: "2026-09-21", estado: "listo" })];
  const cambios = [cambio("x", "listo", pr("10:00", "2026-09-24"))];
  assert.equal(kpisProduccion({ userId: U, fecha: "2026-09-23", tareas, cambios }).vencidas, 1);
  assert.equal(kpisProduccion({ userId: U, fecha: "2026-09-24", tareas, cambios }).vencidas, 0);
});

test("puntaje de KPI contra la meta", () => {
  assert.equal(puntajeKpi(45, { meta: 90, sentido: "mayor" }), 50);
  assert.equal(puntajeKpi(120, { meta: 90, sentido: "mayor" }), 100);
  assert.equal(puntajeKpi(0, { meta: 0, sentido: "menor" }), 100);
  assert.equal(puntajeKpi(1, { meta: 0, sentido: "menor" }), 50);
  assert.equal(puntajeKpi(null, { meta: 1, sentido: "menor" }), null);
  assert.equal(puntajeKpi(5, { meta: 0, sentido: "info" }), null);
});

test("score: 20 % asistencia + 80 % KPIs conectados; colores", () => {
  const kpis = kpisDe("disenador");
  const s = scoreDia({ asistencia: 100, kpis, valores: { entregas_a_tiempo: 100, terminadas: 15, revisiones: 0, vencidas: 0, backlog: 3 } });
  assert.equal(s.score, 100);
  const s2 = scoreDia({ asistencia: 50, kpis, valores: { entregas_a_tiempo: 50, terminadas: 15, revisiones: 1, vencidas: 1, backlog: 3 } });
  // KPIs: a tiempo 50/90 → 56·3 + 100·2 + 100·2 + vencidas 50·3 = 718 / 10 = 71.8 → 0.2·50 + 0.8·71.8 = 67
  assert.equal(s2.score, 67);
  assert.equal(colorScore(95), "verde");
  assert.equal(colorScore(80), "amarillo");
  assert.equal(colorScore(74), "rojo");
  assert.equal(colorScore(null), null);
});

test("score: fuentes no conectadas no cuentan; día libre no se califica", () => {
  const s = scoreDia({ asistencia: 85, kpis: kpisDe("media_buyer"), valores: { optimizaciones: 50 } });
  assert.equal(s.parcial, true);
  assert.equal(s.score, 85);
  assert.equal(scoreDia({ asistencia: null, kpis: kpisDe("editor"), valores: {} }).score, null);
});

test("metas editadas por Carilin reemplazan las de fábrica", () => {
  const k = kpisDe("editor", [{ puesto: "editor", kpi: "terminadas", meta: 6, peso: 1 }]).find((x) => x.id === "terminadas");
  assert.equal(k.meta, 6);
  assert.equal(k.peso, 1);
});

test("permisos: la vista maestra es solo de admin/editoras; cada quien ve lo suyo", () => {
  const persona = { userId: "p", liderId: "l" };
  assert.equal(puedeVer({ id: "x", rol: "editor" }, persona), true);
  assert.equal(puedeVer({ id: "x", rol: "admin" }, persona), true);
  assert.equal(puedeVer({ id: "l", rol: "miembro" }, persona), false); // el líder no ve la maestra
  assert.equal(puedeVer({ id: "p", rol: "miembro" }, persona), true);
  assert.equal(puedeVer({ id: "otro", rol: "miembro" }, persona), false);
  assert.equal(puedeAprobar({ id: "p", rol: "admin" }, persona), false); // nadie se aprueba a sí mismo
  assert.equal(puedeAprobar({ id: "x", rol: "editor" }, persona), true);
  assert.equal(puedeAprobar({ id: "l", rol: "miembro" }, persona), false);
});

test("asistencia: los días antes de activar el perfil no cuentan", () => {
  const a = asistenciaDia({ fecha: "2026-09-23", horario: H, ahora: DESPUES, ponches: [], desde: "2026-09-24" });
  assert.equal(a.puntaje, null);
  assert.equal(asistenciaDia({ fecha: "2026-09-24", horario: H, ahora: DESPUES, ponches: [], desde: "2026-09-24" }).estado, "ausente");
});
