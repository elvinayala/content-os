import assert from "node:assert/strict";
import { test } from "node:test";

import { armarFlyer, logoPara, marca, promptFlyer, validarCopy } from "../scripts/fal/flyer.mjs";

test("copy: pocas palabras, sin gratis, sin voseo, sin promesas de ingreso", () => {
  assert.equal(validarCopy({ titulo: "Tus citas, en automático", bullets: ["Responde en segundos", "Agenda sola 24/7"], cta: "Escríbenos hoy" }).ok, true);
  assert.match(validarCopy({ titulo: "Uno dos tres cuatro cinco seis siete ocho nueve", cta: "Ya" }).errores.join(), /título/);
  assert.match(validarCopy({ titulo: "Ok", bullets: ["a", "b", "c", "d"], cta: "Ya" }).errores.join(), /máx\. 3/);
  assert.match(validarCopy({ titulo: "Ok", bullets: ["uno dos tres cuatro cinco seis siete"], cta: "Ya" }).errores.join(), /bullet 1/);
  assert.match(validarCopy({ titulo: "Diagnóstico gratis", cta: "Agenda" }).errores.join(), /gratis/);
  assert.match(validarCopy({ titulo: "¿Tenés un negocio?", cta: "Escribinos" }).errores.join(), /voseo/);
  assert.equal(validarCopy({ titulo: "¿Tienes un negocio?", cta: "Escríbenos" }).ok, true, "tuteo PR pasa");
  assert.match(validarCopy({ titulo: "Gana $5,000 al mes", cta: "Entra" }).errores.join(), /ingresos/);
  assert.match(validarCopy({ titulo: "Plomero hoy", bullets: ["Visita desde $69"], cta: "Llama" }).avisos.join(), /precio/);
});

test("marca: alias y el logo según el fondo; sin kit = sin logo", () => {
  assert.equal(marca("LU").slug, "level-up");
  assert.equal(marca("aib").nombre, "AI Borinquen");
  assert.equal(marca("inventada"), null);
  assert.match(logoPara(marca("level-up"), "oscuro"), /level-up-logo-dark\.png$/);
  assert.match(logoPara(marca("level-up"), "claro"), /level-up-logo-light\.png$/);
  assert.match(logoPara(marca("resuelto"), "claro"), /logo-azul\.png$/);
  assert.equal(logoPara(marca("isla-run"), "oscuro"), null);
});

test("prompt: texto exacto en español, el producto de héroe, nada extra", () => {
  const p = promptFlyer({ marca: marca("bori"), titulo: "Tu negocio, en piloto automático", bullets: ["Anuncios en minutos", "Sin agencia"], cta: "Pruébalo hoy", producto: "a small business owner smiling at her phone" });
  assert.match(p, /reads EXACTLY "Tu negocio, en piloto automático"/);
  assert.match(p, /"Anuncios en minutos", "Sin agencia"/);
  assert.match(p, /reads EXACTLY "Pruébalo hoy"/);
  assert.match(p, /accents/);
  assert.match(p, /minimalist and elegant/i);
  assert.match(p, /Do NOT include any logo/, "sin referencia de logo no dibuja uno");
  assert.match(p, /#35C06F/, "paleta de la marca");
});

test("armar: fotos primero, logo real al final; copy malo no gasta", () => {
  const f = armarFlyer({ marca: "resuelto", titulo: "Plomero en tu casa hoy", bullets: "Licenciado|Precio claro|Garantía escrita", cta: "Agenda tu visita", fotos: ["https://x.test/foto.jpg", "http://inseguro"] });
  assert.equal(f.ok, true);
  assert.deepEqual(f.refs, ["https://x.test/foto.jpg", "https://content-os-chi-seven.vercel.app/marcas/resuelto/logo-azul.png"]);
  assert.match(f.prompt, /LAST reference image is the brand logo/);
  assert.match(f.prompt, /REAL scene\/people\/result/);
  const sin = armarFlyer({ marca: "isla-run", titulo: "5 kilómetros. Un faro.", bullets: [], cta: "Inscríbete" });
  assert.deepEqual(sin.refs, []);
  assert.match(sin.avisos.join(), /sin logo/);
  assert.equal(armarFlyer({ marca: "bori", titulo: "Gratis para ti", cta: "Ya" }).ok, false);
  assert.match(armarFlyer({ marca: "mauro", titulo: "Hola", cta: "Ya" }).avisos.join(), /no tiene kit/);
  const cliente = armarFlyer({ marca: "biowest", titulo: "Agua pura en casa", cta: "Pide la tuya", fotos: ["https://x.test/producto.jpg"], logo: "https://x.test/logo-cliente.png" });
  assert.deepEqual(cliente.refs, ["https://x.test/producto.jpg", "https://x.test/logo-cliente.png"], "logo del cliente, siempre al final");
  assert.equal(cliente.avisos.length, 0);
});
