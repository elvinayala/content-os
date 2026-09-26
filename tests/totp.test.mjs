import assert from "node:assert/strict";
import { test } from "node:test";

import { base32, desdeBase32, hotp, nuevoSecreto, verificarTotp } from "../lib/desempeno/totp.ts";

// RFC 6238, apéndice B (SHA1, secreto ASCII "12345678901234567890"), 6 últimos dígitos
const SECRETO = base32(Buffer.from("12345678901234567890"));

test("base32 ida y vuelta", () => {
  const s = nuevoSecreto();
  assert.equal(s.length, 32);
  assert.equal(base32(desdeBase32(s)), s);
});

test("vectores del RFC 6238", () => {
  assert.equal(hotp(SECRETO, Math.floor(59 / 30)), "287082");
  assert.equal(hotp(SECRETO, Math.floor(1111111109 / 30)), "081804");
  assert.equal(hotp(SECRETO, Math.floor(1234567890 / 30)), "005924");
  assert.equal(hotp(SECRETO, Math.floor(2000000000 / 30)), "279037");
});

test("acepta ±30 s, rechaza reuso y códigos malos", () => {
  const t = 1234567890 * 1000;
  const c = verificarTotp(SECRETO, "005924", t);
  assert.equal(c, Math.floor(1234567890 / 30));
  assert.equal(verificarTotp(SECRETO, "005924", t + 30_000), c); // 30 s después aún vale
  assert.equal(verificarTotp(SECRETO, "005924", t + 90_000), null); // ya venció
  assert.equal(verificarTotp(SECRETO, "005924", t, c), null); // mismo código dos veces: no
  assert.equal(verificarTotp(SECRETO, "123456", t), null);
  assert.equal(verificarTotp(SECRETO, "abc", t), null);
});
