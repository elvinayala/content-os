import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { carpetaMax, prepararTareaAicore, promptMax } from "../scripts/aicore-tareas.mjs";

const ROOT = process.cwd();
const listar = (dir) => fs.readdirSync(dir, { recursive: true }).map(String).sort();

test("Sofi: sin CLAUDE.md (--bare), sin Bash y en solo lectura", () => {
  const p = prepararTareaAicore({ persona: "sofi", root: ROOT, hoy: "lunes, 12 de octubre de 2026" });
  assert.equal(p.cwd, ROOT);
  assert.ok(p.args.includes("--bare"));
  assert.equal(p.args[p.args.indexOf("--tools") + 1], "Read,Glob,Grep");
  for (const x of ["Edit", "Write", "NotebookEdit"]) assert.ok(p.args.includes(x));
  assert.ok(!p.args.some((a) => a.startsWith("Bash(")));
  assert.match(p.args.at(-1), /SOLO LECTURA[\s\S]*12 de octubre/);
});

test("Max: su carpeta solo tiene lo de SU marca y solo puede consultar esa marca en Meta", () => {
  const p = prepararTareaAicore({ persona: "max", root: ROOT, marcas: ["resuelto"], sesion: "prueba-1" });
  try {
    const archivos = listar(p.cwd);
    assert.ok(archivos.includes(path.join("marcas", "resuelto.json")));
    assert.ok(archivos.some((f) => f.startsWith(path.join("campanas", "resuelto-"))));
    assert.ok(!archivos.some((f) => /level-up|ai-borinquen|shadow-operator/.test(f)), archivos.join(", "));
    const ficha = JSON.parse(fs.readFileSync(path.join(p.cwd, "marcas", "resuelto.json"), "utf8"));
    assert.deepEqual(Object.keys(ficha), ["resuelto"]);
    const bash = p.args.filter((a) => a.startsWith("Bash("));
    assert.ok(bash.length > 0 && bash.every((a) => a.startsWith(`Bash(node ${ROOT}/scripts/meta-ads.mjs resuelto `)));
    assert.ok(!bash.some((a) => /(crear|activar|escalar|pausar|estrategia|plantilla)/.test(a)));
    assert.ok(p.args.includes("--bare"));
  } finally {
    p.limpiar();
  }
  assert.equal(fs.existsSync(p.cwd), false);
});

test("Max sin marca: no consulta Meta; marcas raras se descartan", () => {
  const p = prepararTareaAicore({ persona: "max", root: ROOT, marcas: ["../level-up", "Level Up"], sesion: "prueba-2" });
  try {
    assert.ok(!p.args.some((a) => a.startsWith("Bash(")));
    assert.match(promptMax("hoy", [], ROOT), /sin marcas: no consultes Meta/);
    assert.ok(!fs.existsSync(path.join(p.cwd, "marcas")));
  } finally {
    p.limpiar();
  }
});

test("la carpeta de Max es la misma para la misma sesión (para poder retomarla)", () => {
  const a = carpetaMax(ROOT, ["level-up"], "sesion-x");
  const b = carpetaMax(ROOT, ["level-up"], "sesion-x");
  assert.equal(a, b);
  fs.rmSync(a, { recursive: true, force: true });
});
