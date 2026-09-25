/**
 * Seguimiento automático (Elvin, 25/sep/2026): el cliente de Messenger/Instagram pregunta el precio y se va ("era para
 * saber", "pronto me comunico"). Meta solo deja escribirle dentro de las 24 h de su último mensaje, así que el agente le
 * escribe hasta 2 veces en esa ventana — a las ~2 h y, si sigue callado, a la mañana siguiente (antes de las 23 h) —,
 * de 8 AM a 8 PM, ofreciéndole apartarle un espacio. Se detiene si contesta, agenda, lo toma una persona, o si el modelo
 * ve que no aplica (sin cobertura, no le interesa, no es un servicio). Pasadas las 24 h por Messenger no se puede: con
 * teléfono lo llama una persona (aviso "Llama para cerrar" de llamar-cliente.ts).
 */
import Anthropic from "@anthropic-ai/sdk";
import { almacen, type Contacto } from "./almacen.js";
import { leerHistorial, archivar } from "./historial.js";
import { enviarDM } from "./canales/zernio.js";
import { humanizar } from "./humanizar.js";
import { config } from "./config.js";
import { territorioDe, plomeroActivoDe } from "./proveedores.js";

const H = 3600_000;
export const REGLAS = { primero: 2 * H, limite: 23 * H, max: 2, separacion: 6 * H, horaIni: 8, horaFin: 20 };
const ACUSE = /^\s*(ok+|okey|oka|dale|gracias|muchas gracias|ok gracias|perfecto|bendiciones|👍|🙏|❤️|😊)[\s!.¡]*$/i;

export const horaPR = (d = new Date()) => Number(d.toLocaleString("en-US", { timeZone: config.zonaHoraria, hour: "numeric", hour12: false })) % 24;

/** ¿Le toca seguimiento ahora? Pura (tests/seguimiento.test.mjs). Tiempos en ms. */
export function tocaSeguimiento(p: { ultimoCliente: number; ultimoTextoCliente: string; ultimoNuestro: number; enviados: number[]; agendo: boolean; humano: boolean; ahora: number; hora: number }): boolean {
  if (p.agendo || p.humano || !p.ultimoCliente) return false;
  // Si el cliente habló último, solo cuenta si fue un "ok"/"gracias" (a eso no se le contesta); si preguntó algo, no.
  if (p.ultimoNuestro < p.ultimoCliente && !ACUSE.test(p.ultimoTextoCliente)) return false;
  const desde = p.ahora - p.ultimoCliente;
  if (desde < REGLAS.primero || desde > REGLAS.limite) return false;
  const deEsta = p.enviados.filter((t) => t > p.ultimoCliente);
  if (deEsta.length >= REGLAS.max) return false;
  if (deEsta.length && p.ahora - Math.max(...deEsta) < REGLAS.separacion) return false;
  return p.hora >= REGLAS.horaIni && p.hora < REGLAS.horaFin;
}

const SISTEMA = `Eres del equipo de Resuelto, plomería con precio fijo en Puerto Rico. Un cliente preguntó por un servicio y no ha agendado.
Escribe UN solo mensaje de seguimiento: 1 o 2 líneas, tuteo de Puerto Rico, como una persona del equipo desde el celular. Sin emojis, sin "¡", sin listas, sin "Hola de nuevo".
- Retoma lo que pidió (con su nombre si lo sabes) y ofrécele DOS espacios concretos de 2 horas, no la lista entera (por ejemplo "mañana de 10 a 12 o de 1 a 3"; hoy solo si todavía da tiempo).
- Escribe completo y claro: "para", nunca "pa"; nada de jerga.
- Si no tenemos su teléfono, pídeselo para confirmarle ("dame un número y te lo confirmo").
- No repitas el desglose de precio, no menciones el porcentaje de materiales, no inventes descuentos ni urgencias falsas, no prometas horas exactas.
- Si es el seguimiento 2 (el último), que sea más corto y sin presión: que si todavía lo necesita, le apartas el espacio.
Responde exactamente NADA si no aplica: dijo que no le interesa o que ya lo resolvió, su pueblo no tiene cobertura (quedó en lista de espera), es un plomero o candidato, o la conversación no es de un servicio.`;

const cliente = new Anthropic();
export async function redactar(c: Contacto, eventos: { autor: string; texto: string }[], numero: number): Promise<string | null> {
  const charla = eventos.slice(-14).map((e) => `${e.autor === "cliente" ? "Cliente" : "Resuelto"}: ${e.texto}`).join("\n");
  const r = await cliente.messages.create({
    model: config.modelo, max_tokens: 300, system: SISTEMA,
    messages: [{ role: "user", content: `Seguimiento ${numero} de ${REGLAS.max}. ${c.nombre ? `Nombre: ${c.nombre}.` : ""} ${c.telefono ? "Ya tenemos su teléfono." : "No tenemos su teléfono."} Hora en PR: ${new Date().toLocaleString("es-PR", { timeZone: config.zonaHoraria, weekday: "long", hour: "numeric", minute: "2-digit" })}.\n\nConversación:\n${charla}` }],
  });
  const t = r.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
  return !t || /^NADA\b/i.test(t) ? null : t;
}

const ms = (iso?: string) => (iso ? new Date(iso).getTime() : 0);

export async function revisarSeguimientos() {
  if (!config.zernio.apiKey) return;
  const ahora = Date.now(), hora = horaPR();
  if (hora < REGLAS.horaIni || hora >= REGLAS.horaFin) return;
  const trabajos = almacen.trabajos(), proyectos = almacen.proyectos();
  for (const id of almacen.conversacionesDesde(ahora - 24 * H)) {
    const c = almacen.contacto(id);
    if (!c || !c.dm || (c.canal !== "messenger" && c.canal !== "instagram")) continue;
    if (c.tipo !== "cliente" && c.tipo !== "cliente-proyecto") continue;
    // Sin plomero activo en su pueblo no hay nada que ofrecerle (quedó en lista de espera): no se le escribe.
    if (c.tipo === "cliente" && c.municipio) { const t = territorioDe(c.municipio); if (!t || !plomeroActivoDe(t)) continue; }
    const ev = leerHistorial(c.id, 60);
    const delCliente = ev.filter((e) => e.autor === "cliente"), nuestros = ev.filter((e) => e.autor !== "cliente");
    const ultimo = delCliente.at(-1);
    const enviados = (c.seguimientos ?? []).map(ms);
    const agendo = trabajos.some((t) => t.contactoId === c.id && t.estado !== "cancelado") || proyectos.some((p) => p.contactoId === c.id);
    if (!ultimo || !tocaSeguimiento({ ultimoCliente: ms(ultimo.fecha), ultimoTextoCliente: ultimo.texto, ultimoNuestro: ms(nuestros.at(-1)?.fecha), enviados, agendo, humano: c.humano, ahora, hora })) continue;
    const numero = enviados.filter((t) => t > ms(ultimo.fecha)).length + 1;
    try {
      const texto = await redactar(c, ev, numero);
      const marca = [...(c.seguimientos ?? []), new Date().toISOString()].slice(-10);
      if (!texto) { const cerrada = new Date(ms(ultimo.fecha) + 1).toISOString(); almacen.guardarContacto({ ...c, seguimientos: [...(c.seguimientos ?? []), cerrada, cerrada].slice(-10) }); continue; } // no aplica: se cierra SOLO esta ventana
      const n = (c.enviadosWa ?? 0) + 1;
      await enviarDM(c.dm.conversationId, c.dm.accountId, humanizar(texto, n, c.id));
      archivar(c.id, "resuelto", texto, "seguimiento");
      const conv = almacen.conversacion(c.id); // que el agente lo vea si el cliente contesta
      conv.mensajes.push({ role: "user", content: [{ type: "text", text: "[Contexto interno] El cliente no contestó; le mandamos un seguimiento." }] } as any, { role: "assistant", content: [{ type: "text", text: texto }] } as any);
      almacen.guardarConversacion(conv);
      almacen.guardarContacto({ ...(almacen.contacto(c.id) ?? c), seguimientos: marca, enviadosWa: n });
      console.log(`seguimiento ${numero} → ${c.nombre ?? c.id}`);
    } catch (e) { console.error("seguimiento", c.id, e); }
  }
}
