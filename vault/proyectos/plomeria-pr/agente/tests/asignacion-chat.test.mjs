import { test } from "node:test";
import assert from "node:assert/strict";
import { estadoAsignacion } from "../dist/asignacion.js";
import { agregarA, marcarLeidosEn, sinLeerEn, totalSinLeerEquipoEn, conversacionesEn, limpiarTexto, MAX_TEXTO } from "../dist/mensajes.js";

test("asignación: sin plomero, con plomero que NO le aparece en su app, y en su app", () => {
  assert.deepEqual(estadoAsignacion({ plomeroId: "" }, []), { clave: "sin-plomero", plomeroId: "" });
  assert.deepEqual(estadoAsignacion({ plomeroId: "" }, [{ id: "OF-1", estado: "expirada" }]), { clave: "sin-plomero", plomeroId: "" });
  // pasó con R-0009: el trabajo decía "Luis" pero sin oferta aceptada por él, la app no se lo mostraba
  assert.deepEqual(estadoAsignacion({ plomeroId: "luis" }, [{ id: "OF-1", estado: "expirada" }]), { clave: "no-le-aparece", plomeroId: "luis" });
  assert.deepEqual(estadoAsignacion({ plomeroId: "luis" }, [{ id: "OF-1", estado: "expirada" }, { id: "OF-2", estado: "asignada-manual", aceptadoPor: "luis" }]), { clave: "en-su-app", plomeroId: "luis", ofertaId: "OF-2" });
  assert.equal(estadoAsignacion({ plomeroId: "" }, [{ id: "OF-3", estado: "aceptada", aceptadoPor: "edgar" }]).plomeroId, "edgar");
});

test("chat: un mensaje vacío no entra, el texto se limpia y se corta", () => {
  assert.ok("error" in agregarA([], { plomeroId: "luis", de: "plomero", autor: "Luis", texto: "   " }));
  assert.equal(limpiarTexto("  hola   \n\n\n\n  que tal "), "hola \n\n que tal");
  assert.equal(limpiarTexto("x".repeat(5000)).length, MAX_TEXTO);
  const r = agregarA([], { plomeroId: "luis", de: "equipo", autor: "Aure", texto: "Te asigné R-0009", trabajo: "R-0009" }, "2026-10-12T15:00:00Z");
  assert.equal(r.mensaje.id, "M-00001"); assert.equal(r.mensaje.trabajo, "R-0009"); assert.equal(r.lista.length, 1);
});

test("chat: cada lado lee lo que escribió el otro; los no leídos y las conversaciones salen bien", () => {
  let l = [];
  const add = (plomeroId, de, texto, en) => { l = agregarA(l, { plomeroId, de, autor: de === "equipo" ? "Aure" : plomeroId, texto }, en).lista; };
  add("luis", "plomero", "No me abre la app", "2026-10-12T10:00:00Z");
  add("luis", "plomero", "¿Me ayudan?", "2026-10-12T10:01:00Z");
  add("edgar", "plomero", "Subí el recibo", "2026-10-12T11:00:00Z");
  add("luis", "equipo", "Ya lo reviso", "2026-10-12T10:05:00Z");
  assert.equal(sinLeerEn(l, "luis", "equipo"), 2); assert.equal(sinLeerEn(l, "luis", "plomero"), 1); assert.equal(totalSinLeerEquipoEn(l), 3);
  const c = conversacionesEn(l); assert.deepEqual(c.map((x) => x.plomeroId), ["edgar", "luis"]); assert.equal(c[1].sinLeerEquipo, 2);
  const r = marcarLeidosEn(l, "luis", "equipo"); assert.equal(r.cambiados, 2); l = r.lista;
  assert.equal(sinLeerEn(l, "luis", "equipo"), 0); assert.equal(sinLeerEn(l, "luis", "plomero"), 1, "lo del equipo sigue sin leer para el plomero");
  assert.equal(sinLeerEn(l, "edgar", "equipo"), 1, "no toca los de otro plomero");
  assert.equal(marcarLeidosEn(l, "luis", "equipo").cambiados, 0);
});

test("chat con fotos: una foto sola vale como mensaje; solo entran nombres de archivo del chat; máximo 4", async () => {
  const { esFotoChat } = await import("../dist/mensajes.js");
  assert.ok(esFotoChat("chat-luis-saez-mgh12ab-1.jpg"));
  for (const malo of ["../../etc/passwd", "R-0001-despues-1.jpg", "chat-x.jpg", "chat-luis-m1-1.png", "", null, 5]) assert.equal(esFotoChat(malo), false, String(malo));
  assert.ok("error" in agregarA([], { plomeroId: "luis", de: "plomero", autor: "Luis", texto: "", fotos: [] }));
  assert.ok("error" in agregarA([], { plomeroId: "luis", de: "plomero", autor: "Luis", texto: "", fotos: ["../x.jpg"] }), "una ruta rara no cuenta como foto");
  const solo = agregarA([], { plomeroId: "luis", de: "plomero", autor: "Luis", texto: "", fotos: ["chat-luis-m1-1.jpg"] });
  assert.deepEqual(solo.mensaje.fotos, ["chat-luis-m1-1.jpg"]); assert.equal(solo.mensaje.texto, "");
  const muchas = agregarA([], { plomeroId: "luis", de: "equipo", autor: "Aure", texto: "mira", fotos: [1, 2, 3, 4, 5, 6].map((n) => `chat-luis-m1-${n}.jpg`) });
  assert.equal(muchas.mensaje.fotos.length, 4);
});
