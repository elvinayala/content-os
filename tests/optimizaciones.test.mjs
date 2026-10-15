import assert from "node:assert/strict";
import { test } from "node:test";

import { cumplimiento, diasHabiles, plazo, venceEl, limpiarAcciones, progreso, puedeMarcar, rolCuentas, seguimientoDe, validarMarca } from "../lib/desempeno/optimizaciones-reglas.ts";

test("acciones del script: se limpian, sin repetidos, con tipo válido", () => {
  const xs = limpiarAcciones([
    { id: "reemplazar:vv1", tipo: "reemplazar", prioridad: 1, texto: "Reemplazar Video X" },
    { id: "reemplazar:vv1", tipo: "reemplazar", prioridad: 1, texto: "repetida" },
    { id: "x", tipo: "inventado", texto: "no" },
    { id: "frecuencia", tipo: "frecuencia", prioridad: 9, texto: "  Bajar   la frecuencia " },
  ]);
  assert.deepEqual(xs.map((x) => [x.id, x.prioridad, x.estado]), [["reemplazar:vv1", 1, "pendiente"], ["frecuencia", 2, "pendiente"]]);
  assert.equal(xs[1].texto, "Bajar la frecuencia");
  assert.deepEqual(limpiarAcciones("nada"), []);
});

test("marcar: ejecutado, o 'no' con el porqué", () => {
  assert.deepEqual(validarMarca("ejecutado"), { ok: true, estado: "ejecutado" });
  assert.equal(validarMarca("no", "").ok, false);
  assert.equal(validarMarca("no", "no").ok, false);
  assert.deepEqual(validarMarca("no", "El cliente no ha mandado fotos nuevas"), { ok: true, estado: "no", motivo: "El cliente no ha mandado fotos nuevas" });
  assert.equal(validarMarca("raro").ok, false);
});

test("quién: dirección de tráfico ve y marca todo; el estratega solo lo suyo y solo si está abierto", () => {
  const dir = ["maria.valencia@levelupmediapr.net", "juan.guzman@levelupmediapr.net"];
  assert.equal(rolCuentas({ id: "1", email: "Juan.Guzman@levelupmediapr.net", rol: "miembro" }, dir, true), "direccion");
  assert.equal(rolCuentas({ id: "2", email: "carilin@levelupmediapr.net", rol: "editor" }, dir, false), "direccion");
  assert.equal(rolCuentas({ id: "3", email: "felipe@x", rol: "miembro" }, dir, true), "estratega");
  assert.equal(rolCuentas({ id: "4", email: "otro@x", rol: "miembro" }, dir, false), null);
  assert.equal(puedeMarcar({ estrategaId: "3", estado: "abierta" }, { id: "3" }, "estratega"), true);
  assert.equal(puedeMarcar({ estrategaId: "9", estado: "abierta" }, { id: "3" }, "estratega"), false);
  assert.equal(puedeMarcar({ estrategaId: "3", estado: "bien" }, { id: "3" }, "estratega"), false);
});

test("seguimiento: lunes sale, miércoles vence; jueves recordatorio, viernes a la dirección", () => {
  assert.equal(diasHabiles("2026-10-16", "2026-10-20"), 2, "viernes → martes");
  const caso = { fecha: "2026-10-19", estado: "abierta", simulacion: false, recordado: false, escalado: false, acciones: [{ estado: "pendiente" }] };
  assert.equal(seguimientoDe(caso, "2026-10-21"), null, "miércoles: todavía está a tiempo");
  assert.equal(seguimientoDe(caso, "2026-10-22"), "recordar", "jueves");
  assert.equal(seguimientoDe({ ...caso, recordado: true }, "2026-10-22"), null);
  assert.equal(seguimientoDe({ ...caso, recordado: true }, "2026-10-23"), "escalar", "viernes");
  assert.equal(seguimientoDe({ ...caso, acciones: [{ estado: "ejecutado" }] }, "2026-10-23"), null, "todo marcado");
  assert.equal(seguimientoDe({ ...caso, simulacion: true }, "2026-10-23"), null, "vista previa: no molesta a nadie");
  assert.equal(venceEl("2026-10-19"), "2026-10-21");
  assert.deepEqual(["2026-10-20", "2026-10-21", "2026-10-22"].map((h) => plazo("2026-10-19", h)), ["a-tiempo", "vence-hoy", "vencido"]);
});

test("cumplimiento por estratega: marcado (ejecutó o explicó) y ejecutado", () => {
  const c = (estrategaId, estados, extra = {}) => ({ estrategaId, estratega: estrategaId === "a" ? "Ana" : "Beto", estado: "abierta", simulacion: false, acciones: estados.map((estado, i) => ({ id: String(i), estado })), ...extra });
  const r = cumplimiento([c("a", ["ejecutado", "no", "pendiente", "ejecutado"]), c("b", ["ejecutado"]), c("b", ["pendiente"], { simulacion: true })]);
  assert.deepEqual(r.map((x) => [x.estratega, x.total, x.marcado, x.ejecutado, x.pendientes]), [["Ana", 4, 75, 50, 1], ["Beto", 1, 100, 100, 0]]);
  assert.deepEqual(progreso([{ estado: "ejecutado" }, { estado: "no" }]), { total: 2, ejecutadas: 1, no: 1, pendientes: 0, completo: true });
});
