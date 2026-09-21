"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { toast } from "sonner";

import {
  actualizarColumnaAction,
  actualizarGrupoAction,
  actualizarValorAction,
  crearColumnaAction,
  crearGrupoAction,
  crearItemAction,
  eliminarColumnaAction,
  eliminarGrupoAction,
  eliminarItemsAction,
  leerItemsGrupoAction,
  moverItemsAction,
  renombrarItemAction,
  reordenarColumnasAction,
  reordenarGruposAction,
} from "@/app/pulse/(app)/[board]/actions";
import type {
  ArchivoPulse,
  Board,
  BoardCompleto,
  ColorPulse,
  Columna,
  Grupo,
  Item,
  SettingsColumna,
  TipoColumna,
  UsuarioPulse,
  ValorCelda,
  Vista,
} from "@/lib/pulse/types";
import { validarValor } from "@/lib/pulse/valores";

// Store del tablero. Todo lo que ve el usuario (tabla, kanban, tarjetas, panel) lee de
// acá; cada edición se aplica primero al store (optimista) y después al server; si
// falla, se revierte y avisa con un toast. Sin revalidatePath por celda.

export type Orden = { columnId: string | "name"; dir: "asc" | "desc" } | null;
export type Filtro = { columnId: string; valor: string }; // status/dropdown/people: id; checkbox: "1"

export interface EstadoBoard {
  board: Board;
  columns: Columna[];
  groups: Grupo[];
  items: Record<string, Item>;
  usuarios: UsuarioPulse[];
  archivos: Record<string, ArchivoPulse>;
  colapsados: Set<string>;
  seleccion: Set<string>;
  busqueda: string;
  filtroPersona: string | null;
  filtros: Filtro[];
  orden: Orden;
  agruparPor: string | null; // columnId (status/dropdown/people) o null = grupos
  itemAbierto: string | null;
  vista: Vista;
}

type Accion =
  | { type: "valor"; itemId: string; columnId: string; value: ValorCelda; updatedAt?: string }
  | { type: "nombre"; itemId: string; name: string }
  | { type: "item:agregar"; item: Item }
  | { type: "items:cargar"; items: Item[] }
  | { type: "item:quitar"; itemIds: string[] }
  | { type: "item:mover"; itemIds: string[]; groupId: string }
  | { type: "columna:agregar"; column: Columna }
  | { type: "columna:actualizar"; column: Columna }
  | { type: "columna:quitar"; columnId: string }
  | { type: "columna:orden"; ids: string[] }
  | { type: "grupo:agregar"; group: Grupo }
  | { type: "grupo:actualizar"; groupId: string; patch: Partial<Grupo> }
  | { type: "grupo:quitar"; groupId: string }
  | { type: "grupo:orden"; ids: string[] }
  | { type: "archivo:agregar"; archivo: ArchivoPulse }
  | { type: "archivo:quitar"; fileId: string }
  | { type: "colapsar"; groupId: string; colapsado?: boolean }
  | { type: "colapsar:todos"; colapsado: boolean }
  | { type: "colapsar:set"; ids: Set<string> }
  | { type: "seleccion"; itemIds: string[]; seleccionado: boolean }
  | { type: "seleccion:limpiar" }
  | { type: "busqueda"; texto: string }
  | { type: "filtroPersona"; userId: string | null }
  | { type: "filtros"; filtros: Filtro[] }
  | { type: "orden"; orden: Orden }
  | { type: "agruparPor"; columnId: string | null }
  | { type: "abrir"; itemId: string | null }
  | { type: "vista"; vista: Vista }
  | { type: "board:actualizar"; patch: Partial<Board> }
  | { type: "reemplazar"; data: BoardCompleto };

function reducer(s: EstadoBoard, a: Accion): EstadoBoard {
  switch (a.type) {
    case "valor": {
      const it = s.items[a.itemId];
      if (!it) return s;
      const values = { ...it.values };
      if (a.value === null) delete values[a.columnId];
      else values[a.columnId] = a.value;
      return { ...s, items: { ...s.items, [a.itemId]: { ...it, values, updatedAt: a.updatedAt ?? it.updatedAt } } };
    }
    case "nombre": {
      const it = s.items[a.itemId];
      return it ? { ...s, items: { ...s.items, [a.itemId]: { ...it, name: a.name } } } : s;
    }
    case "item:agregar":
      return { ...s, items: { ...s.items, [a.item.id]: a.item } };
    case "items:cargar": {
      const items = { ...s.items };
      for (const it of a.items) {
        // si el usuario ya editó algo del item parcial, conservar lo suyo
        const previo = items[it.id];
        items[it.id] = previo && !previo.parcial ? previo : { ...it, values: { ...it.values, ...(previo?.values ?? {}) } };
      }
      return { ...s, items };
    }
    case "item:quitar": {
      const items = { ...s.items };
      const seleccion = new Set(s.seleccion);
      for (const id of a.itemIds) {
        delete items[id];
        seleccion.delete(id);
      }
      return { ...s, items, seleccion, itemAbierto: a.itemIds.includes(s.itemAbierto ?? "") ? null : s.itemAbierto };
    }
    case "item:mover": {
      const items = { ...s.items };
      let max = Math.max(0, ...Object.values(items).filter((i) => i.groupId === a.groupId).map((i) => i.position));
      for (const id of a.itemIds) {
        if (!items[id]) continue;
        max += 1024;
        items[id] = { ...items[id], groupId: a.groupId, position: max };
      }
      return { ...s, items };
    }
    case "columna:agregar":
      return { ...s, columns: [...s.columns, a.column] };
    case "columna:actualizar":
      return { ...s, columns: s.columns.map((c) => (c.id === a.column.id ? a.column : c)) };
    case "columna:quitar":
      return { ...s, columns: s.columns.filter((c) => c.id !== a.columnId), filtros: s.filtros.filter((f) => f.columnId !== a.columnId), agruparPor: s.agruparPor === a.columnId ? null : s.agruparPor };
    case "columna:orden": {
      const pos = new Map(a.ids.map((id, i) => [id, i]));
      return { ...s, columns: [...s.columns].sort((x, y) => (pos.get(x.id) ?? 999) - (pos.get(y.id) ?? 999)).map((c, i) => ({ ...c, position: i })) };
    }
    case "grupo:agregar": {
      const groups = [...s.groups];
      groups.splice(a.group.position, 0, a.group);
      return { ...s, groups: groups.map((g, i) => ({ ...g, position: i })) };
    }
    case "grupo:actualizar":
      return { ...s, groups: s.groups.map((g) => (g.id === a.groupId ? { ...g, ...a.patch } : g)) };
    case "grupo:quitar":
      return { ...s, groups: s.groups.filter((g) => g.id !== a.groupId) };
    case "grupo:orden": {
      const pos = new Map(a.ids.map((id, i) => [id, i]));
      return { ...s, groups: [...s.groups].sort((x, y) => (pos.get(x.id) ?? 999) - (pos.get(y.id) ?? 999)).map((g, i) => ({ ...g, position: i })) };
    }
    case "archivo:agregar":
      return { ...s, archivos: { ...s.archivos, [a.archivo.id]: a.archivo } };
    case "archivo:quitar": {
      const archivos = { ...s.archivos };
      delete archivos[a.fileId];
      return { ...s, archivos };
    }
    case "colapsar": {
      const c = new Set(s.colapsados);
      const nuevo = a.colapsado ?? !c.has(a.groupId);
      if (nuevo) c.add(a.groupId);
      else c.delete(a.groupId);
      return { ...s, colapsados: c };
    }
    case "colapsar:todos":
      return { ...s, colapsados: a.colapsado ? new Set(s.groups.map((g) => g.id)) : new Set() };
    case "colapsar:set":
      return { ...s, colapsados: a.ids };
    case "seleccion": {
      const sel = new Set(s.seleccion);
      for (const id of a.itemIds) a.seleccionado ? sel.add(id) : sel.delete(id);
      return { ...s, seleccion: sel };
    }
    case "seleccion:limpiar":
      return s.seleccion.size ? { ...s, seleccion: new Set() } : s;
    case "busqueda":
      return { ...s, busqueda: a.texto };
    case "filtroPersona":
      return { ...s, filtroPersona: a.userId };
    case "filtros":
      return { ...s, filtros: a.filtros };
    case "orden":
      return { ...s, orden: a.orden };
    case "agruparPor":
      return { ...s, agruparPor: a.columnId };
    case "abrir":
      return { ...s, itemAbierto: a.itemId };
    case "vista":
      return { ...s, vista: a.vista };
    case "board:actualizar":
      return { ...s, board: { ...s.board, ...a.patch } };
    case "reemplazar": {
      // Datos frescos del server (otra usuaria editó): conserva estado de UI.
      const items: Record<string, Item> = {};
      for (const i of a.data.items) {
        const previo = s.items[i.id];
        items[i.id] = i.parcial && previo && !previo.parcial ? previo : i;
      }
      const archivos: Record<string, ArchivoPulse> = {};
      for (const f of a.data.archivos) archivos[f.id] = f;
      return { ...s, board: a.data.board, columns: a.data.columns, groups: a.data.groups, items, usuarios: a.data.usuarios, archivos };
    }
  }
}

function claveColapsados(slug: string) {
  return `pulse:${slug}:colapsados`;
}

function estadoInicial(data: BoardCompleto, vista: Vista, itemAbierto: string | null): EstadoBoard {
  const items: Record<string, Item> = {};
  for (const i of data.items) items[i.id] = i;
  const archivos: Record<string, ArchivoPulse> = {};
  for (const f of data.archivos) archivos[f.id] = f;
  // Sin localStorage acá (hidratación): lo recordado se aplica en un efecto al montar.
  const porGrupo = new Map<string, number>();
  for (const i of data.items) porGrupo.set(i.groupId, (porGrupo.get(i.groupId) ?? 0) + 1);
  const colapsados = new Set(data.groups.filter((g) => g.colapsadoDefault || (porGrupo.get(g.id) ?? 0) > 200).map((g) => g.id));
  return {
    board: data.board,
    columns: data.columns,
    groups: data.groups,
    items,
    usuarios: data.usuarios,
    archivos,
    colapsados,
    seleccion: new Set(),
    busqueda: "",
    filtroPersona: null,
    filtros: [],
    orden: null,
    agruparPor: null,
    itemAbierto,
    vista,
  };
}

interface Acciones {
  dispatch: (a: Accion) => void;
  setValor: (itemId: string, column: Columna, value: unknown) => Promise<boolean>;
  renombrar: (itemId: string, name: string) => Promise<void>;
  crearItem: (groupId: string, name: string, alInicio?: boolean, values?: Record<string, ValorCelda>) => Promise<Item | null>;
  moverItems: (itemIds: string[], groupId: string) => Promise<void>;
  eliminarItems: (itemIds: string[]) => Promise<void>;
  crearColumna: (title: string, type: TipoColumna, settings?: SettingsColumna) => Promise<Columna | null>;
  actualizarColumna: (columnId: string, patch: { title?: string; settings?: SettingsColumna; width?: number }) => Promise<void>;
  eliminarColumna: (columnId: string) => Promise<void>;
  reordenarColumnas: (ids: string[]) => Promise<void>;
  crearGrupo: (title: string, color: ColorPulse, despuesDe?: string) => Promise<void>;
  actualizarGrupo: (groupId: string, patch: { title?: string; color?: ColorPulse; colapsadoDefault?: boolean }) => Promise<void>;
  eliminarGrupo: (groupId: string) => Promise<void>;
  reordenarGrupos: (ids: string[]) => Promise<void>;
  abrirItem: (itemId: string | null) => void;
  setVista: (vista: Vista) => void;
}

const EstadoCtx = createContext<EstadoBoard | null>(null);
const AccionesCtx = createContext<Acciones | null>(null);

export function useBoard(): EstadoBoard {
  const s = useContext(EstadoCtx);
  if (!s) throw new Error("useBoard fuera de BoardProvider");
  return s;
}
export function useBoardActions(): Acciones {
  const a = useContext(AccionesCtx);
  if (!a) throw new Error("useBoardActions fuera de BoardProvider");
  return a;
}

export function BoardProvider({
  data,
  vistaInicial,
  itemInicial,
  children,
}: {
  data: BoardCompleto;
  vistaInicial: Vista;
  itemInicial: string | null;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, undefined, () => estadoInicial(data, vistaInicial, itemInicial));
  const router = useRouter();
  const stateRef = useRef(state);
  stateRef.current = state;

  // Datos nuevos del server (router.refresh) → reemplazar sin perder la UI.
  const primeraCarga = useRef(true);
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    dispatch({ type: "reemplazar", data });
  }, [data]);

  // Colapsados recordados por el usuario: leer al montar, persistir después.
  const hidratado = useRef(false);
  useEffect(() => {
    if (!hidratado.current) {
      hidratado.current = true;
      try {
        const raw = localStorage.getItem(claveColapsados(state.board.slug));
        if (raw) {
          const validos = new Set(state.groups.map((g) => g.id));
          const ids = new Set((JSON.parse(raw) as string[]).filter((id) => validos.has(id)));
          if (ids.size) {
            dispatch({ type: "colapsar:set", ids });
            return;
          }
        }
      } catch {}
    }
    try {
      localStorage.setItem(claveColapsados(state.board.slug), JSON.stringify([...state.colapsados]));
    } catch {}
  }, [state.colapsados, state.board.slug, state.groups]);

  // Grupos parciales (sin values): cargarlos cuando se expanden o cuando hace falta verlos
  // todos (búsqueda, filtros, orden, agrupar por columna, kanban/tarjetas).
  const cargando = useRef(new Set<string>());
  useEffect(() => {
    const necesitaTodo = !!state.busqueda.trim() || state.filtros.length > 0 || !!state.filtroPersona || !!state.orden || !!state.agruparPor || state.vista !== "tabla";
    const pendientes = new Set<string>();
    for (const it of Object.values(state.items)) {
      if (it.parcial && (necesitaTodo || !state.colapsados.has(it.groupId))) pendientes.add(it.groupId);
    }
    for (const groupId of pendientes) {
      if (cargando.current.has(groupId)) continue;
      cargando.current.add(groupId);
      leerItemsGrupoAction({ groupId }).then((r) => {
        cargando.current.delete(groupId);
        if (r.ok) dispatch({ type: "items:cargar", items: r.items });
      });
    }
  }, [state.items, state.colapsados, state.busqueda, state.filtros, state.filtroPersona, state.orden, state.agruparPor, state.vista]);

  // Al volver el foco a la pestaña, traer lo que haya cambiado la otra usuaria.
  useEffect(() => {
    let ultimo = Date.now();
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - ultimo > 30_000) {
        ultimo = Date.now();
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  const fallo = (msg: string) => toast.error(msg, { className: "pulse" });

  const setValor = useCallback<Acciones["setValor"]>(async (itemId, column, valorCrudo) => {
    const anterior = stateRef.current.items[itemId]?.values[column.id] ?? null;
    let value: ValorCelda;
    try {
      value = validarValor(column.type, valorCrudo, column.settings);
    } catch (e) {
      fallo(e instanceof Error ? e.message : "Valor inválido");
      return false;
    }
    if (JSON.stringify(value) === JSON.stringify(anterior)) return true;
    dispatch({ type: "valor", itemId, columnId: column.id, value });
    const r = await actualizarValorAction({ itemId, columnId: column.id, tipo: column.type, settings: column.settings, value });
    if (!r.ok) {
      dispatch({ type: "valor", itemId, columnId: column.id, value: anterior });
      fallo(r.error);
      return false;
    }
    dispatch({ type: "valor", itemId, columnId: column.id, value: r.value, updatedAt: r.updatedAt });
    return true;
  }, []);

  const renombrar = useCallback<Acciones["renombrar"]>(async (itemId, name) => {
    const anterior = stateRef.current.items[itemId]?.name ?? "";
    const limpio = name.trim();
    if (!limpio || limpio === anterior) return;
    dispatch({ type: "nombre", itemId, name: limpio });
    const r = await renombrarItemAction({ itemId, name: limpio });
    if (!r.ok) {
      dispatch({ type: "nombre", itemId, name: anterior });
      fallo(r.error);
    }
  }, []);

  const crearItem = useCallback<Acciones["crearItem"]>(async (groupId, name, alInicio, values) => {
    const r = await crearItemAction({ boardId: stateRef.current.board.id, groupId, name, alInicio, values });
    if (!r.ok) {
      fallo(r.error);
      return null;
    }
    dispatch({ type: "item:agregar", item: r.item });
    return r.item;
  }, []);

  const moverItems = useCallback<Acciones["moverItems"]>(async (itemIds, groupId) => {
    const previos = itemIds.map((id) => stateRef.current.items[id]).filter(Boolean);
    dispatch({ type: "item:mover", itemIds, groupId });
    dispatch({ type: "seleccion:limpiar" });
    const r = await moverItemsAction({ itemIds, groupId });
    if (!r.ok) {
      for (const it of previos) dispatch({ type: "item:mover", itemIds: [it.id], groupId: it.groupId });
      fallo(r.error);
    }
  }, []);

  const eliminarItems = useCallback<Acciones["eliminarItems"]>(async (itemIds) => {
    const previos = itemIds.map((id) => stateRef.current.items[id]).filter(Boolean);
    dispatch({ type: "item:quitar", itemIds });
    const r = await eliminarItemsAction({ itemIds });
    if (!r.ok) {
      for (const it of previos) dispatch({ type: "item:agregar", item: it });
      fallo(r.error);
    } else toast.success(`${r.n} elemento${r.n === 1 ? "" : "s"} eliminado${r.n === 1 ? "" : "s"}`, { className: "pulse" });
  }, []);

  const crearColumna = useCallback<Acciones["crearColumna"]>(async (title, type, settings) => {
    const r = await crearColumnaAction({ boardId: stateRef.current.board.id, title, type, settings });
    if (!r.ok) {
      fallo(r.error);
      return null;
    }
    dispatch({ type: "columna:agregar", column: r.column });
    return r.column;
  }, []);

  const actualizarColumna = useCallback<Acciones["actualizarColumna"]>(async (columnId, patch) => {
    const anterior = stateRef.current.columns.find((c) => c.id === columnId);
    if (!anterior) return;
    dispatch({ type: "columna:actualizar", column: { ...anterior, ...patch } });
    const r = await actualizarColumnaAction({ columnId, patch });
    if (!r.ok) {
      dispatch({ type: "columna:actualizar", column: anterior });
      fallo(r.error);
    } else dispatch({ type: "columna:actualizar", column: r.column });
  }, []);

  const eliminarColumna = useCallback<Acciones["eliminarColumna"]>(async (columnId) => {
    const anterior = stateRef.current.columns.find((c) => c.id === columnId);
    dispatch({ type: "columna:quitar", columnId });
    const r = await eliminarColumnaAction({ columnId });
    if (!r.ok) {
      if (anterior) dispatch({ type: "columna:agregar", column: anterior });
      fallo(r.error);
    }
  }, []);

  const reordenarColumnas = useCallback<Acciones["reordenarColumnas"]>(async (ids) => {
    const previo = stateRef.current.columns.map((c) => c.id);
    dispatch({ type: "columna:orden", ids });
    const r = await reordenarColumnasAction({ boardId: stateRef.current.board.id, ids });
    if (!r.ok) {
      dispatch({ type: "columna:orden", ids: previo });
      fallo(r.error);
    }
  }, []);

  const crearGrupo = useCallback<Acciones["crearGrupo"]>(async (title, color, despuesDe) => {
    const r = await crearGrupoAction({ boardId: stateRef.current.board.id, title, color, despuesDe });
    if (!r.ok) {
      fallo(r.error);
      return;
    }
    dispatch({ type: "grupo:agregar", group: r.group });
  }, []);

  const actualizarGrupo = useCallback<Acciones["actualizarGrupo"]>(async (groupId, patch) => {
    const anterior = stateRef.current.groups.find((g) => g.id === groupId);
    dispatch({ type: "grupo:actualizar", groupId, patch });
    const r = await actualizarGrupoAction({ groupId, patch });
    if (!r.ok) {
      if (anterior) dispatch({ type: "grupo:actualizar", groupId, patch: anterior });
      fallo(r.error);
    }
  }, []);

  const eliminarGrupo = useCallback<Acciones["eliminarGrupo"]>(async (groupId) => {
    const r = await eliminarGrupoAction({ groupId });
    if (!r.ok) {
      fallo(r.error);
      return;
    }
    dispatch({ type: "grupo:quitar", groupId });
  }, []);

  const reordenarGrupos = useCallback<Acciones["reordenarGrupos"]>(async (ids) => {
    const previo = stateRef.current.groups.map((g) => g.id);
    dispatch({ type: "grupo:orden", ids });
    const r = await reordenarGruposAction({ boardId: stateRef.current.board.id, ids });
    if (!r.ok) {
      dispatch({ type: "grupo:orden", ids: previo });
      fallo(r.error);
    }
  }, []);

  // ?item= y ?vista= en la URL sin round-trip RSC (pushState; Next lo sincroniza).
  const abrirItem = useCallback<Acciones["abrirItem"]>((itemId) => {
    dispatch({ type: "abrir", itemId });
    const url = new URL(window.location.href);
    if (itemId) url.searchParams.set("item", itemId);
    else url.searchParams.delete("item");
    window.history.replaceState(null, "", url);
  }, []);

  const setVista = useCallback<Acciones["setVista"]>((vista) => {
    dispatch({ type: "vista", vista });
    const url = new URL(window.location.href);
    if (vista === "tabla") url.searchParams.delete("vista");
    else url.searchParams.set("vista", vista);
    window.history.replaceState(null, "", url);
  }, []);

  const acciones = useMemo<Acciones>(
    () => ({
      dispatch,
      setValor,
      renombrar,
      crearItem,
      moverItems,
      eliminarItems,
      crearColumna,
      actualizarColumna,
      eliminarColumna,
      reordenarColumnas,
      crearGrupo,
      actualizarGrupo,
      eliminarGrupo,
      reordenarGrupos,
      abrirItem,
      setVista,
    }),
    [setValor, renombrar, crearItem, moverItems, eliminarItems, crearColumna, actualizarColumna, eliminarColumna, reordenarColumnas, crearGrupo, actualizarGrupo, eliminarGrupo, reordenarGrupos, abrirItem, setVista],
  );

  return (
    <AccionesCtx.Provider value={acciones}>
      <EstadoCtx.Provider value={state}>{children}</EstadoCtx.Provider>
    </AccionesCtx.Provider>
  );
}

// ---------- selectores (filtro / orden / agrupación) ----------

export interface GrupoVisible {
  id: string; // groupId real o `col:<labelId>` / `col:__sin` cuando se agrupa por columna
  titulo: string;
  color: ColorPulse;
  grupoReal: Grupo | null;
  items: Item[];
}

export function textoItem(item: Item, columns: Columna[], usuarios: UsuarioPulse[]): string {
  const partes = [item.name];
  for (const c of columns) {
    const v = item.values[c.id];
    if (v === undefined || v === null) continue;
    if (c.type === "status") partes.push(c.settings.labels?.find((l) => l.id === v)?.label ?? "");
    else if (c.type === "dropdown") partes.push(...(v as string[]).map((id) => c.settings.labels?.find((l) => l.id === id)?.label ?? ""));
    else if (c.type === "people") partes.push(...(v as string[]).map((id) => usuarios.find((u) => u.id === id)?.nombre ?? ""));
    else if (c.type === "link") partes.push((v as { url: string; text?: string }).text ?? (v as { url: string }).url);
    else if (typeof v === "string" || typeof v === "number") partes.push(String(v));
  }
  return partes.join(" ").toLowerCase();
}

export function useGruposVisibles(): GrupoVisible[] {
  const s = useBoard();
  return useMemo(() => {
    const q = s.busqueda.trim().toLowerCase();
    let items = Object.values(s.items);
    if (q) items = items.filter((i) => textoItem(i, s.columns, s.usuarios).includes(q));
    if (s.filtroPersona) {
      const cols = s.columns.filter((c) => c.type === "people").map((c) => c.id);
      items = items.filter((i) => cols.some((cid) => ((i.values[cid] as string[] | undefined) ?? []).includes(s.filtroPersona!)));
    }
    for (const f of s.filtros) {
      const col = s.columns.find((c) => c.id === f.columnId);
      if (!col) continue;
      items = items.filter((i) => {
        const v = i.values[col.id];
        if (f.valor === "__vacio") return v === undefined || v === null || (Array.isArray(v) && v.length === 0);
        if (col.type === "checkbox") return f.valor === "1" ? v === true : v !== true;
        if (Array.isArray(v)) return v.includes(f.valor);
        return v === f.valor;
      });
    }
    const cmp = comparador(s);
    const ordenar = (arr: Item[]) => (cmp ? [...arr].sort(cmp) : [...arr].sort((a, b) => a.position - b.position));

    if (s.agruparPor) {
      const col = s.columns.find((c) => c.id === s.agruparPor);
      if (col && (col.type === "status" || col.type === "dropdown")) {
        const grupos: GrupoVisible[] = (col.settings.labels ?? []).map((l) => ({ id: `col:${l.id}`, titulo: l.label, color: l.color, grupoReal: null, items: [] }));
        const sin: GrupoVisible = { id: "col:__sin", titulo: "Sin valor", color: "grey", grupoReal: null, items: [] };
        for (const it of items) {
          const v = it.values[col.id];
          const ids = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
          const destinos = grupos.filter((g) => ids.includes(g.id.slice(4)));
          if (destinos.length) destinos.forEach((g) => g.items.push(it));
          else sin.items.push(it);
        }
        return [...grupos, sin].map((g) => ({ ...g, items: ordenar(g.items) }));
      }
      if (col && col.type === "people") {
        const grupos: GrupoVisible[] = s.usuarios.map((u) => ({ id: `col:${u.id}`, titulo: u.nombre, color: u.color ?? "blue", grupoReal: null, items: [] }));
        const sin: GrupoVisible = { id: "col:__sin", titulo: "Sin asignar", color: "grey", grupoReal: null, items: [] };
        for (const it of items) {
          const ids = (it.values[col.id] as string[] | undefined) ?? [];
          const destinos = grupos.filter((g) => ids.includes(g.id.slice(4)));
          if (destinos.length) destinos.forEach((g) => g.items.push(it));
          else sin.items.push(it);
        }
        return [...grupos, sin].filter((g) => g.items.length || g.id !== "col:__sin").map((g) => ({ ...g, items: ordenar(g.items) }));
      }
    }
    const porGrupo = new Map<string, Item[]>();
    for (const it of items) {
      const arr = porGrupo.get(it.groupId) ?? [];
      arr.push(it);
      porGrupo.set(it.groupId, arr);
    }
    return s.groups.map((g) => ({ id: g.id, titulo: g.title, color: g.color, grupoReal: g, items: ordenar(porGrupo.get(g.id) ?? []) }));
  }, [s]);
}

function comparador(s: EstadoBoard): ((a: Item, b: Item) => number) | null {
  if (!s.orden) return null;
  const { columnId, dir } = s.orden;
  const mult = dir === "asc" ? 1 : -1;
  const col = s.columns.find((c) => c.id === columnId);
  const clave = (i: Item): string | number => {
    if (columnId === "name") return i.name.toLowerCase();
    if (!col) return "";
    const v = i.values[col.id];
    if (v === undefined || v === null) return dir === "asc" ? "￿" : "";
    if (col.type === "number") return v as number;
    if (col.type === "status") {
      const idx = (col.settings.labels ?? []).findIndex((l) => l.id === v);
      return idx < 0 ? 999 : idx;
    }
    if (col.type === "people") return s.usuarios.find((u) => u.id === (v as string[])[0])?.nombre.toLowerCase() ?? "";
    if (col.type === "dropdown") return (col.settings.labels ?? []).find((l) => l.id === (v as string[])[0])?.label.toLowerCase() ?? "";
    if (col.type === "checkbox") return v ? 1 : 0;
    if (col.type === "link") return ((v as { url: string; text?: string }).text ?? (v as { url: string }).url).toLowerCase();
    return String(v).toLowerCase();
  };
  return (a, b) => {
    const ka = clave(a);
    const kb = clave(b);
    if (ka < kb) return -1 * mult;
    if (ka > kb) return 1 * mult;
    return a.position - b.position;
  };
}
