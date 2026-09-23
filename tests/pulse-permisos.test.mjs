import assert from "node:assert/strict";
import test from "node:test";

import { etiquetasQuitadasEnUso, poderes, TOPE_BORRADO_NO_ADMIN } from "../lib/pulse/permisos.ts";

test("el admin puede todo", () => {
  const p = poderes("admin");
  assert.equal(p.eliminarTablero, true);
  assert.equal(p.eliminarColumnas, true);
  assert.equal(p.exportarDatos, true);
  assert.equal(p.topeBorradoItems, null);
  assert.deepEqual(p.rolesQuePuedeAsignar, ["admin", "editor", "miembro"]);
});

test("las editoras administran pero no sacan ni borran en masa", () => {
  const p = poderes("editor");
  assert.equal(p.agregarUsuarios, true);
  assert.equal(p.verRegistroSeguridad, true);
  assert.deepEqual(p.rolesQuePuedeAsignar, ["miembro"]);
  assert.equal(p.exportarDatos, false);
  assert.equal(p.eliminarTablero, false);
  assert.equal(p.eliminarColumnas, false);
  assert.equal(p.quitarEtiquetasEnUso, false);
  assert.equal(p.administrarAccesoTableros, false);
  assert.equal(p.topeBorradoItems, TOPE_BORRADO_NO_ADMIN);
});

test("el miembro edita pero no administra", () => {
  const p = poderes("miembro");
  assert.equal(p.agregarUsuarios, false);
  assert.equal(p.editarDatos, true);
  assert.equal(p.verRegistroSeguridad, false);
  assert.deepEqual(p.rolesQuePuedeAsignar, []);
});

test("detecta etiquetas quitadas que están en uso", () => {
  const antes = [{ id: "m1" }, { id: "m2" }, { id: "m3" }];
  assert.deepEqual(etiquetasQuitadasEnUso(antes, [{ id: "m1" }], new Set(["m2"])), ["m2"]);
  assert.deepEqual(etiquetasQuitadasEnUso(antes, [{ id: "m1" }, { id: "m2" }, { id: "m3" }, { id: "m4" }], new Set(["m1"])), []);
  assert.deepEqual(etiquetasQuitadasEnUso(antes, [{ id: "m1" }], new Set()), []);
});
