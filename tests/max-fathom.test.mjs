import assert from "node:assert/strict";
import { test } from "node:test";

import { clienteDeReunion, esDeCloser, esOnboarding, transcripcionCorta } from "../lib/fathom.ts";

test("onboarding = solo las llamadas etiquetadas de onboarding", () => {
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Onboarding · Biowest Laboratory" }), true);
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Sesión de bienvenida con Iván" }), true);
  // Grabada por Jessica pero sin la etiqueta: no (Elvin, 24/sep).
  const externo = [{ name: "Iván", email: "i@gmail.com", is_external: true }];
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Seguimiento mensual", recorded_by: { email: "jessica@levelupmediapr.net" }, calendar_invitees: externo }), false);
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Llamada de venta · Roger", recorded_by: { email: "roger.arteaga@levelupmediapr.net" } }), false);
});

test("cliente de la reunión: externos y nombre limpio", () => {
  const r = {
    recording_id: 1,
    meeting_title: "Onboarding - Biowest Laboratory | Level Up Media",
    calendar_invitees: [
      { name: "Jessica", email: "jessica@levelupmediapr.net", is_external: false },
      { name: "Iván Reyes", email: "ReyeIvan@gmail.com", is_external: true },
    ],
  };
  assert.deepEqual(clienteDeReunion(r), { nombre: "Biowest Laboratory", emails: ["reyeivan@gmail.com"] });
  assert.equal(clienteDeReunion({ recording_id: 2, meeting_title: "Onboarding", calendar_invitees: [{ name: "Ana Soto", email: "ana@x.com", is_external: true }] }).nombre, "Ana Soto");
});

test("transcripción compacta con tope", () => {
  const r = { recording_id: 1, transcript: [{ speaker: { display_name: "Jessica" }, text: "Hola" }, { speaker: { display_name: "Iván" }, text: "x".repeat(50) }] };
  assert.match(transcripcionCorta(r), /^Jessica: Hola\nIván: x+$/);
  assert.match(transcripcionCorta(r, 10), /sigue en Fathom/);
});

test("llamadas de cierre: solo las que grabaron Roger o Laura", () => {
  assert.equal(esDeCloser({ recording_id: 1, recorded_by: { email: "Roger.Arteaga@levelupmediapr.net" } }), true);
  assert.equal(esDeCloser({ recording_id: 2, recorded_by: { email: "levelupmediapr@gmail.com" } }), true);
  assert.equal(esDeCloser({ recording_id: 3, recorded_by: { email: "jessica@levelupmediapr.net" } }), false);
  assert.equal(esDeCloser({ recording_id: 4, recorded_by: null }), false);
});
