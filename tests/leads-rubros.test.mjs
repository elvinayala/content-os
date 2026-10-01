import assert from "node:assert/strict";
import { test } from "node:test";

import { claveRubro, errorRubroNuevo, normalizarRubro, RUBROS_SEMILLA, rubroDeCatalogo, unirCatalogo } from "../lib/leads/rubros-reglas.ts";

test("la semilla trae las 12 de Aure + Otro", () => {
  assert.equal(RUBROS_SEMILLA.length, 13);
  assert.equal(RUBROS_SEMILLA.at(-1), "Otro");
});

test("normalizar y clave", () => {
  assert.equal(normalizarRubro("  real   estate "), "real estate");
  assert.equal(claveRubro("Construcción"), claveRubro("construccion"));
  assert.equal(claveRubro("Dealer de Autos"), "dealer de autos");
});

test("unir catálogo: sin repetidos y Otro al final", () => {
  const c = unirCatalogo(["Restaurantes", "  restaurantes ", "SOLAR", "otro"]);
  assert.equal(c.filter((x) => claveRubro(x) === "restaurantes").length, 1);
  assert.equal(c.filter((x) => claveRubro(x) === "solar").length, 1);
  assert.equal(c.at(-1), "Otro");
  assert.equal(c.filter((x) => x === "Otro").length, 1);
});

test("lo que dice Claude calza con el catálogo", () => {
  const c = unirCatalogo([]);
  assert.equal(rubroDeCatalogo("construcción", c), "Construcción");
  assert.equal(rubroDeCatalogo("Educación", c), "Educación (escuelas o cursos)");
  assert.equal(rubroDeCatalogo("Tiendas", c), "Vendedores / Tiendas");
  assert.equal(rubroDeCatalogo("Refrigeración", c), "Otro");
  assert.equal(rubroDeCatalogo("Bienes raíces", c), "Real estate");
  assert.equal(rubroDeCatalogo("Belleza", c), "Estética");
  assert.equal(rubroDeCatalogo("piezas de autos", c), "Auto partes");
  assert.equal(rubroDeCatalogo(null, c), null);
  assert.equal(rubroDeCatalogo("", c), null);
});

test("crear etiqueta: valida vacío y duplicado", () => {
  const c = unirCatalogo([]);
  assert.match(errorRubroNuevo(" ", c), /Escribe/);
  assert.match(errorRubroNuevo("seguros", c), /ya existe/);
  assert.equal(errorRubroNuevo("Restaurantes", c), null);
});
