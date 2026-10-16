import assert from "node:assert/strict";
import { test } from "node:test";

import { renombrePorAgenda } from "../lib/leads/reglas.ts";

test("lead de WhatsApp con nombre de perfil: manda el de Calendly y el viejo pasa a negocio", () => {
  assert.deepEqual(
    renombrePorAgenda({ nombre: "Experience Innovation Claro Dealer", negocio: null, origen: "whatsapp" }, { nombre: "Ruth Del Valle" }),
    { nombre: "Ruth Del Valle", negocio: "Experience Innovation Claro Dealer" },
  );
});

test("no pisa el negocio que ya hay ni el que trae la cita", () => {
  assert.deepEqual(renombrePorAgenda({ nombre: "Ruthy", negocio: "Claro", origen: "whatsapp" }, { nombre: "Ruth Del Valle" }), { nombre: "Ruth Del Valle" });
  assert.deepEqual(renombrePorAgenda({ nombre: "Ruthy", negocio: null, origen: "whatsapp" }, { nombre: "Ruth Del Valle", negocio: "Claro" }), { nombre: "Ruth Del Valle" });
});

test("mismo nombre (sin importar tildes/mayúsculas), otro origen o nombre vacío: no cambia", () => {
  assert.deepEqual(renombrePorAgenda({ nombre: "José Pérez", negocio: null, origen: "whatsapp" }, { nombre: "jose perez" }), {});
  assert.deepEqual(renombrePorAgenda({ nombre: "Ana", negocio: null, origen: "manual" }, { nombre: "Ana López" }), {});
  assert.deepEqual(renombrePorAgenda({ nombre: "Ana", negocio: null, origen: "whatsapp" }, { nombre: "  " }), {});
});
