import assert from "node:assert/strict";
import { test } from "node:test";

import { cupoContinuar, delegadoEn, leerSeguir, marcaSeguir, origenSiguiente, parsearOrigen, PROFUNDIDAD_MAX, quitarMarca } from "../scripts/agentes-seguir.mjs";

test("origen: los 5 tipos, con o sin id, y la profundidad", () => {
  assert.deepEqual(parsearOrigen("telegram"), { tipo: "telegram", id: null, de: null, n: 0 });
  assert.deepEqual(parsearOrigen("buzon:43:aure·1"), { tipo: "buzon", id: 43, de: "aure", n: 1 });
  assert.deepEqual(parsearOrigen("solicitud:43:aure"), { tipo: "solicitud", id: 43, de: "aure", n: 0 });
  assert.equal(parsearOrigen(""), null);
  assert.equal(parsearOrigen("inventado:1:x"), null);
});

test("marca: va al final del pedido, se lee de vuelta y se quita", () => {
  const texto = "¿Hiciste el arte del leaderboard?" + marcaSeguir("solicitud:43:aure", "Nico");
  const s = leerSeguir(texto);
  assert.equal(s.tipo, "solicitud");
  assert.equal(s.id, 43);
  assert.equal(s.de, "aure");
  assert.equal(s.n, 0);
  assert.equal(quitarMarca(texto), "¿Hiciste el arte del leaderboard?");
  assert.match(texto, /Nico retoma/);
  assert.equal(leerSeguir("un pedido normal"), null);
  assert.equal(marcaSeguir(""), "", "sin origen (script en la Mac) no hay seguimiento");
  assert.equal(marcaSeguir(`telegram·${PROFUNDIDAD_MAX}`), "", "cadena demasiado larga: se corta");
});

test("continuación: un paso más hondo y con tope diario", () => {
  const s = leerSeguir("x" + marcaSeguir("buzon:12:sofi·1"));
  assert.equal(origenSiguiente(s), "buzon:12:sofi·2");
  let c = cupoContinuar(null, "2026-09-26", 2);
  assert.equal(c.ok, true);
  c = cupoContinuar(c.estado, "2026-09-26", 2);
  assert.equal(c.ok, true);
  assert.equal(cupoContinuar(c.estado, "2026-09-26", 2).ok, false);
  assert.equal(cupoContinuar(c.estado, "2026-09-27", 2).ok, true, "día nuevo, cupo nuevo");
});

test("delegación: se detecta en el comando que corrió Claude", () => {
  assert.equal(delegadoEn('node scripts/agentes.mjs mensaje lola "3 flyers de Bori"'), "lola");
  assert.equal(delegadoEn('node scripts/agentes.mjs mensaje lola "fyi" --sin-seguir'), null);
  assert.equal(delegadoEn("node scripts/agentes.mjs atendido 12 'listo'"), null);
  assert.equal(delegadoEn('node scripts/agentes.mjs mensaje elvin "hola"'), null);
});
