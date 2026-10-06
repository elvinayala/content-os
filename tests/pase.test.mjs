import assert from "node:assert/strict";
import { test } from "node:test";

import { firmarPase, leerPase } from "../lib/pulse/pase.ts";

const ID = "3f1c2a9e-1111-4222-8333-444455556666";

test("pase entre dominios: firma, lee y caduca a los 60 s", () => {
  const t = firmarPase(ID, "ritmo", "s3creto", 1_000_000);
  const p = leerPase(t, "s3creto", 1_000_000 + 30_000);
  assert.equal(p?.userId, ID);
  assert.equal(p?.destino, "ritmo");
  assert.equal(leerPase(t, "s3creto", 1_000_000 + 61_000), null);
});

test("pase: otra clave, destino cambiado o basura = no vale", () => {
  const t = firmarPase(ID, "leads", "s3creto", 1_000_000);
  assert.equal(leerPase(t, "otra", 1_000_000), null);
  assert.equal(leerPase(t.replace(".leads.", ".pulse."), "s3creto", 1_000_000), null);
  assert.equal(leerPase("a.b.c", "s3creto"), null);
  assert.equal(leerPase(null, "s3creto"), null);
  assert.equal(leerPase(t, undefined, 1_000_000), null);
});
