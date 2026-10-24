import assert from "node:assert/strict";
import test from "node:test";

import {
  aceptadasValidas,
  casillasDe,
  faltanObligatorias,
  filasAceptacion,
  metaDeHeaders,
  personaDe,
  RUTAS_LEGALES,
  telefonoNormalizado,
} from "../lib/consentimientos/reglas.ts";
import { casillasFormulario } from "../lib/formularios/reglas.ts";
import { SEMILLAS } from "../lib/formularios/semillas.ts";
import { SEMILLAS_AGENDA } from "../lib/formularios/semillas-agenda.ts";

test("términos y privacidad siempre van, obligatorias y con su enlace; marketing nunca es obligatorio", () => {
  const c = casillasDe({ marca: "level_up", marketing: ["marketing_sms", "marketing_email", "marketing_sms"] });
  assert.deepEqual(
    c.map((x) => x.tipo),
    ["terminos", "privacidad", "marketing_sms", "marketing_email"],
  );
  assert.equal(c[0].obligatoria, true);
  assert.equal(c[0].enlace.href, RUTAS_LEGALES.terminos);
  assert.ok(c[0].texto.includes(c[0].enlace.texto));
  assert.equal(c[1].enlace.href, RUTAS_LEGALES.privacidad);
  for (const x of c.slice(2)) assert.equal(x.obligatoria, false);
  // TCPA: dice el canal, la voz de IA, que no es condición de compra y cómo salir.
  assert.match(c[2].texto, /Level Up Media/);
  assert.match(c[2].texto, /voz automatizada o de IA/);
  assert.match(c[2].texto, /No es condición de compra/);
  assert.match(c[2].texto, /STOP/);
  // Un tipo que no es opcional no se cuela como "marketing".
  assert.deepEqual(casillasDe({ marketing: ["terminos"] }).map((x) => x.tipo), ["terminos", "privacidad"]);
  assert.deepEqual(casillasDe({ apagado: true }), []);
});

test("solo valen las casillas que el servidor ofreció; faltan las obligatorias sin marcar", () => {
  const c = casillasDe({ marketing: ["marketing_email"] });
  assert.deepEqual(aceptadasValidas(c, ["terminos", "marketing_sms", "hackeo", 3, "terminos"]), ["terminos"]);
  assert.deepEqual(aceptadasValidas(c, "terminos"), []);
  assert.deepEqual(faltanObligatorias(c, ["terminos"]), ["privacidad"]);
  assert.deepEqual(faltanObligatorias(c, ["terminos", "privacidad"]), []);
});

test("las filas guardan el texto del servidor y la persona normalizada; lo no marcado no se guarda", () => {
  const c = casillasDe({ marca: "ai_borinquen", marketing: ["marketing_sms", "marketing_email"] });
  const filas = filasAceptacion({
    casillas: c,
    aceptadas: ["terminos", "privacidad", "marketing_sms"],
    email: "  Maria@Negocio.COM ",
    telefono: "(787) 555-0101",
    origen: "/f/agenda-roger",
    referencia: "form:agenda-roger:abc",
    ip: "1.2.3.4",
    userAgent: "Mozilla",
  });
  assert.equal(filas.length, 3);
  assert.ok(!filas.some((f) => f.tipo === "marketing_email"));
  for (const f of filas) {
    assert.equal(f.persona, "maria@negocio.com");
    assert.equal(f.telefono, "+17875550101");
    assert.equal(f.accion, "acepto");
    assert.equal(f.ip, "1.2.3.4");
    assert.ok(f.versionDocumento);
  }
  assert.equal(filas.find((f) => f.tipo === "marketing_sms").textoCasilla, c.find((x) => x.tipo === "marketing_sms").texto);
  assert.match(filas[2].textoCasilla, /AI Borinquen/);
});

test("persona: e-mail, si no teléfono, si no la referencia", () => {
  assert.equal(personaDe({ email: "x@y.co", telefono: "7875550101" }), "x@y.co");
  assert.equal(personaDe({ email: "no es email", telefono: "787 555 0101" }), "+17875550101");
  assert.equal(personaDe({ referencia: "form:onboarding-experiencia:t1" }), "ref:form:onboarding-experiencia:t1");
  assert.equal(telefonoNormalizado("1-787-555-0101"), "+17875550101");
  assert.equal(telefonoNormalizado("123"), null);
});

test("IP y navegador salen de los headers del request", () => {
  const h = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1", "user-agent": "Safari" });
  assert.deepEqual(metaDeHeaders(h), { ip: "9.9.9.9", userAgent: "Safari" });
  assert.deepEqual(metaDeHeaders(new Headers()), { ip: null, userAgent: null });
});

test("cada formulario sembrado lleva términos y privacidad; las agendas ofrecen marketing opcional", () => {
  for (const s of [...SEMILLAS, ...SEMILLAS_AGENDA]) {
    const tipos = casillasFormulario(s).map((c) => c.tipo);
    assert.deepEqual(tipos.slice(0, 2), ["terminos", "privacidad"], s.slug);
  }
  const agenda = SEMILLAS_AGENDA.find((s) => s.slug === "agenda-roger");
  assert.deepEqual(casillasFormulario(agenda).map((c) => c.tipo), ["terminos", "privacidad", "marketing_sms", "marketing_email"]);
  // La config del formulario manda sobre la de su acción, y un formulario nunca apaga términos y privacidad.
  assert.deepEqual(casillasFormulario({ ...agenda, config: { ...agenda.config, legal: { marketing: [], apagado: true } } }).map((c) => c.tipo), ["terminos", "privacidad"]);
});
