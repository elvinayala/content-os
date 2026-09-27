import assert from "node:assert/strict";
import { test } from "node:test";

import { duracionRutina, equipoSemana, miSemana, RUTINAS, rutinaDelDia, semanaDe } from "../lib/desempeno/bienestar-reglas.ts";

test("rutinas: una por día, ~5 minutos", () => {
  assert.equal(RUTINAS.length, 7);
  for (const r of RUTINAS) assert.ok(duracionRutina(r) >= 240 && duracionRutina(r) <= 330, `${r.titulo}: ${duracionRutina(r)} s`);
  assert.equal(rutinaDelDia("2026-09-28").titulo, "Cuello y hombros"); // lunes
  assert.equal(rutinaDelDia("2026-09-27").titulo, "Descanso activo"); // domingo
});

test("semana de lunes a domingo", () => {
  assert.deepEqual(semanaDe("2026-09-30"), ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
  assert.equal(semanaDe("2026-09-28")[0], "2026-09-28");
});

test("mi semana: minutos, meta y racha de pausas", () => {
  const dias = semanaDe("2026-09-30");
  const regs = [
    { userId: "a", fecha: "2026-09-28", tipo: "pausa", minutos: 5, valor: null },
    { userId: "a", fecha: "2026-09-29", tipo: "pausa", minutos: 5, valor: null },
    { userId: "a", fecha: "2026-09-30", tipo: "pausa", minutos: 5, valor: null },
    { userId: "a", fecha: "2026-09-30", tipo: "actividad", minutos: 40, valor: null },
    { userId: "a", fecha: "2026-09-30", tipo: "animo", minutos: 0, valor: 4 },
  ];
  const s = miSemana(regs, dias, "2026-09-30");
  assert.equal(s.minutos, 55);
  assert.equal(s.pct, 37);
  assert.equal(s.pausas, 3);
  assert.equal(s.racha, 3);
  assert.equal(miSemana(regs, dias, "2026-10-01").racha, 0);
});

test("equipo: solo agregados y energía con ≥ 5 respuestas", () => {
  const animo = (u, v) => ({ userId: u, fecha: "2026-09-30", tipo: "animo", minutos: 0, valor: v });
  const regs = [{ userId: "a", fecha: "2026-09-29", tipo: "actividad", minutos: 160, valor: null }, animo("a", 4), animo("b", 2), animo("c", 5), animo("d", 3)];
  const e = equipoSemana(regs, 10);
  assert.equal(e.participantes, 4);
  assert.equal(e.cumplieron, 1);
  assert.equal(e.animo, null); // 4 respuestas: no se muestra
  assert.equal(equipoSemana([...regs, animo("e", 4)], 10).animo, 3.6);
});

test("comunidad: tablero solo con quienes se unieron y sin energía", async () => {
  const { tableroComunidad, errorMensaje, nombreCorto } = await import("../lib/desempeno/bienestar-reglas.ts");
  const regs = [
    { userId: "a", fecha: "2026-09-30", tipo: "actividad", minutos: 60, valor: null },
    { userId: "a", fecha: "2026-09-29", tipo: "pausa", minutos: 5, valor: null },
    { userId: "b", fecha: "2026-09-28", tipo: "actividad", minutos: 160, valor: null },
    { userId: "b", fecha: "2026-09-30", tipo: "animo", minutos: 0, valor: 1 },
    { userId: "c", fecha: "2026-09-30", tipo: "actividad", minutos: 999, valor: null }, // c no se unió
  ];
  const t = tableroComunidad(regs, [{ id: "a", nombre: "Ana" }, { id: "b", nombre: "Beto" }], "2026-09-30");
  assert.deepEqual(t.map((x) => x.id), ["b", "a"]);
  assert.equal(t[0].meta, true);
  assert.equal(t[0].activoHoy, false); // el ánimo no cuenta como actividad
  assert.equal(t[1].activoHoy, true);
  assert.equal("valor" in t[0], false);
  assert.equal(errorMensaje(" "), "Escribe algo");
  assert.match(errorMensaje("x".repeat(281)), /280/);
  assert.equal(errorMensaje("¡Hoy le di duro! 🔥"), null);
  assert.equal(nombreCorto("Santiago Alejandro Gutiérrez"), "Santiago A.");
});
