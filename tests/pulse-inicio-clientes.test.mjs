import assert from "node:assert/strict";
import { test } from "node:test";

import { enVista, inicioMesPR, listasInicio } from "../lib/pulse/inicio-clientes.ts";

const MES = "2026-09-01T00:00:00-04:00";
const f = (id, grupo, creadoEl = "2026-08-10T12:00:00Z") => ({ id, nombre: id, empresa: null, boardSlug: "level-up-media", marca: "Level Up", grupo, creadoEl });

test("cada ficha cae en su número, como antes", () => {
  const l = listasInicio(
    [f("a", "CLIENTE ACTIVO"), f("b", "Inner Circle"), f("c", "ONBOARDING & SETUP", "2026-09-20T12:00:00Z"), f("d", "ANÁLISIS Y ESTRATEGIA"), f("e", "OFFBOARDED", "2026-09-25T12:00:00Z"), f("g", "Inactivos")],
    MES,
  );
  assert.deepEqual(l.activos.map((x) => x.id), ["a", "b"]);
  assert.deepEqual(l.onboarding.map((x) => x.id), ["c", "d"]);
  assert.deepEqual(l.nuevos.map((x) => x.id), ["c"]);
  assert.deepEqual(l.cartera.map((x) => x.id).sort(), ["a", "b", "c", "d"]);
});

test("la baja de este mes no cuenta como nueva", () => {
  assert.equal(enVista("nuevos", { grupo: "OFFBOARDED", creadoEl: "2026-09-25T12:00:00Z" }, MES), false);
});

test("las listas van de la más reciente a la más vieja", () => {
  const l = listasInicio([f("vieja", "CLIENTE ACTIVO", "2026-01-01T00:00:00Z"), f("nueva", "CLIENTE ACTIVO", "2026-09-28T00:00:00Z")], MES);
  assert.deepEqual(l.activos.map((x) => x.id), ["nueva", "vieja"]);
});

test("el mes empieza a medianoche de Puerto Rico", () => {
  assert.equal(inicioMesPR(new Date("2026-10-01T03:00:00Z")), "2026-09-01T00:00:00-04:00");
  assert.equal(inicioMesPR(new Date("2026-10-01T05:00:00Z")), "2026-10-01T00:00:00-04:00");
});
