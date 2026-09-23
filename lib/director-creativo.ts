import fs from "node:fs";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

// Director Creativo de Level Up: revisa flyers, guiones, hooks y CTAs que el equipo sube al
// canal de revisión en Slack, con el criterio de Elvin (vault/ceo/cerebro-director-creativo.md).
// Lo llama app/api/slack-eventos cuando el mensaje cae en SLACK_DIRECTOR_CHANNEL_ID.

export const MODEL_DIRECTOR = process.env.DIRECTOR_MODEL || "claude-opus-5";

const CEREBRO = path.join(process.cwd(), "vault", "ceo", "cerebro-director-creativo.md");
let cerebroCache: string | null = null;
function cerebro(): string {
  if (cerebroCache === null) cerebroCache = fs.readFileSync(CEREBRO, "utf8");
  return cerebroCache;
}

export interface Adjunto {
  tipo: "image" | "pdf";
  mediaType: string; // image/png|jpeg|gif|webp | application/pdf
  base64: string;
  nombre: string;
}

export interface TurnoDirector {
  rol: "equipo" | "director";
  autor?: string; // nombre para mostrar
  esCEO?: boolean;
  texto: string;
  adjuntos?: Adjunto[];
}

const IMAGEN_OK = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_BYTES_IMAGEN = 5 * 1024 * 1024; // límite de la API por imagen
const MAX_BYTES_PDF = 20 * 1024 * 1024;

// Baja un archivo de Slack (necesita el scope files:read en la app). Devuelve null si no es
// imagen/PDF o si pesa más de lo que acepta la API; el llamador avisa en el texto.
export async function descargarDeSlack(f: {
  mimetype?: string;
  url_private_download?: string;
  url_private?: string;
  name?: string;
  size?: number;
}): Promise<Adjunto | "no-soportado" | "muy-grande" | "error"> {
  const token = process.env.SLACK_BOT_TOKEN;
  const url = f.url_private_download || f.url_private;
  const mime = (f.mimetype || "").toLowerCase();
  const esPdf = mime === "application/pdf";
  if (!token || !url) return "error";
  if (!IMAGEN_OK.has(mime) && !esPdf) return "no-soportado";
  if ((f.size ?? 0) > (esPdf ? MAX_BYTES_PDF : MAX_BYTES_IMAGEN)) return "muy-grande";
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return "error";
    // Sin files:read Slack devuelve la página de login (HTML) con 200.
    if ((r.headers.get("content-type") || "").includes("text/html")) return "error";
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > (esPdf ? MAX_BYTES_PDF : MAX_BYTES_IMAGEN)) return "muy-grande";
    return { tipo: esPdf ? "pdf" : "image", mediaType: mime, base64: buf.toString("base64"), nombre: f.name || "archivo" };
  } catch {
    return "error";
  }
}

function bloquesDe(t: TurnoDirector): Anthropic.ContentBlockParam[] {
  const bloques: Anthropic.ContentBlockParam[] = [];
  for (const a of t.adjuntos ?? []) {
    if (a.tipo === "pdf") {
      bloques.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.base64 }, title: a.nombre });
    } else {
      bloques.push({
        type: "image",
        source: { type: "base64", media_type: a.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: a.base64 },
      });
    }
  }
  const quien = t.esCEO ? `[CEO] ${t.autor || "Elvin"}` : t.autor || "equipo";
  const texto = t.texto.trim() || (t.adjuntos?.length ? "(sin texto: revisa lo adjunto)" : "");
  bloques.push({ type: "text", text: `${quien}: ${texto}` });
  return bloques;
}

// Arma la conversación del hilo (equipo = user, director = assistant) y pide la respuesta.
// Mensajes seguidos del mismo rol se juntan en un solo turno.
export async function responderDirector(turnos: TurnoDirector[]): Promise<string> {
  const messages: Anthropic.MessageParam[] = [];
  for (const t of turnos) {
    const role = t.rol === "director" ? "assistant" : "user";
    const content = role === "assistant" ? [{ type: "text" as const, text: t.texto }] : bloquesDe(t);
    const ultimo = messages[messages.length - 1];
    if (ultimo && ultimo.role === role && Array.isArray(ultimo.content)) {
      (ultimo.content as Anthropic.ContentBlockParam[]).push(...content);
    } else {
      messages.push({ role, content });
    }
  }
  while (messages.length && messages[0].role !== "user") messages.shift();
  while (messages.length && messages[messages.length - 1].role !== "user") messages.pop();
  if (!messages.length) return "";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const params = {
    model: MODEL_DIRECTOR,
    max_tokens: 16000,
    thinking: { type: "adaptive" as const },
    output_config: { effort: "high" as const },
    system: [{ type: "text" as const, text: cerebro(), cache_control: { type: "ephemeral" as const } }],
    messages,
    // Si un clasificador de seguridad declina (p. ej. un flyer de salud), el servidor reintenta
    // en el modelo de respaldo que le corresponda en vez de dejar al equipo sin respuesta.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  const resp = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (resp.stop_reason === "refusal") {
    return "No pude revisar esta pieza (la frenó un filtro de seguridad). Pásasela a Elvin directo.";
  }
  const texto = resp.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return aSlack(texto);
}

// El modelo a veces escribe markdown de GitHub; Slack usa *negrita* y no entiende ###.
function aSlack(t: string): string {
  return t
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^\*\*\*(.+)\*\*\*$/gm, "*$1*");
}
