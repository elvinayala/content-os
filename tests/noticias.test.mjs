import assert from "node:assert/strict";
import { test } from "node:test";

import { esParaNoticia, noticiaVisible } from "../lib/desempeno/noticias-tipos.ts";

const lu = { empresa: "level_up", maestro: false };
const aib = { empresa: "ai_borinquen", maestro: false };

test("cada empleado ve las de todos y las de su empresa, nunca las de la otra", () => {
  assert.equal(noticiaVisible({ empresa: "todas" }, lu), true);
  assert.equal(noticiaVisible({ empresa: "level_up" }, lu), true);
  assert.equal(noticiaVisible({ empresa: "ai_borinquen" }, lu), false);
  assert.equal(noticiaVisible({ empresa: "level_up" }, aib), false);
});

test("quien vende en las dos (Laura) ve las dos; sin perfil, solo las de todos; la maestra, todas", () => {
  assert.equal(noticiaVisible({ empresa: "level_up" }, { empresa: "ai_borinquen", tambienEn: "level_up", maestro: false }), true);
  assert.equal(noticiaVisible({ empresa: "level_up" }, { empresa: null, maestro: false }), false);
  assert.equal(noticiaVisible({ empresa: "todas" }, { empresa: null, maestro: false }), true);
  assert.equal(noticiaVisible({ empresa: "ai_borinquen" }, { empresa: null, maestro: true }), true);
});

test("solo tres destinos válidos", () => {
  assert.ok(esParaNoticia("todas") && esParaNoticia("level_up") && esParaNoticia("ai_borinquen"));
  assert.equal(esParaNoticia("otra"), false);
});
