"use client";

import { ArrowRight, Loader2, Pencil, Plus, Trash2, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { activarReglaAction, eliminarReglaAction, guardarReglaAction, listarReglasAction } from "@/app/pulse/(app)/[board]/actions";
import { useBoard, useMiRol } from "@/components/pulse/board-provider";
import { StatusPill } from "@/components/pulse/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Accion, Cuando, Regla } from "@/lib/pulse/automatizaciones";
import { poderes } from "@/lib/pulse/permisos";
import { cn } from "@/lib/utils";

type ReglaUI = Regla & { veces: number; ultimaVez: string | null };
const sel = "h-8 rounded-md border bg-background px-2 text-sm";

const NOMBRE_ACCION: Record<Accion["tipo"], string> = {
  mover: "Mover a un grupo",
  fecha: "Poner una fecha (hoy + días)",
  valor: "Cambiar una etiqueta",
  persona: "Asignar a una persona",
  exigir: "Exigir que un campo esté lleno",
  avisar: "Avisar por Slack",
};

export function BoardAutomatizaciones({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useBoard();
  const puede = poderes(useMiRol()).editarAutomatizaciones;
  const [reglas, setReglas] = useState<ReglaUI[] | null>(null);
  const [editando, setEditando] = useState<Partial<ReglaUI> | null>(null);

  const cargar = useCallback(async () => {
    const r = await listarReglasAction({ boardId: s.board.id });
    if (r.ok) setReglas(r.reglas);
    else toast.error(r.error, { className: "pulse" });
  }, [s.board.id]);
  useEffect(() => {
    if (open) void cargar();
  }, [open, cargar]);

  const col = (id: string) => s.columns.find((c) => c.id === id);
  const grp = (id: string) => s.groups.find((g) => g.id === id);
  const usr = (id: string) => s.usuarios.find((u) => u.id === id)?.nombre ?? "alguien";
  const etiqueta = (columnId: string, id: string) => col(columnId)?.settings.labels?.find((l) => l.id === id);

  const Grupo = ({ id }: { id: string }) => {
    const g = grp(id);
    return <b className="font-semibold" style={{ color: g ? `var(--pulse-color-${g.color})` : undefined }}>{g?.title ?? "grupo borrado"}</b>;
  };
  const Etq = ({ columnId, id }: { columnId: string; id: string }) => {
    const l = etiqueta(columnId, id);
    return l ? <StatusPill label={l.label} color={l.color} className="inline-flex h-5 px-1.5 align-middle text-[11px]" /> : <i>etiqueta borrada</i>;
  };

  const frase = (r: Regla) => (
    <span className="leading-7">
      <span className="text-muted-foreground">Cuando </span>
      {r.cuando.tipo === "valor" ? (
        <>
          <b>{col(r.cuando.columnId)?.title ?? "?"}</b> <span className="text-muted-foreground">cambia a</span> <Etq columnId={r.cuando.columnId} id={r.cuando.valor} />
        </>
      ) : (
        <>
          <span className="text-muted-foreground">se mueve a</span> <Grupo id={r.cuando.groupId} />
        </>
      )}
      {r.cuando.excepto?.length ? (
        <span className="text-muted-foreground">
          {" "}(salvo {r.cuando.tipo === "valor" ? "en" : "desde"} {r.cuando.excepto.map((g, i) => (
            <span key={g}>{i ? ", " : ""}<Grupo id={g} /></span>
          ))})
        </span>
      ) : null}
      <ArrowRight className="mx-1 inline size-3.5 text-muted-foreground" />
      {r.entonces.map((a, i) => (
        <span key={i}>
          {i ? <span className="text-muted-foreground"> · </span> : null}
          {a.tipo === "mover" ? (<><span className="text-muted-foreground">mover a</span> <Grupo id={a.groupId} /></>) : null}
          {a.tipo === "fecha" ? (<><span className="text-muted-foreground">poner</span> <b>{col(a.columnId)?.title}</b> <span className="text-muted-foreground">= hoy{a.dias ? ` ${a.dias > 0 ? "+" : "−"} ${Math.abs(a.dias)} días` : ""}</span></>) : null}
          {a.tipo === "valor" ? (<><span className="text-muted-foreground">poner</span> <b>{col(a.columnId)?.title}</b> <span className="text-muted-foreground">en</span> <Etq columnId={a.columnId} id={a.valor} /></>) : null}
          {a.tipo === "persona" ? (<><span className="text-muted-foreground">asignar a</span> <b>{usr(a.userId)}</b></>) : null}
          {a.tipo === "exigir" ? (<><span className="text-muted-foreground">exigir</span> <b>{col(a.columnId)?.title}</b></>) : null}
          {a.tipo === "avisar" ? (<><span className="text-muted-foreground">avisar por Slack a</span> <b>{usr(a.userId)}</b></>) : null}
        </span>
      ))}
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pulse max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" /> Automatizaciones de «{s.board.nombre}»
          </DialogTitle>
          <DialogDescription>Lo que Pulse hace solo cuando alguien cambia una etiqueta o mueve un elemento. {puede ? "" : "Solo las editoras y el admin pueden cambiarlas."}</DialogDescription>
        </DialogHeader>

        {editando ? (
          <EditorRegla inicial={editando} onCancelar={() => setEditando(null)} onGuardada={async () => { setEditando(null); await cargar(); }} />
        ) : (
          <>
            {reglas === null ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> : null}
            {reglas?.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Todavía no hay automatizaciones en este tablero.</p> : null}
            <ul className="flex flex-col gap-2">
              {reglas?.map((r) => (
                <li key={r.id} className={cn("flex items-start gap-3 rounded-xl border p-3", !r.activa && "opacity-55")}>
                  <Switch
                    checked={r.activa}
                    disabled={!puede}
                    onCheckedChange={async (v) => {
                      setReglas((rs) => rs?.map((x) => (x.id === r.id ? { ...x, activa: v } : x)) ?? null);
                      const res = await activarReglaAction({ id: r.id, activa: v });
                      if (!res.ok) {
                        toast.error(res.error, { className: "pulse" });
                        void cargar();
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.nombre}</p>
                    <p className="text-sm">{frase(r)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.veces ? `Se usó ${r.veces} ${r.veces === 1 ? "vez" : "veces"}` : "Todavía no se ha usado"}
                      {r.ultimaVez ? ` · última: ${new Date(r.ultimaVez).toLocaleDateString("es-PR", { day: "numeric", month: "short" })}` : ""}
                    </p>
                  </div>
                  {puede ? (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditando(r)} title="Editar">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Borrar"
                        onClick={async () => {
                          if (!confirm(`¿Borrar la automatización «${r.nombre}»?`)) return;
                          const res = await eliminarReglaAction({ id: r.id });
                          if (res.ok) void cargar();
                          else toast.error(res.error, { className: "pulse" });
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            {puede ? (
              <Button variant="outline" className="w-fit" onClick={() => setEditando({ activa: true, nombre: "", cuando: { tipo: "valor", columnId: "", valor: "" }, entonces: [] })}>
                <Plus /> Nueva automatización
              </Button>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditorRegla({ inicial, onCancelar, onGuardada }: { inicial: Partial<ReglaUI>; onCancelar: () => void; onGuardada: () => void }) {
  const s = useBoard();
  const [nombre, setNombre] = useState(inicial.nombre ?? "");
  const [cuando, setCuando] = useState<Cuando>(inicial.cuando ?? { tipo: "valor", columnId: "", valor: "" });
  const [entonces, setEntonces] = useState<Accion[]>(inicial.entonces ?? []);
  const [guardando, setGuardando] = useState(false);
  const conEtiquetas = s.columns.filter((c) => c.type === "status" || c.type === "dropdown");
  const statusCols = s.columns.filter((c) => c.type === "status");
  const fechas = s.columns.filter((c) => c.type === "date");
  const personas = s.columns.filter((c) => c.type === "people");
  const activos = s.usuarios.filter((u) => u.activo && !u.email.endsWith("@pulse.sistema"));
  const labels = (columnId: string) => (s.columns.find((c) => c.id === columnId)?.settings.labels ?? []).filter((l) => l.label.trim());

  const setAccion = (i: number, a: Accion) => setEntonces((xs) => xs.map((x, j) => (j === i ? a : x)));
  const nueva = (tipo: Accion["tipo"]): Accion => {
    switch (tipo) {
      case "mover": return { tipo, groupId: s.groups[0]?.id ?? "" };
      case "fecha": return { tipo, columnId: fechas[0]?.id ?? "", dias: 0, soloSiVacia: true };
      case "valor": return { tipo, columnId: statusCols[0]?.id ?? "", valor: labels(statusCols[0]?.id ?? "")[0]?.id ?? "" };
      case "persona": return { tipo, columnId: personas[0]?.id ?? "", userId: activos[0]?.id ?? "" };
      case "exigir": return { tipo, columnId: s.columns[0]?.id ?? "" };
      case "avisar": return { tipo, userId: activos[0]?.id ?? "" };
    }
  };

  const guardar = async () => {
    setGuardando(true);
    const r = await guardarReglaAction({ boardId: s.board.id, id: inicial.id, nombre, activa: inicial.activa ?? true, cuando, entonces });
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, { className: "pulse" });
    toast.success("Automatización guardada", { className: "pulse" });
    onGuardada();
  };

  const excepto = cuando.excepto ?? [];
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted-foreground uppercase">Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Cliente listo → CLIENTE ACTIVO" className="h-9 rounded-md border px-3" />
      </label>

      <fieldset className="flex flex-col gap-2 rounded-xl border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground uppercase">Cuando</legend>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select className={sel} value={cuando.tipo} onChange={(e) => setCuando(e.target.value === "grupo" ? { tipo: "grupo", groupId: s.groups[0]?.id ?? "" } : { tipo: "valor", columnId: "", valor: "" })}>
            <option value="valor">una columna cambia a…</option>
            <option value="grupo">el elemento se mueve a…</option>
          </select>
          {cuando.tipo === "valor" ? (
            <>
              <select className={sel} value={cuando.columnId} onChange={(e) => setCuando({ ...cuando, columnId: e.target.value, valor: labels(e.target.value)[0]?.id ?? "" })}>
                <option value="">— columna —</option>
                {conEtiquetas.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {cuando.columnId ? (
                <select className={sel} value={cuando.valor} onChange={(e) => setCuando({ ...cuando, valor: e.target.value })}>
                  {labels(cuando.columnId).map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              ) : null}
            </>
          ) : (
            <select className={sel} value={cuando.groupId} onChange={(e) => setCuando({ ...cuando, groupId: e.target.value })}>
              {s.groups.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          )}
        </div>
        <details className="text-xs text-muted-foreground" open={excepto.length > 0}>
          <summary className="cursor-pointer select-none">Excepciones: no aplicar si el elemento está {cuando.tipo === "grupo" ? "viniendo de" : "en"}…</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.groups.map((g) => {
              const on = excepto.includes(g.id);
              return (
                <button key={g.id} type="button" onClick={() => setCuando({ ...cuando, excepto: on ? excepto.filter((x) => x !== g.id) : [...excepto, g.id] })} className={cn("rounded-full border px-2 py-0.5", on && "border-primary bg-primary/10 text-foreground")}>
                  {g.title}
                </button>
              );
            })}
          </div>
        </details>
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded-xl border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground uppercase">Entonces</legend>
        {entonces.map((a, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{NOMBRE_ACCION[a.tipo]}:</span>
            {a.tipo === "mover" ? (
              <select className={sel} value={a.groupId} onChange={(e) => setAccion(i, { ...a, groupId: e.target.value })}>
                {s.groups.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            ) : null}
            {a.tipo === "fecha" ? (
              <>
                <select className={sel} value={a.columnId} onChange={(e) => setAccion(i, { ...a, columnId: e.target.value })}>
                  {fechas.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <span>= hoy +</span>
                <input type="number" className={cn(sel, "w-16")} value={a.dias} onChange={(e) => setAccion(i, { ...a, dias: Math.round(Number(e.target.value) || 0) })} />
                <span>días</span>
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input type="checkbox" checked={a.soloSiVacia ?? true} onChange={(e) => setAccion(i, { ...a, soloSiVacia: e.target.checked })} /> solo si está vacía
                </label>
              </>
            ) : null}
            {a.tipo === "valor" ? (
              <>
                <select className={sel} value={a.columnId} onChange={(e) => setAccion(i, { ...a, columnId: e.target.value, valor: labels(e.target.value)[0]?.id ?? "" })}>
                  {statusCols.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <select className={sel} value={a.valor} onChange={(e) => setAccion(i, { ...a, valor: e.target.value })}>
                  {labels(a.columnId).map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </>
            ) : null}
            {a.tipo === "persona" ? (
              <>
                <select className={sel} value={a.columnId} onChange={(e) => setAccion(i, { ...a, columnId: e.target.value })}>
                  {personas.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <select className={sel} value={a.userId} onChange={(e) => setAccion(i, { ...a, userId: e.target.value })}>
                  {activos.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </>
            ) : null}
            {a.tipo === "exigir" ? (
              <select className={sel} value={a.columnId} onChange={(e) => setAccion(i, { ...a, columnId: e.target.value })}>
                {s.columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            ) : null}
            {a.tipo === "avisar" ? (
              <select className={sel} value={a.userId} onChange={(e) => setAccion(i, { ...a, userId: e.target.value })}>
                {activos.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            ) : null}
            <button type="button" onClick={() => setEntonces((xs) => xs.filter((_, j) => j !== i))} className="ml-auto text-muted-foreground hover:text-destructive" title="Quitar">
              <X className="size-4" />
            </button>
          </div>
        ))}
        <select className={cn(sel, "w-fit text-muted-foreground")} value="" onChange={(e) => e.target.value && setEntonces((xs) => [...xs, nueva(e.target.value as Accion["tipo"])])}>
          <option value="">+ Agregar acción…</option>
          {(Object.keys(NOMBRE_ACCION) as Accion["tipo"][]).map((t) => <option key={t} value={t}>{NOMBRE_ACCION[t]}</option>)}
        </select>
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button onClick={guardar} disabled={guardando || !entonces.length || (cuando.tipo === "valor" && (!cuando.columnId || !cuando.valor))}>
          {guardando ? <Loader2 className="animate-spin" /> : null} Guardar
        </Button>
      </div>
    </div>
  );
}
