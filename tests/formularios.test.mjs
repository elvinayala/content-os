import assert from "node:assert/strict";
import test from "node:test";

import { celdaCsv, conNombre, errorDe, idNuevo, limpiar, linkPublico, problemaConfig, slugDe, temaDe, tintaSobre, validar, visible } from "../lib/formularios/reglas.ts";
import { SEMILLAS } from "../lib/formularios/semillas.ts";

const onboarding = SEMILLAS.find((s) => s.slug === "onboarding-level-up");
const encuesta = SEMILLAS.find((s) => s.slug === "encuesta-level-up");

test("las semillas de Typeform son formularios válidos", () => {
  for (const s of SEMILLAS) assert.equal(problemaConfig(s.config), null, s.slug);
  // El onboarding conserva las preguntas que usa la ficha de Pulse y el botón de Calendly del Typeform.
  const ids = onboarding.config.preguntas.map((p) => p.id);
  for (const id of ["nombre", "telefono", "email", "negocio"]) assert.ok(ids.includes(id));
  assert.match(onboarding.config.gracias.boton.url, /calendly\.com\/jessica-levelupmediapr\/onboarding/);
  assert.equal(onboarding.config.preguntas.find((p) => p.id === "industria").etiquetas.Electric, "Electricidad");
});

test("encuesta: '¿qué no ha ido bien?' solo aparece si contestó No", () => {
  const problema = encuesta.config.preguntas.find((p) => p.id === "problema");
  assert.equal(visible(problema, { contenido: "Sí" }), false);
  assert.equal(visible(problema, { contenido: "No" }), true);
  const base = { email: "a@b.com", telefono: "787 555 1234" };
  assert.deepEqual(validar(encuesta.config.preguntas, { ...base, contenido: "Sí" }), {});
  assert.ok(validar(encuesta.config.preguntas, { ...base, contenido: "No" }).problema);
  assert.ok(validar(encuesta.config.preguntas, { ...base, contenido: "Tal vez" }).contenido);
});

test("escala y sí/no validan contra sus opciones", () => {
  const escala = { id: "nps", titulo: "x", tipo: "escala", requerida: true };
  assert.equal(errorDe(escala, { nps: "10" }), null);
  assert.ok(errorDe(escala, { nps: "11" }));
  const sn = { id: "ok", titulo: "x", tipo: "si-no", requerida: false };
  assert.equal(errorDe(sn, {}), null);
  assert.equal(errorDe(sn, { ok: "No" }), null);
});

test("limpiar guarda solo lo visible y con su forma", () => {
  const r = limpiar(encuesta.config.preguntas, { email: "a@b.com", telefono: "787", contenido: "Sí", problema: "no debería quedar", extra: "x" });
  assert.deepEqual(Object.keys(r).sort(), ["contenido", "email", "telefono"]);
});

test("pantalla final con {nombre}", () => {
  assert.equal(conNombre("¡Listo, {nombre}! Agenda", { nombre: "María Rivera" }), "¡Listo, María! Agenda");
  assert.equal(conNombre("¡Listo, {nombre}! Agenda", {}), "¡Listo! Agenda");
});

test("problemas del editor", () => {
  const base = { bienvenida: { titulo: "Hola" }, gracias: { titulo: "Gracias" }, preguntas: [{ id: "a", titulo: "A", tipo: "texto", requerida: true }] };
  assert.equal(problemaConfig(base), null);
  assert.match(problemaConfig({ ...base, preguntas: [] }), /al menos una/);
  assert.match(problemaConfig({ ...base, preguntas: [{ id: "a", titulo: "A", tipo: "opcion", requerida: true, opciones: [" "] }] }), /opciones/);
  assert.match(problemaConfig({ ...base, preguntas: [...base.preguntas, { id: "a", titulo: "B", tipo: "texto", requerida: true }] }), /repetido/);
  assert.match(problemaConfig({ ...base, preguntas: [{ id: "b", titulo: "B", tipo: "texto", requerida: true, si: { id: "a", valor: "x" } }, ...base.preguntas] }), /anterior/);
  assert.match(problemaConfig({ ...base, gracias: { titulo: "G", boton: { texto: "Ir", url: "calendly" } } }), /link/);
});

test("slugs, ids, links, temas y CSV", () => {
  assert.equal(slugDe("Encuesta Post-Venta · Ñandú"), "encuesta-post-venta-nandu");
  assert.equal(idNuevo(["p1", "p2", "nombre"]), "p4");
  assert.equal(linkPublico({ slug: "onboarding-level-up", marca: "level_up" }), "https://levelupmedia.vercel.app");
  assert.equal(linkPublico({ slug: "encuesta-level-up", marca: "level_up" }), "https://levelupmedia.vercel.app/f/encuesta-level-up");
  assert.match(linkPublico({ slug: "x", marca: "ai_borinquen" }), /\/f\/x$/);
  assert.equal(temaDe({ tema: "level-up" }).acento, "#f5ce1a");
  assert.equal(temaDe({ tema: "level-up", logo: "" }).logo, undefined);
  assert.equal(tintaSobre("#ffffff"), "#0b0b0b");
  assert.equal(tintaSobre("#1d4ed8"), "#ffffff");
  assert.equal(celdaCsv('dice "hola"; adiós\nok'), '"dice ""hola""; adiós ok"');
});

test("quién maneja los formularios", async () => {
  const { puedeFormularios } = await import("../lib/formularios/reglas.ts");
  assert.ok(puedeFormularios({ rol: "editor", email: "aure@levelupmediapr.net" }));
  assert.ok(puedeFormularios({ rol: "miembro", email: "Jessica@levelupmediapr.net" }));
  assert.ok(puedeFormularios({ rol: "miembro", email: "nahueltissera46@gmail.com" }));
  assert.equal(puedeFormularios({ rol: "miembro", email: "roger.arteaga@levelupmediapr.net" }), false);
});
