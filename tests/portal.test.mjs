import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { firmarAccesoPortal, tokenPortal, tokenPortalValido, verificarAccesoPortal } from "../lib/portal/acceso.ts";
import { aLlamadaPortal, aTurnos, leadDeLlamada, normalizarCanal, normalizarEtapa, resultadoDe } from "../lib/portal/mapear-llamada.ts";

const call = JSON.parse(readFileSync(new URL("./fixtures/retell-call.json", import.meta.url), "utf8"));
const SECRETO = "secreto-de-prueba-0123456789abcdef";

test("aTurnos: solo agent/user, sin vacíos, roles en español", () => {
  const t = aTurnos(call);
  assert.equal(t.length, 5);
  assert.deepEqual(
    t.map((x) => x.rol),
    ["agente", "cliente", "agente", "cliente", "agente"],
  );
  assert.ok(!t.some((x) => x.texto.includes("ignorar")));
});

test("aLlamadaPortal: estado, duración, latencias, grabación", () => {
  const l = aLlamadaPortal(call);
  assert.equal(l.callId, call.call_id);
  assert.equal(l.estado, "analizada");
  assert.equal(l.duracionSeg, 88);
  assert.equal(l.latenciaP50Ms, 1180);
  assert.equal(l.latenciaP95Ms, 1900);
  assert.equal(l.exitosa, true);
  assert.equal(l.sentimiento, "Positive");
  assert.match(l.grabacionUrl, /recording\.wav$/);
  assert.equal(l.inicio, new Date(call.start_timestamp).toISOString());
  assert.equal(l.resultado, "Cita solicitada");
});

test("aLlamadaPortal: llamada terminada sin análisis ni transcripción", () => {
  const l = aLlamadaPortal({ call_id: "call_x", call_status: "ended", start_timestamp: 1, end_timestamp: 30001 });
  assert.equal(l.estado, "terminada");
  assert.equal(l.duracionSeg, 30);
  assert.deepEqual(l.turnos, []);
  assert.equal(l.resultado, null);
  assert.equal(l.latenciaP50Ms, null);
});

test("resultadoDe: prioridad cita > datos > éxito", () => {
  assert.equal(resultadoDe({ call_id: "c", call_analysis: { custom_analysis_data: { quiere_cita: "sí" } } }), "Cita solicitada");
  assert.equal(resultadoDe({ call_id: "c", call_analysis: { custom_analysis_data: { telefono: "787" } } }), "Datos tomados");
  assert.equal(resultadoDe({ call_id: "c", call_analysis: { call_successful: false } }), "Sin resolver");
  assert.equal(resultadoDe({ call_id: "c" }), null);
  assert.equal(resultadoDe({ call_id: "c", call_status: "error", call_analysis: { call_successful: false } }), "No conectó");
  assert.equal(aLlamadaPortal({ call_id: "c", call_status: "error", call_analysis: { user_sentiment: "Unknown" } }).sentimiento, null);
});

test("leadDeLlamada: saca nombre, teléfono, interés y etapa", () => {
  const lead = leadDeLlamada(call);
  assert.deepEqual(lead, {
    nombre: "Michelle Ortiz",
    telefono: "787-555-0142",
    interes: "Botox",
    canal: "voz",
    etapa: "cita_agendada",
    origenRef: call.call_id,
  });
  assert.equal(leadDeLlamada({ call_id: "c", call_analysis: { custom_analysis_data: {} } }), null);
});

test("normalizarEtapa / normalizarCanal: las etapas libres de Claude caen en las 5 fijas", () => {
  assert.equal(normalizarEtapa("Nuevo"), "nuevo");
  assert.equal(normalizarEtapa("Calificado"), "contactado");
  assert.equal(normalizarEtapa("Cita agendada"), "cita_agendada");
  assert.equal(normalizarEtapa("Atendido"), "confirmada");
  assert.equal(normalizarEtapa("Seguimiento"), "contactado");
  assert.equal(normalizarEtapa("Cerrado / ganado"), "cerrado");
  assert.equal(normalizarEtapa(undefined), "contactado");
  assert.equal(normalizarCanal("Instagram"), "instagram");
  assert.equal(normalizarCanal("Llamada"), "voz");
  assert.equal(normalizarCanal("WhatsApp"), "whatsapp");
  assert.equal(normalizarCanal("otro"), "ejemplo");
});

test("tokenPortal: determinístico, 32 hex, y valida en tiempo constante", async () => {
  const a = await tokenPortal("skin-clinic-pr", SECRETO);
  const b = await tokenPortal("skin-clinic-pr", SECRETO);
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(a, await tokenPortal("otro-slug", SECRETO));
  assert.equal(await tokenPortalValido("skin-clinic-pr", a, SECRETO), true);
  assert.equal(await tokenPortalValido("skin-clinic-pr", a.slice(0, 31), SECRETO), false);
  assert.equal(await tokenPortalValido("skin-clinic-pr", a, "otro-secreto"), false);
  assert.equal(await tokenPortal("Slug Inválido!", SECRETO), null);
  assert.equal(await tokenPortal("skin-clinic-pr", undefined), null);
});

test("cookie del portal: firma y verifica por slug; rechaza firma ajena y formato raro", async () => {
  const cookie = await firmarAccesoPortal("skin-clinic-pr", SECRETO);
  assert.deepEqual(await verificarAccesoPortal(cookie, SECRETO), { slug: "skin-clinic-pr" });
  assert.equal(await verificarAccesoPortal(cookie, "otro"), null);
  assert.equal(await verificarAccesoPortal(cookie + "x", SECRETO), null);
  assert.equal(await verificarAccesoPortal("a.b", SECRETO), null);
  assert.equal(await verificarAccesoPortal(undefined, SECRETO), null);
});
