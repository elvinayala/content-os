// Leo, el Director Creativo, desde AI Core (13-oct, Elvin: "conecta ya todos los agentes").
// Leo no tiene puente propio ni herramientas: en Slack lo corre app/api/slack-eventos con su cerebro
// (vault/ceo/cerebro-director-creativo.md). Las tareas de AI Core para "leo" las atiende el puente de SOFI con una
// llamada directa a la API: solo texto, sin herramientas y sin efectos. Lo que no venga de AI Core se rechaza.
import fs from "node:fs";
import path from "node:path";

// USD por millón de tokens (entrada, salida).
const PRECIOS = { "claude-sonnet-5": [3, 15], "claude-opus-5": [5, 25], "claude-haiku-4-5": [1, 5] };

export function costoLeo(modelo, uso = {}) {
  const [pin, pout] = PRECIOS[modelo] ?? PRECIOS["claude-sonnet-5"];
  const entrada = (uso.input_tokens ?? 0) + (uso.cache_creation_input_tokens ?? 0) * 1.25 + (uso.cache_read_input_tokens ?? 0) * 0.1;
  return (entrada * pin + (uso.output_tokens ?? 0) * pout) / 1e6;
}

const REGLA = "\n\n---\nEsta revisión llega desde AI Core, no desde Slack: solo tienes el TEXTO (si mencionan una imagen o un flyer, pide que lo suban al canal de revisión en Slack). Responde con tu veredicto, lo que cambiarías y una versión mejorada cuando aplique. Corto, tuteo de Puerto Rico. No prometas que algo se publicó ni se envió. Firma — Leo.";

export async function revisarLeo({ texto, root, key, modelo = "claude-sonnet-5", f = fetch }) {
  const cerebro = fs.readFileSync(path.join(root, "vault/ceo/cerebro-director-creativo.md"), "utf8");
  const r = await f("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: modelo, max_tokens: 2500, system: cerebro + REGLA, messages: [{ role: "user", content: texto }] }),
    signal: AbortSignal.timeout(120000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `API ${r.status}`);
  const respuesta = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
  return { respuesta, costo: costoLeo(modelo, j.usage) };
}

/** Una vuelta: atiende las tareas de AI Core para Leo. `deps` = funciones del buzón (scripts/agentes.mjs). */
export async function atenderLeo({ pendientes, marcar, root, key, modelo, log = () => {}, f }) {
  if (!key) return 0;
  let atendidas = 0;
  for (const m of await pendientes("leo")) {
    if (m.hilo) { await marcar(m.id, "atendido").catch(() => {}); continue; }
    if (m.de !== "aicore") { await marcar(m.id, "fallido", "Leo solo atiende por el buzón las revisiones de AI Core; en Slack sigue en el canal de revisión.").catch(() => {}); continue; }
    await marcar(m.id, "en-curso").catch(() => {});
    try {
      const { respuesta, costo } = await revisarLeo({ texto: m.texto, root, key, modelo, f });
      await marcar(m.id, respuesta ? "atendido" : "fallido", (respuesta || "Leo no devolvió texto").slice(0, 4000), costo);
      log("leo ‹", `#${m.id}`, `$${costo.toFixed(4)}`);
      atendidas++;
    } catch (e) {
      await marcar(m.id, "fallido", `Leo no pudo revisar: ${String(e.message || e).slice(0, 300)}`).catch(() => {});
      log("leo:", e.message);
    }
  }
  return atendidas;
}
