import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/pulse/db";

import { leerNichoIA } from "./reglas";
import { leadsHistorial, leadsTratos } from "./schema";

// Elvin (27/sep): "que diga el nombre del negocio… o por lo menos la industria o el nicho". Los leads de
// WhatsApp llegan solo con el nombre de la persona, pero en sus primeros mensajes dicen a qué se dedican.
// Claude lo lee y lo deja en la tarjeta: negocio (si lo nombra) y nicho. Máximo 3 intentos por lead, y
// nunca pisa un negocio que el equipo ya escribió.

const MODELO = process.env.LEADS_NICHO_MODEL || "claude-opus-5";
const INTENTOS = 3;

const INSTRUCCIONES = `Te paso los primeros mensajes que una persona le escribió por WhatsApp a una agencia de marketing de Puerto Rico. Di a qué se dedica su negocio.
Responde SOLO con JSON: {"negocio": "<nombre del negocio si lo dice, si no null>", "nicho": "<industria o nicho en 1 a 3 palabras en español, p. ej. Construcción, Restaurante, Belleza, Bienes raíces, Salud, Refrigeración; null si no se sabe>"}.
No inventes: si los mensajes no dicen a qué se dedica (p. ej. solo "info" o "hola"), usa null.`;

export async function detectarNicho(tratoId: string): Promise<{ negocio: string | null; nicho: string | null } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const d = await db();
  const [t] = await d.select().from(leadsTratos).where(eq(leadsTratos.id, tratoId));
  if (!t || t.origen === "grupo") return null;
  const datos = (t.datos ?? {}) as { nicho?: string; nichoIntentos?: number };
  if (datos.nicho || (datos.nichoIntentos ?? 0) >= INTENTOS) return null;
  const mensajes = await d
    .select({ texto: leadsHistorial.texto })
    .from(leadsHistorial)
    .where(and(eq(leadsHistorial.tratoId, tratoId), eq(leadsHistorial.tipo, "entrante")))
    .orderBy(asc(leadsHistorial.createdAt))
    .limit(6);
  const texto = mensajes.map((m) => (m.texto ?? "").trim()).filter(Boolean).join("\n").slice(0, 1500);
  if (texto.replace(/\s/g, "").length < 12) return null; // "hola" / "info": esperar al próximo mensaje

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const params = {
    model: MODELO,
    max_tokens: 1024,
    thinking: { type: "adaptive" as const },
    output_config: { effort: "low" as const },
    system: INSTRUCCIONES,
    messages: [{ role: "user" as const, content: `Nombre en WhatsApp: ${t.nombre}\nMensajes:\n${texto}` }],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  const resp = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  const salida = resp.stop_reason === "refusal" ? "" : resp.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
  const r = leerNichoIA(salida);
  await d
    .update(leadsTratos)
    .set({
      datos: sql`${leadsTratos.datos} || ${JSON.stringify({ nichoIntentos: (datos.nichoIntentos ?? 0) + 1, ...(r.nicho ? { nicho: r.nicho } : {}) })}::jsonb`,
      ...(r.negocio && !t.negocio ? { negocio: r.negocio } : {}),
    })
    .where(eq(leadsTratos.id, tratoId));
  return r;
}
