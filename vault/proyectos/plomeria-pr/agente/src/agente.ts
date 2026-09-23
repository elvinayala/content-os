/**
 * El cerebro: recibe un mensaje (texto + adjuntos) de un contacto por cualquier canal,
 * corre el bucle de herramientas con Claude y devuelve los textos a enviar.
 */
import Anthropic from "@anthropic-ai/sdk";
import { archivar } from "./historial.js";
import { config } from "./config.js";
import { almacen, type Contacto } from "./almacen.js";
import { SYSTEM } from "./prompt.js";
import { definiciones, ejecutar } from "./herramientas.js";
import { adjuntosABloques, type Adjunto } from "./integraciones/media.js";
import { almacen as store } from "./almacen.js";

const client = new Anthropic();
const MAX_ITERACIONES = 8;

function contexto(contacto: Contacto): string {
  const ahora = new Date();
  const fecha = ahora.toLocaleString("es-PR", { timeZone: config.zonaHoraria, weekday: "long", year: "numeric", month: "long", day: "numeric", hora: undefined } as any);
  const hora = ahora.toLocaleTimeString("es-PR", { timeZone: config.zonaHoraria, hour: "2-digit", minute: "2-digit" });
  const iso = ahora.toISOString();
  const fueraDeHorario = (() => { const h = Number(ahora.toLocaleString("en-US", { timeZone: config.zonaHoraria, hour: "numeric", hour12: false })); const d = ahora.toLocaleString("en-US", { timeZone: config.zonaHoraria, weekday: "short" }); return h >= 18 || h < 7 || d === "Sat" || d === "Sun"; })();
  const lineas = [
    `[Contexto interno, no lo repitas al cliente]`,
    `Canal: ${contacto.canal}. Fecha: ${fecha}, ${hora} hora de Puerto Rico (${iso}). ${fueraDeHorario ? "AHORA es horario de emergencia (+$99 si pide servicio inmediato)." : "Horario regular."}`,
    contacto.nombre ? `Nombre conocido: ${contacto.nombre}.` : "Nombre: desconocido.",
    contacto.telefono ? `Teléfono: ${contacto.telefono}.` : "Teléfono: desconocido (pídelo si vas a agendar).",
    contacto.municipio ? `Municipio conocido: ${contacto.municipio}.` : "",
    contacto.direccion ? `Dirección conocida: ${contacto.direccion}.` : "",
    contacto.tipo ? `Tipo de contacto: ${contacto.tipo}.` : "",
    contacto.notas.length ? `Notas previas: ${contacto.notas.slice(-5).join(" | ")}` : "",
    ...store.proyectos().filter((p) => p.contactoId === contacto.id && p.encuesta && !p.encuesta.completadaEn).map((p) => `Encuesta abierta para ${p.id} (${p.categoriaId}, propuesta $${p.cotizacion?.precioFinal ?? "?"}, cotizador ${p.cotizadorId ?? "?"}): haz la ENCUESTA POST-VISITA y regístrala con registrar_encuesta.`),
  ].filter(Boolean);
  return lineas.join("\n");
}

export interface Entrada { texto?: string; adjuntos?: Adjunto[] }

/** Devuelve la lista de mensajes a enviar (vacía si un humano tiene la conversación). */
export async function responder(contacto: Contacto, entrada: Entrada): Promise<string[]> {
  archivar(contacto.id, "cliente", [entrada.texto, entrada.adjuntos?.length ? `[${entrada.adjuntos.length} adjunto(s)]` : ""].filter(Boolean).join(" "));
  if (contacto.humano) return []; // un humano está atendiendo; el agente calla

  const conv = almacen.conversacion(contacto.id);
  const bloques: Anthropic.Beta.BetaContentBlockParam[] = [{ type: "text", text: contexto(contacto) }];
  if (entrada.adjuntos?.length) bloques.push(...(await adjuntosABloques(entrada.adjuntos)));
  bloques.push({ type: "text", text: entrada.texto?.trim() || "(sin texto)" });

  const mensajes: Anthropic.Beta.BetaMessageParam[] = [...conv.mensajes, { role: "user", content: bloques }];
  const ctx = { contacto };
  let salida: string[] = [];

  for (let i = 0; i < MAX_ITERACIONES; i++) {
    const respuesta = await client.beta.messages.create({
      model: config.modelo,
      max_tokens: 4000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: definiciones,
      messages: mensajes,
      output_config: { effort: config.esfuerzo },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as any);

    if (respuesta.stop_reason === "refusal") {
      salida = ["Eso no lo puedo ayudar por aquí. Si es sobre un trabajo de plomería, cuéntame el problema y lo resolvemos."];
      mensajes.push({ role: "assistant", content: respuesta.content });
      break;
    }

    mensajes.push({ role: "assistant", content: respuesta.content });
    const textos = respuesta.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text.trim()).filter(Boolean);
    const usos = respuesta.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");

    if (respuesta.stop_reason === "pause_turn") continue;
    if (!usos.length) { salida = textos; break; }

    const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const u of usos) {
      let contenido: string;
      try { contenido = JSON.stringify(await ejecutar(u.name, u.input, ctx)); }
      catch (e) { contenido = JSON.stringify({ error: String((e as Error).message ?? e) }); }
      resultados.push({ type: "tool_result", tool_use_id: u.id, content: contenido });
    }
    mensajes.push({ role: "user", content: resultados });
    // Si el turno tuvo texto antes de las herramientas y el modelo termina después, el último texto manda.
    if (i === MAX_ITERACIONES - 1) salida = textos;
  }

  almacen.guardarConversacion({ ...conv, mensajes });
  // Separador explícito para mandar varios mensajes por WhatsApp.
  const partes = salida.flatMap((t) => t.split(/\n---\n/).map((s) => s.trim()).filter(Boolean));
  for (const t of partes) archivar(contacto.id, "resuelto", t);
  return partes;
}
