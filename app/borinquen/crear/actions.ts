"use server";

import { revalidatePath } from "next/cache";

import type {
  AgenteVoz,
  AsistenteChat,
  CanalChat,
  Entrenamiento,
  ProveedorVoz,
} from "@/lib/types";
import { configDesdePreset } from "@/lib/voz/preset";
import { provisionarAgente } from "@/lib/voz";
import { upsertAgenteVoz } from "@/lib/voz/store";
import { upsertAsistenteChat } from "@/lib/chat/store";
import { armarPromptEntrenado } from "@/lib/borinquen/entrenar";

// Datos comunes que junta el wizard "crear + entrenar".
interface DatosBase {
  nombre: string;
  cliente?: string;
  proposito: string;
  entrenamiento: Entrenamiento;
}

function limpiar(ent: Entrenamiento): Entrenamiento {
  return {
    nicho: ent.nicho?.trim() ?? "",
    oferta: ent.oferta?.trim() ?? "",
    tono: ent.tono?.trim() ?? "",
    publico: ent.publico?.trim() ?? "",
    cta: ent.cta?.trim() ?? "",
    conversaciones: ent.conversaciones?.trim() ?? "",
  };
}

// Crea un AGENTE DE VOZ entrenado con la info del negocio + conversaciones.
export async function crearAgenteVozAction(
  datos: DatosBase & { proveedor: ProveedorVoz },
) {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "El agente necesita un nombre." };

  const ahora = new Date().toISOString();
  const id = `av-${crypto.randomUUID().slice(0, 8)}`;
  const cliente = datos.cliente?.trim() || undefined;
  const negocio = cliente ?? "AI Borinquen";
  const ent = limpiar(datos.entrenamiento);

  const config = configDesdePreset({ negocio, proposito: datos.proposito });
  config.promptSistema = armarPromptEntrenado("voz", negocio, datos.proposito, ent);

  let agente: AgenteVoz = {
    id,
    nombre,
    proveedor: datos.proveedor,
    unidad: "ai-borinquen",
    cliente,
    proposito: datos.proposito.trim() || "Atender y calificar",
    estado: "borrador",
    config,
    fuente: "mock",
    entrenamiento: ent,
    creadoEl: ahora,
    actualizadoEl: ahora,
    metricas: { llamadas: 0, latenciaP50Ms: null, latenciaP95Ms: null, duracionPromMin: null },
  };

  const prov = await provisionarAgente(agente);
  agente = {
    ...agente,
    externalId: prov.externalId,
    numero: prov.numero ?? agente.numero,
    fuente: prov.fuente,
  };

  await upsertAgenteVoz(agente);
  revalidatePath("/borinquen");
  revalidatePath("/borinquen/voz");
  return { ok: true, id, tipo: "voz" as const, nota: prov.nota };
}

// Crea un ASISTENTE DE CHAT entrenado (motor propio de Bori, sin telefonía).
export async function crearAsistenteChatAction(
  datos: DatosBase & { canales: CanalChat[] },
) {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: "El asistente necesita un nombre." };

  const ahora = new Date().toISOString();
  const id = `ch-${crypto.randomUUID().slice(0, 8)}`;
  const cliente = datos.cliente?.trim() || undefined;
  const negocio = cliente ?? "AI Borinquen";
  const ent = limpiar(datos.entrenamiento);

  const asistente: AsistenteChat = {
    id,
    nombre,
    proveedor: "borinquen",
    unidad: "ai-borinquen",
    cliente,
    proposito: datos.proposito.trim() || "Responder y calificar",
    estado: "borrador",
    canales: datos.canales.length ? datos.canales : ["whatsapp"],
    promptSistema: armarPromptEntrenado("chat", negocio, datos.proposito, ent),
    entrenamiento: ent,
    creadoEl: ahora,
    actualizadoEl: ahora,
    metricas: { chats: 0, resueltosPct: null, leads: 0 },
  };

  await upsertAsistenteChat(asistente);
  revalidatePath("/borinquen");
  revalidatePath("/borinquen/chat");
  return { ok: true, id, tipo: "chat" as const };
}
