import assert from "node:assert/strict";
import { test } from "node:test";

import { horaBonita, PUEBLOS_PR, puebloOficial, resumenTrabajos, validarTrabajo } from "../lib/desempeno/trabajos-reglas.ts";
import { puestoPorId } from "../lib/desempeno/reglas.ts";

const HOY = "2026-10-12";
const base = { fecha: HOY, hora: "9:05", trabajo: "Grabé 3 reels del menú", negocio: "Tinos Pizza", pueblo: "mayaguez", videos: 3 };

test("los 78 pueblos de PR y el pueblo escrito como sea", () => {
  assert.equal(PUEBLOS_PR.length, 78);
  assert.equal(puebloOficial("mayaguez"), "Mayagüez");
  assert.equal(puebloOficial("  SAN   juan "), "San Juan");
  assert.equal(puebloOficial("Miami"), null);
});

test("validar: limpia hora y pueblo; rechaza futuro, muy viejo, pueblo de fuera y videos raros", () => {
  const v = validarTrabajo(base, HOY);
  assert.ok(v.ok);
  assert.equal(v.ok && v.t.hora, "09:05");
  assert.equal(v.ok && v.t.pueblo, "Mayagüez");
  assert.equal(validarTrabajo({ ...base, fecha: "2026-10-13" }, HOY).ok, false);
  assert.equal(validarTrabajo({ ...base, fecha: "2026-10-05" }, HOY).ok, true); // 7 días atrás vale
  assert.equal(validarTrabajo({ ...base, fecha: "2026-10-04" }, HOY).ok, false);
  assert.equal(validarTrabajo({ ...base, pueblo: "Orlando" }, HOY).ok, false);
  assert.equal(validarTrabajo({ ...base, videos: -1 }, HOY).ok, false);
  assert.equal(validarTrabajo({ ...base, videos: 2.5 }, HOY).ok, false);
  assert.equal(validarTrabajo({ ...base, hora: "25:00" }, HOY).ok, false);
  assert.equal(validarTrabajo({ ...base, trabajo: "x" }, HOY).ok, false);
});

test("resumen del día: trabajos, videos y negocios distintos, con detalle en orden de hora", () => {
  const r = resumenTrabajos([
    { ...base, hora: "14:00", pueblo: "Ponce", negocio: "Café Ponce", videos: 2 },
    { ...base, hora: "09:00", pueblo: "Mayagüez", videos: 3 },
    { ...base, hora: "11:00", pueblo: "Mayagüez", negocio: "tinos pizza", videos: 1 },
  ]);
  assert.deepEqual(r.datos, { trabajos: 3, videos: 6, negocios: 2 });
  assert.match(r.detalles.trabajos, /^09:00 Tinos Pizza \(Mayagüez\)/);
  assert.deepEqual(resumenTrabajos([]), { datos: { trabajos: 0, videos: 0, negocios: 0 }, detalles: {} });
});

test("puesto Videógrafo: no poncha, anota trabajos", () => {
  const p = puestoPorId("videografo");
  assert.equal(p?.nombre, "Videógrafo");
  assert.equal(p?.soloReporte, true);
  assert.equal(p?.trabajos, true);
  assert.deepEqual(p?.manual?.map((m) => m.id), ["trabajos", "videos", "negocios"]);
  assert.equal(horaBonita("14:30"), "2:30 PM");
  assert.equal(horaBonita("00:05"), "12:05 AM");
});
