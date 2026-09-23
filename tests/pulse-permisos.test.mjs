import assert from "node:assert/strict";
import test from "node:test";

import { poderes, TOPE_BORRADO_NO_ADMIN } from "../lib/pulse/permisos.ts";

test("el admin puede todo", () => {
  const p = poderes("admin");
  assert.equal(p.eliminarTablero, true);
  assert.equal(p.exportarDatos, true);
  assert.equal(p.verRegistroSeguridad, true);
  assert.equal(p.topeBorradoItems, null);
  assert.deepEqual(p.rolesQuePuedeAsignar, ["admin", "editor", "miembro"]);
});

test("el editor agrega gente pero no saca datos ni sube de rango a nadie", () => {
  const p = poderes("editor");
  assert.equal(p.agregarUsuarios, true);
  assert.deepEqual(p.rolesQuePuedeAsignar, ["miembro"]);
  assert.equal(p.exportarDatos, false);
  assert.equal(p.eliminarTablero, false);
  assert.equal(p.verRegistroSeguridad, false);
  assert.equal(p.administrarAccesoTableros, false);
  assert.equal(p.topeBorradoItems, TOPE_BORRADO_NO_ADMIN);
});

test("el miembro edita pero no administra usuarios", () => {
  const p = poderes("miembro");
  assert.equal(p.agregarUsuarios, false);
  assert.equal(p.editarDatos, true);
  assert.equal(p.exportarDatos, false);
  assert.deepEqual(p.rolesQuePuedeAsignar, []);
});
