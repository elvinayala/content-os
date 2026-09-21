"use server";

import { refresh } from "next/cache";

import { requiereAccesoBoard, requiereAdmin, requiereUsuario } from "@/lib/pulse/auth";
import { avisarCambio, prepararBaja } from "@/lib/pulse/puente-n8n";
import * as repo from "@/lib/pulse/repo";
import { subirArchivo, urlArchivo } from "@/lib/pulse/storage";
import type { Actividad, ArchivoPulse, ColorPulse, Columna, Grupo, Item, SettingsColumna, TipoColumna, ValorCelda } from "@/lib/pulse/types";
import { validarValor } from "@/lib/pulse/valores";

// Server actions del tablero. Todas verifican sesión, validan lo mínimo y devuelven
// { ok, ... } (nunca lanzan hacia el cliente). Las de celda NO hacen revalidatePath: el
// cliente ya actualizó su store de forma optimista; las estructurales llaman refresh().

type R<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function envolver<T extends object>(fn: () => Promise<T>): Promise<R<T>> {
  try {
    const r = await fn();
    return { ok: true, ...r };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return { ok: false, error: msg === "no-autorizado" ? "Tu sesión venció: volvé a entrar" : msg };
  }
}

// ---------- celdas / items ----------

export async function actualizarValorAction(p: {
  itemId: string;
  columnId: string;
  tipo: TipoColumna;
  settings: SettingsColumna;
  value: unknown;
}): Promise<R<{ updatedAt: string; value: ValorCelda }>> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemId }));
    const value = validarValor(p.tipo, p.value, p.settings);
    const r = await repo.actualizarValor({ itemId: p.itemId, columnId: p.columnId, value, userId: u.id });
    avisarCambio({ itemIds: [p.itemId], motivo: "valor" });
    return { updatedAt: r.updatedAt, value };
  });
}

export async function renombrarItemAction(p: { itemId: string; name: string }): Promise<R> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemId }));
    const name = p.name.trim().slice(0, 300);
    if (!name) throw new Error("El nombre no puede quedar vacío");
    await repo.renombrarItem({ itemId: p.itemId, name, userId: u.id });
    avisarCambio({ itemIds: [p.itemId], motivo: "nombre" });
    return {};
  });
}

export async function crearItemAction(p: { boardId: string; groupId: string; name: string; alInicio?: boolean; values?: Record<string, ValorCelda> }): Promise<R<{ item: Item }>> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(p.boardId);
    const name = p.name.trim().slice(0, 300) || "Nuevo elemento";
    const item = await repo.crearItem({ boardId: p.boardId, groupId: p.groupId, name, userId: u.id, alInicio: p.alInicio, values: p.values });
    avisarCambio({ itemIds: [item.id], motivo: "crear" });
    return { item };
  });
}

export async function moverItemsAction(p: { itemIds: string[]; groupId: string }): Promise<R> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ groupId: p.groupId }));
    await repo.moverItems({ itemIds: p.itemIds, groupId: p.groupId, userId: u.id });
    avisarCambio({ itemIds: p.itemIds, motivo: "mover" });
    return {};
  });
}

export async function eliminarItemsAction(p: { itemIds: string[] }): Promise<R<{ n: number }>> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemIds[0] }));
    const { bajas, afectados } = await prepararBaja(p.itemIds);
    const n = await repo.eliminarItems({ itemIds: p.itemIds, userId: u.id });
    avisarCambio({ itemIds: afectados, bajas, motivo: "eliminar" });
    refresh();
    return { n };
  });
}

export async function leerItemsGrupoAction(p: { groupId: string }): Promise<R<{ items: Item[] }>> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ groupId: p.groupId }));
    return { items: await repo.leerItemsGrupo(p.groupId) };
  });
}

// ---------- columnas ----------

export async function crearColumnaAction(p: { boardId: string; title: string; type: TipoColumna; settings?: SettingsColumna }): Promise<R<{ column: Columna }>> {
  return envolver(async () => {
    await requiereAccesoBoard(p.boardId);
    const title = p.title.trim().slice(0, 100) || "Nueva columna";
    const column = await repo.crearColumna({ boardId: p.boardId, title, type: p.type, settings: p.settings });
    return { column };
  });
}

export async function actualizarColumnaAction(p: { columnId: string; patch: { title?: string; settings?: SettingsColumna; width?: number } }): Promise<R<{ column: Columna }>> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ columnId: p.columnId }));
    const patch = { ...p.patch };
    if (patch.title !== undefined) patch.title = patch.title.trim().slice(0, 100) || "Columna";
    if (patch.width !== undefined) patch.width = Math.max(70, Math.min(800, Math.round(patch.width)));
    const column = await repo.actualizarColumna(p.columnId, patch);
    return { column };
  });
}

export async function eliminarColumnaAction(p: { columnId: string }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ columnId: p.columnId }));
    await repo.eliminarColumna(p.columnId);
    return {};
  });
}

export async function reordenarColumnasAction(p: { boardId: string; ids: string[] }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(p.boardId);
    await repo.reordenarColumnas(p.boardId, p.ids);
    return {};
  });
}

// ---------- grupos ----------

export async function crearGrupoAction(p: { boardId: string; title: string; color: ColorPulse; despuesDe?: string }): Promise<R<{ group: Grupo }>> {
  return envolver(async () => {
    await requiereAccesoBoard(p.boardId);
    const group = await repo.crearGrupo({ boardId: p.boardId, title: p.title.trim().slice(0, 100) || "Nuevo grupo", color: p.color, despuesDe: p.despuesDe });
    return { group };
  });
}

export async function actualizarGrupoAction(p: { groupId: string; patch: { title?: string; color?: ColorPulse; colapsadoDefault?: boolean } }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ groupId: p.groupId }));
    const patch = { ...p.patch };
    if (patch.title !== undefined) patch.title = patch.title.trim().slice(0, 100) || "Grupo";
    await repo.actualizarGrupo(p.groupId, patch);
    return {};
  });
}

export async function reordenarGruposAction(p: { boardId: string; ids: string[] }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(p.boardId);
    await repo.reordenarGrupos(p.boardId, p.ids);
    return {};
  });
}

export async function eliminarGrupoAction(p: { groupId: string }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ groupId: p.groupId }));
    await repo.eliminarGrupo(p.groupId);
    return {};
  });
}

// ---------- tablero ----------

export async function actualizarBoardAction(p: { boardId: string; patch: { nombre?: string; descripcion?: string | null; color?: ColorPulse } }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(p.boardId);
    const patch = { ...p.patch };
    if (patch.nombre !== undefined) patch.nombre = patch.nombre.trim().slice(0, 100) || "Tablero";
    await repo.actualizarBoard(p.boardId, patch);
    refresh();
    return {};
  });
}

export async function guardarAccesoBoardAction(p: { boardId: string; privado: boolean; miembros: string[] }): Promise<R> {
  return envolver(async () => {
    await requiereAdmin();
    await repo.guardarAccesoBoard(p.boardId, { privado: p.privado, miembros: [...new Set(p.miembros)] });
    refresh();
    return {};
  });
}

export async function eliminarBoardAction(p: { boardId: string }): Promise<R> {
  return envolver(async () => {
    await requiereAdmin();
    await repo.eliminarBoard(p.boardId);
    refresh();
    return {};
  });
}

// ---------- actividad ----------

export async function leerActividadAction(p: { itemId: string }): Promise<R<{ actividad: Actividad[] }>> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemId }));
    return { actividad: await repo.leerActividad(p.itemId) };
  });
}

export async function comentarAction(p: { itemId: string; boardId: string; texto: string }): Promise<R<{ actividad: Actividad }>> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemId }));
    const texto = p.texto.trim().slice(0, 5000);
    if (!texto) throw new Error("El comentario está vacío");
    return { actividad: await repo.comentar({ itemId: p.itemId, boardId: p.boardId, texto, userId: u.id }) };
  });
}

// ---------- archivos ----------

export async function subirArchivoAction(formData: FormData): Promise<R<{ archivo: ArchivoPulse }>> {
  return envolver(async () => {
    const itemId = String(formData.get("itemId") ?? "");
    const columnId = String(formData.get("columnId") ?? "");
    const boardId = String(formData.get("boardId") ?? "");
    const file = formData.get("file");
    if (!(file instanceof File) || !itemId || !columnId || !boardId) throw new Error("Falta el archivo");
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId }));
    if (file.size > 10 * 1024 * 1024) throw new Error("El archivo supera los 10 MB");
    const nombre = file.name.replace(/[^\w.\-() ]+/g, "_").slice(0, 150) || "archivo";
    const storagePath = `${boardId}/${itemId}/${crypto.randomUUID()}-${nombre}`;
    await subirArchivo(storagePath, Buffer.from(await file.arrayBuffer()), file.type || null);
    const archivo = await repo.registrarArchivo({ itemId, columnId, nombre: file.name.slice(0, 200), storagePath, mime: file.type || null, bytes: file.size, userId: u.id });
    // El cliente agrega archivo.id a la lista de la celda con actualizarValorAction.
    return { archivo };
  });
}

export async function urlArchivoAction(p: { fileId: string }): Promise<R<{ url: string; nombre: string }>> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ fileId: p.fileId }));
    const f = await repo.leerArchivo(p.fileId);
    if (!f) throw new Error("El archivo no existe");
    return { url: await urlArchivo(f.storagePath, f.id), nombre: f.nombre };
  });
}

export async function eliminarArchivoAction(p: { fileId: string }): Promise<R> {
  return envolver(async () => {
    await requiereAccesoBoard(await repo.boardDe({ fileId: p.fileId }));
    await repo.eliminarArchivo(p.fileId);
    return {};
  });
}
