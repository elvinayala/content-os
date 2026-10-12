// Parche D (12-oct): una tarea de solo lectura nunca se convierte, por delegación o por un script, en una acción con
// más permisos. Todas las pruebas de CLI corren CON la marca: el script debe cortar antes de tocar la red.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { enSoloLectura, exigirEscritura, MARCA_SOLO_LECTURA, SoloLecturaError } from "../lib/solo-lectura.mjs";
import { conCandado } from "../scripts/meta-ads/candado.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const conMarca = { ...process.env, [MARCA_SOLO_LECTURA]: "1", CRON_SECRET: "prueba-sin-red", CONTENT_OS_URL: "http://127.0.0.1:9" };
const correr = (script, args) => spawnSync(process.execPath, [script, ...args], { cwd: ROOT, env: conMarca, encoding: "utf8", timeout: 20000 });

test("la marca: sin ella no cambia nada; con ella, escribir lanza", () => {
  assert.equal(enSoloLectura({}), false);
  assert.equal(enSoloLectura({ [MARCA_SOLO_LECTURA]: "1" }), true);
  assert.doesNotThrow(() => exigirEscritura("x", {}));
  assert.throws(() => exigirEscritura("x", { [MARCA_SOLO_LECTURA]: "1" }), SoloLecturaError);
});

for (const [nombre, script, args] of [
  ["agentes.mjs mensaje a Lola (la escalada encontrada)", "scripts/agentes.mjs", ["mensaje", "lola", "genera 20 videos"]],
  ["agentes.mjs aviso a Elvin", "scripts/agentes.mjs", ["elvin", "hola"]],
  ["agentes.mjs atendido", "scripts/agentes.mjs", ["atendido", "1", "listo"]],
  ["agentes.mjs slack", "scripts/agentes.mjs", ["slack", "x"]],
  ["fal.mjs (genera y cobra)", "scripts/fal.mjs", ["imagen", "un perro"]],
  ["max.mjs nota (publica en Slack)", "scripts/max.mjs", ["nota", "hola"]],
  ["remi.mjs render", "scripts/remi.mjs", ["render", "abc"]],
  ["nico-ronda.mjs enviar (Telegram)", "scripts/nico-ronda.mjs", ["enviar", "hola"]],
  ["subir videos a Meta", "scripts/meta-ads/subir-videos.mjs", ["levelup"]],
]) {
  test(`solo lectura: ${nombre} se niega antes de tocar la red`, () => {
    const r = correr(script, args);
    assert.equal(r.status, 3, `salió con ${r.status}: ${(r.stderr || r.stdout).slice(0, 200)}`);
    assert.match(r.stderr, /Solo lectura/);
  });
}

test("solo lectura: consultar el buzón sigue permitido (no corta con 3)", () => {
  const r = correr("scripts/agentes.mjs", ["buzon", "nico"]);
  assert.notEqual(r.status, 3);
  assert.doesNotMatch(r.stderr, /Solo lectura/);
});

test("candado de Meta: con la marca, leer sí y escribir no (ni pausar); sin la marca, como antes", async () => {
  const llamadas = [];
  const cliente = { graph: async (m, p) => { llamadas.push(`${m} ${p}`); return { ok: true }; } };
  const c = conCandado(cliente, { marca: "levelup", obtenerItem: async () => null });
  const previa = process.env[MARCA_SOLO_LECTURA];
  process.env[MARCA_SOLO_LECTURA] = "1";
  try {
    await c.graph("GET", "/act_1/campaigns");
    await assert.rejects(c.graph("POST", "/123", { status: "PAUSED" }), SoloLecturaError);
  } finally {
    if (previa === undefined) delete process.env[MARCA_SOLO_LECTURA]; else process.env[MARCA_SOLO_LECTURA] = previa;
  }
  await c.graph("POST", "/123", { status: "PAUSED" }); // sin la marca: pausar no gasta, pasa como antes
  assert.deepEqual(llamadas, ["GET /act_1/campaigns", "POST /123"]);
});

test("las listas de solo lectura del puente no traen nada que salga del contenedor ni active a otro agente", () => {
  const fuente = fs.readFileSync(path.join(ROOT, "scripts/telegram-puente.mjs"), "utf8");
  const lista = JSON.parse(fuente.match(/const SOLO_LECTURA = (\[[^\]]*\]);/)[1]);
  for (const prohibido of ["WebFetch", "WebSearch", "Edit", "Write"]) assert.ok(!lista.includes(prohibido), prohibido);
  assert.ok(!lista.some((t) => /agentes\.mjs (mensaje|atendido|slack|elvin)/.test(t)), "agentes.mjs con efectos");
  assert.ok(!lista.some((t) => t.startsWith("Bash(node scripts/nico-ronda.mjs") && t.endsWith("*)")), "nico-ronda con argumentos");
  assert.ok(!lista.some((t) => /fal\.mjs|max\.mjs|remi\.mjs|meta-ads/.test(t)), "scripts con efectos");
  const prohibidos = JSON.parse(fuente.match(/const PROHIBIDO_EN_LECTURA = (\[[^\]]*\]);/)[1]);
  for (const p of ["WebFetch", "Bash(node scripts/agentes.mjs mensaje*)", "Bash(node scripts/nico-ronda.mjs enviar*)"]) assert.ok(prohibidos.includes(p), p);
  // La marca se pone en toda tarea de solo lectura y se borra en las demás.
  assert.match(fuente, /if \(soloLecturaEfectiva\) envVars\[MARCA_SOLO_LECTURA\] = "1"; else delete envVars\[MARCA_SOLO_LECTURA\];/);
  assert.match(fuente, /const soloLecturaEfectiva = Boolean\(prep\) \|\| Boolean\(opts\.soloLectura\) \|\| nicoLectura \|\| deAicore;/);
  // Un intento de delegar (negado) en solo lectura no deja el pedido abierto "esperando a" otro agente.
  assert.match(fuente, /if \(d && d !== YO && !soloLecturaEfectiva\) delegados\.add\(d\);/);
});
