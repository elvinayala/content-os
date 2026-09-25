import assert from "node:assert/strict";
import test from "node:test";

import { calcularPendientes, clave } from "../lib/pulse/mi-dia.ts";

const HOY = "2026-09-24";
const AHORA = Date.parse("2026-09-24T12:00:00Z");
const tablero = (items) => ({
  slug: "lu", nombre: "LEVEL UP MEDIA",
  columns: [
    { id: "seg", title: "Fecha de Seguimiento 10 dias", type: "date" },
    { id: "prox", title: "Fecha próximo reporte", type: "date" },
    { id: "emp", title: "Empresa", type: "text" },
    { id: "per", title: "Personas", type: "people" },
  ],
  groups: [{ id: "onb", title: "ONBOARDING & SETUP" }, { id: "act", title: "CLIENTE ACTIVO" }, { id: "off", title: "OFFBOARDED" }],
  items,
});
const it = (id, groupId, values = {}, createdAt = "2026-09-01T00:00:00Z", extra = {}) => ({ id, name: id, groupId, values, createdAt, ...extra });
const tipos = (ps) => ps.map((p) => `${p.itemId}:${p.tipo}`).sort();

test("seguimientos: solo los que vencen hoy/mañana o hace ≤ 7 días", () => {
  const ps = calcularPendientes({ hoy: HOY, ahora: AHORA, hechos: new Set(), tableros: [tablero([
    it("hoy", "act", { seg: "2026-09-24" }), it("ayer", "act", { seg: "2026-09-23" }), it("manana", "act", { seg: "2026-09-25" }),
    it("viejo", "act", { seg: "2026-08-01" }), it("futuro", "act", { seg: "2026-10-30" }),
  ])] });
  assert.deepEqual(tipos(ps), ["ayer:seguimiento", "hoy:seguimiento", "manana:seguimiento"]);
});

test("los de baja no cuentan y lo marcado como hecho desaparece", () => {
  const hechos = new Set([clave("hecho", "seguimiento", "2026-09-24")]);
  const ps = calcularPendientes({ hoy: HOY, ahora: AHORA, hechos, tableros: [tablero([it("baja", "off", { seg: "2026-09-24" }), it("hecho", "act", { seg: "2026-09-24" })])] });
  assert.equal(ps.length, 0);
});

test("onboarding detenido > 48 h y clientes nuevos del formulario", () => {
  const ps = calcularPendientes({ hoy: HOY, ahora: AHORA, hechos: new Set(), tableros: [tablero([
    it("detenido", "onb", {}, "2026-09-20T00:00:00Z"), it("reciente", "onb", {}, "2026-09-23T20:00:00Z", { creadoPorSistema: true }),
  ])] });
  assert.deepEqual(tipos(ps), ["detenido:onboarding", "reciente:nuevo"]);
  assert.equal(ps.find((p) => p.tipo === "onboarding").dias, 4);
});

test("reportes y datos de la ficha", () => {
  const [p] = calcularPendientes({ hoy: HOY, ahora: AHORA, hechos: new Set(), tableros: [tablero([it("r", "act", { prox: "2026-09-22", emp: "Solar PR", per: ["u1"] })])] });
  assert.equal(p.tipo, "reporte");
  assert.equal(p.dias, 2);
  assert.equal(p.empresa, "Solar PR");
  assert.deepEqual(p.personas, ["u1"]);
});
