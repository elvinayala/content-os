import assert from "node:assert/strict";
import { test } from "node:test";

import { estadoActividad, estancado, leerTimelines, normalizarTelefono, ordenEntre, SEMILLA, telefonoLegible } from "../lib/leads/reglas.ts";

test("teléfonos a dígitos con código de país", () => {
  assert.equal(normalizarTelefono("(787) 555-1234"), "17875551234");
  assert.equal(normalizarTelefono("+1 787 555 1234"), "17875551234");
  assert.equal(normalizarTelefono("17875551234@s.whatsapp.net"), "17875551234");
  assert.equal(normalizarTelefono("."), null);
  assert.equal(normalizarTelefono(null), null);
  assert.equal(telefonoLegible("17875551234"), "+1 (787) 555-1234");
});

test("estado de la próxima actividad (puntito de la tarjeta)", () => {
  const ahora = new Date("2026-09-26T15:00:00Z"); // 11 AM PR
  assert.equal(estadoActividad(null, ahora), "ninguna");
  assert.equal(estadoActividad("2026-09-26T13:00:00Z", ahora), "vencida");
  assert.equal(estadoActividad("2026-09-26T20:00:00Z", ahora), "hoy");
  assert.equal(estadoActividad("2026-09-28T20:00:00Z", ahora), "futura");
  assert.equal(estadoActividad("2026-09-20T20:00:00Z", ahora), "vencida");
});

test("estancado y orden entre tarjetas", () => {
  const ahora = new Date("2026-09-26T12:00:00Z");
  assert.equal(estancado("2026-09-20T12:00:00Z", 3, ahora), true);
  assert.equal(estancado("2026-09-25T12:00:00Z", 3, ahora), false);
  assert.equal(ordenEntre(null, null), 1000);
  assert.equal(ordenEntre(1000, 2000), 1500);
  assert.equal(ordenEntre(null, 1000), 0);
});

test("semillas: las marcas no se mezclan y no hay etapas de cierre", () => {
  assert.ok(SEMILLA.level_up.length >= 5);
  for (const e of [...SEMILLA.level_up, ...SEMILLA.ai_borinquen]) {
    assert.ok(!e.etapas.some((x) => /closed|cerrad|ganad|perdid/i.test(x)), e.nombre);
  }
});

test("Timelines: mensaje entrante anidado", () => {
  const ev = leerTimelines({
    event_type: "message:received:new",
    chat: { chat_id: 998877, full_name: "María Cliente", phone: "+1 787 555 1234", is_group: false },
    message: { message_uid: "abc-1", text: "Hola, quiero info", direction: "received", sender: { phone: "+17875551234", full_name: "María Cliente" } },
    whatsapp_account: { id: "17871110000@s.whatsapp.net", phone: "+17871110000", full_name: "Level Up" },
  });
  assert.equal(ev.direccion, "entrante");
  assert.equal(ev.telefono, "17875551234");
  assert.equal(ev.cuenta, "17871110000");
  assert.equal(ev.nombre, "María Cliente");
  assert.equal(ev.mensajeId, "abc-1");
  assert.equal(ev.chatId, "998877");
  assert.equal(ev.texto, "Hola, quiero info");
});

test("Timelines: saliente plano y nunca el número propio como cliente", () => {
  const ev = leerTimelines({
    event_type: "message:sent:new",
    data: { chat_id: 5, chat_name: "Pedro", chat_phone: "7875550000", text: "Te llamo ahora", from_me: true, message_uid: "x9", whatsapp_account_id: "17871110000" },
  });
  assert.equal(ev.direccion, "saliente");
  assert.equal(ev.telefono, "17875550000");
  assert.equal(ev.cuenta, "17871110000");
  const propio = leerTimelines({ event_type: "message:sent:new", data: { chat_phone: "17871110000", whatsapp_account_id: "17871110000", text: "x" } });
  assert.equal(propio.telefono, null);
});

test("Timelines: grupos se detectan", () => {
  const ev = leerTimelines({ event_type: "message:received:new", chat: { chat_id: 1, phone: "120363@g.us", name: "Grupo" }, message: { text: "hola" } });
  assert.equal(ev.esGrupo, true);
});
