"use client";

import { Clock, MessageSquare, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { comentarAction, leerActividadAction } from "@/app/pulse/(app)/[board]/actions";
import { useBoard, useBoardActions } from "@/components/pulse/board-provider";
import { Cell, fmtFechaCorta } from "@/components/pulse/cell";
import { StatusPill } from "@/components/pulse/status-pill";
import { TipoColumnaIcon } from "@/components/pulse/tipo-columna-icon";
import { UserAvatar } from "@/components/pulse/user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cssColor } from "@/lib/pulse/colores";
import type { Actividad, Columna, ValorCelda } from "@/lib/pulse/types";
import { formatearNumero } from "@/lib/pulse/valores";

// Panel lateral del elemento (?item=): todos los campos + timeline de actividad y comentarios.
export function ItemPanel({ relacionados }: { relacionados: Record<string, { id: string; name: string }[]> }) {
  const s = useBoard();
  const { abrirItem, renombrar, eliminarItems, dispatch } = useBoardActions();
  const item = s.itemAbierto ? s.items[s.itemAbierto] : null;
  const grupo = item ? s.groups.find((g) => g.id === item.groupId) : null;
  const [nombre, setNombre] = useState(item?.name ?? "");
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => setNombre(item?.name ?? ""), [item?.name]);

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && abrirItem(null)}>
      <SheetContent side="right" className="pulse flex w-full flex-col gap-0 p-0 sm:max-w-[640px]" showCloseButton onOpenAutoFocus={(e) => e.preventDefault()}>
        {item ? (
          <>
            <SheetHeader className="border-b px-5 pt-4 pb-3 pr-12">
              <SheetTitle asChild>
                <input
                  className="w-full rounded px-1 text-lg font-semibold outline-none hover:bg-muted focus:bg-background focus:ring-2 focus:ring-primary"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onBlur={() => renombrar(item.id, nombre)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                />
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-2 text-xs">
                  {grupo ? (
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full" style={{ background: cssColor(grupo.color) }} /> {grupo.title}
                    </span>
                  ) : null}
                  <span>· actualizado {fmtFechaHora(item.updatedAt)}</span>
                  <button type="button" className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-destructive" onClick={() => setConfirmar(true)}>
                    <Trash2 className="size-3.5" /> Eliminar
                  </button>
                </div>
              </SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="campos" className="flex min-h-0 flex-1 flex-col gap-0">
              <TabsList className="mx-5 mt-3 w-fit">
                <TabsTrigger value="campos">Campos</TabsTrigger>
                <TabsTrigger value="actividad">
                  <Clock className="size-3.5" /> Actividad
                </TabsTrigger>
              </TabsList>
              <TabsContent value="campos" className="min-h-0 flex-1 overflow-auto px-5 py-3">
                <div className="flex flex-col divide-y">
                  {s.columns.map((c) => (
                    <div key={c.id} className="flex min-h-10 items-center gap-3 py-1.5">
                      <div className="flex w-44 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <TipoColumnaIcon tipo={c.type} className="size-3.5 opacity-70" />
                        <span className="truncate" title={c.title}>
                          {c.title}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <Cell item={item} column={c} usuarios={s.usuarios} archivos={s.archivos} relacionados={c.type === "relation" ? (relacionados[c.settings.boardId ?? ""] ?? []) : undefined} vertical />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="actividad" className="min-h-0 flex-1 overflow-hidden">
                <Actividades itemId={item.id} boardId={item.boardId} columns={s.columns} />
              </TabsContent>
            </Tabs>
            <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
              <AlertDialogContent className="pulse">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar "{item.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>Se borra con su actividad y archivos. No se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      dispatch({ type: "abrir", itemId: null });
                      eliminarItems([item.id]);
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function fmtFechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-PR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Actividades({ itemId, boardId, columns }: { itemId: string; boardId: string; columns: Columna[] }) {
  const s = useBoard();
  const [lista, setLista] = useState<Actividad[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    setLista(null);
    leerActividadAction({ itemId }).then((r) => vivo && setLista(r.ok ? r.actividad : []));
    return () => {
      vivo = false;
    };
  }, [itemId]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setEnviando(true);
    const r = await comentarAction({ itemId, boardId, texto: t });
    setEnviando(false);
    if (r.ok) {
      setTexto("");
      setLista((l) => [r.actividad, ...(l ?? [])]);
    }
  };

  const describir = (a: Actividad): React.ReactNode => {
    const col = columns.find((c) => c.id === a.columnId);
    const val = (v: unknown) => renderValor(col, v as ValorCelda, s.usuarios, s.groups);
    switch (a.tipo) {
      case "crear":
        return "creó el elemento";
      case "nombre":
        return (
          <>
            renombró <b>{String(a.before)}</b> → <b>{String(a.after)}</b>
          </>
        );
      case "mover":
        return (
          <>
            movió de <b>{s.groups.find((g) => g.id === a.before)?.title ?? "otro grupo"}</b> a <b>{s.groups.find((g) => g.id === a.after)?.title ?? "otro grupo"}</b>
          </>
        );
      case "valor":
        return (
          <span className="flex flex-wrap items-center gap-1">
            cambió <b>{col?.title ?? "una columna"}</b>: {val(a.before)} <span className="text-muted-foreground">→</span> {val(a.after)}
          </span>
        );
      case "comentario":
        return <span className="whitespace-pre-wrap">{String((a.after as { texto?: string })?.texto ?? "")}</span>;
      default:
        return a.tipo;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 border-b px-5 py-3">
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí un comentario… (Cmd/Ctrl+Enter para enviar)" rows={2} className="min-h-0 text-sm" onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && enviar()} />
        <button type="button" disabled={enviando || !texto.trim()} onClick={enviar} className="flex h-9 items-center gap-1 self-end rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50">
          <Send className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-3">
        {lista === null ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        {lista?.length === 0 ? <p className="text-sm text-muted-foreground">Sin actividad todavía.</p> : null}
        <ol className="flex flex-col gap-3">
          {lista?.map((a) => (
            <li key={a.id} className="flex gap-2 text-sm">
              {a.usuario ? <UserAvatar nombre={a.usuario.nombre} color={a.usuario.color} className="mt-0.5" /> : <span className="mt-0.5 size-6 rounded-full bg-muted" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{a.usuario?.nombre ?? "Sistema"}</span>
                  <span>{fmtFechaHora(a.at)}</span>
                  {a.tipo === "comentario" ? <MessageSquare className="size-3" /> : null}
                </div>
                <div className={a.tipo === "comentario" ? "mt-1 rounded-md bg-muted px-3 py-2" : "mt-0.5"}>{describir(a)}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function renderValor(col: Columna | undefined, v: ValorCelda, usuarios: { id: string; nombre: string }[], _groups: unknown): React.ReactNode {
  if (v === null || v === undefined || (Array.isArray(v) && v.length === 0)) return <span className="text-muted-foreground">vacío</span>;
  if (!col) return String(v);
  switch (col.type) {
    case "status": {
      const l = col.settings.labels?.find((x) => x.id === v);
      return l ? <StatusPill label={l.label} color={l.color} className="h-5 text-[11px]" /> : String(v);
    }
    case "dropdown":
      return (v as string[]).map((id) => col.settings.labels?.find((x) => x.id === id)?.label ?? id).join(", ");
    case "people":
      return (v as string[]).map((id) => usuarios.find((u) => u.id === id)?.nombre ?? "alguien").join(", ");
    case "number":
      return formatearNumero(v as number, col.settings.formato);
    case "date":
      return fmtFechaCorta(v as string);
    case "checkbox":
      return v ? "marcado" : "sin marcar";
    case "link":
      return (v as { url: string }).url;
    case "file":
      return `${(v as string[]).length} archivo(s)`;
    case "relation":
      return `${(v as string[]).length} elemento(s)`;
    default:
      return <span className="max-w-[300px] truncate">{String(v)}</span>;
  }
}
