"use server";

import { confirmarSubidaCliente, prepararSubidaCliente, subirLocalCliente } from "@/lib/clientes-app/archivos";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { visorActual } from "@/lib/clientes-app/sesion";

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// Solo el CLIENTE sube a su carpeta (la vista previa del equipo no).
async function clienteConCarpeta() {
  const v = await visorActual();
  if (!v || v.modo !== "cliente") throw new Error("Solo desde la app del cliente");
  const f = await fichaCliente(v.itemId);
  if (!f?.carpetaId) throw new Error("Tu carpeta todavía no está lista: mándalo por Slack.");
  return { itemId: v.itemId, carpetaId: f.carpetaId };
}

const envolver = async <T extends object>(fn: () => Promise<T>): Promise<R<T>> => {
  try {
    return { ok: true, ...(await fn()) };
  } catch (e) {
    const m = e instanceof Error ? e.message : "error";
    return { ok: false, error: m.startsWith("drive-") ? "No pudimos llegar a tu carpeta ahora mismo. Intenta en un rato o mándalo por Slack." : m };
  }
};

export async function prepararSubidaAction(p: { nombre: string; mime: string; bytes: number }) {
  return envolver(async () => {
    const { itemId } = await clienteConCarpeta();
    return prepararSubidaCliente(itemId, String(p.nombre).slice(0, 200), String(p.mime).slice(0, 100), Number(p.bytes) || 0);
  });
}

/** Dev local (sin Supabase): el archivo viaja por el servidor. */
export async function subirLocalAction(ruta: string, datos: FormData) {
  return envolver(async () => {
    const { itemId } = await clienteConCarpeta();
    if (!ruta.startsWith(`clientes-app/${itemId}/subidas/`)) throw new Error("Ruta inválida");
    const f = datos.get("archivo");
    if (!(f instanceof File)) throw new Error("Sin archivo");
    await subirLocalCliente(ruta, new Uint8Array(await f.arrayBuffer()), f.type || null);
    return {};
  });
}

export async function confirmarSubidaAction(p: { ruta: string; nombre: string }) {
  return envolver(async () => {
    const { itemId, carpetaId } = await clienteConCarpeta();
    await confirmarSubidaCliente(itemId, carpetaId, p.ruta, p.nombre);
    return {};
  });
}
