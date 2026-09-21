"use client";

import { Check, ExternalLink, FileText, Paperclip, Plus, Trash2, X } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

import { subirArchivoAction, urlArchivoAction } from "@/app/pulse/(app)/[board]/actions";
import { useBoardActions } from "@/components/pulse/board-provider";
import { StatusPill } from "@/components/pulse/status-pill";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cssColor } from "@/lib/pulse/colores";
import type { ArchivoPulse, Columna, Item, UsuarioPulse, ValorLink } from "@/lib/pulse/types";
import { formatearNumero } from "@/lib/pulse/valores";
import { cn } from "@/lib/utils";

export interface CellProps {
  item: Item;
  column: Columna;
  usuarios: UsuarioPulse[];
  archivos: Record<string, ArchivoPulse>;
  relacionados?: { id: string; name: string }[];
  // `vertical`: dentro del panel del item (label a la izquierda, sin borde de grilla)
  vertical?: boolean;
}

// Una celda de la grilla. Elige el editor por tipo; el guardado va por
// useBoardActions().setValor (optimista + rollback).
export const Cell = memo(function Cell(p: CellProps) {
  switch (p.column.type) {
    case "text":
    case "email":
    case "phone":
      return <CellTexto {...p} />;
    case "long_text":
      return <CellTextoLargo {...p} />;
    case "number":
      return <CellNumero {...p} />;
    case "status":
      return <CellStatus {...p} />;
    case "dropdown":
      return <CellDropdown {...p} />;
    case "date":
      return <CellFecha {...p} />;
    case "people":
      return <CellPersonas {...p} />;
    case "checkbox":
      return <CellCheckbox {...p} />;
    case "link":
      return <CellLink {...p} />;
    case "file":
      return <CellArchivo {...p} />;
    case "relation":
      return <CellRelacion {...p} />;
  }
});

const inputCls = "h-7 w-full min-w-0 rounded-sm border-0 bg-transparent px-1 text-[13px] outline-none focus:bg-background focus:ring-2 focus:ring-primary";

// ---------- texto / email / teléfono ----------

function CellTexto({ item, column, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = (item.values[column.id] as string | undefined) ?? "";
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(valor);
  useEffect(() => {
    if (!editando) setBorrador(valor);
  }, [valor, editando]);

  const guardar = async () => {
    setEditando(false);
    if (borrador !== valor) await setValor(item.id, column, borrador);
  };
  const href = !valor ? null : column.type === "email" ? `mailto:${valor}` : column.type === "phone" ? `tel:${valor.replace(/[^\d+]/g, "")}` : null;

  if (editando) {
    return (
      <input
        autoFocus
        className={inputCls}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") {
            setBorrador(valor);
            setEditando(false);
          }
        }}
      />
    );
  }
  return (
    <div className={cn("group/celda flex h-7 w-full min-w-0 items-center gap-1", vertical ? "" : "justify-center")} onDoubleClick={() => setEditando(true)} onClick={() => !href && setEditando(true)}>
      {href && valor ? (
        <a href={href} className="truncate text-primary hover:underline" title={valor} onClick={(e) => e.stopPropagation()}>
          {valor}
        </a>
      ) : (
        <span className={cn("truncate", !valor && "text-muted-foreground/50")} title={valor}>
          {valor || (vertical ? "—" : "")}
        </span>
      )}
      {href ? (
        <button type="button" className="hidden shrink-0 text-muted-foreground group-hover/celda:inline" onClick={() => setEditando(true)} title="Editar">
          ✎
        </button>
      ) : null}
    </div>
  );
}

// ---------- texto largo ----------

function CellTextoLargo({ item, column, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = (item.values[column.id] as string | undefined) ?? "";
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState(valor);
  useEffect(() => {
    if (!abierto) setBorrador(valor);
  }, [valor, abierto]);
  const guardar = async () => {
    setAbierto(false);
    if (borrador !== valor) await setValor(item.id, column, borrador);
  };
  return (
    <Popover
      open={abierto}
      onOpenChange={(o) => {
        if (!o) guardar();
        else setAbierto(true);
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className={cn("h-7 w-full min-w-0 text-left text-[13px]", vertical ? "" : "")} title={valor}>
          <span className={cn("block truncate", !valor && "text-muted-foreground/50")}>{valor || (vertical ? "—" : "")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-[420px] p-2" align="start">
        <Textarea autoFocus value={borrador} onChange={(e) => setBorrador(e.target.value)} rows={8} className="text-sm" placeholder="Escribí acá…" />
        <div className="mt-2 flex justify-end gap-2 text-xs text-muted-foreground">
          <span className="mr-auto self-center">Se guarda al cerrar</span>
          <button type="button" className="rounded-md bg-primary px-3 py-1 text-primary-foreground" onClick={guardar}>
            Guardar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- número ----------

function CellNumero({ item, column, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = item.values[column.id] as number | undefined;
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(valor === undefined ? "" : String(valor));
  useEffect(() => {
    if (!editando) setBorrador(valor === undefined ? "" : String(valor));
  }, [valor, editando]);
  const guardar = async () => {
    setEditando(false);
    await setValor(item.id, column, borrador === "" ? null : borrador);
  };
  if (editando) {
    return (
      <input
        autoFocus
        inputMode="decimal"
        className={cn(inputCls, "text-right")}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === "Enter") guardar();
          if (e.key === "Escape") setEditando(false);
        }}
      />
    );
  }
  return (
    <div className={cn("h-7 w-full min-w-0 leading-7", vertical ? "text-left" : "text-center")} onClick={() => setEditando(true)}>
      <span className={cn("truncate tabular-nums", valor === undefined && "text-muted-foreground/50")}>
        {valor === undefined ? (vertical ? "—" : "") : formatearNumero(valor, column.settings.formato)}
      </span>
    </div>
  );
}

// ---------- estado ----------

function CellStatus({ item, column, vertical }: CellProps) {
  const { setValor, actualizarColumna } = useBoardActions();
  const valor = item.values[column.id] as string | undefined;
  const labels = column.settings.labels ?? [];
  const actual = labels.find((l) => l.id === valor);
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState("");

  const agregar = async () => {
    const label = nueva.trim();
    if (!label) return;
    const id = Math.random().toString(36).slice(2, 10);
    const colores = ["blue", "green", "purple", "orange", "pink", "aqua", "indigo", "red", "yellow", "brown"] as const;
    await actualizarColumna(column.id, { settings: { ...column.settings, labels: [...labels, { id, label, color: colores[labels.length % colores.length] }] } });
    setNueva("");
    await setValor(item.id, { ...column, settings: { ...column.settings, labels: [...labels, { id, label, color: "blue" }] } }, id);
    setAbierto(false);
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("flex h-full w-full min-w-0 items-center", vertical ? "justify-start" : "justify-stretch")}>
          {actual ? (
            <StatusPill label={actual.label} color={actual.color} className={vertical ? "min-w-40" : "w-full"} />
          ) : (
            <span className={cn("flex h-7 items-center justify-center rounded text-xs text-muted-foreground/60", vertical ? "min-w-40 bg-muted" : "w-full bg-muted/60")}>&nbsp;</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-64 p-2" align="start">
        <div className="grid grid-cols-2 gap-1.5">
          {labels.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={async () => {
                setAbierto(false);
                await setValor(item.id, column, l.id);
              }}
              className={cn("rounded ring-offset-background transition hover:scale-[1.02]", l.id === valor && "ring-2 ring-foreground ring-offset-2")}
            >
              <StatusPill label={l.label} color={l.color} className="w-full" />
            </button>
          ))}
          <button
            type="button"
            onClick={async () => {
              setAbierto(false);
              await setValor(item.id, column, null);
            }}
            className="flex h-7 items-center justify-center rounded border border-dashed text-xs text-muted-foreground hover:bg-muted"
          >
            <X className="mr-1 size-3" /> Sin estado
          </button>
        </div>
        <div className="mt-2 flex gap-1 border-t pt-2">
          <input
            className="h-7 min-w-0 flex-1 rounded border px-2 text-xs"
            placeholder="Nueva etiqueta…"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && agregar()}
          />
          <button type="button" onClick={agregar} className="rounded bg-muted px-2 text-xs hover:bg-accent" title="Agregar etiqueta">
            <Plus className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- lista (varias etiquetas) ----------

function CellDropdown({ item, column, vertical }: CellProps) {
  const { setValor, actualizarColumna } = useBoardActions();
  const valor = (item.values[column.id] as string[] | undefined) ?? [];
  const labels = column.settings.labels ?? [];
  const [nueva, setNueva] = useState("");
  const toggle = async (id: string) => {
    const nuevo = valor.includes(id) ? valor.filter((v) => v !== id) : [...valor, id];
    await setValor(item.id, column, nuevo);
  };
  const agregar = async () => {
    const label = nueva.trim();
    if (!label) return;
    const id = Math.random().toString(36).slice(2, 10);
    const colores = ["blue", "green", "purple", "orange", "pink", "aqua", "indigo", "red"] as const;
    const nuevos = [...labels, { id, label, color: colores[labels.length % colores.length] }];
    await actualizarColumna(column.id, { settings: { ...column.settings, labels: nuevos } });
    setNueva("");
    await setValor(item.id, { ...column, settings: { ...column.settings, labels: nuevos } }, [...valor, id]);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn("flex h-7 w-full min-w-0 items-center gap-1 overflow-hidden", vertical ? "" : "")}>
          {valor.length ? (
            valor.map((id) => {
              const l = labels.find((x) => x.id === id);
              return l ? <StatusPill key={id} label={l.label} color={l.color} llena={false} className="h-6 shrink-0 text-[11px]" /> : null;
            })
          ) : (
            <span className="text-xs text-muted-foreground/50">{vertical ? "—" : ""}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-60 p-2" align="start">
        <div className="flex flex-col gap-1">
          {labels.map((l) => (
            <button key={l.id} type="button" onClick={() => toggle(l.id)} className="flex items-center gap-2 rounded px-1 py-0.5 text-left text-sm hover:bg-muted">
              <span className={cn("flex size-4 items-center justify-center rounded border", valor.includes(l.id) && "bg-primary text-primary-foreground")}>{valor.includes(l.id) ? <Check className="size-3" /> : null}</span>
              <span className="size-2.5 rounded-full" style={{ background: cssColor(l.color) }} />
              {l.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-1 border-t pt-2">
          <input className="h-7 min-w-0 flex-1 rounded border px-2 text-xs" placeholder="Nueva etiqueta…" value={nueva} onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregar()} />
          <button type="button" onClick={agregar} className="rounded bg-muted px-2 text-xs hover:bg-accent">
            <Plus className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- fecha ----------

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fmtFechaCorta(iso: string | undefined | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const hoy = new Date();
  return `${MESES[m - 1]}. ${d}${y !== hoy.getFullYear() ? `, ${y}` : ""}`;
}

function CellFecha({ item, column, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = (item.values[column.id] as string | undefined) ?? "";
  const ref = useRef<HTMLInputElement>(null);
  const abrir = () => {
    try {
      ref.current?.showPicker?.();
    } catch {
      ref.current?.focus();
    }
  };
  return (
    <div className={cn("group/fecha relative flex h-7 w-full min-w-0 items-center gap-1", vertical ? "justify-start" : "justify-center")} onClick={abrir}>
      <span className={cn("truncate text-[13px]", !valor && "text-muted-foreground/50")}>{valor ? fmtFechaCorta(valor) : vertical ? "—" : ""}</span>
      {valor ? (
        <button
          type="button"
          title="Quitar fecha"
          className="relative z-10 hidden shrink-0 rounded text-muted-foreground hover:text-destructive group-hover/fecha:inline"
          onClick={(e) => {
            e.stopPropagation();
            setValor(item.id, column, null);
          }}
        >
          <X className="size-3" />
        </button>
      ) : null}
      <input
        ref={ref}
        type="date"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={valor}
        onChange={async (e) => {
          await setValor(item.id, column, e.target.value || null);
        }}
        tabIndex={-1}
      />
    </div>
  );
}

// ---------- personas ----------

function CellPersonas({ item, column, usuarios, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = (item.values[column.id] as string[] | undefined) ?? [];
  const [q, setQ] = useState("");
  const asignados = valor.map((id) => usuarios.find((u) => u.id === id)).filter((u): u is UsuarioPulse => !!u);
  const toggle = async (id: string) => {
    const multiple = column.settings.multiple !== false;
    const nuevo = valor.includes(id) ? valor.filter((v) => v !== id) : multiple ? [...valor, id] : [id];
    await setValor(item.id, column, nuevo);
  };
  const lista = usuarios.filter((u) => !q || u.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover onOpenChange={(o) => !o && setQ("")}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("flex h-7 w-full min-w-0 items-center", vertical ? "justify-start gap-2" : "justify-center")}>
          {asignados.length ? (
            <span className="flex -space-x-1.5">
              {asignados.slice(0, 4).map((u) => (
                <UserAvatar key={u.id} nombre={u.nombre} color={u.color} />
              ))}
              {asignados.length > 4 ? <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] ring-2 ring-background">+{asignados.length - 4}</span> : null}
            </span>
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full border border-dashed text-muted-foreground/60">
              <Plus className="size-3" />
            </span>
          )}
          {vertical && asignados.length ? <span className="truncate text-sm">{asignados.map((u) => u.nombre).join(", ")}</span> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-64 p-2" align="start">
        <input autoFocus className="mb-2 h-7 w-full rounded border px-2 text-xs" placeholder="Buscar persona…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex max-h-64 flex-col gap-0.5 overflow-auto">
          {lista.map((u) => (
            <button key={u.id} type="button" onClick={() => toggle(u.id)} className="flex items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-muted">
              <UserAvatar nombre={u.nombre} color={u.color} />
              <span className="flex-1 truncate">{u.nombre}</span>
              {valor.includes(u.id) ? <Check className="size-4 text-primary" /> : null}
            </button>
          ))}
          {lista.length === 0 ? <p className="px-1 py-2 text-xs text-muted-foreground">Nadie con ese nombre.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- casilla ----------

function CellCheckbox({ item, column, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = item.values[column.id] === true;
  return (
    <div className={cn("flex h-7 w-full items-center", vertical ? "justify-start" : "justify-center")}>
      <Checkbox checked={valor} onCheckedChange={(c) => setValor(item.id, column, c === true)} className="size-4.5 rounded-sm" />
    </div>
  );
}

// ---------- enlace ----------

function CellLink({ item, column, vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const valor = item.values[column.id] as ValorLink | undefined;
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState(valor?.url ?? "");
  const [text, setText] = useState(valor?.text ?? "");
  useEffect(() => {
    if (!abierto) {
      setUrl(valor?.url ?? "");
      setText(valor?.text ?? "");
    }
  }, [valor, abierto]);
  const guardar = async () => {
    setAbierto(false);
    if ((url || "") !== (valor?.url ?? "") || (text || "") !== (valor?.text ?? "")) {
      await setValor(item.id, column, url ? { url, text: text || undefined } : null);
    }
  };
  return (
    <Popover open={abierto} onOpenChange={(o) => (o ? setAbierto(true) : guardar())}>
      <div className={cn("group/celda flex h-7 w-full min-w-0 items-center gap-1", vertical ? "" : "justify-center")}>
        {valor?.url ? (
          <a href={valor.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1 text-primary hover:underline" title={valor.url}>
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{valor.text || valor.url.replace(/^https?:\/\//, "")}</span>
          </a>
        ) : (
          <PopoverTrigger asChild>
            <button type="button" className="h-7 w-full text-left text-xs text-muted-foreground/50">
              {vertical ? "—" : ""}
            </button>
          </PopoverTrigger>
        )}
        {valor?.url ? (
          <PopoverTrigger asChild>
            <button type="button" className="hidden shrink-0 text-muted-foreground group-hover/celda:inline" title="Editar">
              ✎
            </button>
          </PopoverTrigger>
        ) : null}
      </div>
      <PopoverContent className="pulse w-72 p-2" align="start">
        <div className="flex flex-col gap-2">
          <input autoFocus className="h-8 rounded border px-2 text-sm" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guardar()} />
          <input className="h-8 rounded border px-2 text-sm" placeholder="Texto a mostrar (opcional)" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && guardar()} />
          <div className="flex justify-between">
            <button type="button" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => { setUrl(""); setText(""); }}>
              Quitar
            </button>
            <button type="button" className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground" onClick={guardar}>
              Guardar
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------- archivo ----------

function CellArchivo({ item, column, archivos, vertical }: CellProps) {
  const { setValor, dispatch } = useBoardActions();
  const ids = (item.values[column.id] as string[] | undefined) ?? [];
  const lista = ids.map((id) => archivos[id]).filter((a): a is ArchivoPulse => !!a);
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  const subir = async (file: File) => {
    setSubiendo(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("itemId", item.id);
    fd.set("columnId", column.id);
    fd.set("boardId", item.boardId);
    const r = await subirArchivoAction(fd);
    setSubiendo(false);
    if (!r.ok) {
      const { toast } = await import("sonner");
      toast.error(r.error, { className: "pulse" });
      return;
    }
    dispatch({ type: "archivo:agregar", archivo: r.archivo });
    await setValor(item.id, column, [...ids, r.archivo.id]);
  };
  const abrir = async (a: ArchivoPulse) => {
    const r = await urlArchivoAction({ fileId: a.id });
    if (r.ok) window.open(r.url, "_blank", "noopener");
  };
  const quitar = async (a: ArchivoPulse) => {
    const { eliminarArchivoAction } = await import("@/app/pulse/(app)/[board]/actions");
    await setValor(item.id, column, ids.filter((id) => id !== a.id));
    await eliminarArchivoAction({ fileId: a.id });
    dispatch({ type: "archivo:quitar", fileId: a.id });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn("flex h-7 w-full min-w-0 items-center gap-1", vertical ? "" : "justify-center")}>
          {lista.length ? (
            <>
              <FileText className="size-3.5 shrink-0 text-primary" />
              <span className="truncate text-xs">{lista.length === 1 ? lista[0].nombre : `${lista.length} archivos`}</span>
            </>
          ) : (
            <Paperclip className="size-3.5 text-muted-foreground/50" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-72 p-2" align="start">
        <div className="flex flex-col gap-1">
          {lista.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => abrir(a)}>
                <FileText className="size-4 shrink-0 text-primary" />
                <span className="truncate">{a.nombre}</span>
              </button>
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => quitar(a)} title="Quitar">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {lista.length === 0 ? <p className="px-1 py-1 text-xs text-muted-foreground">Sin archivos.</p> : null}
        </div>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} />
        <button type="button" disabled={subiendo} onClick={() => inputRef.current?.click()} className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded border border-dashed text-xs hover:bg-muted disabled:opacity-50">
          <Plus className="size-3.5" /> {subiendo ? "Subiendo…" : "Subir archivo (máx. 10 MB)"}
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ---------- relación ----------

function CellRelacion({ item, column, relacionados = [], vertical }: CellProps) {
  const { setValor } = useBoardActions();
  const ids = (item.values[column.id] as string[] | undefined) ?? [];
  const [q, setQ] = useState("");
  const nombres = ids.map((id) => relacionados.find((r) => r.id === id)?.name ?? "…");
  const toggle = async (id: string) => {
    const multiple = column.settings.multiple !== false;
    const nuevo = ids.includes(id) ? ids.filter((v) => v !== id) : multiple ? [...ids, id] : [id];
    await setValor(item.id, column, nuevo);
  };
  const lista = relacionados.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 50);
  return (
    <Popover onOpenChange={(o) => !o && setQ("")}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("flex h-7 w-full min-w-0 items-center gap-1 overflow-hidden", vertical ? "" : "")}>
          {nombres.length ? (
            nombres.map((n, i) => (
              <span key={ids[i]} className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[11px]">
                {n}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground/50">{vertical ? "—" : ""}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="pulse w-72 p-2" align="start">
        <input autoFocus className="mb-2 h-7 w-full rounded border px-2 text-xs" placeholder="Buscar elemento…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex max-h-64 flex-col gap-0.5 overflow-auto">
          {lista.map((r) => (
            <button key={r.id} type="button" onClick={() => toggle(r.id)} className="flex items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-muted">
              <span className="flex-1 truncate">{r.name}</span>
              {ids.includes(r.id) ? <Check className="size-4 text-primary" /> : null}
            </button>
          ))}
          {relacionados.length === 0 ? <p className="px-1 py-2 text-xs text-muted-foreground">Esta columna no tiene tablero conectado.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
