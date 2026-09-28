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

// v2 (28/sep/2026, Elvin: "flyers de alto impacto, que vendan"). Cada regla salió de una prueba real con Nano Banana Pro.
test("v2 copy: la frase resaltada sale del título; la oferta es corta y sin gratis", () => {
  assert.equal(validarCopy({ titulo: "Tu carro como nuevo", resaltar: "como nuevo", oferta: "Pintura desde $899", cta: "Escríbenos" }).ok, true);
  assert.match(validarCopy({ titulo: "Tu carro como nuevo", resaltar: "brillante", cta: "Ya" }).errores.join(), /no está en el título/);
  assert.match(validarCopy({ titulo: "Uno dos tres cuatro cinco", resaltar: "Uno dos tres cuatro cinco", cta: "Ya" }).errores.join(), /máximo 4/);
  assert.match(validarCopy({ titulo: "Ok", oferta: "Primera visita gratis hoy", cta: "Ya" }).errores.join(), /gratis/);
  assert.match(validarCopy({ titulo: "Ok", oferta: "uno dos tres cuatro cinco seis", cta: "Ya" }).errores.join(), /oferta/);
});

test("v2 prompt: texto numerado arriba, resaltado, oferta obligatoria, sin mockup ni recuadro ni marcas ajenas", () => {
  const p = promptFlyer({ marca: null, titulo: "Tu carro como nuevo", bullets: ["Pintura con garantía"], cta: "Escríbenos hoy", resaltar: "como nuevo", oferta: "Pintura desde $899", producto: "a small-business red sedan", ar: "9:16" });
  assert.ok(p.indexOf("TEXT ON THE FLYER") < p.indexOf("SCENE"), "el texto va antes de la escena");
  assert.match(p, /\(1\) HEADLINE: "Tu carro como nuevo" — the words "como nuevo" in ONE vivid accent color/);
  assert.match(p, /\(2\) OFFER BADGE: "Pintura desde \$899"/);
  assert.match(p, /exactly ONCE, word for word/);
  assert.match(p, /NOT a mockup/);
  assert.match(p, /NEVER place the photo inside a box/);
  assert.match(p, /SCENE \(visual only — NEVER write any words/, "la escena en inglés no se cuela como texto");
  assert.match(p, /No third-party logos/);
  assert.match(p, /SOLID flat button/);
  assert.match(p, /top 14% and the bottom 20%/, "zonas seguras de historia");
  assert.match(promptFlyer({ marca: marca("level-up"), titulo: "Hola", cta: "Ya", acento: "#F5CE1A" }), /the accent color #F5CE1A/);
});

test("v2 CLI: fal.mjs acepta --resaltar --oferta --layout --acento (antes los ignoraba en silencio)", async () => {
  const fs = await import("node:fs");
  const cli = fs.readFileSync(new URL("../scripts/fal.mjs", import.meta.url), "utf8");
  for (const f of ["resaltar", "oferta", "layout", "acento"]) assert.match(cli, new RegExp(`"${f}"`), f);
});
