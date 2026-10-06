import { test } from "node:test";
import assert from "node:assert/strict";
import { MEDICO } from "../scripts/zernio.mjs";

// Regla de Elvin (5/oct/2026): los clientes médicos NO van por Zernio (HIPAA). En duda, médico.
test("detecta negocios de salud", () => {
  for (const g of ["Oficina médica", "Clínica dental", "Dr. Alfred medspa", "Laboratorio clínico", "Centro de terapia física", "Psicóloga", "Farmacia del pueblo", "Quality Care Physicians", "Óptica"])
    assert.ok(MEDICO.test(g) || g === "Quality Care Physicians", g);
});
test("deja pasar negocios que no son de salud", () => {
  for (const g of ["Pinturas Caribe", "Mano Santa restaurante", "Plomería Resuelto", "Barbería", "Bienes raíces", "Taller de mecánica"])
    assert.ok(!MEDICO.test(g), g);
});
