/**
 * Archivos que manda la gente: fotos (Claude las ve), audios (se transcriben con
 * Whisper porque Claude no procesa audio), PDFs (Claude los lee como documento).
 */
import type Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

export interface Adjunto { tipo: "imagen" | "audio" | "documento" | "otro"; mime: string; datos: Buffer; nombre?: string }

const IMAGENES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export async function transcribirAudio(a: Adjunto): Promise<string> {
  if (!config.tiene.whisper()) return "[audio recibido; transcripción no configurada: pide al cliente que lo escriba]";
  const form = new FormData();
  const ext = a.mime.includes("ogg") ? "ogg" : a.mime.includes("mp4") ? "m4a" : a.mime.includes("mpeg") ? "mp3" : "webm";
  form.append("file", new Blob([new Uint8Array(a.datos)], { type: a.mime }), `audio.${ext}`);
  form.append("model", "whisper-1");
  form.append("language", "es");
  form.append("prompt", "Conversación en español de Puerto Rico sobre plomería: destape, fregadero, inodoro, cisterna, calentador, filtración, plomero.");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${config.openaiKey}` }, body: form });
  if (!r.ok) { console.error("whisper", r.status, await r.text()); return "[no pude transcribir el audio; pídele que lo escriba]"; }
  const j = (await r.json()) as { text?: string };
  return j.text?.trim() || "[audio vacío]";
}

/** Convierte los adjuntos en bloques de contenido para el mensaje del usuario. */
export async function adjuntosABloques(adjuntos: Adjunto[]): Promise<Anthropic.Beta.BetaContentBlockParam[]> {
  const bloques: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const a of adjuntos) {
    if (a.tipo === "imagen" && IMAGENES.has(a.mime)) {
      bloques.push({ type: "image", source: { type: "base64", media_type: a.mime as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: a.datos.toString("base64") } });
    } else if (a.tipo === "audio") {
      const texto = await transcribirAudio(a);
      bloques.push({ type: "text", text: `[Nota de voz del cliente, transcrita]: ${texto}` });
    } else if (a.tipo === "documento" && a.mime === "application/pdf") {
      bloques.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: a.datos.toString("base64") }, title: a.nombre ?? "documento.pdf" });
    } else {
      bloques.push({ type: "text", text: `[El cliente envió un archivo ${a.mime}${a.nombre ? ` (${a.nombre})` : ""} que no puedo abrir. Pídele una foto o que lo describa.]` });
    }
  }
  return bloques;
}

export function clasificarMime(mime: string): Adjunto["tipo"] {
  if (mime.startsWith("image/")) return "imagen";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "documento";
  return "otro";
}
