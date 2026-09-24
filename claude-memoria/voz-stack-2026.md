---
name: voz-stack-2026
description: Hallazgos verificados (jul 2026) del mejor stack para agentes de voz de AutoFlow — Retell vs OpenAI vs ElevenLabs
metadata: 
  node_type: memory
  type: reference
  originSessionId: 92e193c8-fd41-4275-bf5e-0c8dd880f997
---

Investigación verificada (jul 2026) para elegir motor de voz de agentes ([[bori-superplataforma]] AutoFlow):

- **Retell = mejor para nuestro caso.** Es nuestro stack (`lib/voz/preset.ts`, `retell.ts`) y la
  **única plataforma con transferencia a extensión de departamento nativa** (número + ext por
  DTMF, warm/cold SIP). Demo por navegador **sin backend** con **llaves públicas** (voice widget)
  o un web-call hosteado; backend (1 Netlify Function → `create-web-call` → access_token +
  `RetellWebClient`) solo si quieres orbe 100% propio. STT para español = **Azure/Soniox**
  (Deepgram es solo inglés en Retell). Costo ~$0.13–0.25/min.
- **OpenAI:** el **"GPT-Live" (8 jul 2026) es solo ChatGPT, NO tiene API.** El modelo de dev es
  **gpt-realtime** (S2S, excelente, tool-calling), pero para navegador **exige backend**
  (token efímero), cuesta $0.30–1.50/min y el acento PR no está probado.
- **ElevenLabs (ElevenAgents):** mejor calidad de voz + más fácil sin backend (agente público +
  allowlist de dominio, `@elevenlabs/convai-widget-embed`), pero **su `transfer_to_number` es solo
  telefonía y está deshabilitado en el widget de navegador** → no modela la transferencia a
  extensión. Flash v2.5 ~75 ms.
- **Voz PR:** no existe voz TTS puertorriqueña de librería. Cercano = voz caribeña/dominicana de
  ElevenLabs; auténtico = **clonar** un locutor PR (ElevenLabs). Evitar `es-ES` (bug de freeze en Retell).
- **Fallback sin llaves:** Web Speech API (`webkitSpeechRecognition` + `speechSynthesis`) — $0, sin
  backend, pero voz robótica del SO y solo Chrome/Edge. Solo como degradación, no como el artefacto premium.
