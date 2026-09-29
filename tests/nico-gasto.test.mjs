import assert from "node:assert/strict";
import { test } from "node:test";

import { modeloParaNico, nombreCorto, NICO_HAIKU, NICO_OPUS, NICO_SONNET } from "../scripts/nico-gasto.mjs";

test("construir, diseñar y planear siguen en Opus 5.5 (ahí no se escatima)", () => {
  for (const t of [
    "Nico, constrúyeme el panel de facturación de Bori con su migración",
    "diseña la estructura de datos para el nuevo módulo de contratos",
    "hazme un plan para migrar n8n a la nube",
    "arma el AutoFlow completo de Quality Care de punta a punta",
    "necesito que integres GoHighLevel con Pulse",
    "redisena la pagina de login de Ritmo",
    "revisa la seguridad de Pulse y arregla lo que encuentres",
    "arregla el bug del deploy que tumba producción",
  ]) assert.equal(modeloParaNico(t), NICO_OPUS, t);
});

test("consultas, revisiones y diagnósticos van en Sonnet", () => {
  for (const t of [
    "¿por qué el webhook de Calendly no está entrando?",
    "mira los logs de Railway a ver qué pasó anoche",
    "¿cuántos clientes hay en el tablero de Level Up?",
    "revisa si el cron de respaldo corrió",
    "dime qué hace el endpoint /api/agentes",
  ]) assert.equal(modeloParaNico(t), NICO_SONNET, t);
});

test("trámites cortos y el cierre del día van en Haiku", () => {
  assert.equal(modeloParaNico("ok", "telegram"), NICO_HAIKU);
  assert.equal(modeloParaNico("gracias, listo", "telegram"), NICO_HAIKU);
  assert.equal(modeloParaNico("¿cómo va?", "telegram"), NICO_HAIKU);
  assert.equal(modeloParaNico("lo que sea", "cierre"), NICO_HAIKU);
});

test("la ronda diaria y el diagnóstico de una solicitud del equipo no necesitan Opus", () => {
  assert.equal(modeloParaNico("Haz tu ronda ahora: sigue .claude/commands/ronda-nico.md", "telegram"), NICO_SONNET);
  assert.equal(modeloParaNico("cualquier cosa", "ronda"), NICO_SONNET);
  // Carilin pide algo grande: el DIAGNÓSTICO (solo lectura) va en Sonnet…
  assert.equal(modeloParaNico("Nico, necesito que construyas un tablero nuevo", "solicitud:12:carilin"), NICO_SONNET);
  // …y cuando Elvin aprueba, la ejecución sí es Opus.
  assert.equal(modeloParaNico("Nico, necesito que construyas un tablero nuevo", "aprobada:12:carilin"), NICO_OPUS);
});

test("un brief largo es trabajo de verdad aunque no traiga palabra clave", () => {
  assert.equal(modeloParaNico("a".repeat(700)), NICO_OPUS);
  assert.equal(modeloParaNico("a".repeat(100)), NICO_SONNET);
});

test("nombreCorto para los logs", () => {
  assert.equal(nombreCorto(NICO_OPUS), "opus");
  assert.equal(nombreCorto(NICO_SONNET), "sonnet");
  assert.equal(nombreCorto(NICO_HAIKU), "haiku");
});
