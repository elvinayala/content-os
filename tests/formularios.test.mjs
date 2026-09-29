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

test("aplicación al Sistema Operador: nace cerrada, guarda parciales y no promete nada", () => {
  const s = SEMILLAS.find((x) => x.slug === "aplicar-sistema");
  assert.ok(s);
  assert.equal(s.activo, false); // se abre cuando Elvin apruebe
  assert.equal(s.config.parciales, true);
  assert.equal(s.accion, "ninguna");
  const ids = s.config.preguntas.map((p) => p.id);
  for (const id of ["nombre", "telefono", "email", "facturacion", "tipo", "frena", "inversion"]) assert.ok(ids.includes(id), id);
  assert.equal(s.config.preguntas.find((p) => p.id === "frena").opciones.length, 6); // los 6 sistemas
  const todo = JSON.stringify(s.config).toLowerCase();
  assert.doesNotMatch(todo, /gratis|garantiz/);
  assert.deepEqual(
    validar(s.config.preguntas, { nombre: "Ana", telefono: "787 555 1234", email: "a@b.com", negocio: "x", tipo: "Coaching o mentoría", facturacion: "$10,000 – $30,000", ticket: "$2,000 – $5,000", equipo: "2 a 5", frena: ["IA: hago a mano cosas que se repiten todas las semanas"], arreglar: "x", meta: "x", porque: "x", tiempo: "Sí", inversion: "Sí, tengo el capital" }),
    {},
  );
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

test("agenda de closers en 2 pasos: válida, a medias y pre-llenado de Calendly", async () => {
  const { SEMILLAS_AGENDA } = await import("../lib/formularios/semillas-agenda.ts");
  const { prefillCalendly, tieneContacto, telefonoE164, resumenRespuestas } = await import("../lib/formularios/reglas.ts");
  assert.equal(SEMILLAS_AGENDA.length, 2);
  for (const s of SEMILLAS_AGENDA) {
    assert.equal(problemaConfig(s.config), null, s.slug);
    assert.equal(s.accion, "leads-closers-lu");
    assert.ok(s.config.parciales);
    // Llena a1…a10 una vez cada una (las 10 preguntas del evento de Calendly).
    const slots = s.config.preguntas.map((p) => p.calendly).filter(Boolean).sort();
    assert.equal(slots.length, 10, s.slug);
  }
  const roger = SEMILLAS_AGENDA.find((s) => s.slug === "agenda-roger").config.preguntas;
  // A medias: sin contacto no se guarda; con WhatsApp válido sí.
  assert.equal(tieneContacto(roger, { nombre: "Ana" }), false);
  assert.equal(tieneContacto(roger, { nombre: "Ana", telefono: "555" }), false);
  assert.equal(tieneContacto(roger, { nombre: "Ana", telefono: "787 555 1234" }), true);
  assert.equal(telefonoE164("(787) 555-1234"), "+17875551234");
  const r = { nombre: "Ana Rivera", telefono: "787 555 1234", email: "ana@x.com", negocio: "Salón Ana", ventas: "$3,000 - $5000", urgencia: "En un mes " };
  const pre = prefillCalendly(roger, r);
  assert.equal(pre.name, "Ana Rivera");
  assert.equal(pre.email, "ana@x.com");
  assert.equal(pre.customAnswers.a1, "Salón Ana");
  assert.equal(pre.customAnswers.a3, "$3,000 - $5000"); // tal cual Calendly para que lo marque
  assert.equal(pre.customAnswers.a10, "+17875551234");
  assert.equal(pre.customAnswers.a5, "En un mes"); // Calendly marca la opción sin el espacio final
  const urg = roger.find((p) => p.id === "urgencia");
  assert.equal(errorDe(urg, { urgencia: "Es una prioridad para resolver ya mismo " }), null);
  assert.match(resumenRespuestas(roger, r), /\$3,000 - \$5,000/); // en la nota, bien escrito
  assert.match(problemaConfig({ bienvenida: { titulo: "a" }, gracias: { titulo: "b" }, preguntas: [{ id: "x", titulo: "X", tipo: "texto", requerida: true }], calendly: { url: "https://otro.com/x" } }), /Calendly/);
});
