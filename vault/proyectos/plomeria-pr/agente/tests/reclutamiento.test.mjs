// node --test tests/reclutamiento.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const R = await import("../dist/reclutamiento.js");
const base = { id: "P-001", contactoId: "whatsapp:1787", nombre: "David Negron", whatsapp: "17876880738", nivelLicencia: "maestro", numeroLicencia: "4471", municipio: "Caguas", experiencia: "más de 15 años", equipo: "", disponibilidad: "", estado: "nuevo", creado: new Date(Date.now() - 3 * 3600_000).toISOString() };

test("años de experiencia desde lo que escribe la gente", () => {
  assert.equal(R.anosExperiencia("más de 15 años"), 15);
  assert.equal(R.anosExperiencia("como 12"), 12);
  assert.equal(R.anosExperiencia("15+"), 15);
  assert.equal(R.anosExperiencia("cinco años"), 5);
  assert.equal(R.anosExperiencia(""), null);
});
test("gran candidato = licencia oficial/maestro + 5 años o más", () => {
  assert.ok(R.esGranCandidato(base));
  assert.ok(!R.esGranCandidato({ ...base, experiencia: "3 años" }));
  assert.ok(!R.esGranCandidato({ ...base, nivelLicencia: "no tiene" }));
  assert.ok(!R.esGranCandidato({ ...base, nivelLicencia: "en tramite" }));
});
test("seguimiento: solo sin cita, una vez, después de 2 h y dentro de la semana", () => {
  assert.ok(R.pendienteSeguimiento(base));
  assert.ok(!R.pendienteSeguimiento({ ...base, entrevista: "2026-09-29T13:00:00Z" }));
  assert.ok(!R.pendienteSeguimiento({ ...base, avisadoSeguimiento: "ya" }));
  assert.ok(!R.pendienteSeguimiento({ ...base, creado: new Date().toISOString() }), "recién registrado: se le da chance de agendar");
  assert.ok(!R.pendienteSeguimiento({ ...base, creado: new Date(Date.now() - 9 * 86_400_000).toISOString() }));
});
test("mensajes de una línea para Yaileen", () => {
  const cita = R.mensajeCita(base, "2026-09-29T14:00:00Z");
  const gran = R.mensajeGranCandidato(base);
  for (const m of [cita, gran]) { assert.ok(!m.includes("\n"), m); assert.ok(m.length < 200, m); assert.ok(m.includes("(787) 688-0738") && m.includes("maestro #4471") && m.includes("Caguas")); }
  assert.ok(/10:00 AM/.test(cita), cita);
  assert.ok(/Llámalo/.test(gran));
});
