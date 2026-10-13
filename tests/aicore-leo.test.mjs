import assert from "node:assert/strict";
import { test } from "node:test";

import { atenderLeo, costoLeo } from "../scripts/aicore-leo.mjs";

const ROOT = process.cwd();

function buzon(filas) {
  const marcas = [];
  return { marcas, pendientes: async (para) => (para === "leo" ? filas : []), marcar: async (id, estado, respuesta, costo) => { marcas.push({ id, estado, respuesta, costo }); } };
}

test("Leo atiende solo lo de AI Core, sin herramientas, y cierra con su respuesta y costo", async () => {
  const llamadas = [];
  const f = async (url, init) => {
    llamadas.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ content: [{ type: "text", text: "Veredicto: el hook va. — Leo" }], usage: { input_tokens: 2000, output_tokens: 300 } }), { status: 200 });
  };
  const b = buzon([
    { id: 1, de: "aicore", texto: "[AI Core · tarea x]\n---\nRevisa: ¿Sigues perdiendo leads?", hilo: null },
    { id: 2, de: "sofi", texto: "revisa esto", hilo: null },
    { id: 3, de: "aicore", texto: "respuesta", hilo: 1 },
  ]);
  const n = await atenderLeo({ ...b, root: ROOT, key: "k", modelo: "claude-sonnet-5", f });
  assert.equal(n, 1);
  assert.equal(llamadas.length, 1);
  assert.ok(!("tools" in llamadas[0]));
  assert.match(llamadas[0].system, /AI Core[\s\S]*Firma — Leo/);
  const cierre = b.marcas.find((m) => m.id === 1 && m.estado === "atendido");
  assert.equal(cierre.respuesta, "Veredicto: el hook va. — Leo");
  assert.ok(Math.abs(cierre.costo - costoLeo("claude-sonnet-5", { input_tokens: 2000, output_tokens: 300 })) < 1e-9);
  assert.equal(b.marcas.find((m) => m.id === 2).estado, "fallido");
  assert.equal(b.marcas.find((m) => m.id === 3).estado, "atendido");
});

test("sin llave no hace nada; si la API falla, la tarea queda fallida con el motivo", async () => {
  assert.equal(await atenderLeo({ ...buzon([{ id: 1, de: "aicore", texto: "x" }]), root: ROOT, key: "" }), 0);
  const b = buzon([{ id: 9, de: "aicore", texto: "x", hilo: null }]);
  await atenderLeo({ ...b, root: ROOT, key: "k", f: async () => new Response(JSON.stringify({ error: { message: "sobrecargado" } }), { status: 529 }) });
  assert.match(b.marcas.at(-1).respuesta, /sobrecargado/);
  assert.equal(b.marcas.at(-1).estado, "fallido");
});
