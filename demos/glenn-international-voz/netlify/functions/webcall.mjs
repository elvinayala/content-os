// OPCIONAL — solo si quieres que TU orbe maneje la llamada real de Retell (voz de
// Glenn) con transcript en vivo, en vez del widget de Retell.
//
// Qué hace: crea un "web call" en Retell usando tu RETELL_API_KEY (que vive SOLO en el
// servidor, nunca en el navegador) y devuelve un access_token de corta duración que el
// front usa con RetellWebClient.startCall({ accessToken }).
//
// Requisitos:
//   1. En Netlify → Site settings → Environment variables: RETELL_API_KEY = tu key.
//   2. En Netlify → Environment: VOICE_AGENT_ID = el id del agente de voz de Glenn.
//   3. En el front, en vez de cargar el widget, llama a fetch('/api/webcall') y pasa el
//      access_token a RetellWebClient (SDK: https://www.npmjs.com/package/retell-client-js-sdk).
//
// Seguridad: chequea el Origin para que solo tu página pueda pedir tokens, y pon un tope
// de gasto en Retell. Es un demo público: cualquiera con el link puede iniciar llamadas.

export default async (req, context) => {
  // Demo público: refleja el origen (así funciona en cualquier URL de Netlify sin
  // configurar dominios). La protección real es el tope de gasto en Retell.
  const origin = req.headers.get("origin") || "*";
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers });

  const key = process.env.RETELL_API_KEY;
  const agentId = process.env.VOICE_AGENT_ID || "agent_a42595e72c3dcd00c74e8f0a2c";
  if (!key || !agentId) {
    return new Response(JSON.stringify({ error: "Falta RETELL_API_KEY o VOICE_AGENT_ID" }), { status: 500, headers });
  }

  try {
    const r = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return new Response(JSON.stringify({ error: `Retell ${r.status}`, detail: detail.slice(0, 300) }), { status: 502, headers });
    }
    const data = await r.json(); // { access_token, call_id, ... }
    return new Response(JSON.stringify({ access_token: data.access_token, call_id: data.call_id }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers });
  }
};

export const config = { path: "/api/webcall" };
