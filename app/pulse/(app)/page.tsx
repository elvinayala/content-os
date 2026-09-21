import { ArrowUpRight, Layers3, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { crearBoardAction } from "@/app/pulse/(app)/actions";
import { ColorPicker } from "@/components/pulse/color-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cssColor } from "@/lib/pulse/colores";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarBoards } from "@/lib/pulse/repo";
import { NOMBRE_APP } from "@/lib/pulse/types";

function saludo(): string {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Puerto_Rico" }));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function hace(iso: string | null): string {
  if (!iso) return "sin actividad";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}

export default async function PulseHome() {
  const usuario = await usuarioActual();
  const boards = await listarBoards(usuario ?? undefined);
  const totalItems = boards.reduce((a, b) => a + b.items, 0);
  const totalGrupos = boards.reduce((a, b) => a + b.grupos.length, 0);

  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Tableros</span>
        <div className="ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> Nuevo tablero
              </Button>
            </DialogTrigger>
            <DialogContent className="pulse">
              <DialogHeader>
                <DialogTitle>Nuevo tablero</DialogTitle>
              </DialogHeader>
              <form action={crearBoardAction} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" placeholder="Ej: Clientes Shadow Operator" autoFocus required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Color</Label>
                  <ColorPicker name="color" defaultValue="bright_blue" />
                </div>
                <Button type="submit">Crear</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* hero */}
        <section className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <span className="punto-vivo" /> {NOMBRE_APP} · CRM de clientes
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {saludo()}, {usuario?.nombre.split(" ")[0]}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Todo lo que sabemos de cada cliente, en un solo lugar.</p>
          </div>
          <div className="flex gap-3">
            <Stat icono={<Users className="size-4" />} valor={totalItems.toLocaleString("en-US")} etiqueta="clientes" />
            <Stat icono={<Layers3 className="size-4" />} valor={String(boards.length)} etiqueta={boards.length === 1 ? "tablero" : "tableros"} />
            <Stat icono={<Sparkles className="size-4" />} valor={String(totalGrupos)} etiqueta="grupos" />
          </div>
        </section>

        {/* tableros */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => {
            const color = cssColor(b.color);
            const visibles = b.grupos.filter((g) => g.items > 0);
            return (
              <Link key={b.id} href={`/pulse/${b.slug}`} className="tarjeta-tablero group flex flex-col gap-4 p-5" style={{ ["--tarjeta-color" as string]: color }}>
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 85%, white), ${color})` }}>
                    <Layers3 className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold leading-tight">{b.nombre}</h2>
                    <p className="text-xs text-muted-foreground">
                      {b.items.toLocaleString("en-US")} cliente{b.items === 1 ? "" : "s"} · {b.grupos.length} grupo{b.grupos.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </div>

                {b.items > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="barra-grupos">
                      {visibles.map((g) => (
                        <span key={g.id} title={`${g.title}: ${g.items}`} style={{ width: `${(g.items / b.items) * 100}%`, background: cssColor(g.color) }} />
                      ))}
                    </div>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                      {visibles.slice(0, 4).map((g) => (
                        <li key={g.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="size-2 rounded-full" style={{ background: cssColor(g.color) }} />
                          <span className="max-w-32 truncate">{g.title}</span>
                          <span className="font-medium text-foreground">{g.items}</span>
                        </li>
                      ))}
                      {visibles.length > 4 ? <li className="text-[11px] text-muted-foreground">+{visibles.length - 4}</li> : null}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Todavía sin elementos.</p>
                )}

                <p className="mt-auto text-[11px] text-muted-foreground">Última actividad {hace(b.actualizadoEl)}</p>
              </Link>
            );
          })}
          {boards.length === 0 ? <p className="col-span-full text-sm text-muted-foreground">Todavía no hay tableros. Creá el primero con "Nuevo tablero".</p> : null}
        </section>
      </main>
    </div>
  );
}

function Stat({ icono, valor, etiqueta }: { icono: React.ReactNode; valor: string; etiqueta: string }) {
  return (
    <div className="vidrio flex min-w-28 flex-col gap-1 rounded-xl border px-4 py-3">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icono} {etiqueta}
      </span>
      <span className="text-2xl font-semibold tabular-nums leading-none">{valor}</span>
    </div>
  );
}
