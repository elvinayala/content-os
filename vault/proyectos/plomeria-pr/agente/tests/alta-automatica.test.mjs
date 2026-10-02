import { test } from "node:test";
import assert from "node:assert/strict";
import { planAlta, trabajosSinPlomero, minutosParaAceptar, bienvenida } from "../dist/alta-automatica.js";

const zona = (m) => ({ cidra: "T3", caguas: "T3", aguadilla: "T7" })[m.toLowerCase()];
const firma = (tipo, datos) => ({ tipo, municipio: datos.municipio, firmado: { datos } });

test("plomero que firma se activa con su zona y licencia (caso Luis Saez, 1/oct)", () => {
  const p = planAlta(firma("plomero", { nombre: "Luis Saez Figueroa", municipio: "Cidra", licencia: "oficial", lic_num: "3761" }), zona);
  assert.deepEqual(p, { activar: true, oficio: "plomero", licencia: "Oficial 3761", municipio: "Cidra", territorio: "T3" });
});

test("técnico se activa con su oficio", () => {
  const p = planAlta(firma("tecnico", { municipio: "Aguadilla", oficio: "electricista", lic_num: "123" }), zona);
  assert.equal(p.activar, true); assert.equal(p.oficio, "electricista"); assert.equal(p.territorio, "T7");
});

test("pueblo sin zona, aprendiz, cotizador y anexo NO se activan solos", () => {
  assert.equal(planAlta(firma("plomero", { municipio: "Canóvanas", licencia: "oficial", lic_num: "1" }), zona).activar, false);
  assert.match(planAlta(firma("plomero", { municipio: "Canóvanas" }), zona).motivo, /Canóvanas/);
  for (const t of ["aprendiz", "cotizador", "anexo-nombre"]) assert.equal(planAlta(firma(t, { municipio: "Cidra" }), zona).activar, false);
});

test("solo se ofrecen trabajos de la zona, sin plomero, agendados, con tiempo y sin oferta abierta", () => {
  const ahora = Date.parse("2026-10-01T22:00:00-04:00");
  const t = (id, o) => ({ id, territorio: "T3", plomeroId: "", estado: "agendado", inicio: "2026-10-03T10:00:00-04:00", ...o });
  const trabajos = [t("R-1"), t("R-2", { plomeroId: "edgar" }), t("R-3", { territorio: "T7" }), t("R-4", { estado: "cancelado" }), t("R-5", { inicio: "2026-10-01T23:30:00-04:00" }), t("R-6")];
  const ofertas = [{ referencia: "R-6", estado: "abierta" }, { referencia: "R-1", estado: "expirada" }];
  assert.deepEqual(trabajosSinPlomero(trabajos, ofertas, "T3", ahora).map((x) => x.id), ["R-1"]);
});

test("tiempo para aceptar: hasta 2 h antes de la cita, máximo 12 h, mínimo 30 min", () => {
  const ahora = Date.parse("2026-10-01T21:00:00-04:00");
  assert.equal(minutosParaAceptar("2026-10-02T08:00:00-04:00", ahora), 9 * 60);
  assert.equal(minutosParaAceptar("2026-10-05T08:00:00-04:00", ahora), 12 * 60);
  assert.equal(minutosParaAceptar("2026-10-01T22:00:00-04:00", ahora), 30);
});

test("la bienvenida lleva el link y cuántos trabajos esperan", () => {
  const b = bienvenida("Luis Saez", "https://app.resueltopr.com/a/x/y", 2);
  assert.match(b, /Luis!/); assert.match(b, /https:\/\/app\.resueltopr\.com\/a\/x\/y/); assert.match(b, /2 trabajos esperando/);
  assert.doesNotMatch(bienvenida("Ana", "l", 0), /esperando/);
});
