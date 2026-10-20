import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";

import { CLOSERS_FATHOM, clienteDeReunion, transcripcionCorta, type ReunionConTranscripcion, type ReunionFathom } from "@/lib/fathom";
import { notificarCEO } from "@/lib/notificar-ceo";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";

import { slugDeMarca, type Marca } from "./reglas";
import { asegurarEtapa, cerrarTrato, clienteActual, crearActividad, crearEmbudo, embudoPorNombre, ingestarLead, leadPorContacto, registrarWebhook } from "./repo";
import { listarRubros } from "./rubros";
import { rubroDeCatalogo } from "./rubros-reglas";
import { DIAS_PRIMER_CONTACTO, recomendar, EMBUDO_SEGUIMIENTO, ETAPA_PERDIDO, etapaDeLectura, ETAPAS_SEGUIMIENTO, leerLecturaLlamada, OBJECIONES, SERVICIOS, sumarDias, vaASeguimiento, type LecturaLlamada } from "./seguimiento-reglas";

// Fathom → SEGUIMIENTO (Elvin, 20/oct/2026): "Luego de que cierra la llamada, que Fathom tiene ya la
// información, pasar el contacto a Pulse, que se pase automático." Cuando un closer (Roger, Laura)
// termina una llamada de venta y el prospecto NO compró, Claude lee el resumen y la transcripción de
// Fathom (lo mismo que sale en el canal de Slack) y el lead pasa al embudo SEGUIMIENTO de su marca, con
// dueña Lis, en la columna de su temperatura, con el feedback, el servicio y la objeción. Si el lead ya
// existía (CLOSERS, WhatsApp…) se mueve ese mismo: el historial queda conectado. Los closers no le
// escriben antes que Lis (reunión del 20/oct): por eso el dueño pasa a ser ella.

// Leer una llamada de 30-60 min y juzgar si quedó caliente/tibio/frío es criterio, no solo extracción:
// Sonnet (una vez por llamada de cierre, ~5-10 al día). Nunca Opus por evento (docs/contexto/gasto-ia.md).
const MODELO = process.env.LEADS_SEGUIMIENTO_MODEL || "claude-sonnet-5";
const EMAIL_LIS = () => process.env.LEADS_SEGUIMIENTO_EMAIL || "lis.acevedo@levelupmediapr.net";

const instrucciones = (catalogo: string[]) => `Te paso una llamada de venta grabada en Fathom: un closer de Level Up Media (agencia de marketing y anuncios para negocios de Puerto Rico; su servicio principal es DFY, "hecho por ti") o de AI Borinquen (agentes de IA personalizados por puesto, AutoFlow, la app Bori, Academia AIB, digitalizar negocios) habló con un dueño de negocio.
Responde SOLO con JSON, sin texto antes ni después:
{
  "es_venta": false si NO es una llamada de venta con un prospecto (reunión interna, onboarding de un cliente que ya pagó, entrevista de trabajo, proveedor),
  "compro": "si" si pagó, dejó depósito o reserva, o firmó en la llamada | "no" | "no_claro",
  "marca": "level_up" | "ai_borinquen" | null (qué empresa le vendió),
  "nombre": nombre de la persona (prospecto, no el closer),
  "telefono": solo si se dice en la llamada, si no null,
  "email": solo si se dice, si no null,
  "negocio": nombre del negocio o null,
  "industria": UNA de estas etiquetas escrita igual: ${catalogo.join(" | ")}; "Otro" si no calza; null si no se sabe,
  "servicios": lista con lo que se le ofreció, de: ${SERVICIOS.join(", ")},
  "objecion": la razón principal por la que no compró, UNA de: ${OBJECIONES.join(" | ")},
  "temperatura": "caliente" (quiere y puede; falta un detalle: la fecha de pago, hablarlo con el socio esta semana) | "tibio" (le interesa pero hay una objeción real: dinero, tiempo, consultarlo) | "frio" (no ve el valor, desconfía, no tiene presupuesto en meses),
  "feedback": 2 o 3 oraciones para Lis, que le dará seguimiento: qué necesita el negocio, qué se le ofreció y a qué precio, y por qué no cerró. Español de Puerto Rico, tuteo,
  "proximo_paso": lo que quedó acordado (p. ej. "Llamarlo el viernes; cobra el día 1") o null,
  "presion": true si el prospecto se sintió presionado o desconfió (dijo que parece fraude, que lo apuraron, que va muy rápido),
  "razon": la razón ESPECÍFICA por la que no cerró, en una oración con lo que dijo el prospecto (p. ej. "Su esposa maneja las finanzas y no quiere invertir hasta que abra la clínica en noviembre"), no la categoría,
  "facturacion_mensual": cuánto dijo que factura su negocio al mes en USD (número; si dio un rango, el menor; si dijo al año, divídelo entre 12) o null,
  "profesion": "salud" si es profesional de la salud (médico, dentista, quiropráctico, psicólogo, terapeuta, enfermera, farmacéutico, veterinario) | "legal" si es abogado o notario | null,
  "descartado": true SOLO si dijo claramente que no va (no le interesa, que no lo llamen más, ya contrató a otro); false si es "ahora no", "lo voy a pensar" o una objeción que se puede trabajar,
  "capacidad_operativa": "alta" (negocio establecido con equipo, clientes y flujo de dinero para invertir $3,000+), "media", "baja" (emprendedor empezando, solo, sin flujo para invertir) o null si no se sabe,
  "quiere_escalar": true si quiere crecer, contratar o abrir más (no solo sobrevivir),
  "precio_ofrecido": el precio principal que le ofreció el closer en USD (número) o null,
  "oferta_incorrecta": si el closer le ofreció algo que no le corresponde (p. ej. un servicio que no resuelve lo que necesita), en una oración; null si la oferta fue correcta
}
No inventes: lo que no se dice en la llamada va en null.`;

async function idLis(): Promise<string | null> {
  const d = await db();
  const u = await d.query.pulseUsers.findFirst({ where: eq(pulseUsers.email, EMAIL_LIS()) });
  return u?.activo ? u.id : null;
}

/** El embudo SEGUIMIENTO de la marca (lo crea con sus columnas si no existe) y la etapa pedida. */
export async function etapaSeguimiento(marca: Marca, etapa: string): Promise<{ embudoId: string; etapaId: string }> {
  const emb = (await embudoPorNombre(marca, EMBUDO_SEGUIMIENTO)) ?? (await crearEmbudo(marca, EMBUDO_SEGUIMIENTO, [...ETAPAS_SEGUIMIENTO]));
  return { embudoId: emb.id, etapaId: await asegurarEtapa(emb.id, etapa, false) };
}

async function leerLlamada(r: ReunionConTranscripcion): Promise<LecturaLlamada | null> {
  const catalogo = await listarRubros();
  const externos = (r.calendar_invitees ?? []).filter((i) => i.is_external !== false).map((i) => `${i.name ?? "?"} <${i.email ?? "?"}>`);
  const acciones = (r.action_items ?? []).map((a) => `- ${a.description ?? ""}`).join("\n");
  const contenido = [
    `Título: ${r.meeting_title || r.title || "—"}`,
    `Fecha: ${r.recording_start_time ?? r.scheduled_start_time ?? "—"}`,
    `Closer (grabó): ${r.recorded_by?.name ?? "—"} <${r.recorded_by?.email ?? "—"}>`,
    `Invitados externos: ${externos.join(", ") || "—"}`,
    `Resumen de Fathom:\n${r.default_summary?.markdown_formatted ?? "—"}`,
    acciones ? `Pendientes:\n${acciones}` : "",
    `Transcripción:\n${transcripcionCorta(r, 30_000) || "—"}`,
  ].filter(Boolean).join("\n\n");

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const params = {
    model: MODELO,
    max_tokens: 4096,
    ...(/haiku/i.test(MODELO) ? {} : { thinking: { type: "adaptive" as const }, output_config: { effort: "low" as const } }),
    system: instrucciones(catalogo),
    messages: [{ role: "user" as const, content: contenido }],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  };
  const resp = await anthropic.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
  const salida = resp.stop_reason === "refusal" ? "" : resp.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
  const l = leerLecturaLlamada(salida);
  if (l) l.industria = rubroDeCatalogo(l.industria, catalogo);
  return l;
}

/** 10:00 AM hora de PR, `dias` después de hoy. */
const diaALas10 = (dias: number) => new Date(`${sumarDias(new Date().toISOString().slice(0, 10), dias)}T10:00:00-04:00`);

/** Llamada de cierre de Fathom → lead en SEGUIMIENTO (si no compró). Devuelve qué pasó, para el registro. */
export async function seguimientoDesdeFathom(r: ReunionFathom): Promise<string> {
  const id = Number(r.recording_id);
  let marca: Marca | null = null;
  let resultado: string;
  try {
    resultado = await procesar(r, (m) => (marca = m));
  } catch (e) {
    resultado = `error: ${e instanceof Error ? e.message : String(e)}`;
    console.error("[fathom → seguimiento]", id, resultado);
  }
  await registrarWebhook("fathom", marca, "seguimiento", resultado, { recording_id: id, titulo: r.meeting_title || r.title || null }).catch(() => {});
  return resultado;
}

async function procesar(r: ReunionFathom, fijarMarca: (m: Marca) => void): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "sin ANTHROPIC_API_KEY";
  const lectura = await leerLlamada(r as ReunionConTranscripcion);
  if (!lectura) return "Claude no devolvió JSON";
  if (!vaASeguimiento(lectura)) return lectura.esVenta ? "compró: no va a seguimiento" : "no es llamada de venta";

  // Las cuentas con que graban los closers (Laura graba con un gmail) no son del prospecto.
  const delEquipo = new Set([...CLOSERS_FATHOM, r.recorded_by?.email ?? ""].map((e) => e.trim().toLowerCase()));
  const emails = clienteDeReunion(r).emails.filter((e) => !delEquipo.has(e));
  if (lectura.email && !delEquipo.has(lectura.email) && !emails.includes(lectura.email)) emails.push(lectura.email);
  // Si el closer ya lo marcó ganado en Leads, compró aunque la llamada no lo diga claro.
  const ganado = await leadPorContacto(lectura.telefono, emails, "ganado");
  if (ganado) return `ya ganado en Leads (${ganado.id})`;
  const ya = await leadPorContacto(lectura.telefono, emails);
  const marca: Marca = (ya?.marca as Marca | undefined) ?? lectura.marca ?? "level_up";
  fijarMarca(marca);
  const fathomId = Number(r.recording_id);
  if ((ya?.datos as { seguimiento?: { fathom?: number } } | null)?.seguimiento?.fathom === fathomId) return `ya estaba (${ya!.id})`;
  const telefono = ya?.telefono ?? lectura.telefono;
  if (!ya && telefono) {
    const cliente = await clienteActual(marca, telefono);
    if (cliente) return `es cliente actual (${cliente})`;
  }

  const etapa = etapaDeLectura(lectura);
  await etapaSeguimiento(marca, etapa);
  const lis = await idLis();
  const closer = r.recorded_by?.name?.trim() || "el closer";
  const url = r.share_url || r.url || null;
  // Las notas que Lis traía del Excel se quedan en el panel aunque llegue una llamada nueva.
  const notasLis = (ya?.datos as { seguimiento?: { notasLis?: string } } | null)?.seguimiento?.notasLis;
  const rec = recomendar({ ...lectura, industria: lectura.industria ?? ((ya?.datos as { nicho?: string } | null)?.nicho ?? null) });
  const seguimiento = {
    ...(notasLis ? { notasLis } : {}),
    fuente: "fathom",
    fathom: fathomId,
    url,
    fecha: (r.recording_start_time ?? new Date().toISOString()).slice(0, 10),
    closer,
    servicios: lectura.servicios,
    objecion: lectura.objecion,
    temperatura: lectura.temperatura,
    feedback: lectura.feedback,
    proximoPaso: lectura.proximoPaso,
    presion: lectura.presion,
    razon: lectura.razon,
    facturacionMensual: lectura.facturacionMensual,
    profesion: lectura.profesion,
    descartado: lectura.descartado,
    capacidad: lectura.capacidad,
    precioOfrecido: lectura.precioOfrecido,
    ...rec,
    altaIntencion: rec.prioridad != null,
  };
  const datosNicho = lectura.industria && !(ya?.datos as { nicho?: string } | null)?.nicho ? { nicho: lectura.industria } : {};
  const nota = [
    `📞 Llamada con ${closer} (Fathom): no cerró → SEGUIMIENTO · ${etapa}`,
    rec.prioridad === "super" ? `🔥 SÚPER PRIORITARIO: ${rec.prioridadPor}` : rec.prioridad ? `⭐ Alta intención: ${rec.prioridadPor}` : null,
    lectura.razon ? `Por qué no cerró: ${lectura.razon}` : null,
    rec.productoTexto ? `Qué ofrecerle: ${rec.productoTexto}. ${rec.trato}` : null,
    rec.ofertaIncorrecta ? `⚠️ ${rec.ofertaIncorrecta}` : null,
    lectura.feedback,
    lectura.objecion ? `Objeción: ${lectura.objecion}${lectura.presion ? " · ⚠️ se sintió presionado" : ""}` : null,
    lectura.proximoPaso ? `Próximo paso: ${lectura.proximoPaso}` : null,
    url,
  ].filter(Boolean).join("\n");

  const { id, nuevo } = await ingestarLead({
    marca,
    embudo: EMBUDO_SEGUIMIENTO,
    etapa,
    nombre: ya?.nombre ?? lectura.nombre ?? clienteDeReunion(r).nombre,
    telefono,
    email: ya?.email ?? lectura.email ?? emails[0] ?? null,
    negocio: lectura.negocio,
    origen: "fathom",
    duenoId: lis,
    forzarDueno: true,
    nota,
    datos: { ...datosNicho, seguimiento },
  });
  // Súper prioritario: Elvin también lo quiere ver (20/oct). Aviso a él (Telegram/Slack del CEO), no al equipo.
  if (rec.prioridad === "super") {
    const base = process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";
    await notificarCEO(
      [
        `🔥 Lead SÚPER PRIORITARIO (${marca === "level_up" ? "Level Up" : "AI Borinquen"}): ${ya?.nombre ?? lectura.nombre ?? "—"}${lectura.negocio ? ` · ${lectura.negocio}` : ""}`,
        `${rec.prioridadPor} · llamada con ${closer} · no cerró → ${etapa}`,
        lectura.razon ? `Por qué: ${lectura.razon}` : null,
        rec.ofertaIncorrecta ? `⚠️ ${rec.ofertaIncorrecta}` : null,
        `${base}/pulse/leads/${slugDeMarca(marca)}/${id}`,
      ].filter(Boolean).join("\n"),
    ).catch(() => {});
  }
  // "Definitivamente no" → se queda en Seguimiento perdido (moverTrato ya lo cerró si existía; el nuevo se cierra aquí).
  if (etapa === ETAPA_PERDIDO) {
    if (nuevo) await cerrarTrato(id, "perdido", lectura.razon ?? lectura.objecion ?? "Dijo que no", lis);
    return `${nuevo ? "nuevo" : "movido"} ${id} → ${etapa}`;
  }
  // Tipo "whatsapp", no "llamada": las actividades "llamada" son las citas de los closers en la Arena.
  if (lis) {
    const dias = lectura.temperatura && etapa !== "Por revisar" ? DIAS_PRIMER_CONTACTO[lectura.temperatura] : 1;
    await crearActividad(id, { tipo: "whatsapp", asunto: `Seguimiento ${etapa.toLowerCase()}${lectura.proximoPaso ? ` · ${lectura.proximoPaso}` : ""}`, venceAt: diaALas10(dias), asignadoId: lis }, lis);
  }
  return `${nuevo ? "nuevo" : "movido"} ${id} → ${etapa}`;
}
