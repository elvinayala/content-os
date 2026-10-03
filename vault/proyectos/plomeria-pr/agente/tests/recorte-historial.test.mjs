import { test } from "node:test";
import assert from "node:assert/strict";
import { recortarHistorial } from "../dist/recorte-historial.js";

const u = (t) => ({ role: "user", content: [{ type: "text", text: t }] });
const usa = (id) => ({ role: "assistant", content: [{ type: "tool_use", id, name: "x", input: {} }] });
const res = (id) => ({ role: "user", content: [{ type: "tool_result", tool_use_id: id, content: "ok" }] });
const a = (t) => ({ role: "assistant", content: [{ type: "text", text: t }] });

test("si el corte cae entre tool_use y tool_result, arranca en el próximo mensaje real del cliente", () => {
  const ms = [u("hola"), usa("t1"), res("t1"), a("listo"), u("gracias"), a("de nada")];
  assert.deepEqual(recortarHistorial(ms, 4), [u("gracias"), a("de nada")]);
  assert.deepEqual(recortarHistorial(ms, 5), [u("gracias"), a("de nada")]);
  assert.deepEqual(recortarHistorial(ms, 6), ms);
});

test("repara un historial que ya empezaba con un tool_result huérfano", () => {
  assert.deepEqual(recortarHistorial([res("t9"), a("ok"), u("¿y el precio?")]), [u("¿y el precio?")]);
  assert.deepEqual(recortarHistorial([res("t9"), a("ok")]), []);
});
