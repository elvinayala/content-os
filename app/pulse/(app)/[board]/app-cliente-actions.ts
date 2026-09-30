"use server";

import { eq } from "drizzle-orm";

import { linkCliente } from "@/lib/clientes-app/acceso";
import { avisarCliente, avisosClientesReales, telefonosCliente } from "@/lib/clientes-app/push";
import { TABLERO_CLIENTES } from "@/lib/clientes-app/sesion";
import { requiereAccesoBoard } from "@/lib/pulse/auth";
import { db } from "@/lib/pulse/db";
import * as repo from "@/lib/pulse/repo";
import { pulseAppClientes, pulseBoards } from "@/lib/pulse/schema";
import { registrarEvento } from "@/lib/pulse/seguridad";

// "App del cliente" en la ficha de LEVEL UP MEDIA: el equipo crea/cambia/desactiva el link personal del cliente,
// pega su canal de Slack, ve si la instaló y le manda un aviso. Solo quien ve el tablero y solo en ese tablero.

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const envolver = async <T extends object>(fn: () => Promise<T>): Promise<R<T>> => {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
};

async function autorizar(itemId: string) {
  const boardId = await repo.boardDe({ itemId });
  const u = await requiereAccesoBoard(boardId);
  const d = await db();
  const [b] = await d.select({ slug: pulseBoards.slug }).from(pulseBoards).where(eq(pulseBoards.id, boardId!));
  if (b?.slug !== TABLERO_CLIENTES) throw new Error("La app es solo para clientes de LEVEL UP MEDIA");
  return { u, d };
}

export interface EstadoAppCliente {
  existe: boolean;
  activo: boolean;
  link: string | null;
  slackUrl: string | null;
  ultimoAcceso: string | null;
  telefonos: { dispositivo: string | null; ultimoOk: string | null }[];
  avisosReales: boolean;
  secretoListo: boolean;
}

async function estado(itemId: string): Promise<EstadoAppCliente> {
  const d = await db();
  const [a] = await d.select().from(pulseAppClientes).where(eq(pulseAppClientes.itemId, itemId));
  const tels = await telefonosCliente(itemId).catch(() => []);
  return {
    existe: !!a,
    activo: !!a?.activo,
    link: a?.activo ? await linkCliente(itemId, a.version) : null,
    slackUrl: a?.slackUrl ?? null,
    ultimoAcceso: a?.ultimoAccesoAt?.toISOString() ?? null,
    telefonos: tels.map((t) => ({ dispositivo: t.dispositivo, ultimoOk: t.ultimoOkAt?.toISOString() ?? null })),
    avisosReales: avisosClientesReales(),
    secretoListo: !!process.env.CLIENTES_APP_SECRET,
  };
}

export async function estadoAppClienteAction(itemId: string) {
  return envolver(async () => {
    await autorizar(itemId);
    return { estado: await estado(itemId) };
  });
}

/** Crear el link (o reactivarlo: siempre con versión nueva, así un link viejo nunca revive). */
export async function crearLinkAppAction(itemId: string) {
  return envolver(async () => {
    const { u, d } = await autorizar(itemId);
    if (!process.env.CLIENTES_APP_SECRET) throw new Error("Falta CLIENTES_APP_SECRET en el servidor");
    const [a] = await d.select().from(pulseAppClientes).where(eq(pulseAppClientes.itemId, itemId));
    if (!a) await d.insert(pulseAppClientes).values({ itemId, creadoPor: u.id });
    else if (!a.activo) await d.update(pulseAppClientes).set({ activo: true, version: a.version + 1 }).where(eq(pulseAppClientes.itemId, itemId));
    await registrarEvento({ tipo: "app_cliente", email: u.email, userId: u.id, detalle: `link creado · ${itemId}` });
    return { estado: await estado(itemId) };
  });
}

/** Cambiar el link: el anterior y las sesiones abiertas con él dejan de entrar. */
export async function cambiarLinkAppAction(itemId: string) {
  return envolver(async () => {
    const { u, d } = await autorizar(itemId);
    const [a] = await d.select().from(pulseAppClientes).where(eq(pulseAppClientes.itemId, itemId));
    if (!a) throw new Error("Este cliente todavía no tiene app");
    await d.update(pulseAppClientes).set({ version: a.version + 1, activo: true }).where(eq(pulseAppClientes.itemId, itemId));
    await registrarEvento({ tipo: "app_cliente", email: u.email, userId: u.id, detalle: `link cambiado · ${itemId}` });
    return { estado: await estado(itemId) };
  });
}

export async function desactivarAppAction(itemId: string) {
  return envolver(async () => {
    const { u, d } = await autorizar(itemId);
    await d.update(pulseAppClientes).set({ activo: false }).where(eq(pulseAppClientes.itemId, itemId));
    await registrarEvento({ tipo: "app_cliente", email: u.email, userId: u.id, detalle: `app desactivada · ${itemId}` });
    return { estado: await estado(itemId) };
  });
}

/** El canal de Slack del negocio (link que se copia en Slack: "Copiar enlace" del canal). */
export async function guardarSlackAppAction(itemId: string, url: string) {
  return envolver(async () => {
    const { d } = await autorizar(itemId);
    const limpio = url.trim();
    if (limpio && !/^https:\/\/([\w-]+\.)?slack\.com\//.test(limpio)) throw new Error("Pega el enlace del canal (Slack → canal → Copiar enlace)");
    const [a] = await d.select().from(pulseAppClientes).where(eq(pulseAppClientes.itemId, itemId));
    if (!a) throw new Error("Crea primero el link de la app");
    await d.update(pulseAppClientes).set({ slackUrl: limpio || null }).where(eq(pulseAppClientes.itemId, itemId));
    return { estado: await estado(itemId) };
  });
}

/** Aviso escrito por el equipo al teléfono del cliente (sale solo con CLIENTES_APP_AVISOS=real). */
export async function avisarClienteAction(itemId: string, texto: string) {
  return envolver(async () => {
    const { u } = await autorizar(itemId);
    const t = texto.trim().slice(0, 160);
    if (t.length < 3) throw new Error("Escribe el aviso");
    if (!avisosClientesReales()) return { enviados: 0, simulado: true };
    const enviados = await avisarCliente(itemId, { titulo: "Level Up Media", texto: t, url: "/cliente", tag: "lu-equipo" });
    await registrarEvento({ tipo: "app_cliente", email: u.email, userId: u.id, detalle: `aviso (${enviados}) · ${itemId}: ${t}` });
    return { enviados, simulado: false };
  });
}
