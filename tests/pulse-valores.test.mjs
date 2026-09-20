import assert from "node:assert/strict";
import { test } from "node:test";

import { formatearNumero, validarValor } from "../lib/pulse/valores.ts";
import { colorDeGrupo, mapearColumna, mapearValor, slugDeBoard } from "../scripts/pulse/monday-mapeo.mjs";

test("validarValor: texto, número, fecha, checkbox", () => {
  assert.equal(validarValor("text", "  hola "), "hola");
  assert.equal(validarValor("text", ""), null);
  assert.equal(validarValor("number", "$1,200.50"), 1200.5);
  assert.equal(validarValor("number", 7, { formato: "entero" }), 7);
  assert.throws(() => validarValor("number", "abc"));
  assert.equal(validarValor("date", "2025-02-17"), "2025-02-17");
  assert.throws(() => validarValor("date", "17/02/2025"));
  assert.equal(validarValor("checkbox", "true"), true);
  assert.equal(validarValor("checkbox", false), false);
});

test("validarValor: status/dropdown/people/link/email", () => {
  const labels = [{ id: "a", label: "A", color: "green" }];
  assert.equal(validarValor("status", "a", { labels }), "a");
  assert.throws(() => validarValor("status", "zzz", { labels }));
  assert.deepEqual(validarValor("dropdown", ["a", "zzz"], { labels }), ["a"]);
  assert.equal(validarValor("dropdown", ["zzz"], { labels }), null);
  assert.deepEqual(validarValor("people", "u1"), ["u1"]);
  assert.deepEqual(validarValor("link", "monday.com"), { url: "https://monday.com" });
  assert.deepEqual(validarValor("link", { url: "https://x.com", text: "X" }), { url: "https://x.com", text: "X" });
  assert.equal(validarValor("email", "a@b.co"), "a@b.co");
  assert.throws(() => validarValor("email", "no-es-email"));
});

test("formatearNumero", () => {
  assert.equal(formatearNumero(1200, "moneda"), "$1,200");
  assert.equal(formatearNumero(1200.5, "moneda"), "$1,200.50");
  assert.equal(formatearNumero(3.14159), "3.14");
});

test("monday: mapearColumna status con colores y done", () => {
  const m = mapearColumna({
    id: "status",
    title: "Progreso",
    type: "status",
    settings_str: JSON.stringify({
      labels: { 0: "Onboarding Completado", 1: "En proceso", 5: "" },
      labels_colors: { 0: { color: "#00c875", var_name: "grass_green" }, 1: { color: "#fdab3d", var_name: "working_orange" } },
      done_colors: [0],
    }),
  });
  assert.equal(m.type, "status");
  assert.deepEqual(m.settings.labels, [
    { id: "m0", label: "Onboarding Completado", color: "green", esDone: true },
    { id: "m1", label: "En proceso", color: "orange" },
  ]);
  assert.equal(mapearColumna({ type: "mirror", settings_str: "" }).saltada, true);
  assert.equal(mapearColumna({ type: "numbers", settings_str: JSON.stringify({ unit: { symbol: "$" } }) }).settings.formato, "moneda");
  assert.equal(mapearColumna({ type: "encuesta_rara", settings_str: "" }).type, "text");
});

test("monday: mapearValor por tipo", () => {
  const labels = [{ id: "m0", label: "A", color: "green" }, { id: "m2", label: "B", color: "red" }];
  assert.deepEqual(mapearValor({ type: "status", settings: { labels } }, { index: 2, text: "B" }), { value: "m2" });
  assert.equal(mapearValor({ type: "status", settings: { labels } }, { index: 7, text: "X" }).value, null);
  assert.deepEqual(mapearValor({ type: "number", settings: {} }, { text: "$1,200", value: '"1200"' }), { value: 1200 });
  assert.deepEqual(mapearValor({ type: "date", settings: {} }, { date: "2025-02-17", text: "2025-02-17" }), { value: "2025-02-17" });
  assert.deepEqual(mapearValor({ type: "checkbox", settings: {} }, { value: '{"checked":"true"}' }), { value: true });
  const usuarios = new Map([["11", "u-11"]]);
  const p = mapearValor({ type: "people", settings: {} }, { persons_and_teams: [{ id: "11", kind: "person" }, { id: "99", kind: "person" }, { id: "5", kind: "team" }] }, { usuarios });
  assert.deepEqual(p.value, ["u-11"]);
  assert.equal(p.descartado, "99");
  assert.deepEqual(mapearValor({ type: "link", settings: {} }, { value: '{"url":"forms.gle/x","text":"Onboarding"}' }), { value: { url: "https://forms.gle/x", text: "Onboarding" } });
  assert.deepEqual(mapearValor({ type: "relation", settings: {} }, { linked_item_ids: ["1", "2"] }).relacionPendiente, ["1", "2"]);
  assert.equal(mapearValor({ type: "file", settings: {} }, { files: [{ asset: { id: "9", name: "p.pdf" } }] }).archivosPendientes.length, 1);
  assert.deepEqual(mapearValor({ type: "dropdown", settings: { labels: [{ id: "m3", label: "X" }] } }, { value: '{"ids":[3,4]}', text: "X, Y" }), { value: ["m3"] });
});

test("monday: colores de grupo y slugs", () => {
  assert.equal(colorDeGrupo("#579bfc"), "bright_blue");
  assert.equal(colorDeGrupo("dark-orange"), "dark_orange");
  assert.equal(colorDeGrupo("#00c875"), "green");
  assert.equal(slugDeBoard("LEVEL UP MEDIA", "7784685790"), "level-up-media");
  assert.equal(slugDeBoard("Cumpleaños 2026", "1"), "cumpleanos-2026");
});
