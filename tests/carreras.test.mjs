import assert from "node:assert/strict";
import { test } from "node:test";

import { abierta, correspondeBono, errorAplicacion, errorReferido, esEstadoValido, esNueva, etapasDe, puedeRetirar } from "../lib/desempeno/carreras-reglas.ts";

const ref = { nombre: "Ana Pérez", email: "ana@correo.com", telefono: "", relacion: "Amiga", motivo: "Tiene 3 años como trafficker", enlace: "" };

test("referido: validaciones", () => {
  assert.equal(errorReferido(ref, { email: "yo@lu.net" }, []), null);
  assert.match(errorReferido({ ...ref, nombre: "A" }, { email: "yo@lu.net" }, []), /nombre/);
  assert.match(errorReferido({ ...ref, email: "", telefono: "12" }, { email: "yo@lu.net" }, []), /correo o el teléfono/);
  assert.equal(errorReferido({ ...ref, email: "", telefono: "+57 300 123 4567" }, { email: "yo@lu.net" }, []), null);
  assert.match(errorReferido({ ...ref, email: "YO@lu.net" }, { email: "yo@lu.net" }, []), /ti mismo/);
  assert.match(errorReferido(ref, { email: "yo@lu.net" }, [{ email: "ANA@correo.com" }]), /ya fue referida/);
  assert.match(errorReferido({ ...ref, motivo: "bien" }, { email: "yo@lu.net" }, []), /por qué/);
  assert.match(errorReferido({ ...ref, enlace: "javascript:alert(1)" }, { email: "yo@lu.net" }, []), /https/);
});

test("aplicación interna: una por vacante", () => {
  assert.equal(errorAplicacion({ motivo: "Quiero crecer a estratega", enlace: "" }, false), null);
  assert.match(errorAplicacion({ motivo: "Quiero crecer a estratega", enlace: "" }, true), /Ya aplicaste/);
});

test("bono: solo referido con onboarding completo y una sola vez", () => {
  assert.equal(correspondeBono({ tipo: "referido", estado: "contratado", bonoAjusteId: null }), false);
  assert.equal(correspondeBono({ tipo: "referido", estado: "onboarding_completo", bonoAjusteId: null }), true);
  assert.equal(correspondeBono({ tipo: "referido", estado: "onboarding_completo", bonoAjusteId: "x" }), false);
  assert.equal(correspondeBono({ tipo: "interna", estado: "onboarding_completo", bonoAjusteId: null }), false);
});

test("etapas y estados", () => {
  assert.equal(etapasDe("interna").some((e) => e.id === "onboarding_completo"), false);
  assert.equal(etapasDe("referido").some((e) => e.id === "onboarding_completo"), true);
  assert.equal(esEstadoValido("interna", "onboarding_completo"), false);
  assert.equal(esEstadoValido("referido", "descartada"), true);
  assert.equal(abierta("entrevista"), true);
  assert.equal(abierta("contratado"), false);
  assert.equal(puedeRetirar({ userId: "a", estado: "recibida" }, "a"), true);
  assert.equal(puedeRetirar({ userId: "a", estado: "entrevista" }, "a"), false);
  assert.equal(puedeRetirar({ userId: "a", estado: "recibida" }, "b"), false);
  assert.equal(esNueva(new Date(Date.now() - 2 * 86_400_000)), true);
  assert.equal(esNueva(new Date(Date.now() - 9 * 86_400_000)), false);
});
