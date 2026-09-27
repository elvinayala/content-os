"use client";

import { ExternalLink, Loader2, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { borrarNoticiaAction, fijarNoticiaAction, publicarNoticiaAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIAS_NOTICIA, categoriaNoticia } from "@/lib/desempeno/noticias-tipos";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
const cuando = (iso: string) => new Date(iso).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" });

// Color por tipo: logro verde (pulso), comunicado coral, benéfica esmeralda suave, noticia neutra.
const TONO: Record<string, string> = {
  logro: "bg-primary/12 text-primary ring-primary/30",
  comunicado: "bg-[color:var(--coral)]/12 text-[color:var(--coral)] ring-[color:var(--coral)]/30",
  benefica: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  noticia: "bg-white/5 text-foreground/80 ring-white/10",
};

export type NoticiaUI = { id: string; categoria: string; titulo: string; cuerpo: string; persona: string | null; enlace: string | null; fijada: boolean; createdAt: string };

export function Noticia({ n, maestro, compacta }: { n: NoticiaUI; maestro: boolean; compacta?: boolean }) {
  const c = categoriaNoticia(n.categoria);
  const [cargando, setCargando] = useState(false);
  const fijar = async () => {
    setCargando(true);
    const r = await fijarNoticiaAction(n.id, !n.fijada);
    setCargando(false);
    if (!r.ok) toast.error(r.error, aviso);
  };
  const borrar = async () => {
    if (!confirm("¿Borrar esta publicación?")) return;
    setCargando(true);
    const r = await borrarNoticiaAction(n.id);
    setCargando(false);
    if (!r.ok) toast.error(r.error, aviso);
  };
  return (
    <article className={cn("fila flex flex-col gap-1.5 p-4", n.fijada && "bg-primary/[0.03]")}>
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ring-1", TONO[c.id])}>
          <span aria-hidden>{c.emoji}</span> {c.nombre}
        </span>
        {n.fijada ? <Pin className="size-3.5 text-primary" aria-label="Fijada" /> : null}
        <span className="ml-auto font-mono text-[11px] tracking-wider text-muted-foreground">{cuando(n.createdAt)}</span>
        {maestro ? (
          <span className="flex items-center">
            <button type="button" onClick={fijar} disabled={cargando} title={n.fijada ? "Desfijar" : "Fijar arriba"} className="rounded-full p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground">
              {n.fijada ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </button>
            <button type="button" onClick={borrar} disabled={cargando} title="Borrar" className="rounded-full p-1.5 text-muted-foreground hover:bg-white/5 hover:text-red-300">
              {cargando ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </button>
          </span>
        ) : null}
      </div>
      <h3 className="font-semibold tracking-tight">{n.titulo}</h3>
      {n.persona ? <p className="text-xs text-primary">🏆 {n.persona}</p> : null}
      <p className={cn("text-sm whitespace-pre-line text-foreground/80", compacta && "line-clamp-2")}>{n.cuerpo}</p>
      {n.enlace && !compacta ? (
        <a href={n.enlace} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="size-3.5" /> Ver más
        </a>
      ) : null}
    </article>
  );
}

export function NuevaNoticia({ personas }: { personas: { id: string; nombre: string }[] }) {
  const vacia = { categoria: "noticia", titulo: "", cuerpo: "", personaId: "", enlace: "", fijada: false };
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState(vacia);
  const [cargando, setCargando] = useState(false);
  const publicar = async () => {
    setCargando(true);
    const r = await publicarNoticiaAction(f);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Publicado", aviso);
    setF(vacia);
    setAbierto(false);
  };
  return (
    <>
      <Button className="h-10 rounded-full" onClick={() => setAbierto(true)}>
        <Plus className="size-4" /> Publicar
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="ritmo sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Publicar en Noticias</DialogTitle>
            <DialogDescription>Lo ve todo el equipo al instante, en Hoy y en Noticias.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_NOTICIA.map((c) => (
                <button key={c.id} type="button" onClick={() => setF((x) => ({ ...x, categoria: c.id }))} className={cn("rounded-full px-3 py-1.5 text-sm ring-1 transition", f.categoria === c.id ? TONO[c.id] : "text-muted-foreground ring-border hover:text-foreground")}>
                  {c.emoji} {c.nombre}
                </button>
              ))}
            </div>
            {f.categoria === "logro" ? (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">¿De quién es el logro? (opcional; le avisamos)</Label>
                <select className="h-10 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring" value={f.personaId} onChange={(e) => setF((x) => ({ ...x, personaId: e.target.value }))}>
                  <option value="">Todo el equipo</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Título</Label>
              <Input className="h-10" value={f.titulo} onChange={(e) => setF((x) => ({ ...x, titulo: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Mensaje (breve)</Label>
              <Textarea rows={4} value={f.cuerpo} onChange={(e) => setF((x) => ({ ...x, cuerpo: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Enlace (opcional)</Label>
              <Input className="h-10" value={f.enlace} onChange={(e) => setF((x) => ({ ...x, enlace: e.target.value }))} placeholder="https://" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={f.fijada} onChange={(e) => setF((x) => ({ ...x, fijada: e.target.checked }))} className="size-4 accent-[color:var(--neon)]" />
              Fijar arriba (para comunicados importantes)
            </label>
          </div>
          <DialogFooter>
            <Button onClick={publicar} disabled={cargando} className="h-11 rounded-full px-6">
              {cargando ? <Loader2 className="animate-spin" /> : null} Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
