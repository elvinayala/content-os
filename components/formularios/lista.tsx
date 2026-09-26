"use client";

import { Copy, ExternalLink, FileText, Inbox, MoreHorizontal, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { archivarFormularioAction, crearFormularioAction } from "@/app/pulse/(app)/formularios/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARCAS_FORM } from "@/lib/formularios/reglas";

export interface FormularioFila {
  id: string;
  titulo: string;
  slug: string;
  marca: string;
  activo: boolean;
  accion: string;
  preguntas: number;
  total: number;
  ultima: string | null;
  link: string;
}

const hace = (iso: string | null) => {
  if (!iso) return "Sin respuestas todavía";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "Última hoy" : d === 1 ? "Última ayer" : `Última hace ${d} días`;
};

export function ListaFormularios({ formularios }: { formularios: FormularioFila[] }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState<{ duplicarDe?: string; titulo: string; marca: string } | null>(null);
  const [pend, start] = useTransition();

  const copiar = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado");
  };
  const crear = () =>
    start(async () => {
      if (!nuevo) return;
      const r = await crearFormularioAction(nuevo);
      if (!r.ok || !r.id) return void toast.error(r.error);
      setNuevo(null);
      router.push(`/pulse/formularios/${r.id}`);
    });
  const archivar = (f: FormularioFila) =>
    start(async () => {
      if (!confirm(`¿Archivar "${f.titulo}"? El link deja de funcionar. Las respuestas se conservan.`)) return;
      const r = await archivarFormularioAction(f.id);
      if (!r.ok) return void toast.error(r.error);
      toast("Archivado");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Formularios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Nuestro propio Typeform: una pregunta por pantalla, con la marca de cada negocio. Las respuestas quedan aquí.</p>
        </div>
        <Button onClick={() => setNuevo({ titulo: "", marca: "level_up" })}>
          <Plus className="size-4" /> Nuevo formulario
        </Button>
      </div>

      <div className="grid gap-3">
        {formularios.map((f) => (
          <div key={f.id} className="group flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <Link href={`/pulse/formularios/${f.id}`} className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-medium">{f.titulo}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{MARCAS_FORM[f.marca] ?? f.marca}</span>
                {f.activo ? (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase">Abierto</span>
                ) : (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">Cerrado</span>
                )}
                {f.accion === "pulse-onboarding-lu" ? (
                  <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
                    <Sparkles className="size-3" /> Crea la ficha en Pulse
                  </span>
                ) : null}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {f.preguntas} preguntas · {hace(f.ultima)} · {f.link.replace(/^https:\/\//, "")}
              </div>
            </Link>
            <Link href={`/pulse/formularios/${f.id}/respuestas`} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm hover:bg-muted">
              <Inbox className="size-4 text-muted-foreground" />
              <span className="font-semibold tabular-nums">{f.total}</span>
              <span className="text-muted-foreground">respuestas</span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => copiar(f.link)}>
              <Copy className="size-4" /> Copiar link
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Más">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="pulse">
                <DropdownMenuItem asChild>
                  <a href={f.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Abrir el formulario
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNuevo({ duplicarDe: f.id, titulo: `${f.titulo} (copia)`, marca: f.marca })}>
                  <Copy className="size-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => archivar(f)}>
                  Archivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Dialog open={!!nuevo} onOpenChange={(v) => !v && setNuevo(null)}>
        <DialogContent className="pulse sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{nuevo?.duplicarDe ? "Duplicar formulario" : "Nuevo formulario"}</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              crear();
            }}
          >
            <div className="grid gap-1.5">
              <Label>Nombre</Label>
              <Input autoFocus value={nuevo?.titulo ?? ""} onChange={(e) => nuevo && setNuevo({ ...nuevo, titulo: e.target.value })} placeholder="Encuesta post-venta" />
            </div>
            <div className="grid gap-1.5">
              <Label>Marca</Label>
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={nuevo?.marca ?? "level_up"} onChange={(e) => nuevo && setNuevo({ ...nuevo, marca: e.target.value })}>
                {Object.entries(MARCAS_FORM).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Nace cerrado: lo abres cuando esté listo.{nuevo?.duplicarDe ? " La copia no crea fichas en Pulse." : ""}</p>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setNuevo(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pend || !nuevo?.titulo.trim()}>
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
