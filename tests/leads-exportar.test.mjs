import assert from "node:assert/strict";
import { test } from "node:test";

import { celda, COLUMNAS_EXPORT, csvLeads, descargaVigente, describirFiltro, fechaPR, filaExport, modoExportar, nombreArchivo, puedeExportarLeads, telefonoExport } from "../lib/leads/exportar.ts";

const lead = {
  id: "t1",
  nombre: "Carol Andrews",
  negocio: "Andrews Medical; Aesthetics",
  telefono: "17874092812",
  email: "carol@x.com",
  embudo: "CLOSERS",
  etapa: "Follow up",
  estado: "abierto",
  valor: 3500,
  dueno: "Roger Arteaga",
  agendoPor: "luis",
  origen: "calendly",
  etiquetas: ["alto ticket", "salud"],
  datos: { nicho: "Medicina estética" },
  motivoPerdida: null,
  proximaActividad: "2026-09-29T18:00:00Z",
  ultimoMensaje: null,
  etapaDesde: "2026-09-25T12:00:00Z",
  createdAt: "2026-09-24T13:30:00Z",
  cerradoAt: null,
};

test("fila con las columnas de Pipedrive, en hora de PR", () => {
  const f = filaExport(lead, new Date("2026-09-28T12:00:00Z"));
  assert.equal(f.length, COLUMNAS_EXPORT.length);
  assert.equal(f[2], "+1 787-409-2812");
  assert.equal(f[6], "Abierto");
  assert.equal(f[11], "Medicina estética");
  assert.equal(f[12], "alto ticket, salud");
  assert.equal(f[14], "2026-09-29 14:00"); // 18:00 UTC = 2 PM PR
  assert.equal(f[16], "3"); // días en la etapa
  assert.equal(fechaPR(null), "");
});

test("CSV para Excel: BOM, ; y comillas; fórmulas neutralizadas", () => {
  const csv = csvLeads([lead]);
  assert.ok(csv.startsWith("﻿Nombre;Negocio;"));
  assert.match(csv, /"Andrews Medical; Aesthetics"/);
  assert.equal(celda("=HYPERLINK(\"http://x\")"), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(celda("+1 787-409-2812"), "+1 787-409-2812"); // un teléfono no es fórmula
  assert.equal(celda("-5"), "'-5");
});

test("teléfonos, permisos y nombre del archivo", () => {
  assert.equal(telefonoExport("7874092812"), "+1 787-409-2812");
  assert.equal(telefonoExport("573001234567"), "+573001234567");
  assert.equal(telefonoExport(null), "");
  assert.equal(puedeExportarLeads({ rol: "admin", email: "e@x" }), true);
  assert.equal(puedeExportarLeads({ rol: "editor", email: "carilin@levelupmediapr.net" }), false);
  assert.equal(nombreArchivo("level-up", "LUM DIAGNÓSTICO", "todos", "2026-09-28"), "leads-level-up-lum-diagnostico-todos-2026-09-28.csv");
  assert.equal(nombreArchivo("level-up", null, "abierto", "2026-09-28"), "leads-level-up-todos-abierto-2026-09-28.csv");
});

test("Elvin exporta directo; Nahuel y Aure con su OK; nadie más", () => {
  assert.equal(modoExportar({ rol: "admin", email: "elvin@x" }), "directo");
  assert.equal(modoExportar({ rol: "editor", email: "aure@levelupmediapr.net" }), "con_ok");
  assert.equal(modoExportar({ rol: "miembro", email: "NahuelTissera46@gmail.com" }), "con_ok");
  assert.equal(modoExportar({ rol: "editor", email: "carilin@levelupmediapr.net" }), null);
  assert.equal(modoExportar({ rol: "miembro", email: "roger.arteaga@levelupmediapr.net" }), null);
  const ahora = new Date("2026-09-28T12:00:00Z");
  assert.equal(descargaVigente({ estado: "aprobada", expiraAt: "2026-09-29T11:00:00Z" }, ahora), true);
  assert.equal(descargaVigente({ estado: "aprobada", expiraAt: "2026-09-28T11:00:00Z" }, ahora), false);
  assert.equal(descargaVigente({ estado: "descargada", expiraAt: "2026-09-29T11:00:00Z" }, ahora), false);
  assert.equal(describirFiltro({ embudoId: "e", embudoNombre: "CLOSERS", estado: "abierto", dueno: "u", duenoNombre: "Roger", q: "" }, "Level Up"), "Level Up · CLOSERS · abiertos · de Roger");
});
