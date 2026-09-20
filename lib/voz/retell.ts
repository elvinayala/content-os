import "server-only";

import type { AgenteVoz } from "@/lib/types";

// Adapter de Retell. En PASO 01 la creación es LOCAL (mock): la consola admin
// anda completa sin cuenta ni key. Cuando Elvin ponga RETELL_API_KEY, el path
// real (crearAgenteRemoto) crea el agente en Retell con el preset ya horneado.
//
// El flujo real de Retell son 2 pasos: (1) crear el "response engine" / LLM
// (POST https://api.retellai.com/create-retell-llm) con el system prompt y el
// modelo; (2) POST https://api.retellai.com/create-agent con ese engine +
// voice_id (ElevenLabs) + ajustes de turn-taking. Se cablea cuando haya key.

export function disponible(): boolean {
  return !!process.env.RETELL_API_KEY;
}

// Traduce la VozConfig neutral al payload de Retell (para cuando se cablee).
export function renderPayload(a: AgenteVoz): Record<string, unknown> {
  const c = a.config;
  return {
    agent_name: a.nombre,
    voice_id: c.ttsVozId || undefined,
    language: c.idioma === "multi" ? "multi" : "es-ES",
    // Turn-taking: semántico + VAD, sin silencio fijo.
    interruption_sensitivity: c.bargeIn ? 1 : 0,
    responsiveness: 1, // Retell: 1 = más ágil
    enable_backchannel: true,
    // El LLM/engine va en create-retell-llm; acá referencia el modelo.
    llm: { model: c.llmModelo, temperature: c.temperatura, general_prompt: c.promptSistema },
    // STT/TTS: Deepgram + ElevenLabs Flash (según el preset).
    stt: { provider: c.sttProveedor, model: c.sttModelo },
    tts: { provider: c.ttsProveedor, model: c.ttsModelo },
  };
}

// Crea el agente en Retell (real). Requiere RETELL_API_KEY. Lanza si falla:
// el server action lo captura y cae a creación local con una nota.
export async function crearAgenteRemoto(
  a: AgenteVoz,
): Promise<{ externalId: string; numero?: string }> {
  const key = process.env.RETELL_API_KEY;
  if (!key) throw new Error("Falta RETELL_API_KEY");

  const res = await fetch("https://api.retellai.com/create-agent", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(renderPayload(a)),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Retell ${res.status}: ${detalle.slice(0, 200)}`);
  }
  const json = (await res.json()) as { agent_id?: string };
  if (!json.agent_id) throw new Error("Retell no devolvió agent_id");
  return { externalId: json.agent_id };
}
