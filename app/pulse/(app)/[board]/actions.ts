"use server";

import { refresh } from "next/cache";

import { requiereAccesoBoard, requiereAdmin, requiereUsuario } from "@/lib/pulse/auth";
import type { Accion, Cuando } from "@/lib/pulse/automatizaciones";
import { aplicarReglas, leerReglas, RequisitoError, verificarRequisitos } from "@/lib/pulse/motor-reglas";
import { avisarCambio, prepararBaja } from "@/lib/pulse/puente-n8n";
import * as repo from "@/lib/pulse/repo";
import { etiquetasQuitadasEnUso, poderes } from "@/lib/pulse/permisos";
import { alertarElvin, prohibido, registrarEvento } from "@/lib/pulse/seguridad";
import { subirArchivo, urlArchivo } from "@/lib/pulse/storage";
import type { Actividad, ArchivoPulse, ColorPulse, Columna, Grupo, Item, SettingsColumna, TipoColumna, ValorCelda } from "@/lib/pulse/types";
import { validarValor } from "@/lib/pulse/valores";

// Server actions del tablero. Todas verifican sesión, validan lo mínimo y devuelven
// { ok, ... } (nunca lanzan hacia el cliente). Las de celda NO hacen revalidatePath: el
// cliente ya actualizó su store de forma optimista; las estructurales llaman refresh().

export type Requisito = { columnId: string; itemIds: string[] };
type R<T = object> = ({ ok: true } & T) | { ok: false; error: string; requiere?: Requisito };

async function envolver<T extends object>(fn: () => Promise<T>): Promise<R<T>> {
  try {
    const r = await fn();
    return { ok: true, ...r };
  } catch (e) {
    // Una automatización exige un campo lleno antes del cambio: el cliente lo pide y reintenta.
    if (e instanceof RequisitoError) return { ok: false, error: e.message, requiere: { columnId: e.columnId, itemIds: e.itemIds } };
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return { ok: false, error: msg === "no-autorizado" ? "Tu sesión venció: vuelve a entrar" : msg };
  }
}

// ---------- celdas / items ----------

export async function actualizarValorAction(p: {
  itemId: string;
  columnId: string;
  tipo: TipoColumna;
  settings: SettingsColumna;
  value: unknown;
}): Promise<R<{ updatedAt: string; value: ValorCelda; movidoA?: { groupId: string; regla: string }; item?: Item; automatizaciones?: string[] }>> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemId }));
    const value = validarValor(p.tipo, p.value, p.settings);
    const [antes] = await repo.leerItems([p.itemId]);
    if (!antes) throw new Error("El elemento no existe");
    const evento = { tipo: "valor" as const, columnId: p.columnId, antes: antes.values[p.columnId] ?? null, despues: value, grupoActual: antes.groupId };
    // Automatizaciones (tabla pulse_reglas): primero lo que exigen, después el cambio y sus acciones.
    await verificarRequisitos(antes.boardId, [{ item: antes, evento, valoresTrasCambio: { ...antes.values, [p.columnId]: value } }]);
    const r = await repo.actualizarValor({ itemId: p.itemId, columnId: p.columnId, value, userId: u.id });
    let efecto: { reglas: string[]; movidoA: string | null } = { reglas: [], movidoA: null };
    try {
      efecto = await aplicarReglas(r.boardId, { ...antes, values: { ...antes.values, [p.columnId]: value } }, evento, u.id);
    } catch (e) {
      console.error("pulse automatización", e); // el valor ya quedó guardado
    }
    avisarCambio({ itemIds: [p.itemId], motivo: efecto.movidoA ? "mover" : "valor" });
    const item = efecto.reglas.length ? (await repo.leerItems([p.itemId]))[0] : undefined;
    return {
      updatedAt: r.updatedAt,
      value,
      ...(efecto.movidoA ? { movidoA: { groupId: efecto.movidoA, regla: efecto.reglas.join(" · ") } } : {}),
      ...(item ? { item, automatizaciones: efecto.reglas } : {}),
    };
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

export async function moverItemsAction(p: { itemIds: string[]; groupId: string }): Promise<R<{ items: Item[]; automatizaciones: string[] }>> {
  return envolver(async () => {
    const boardId = await repo.boardDe({ groupId: p.groupId });
    const u = await requiereAccesoBoard(boardId);
    const antes = await repo.leerItems(p.itemIds);
    const eventos = antes.map((item) => ({ item, evento: { tipo: "grupo" as const, desde: item.groupId, hacia: p.groupId } }));
    await verificarRequisitos(boardId!, eventos);
    await repo.moverItems({ itemIds: p.itemIds, groupId: p.groupId, userId: u.id });
    const automatizaciones = new Set<string>();
    for (const { item, evento } of eventos) {
      try {
        const e = await aplicarReglas(boardId!, { ...item, groupId: p.groupId }, evento, u.id);
        e.reglas.forEach((x) => automatizaciones.add(x));
      } catch (err) {
        console.error("pulse automatización", err);
      }
    }
    avisarCambio({ itemIds: p.itemIds, motivo: "mover" });
    const items = automatizaciones.size ? await repo.leerItems(p.itemIds) : [];
    return { items, automatizaciones: [...automatizaciones] };
  });
}

export async function eliminarItemsAction(p: { itemIds: string[] }): Promise<R<{ n: number }>> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ itemId: p.itemIds[0] }));
    const tope = poderes(u.rol).topeBorradoItems;
    if (tope !== null && p.itemIds.length > tope) await prohibido(u, `eliminar ${p.itemIds.length} elementos de golpe (tope ${tope})`);
    const { bajas, afectados } = await prepararBaja(p.itemIds);
    const n = await repo.eliminarItems({ itemIds: p.itemIds, userId: u.id });
    if (n > 5) {
      await registrarEvento({ tipo: "borrado_masivo", email: u.email, actorId: u.id, detalle: `${n} elementos` });
      await alertarElvin(`borrado:${u.id}:${Date.now()}`, `${u.nombre} eliminó ${n} elementos de un tablero.`);
    }
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
    const u = await requiereAccesoBoard(await repo.boardDe({ columnId: p.columnId }));
    const patch = { ...p.patch };
    if (patch.settings?.labels && !poderes(u.rol).quitarEtiquetasEnUso) {
      const actual = await repo.leerColumna(p.columnId);
      const enUso = await repo.valoresEnUso(p.columnId);
      const quitadas = etiquetasQuitadasEnUso(actual?.settings.labels, patch.settings.labels, enUso);
      if (quitadas.length) await prohibido(u, `quitar ${quitadas.length} etiqueta(s) que hoy usan elementos en «${actual?.title}»`);
    }
    if (patch.title !== undefined) patch.title = patch.title.trim().slice(0, 100) || "Columna";
    if (patch.width !== undefined) patch.width = Math.max(70, Math.min(800, Math.round(patch.width)));
    const column = await repo.actualizarColumna(p.columnId, patch);
    return { column };
  });
}

export async function eliminarColumnaAction(p: { columnId: string }): Promise<R> {
  return envolver(async () => {
    const u = await requiereAccesoBoard(await repo.boardDe({ columnId: p.columnId }));
    const col = await repo.leerColumna(p.columnId);
    if (!poderes(u.rol).eliminarColumnas) await prohibido(u, `eliminar la columna «${col?.title ?? "?"}» completa`);
    await repo.eliminarColumna(p.columnId);
    await registrarEvento({ tipo: "borrado_masivo", email: u.email, actorId: u.id, detalle: `columna «${col?.title ?? "?"}»` });
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
    const admin = await requiereAdmin();
    await repo.guardarAccesoBoard(p.boardId, { privado: p.privado, miembros: [...new Set(p.miembros)] });
    await registrarEvento({ tipo: "acceso_tablero", actorId: admin.id, email: admin.email, detalle: `${p.boardId}: ${p.privado ? `privado (${p.miembros.length} miembros)` : "para todos"}` });
    refresh();
    return {};
  });
}

export async function eliminarBoardAction(p: { boardId: string }): Promise<R> {
  return envolver(async () => {
    const admin = await requiereAdmin();
    await repo.eliminarBoard(p.boardId);
    await registrarEvento({ tipo: "tablero_eliminado", actorId: admin.id, email: admin.email, detalle: p.boardId });
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

// ---------- automatizaciones (pulse_reglas) ----------

export async function listarReglasAction(p: { boardId: string }) {
  return envolver(async () => {
    await requiereAccesoBoard(p.boardId);
    return { reglas: await leerReglas(p.boardId) };
  });
}

function validarRegla(cuando: Cuando, entonces: Accion[], columnas: Set<string>, grupos: Set<string>) {
  const col = (id: string) => {
    if (!columnas.has(id)) throw new Error("La regla apunta a una columna que no existe");
  };
  const grp = (id: string) => {
    if (!grupos.has(id)) throw new Error("La regla apunta a un grupo que no existe");
  };
  if (cuando.tipo === "valor") col(cuando.columnId);
  else if (cuando.tipo === "grupo") grp(cuando.groupId);
  else throw new Error("Disparador inválido");
  cuando.excepto?.forEach(grp);
  if (!entonces.length) throw new Error("La regla necesita al menos una acción");
  for (const a of entonces) {
    if (a.tipo === "mover") grp(a.groupId);
    else if (a.tipo === "fecha" || a.tipo === "valor" || a.tipo === "persona" || a.tipo === "exigir") col(a.columnId);
    else if (a.tipo !== "avisar") throw new Error("Acción inválida");
    if (a.tipo === "fecha" && (!Number.isInteger(a.dias) || Math.abs(a.dias) > 365)) throw new Error("Los días deben estar entre -365 y 365");
  }
}

export async function guardarReglaAction(p: { boardId: string; id?: string; nombre: string; activa: boolean; cuando: Cuando; entonces: Accion[] }) {
  return envolver(async () => {
    const u = await requiereAccesoBoard(p.boardId);
    if (!poderes(u.rol).editarAutomatizaciones) await prohibido(u, "editar automatizaciones");
    const tablero = await repo.leerEstructura(p.boardId);
    validarRegla(p.cuando, p.entonces, new Set(tablero.columns.map((c) => c.id)), new Set(tablero.groups.map((g) => g.id)));
    const nombre = p.nombre.trim().slice(0, 120) || "Automatización";
    const regla = await repo.guardarRegla({ id: p.id, boardId: p.boardId, nombre, activa: p.activa, cuando: p.cuando, entonces: p.entonces, userId: u.id });
    await registrarEvento({ tipo: "automatizacion", email: u.email, actorId: u.id, detalle: `${p.id ? "editó" : "creó"} «${nombre}»` });
    return { regla };
  });
}

export async function activarReglaAction(p: { id: string; activa: boolean }) {
  return envolver(async () => {
    const boardId = await repo.boardDeRegla(p.id);
    const u = await requiereAccesoBoard(boardId);
    if (!poderes(u.rol).editarAutomatizaciones) await prohibido(u, "editar automatizaciones");
    await repo.activarRegla(p.id, p.activa);
    return {};
  });
}

export async function eliminarReglaAction(p: { id: string }) {
  return envolver(async () => {
    const boardId = await repo.boardDeRegla(p.id);
    const u = await requiereAccesoBoard(boardId);
    if (!poderes(u.rol).editarAutomatizaciones) await prohibido(u, "borrar automatizaciones");
    const nombre = await repo.eliminarRegla(p.id);
    await registrarEvento({ tipo: "automatizacion", email: u.email, actorId: u.id, detalle: `borró «${nombre}»` });
    return {};
  });
}
