import assert from "node:assert/strict";
import { test } from "node:test";

import { clienteDeReunion, esOnboarding, transcripcionCorta } from "../lib/fathom.ts";

test("onboarding: por título, o grabada por Jessica con un cliente externo", () => {
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Onboarding · Biowest Laboratory" }), "titulo");
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Sesión de bienvenida con Iván" }), "titulo");
  const externo = [{ name: "Iván", email: "i@gmail.com", is_external: true }];
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Reunión", recorded_by: { email: "Jessica@levelupmediapr.net" }, calendar_invitees: externo }), "pm");
  // Una reunión interna de Jessica (sin externos) no despierta a Max.
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Daily PM", recorded_by: { email: "jessica@levelupmediapr.net" }, calendar_invitees: [] }), null);
  assert.equal(esOnboarding({ recording_id: 1, meeting_title: "Daily de ventas", recorded_by: { email: "elvin@levelupmediapr.net" }, calendar_invitees: externo }), null);
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

test("canal de resúmenes: Elvin y los closers Roger y Laura, nadie más", async () => {
  const { vaAlCanalDeLlamadas } = await import("../lib/fathom.ts");
  const llamada = (grabo, invitados = []) => ({ recording_id: 1, recorded_by: { email: grabo }, calendar_invitees: invitados });
  assert.equal(vaAlCanalDeLlamadas(llamada("roger.arteaga@levelupmediapr.net")), true, "Roger");
  assert.equal(vaAlCanalDeLlamadas(llamada("levelupmediapr@gmail.com")), true, "Laura (cuenta Level Up Media)");
  assert.equal(vaAlCanalDeLlamadas(llamada("elvin@levelupmediapr.net")), true, "Elvin");
  assert.equal(vaAlCanalDeLlamadas(llamada("jessica@levelupmediapr.net")), false, "Jessica no (va a Max)");
  assert.equal(vaAlCanalDeLlamadas(llamada("juan.david@levelupmediapr.net")), false, "Juan David no");
  // Grabada por otra cuenta del equipo, pero Roger es el anfitrión en la invitación.
  assert.equal(vaAlCanalDeLlamadas(llamada("otro@levelupmediapr.net", [{ email: "Roger.Arteaga@levelupmediapr.net", is_external: false }, { email: "lead@gmail.com", is_external: true }])), true);
  // Un prospecto externo con un correo de la lista no cuela una llamada ajena.
  assert.equal(vaAlCanalDeLlamadas(llamada("otro@levelupmediapr.net", [{ email: "levelupmediapr@gmail.com", is_external: true }])), false);
});
