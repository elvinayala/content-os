import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";

import { agenciaCorta, bloqueos, diasPara, dinero, mensajeElvin, partirMensaje, validar } from "../scripts/licitaciones.mjs";

const docs = [
  { id: "rup", nombre: "RUP", estado: "tiene", vence: "2026-12-31" },
  { id: "rul", nombre: "RUL", estado: "tramite" },
  { id: "crim", nombre: "CRIM", estado: "tiene", vence: "2026-10-30" },
  { id: "sam", nombre: "SAM", estado: "no", clave: false },
];

test("diasPara cuenta días enteros y da negativo si ya cerró", () => {
  assert.equal(diasPara("2026-11-05T16:00", "2026-10-19"), 17);
  assert.equal(diasPara("2026-10-19", "2026-10-19"), 0);
  assert.equal(diasPara("2026-10-18", "2026-10-19"), -1);
  assert.equal(diasPara(null, "2026-10-19"), null);
});

test("bloqueos: falta, en trámite y vence antes del cierre", () => {
  const op = { cierre: "2026-11-05", requiere: ["rup", "rul", "crim", "asume"] };
  const b = bloqueos(op, docs);
  assert.deepEqual(b.map((x) => x.id), ["rul", "crim", "asume"]);
  assert.match(b.find((x) => x.id === "crim").motivo, /vence/);
  assert.match(b.find((x) => x.id === "rul").motivo, /trámite/);
  assert.deepEqual(bloqueos({ cierre: "2026-11-05", requiere: ["rup"] }, docs), []);
});

test("dinero abrevia montos", () => {
  assert.equal(dinero(65000), "$65K");
  assert.equal(dinero(1900000), "$1.9M");
  assert.equal(dinero(null), "?");
});

test("bloqueos: un documento sin confirmar no dice que no lo tenemos", () => {
  assert.equal(bloqueos({ requiere: ["x"] }, [{ id: "x", nombre: "X", estado: "desconocido" }])[0].motivo, "sin confirmar");
});

test("mensajeElvin: solo activas, primero la de más encaje, con lo que necesito y lo que falta", () => {
  const p = {
    empresa: { nombre: "Digital Seed Ventures LLC" },
    documentos: docs,
    oportunidades: [
      { id: "e", titulo: "RRPP Familia", agencia: "Familia", cierre: "2026-10-31", estado: "nueva", encaje: 55, monto: { max: 10000 } },
      { id: "b", titulo: "Publicidad Isabela", agencia: "Isabela", cierre: "2026-11-08", estado: "nueva", encaje: 70, monto: { max: 107500 }, necesitoDeElvin: [{ que: "OK para la propuesta" }] },
      { id: "a", titulo: "Web y redes CEDD", agencia: "DDEC", cierre: "2026-11-05", estado: "preparando", encaje: 90, requiere: ["rul"], monto: { min: 45000, max: 70000 }, necesitoDeElvin: [{ que: "RUP", hecho: true }, { que: "Correo oficial" }] },
      { id: "c", titulo: "Descartada", agencia: "X", cierre: "2026-11-01", estado: "descartada" },
      { id: "d", titulo: "Ya cerró", agencia: "Y", cierre: "2026-10-01", estado: "nueva" },
    ],
  };
  const m = mensajeElvin(p, "2026-10-19");
  assert.ok(m.indexOf("Web y redes CEDD") < m.indexOf("Publicidad Isabela"), "la de más encaje primero");
  assert.ok(m.indexOf("Publicidad Isabela") < m.indexOf("RRPP Familia"), "aunque Familia cierre antes");
  assert.ok(!m.includes("Descartada") && !m.includes("Ya cerró"));
  assert.match(m, /3 oportunidad\(es\) activas · hasta \$188K en juego para Digital Seed Ventures LLC/);
  assert.match(m, /⛔ Falta: RUL \(en trámite\)/);
  assert.match(m, /• Correo oficial/);
  assert.ok(!m.includes("• RUP"), "no repite lo que ya está hecho");
  assert.match(m, /\$45K–\$70K/);
});

test("mensajeElvin: detalle solo para lo que preparamos y las de más encaje; el resto en una línea", () => {
  const op = (id, encaje, estado = "nueva") => ({ id, titulo: `Publicidad ${id} (contrato que vence)`, agencia: `Municipio de ${id}`, cierre: "2026-12-31", estado, encaje, monto: { max: 50000 }, porQue: `porque ${id}`, necesitoDeElvin: [{ que: `OK ${id}` }] });
  const p = { oportunidades: [op("A", 90, "preparando"), op("B", 85), op("C", 80), op("D", 70), op("E", 60)] };
  const m = mensajeElvin(p, "2026-10-19");
  for (const id of ["A", "B"]) assert.match(m, new RegExp(`Por qué: porque ${id}`));
  assert.ok(!m.includes("porque C") && !m.includes("porque D") && !m.includes("porque E"), "el resto no lleva el detalle");
  assert.match(m, /También en el radar \(3\):/);
  assert.match(m, /• D · Publicidad D · \$50K · 73 días · encaje 70$/m, "un OK de trabajo interno no se repite en el radar");
  assert.match(m, /Dime a cuáles me presento/);
  const conPregunta = mensajeElvin({ oportunidades: [op("A", 90, "preparando"), op("B", 85), { ...op("D", 70), necesitoDeElvin: [{ que: "¿Le entramos a RRPP?" }] }] }, "2026-10-19");
  assert.match(conPregunta, /encaje 70 → ¿Le entramos a RRPP\?/, "las decisiones de Elvin sí salen");
  assert.match(m, /5 oportunidad\(es\) activas/, "el total cuenta todas");
});

test("agenciaCorta usa la sigla o quita el 'Municipio de'", () => {
  assert.equal(agenciaCorta("Oficina de Gerencia y Presupuesto (OGP)"), "OGP");
  assert.equal(agenciaCorta("Municipio de Bayamón"), "Bayamón");
  assert.equal(agenciaCorta("Departamento de Educación de Puerto Rico"), "Depto. Educación");
  assert.equal(agenciaCorta("Departamento de la Familia"), "Depto. Familia");
});

test("partirMensaje: no pasa del máximo, corta entre bloques y no pierde texto", () => {
  const bloques = Array.from({ length: 12 }, (_, i) => `Bloque ${i}\n${"x".repeat(300)}`);
  const texto = bloques.join("\n\n");
  const partes = partirMensaje(texto, 1000);
  assert.ok(partes.length > 1);
  assert.ok(partes.every((x) => x.length <= 1000));
  assert.equal(partes.join("\n\n"), texto);
  assert.deepEqual(partirMensaje("corto", 1000), ["corto"]);
});

test("el pipeline real es válido", () => {
  const p = JSON.parse(fs.readFileSync(new URL("../data/licitaciones/pipeline.json", import.meta.url), "utf8"));
  assert.deepEqual(validar(p), []);
});
