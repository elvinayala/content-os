import assert from "node:assert/strict";
import { test } from "node:test";

import { digitosTelefono, huella, leerExtraccion, listoParaPublicar, plantilla, responsables, sinRepetir, telefonoBonito, telefonoSlack } from "../lib/encuestas/reglas.ts";

test("teléfono: formato fijo, sin doble + ni dígitos de más", () => {
  assert.equal(telefonoBonito("+19397321680"), "+1 939-732-1680");
  assert.equal(telefonoBonito("19397321680"), "+1 939-732-1680");
  assert.equal(telefonoBonito("9397321680"), "+1 939-732-1680");
  assert.equal(telefonoBonito("++193973216800"), "+1 939-732-1680"); // el caso de Carilin
  assert.equal(telefonoSlack("+1 939 732 1680"), "<tel:+19397321680|+1 939-732-1680>");
  assert.equal(digitosTelefono("abc"), null);
  assert.equal(telefonoSlack(null), "—");
});

test("responsables: por destinatario; el escalado a asesor va a las dos; sin nada → Carilin", () => {
  assert.deepEqual(responsables([{ tipo: "alerta", destinatario: "CARILIN", at: "" }]), ["carilin"]);
  assert.deepEqual(responsables([{ tipo: "alerta", destinatario: "JESSICA", at: "" }]), ["jessica"]);
  assert.deepEqual(responsables([{ tipo: "asesor", at: "" }]), ["jessica", "carilin"]);
  assert.deepEqual(responsables([{ tipo: "alerta", destinatario: "", at: "" }]), ["carilin"]);
});

test("espera: 5 min sin avisos, o 1 min después de finalizar; solo 'finalizar' no publica", () => {
  const t0 = new Date("2026-09-28T18:25:00Z");
  const ev = [
    { tipo: "alerta", mensaje: "a", at: "2026-09-28T18:25:00Z" },
    { tipo: "alerta", mensaje: "b", at: "2026-09-28T18:25:36Z" },
  ];
  assert.equal(listoParaPublicar(ev, new Date(t0.getTime() + 3 * 60_000)), false);
  assert.equal(listoParaPublicar(ev, new Date(t0.getTime() + 6 * 60_000)), true);
  const conFin = [...ev, { tipo: "finalizar", at: "2026-09-28T18:26:00Z" }];
  assert.equal(listoParaPublicar(conFin, new Date("2026-09-28T18:26:30Z")), false);
  assert.equal(listoParaPublicar(conFin, new Date("2026-09-28T18:27:05Z")), true);
  assert.equal(listoParaPublicar([{ tipo: "finalizar", at: "2026-09-28T18:26:00Z" }], new Date("2026-09-29T00:00:00Z")), false);
});

test("sin texto repetido", () => {
  assert.equal(sinRepetir("Espero el proceso. Espero el proceso."), "Espero el proceso.");
  assert.equal(sinRepetir("Bien. Gracias."), "Bien. Gracias.");
});

test("extracción tolerante; pedir no-IA sube a prioridad alta", () => {
  const x = leerExtraccion('Aquí va: {"cliente":"Paula Quiñones","tipo":"encuesta 30 días","calificacion":"Regular · 4/10","comentario":"Mejoraría el diseño. Mejoraría el diseño.","quiereLlamada":false,"accion":"Revisar estrategia","prioridad":"media","noContactarIA":true,"preferencia":"por audio, no IA"}');
  assert.equal(x.tipo, "Encuesta 30 días");
  assert.equal(x.comentario, "Mejoraría el diseño.");
  assert.equal(x.quiereLlamada, false);
  assert.equal(x.prioridad, "alta");
  assert.equal(leerExtraccion("sin json"), null);
  assert.equal(leerExtraccion('{"tipo":"cualquiera","prioridad":"x","quiereLlamada":"no"}').tipo, "Otro");
});

test("plantilla fija: cada campo, mención real con @, nunca RUT/ID", () => {
  const x = leerExtraccion('{"cliente":"Paula Quiñones","negocio":"Paula Beauty","tipo":"Encuesta 30 días","calificacion":"Regular · 4/10","comentario":"Mejoraría el diseño de anuncios","quiereLlamada":false,"accion":"Revisar la estrategia de leads","prioridad":"media","noContactarIA":false}');
  const t = plantilla({ x, telefono: "++193973216800", responsables: ["carilin"] });
  for (const campo of ["Cliente / Negocio:* Paula Quiñones · Paula Beauty", "<tel:+19397321680|+1 939-732-1680>", "Tipo:* Encuesta 30 días", "Calificación / NPS:* Regular · 4/10", '"Mejoraría el diseño de anuncios"', "¿Quiere llamada?:* No", "prioridad 🟡 Media", "<@U07V7MVJ18B>"]) assert.ok(t.includes(campo), campo);
  assert.ok(!/RUT|\+\+|Destinatario/.test(t));
  const up = plantilla({ x: { ...x, noContactarIA: true, prioridad: "alta", preferencia: "que le hablen por audio" }, telefono: "19397321680", responsables: ["jessica", "carilin"], actualizacion: true, iaApagada: true });
  assert.ok(up.startsWith("🔄"));
  assert.ok(up.includes("No contactar por IA:* que le hablen por audio. El agente ya no le contesta"));
  assert.ok(up.includes("<@U08SN35L2UX> <@U07V7MVJ18B>"));
  assert.notEqual(huella(x), huella({ ...x, quiereLlamada: true }));
});
