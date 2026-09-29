import assert from "node:assert/strict";
import { test } from "node:test";

import { esCorreoEmpresa, requiereSegundoPaso, tipoAccesoPulse } from "../lib/pulse/acceso-reglas.ts";

test("cada cuenta ve solo su parte de Pulse", () => {
  assert.equal(tipoAccesoPulse("admin", null), "completo");
  assert.equal(tipoAccesoPulse("editor", { puesto: "closer", soloRitmo: false }), "completo"); // Carilin/Aure
  assert.equal(tipoAccesoPulse("miembro", { puesto: "pm", soloRitmo: false }), "completo"); // Jessica
  assert.equal(tipoAccesoPulse("miembro", { puesto: "tesoreria", soloRitmo: false }), "completo"); // María
  assert.equal(tipoAccesoPulse("miembro", { puesto: "closer", soloRitmo: false }), "solo_leads");
  assert.equal(tipoAccesoPulse("miembro", { puesto: "director_ventas", soloRitmo: false }), "solo_leads"); // Nahuel
  assert.equal(tipoAccesoPulse("miembro", { puesto: "estratega", soloRitmo: true }), "solo_ritmo");
  assert.equal(tipoAccesoPulse("miembro", null), "completo");
});

test("segundo paso para quien ve tableros; se puede apagar solo en emergencia", () => {
  assert.equal(requiereSegundoPaso("completo"), true);
  assert.equal(requiereSegundoPaso("solo_leads"), false);
  assert.equal(requiereSegundoPaso("completo", "off"), false);
  assert.equal(esCorreoEmpresa("Jessica@LevelUpMediaPR.net"), true);
  assert.equal(esCorreoEmpresa("garrysgarcia@aiborinquen.co"), true);
  assert.equal(esCorreoEmpresa("alguien@gmail.com"), false);
});
