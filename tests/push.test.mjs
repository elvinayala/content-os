import assert from "node:assert/strict";
import { test } from "node:test";

import { avisoDesdeSlack, destino, nombreDispositivo, textoPlano } from "../lib/push/texto.ts";

const BASE = "https://ritmo.levelupmediapr.net";

test("textoPlano quita el formato de Slack", () => {
  assert.equal(textoPlano("✅ Aprobada: tu solicitud de *Vacaciones*. <https://x/ritmo/solicitudes|Ver en Ritmo>"), "✅ Aprobada: tu solicitud de Vacaciones. Ver en Ritmo");
  assert.equal(textoPlano("Ana &amp; Luis &lt;3"), "Ana & Luis <3");
  assert.equal(textoPlano("hola <!channel> <@U123>"), "hola");
});

test("destino: primer link de Ritmo como ruta relativa", () => {
  assert.equal(destino(`Falta tu firma: <${BASE}/ritmo/solicitudes|Ver en Ritmo>`), "/ritmo/solicitudes");
  assert.equal(destino(`<https://content-os-chi-seven.vercel.app/ritmo/bienestar?v=comunidad|Ver>`), "/ritmo/bienestar?v=comunidad");
  assert.equal(destino("sin link"), "/ritmo");
  assert.equal(destino("<https://slack.com/x|Slack>"), "/ritmo");
  assert.equal(destino("<https://x/ritmosa/otra|x>"), "/ritmo");
});

test("avisoDesdeSlack: título en negrita + cuerpo", () => {
  const a = avisoDesdeSlack(`*Ritmo · lunes 28 de septiembre* (Carilin)\n🔴 Sin marcar: Ana\n<${BASE}/ritmo/equipo|Ver en Ritmo>`);
  assert.equal(a.titulo, "Ritmo · lunes 28 de septiembre (Carilin)");
  assert.equal(a.texto, "🔴 Sin marcar: Ana\nVer en Ritmo");
  assert.equal(a.url, "/ritmo/equipo");
  assert.equal(a.tag, "ritmo-equipo");
});

test("avisoDesdeSlack: una línea → título Ritmo", () => {
  const a = avisoDesdeSlack("✅ RR.HH. autorizó tu computadora *Laptop*. Ya puedes ponchar desde ahí.");
  assert.equal(a.titulo, "Ritmo");
  assert.equal(a.texto, "✅ RR.HH. autorizó tu computadora Laptop. Ya puedes ponchar desde ahí.");
  assert.equal(a.url, "/ritmo");
  assert.equal(a.tag, "ritmo-hoy");
});

test("avisoDesdeSlack corta textos largos", () => {
  const a = avisoDesdeSlack("x".repeat(400));
  assert.equal(a.texto.length, 180);
  assert.ok(a.texto.endsWith("…"));
});

test("nombreDispositivo", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
  const android = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36";
  assert.equal(nombreDispositivo(iphone, true), "iPhone · app instalada");
  assert.equal(nombreDispositivo(android, false), "Android · Chrome");
});
