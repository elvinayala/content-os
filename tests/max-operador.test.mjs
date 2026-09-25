import assert from "node:assert/strict";
import { test } from "node:test";

import { aprobadores, okConCambio, encabezadoBuzon, esEquipo, parsearDecision, slugCliente, textoAprobacion, textoParaCliente, validarDecision } from "../lib/max/operador.ts";

test("decisiones en #max-aprobaciones: ok / no con corrección / publica", () => {
  assert.deepEqual(parsearDecision("ok 12"), { accion: "aprobar", id: 12, nota: "" });
  assert.deepEqual(parsearDecision("Dale #7 pero sin emojis"), { accion: "aprobar", id: 7, nota: "pero sin emojis" });
  assert.deepEqual(parsearDecision("no 12 cambia el gancho, muy genérico"), { accion: "rechazar", id: 12, nota: "cambia el gancho, muy genérico" });
  assert.deepEqual(parsearDecision("publica 30"), { accion: "publicar", id: 30, nota: "" });
  assert.deepEqual(parsearDecision("<@U0MAX> publícalo 30"), { accion: "publicar", id: 30, nota: "" });
  assert.deepEqual(parsearDecision("max, sí 4"), { accion: "aprobar", id: 4, nota: "" });
  // Conversación normal no es decisión (Max la atiende como pedido).
  assert.equal(parsearDecision("ok, pero el canal de Iván es #ivan-reyes"), null);
  assert.equal(parsearDecision("¿cómo va la 12?"), null);
  assert.equal(parsearDecision("nota 12"), null);
});

test("solo Elvin y Carilin aprueban (ampliable por env)", () => {
  const a = aprobadores(undefined, "UCEO");
  assert.equal(a.UCEO, "elvin");
  assert.equal(a.U07V7MVJ18B, "carilin");
  assert.equal(Object.keys(a).length, 2);
  assert.equal(aprobadores("UX=carilin,UY=Aure", "UCEO").UY, "aure");
});

test("validar: 'publica' solo sirve para campañas; nada se decide dos veces", () => {
  assert.equal(validarDecision({ accion: "publicar", id: 1, nota: "" }, { tipo: "plan", estado: "esperando" }).ok, false);
  assert.equal(validarDecision({ accion: "publicar", id: 1, nota: "" }, { tipo: "publicar", estado: "esperando" }).ok, true);
  assert.equal(validarDecision({ accion: "publicar", id: 1, nota: "" }, { tipo: "publicar", estado: "ejecutado" }).ok, false);
  assert.equal(validarDecision({ accion: "publicar", id: 1, nota: "" }, { tipo: "campana", estado: "esperando" }).ok, false, "montar ≠ publicar");
  assert.equal(validarDecision({ accion: "publicar", id: 1, nota: "" }, { tipo: "publicar", estado: "aprobado" }).ok, false, "no se autoriza dos veces");
  assert.equal(validarDecision({ accion: "aprobar", id: 1, nota: "" }, { tipo: "mensaje", estado: "enviado" }).ok, false);
  assert.equal(validarDecision({ accion: "aprobar", id: 1, nota: "" }, null).ok, false);
});

test("el aviso de aprobación dice cómo decidir; al cliente no le llegan notas internas", () => {
  const t = textoAprobacion({ id: 9, tipo: "mensaje", cliente: "Biowest", titulo: "Respuesta a Iván", contenido: "Hola Iván, …" });
  assert.match(t, /#9 · 💬 Respuesta al cliente · Biowest/);
  assert.match(t, /ok 9/);
  assert.match(t, /no 9/);
  assert.match(textoAprobacion({ id: 3, tipo: "publicar", cliente: "X", titulo: "", contenido: "c" }), /publica 3/);
  assert.equal(textoParaCliente("[interno] ojo con el precio\nHola Iván, aquí va."), "Hola Iván, aquí va.");
});

test("equipo vs cliente en el canal del cliente", () => {
  assert.equal(esEquipo({ id: "U1", email: "jessica@levelupmediapr.net" }), true);
  assert.equal(esEquipo({ id: "U2", email: "reyeivan@gmail.com" }), false);
  assert.equal(esEquipo({ id: "U3", email: "x@gmail.com" }, ["U3"]), true);
  assert.equal(esEquipo({ id: "B", esBot: true }), true);
  // Lo que manda de verdad: los clientes son invitados de Slack (Biowest, 24/sep), sin correo visible.
  assert.equal(esEquipo({ id: "U0B8U6PH2JD", email: null, invitado: true }), false);
  assert.equal(esEquipo({ id: "U07V7MVJ18B", email: null, invitado: false }), true);
});

test("slug y encabezado del buzón", () => {
  assert.equal(slugCliente("Iván Reyes · Biowest Laboratory"), "ivan-reyes-biowest-laboratory");
  assert.equal(encabezadoBuzon("cliente", { cliente: "biowest", canal: "C1", hilo: "1.2" }), "[Slack cliente · cliente biowest · canal C1 · hilo 1.2]");
});

test("ok con cambio vs ok tal cual", () => {
  assert.equal(okConCambio(""), false);
  assert.equal(okConCambio("perfecto!"), false);
  assert.equal(okConCambio("👍"), false);
  assert.equal(okConCambio("pero quita el precio del final"), true);
  assert.equal(okConCambio("cambia el gancho"), true);
});
