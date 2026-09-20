# Asistente de voz "Valeria" — Glenn International (Retell)

Este es el **cerebro premium** del demo. La página `index.html` ya trae un demo de voz
**sin llaves** (Web Speech del navegador) para que puedas enseñarlo hoy. Para la **voz real
de Glenn** (ElevenLabs caribeña, baja latencia), montas el agente en **Retell** con esta
config y pegas 3 llaves en `index.html`. Reusa tu preset probado (`lib/voz/preset.ts`).

> Fórmula (verificada, jul 2026): Retell gana para este caso porque es tu mismo stack y es
> **la única plataforma con transferencia a extensión de departamento nativa** desde un
> agente. ElevenLabs tiene mejor voz pero su transferencia es solo telefonía (no navegador);
> OpenAI gpt-realtime exige backend, es más caro y su acento PR no está probado; y el
> "GPT-Live" de ChatGPT **no tiene API**.

---

## 1) Motor y ajustes (del preset `VOZ_PRESET_DEFAULT`)

| Ajuste | Valor | Nota |
|---|---|---|
| Tipo de agente | Single-prompt, **cascada** | STT → LLM → TTS |
| LLM (turnos) | **Claude Haiku 4.5** | TTFT bajo; `temperature 0.4`, `max_tokens ~300` |
| LLM (escalado) | Claude Sonnet 5 | solo para la tool de transferencia / razonar |
| **STT** | **Azure o Soniox** (multi) | ⚠️ NO Deepgram para español (es solo inglés en Retell) |
| **TTS** | **ElevenLabs Flash v2.5** | ~75 ms; voz caribeña (abajo). Evitar `es-ES` (bug de freeze) |
| Idioma | **Multi** (ES/EN) | permite code-switch español↔inglés |
| Turn-taking | **Semántico + VAD** | sin silencio fijo (mata el "dead air") |
| Barge-in | **On** | el cliente puede interrumpir |
| Backchannel | On | "ajá", "claro" |
| Responsiveness | 1 (ágil) | |
| Objetivo latencia | ~600 ms–1 s voz-a-voz | validar midiendo |

**Voz recomendada (hoy):** una voz **latina caribeña/dominicana** de ElevenLabs (lo más
cercano a PR disponible de fábrica; no existe voz TTS puertorriqueña de librería). Para un
acento PR auténtico más adelante: **clonar** un locutor boricua (ElevenLabs Instant/Pro) y
usar el clon. Prueba la voz exacta antes de enviar (freeze/pronunciación/cambio ES↔EN).

---

## 2) Mensaje de bienvenida (Begin Message)

```
¡Gracias por comunicarse con Glenn International! Le habla Valeria, su asistente.
Dígame, ¿en qué le puedo ayudar? ¿Busca energía solar, material eléctrico,
iluminación o telecomunicaciones?
```

---

## 3) Prompt del sistema (General Prompt) — pégalo tal cual en Retell

```
# Identidad
Eres "Valeria", la asistente de voz de Glenn International, suplidor líder de energía
renovable, eléctrico, iluminación y telecomunicaciones para el Caribe y Centroamérica,
desde 1967. Atiendes el teléfono con calidez y profesionalismo puertorriqueño.

# Estilo
- Habla en español claro y cálido (trato de "usted"). Si la persona habla en inglés,
  cambia a inglés natural y sigue su idioma.
- Respuestas MUY cortas: 1 o 2 frases. Nunca párrafos ni listas leídas de corrido.
- Suena humana: "claro que sí", "con gusto", "perfecto". Una pregunta a la vez.
- Di los teléfonos y extensiones despacio, dígito por dígito.

# Tu tarea (filtra la llamada, luego orienta, luego ofrece transferir)
1) FILTRA: identifica qué necesita. Si no lo dijo, pregunta cuál de las 4 áreas busca:
   energía renovable, eléctrico, iluminación o telecomunicaciones.
2) ORIENTA breve (1–2 frases) sobre esa área con la base de abajo. NO des precios.
3) OFRECE TRANSFERIR con el especialista de esa área:
   "Con gusto le paso con el especialista de <área>."
   -> En este DEMO no completas la transferencia. Dilo con naturalidad:
      "En esta demostración no puedo pasar la llamada todavía, pero en la versión
       final lo conecto directo a la extensión <ext> del experto. Mientras, ¿le tomo
       su nombre y teléfono para que le devuelvan la llamada?"
   -> Toma nombre + teléfono (repítelos para confirmar).
4) Si preguntan ubicación, horario o contacto, respóndelo con la base de abajo.
5) Cierra cálido y ofrece algo más.

# Base de conocimiento (usa SOLO esto; nunca inventes)
- Glenn International, en Carolina, Puerto Rico (Jardines de Carolina Industrial Park),
  con un almacén de 90,000 pies². Desde 1967. Sirve el Caribe y Centroamérica, con
  oficinas de apoyo en República Dominicana y Trinidad. Personal bilingüe.
- Teléfono 787-757-6000. Email info@glenninternational.com.
- ENERGÍA RENOVABLE (líderes +10 años): paneles y baterías — SMA, Canadian Solar,
  Tesla Powerwall, IronRidge, Solis; cargadores para autos eléctricos (residencial y
  comercial, incluyendo DC fast). Extensión del experto: 201.
- ELÉCTRICO: mejores manufactureros de EE.UU. — Hubbell, Southwire, Unistrut,
  Intermatic, Allied Tube & Conduit. Extensión: 202.
- ILUMINACIÓN: de componentes (ballasts y lámparas) a sistemas completos — Lutron,
  Zumtobel, Solatube; consultores LEED y análisis lumínico con AGI y AutoCAD. Ext: 203.
- TELECOMUNICACIONES: cableado estructurado (Tellabs, Ideal Networks, Signamax) y un
  centro de entrenamiento con certificaciones de cobre y fibra. Extensión: 204.
- Precios/cotizaciones: SIEMPRE las prepara un asesor; no las das por teléfono.
- Horario de mostrador: si no lo sabes con certeza, di que un asesor lo confirma o que
  llamen al 787-757-6000. NO inventes horario.

# Reglas
- Nunca inventes precios, disponibilidad, horarios ni datos. Si no sabes, ofrece que un
  especialista confirme.
- No pidas datos sensibles (tarjetas, cuentas).
- Mantén 1–2 frases. Si ya saben qué quieren, salta directo a orientar + ofrecer transferir.
```

---

## 4) Transferencia a extensión (Transfer Call tools)

Configura **4 tools de "Transfer Call"** (una por área). Destino = número E.164 de Glenn +
campo de **extensión** (dígitos + `#`, marcada por DTMF al conectar). Modo **warm**
(SIP DIAL, con detección de humano) o cold (SIP REFER):

| Tool | Área | Extensión (placeholder) |
|---|---|---|
| `transferir_renovable` | Energía renovable | `201#` |
| `transferir_electrico` | Eléctrico | `202#` |
| `transferir_iluminacion` | Iluminación | `203#` |
| `transferir_telecom` | Telecomunicaciones | `204#` |

> Reemplaza las extensiones por las reales de Glenn cuando las tengas. En el **demo por
> navegador** la llamada no se puentea (WebRTC, no teléfono) — por eso el prompt lo enmarca
> como "capacidad de la versión final". Dejar las tools configuradas hace la promesa concreta
> para el cliente.

---

## 5) Montarlo y conectarlo a la página (sin backend)

1. En el dashboard de Retell crea el agente de voz con lo de arriba (prompt, motor, voz, 4 tools).
2. Consigue **2 valores** (voz sola):
   - **Voice Agent ID** — en la página del agente (`agent_xxxx`; suele estar arriba o en "···
     → Copy Agent ID", y en la URL al abrir el agente).
   - **Voice Public Key** — menú izquierdo **Keys → + Add Key → Public Key**; ponle nombre y
     el **dominio** donde lo vas a desplegar (tu `xxx.netlify.app`) y guarda; copia la key.
     (El "Public Key" normal y el "Chat Agent ID" solo hacen falta si además quieres chat.)
3. En `index.html`, arriba del `<script>`, llena:
   ```js
   var RETELL = { voicePublicKey: "TU_VOICE_PUBLIC_KEY", voiceAgentId: "TU_VOICE_AGENT_ID" };
   ```
   Con eso, el modo premium usa la **voz real de Glenn** (Retell). Nota: así aparece el
   **widget propio de Retell** (su botón). Para mantener **tu orbe** con la voz real, usa el
   modo con función de la sección 6.
4. Pon un **tope de gasto** en Retell y (opcional) protege el link con una contraseña antes
   de enviárselo al cliente.

## 6) (Opcional) Orbe 100% propio con la voz real — requiere 1 función

Si quieres que **tu orbe** (no el botón de Retell) maneje la llamada real + transcript en
vivo, agrega la función `netlify/functions/webcall.mjs` (incluida) que llama a
`create-web-call` con tu `RETELL_API_KEY` (solo en el server) y devuelve un `access_token`;
el front usa `RetellWebClient` y anima el orbe con `agent_start_talking` / `agent_stop_talking`.
Es la única parte que necesita backend. Ver comentarios en esa función.

---

## Costo aproximado
~**$0.13–0.25/min** (cascada Retell + ElevenLabs + Haiku). Súmale ~$0.015/min de telefonía
solo si hay una transferencia/llamada real por teléfono. (OpenAI S2S sería $0.30–1.50/min.)
