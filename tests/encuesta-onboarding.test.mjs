import assert from "node:assert/strict";
import test from "node:test";

import { problemaConfig, validar, visible } from "../lib/formularios/reglas.ts";
import { SEMILLAS } from "../lib/formularios/semillas.ts";
import { evaluar, linkEncuesta, telefonoWhatsApp, textoAviso, textoWhatsApp, tocaEnviar } from "../lib/onboarding/encuesta-reglas.ts";

const semilla = SEMILLAS.find((s) => s.slug === "onboarding-experiencia");
const bien = { tuvo: "Sí", nota: "10", claro: "Sí, todo claro", cumplio: "Sí, todo lo que esperaba", incomodo: "No" };

test("la encuesta es un formulario válido y no pide nada de más a quien sí tuvo su onboarding", () => {
  assert.ok(semilla);
  assert.equal(problemaConfig(semilla.config), null);
  assert.equal(semilla.accion, "encuesta-onboarding-lu");
  assert.deepEqual(validar(semilla.config.preguntas, bien), {});
  // "mejora" es opcional y "que" solo sale si algo no le gustó
  const ids = semilla.config.preguntas.filter((p) => visible(p, bien)).map((p) => p.id);
  assert.deepEqual(ids, ["tuvo", "nota", "claro", "cumplio", "incomodo", "mejora"]);
});

test("si no tuvo el onboarding solo se le pregunta qué pasó", () => {
  const r = { tuvo: "No", motivo: "Nadie me atendió" };
  assert.deepEqual(semilla.config.preguntas.filter((p) => visible(p, r)).map((p) => p.id), ["tuvo", "motivo"]);
  assert.deepEqual(validar(semilla.config.preguntas, r), {});
});

test("todo bien = verde; detalles = ámbar; algo importante = rojo", () => {
  assert.equal(evaluar(bien).nivel, "verde");
  assert.equal(evaluar({ ...bien, nota: "9" }).nivel, "verde");
  assert.equal(evaluar({ ...bien, nota: "8" }).nivel, "ambar");
  assert.equal(evaluar({ ...bien, cumplio: "Casi todo, faltó algo" }).nivel, "ambar");
  assert.equal(evaluar({ ...bien, claro: "Más o menos" }).nivel, "ambar");
  assert.equal(evaluar({ ...bien, nota: "6" }).nivel, "rojo");
  assert.equal(evaluar({ ...bien, cumplio: "No, faltaron cosas importantes" }).nivel, "rojo");
  assert.equal(evaluar({ ...bien, claro: "No, me quedaron dudas" }).nivel, "rojo");
  const raro = evaluar({ ...bien, incomodo: "Sí", que: "Llegó tarde y no sabía mi caso" });
  assert.equal(raro.nivel, "rojo");
  assert.match(raro.motivos.join(" "), /Llegó tarde/);
});

test("no tuvo el onboarding = rojo, y 'nadie me atendió' se dice claro", () => {
  const e = evaluar({ tuvo: "No", motivo: "Nadie me atendió" });
  assert.equal(e.nivel, "rojo");
  assert.equal(e.tuvo, false);
  assert.match(e.motivos[0], /NADIE/);
  assert.equal(evaluar({ tuvo: "No", motivo: "Tuve un imprevisto" }).nivel, "rojo");
});

test("cuándo se manda: 15 min después, hasta 4 h, de 8 AM a 8 PM de PR", () => {
  const fin = "2026-10-12T15:00:00Z"; // 11:00 AM PR
  assert.equal(tocaEnviar(fin, new Date("2026-10-12T15:10:00Z")).motivo, "pronto");
  assert.equal(tocaEnviar(fin, new Date("2026-10-12T15:16:00Z")).ok, true);
  assert.equal(tocaEnviar(fin, new Date("2026-10-12T19:01:00Z")).motivo, "tarde");
  // terminó 7:30 PM PR → 8:00 PM ya no se manda, pero sale a las 8 AM del día siguiente
  assert.equal(tocaEnviar("2026-10-12T23:30:00Z", new Date("2026-10-13T00:05:00Z")).motivo, "horario");
  assert.equal(tocaEnviar("2026-10-12T23:30:00Z", new Date("2026-10-12T23:50:00Z")).ok, true);
  assert.equal(tocaEnviar("2026-10-12T23:30:00Z", new Date("2026-10-13T12:05:00Z")).ok, true); // 8:05 AM PR
  assert.equal(tocaEnviar("2026-10-12T23:30:00Z", new Date("2026-10-13T16:00:00Z")).motivo, "tarde"); // 12 PM: ya pasaron > 14 h
  // una llamada de media mañana no se manda al otro día
  assert.equal(tocaEnviar("2026-10-12T15:00:00Z", new Date("2026-10-13T12:05:00Z")).motivo, "tarde");
});

test("el WhatsApp es en tuteo, nombra a quien atendió y lleva el link con la referencia", () => {
  const link = linkEncuesta("ab12cd34", "https://levelupmedia.vercel.app/");
  assert.equal(link, "https://levelupmedia.vercel.app/f/onboarding-experiencia?origen=ob-ab12cd34");
  const t = textoWhatsApp({ nombre: "edgar lugo", host: "Jessica", link });
  assert.match(t, /^Hola Edgar 👋/);
  assert.match(t, /onboarding con Jessica/);
  assert.ok(t.includes(link));
  assert.doesNotMatch(t, /\b(tenés|querés|vos)\b/i);
  assert.match(textoWhatsApp({ nombre: "", host: "", link }), /con nuestro equipo/);
});

test("teléfonos: 10 dígitos de PR llevan el 1; basura no pasa", () => {
  assert.equal(telefonoWhatsApp("+1 939-420-0222"), "19394200222");
  assert.equal(telefonoWhatsApp("(787) 555-0100"), "17875550100");
  assert.equal(telefonoWhatsApp("123"), null);
  assert.equal(telefonoWhatsApp(null), null);
});

test("el aviso es corto y marca lo que no salió bien", () => {
  const ok = textoAviso({ nombre: "Edgar Lugo", negocio: "Warranty Plus", host: "Jessica", ev: evaluar(bien) });
  assert.match(ok, /^🟢 Onboarding de Edgar Lugo \(Warranty Plus\) con Jessica: 10\/10/);
  assert.doesNotMatch(ok, /⚠️/);
  const mal = textoAviso({ nombre: "Ana", ev: evaluar({ ...bien, nota: "5" }), mejora: "Más tiempo" });
  assert.match(mal, /^🔴/);
  assert.match(mal, /⚠️ nota 5\/10/);
  assert.match(mal, /💬 «Más tiempo»/);
});
