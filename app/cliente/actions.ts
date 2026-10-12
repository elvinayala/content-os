"use server";

import { refresh } from "next/cache";

import { avisarEntregas, borrarEntrega, confirmarEntrega, prepararEntrega, subirEntregaLocal } from "@/lib/clientes-app/entregas";
import { esTipoEntrega, type TipoEntrega } from "@/lib/clientes-app/entregas-reglas";
import { visorActual } from "@/lib/clientes-app/sesion";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const envolver = async <T extends object>(fn: () => Promise<T>): Promise<R<T>> => {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
};

// Los entregables (plan, creativos, videos) los sube SOLO el equipo, desde "Ver como el cliente" (sesión de Pulse que
// puede ver LEVEL UP MEDIA). El cliente solo los ve.
async function equipo() {
  const v = await visorActual();
  if (!v || v.modo !== "equipo") throw new Error("Solo el equipo, desde Ver como el cliente");
  return v;
}

function tipoValido(t: unknown): TipoEntrega {
  if (!esTipoEntrega(t)) throw new Error("Tipo inválido");
  return t;
}

export async function prepararEntregaAction(p: { tipo: string; nombre: string; mime: string; bytes: number }) {
  return envolver(async () => {
    const v = await equipo();
    return prepararEntrega(v.itemId, tipoValido(p.tipo), String(p.nombre).slice(0, 200), String(p.mime).slice(0, 100), Number(p.bytes) || 0);
  });
}

/** Dev local (sin Supabase): el archivo viaja por el servidor. */
export async function subirEntregaLocalAction(ruta: string, datos: FormData) {
  return envolver(async () => {
    const v = await equipo();
    if (!ruta.startsWith(`clientes-app/${v.itemId}/entregas/`)) throw new Error("Ruta inválida");
    const f = datos.get("archivo");
    if (!(f instanceof File)) throw new Error("Sin archivo");
    await subirEntregaLocal(ruta, new Uint8Array(await f.arrayBuffer()), f.type || null);
    return {};
  });
}

/** Registra la tanda subida y le manda UN aviso al cliente (si los avisos están encendidos). */
export async function confirmarEntregasAction(p: { tipo: string; archivos: { ruta: string; nombre: string; mime: string }[] }) {
  return envolver(async () => {
    const v = await equipo();
    const tipo = tipoValido(p.tipo);
    let n = 0;
    for (const a of p.archivos.slice(0, 30)) {
      await confirmarEntrega(v.itemId, { tipo, ruta: a.ruta, nombre: a.nombre, mime: a.mime }, v.usuario.id);
      n++;
    }
    if (n) await avisarEntregas(v.itemId, tipo, n).catch(() => null);
    refresh();
    return { n };
  });
}

export async function borrarEntregaAction(id: string) {
  return envolver(async () => {
    const v = await equipo();
    await borrarEntrega(v.itemId, id);
    refresh();
    return {};
  });
}

/** Refiere y gana: solo el cliente (la vista previa del equipo no crea referidos). */
export async function referirAction(p: { negocio: string; contacto: string; telefono: string; nota?: string }) {
  return envolver(async () => {
    const v = await visorActual();
    if (!v || v.modo !== "cliente") throw new Error("Esto lo usa el cliente desde su app.");
    const { validarReferido } = await import("@/lib/clientes-app/referidos-reglas");
    const r = validarReferido(p);
    if ("error" in r) throw new Error(r.error);
    const { fichaCliente } = await import("@/lib/clientes-app/datos");
    const f = await fichaCliente(v.itemId);
    const { crearReferido } = await import("@/lib/clientes-app/referidos");
    await crearReferido(v.itemId, f?.negocio ?? "Cliente", r.ok);
    refresh();
    return {};
  });
}

/** Reunión de estrategia del mes (solo clientes con derecho; el servidor lo vuelve a comprobar). */
export async function pedirReunionAction(p: { opciones: { fecha: string; hora: string }[]; tema: string }) {
  return envolver(async () => {
    const v = await visorActual();
    if (!v || v.modo !== "cliente") throw new Error("Esto lo usa el cliente desde su app.");
    const { validarSolicitud } = await import("@/lib/clientes-app/reunion-reglas");
    const { hoyPR } = await import("@/lib/clientes-app/formato");
    const r = validarSolicitud(p, hoyPR());
    if ("error" in r) throw new Error(r.error);
    const { fichaCliente } = await import("@/lib/clientes-app/datos");
    const f = await fichaCliente(v.itemId);
    const { solicitarReunion } = await import("@/lib/clientes-app/reunion");
    await solicitarReunion(v.itemId, { negocio: f?.negocio ?? "Cliente", contacto: f?.contacto ?? "" }, r.ok);
    refresh();
    return {};
  });
}
