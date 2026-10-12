import test from "node:test";
import assert from "node:assert/strict";
import { clasificar, decidir, limpiarId, repartirAvisos, rolDe, textoAviso, textoFicha } from "../lib/pulse/cuentas-meta-reglas.ts";

test("limpiarId acepta act_ y espacios, rechaza lo que no parece un ID", () => {
  assert.equal(limpiarId("act_1234567890123"), "1234567890123");
  assert.equal(limpiarId(" 1588 3197 9518 4399 "), "1588319795184399");
  assert.equal(limpiarId("no tengo"), null);
  assert.equal(limpiarId("12345"), null);
  assert.equal(limpiarId(null), null);
});

test("clasificar: permisos, ID inexistente, pago y errores transitorios", () => {
  assert.equal(clasificar({ error: { code: 200, message: "(#200) Ad account owner has NOT grant ads_management or ads_read permission" } }).estado, "sin-permiso");
  assert.equal(clasificar({ error: { code: 100, message: "Unsupported get request" } }).estado, "no-existe");
  assert.equal(clasificar({ error: { code: 190, message: "token expired" } }).estado, "transitorio");
  assert.equal(clasificar({ account_status: 1 }).estado, "ok");
  assert.equal(clasificar({ account_status: 3 }).estado, "pago");
  assert.equal(clasificar({ account_status: 9 }).estado, "pago");
  assert.equal(clasificar({ account_status: 2 }).estado, "inactiva");
  assert.equal(clasificar({ account_status: 101 }).estado, "inactiva");
});

test("decidir: avisa solo al cambiar; no llena la ficha de ✅ ni alerta por errores transitorios", () => {
  assert.deepEqual(decidir(null, "sin-permiso"), { escribir: true, avisar: "nuevo" });
  assert.deepEqual(decidir("sin-permiso", "sin-permiso"), { escribir: false, avisar: null });
  assert.deepEqual(decidir("sin-permiso", "no-existe"), { escribir: true, avisar: "nuevo" });
  assert.deepEqual(decidir("sin-permiso", "ok"), { escribir: true, avisar: "recuperado" });
  assert.deepEqual(decidir(null, "ok"), { escribir: false, avisar: null });
  assert.deepEqual(decidir("ok", "pago"), { escribir: true, avisar: "nuevo" });
  assert.deepEqual(decidir("sin-permiso", "transitorio"), { escribir: false, avisar: null });
});

test("los textos traen los pasos y el portafolio", () => {
  const t = textoFicha("sin-permiso", "123456789012345", "x");
  assert.match(t, /836808821982174/);
  assert.match(t, /Administrar campañas/);
  const a = textoAviso({ nuevos: [{ nombre: "Ana", empresa: "Spa", id: "123456789012345", estado: "sin-permiso", detalle: "d", admin: "Jessica" }], recuperados: [] });
  assert.match(a ?? "", /Ana · Spa/);
  assert.equal(textoAviso({ nuevos: [], recuperados: [] }), null);
});

test("proceso de Carilin: compartir la cuenta es del onboarding; el ID y lo demás, del estratega", () => {
  assert.equal(rolDe("sin-permiso"), "onboarding");
  for (const e of ["sin-id", "no-existe", "pago", "inactiva"]) assert.equal(rolDe(e), "estratega");
  assert.match(textoFicha("sin-id", null, "x"), /estratega/);
  const l = (nombre, estado, destino) => ({ nombre, id: estado === "sin-id" ? null : "123456789012345", estado, detalle: "d", destino });
  const r = repartirAvisos(
    { nuevos: [l("Ana", "sin-id", "maria@x.com"), l("Beto", "sin-permiso", "maria@x.com"), l("Caro", "pago", null)], recuperados: [l("Dani", "ok", "maria@x.com")] },
    ["jessica@x.com"],
    ["carilin@x.com"],
  );
  const de = (email, rol) => r.find((g) => g.email === email && g.rol === rol);
  assert.deepEqual(de("maria@x.com", "estratega").nuevos.map((x) => x.nombre), ["Ana"]);
  assert.deepEqual(de("maria@x.com", "estratega").recuperados.map((x) => x.nombre), ["Dani"]);
  assert.deepEqual(de("jessica@x.com", "onboarding").nuevos.map((x) => x.nombre), ["Beto"]);
  assert.deepEqual(de("carilin@x.com", "asignar").nuevos.map((x) => x.nombre), ["Caro"]);
  assert.match(textoAviso({ nuevos: de("carilin@x.com", "asignar").nuevos, recuperados: [], rol: "asignar" }), /sin estratega[\s\S]*Asignación de Estrategas/);
  assert.match(textoAviso({ nuevos: de("maria@x.com", "estratega").nuevos, recuperados: [], rol: "estratega" }), /de tus clientes[\s\S]*Id cuenta publicitaria/);
});
