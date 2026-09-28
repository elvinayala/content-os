import assert from "node:assert/strict";
import { test } from "node:test";

import { errorDarAcceso, manejaEquipoLeads } from "../lib/leads/equipo.ts";

test("quién maneja el equipo de Leads", () => {
  const nahuel = { puesto: "director_ventas", empresa: "level_up", tambienEn: null };
  assert.equal(manejaEquipoLeads({ rol: "admin" }, null, "ai_borinquen", false), true);
  assert.equal(manejaEquipoLeads({ rol: "miembro" }, nahuel, "level_up", true), true);
  assert.equal(manejaEquipoLeads({ rol: "miembro" }, nahuel, "ai_borinquen", false), false); // AIB no es suyo
  assert.equal(manejaEquipoLeads({ rol: "miembro" }, { puesto: "closer", empresa: "level_up" }, "level_up", true), false);
  assert.equal(manejaEquipoLeads({ rol: "editor" }, null, "level_up", true), true);
  assert.equal(manejaEquipoLeads({ rol: "editor" }, null, "ai_borinquen", false), false);
});

test("a quién se le puede dar acceso", () => {
  const base = { id: "u2", rol: "miembro", activo: true, soloRitmo: false, bloqueado: false, sistema: false };
  assert.equal(errorDarAcceso({ yoId: "u1", objetivo: base, alcance: "todos" }), null);
  assert.match(errorDarAcceso({ yoId: "u1", objetivo: { ...base, soloRitmo: true }, alcance: "todos" }), /Yaileen/);
  assert.match(errorDarAcceso({ yoId: "u1", objetivo: { ...base, bloqueado: true }, alcance: "todos" }), /decisión de Elvin/);
  assert.match(errorDarAcceso({ yoId: "u1", objetivo: { ...base, activo: false }, alcance: "todos" }), /cuenta activa/);
  assert.match(errorDarAcceso({ yoId: "u1", objetivo: base, alcance: "otro" }), /Escoge/);
  assert.match(errorDarAcceso({ yoId: "u1", objetivo: { ...base, rol: "admin" }, alcance: "todos" }), /Elvin/);
});
