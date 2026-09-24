import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { firmaTypeformValida, formatearTelefono, mapearRespuesta, resumenOnboarding } from "../lib/pulse/typeform.ts";

const payload = {
  event_id: "e1",
  form_response: {
    form_id: "vlfCgUUP",
    token: "tok123",
    submitted_at: "2026-09-24T15:00:00Z",
    definition: { fields: [] },
    answers: [
      { type: "text", field: { id: "0ymO5s4bXq16", ref: "2e77dbd2-8606-4d4f-ba3d-3b6902fdffb8" }, text: "Plomería Luis" },
      { type: "text", field: { id: "9neHcWUCZ2Jd", ref: "05589d6e-370b-4610-873f-65ba28a494b2" }, text: "Bayamón" },
      { type: "text", field: { id: "mCmCPUxBbPP5", ref: "4d707b84-7a3e-4f6a-987a-072939cb2ae5" }, text: "Luis" },
      { type: "text", field: { id: "MoyuVD8WEjIm", ref: "8aca66dc-fb22-4cf1-9456-cc7b0b64ed05" }, text: "Rivera" },
      { type: "phone_number", field: { id: "WUpjHzhdUolW", ref: "359fc8d8-ba73-448b-baba-f6beb5b09b91" }, phone_number: "+17875551234" },
      { type: "email", field: { id: "fkL7Bsrg3bDb", ref: "8538ca59-7920-4962-ad45-20b40b1adec8" }, email: "Luis@Ejemplo.com" },
      { type: "choice", field: { id: "irCA5zdpvgvV", ref: "d0901918-6230-4632-b468-9cff68def885" }, choice: { label: "B2C" } },
      { type: "choices", field: { id: "x", ref: "37cfa755-9abe-4aa7-9c4d-8700bdbaa0ec" }, choices: { labels: ["Área Norte", "Área Metro"] } },
    ],
  },
};

test("mapea la respuesta a los campos del cliente", () => {
  const d = mapearRespuesta(payload);
  assert.equal(d.nombreCompleto, "Luis Rivera");
  assert.equal(d.campos.negocio, "Plomería Luis");
  assert.equal(d.campos.ubicacion, "Bayamón");
  assert.equal(d.telefono, "+1 787 555 1234");
  assert.equal(d.email, "luis@ejemplo.com");
  assert.equal(d.campos.segmentacion, "Área Norte, Área Metro");
  assert.match(resumenOnboarding(d), /Tipo de cliente: B2C/);
});

test("sin ref cae al título de la pregunta", () => {
  const d = mapearRespuesta({ form_response: { form_id: "x", token: "t", definition: { fields: [{ id: "a1", title: "Nombre del negocio" }] }, answers: [{ type: "text", field: { id: "a1" }, text: "Café PR" }] } });
  assert.equal(d.campos.negocio, "Café PR");
  assert.equal(d.nombreCompleto, "Café PR");
});

test("formatea teléfonos de PR", () => {
  assert.equal(formatearTelefono("7876401068"), "+1 787 640 1068");
  assert.equal(formatearTelefono("(787) 640-1068"), "+1 787 640 1068");
});

test("valida la firma de Typeform", async () => {
  const cuerpo = JSON.stringify(payload);
  const firma = "sha256=" + createHmac("sha256", "secreto").update(cuerpo).digest("base64");
  assert.equal(await firmaTypeformValida(cuerpo, firma, "secreto"), true);
  assert.equal(await firmaTypeformValida(cuerpo, firma, "otro"), false);
  assert.equal(await firmaTypeformValida(cuerpo + " ", firma, "secreto"), false);
  assert.equal(await firmaTypeformValida(cuerpo, null, "secreto"), false);
});
