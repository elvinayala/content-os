"use client";

import { DndContext, DragOverlay, MeasuringStrategy, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CalendarClock, ChevronDown, Kanban, List, MessageCircle, Plus, Search, Settings2, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { cerrarLeadAction, moverLeadAction } from "@/app/pulse/(app)/leads/actions";
import { EmbudoDialog, NuevoEmbudoDialog, NuevoLeadDialog, PerdidoDialog, type EmbudoUI, type EtapaUI, type UsuarioUI } from "@/components/leads/dialogos";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { diasEnEtapa, estadoActividad, estancado, type Marca } from "@/lib/leads/reglas";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export interface TarjetaUI {
  id: string;
  nombre: string;
  negocio: string | null;
  telefono: string | null;
  valor: number;
  etapaId: string;
  orden: number;
  duenoId: string | null;
  duenoNombre: string | null;
  duenoColor: string | null;
  proximaActividad: string | null;
  etapaDesde: string;
  noLeidos: number;
  origen: string;
  ultimoMensaje: string | null;
}

const usd = (n: number) => (n ? `$${n.toLocaleString("en-US")}` : "$0");

// ---------------------------------------------------------------------------------------------
// Barra de arriba (común a Embudo / Lista / Actividades)
// ---------------------------------------------------------------------------------------------
export function BarraLeads({
  marca,
  marcaSlug,
  marcaNombre,
  marcas,
  embudos,
  embudoId,
  vista,
  usuarios,
  yoId,
  puedeEditar,
  etapas,
}: {
  marca: Marca;
  marcaSlug: string;
  marcaNombre: string;
  marcas: { slug: string; nombre: string }[];
  embudos: EmbudoUI[];
  embudoId: string;
  vista: "embudo" | "lista" | "actividades";
  usuarios: UsuarioUI[];
  yoId: string;
  puedeEditar: boolean;
  etapas: EtapaUI[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [nuevo, setNuevo] = useState(false);
  const [editar, setEditar] = useState(false);
  const [nuevoEmbudo, setNuevoEmbudo] = useState(false);
  const embudo = embudos.find((e) => e.id === embudoId) ?? embudos[0];
  const dueno = sp.get("dueno") ?? "";

  const ir = (cambios: Record<string, string | null>, ruta = pathname) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cambios)) (v ? p.set(k, v) : p.delete(k));
    router.push(`${ruta}?${p.toString()}`);
  };
  useEffect(() => {
    const t = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) ir({ q: q || null });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const base = `/pulse/leads/${marcaSlug}`;
  const nombreDueno = dueno === yoId ? "Mis leads" : dueno === "__sin" ? "Sin dueño" : usuarios.find((u) => u.id === dueno)?.nombre ?? "Todos";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2.5">
        {/* Vistas (como los botones de Pipedrive) */}
        <div className="flex rounded-md border p-0.5">
          {[
            { v: "embudo", icon: Kanban, href: base, t: "Embudo" },
            { v: "lista", icon: List, href: `${base}/lista`, t: "Lista" },
            { v: "actividades", icon: CalendarClock, href: `${base}/actividades`, t: "Actividades" },
          ].map((b) => (
            <Link
              key={b.v}
              href={`${b.href}${embudoId ? `?embudo=${embudoId}` : ""}`}
              title={b.t}
              className={cn("flex h-7 items-center gap-1.5 rounded px-2 text-xs font-medium", vista === b.v ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            >
              <b.icon className="size-3.5" />
              <span className="hidden sm:inline">{b.t}</span>
            </Link>
          ))}
        </div>

        <Button size="sm" onClick={() => setNuevo(true)} className="h-8 bg-[#08a742] text-white hover:bg-[#07923a]">
          <Plus className="size-4" /> Lead
        </Button>

        {/* Selector de embudo */}
        {vista !== "actividades" && embudo && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 max-w-60 gap-1 font-semibold">
                <span className="truncate">{embudo.nombre}</span>
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="pulse w-64" align="start">
              {embudos.map((e) => (
                <DropdownMenuItem key={e.id} onSelect={() => ir({ embudo: e.id })} className={cn(e.id === embudo.id && "font-semibold")}>
                  {e.nombre}
                </DropdownMenuItem>
              ))}
              {puedeEditar && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setEditar(true)}>
                    <Settings2 className="size-4" /> Editar este embudo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setNuevoEmbudo(true)}>
                    <Plus className="size-4" /> Nuevo embudo
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, negocio, teléfono…" className="h-8 w-44 pl-8 sm:w-64" />
            {q && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setQ("")} aria-label="Borrar búsqueda">
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {nombreDueno}
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="pulse max-h-80 w-56 overflow-y-auto" align="end">
              <DropdownMenuItem onSelect={() => ir({ dueno: null })}>Todos</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => ir({ dueno: yoId })}>Mis leads</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => ir({ dueno: "__sin" })}>Sin dueño</DropdownMenuItem>
              <DropdownMenuSeparator />
              {usuarios.map((u) => (
                <DropdownMenuItem key={u.id} onSelect={() => ir({ dueno: u.id })}>
                  <UserAvatar nombre={u.nombre} color={u.color as ColorPulse | null} className="size-5 text-[9px]" /> {u.nombre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {marcas.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs uppercase tracking-wide">
                  {marcaNombre}
                  <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="pulse" align="end">
                {marcas.map((m) => (
                  <DropdownMenuItem key={m.slug} onSelect={() => router.push(`/pulse/leads/${m.slug}`)}>
                    {m.nombre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {embudo && <NuevoLeadDialog abierto={nuevo} onCerrar={() => setNuevo(false)} marca={marca} embudo={embudo} etapas={etapas} usuarios={usuarios} yoId={yoId} />}
      {embudo && editar && <EmbudoDialog abierto={editar} onCerrar={() => setEditar(false)} embudo={embudo} etapas={etapas} />}
      <NuevoEmbudoDialog abierto={nuevoEmbudo} onCerrar={() => setNuevoEmbudo(false)} marca={marca} onCreado={(id) => ir({ embudo: id }, base)} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Tablero (vista Embudo): columnas por etapa, arrastrar entre etapas, soltar en GANADO / PERDIDO
// ---------------------------------------------------------------------------------------------
export function TableroLeads({
  marca,
  marcaSlug,
  embudo,
  etapas,
  tratos: iniciales,
  usuarios,
  yoId,
}: {
  marca: Marca;
  marcaSlug: string;
  embudo: EmbudoUI;
  etapas: EtapaUI[];
  tratos: TarjetaUI[];
  usuarios: UsuarioUI[];
  yoId: string;
}) {
  const router = useRouter();
  const [tratos, setTratos] = useState(iniciales);
  useEffect(() => setTratos(iniciales), [iniciales]);
  const [arrastrando, setArrastrando] = useState<TarjetaUI | null>(null);
  const [perdido, setPerdido] = useState<TarjetaUI | null>(null);
  const [nuevoEn, setNuevoEn] = useState<string | null>(null);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ahora = useMemo(() => new Date(), []);

  const porEtapa = useMemo(() => {
    const m = new Map<string, TarjetaUI[]>(etapas.map((e) => [e.id, []]));
    for (const t of [...tratos].sort((a, b) => a.orden - b.orden)) m.get(t.etapaId)?.push(t);
    return m;
  }, [tratos, etapas]);

  const total = tratos.reduce((s, t) => s + t.valor, 0);

  const onDragStart = (e: DragStartEvent) => setArrastrando(tratos.find((t) => t.id === e.active.id) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setArrastrando(null);
    const t = tratos.find((x) => x.id === e.active.id);
    const destino = e.over ? String(e.over.id) : null;
    if (!t || !destino) return;
    if (destino === "__ganado") {
      setTratos((ts) => ts.filter((x) => x.id !== t.id));
      start(async () => {
        const r = await cerrarLeadAction(t.id, "ganado");
        if (!r.ok) {
          toast.error(r.error);
          setTratos((ts) => [...ts, t]);
        } else toast.success(`🏆 ${t.nombre} ganado`);
      });
      return;
    }
    if (destino === "__perdido") return setPerdido(t);

    // Soltar sobre una etapa (al final) o sobre otra tarjeta (antes de ella).
    let etapaId = destino;
    let despuesId: string | null = null;
    if (destino.startsWith("card:")) {
      const sobre = tratos.find((x) => x.id === destino.slice(5));
      if (!sobre || sobre.id === t.id) return;
      etapaId = sobre.etapaId;
      despuesId = sobre.id;
    }
    const col = (porEtapa.get(etapaId) ?? []).filter((x) => x.id !== t.id);
    const idx = despuesId ? col.findIndex((x) => x.id === despuesId) : col.length;
    const antes = idx > 0 ? col[idx - 1] : null;
    const despues = despuesId ? col[idx] : null;
    const nuevoOrden = antes && despues ? (antes.orden + despues.orden) / 2 : antes ? antes.orden + 1000 : despues ? despues.orden - 1000 : 1000;
    const previo = tratos;
    setTratos((ts) => ts.map((x) => (x.id === t.id ? { ...x, etapaId, orden: nuevoOrden, etapaDesde: x.etapaId === etapaId ? x.etapaDesde : new Date().toISOString() } : x)));
    start(async () => {
      const r = await moverLeadAction(t.id, etapaId, antes?.id ?? null, despues?.id ?? null);
      if (!r.ok) {
        toast.error(r.error);
        setTratos(previo);
      }
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 py-1.5 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{usd(total)}</span> · {tratos.length} {tratos.length === 1 ? "lead" : "leads"}
      </div>
      <DndContext id="leads-tablero" measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setArrastrando(null)}>
        <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto px-3 pb-24">
          {etapas.map((e, i) => (
            <Columna
              key={e.id}
              etapa={e}
              primera={i === 0}
              tratos={porEtapa.get(e.id) ?? []}
              diasEstancado={embudo.diasEstancado}
              ahora={ahora}
              marcaSlug={marcaSlug}
              onNuevo={() => setNuevoEn(e.id)}
            />
          ))}
        </div>

        {/* Zonas de cierre: aparecen al arrastrar (lo más Pipedrive de Pipedrive) */}
        <div
          className={cn(
            // Fijas en su lugar (sin deslizar) para que la librería mida bien dónde están.
            "pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 p-4 transition-opacity md:left-[var(--sidebar-width)]",
            arrastrando ? "opacity-100" : "invisible opacity-0",
          )}
        >
          <ZonaCierre id="__perdido" texto="PERDIDO" clase="border-red-500 text-red-600 bg-red-50" activa="bg-red-600 text-white" />
          <ZonaCierre id="__ganado" texto="GANADO" clase="border-[#08a742] text-[#08a742] bg-green-50" activa="bg-[#08a742] text-white" icono />
        </div>

        <DragOverlay dropAnimation={null}>{arrastrando ? <Tarjeta t={arrastrando} diasEstancado={embudo.diasEstancado} ahora={ahora} marcaSlug={marcaSlug} fantasma /> : null}</DragOverlay>
      </DndContext>

      <PerdidoDialog
        tratoId={perdido?.id ?? null}
        nombre={perdido?.nombre ?? ""}
        onCerrar={() => setPerdido(null)}
        onHecho={() => {
          setTratos((ts) => ts.filter((x) => x.id !== perdido?.id));
          setPerdido(null);
          router.refresh();
        }}
      />
      {nuevoEn && <NuevoLeadDialog abierto onCerrar={() => setNuevoEn(null)} marca={marca} embudo={embudo} etapas={etapas} etapaInicial={nuevoEn} usuarios={usuarios} yoId={yoId} />}
    </div>
  );
}

function ZonaCierre({ id, texto, clase, activa, icono }: { id: string; texto: string; clase: string; activa: string; icono?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={cn("pointer-events-auto flex h-16 w-44 items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm font-bold tracking-wider shadow-lg sm:w-60", clase, isOver && activa)}>
      {icono && <Trophy className="size-4" />}
      {texto}
    </div>
  );
}

function Columna({ etapa, primera, tratos, diasEstancado, ahora, marcaSlug, onNuevo }: { etapa: EtapaUI; primera: boolean; tratos: TarjetaUI[]; diasEstancado: number; ahora: Date; marcaSlug: string; onNuevo: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const suma = tratos.reduce((s, t) => s + t.valor, 0);
  return (
    <section ref={setNodeRef} className={cn("flex w-64 shrink-0 flex-col rounded-lg bg-muted/40 transition-colors", isOver && "bg-muted")}>
      {/* Encabezado tipo flecha, como las etapas de Pipedrive */}
      <header className={cn("relative mb-1 bg-background px-3 py-2 shadow-sm", primera ? "rounded-l-lg" : "", "rounded-t-lg")}>
        <h3 className="truncate text-[13px] font-semibold" title={etapa.nombre}>
          {etapa.nombre}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {usd(suma)} · {tratos.length} {tratos.length === 1 ? "lead" : "leads"}
        </p>
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
        {tratos.map((t) => (
          <Tarjeta key={t.id} t={t} diasEstancado={diasEstancado} ahora={ahora} marcaSlug={marcaSlug} />
        ))}
        <button onClick={onNuevo} className="mt-0.5 flex h-8 items-center justify-center rounded-md text-muted-foreground opacity-60 transition hover:bg-background hover:opacity-100" aria-label={`Nuevo lead en ${etapa.nombre}`}>
          <Plus className="size-4" />
        </button>
      </div>
    </section>
  );
}

const PUNTO: Record<string, string> = {
  ninguna: "border-2 border-amber-400 bg-transparent", // sin seguimiento: aviso (Pipedrive: triangulito)
  vencida: "bg-red-500",
  hoy: "bg-[#08a742]",
  futura: "bg-muted-foreground/40",
};
const TITULO_PUNTO: Record<string, string> = { ninguna: "Sin seguimiento programado", vencida: "Seguimiento vencido", hoy: "Seguimiento hoy", futura: "Seguimiento programado" };

function Tarjeta({ t, diasEstancado, ahora, marcaSlug, fantasma }: { t: TarjetaUI; diasEstancado: number; ahora: Date; marcaSlug: string; fantasma?: boolean }) {
  const drag = useDraggable({ id: t.id });
  const drop = useDroppable({ id: `card:${t.id}` });
  const act = estadoActividad(t.proximaActividad, ahora);
  const viejo = estancado(t.etapaDesde, diasEstancado, ahora);
  return (
    <div
      ref={(n) => {
        drag.setNodeRef(n);
        drop.setNodeRef(n);
      }}
      {...drag.attributes}
      {...drag.listeners}
      className={cn(
        "group relative rounded-md border bg-background shadow-[0_1px_2px_rgba(0,0,0,.06)] transition hover:shadow-md",
        viejo && "border-l-4 border-l-red-400",
        drag.isDragging && !fantasma && "opacity-30",
        drop.isOver && !drag.isDragging && "ring-2 ring-[#08a742]/50",
        fantasma && "w-60 rotate-2 shadow-xl",
      )}
    >
      <Link href={`/pulse/leads/${marcaSlug}/${t.id}`} className="block px-2.5 py-2" draggable={false} onClick={(e) => drag.isDragging && e.preventDefault()}>
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight">{t.nombre}</p>
          {t.noLeidos > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-[#25d366] px-1.5 text-[10px] font-bold text-white" title={`${t.noLeidos} mensaje(s) sin leer`}>
              <MessageCircle className="size-2.5" />
              {t.noLeidos}
            </span>
          )}
        </div>
        {t.negocio && <p className="truncate text-xs text-muted-foreground">{t.negocio}</p>}
        <div className="mt-1.5 flex items-center gap-2">
          {t.duenoNombre ? <UserAvatar nombre={t.duenoNombre} color={t.duenoColor as ColorPulse | null} className="size-5 text-[9px] ring-0" /> : <span className="size-5 rounded-full border border-dashed" title="Sin dueño" />}
          <span className="text-xs font-medium text-muted-foreground">{usd(t.valor)}</span>
          {viejo && <span className="text-[10px] font-medium text-red-500">{diasEnEtapa(t.etapaDesde, ahora)}d</span>}
          <span className={cn("ml-auto size-2.5 rounded-full", PUNTO[act])} title={TITULO_PUNTO[act]} />
        </div>
      </Link>
    </div>
  );
}
