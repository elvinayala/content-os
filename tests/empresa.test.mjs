import assert from "node:assert/strict";
import { test } from "node:test";

import { bloques, errorItem, SEMILLAS_EMPRESA, trozos, visiblePara } from "../lib/desempeno/empresa-reglas.ts";

test("quién ve qué: su empresa + todas; borradores solo la dirección", () => {
  const it = (empresa, publicado = true) => ({ id: "x", seccion: "nosotros", titulo: "t", cuerpo: "", url: null, empresa, orden: 0, publicado });
  const lu = { empresa: "level_up", maestro: false };
  const aib = { empresa: "ai_borinquen", maestro: false };
  assert.equal(visiblePara(it("todas"), lu), true);
  assert.equal(visiblePara(it("level_up"), lu), true);
  assert.equal(visiblePara(it("ai_borinquen"), lu), false);
  assert.equal(visiblePara(it("ai_borinquen"), aib), true);
  assert.equal(visiblePara(it("level_up", false), lu), false);
  assert.equal(visiblePara(it("ai_borinquen", false), { empresa: null, maestro: true }), true);
  assert.equal(visiblePara(it("level_up"), { empresa: null, maestro: false }), true); // sin perfil = Level Up
});

test("formato sencillo: párrafos, viñetas, negrita y links (sin HTML)", () => {
  const b = bloques("Hola **equipo**\n- uno\n- dos con [link](https://x.com)\n\n<script>alert(1)</script>");
  assert.equal(b.length, 3);
  assert.equal(b[0].t, "p");
  assert.deepEqual(b[0].trozos, [{ t: "texto", v: "Hola " }, { t: "negrita", v: "equipo" }]);
  assert.equal(b[1].t, "lista");
  assert.equal(b[1].items.length, 2);
  assert.deepEqual(b[1].items[1].at(-1), { t: "link", v: "link", url: "https://x.com" });
  assert.deepEqual(b[2], { t: "p", trozos: [{ t: "texto", v: "<script>alert(1)</script>" }] });
  assert.deepEqual(trozos("[malo](javascript:alert(1))"), [{ t: "texto", v: "[malo](javascript:alert(1))" }]);
});

test("validación y contenido inicial", () => {
  assert.equal(errorItem({ seccion: "equipo", titulo: "xx", cuerpo: "", empresa: "todas" }), "Sección inválida");
  assert.equal(errorItem({ seccion: "recursos", titulo: "Drive", cuerpo: "", url: "javascript:alert(1)", empresa: "todas" }), "El link tiene que empezar con https:// o /ritmo");
  assert.equal(errorItem({ seccion: "recursos", titulo: "Drive", cuerpo: "", url: "https://drive.google.com", empresa: "todas" }), null);
  const claves = SEMILLAS_EMPRESA.map((s) => s.clave);
  assert.equal(new Set(claves).size, claves.length);
  for (const s of SEMILLAS_EMPRESA) {
    assert.equal(errorItem(s), null, s.clave);
    assert.doesNotMatch(`${s.titulo} ${s.cuerpo}`, /\b(vos|tenés|podés|querés|pedí|tocá)\b/, s.clave);
  }
  // Misión y valores de Level Up quedan como borrador hasta que Elvin los apruebe
  assert.equal(SEMILLAS_EMPRESA.find((s) => s.clave === "lu-mision").publicado, false);
});

test("las políticas del texto coinciden con las reglas reales de Ritmo", async () => {
  const { POLITICA_TEXTO } = await import("../lib/desempeno/empresa-reglas.ts");
  const { POLITICA } = await import("../lib/desempeno/rrhh.ts");
  const { BONO_REFERIDO } = await import("../lib/desempeno/carreras-reglas.ts");
  for (const k of ["vacacionesAnual", "enfermedadAnual", "maternidad", "mesesParaVacaciones"]) assert.equal(POLITICA_TEXTO[k], POLITICA[k], k);
  assert.equal(POLITICA_TEXTO.bonoReferido, BONO_REFERIDO);
});
