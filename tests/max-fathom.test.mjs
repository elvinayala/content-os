import assert from "node:assert/strict";
import { test } from "node:test";

import { clienteDeReunion, esOnboarding, transcripcionCorta } from "../lib/fathom.ts";

test("onboarding: por título o porque la grabó Jessica", () => {
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Onboarding · Biowest Laboratory" }), true);
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Sesión de bienvenida con Iván" }), true);
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Reunión", recorded_by: { email: "Jessica@levelupmediapr.net" } }), true);
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Daily de ventas", recorded_by: { email: "elvin@levelupmediapr.net" } }), false);
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
