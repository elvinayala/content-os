// Aprovisiona el agente de voz "Valentina" de Glenn International en Retell (workspace
// AI Borinquen), vía API. Copia la fórmula del demo "Clinic Up": voz custom Valentina
// (eleven_v3) + ajustes afinados. Filtro de llamada + 4 transferencias a extensión.
// Estilo: tuteo boricua (tú/tienes).
//
// Uso:
//   1. RETELL_API_KEY (la del workspace AI Borinquen) en .env.local
//   2. node scripts/provision-retell-glenn.mjs
// Crear agentes NO cuesta (se paga por minuto de llamada). Guarda ids en
// demos/glenn-international-voz/retell-provisioned.json

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API = "https://api.retellai.com";

function readEnvKey() {
  if (process.env.RETELL_API_KEY) return process.env.RETELL_API_KEY.trim();
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const m = env.match(/^RETELL_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return null;
}
const KEY = readEnvKey();
if (!KEY) { console.error("\n❌ Falta RETELL_API_KEY en .env.local\n"); process.exit(1); }
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function api(pathname, opts = {}) {
  const res = await fetch(API + pathname, { headers: H, ...opts });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${pathname} → ${res.status}: ${text.slice(0, 500)}`);
  return json;
}

// Voz + ajustes copiados del demo Clinic Up (ya afinados por Elvin)
const VOICE_ID = "custom_voice_ac0ebbc0d0419afa7cd1882530"; // "Valentina - Joyful, Lively Friend"
const VOICE_MODEL = "eleven_v3";
const GLENN_NUMBER = "+17877576000"; // placeholder DID del PBX de Glenn (cámbialo por el real)

const GENERAL_PROMPT = `# Identidad
Eres "Valentina", la asistente de voz de Glenn International, suplidor líder de energía renovable, eléctrico, iluminación y telecomunicaciones para el Caribe y Centroamérica, desde 1967. Contestas el teléfono con calidez y cercanía boricua.

# Estilo
- Habla en español de Puerto Rico, cálido y cercano, de TÚ (tuteo: tú/tienes). Nada de "usted" acartonado ni de voseo argentino (vos/tenés). Si te hablan en inglés, cambia a inglés natural y sigue su idioma.
- Esto es una llamada de VOZ: todo lo que escribas se lee en voz alta. NUNCA uses emojis, asteriscos, markdown, viñetas ni símbolos.
- Respuestas MUY cortas: 1 o 2 frases. Nunca párrafos ni listas leídas de corrido.
- Suena humana: "claro que sí", "con mucho gusto", "¡perfecto!". Una pregunta a la vez.
- Di teléfonos y extensiones despacio, dígito por dígito.

# Tu tarea
1) FILTRA: identifica qué necesita la persona. Si no lo dijo, pregúntale cuál de las 4 áreas busca: energía renovable, eléctrico, iluminación o telecomunicaciones.
2) ORIENTA breve (1–2 frases) sobre esa área con la base de abajo. NO des precios.
3) OFRECE TRANSFERIR con el especialista de esa área. Usa la herramienta correspondiente (transferir_renovable / transferir_electrico / transferir_iluminacion / transferir_telecom) SOLO cuando la persona acepte. Antes de transferir, dile brevemente que la vas a pasar con el experto de esa área.
   - Si la transferencia no conecta: discúlpate UNA sola vez, da el teléfono 787-757-6000 con la extensión del área, y sigue ayudando. NO intentes transferir otra vez.
4) Si preguntan por ubicación, horario o contacto, respóndelo con la base de abajo.
5) Cierra cálido y ofrece algo más. Cuando la persona se despida o diga que no necesita nada más, despídete en UNA frase y usa la herramienta end_call para colgar. No preguntes "¿estás ahí?" después de despedirte.

# Base de conocimiento (usa SOLO esto; nunca inventes)
- Glenn International, en Carolina, Puerto Rico (Jardines de Carolina Industrial Park), con un almacén de 90,000 pies². Desde 1967. Sirve el Caribe y Centroamérica, con oficinas de apoyo en República Dominicana y Trinidad. Personal bilingüe.
- Teléfono 787-757-6000. Email info@glenninternational.com.
- ENERGÍA RENOVABLE (líderes +10 años): paneles y baterías — SMA, Canadian Solar, Tesla Powerwall, IronRidge, Solis; cargadores para autos eléctricos (residencial y comercial, DC fast). Experto: extensión 201.
- ELÉCTRICO: los mejores manufactureros de EE.UU. — Hubbell, Southwire, Unistrut, Intermatic, Allied Tube & Conduit. Experto: extensión 202.
- ILUMINACIÓN: de componentes (ballasts y lámparas) a sistemas completos — Lutron, Zumtobel, Solatube; consultores LEED y análisis lumínico con AGI y AutoCAD. Experto: extensión 203.
- TELECOMUNICACIONES: cableado estructurado (Tellabs, Ideal Networks, Signamax) y un centro de entrenamiento con certificaciones de cobre y fibra. Experto: extensión 204.
- Precios/cotizaciones: SIEMPRE las prepara un asesor; no las das por teléfono.
- Horario de mostrador: si no lo sabes con certeza, di que un asesor lo confirma o que llamen al 787-757-6000. NO inventes horario.

# Reglas
- Trato cálido pero PROFESIONAL. NUNCA uses apelativos cariñosos ni diminutivos afectivos: nada de "mi amor", "amor", "cariño", "corazón", "mi vida", "mija", "mijo", "querido", "querida", "bella", "nene" ni "nena". Dirígete a la persona con respeto (por su nombre si lo tienes; si no, sin apelativo).
- Nunca inventes precios, disponibilidad, horarios ni datos.
- No pidas datos sensibles (tarjetas, cuentas).
- Mantén 1–2 frases.`;

const BEGIN = "¡Gracias por comunicarte con Glenn International! Te habla Valentina. Dime, ¿en qué te puedo ayudar? ¿Buscas energía solar, material eléctrico, iluminación o telecomunicaciones?";

function transferTool(name, area, ext) {
  return {
    type: "transfer_call",
    name,
    description: `Transferir la llamada al especialista de ${area} (extensión ${ext}). Úsala solo cuando la persona acepte que la transfieras.`,
    transfer_destination: { type: "predefined", number: GLENN_NUMBER, extension: `${ext}#` },
    transfer_option: { type: "warm_transfer" },
  };
}
const TOOLS = [
  transferTool("transferir_renovable", "energía renovable", "201"),
  transferTool("transferir_electrico", "material eléctrico", "202"),
  transferTool("transferir_iluminacion", "iluminación", "203"),
  transferTool("transferir_telecom", "telecomunicaciones", "204"),
  {
    type: "end_call",
    name: "end_call",
    description:
      "Colgar la llamada. Úsala inmediatamente después de despedirte, cuando la persona se despida o confirme que no necesita nada más.",
  },
];

// Marcas/nombres que el STT debe reconocer mejor en medio del español
const BOOSTED = [
  "Glenn", "Glenn International", "Lutron", "Zumtobel", "Solatube",
  "Hubbell", "Southwire", "Unistrut", "Intermatic", "Tellabs", "Signamax",
  "Powerwall", "Tesla", "IronRidge", "Canadian Solar", "SMA", "Solis",
];

async function main() {
  console.log("→ Creando el Retell LLM (prompt tuteo + 4 transferencias)…");
  const llm = await api("/create-retell-llm", {
    method: "POST",
    body: JSON.stringify({
      general_prompt: GENERAL_PROMPT,
      begin_message: BEGIN,
      model: "claude-4.5-haiku",
      model_temperature: 0.4,
      start_speaker: "agent",
      general_tools: TOOLS,
    }),
  });
  console.log(`✓ LLM: ${llm.llm_id}`);

  console.log("→ Creando el agente de voz (voz Valentina + ajustes de Clinic Up)…");
  const agent = await api("/create-agent", {
    method: "POST",
    body: JSON.stringify({
      agent_name: "Glenn International - Demo Asistente de Voz",
      response_engine: { type: "retell-llm", llm_id: llm.llm_id },
      voice_id: VOICE_ID,
      voice_model: VOICE_MODEL,
      language: "multi",
      interruption_sensitivity: 0.6,
      responsiveness: 0.8,
      voice_speed: 1.16,
      voice_temperature: 0.7,
      enable_backchannel: true,
      max_call_duration_ms: 180000,      // tope duro de 3 min por llamada (demo)
      end_call_after_silence_ms: 90000,  // corta llamadas muertas a 90s (no 10 min)
      boosted_keywords: BOOSTED,         // mejor STT de marcas en español
    }),
  });
  console.log(`✓ Agente: ${agent.agent_id}`);

  const out = {
    agent_id: agent.agent_id,
    llm_id: llm.llm_id,
    voice_id: VOICE_ID,
    voice_name: "Valentina - Joyful, Lively Friend",
    workspace: "AI Borinquen",
    created_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ROOT, "demos/glenn-international-voz/retell-provisioned.json"), JSON.stringify(out, null, 2));
  console.log(`\n✅ Listo. VOICE_AGENT_ID = ${agent.agent_id}`);
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });
