import "server-only";

import fs from "node:fs";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import { MODELO, SLACK_CANAL } from "./config";
import { actualizarCliente, guardarRespuesta, type ClienteAib } from "./repo";

// El agente de onboarding de AI Borinquen: el mismo trabajo que "OrquestaBot" hace para Level Up en n8n
// (bienvenida, dudas del arranque, encuestas de 10 y 30 días, escalar a una persona), pero con la marca,
// la guía y la persona de AIB, y por el WhatsApp oficial (Zernio). Escala SIEMPRE a Ángela (PM).

const GUIA = (() => {
  try {
    return fs.readFileSync(path.join(process.cwd(), "vault/proyectos/ai-borinquen/onboarding/guia-cliente.md"), "utf8");
  } catch {
    return "(La guía no está disponible: ante cualquier duda, avisa a Ángela.)";
  }
})();

const SISTEMA = `Eres el asistente de onboarding de AI Borinquen por WhatsApp. Acompañas a clientes que YA pagaron
(agentes de IA o marketing) durante su primer mes. Hablas en español de Puerto Rico, con tuteo (tú, tienes;
nunca vos/tenés), cálido y profesional, en mensajes cortos de WhatsApp (2-4 líneas, sin markdown ni
encabezados). Firmas como "el equipo de AI Borinquen" solo si hace falta; nunca inventas nombres.

Lo que haces:
1. Resolver dudas del arranque usando SOLO la GUÍA de abajo. Si la respuesta no está en la guía (o dice
   [POR CONFIRMAR]), no la inventes: dile al cliente que se lo pasas a Ángela, su project manager, y usa
   avisar_angela.
2. Hacer las encuestas cuando el contexto indique una encuesta activa (el cliente ya recibió el mensaje
   que la anuncia y está contestando):
   - Encuesta de 10 días (encuesta "10"), una pregunta a la vez:
     P1 "¿Pudiste completar el proceso de arranque (onboarding)?" Opciones: Sí, completo / Sí, pero tengo
        algunas dudas / No, aún me faltan cosas.
        · Si tiene dudas o le faltan cosas: pregúntale cuáles, y cuando conteste usa avisar_angela con el
          detalle y dile "Gracias, ya le avisé a Ángela para que te contacte y te ayude con eso."
     P2 "Del 1 al 10, ¿qué tan claro te quedó cómo funciona el servicio?"
   - Encuesta de 30 días (encuesta "30"):
     P1 "¿Cómo describirías tu experiencia con AI Borinquen?" Opciones: Excelente / Buena / Regular / Mala.
        · Si es Regular o Mala: pregúntale qué mejorarías y usa avisar_angela con su respuesta.
   - Guarda CADA respuesta con registrar_respuesta y, al terminar, agradece en una línea y usa
     finalizar_encuesta.
   - Si en medio de la encuesta el cliente pregunta otra cosa, contéstala (guía o Ángela) y luego retoma.
   - Si su mensaje es claramente una respuesta automática de su negocio (p. ej. "Gracias por comunicarte
     con…", "En este momento no estamos disponibles…"), NO lo tomes como respuesta: no contestes nada.
3. Escalar SIEMPRE a Ángela (avisar_angela) si el cliente: está molesto o se queja, quiere cancelar, pregunta
   por pagos/facturas/reembolsos, pide un cambio en su agente o campaña, o pide hablar con una persona.
   Dile que Ángela lo contacta; no prometas horas exactas ni resultados.

Nunca: prometas resultados o ventas, des precios o descuentos, compartas datos de otros clientes, ni digas
que eres humano (si preguntan, eres el asistente automático de AI Borinquen).

Si no hace falta contestar (respuesta automática, un "ok" o un emoji que cierra la conversación), responde
exactamente: [SIN_RESPUESTA]

GUÍA DEL CLIENTE
----------------
${GUIA}`;

const HERRAMIENTAS: Anthropic.Beta.BetaTool[] = [
  {
    name: "avisar_angela",
    description: "Le avisa a Ángela (project manager de AI Borinquen) por Slack para que contacte al cliente. Úsala para dudas que no están en la guía, faltantes del arranque, experiencia Regular/Mala, quejas, cancelaciones, pagos o cambios.",
    input_schema: {
      type: "object",
      properties: {
        motivo: { type: "string", enum: ["duda", "faltante", "experiencia", "queja", "cancelacion", "pago", "cambio", "persona", "otro"] },
        mensaje: { type: "string", description: "Resumen claro para Ángela: qué pasó y qué pidió el cliente, con sus palabras." },
      },
      required: ["motivo", "mensaje"],
      additionalProperties: false,
    },
  },
  {
    name: "registrar_respuesta",
    description: "Guarda la respuesta del cliente a una pregunta de la encuesta.",
    input_schema: {
      type: "object",
      properties: {
        encuesta: { type: "string", enum: ["10", "30"] },
        pregunta: { type: "string", enum: ["P1", "P2", "detalle"] },
        respuesta: { type: "string" },
      },
      required: ["encuesta", "pregunta", "respuesta"],
      additionalProperties: false,
    },
  },
  {
    name: "finalizar_encuesta",
    description: "Marca la encuesta activa como terminada. Úsala al cerrar la encuesta.",
    input_schema: { type: "object", properties: { encuesta: { type: "string", enum: ["10", "30"] } }, required: ["encuesta"], additionalProperties: false },
  },
];

function contexto(c: ClienteAib): string {
  const hoy = new Date().toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return [
    `Hoy es ${hoy}.`,
    `Cliente: ${c.nombre}${c.empresa ? ` (${c.empresa})` : ""} · servicio: ${c.servicio ?? "—"} · pagó el ${c.fechaPago ?? "—"}.`,
    c.pulseItemId ? "" : "OJO: este número NO está en la lista de clientes de AI Borinquen. Contesta con cortesía, no hagas encuestas y avisa a Ángela (motivo 'otro') con lo que pide.",
    c.encuestaActiva ? `Encuesta activa: ${c.encuestaActiva} días. Respuestas guardadas hasta ahora: ${JSON.stringify(c.respuestas?.[c.encuestaActiva] ?? {})}.` : "No hay encuesta activa.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function avisarSlack(c: ClienteAib, motivo: string, mensaje: string): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return false;
  const angela = process.env.ANGELA_SLACK_ID ? `<@${process.env.ANGELA_SLACK_ID}> ` : "Ángela: ";
  const text = [
    `${angela}:speech_balloon: *Onboarding AIB · ${motivo}* — ${c.nombre}${c.empresa ? ` (${c.empresa})` : ""}`,
    `WhatsApp: +${c.telefono}${c.servicio ? ` · ${c.servicio}` : ""}`,
    `> ${mensaje.replace(/\n/g, "\n> ")}`,
  ].join("\n");
  const r = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel: SLACK_CANAL, text }),
    signal: AbortSignal.timeout(8000),
  })
    .then((x) => x.json())
    .catch(() => ({ ok: false }));
  if (!r.ok) console.error("[aib-onboarding] slack", r);
  return Boolean(r.ok);
}

async function ejecutar(c: ClienteAib, nombre: string, input: Record<string, string>): Promise<string> {
  if (nombre === "avisar_angela") {
    const ok = await avisarSlack(c, input.motivo, input.mensaje);
    return ok ? "Aviso enviado a Ángela." : "No se pudo avisar por Slack; el aviso quedó registrado.";
  }
  if (nombre === "registrar_respuesta") {
    await guardarRespuesta(c, input.encuesta, input.pregunta, input.respuesta);
    return "Guardado.";
  }
  if (nombre === "finalizar_encuesta") {
    await actualizarCliente(c.id, { encuestaActiva: null });
    c.encuestaActiva = null;
    return "Encuesta finalizada.";
  }
  return `Herramienta desconocida: ${nombre}`;
}

/** Contesta el último mensaje del cliente. Devuelve el texto a mandar por WhatsApp (o null si no hay que contestar). */
export async function responder(c: ClienteAib): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // Historial a turnos alternados que empiezan por el cliente (la plantilla de apertura va como assistant).
  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  for (const t of (c.historial ?? []).slice(-20)) {
    const prev = messages[messages.length - 1];
    if (prev && prev.role === t.role) prev.content = `${prev.content as string}\n${t.content}`;
    else messages.push({ role: t.role, content: t.content });
  }
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;

  for (let vuelta = 0; vuelta < 5; vuelta++) {
    const params = {
      model: MODELO,
      max_tokens: 4000,
      thinking: { type: "adaptive" as const },
      output_config: { effort: "medium" as const },
      system: [
        { type: "text" as const, text: SISTEMA, cache_control: { type: "ephemeral" as const } },
        { type: "text" as const, text: contexto(c) },
      ],
      tools: HERRAMIENTAS,
      messages,
      // Si un filtro de seguridad declina, el servidor reintenta en el modelo de respaldo que corresponda.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    };
    const resp = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
    if (resp.stop_reason === "refusal") return null;
    const usos = resp.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (resp.stop_reason === "tool_use" && usos.length) {
      messages.push({ role: "assistant", content: resp.content as Anthropic.Beta.BetaContentBlockParam[] });
      const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const u of usos) {
        let out: string;
        try {
          out = await ejecutar(c, u.name, u.input as Record<string, string>);
        } catch (e) {
          out = `Error: ${e instanceof Error ? e.message : String(e)}`;
        }
        resultados.push({ type: "tool_result", tool_use_id: u.id, content: out });
      }
      messages.push({ role: "user", content: resultados });
      continue;
    }
    const textoFinal = resp.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .replace(/\*\*(.+?)\*\*/g, "*$1*")
      .trim();
    if (!textoFinal || textoFinal.includes("[SIN_RESPUESTA]")) return null;
    return textoFinal;
  }
  return null;
}
