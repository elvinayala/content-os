import type { VozConfig } from "@/lib/types";

// ============================================================================
// El preset de voz "MUY probado" — baja latencia, español PR/LatAm, consistente.
// Es el corazón del pedido de Elvin: que los agentes respondan rápido, fluido
// y sobre todo CONSISTENTE. Sale de la investigación (cascada STT→LLM→TTS,
// turn-detection semántico, generación preventiva, barge-in, prompt chico +
// cacheado, LLM chico/rápido). El Voice Studio hornea esta config en cada
// agente nuevo; el adapter (lib/voz/*) la traduce al payload de Retell/Vapi.
//
// ⚠️ Las latencias son objetivos de planeamiento — se validan midiendo en real
// (ver PRESUPUESTO_LATENCIA y las métricas p50/p95 del agente).
// ============================================================================

export const VOZ_PRESET_DEFAULT: VozConfig = {
  // STT — Deepgram con parciales para disparar la generación preventiva.
  sttProveedor: "deepgram",
  sttModelo: "nova-3",
  idioma: "multi", // multilingüe: cubre el code-switch español/inglés de PR
  interimResults: true,

  // LLM — Haiku para turnos normales (TTFT bajo); Sonnet solo para tools/razonamiento.
  llmModelo: "claude-haiku-4-5-20251001",
  llmModeloEscalado: "claude-sonnet-5",
  temperatura: 0.4,
  maxTokens: 300,
  promptSistema:
    "Sos el asistente telefónico de {negocio}. Hablás claro, cálido y directo, " +
    "en español. Respuestas cortas: 1 o 2 frases, nunca párrafos. Tu objetivo: " +
    "{proposito}. Si no sabés algo, no inventes: ofrecé tomar los datos y que " +
    "alguien devuelva la llamada.",

  // TTS — ElevenLabs Flash v2.5 con una voz LatAm/PR fijada; streaming por oración.
  ttsProveedor: "elevenlabs",
  ttsVozId: "", // fijar una voz LatAm/PR probada (id de ElevenLabs)
  ttsModelo: "eleven_flash_v2_5",

  // Turn detection — semántico + VAD, NO silencio fijo (mata el "dead air").
  turnMode: "semantic",
  vadMinSilencioMs: 400,
  endpointMinMs: 400,
  endpointMaxMs: 2000,

  // Palancas de fluidez.
  generacionPreventiva: true, // dispara el LLM sobre el parcial (ahorra 150-350ms)
  bargeIn: true, // el cliente puede interrumpir; corta el TTS al detectar voz
  fillers: ["Dejame ver eso…", "Un segundo…", "Ahí lo busco…"],

  objetivoLatenciaMs: 1000, // voz-a-voz p50 (~1.0-1.2s en español, igual fluido)
};

// Presupuesto de latencia por etapa (ms) — para la UI de observabilidad y para
// medir contra el objetivo. Español suma ~300-500ms al TTFT del LLM.
export const PRESUPUESTO_LATENCIA = {
  endpointing: 200,
  stt: 130,
  llmTtft: 260,
  ttsTtfb: 110,
  transporte: 40,
} as const;

export function totalPresupuestoMs(): number {
  return Object.values(PRESUPUESTO_LATENCIA).reduce((a, b) => a + b, 0);
}

// Crea una VozConfig a partir del preset con overrides puntuales (nombre de
// negocio, propósito, voz, etc.). Reemplaza los placeholders del prompt.
export function configDesdePreset(overrides?: {
  negocio?: string;
  proposito?: string;
  parciales?: Partial<VozConfig>;
}): VozConfig {
  const base: VozConfig = { ...VOZ_PRESET_DEFAULT, ...overrides?.parciales };
  base.promptSistema = base.promptSistema
    .replace("{negocio}", overrides?.negocio ?? "tu negocio")
    .replace("{proposito}", overrides?.proposito ?? "atender y calificar");
  return base;
}
