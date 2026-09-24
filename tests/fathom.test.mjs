import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

import { firmaValida, markdownASlack, mensajeSlack, participantes } from "../lib/fathom.ts";

const SECRETO = "whsec_" + Buffer.from("clave-de-prueba-fathom-0123456789").toString("base64");
const firmar = (id, ts, body) =>
  "v1," + createHmac("sha256", Buffer.from(SECRETO.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest("base64");

const reunion = {
  recording_id: 123456,
  title: "Llamada con Mano Santa",
  meeting_title: "Mano Santa · seguimiento",
  share_url: "https://fathom.video/share/abc",
  url: "https://fathom.video/calls/123456",
  recording_start_time: "2026-09-24T18:00:00Z",
  recording_end_time: "2026-09-24T18:32:00Z",
  recorded_by: { name: "Elvin Ayala", email: "elvin@levelupmediapr.net" },
  calendar_invitees: [
    { name: "Elvin Ayala", email: "elvin@levelupmediapr.net", is_external: false },
    { name: "Teo", email: "teo@manosanta.com", is_external: true },
    { name: null, email: "socio@x.com", is_external: true },
  ],
  default_summary: {
    template_name: "general",
    markdown_formatted: "## Meeting Purpose\nRevisar campaña.\n\n## Key Takeaways\n- **CPL** bajó a $4 <bien>\n- Ver [dashboard](https://x.com/d)",
  },
  action_items: [
    { description: "Mandar flyers nuevos", completed: false, assignee: { name: "Aure" } },
    { description: "Subir presupuesto", completed: true, assignee: null },
  ],
};

test("firmaValida: acepta la firma correcta y rechaza cambios, viejas o sin headers", () => {
  const body = JSON.stringify(reunion);
  const ts = String(Math.floor(Date.now() / 1000));
  const firma = firmar("msg_1", ts, body);
  assert.equal(firmaValida(SECRETO, { id: "msg_1", timestamp: ts, firma: `v1,otra ${firma}` }, body), true);
  assert.equal(firmaValida(SECRETO, { id: "msg_1", timestamp: ts, firma }, body + " "), false);
  assert.equal(firmaValida(SECRETO, { id: "msg_2", timestamp: ts, firma }, body), false);
  const vieja = String(Math.floor(Date.now() / 1000) - 3600);
  assert.equal(firmaValida(SECRETO, { id: "msg_1", timestamp: vieja, firma: firmar("msg_1", vieja, body) }, body), false);
  assert.equal(firmaValida(SECRETO, { id: null, timestamp: ts, firma }, body), false);
  assert.equal(firmaValida("", { id: "msg_1", timestamp: ts, firma }, body), false);
});

test("markdownASlack: títulos, negritas, viñetas, links y escape", () => {
  const s = markdownASlack(reunion.default_summary.markdown_formatted);
  assert.match(s, /^\*Meeting Purpose\*/);
  assert.match(s, /• \*CPL\* bajó a \$4 &lt;bien&gt;/);
  assert.match(s, /<https:\/\/x\.com\/d\|dashboard>/);
});

test("participantes: grabador + invitados sin repetir, email si no hay nombre", () => {
  assert.deepEqual(participantes(reunion), ["Elvin Ayala", "Teo", "socio@x.com"]);
  assert.deepEqual(participantes({ recording_id: 1 }), []);
});

test("mensajeSlack: trae título, fecha PR, participantes, resumen, tareas y link", () => {
  const { text, blocks } = mensajeSlack(reunion);
  const todo = JSON.stringify(blocks);
  assert.match(text, /Mano Santa · seguimiento/);
  assert.match(todo, /2:00 PM \(hora PR\)/);
  assert.match(todo, /32 min/);
  assert.match(todo, /Elvin Ayala, Teo, socio@x.com/);
  assert.match(todo, /Revisar campaña/);
  assert.match(todo, /☐ Mandar flyers nuevos — _Aure_/);
  assert.match(todo, /☑ Subir presupuesto/);
  assert.match(todo, /fathom\.video\/share\/abc/);
  for (const b of blocks) if (b.text?.type === "mrkdwn") assert.ok(b.text.text.length <= 3000);
});

test("mensajeSlack: sin resumen ni tareas no rompe y lo dice; resumen largo se corta", () => {
  const vacio = JSON.stringify(mensajeSlack({ recording_id: 9, title: "X" }).blocks);
  assert.match(vacio, /no generó resumen/);
  assert.match(vacio, /Sin tareas/);
  assert.match(vacio, /Fathom no los identificó/);
  const largo = mensajeSlack({ recording_id: 9, default_summary: { markdown_formatted: "palabra ".repeat(2000) } });
  for (const b of largo.blocks) if (b.text?.type === "mrkdwn") assert.ok(b.text.text.length <= 3000);
});
