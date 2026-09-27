import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import { archivoRespaldable, cifrar, claveDe, descifrar, diferencias, huella, sobrantes } from "../lib/respaldo/cifrado.ts";

const clave = randomBytes(32);

test("cifrar y descifrar vuelven al original; otra clave no abre", () => {
  const datos = JSON.stringify({ tablas: { pulse_items: [{ id: 1, name: "Carol" }] } });
  const c = cifrar(datos, clave);
  assert.equal(c.subarray(0, 5).toString(), "EARS1");
  assert.ok(!c.includes(Buffer.from("Carol")));
  assert.equal(descifrar(c, clave).toString(), datos);
  assert.throws(() => descifrar(c, randomBytes(32)));
  const roto = Buffer.from(c);
  roto[roto.length - 1] ^= 1;
  assert.throws(() => descifrar(roto, clave)); // GCM detecta cualquier cambio
  assert.throws(() => descifrar(Buffer.from("hola"), clave), /No es un respaldo/);
});

test("claveDe valida largo", () => {
  assert.equal(claveDe(clave.toString("base64")).length, 32);
  assert.throws(() => claveDe(undefined), /Falta/);
  assert.throws(() => claveDe(Buffer.from("corta").toString("base64")), /32 bytes/);
});

test("qué archivos se respaldan", () => {
  assert.equal(archivoRespaldable("24da2109/item/acuerdo.pdf"), true);
  assert.equal(archivoRespaldable("ritmo/u1/identificacion/id.jpg"), true);
  assert.equal(archivoRespaldable("motion/2026-09-27/video.mp4"), false);
  assert.equal(archivoRespaldable("respaldos/base/2026-09-27.json.gz.enc"), false);
  assert.equal(archivoRespaldable("papelera/2026-09-27/x.pdf"), false);
});

test("rotación, diferencias y huella", () => {
  const n = ["base/2026-09-25.json.gz.enc", "base/2026-09-27.json.gz.enc", "base/2026-09-26.json.gz.enc", "base/leeme.txt"];
  assert.deepEqual(sobrantes(n, 2), ["base/2026-09-25.json.gz.enc"]);
  assert.deepEqual(diferencias({ a: 1, b: 2 }, { a: 1, b: 3, c: 0 }), ["b", "c"]);
  assert.equal(huella(Buffer.from("x")).length, 16);
});
