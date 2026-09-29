import assert from "node:assert/strict";
import { test } from "node:test";

import { cuerpoEvento, errorAnotacion, eventosDelDia } from "../lib/desempeno/google-cal-reglas.ts";

test("eventos del día: sin cancelados ni rechazados, todo el día primero, hora de PR", () => {
  const e = eventosDelDia([
    { id: "b", summary: "Reunión con cliente", start: { dateTime: "2026-09-29T14:00:00Z" }, end: { dateTime: "2026-09-29T14:30:00Z" }, hangoutLink: "https://meet.google.com/x" },
    { id: "a", summary: "Entregar reporte", start: { date: "2026-09-29" }, end: { date: "2026-09-30" } },
    { id: "c", summary: "Cancelada", status: "cancelled", start: { dateTime: "2026-09-29T15:00:00Z" } },
    { id: "d", summary: "Rechazada", start: { dateTime: "2026-09-29T16:00:00Z" }, attendees: [{ self: true, responseStatus: "declined" }] },
  ]);
  assert.deepEqual(e.map((x) => x.id), ["a", "b"]);
  assert.equal(e[1].inicio, "10:00 AM");
  assert.equal(e[1].link, "https://meet.google.com/x");
  assert.equal(e[0].todoElDia, true);
});

test("anotar: validación", () => {
  assert.equal(errorAnotacion({ titulo: " ", fecha: "2026-09-29" }), "Escribe qué quieres anotar");
  assert.equal(errorAnotacion({ titulo: "Llamar a Jessica", fecha: "2026-09-29", hora: "25:00" }), "Hora inválida");
  assert.equal(errorAnotacion({ titulo: "Llamar a Jessica", fecha: "2026-09-29", hora: "14:30", minutos: 30 }), null);
});

test("anotar: con hora = bloque en hora de PR; sin hora = todo el día con aviso", () => {
  const c = cuerpoEvento({ titulo: "Llamar a Jessica", fecha: "2026-09-29", hora: "14:30", minutos: 45 });
  assert.equal(c.start.dateTime, "2026-09-29T18:30:00.000Z");
  assert.equal(c.end.dateTime, "2026-09-29T19:15:00.000Z");
  assert.equal(c.reminders.overrides[0].minutes, 10);
  const t = cuerpoEvento({ titulo: "Mandar facturas", fecha: "2026-09-30" });
  assert.deepEqual(t.start, { date: "2026-09-30" });
  assert.deepEqual(t.end, { date: "2026-10-01" });
  assert.match(t.description, /Ritmo/);
});
