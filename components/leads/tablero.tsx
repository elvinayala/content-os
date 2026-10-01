"use client";

import { DndContext, DragOverlay, MeasuringStrategy, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CalendarClock, ChevronDown, Download, Kanban, List, MessageCircle, Plus, Repeat2, Search, Settings2, Trophy, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { cerrarLeadAction, moverLeadAction, pedirExportacionAction } from "@/app/pulse/(app)/leads/actions";
import { EmbudoDialog, NuevoEmbudoDialog, NuevoLeadDialog, PerdidoDialog, type EmbudoUI, type EtapaUI, type UsuarioUI } from "@/components/leads/dialogos";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { diasEnEtapa, esEtapaGrupos, estadoActividad, estancado, FILTROS_FECHA, horaLlegada, normalizarReparto, type FiltroFecha, type Marca } from "@/lib/leads/reglas";
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
  creadoEl: string;
  nicho: string | null;
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
  exportar = null,
  manejaEquipo = false,
  fecha = null,
  equipoReparto = [],
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
  exportar?: "directo" | "con_ok" | null;
  manejaEquipo?: boolean;
  fecha?: FiltroFecha | null;
  equipoReparto?: UsuarioUI[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [nuevo, setNuevo] = useState(false);
  const [editar, setEditar] = useState(false);
  const [soloReparto, setSoloReparto] = useState(false);
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
        <div className="flex rounded-lg bg-muted p-0.5">
          {[
            { v: "embudo", icon: Kanban, href: base, t: "Embudo" },
            { v: "lista", icon: List, href: `${base}/lista`, t: "Lista" },
            { v: "actividades", icon: CalendarClock, href: `${base}/actividades`, t: "Actividades" },
          ].map((b) => (
            <Link
              key={b.v}
              href={`${b.href}${embudoId ? `?embudo=${embudoId}` : ""}`}
              title={b.t}
              className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition", vista === b.v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
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
              <Button variant="outline" size="sm" className="h-8 max-w-64 gap-1.5 font-semibold">
                <span className="size-2 shrink-0 rounded-full bg-[#08a742]" />
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
              {(puedeEditar || manejaEquipo) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setSoloReparto(true);
                      setEditar(true);
                    }}
                  >
                    <Repeat2 className="size-4" /> Reparto de leads
                  </DropdownMenuItem>
                </>
              )}
              {puedeEditar && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      setSoloReparto(false);
                      setEditar(true);
                    }}
                  >
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
          {vista !== "actividades" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {FILTROS_FECHA.find((f) => f.id === fecha)?.nombre ?? "Cualquier fecha"}
                  <ChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="pulse w-56" align="end">
                <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Leads que llegaron o tienen cita o seguimiento ese día.</p>
                <DropdownMenuItem onSelect={() => ir({ fecha: null })} className={cn(!fecha && "font-semibold")}>
                  Cualquier fecha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {FILTROS_FECHA.map((f) => (
                  <DropdownMenuItem key={f.id} onSelect={() => ir({ fecha: f.id })} className={cn(fecha === f.id && "font-semibold")}>
                    {f.nombre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
          {(puedeEditar || manejaEquipo) && vista !== "actividades" && embudo && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              title={`Quién recibe los leads nuevos de ${embudo.nombre}`}
              onClick={() => {
                setSoloReparto(true);
                setEditar(true);
              }}
            >
              <Repeat2 className="size-4" />
              <span className="hidden sm:inline">Reparto</span>
            </Button>
          )}
          {manejaEquipo && (
            <Button asChild variant="outline" size="sm" className="h-8 gap-1" title="Quién entra a Leads">
              <Link href={`${base}/equipo`}>
                <Users className="size-4" />
                <span className="hidden sm:inline">Equipo</span>
              </Link>
            </Button>
          )}
          {exportar && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1" title="Exportar a Excel">
                  <Download className="size-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="pulse w-72" align="end">
                {exportar === "con_ok" ? <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Cada exportación la aprueba Elvin. Te avisamos por Slack con el link para bajarla (24 h, una vez).</p> : null}
                {(() => {
                  // Respeta lo que estás viendo: dueño y búsqueda (como "Exportar resultados del filtro" de Pipedrive).
                  const estadoVista = vista === "lista" ? (sp.get("estado") ?? "abierto") : "abierto";
                  const opciones = [
                    ...(embudo
                      ? [
                          { t: `${embudo.nombre} · lo que ves`, sub: estadoVista === "todos" ? "abiertos, ganados y perdidos" : `${estadoVista}s`, embudoSel: embudo.id, estado: estadoVista },
                          { t: `${embudo.nombre} · todo`, sub: "abiertos, ganados y perdidos", embudoSel: embudo.id, estado: "todos" },
                        ]
                      : []),
                    { t: "Todos los embudos · abiertos", sub: marcaNombre, embudoSel: "todos", estado: "abierto" },
                    { t: "Todos los embudos · todo", sub: `${marcaNombre}: abiertos, ganados y perdidos`, embudoSel: "todos", estado: "todos" },
                  ];
                  const url = (embudoSel: string, estado: string) => {
                    const p = new URLSearchParams();
                    p.set("embudo", embudoSel);
                    p.set("estado", estado);
                    if (dueno) p.set("dueno", dueno);
                    if (sp.get("q")) p.set("q", sp.get("q")!);
                    return `${base}/exportar?${p.toString()}`;
                  };
                  const pedir = async (embudoSel: string, estado: string) => {
                    const r = await pedirExportacionAction({ marca, embudoId: embudoSel === "todos" ? null : embudoSel, estado, dueno: dueno || null, q: sp.get("q") ?? "" });
                    if (!r.ok) return toast.error(r.error ?? "No se pudo pedir", { className: "pulse" });
                    toast.success("Enviado a Elvin para aprobar", { className: "pulse", description: "Te llega por Slack el link para bajarlo." });
                  };
                  const conFiltro = dueno || sp.get("q") ? " · con tu filtro" : "";
                  return opciones.map((o) =>
                    exportar === "directo" ? (
                      <DropdownMenuItem key={o.t} asChild>
                        <a href={url(o.embudoSel, o.estado)} download className="flex flex-col items-start gap-0">
                          <span className="text-sm">{o.t}</span>
                          <span className="text-[11px] text-muted-foreground">{o.sub}{conFiltro}</span>
                        </a>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem key={o.t} onSelect={() => pedir(o.embudoSel, o.estado)} className="flex flex-col items-start gap-0">
                        <span className="text-sm">Pedir: {o.t}</span>
                        <span className="text-[11px] text-muted-foreground">{o.sub}{conFiltro}</span>
                      </DropdownMenuItem>
                    ),
                  );
                })()}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/pulse/leads/exportaciones">{exportar === "directo" ? "Solicitudes de exportación" : "Mis exportaciones"}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
      {embudo && editar && <EmbudoDialog abierto={editar} onCerrar={() => setEditar(false)} embudo={embudo} etapas={etapas} equipo={equipoReparto} soloReparto={soloReparto} />}
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

  // "Grupos" (grupos de WhatsApp de citas) va aparte: angosta, al final y fuera de los totales.
  const idsGrupos = useMemo(() => new Set(etapas.filter((e) => esEtapaGrupos(e.nombre)).map((e) => e.id)), [etapas]);
  const columnas = useMemo(() => [...etapas.filter((e) => !idsGrupos.has(e.id)), ...etapas.filter((e) => idsGrupos.has(e.id))], [etapas, idsGrupos]);
  const leads = tratos.filter((t) => !idsGrupos.has(t.etapaId));
  const reparto = normalizarReparto(embudo.reparto);
  const total = leads.reduce((s, t) => s + t.valor, 0);
  const resumen = useMemo(() => {
    const hoy = leads.filter((t) => horaLlegada(t.creadoEl, ahora).startsWith("hoy")).length;
    const estados = leads.map((t) => estadoActividad(t.proximaActividad, ahora));
    return {
      hoy,
      sinSeguimiento: estados.filter((e) => e === "ninguna").length,
      vencidos: estados.filter((e) => e === "vencida").length,
      sinLeer: leads.filter((t) => t.noLeidos > 0).length,
    };
  }, [leads, ahora]);

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
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f7f9]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 text-xs text-muted-foreground">
        <span>
          <b className="text-[15px] font-semibold text-foreground tabular-nums">{leads.length}</b> {leads.length === 1 ? "lead abierto" : "leads abiertos"}
          {total ? <> · <b className="font-semibold text-foreground">{usd(total)}</b></> : null}
        </span>
        <Dato color="#08a742" n={resumen.hoy} texto="llegaron hoy" />
        <Dato color="#25d366" n={resumen.sinLeer} texto="con mensajes sin leer" />
        <Dato color="#ef4444" n={resumen.vencidos} texto="seguimientos vencidos" />
        <Dato color="#f59e0b" n={resumen.sinSeguimiento} texto="sin seguimiento" />
        {reparto.modo !== "ninguno" ? (
          <span className="ml-auto inline-flex items-center gap-1.5" title="Quién recibe los leads nuevos que llegan sin dueño">
            <Repeat2 className="size-3.5" />
            {reparto.modo === "rotacion" ? "Rotación" : "Van a"}:{" "}
            <b className="font-medium text-foreground">{reparto.personas.map((id) => usuarios.find((u) => u.id === id)?.nombre.split(" ")[0] ?? "—").join(" → ")}</b>
          </span>
        ) : null}
      </div>
      <DndContext id="leads-tablero" measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setArrastrando(null)}>
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-24">
          {columnas.map((e, i) => (
            <Columna
              key={e.id}
              etapa={e}
              color={COLORES_ETAPA[i % COLORES_ETAPA.length]}
              grupos={idsGrupos.has(e.id)}
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

// Un color por etapa (en orden), para que el embudo se lea de un vistazo.
const COLORES_ETAPA = ["#08a742", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#f97316", "#14b8a6"];

function Dato({ color, n, texto }: { color: string; n: number; texto: string }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      <b className="font-semibold text-foreground tabular-nums">{n}</b> {texto}
    </span>
  );
}

function Columna({ etapa, color, grupos, tratos, diasEstancado, ahora, marcaSlug, onNuevo }: { etapa: EtapaUI; color: string; grupos?: boolean; tratos: TarjetaUI[]; diasEstancado: number; ahora: Date; marcaSlug: string; onNuevo: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id });
  const suma = tratos.reduce((s, t) => s + t.valor, 0);
  if (grupos) {
    // Columna pequeña: solo el nombre del grupo (la cita), sin montos ni seguimiento.
    return (
      <section ref={setNodeRef} className={cn("flex w-44 shrink-0 flex-col rounded-xl border border-dashed bg-background/60 transition-colors", isOver && "bg-muted")}>
        <header className="flex items-center gap-1.5 px-2.5 py-2">
          <Users className="size-3.5 text-muted-foreground" />
          <h3 className="text-[12px] font-semibold">{etapa.nombre}</h3>
          <span className="ml-auto rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{tratos.length}</span>
        </header>
        <div className="flex min-h-12 flex-1 flex-col gap-1 overflow-y-auto px-1.5 pb-2">
          {tratos.map((t) => (
            <Link key={t.id} href={`/pulse/leads/${marcaSlug}/${t.id}`} className="cursor-pointer truncate rounded-md border bg-background px-2 py-1 text-[11px] leading-tight text-muted-foreground hover:text-foreground" title={t.nombre}>
              {t.nombre}
            </Link>
          ))}
          {!tratos.length && <p className="px-1 text-[10px] text-muted-foreground/70">Los grupos de WhatsApp de las citas caen aquí solos.</p>}
        </div>
      </section>
    );
  }
  return (
    <section
      ref={setNodeRef}
      className={cn("flex w-[272px] shrink-0 flex-col rounded-xl bg-[#eceef1]/70 transition-colors", isOver && "bg-[#e3f4e8] ring-2 ring-[#08a742]/30")}
    >
      <header className="group/cab relative m-1.5 mb-2 overflow-hidden rounded-lg bg-background px-3 pt-2.5 pb-2 shadow-[0_1px_2px_rgba(16,24,40,.06)]">
        <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={etapa.nombre}>
            {etapa.nombre}
          </h3>
          <span className="rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums" style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}>
            {tratos.length}
          </span>
          <button onClick={onNuevo} className="grid size-6 place-items-center rounded-md text-muted-foreground opacity-0 transition group-hover/cab:opacity-100 hover:bg-muted hover:text-foreground" aria-label={`Nuevo lead en ${etapa.nombre}`} title="Agregar lead aquí">
            <Plus className="size-3.5" />
          </button>
        </div>
        {suma ? <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{usd(suma)}</p> : null}
      </header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-1.5 pb-2">
        {tratos.map((t) => (
          <Tarjeta key={t.id} t={t} diasEstancado={diasEstancado} ahora={ahora} marcaSlug={marcaSlug} />
        ))}
        {!tratos.length && (
          <button
            onClick={onNuevo}
            className="flex h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-foreground/10 text-[11px] text-muted-foreground/70 transition hover:border-foreground/20 hover:bg-background/60 hover:text-muted-foreground"
          >
            <Plus className="size-4" />
            Arrastra un lead aquí o agrégalo
          </button>
        )}
      </div>
    </section>
  );
}

const SEGUIMIENTO: Record<string, { texto: string; clase: string; titulo: string }> = {
  ninguna: { texto: "Sin seguimiento", clase: "bg-amber-50 text-amber-700 ring-amber-200", titulo: "No tiene seguimiento programado" },
  vencida: { texto: "Vencido", clase: "bg-red-50 text-red-600 ring-red-200", titulo: "El seguimiento ya pasó" },
  hoy: { texto: "Hoy", clase: "bg-green-50 text-[#08a742] ring-green-200", titulo: "Seguimiento hoy" },
  futura: { texto: "", clase: "bg-muted text-muted-foreground ring-transparent", titulo: "Seguimiento programado" },
};

const ORIGEN: Record<string, { texto: string; color: string }> = {
  whatsapp: { texto: "WhatsApp", color: "#25d366" },
  calendly: { texto: "Calendly", color: "#006bff" },
  quiz: { texto: "Quiz", color: "#a855f7" },
  formulario: { texto: "Formulario", color: "#0ea5e9" },
  manual: { texto: "Manual", color: "#94a3b8" },
};

const COLORES_AVATAR = ["#08a742", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#f97316", "#14b8a6", "#64748b"];

function colorDe(texto: string): string {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES_AVATAR[h % COLORES_AVATAR.length];
}

function telefonoCorto(tel: string | null): string | null {
  const d = (tel ?? "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : tel;
}

function Tarjeta({ t, diasEstancado, ahora, marcaSlug, fantasma }: { t: TarjetaUI; diasEstancado: number; ahora: Date; marcaSlug: string; fantasma?: boolean }) {
  const drag = useDraggable({ id: t.id });
  const drop = useDroppable({ id: `card:${t.id}` });
  const act = estadoActividad(t.proximaActividad, ahora);
  const viejo = estancado(t.etapaDesde, diasEstancado, ahora);
  // Hay contactos de WhatsApp cuyo nombre es solo un emoji: el teléfono los identifica.
  const conLetras = /\p{L}/u.test(t.nombre);
  const titulo = conLetras ? t.nombre : (telefonoCorto(t.telefono) ?? t.nombre);
  const letras = conLetras ? t.nombre.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("") : "";
  const seg = SEGUIMIENTO[act];
  const origen = ORIGEN[t.origen];
  const fechaSeg = act === "futura" && t.proximaActividad ? new Date(t.proximaActividad).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" }).replace(".", "") : "";
  return (
    <div
      ref={(n) => {
        drag.setNodeRef(n);
        drop.setNodeRef(n);
      }}
      {...drag.attributes}
      {...drag.listeners}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-black/[0.06] bg-background shadow-[0_1px_2px_rgba(16,24,40,.05)] transition hover:-translate-y-px hover:border-black/10 hover:shadow-[0_4px_12px_rgba(16,24,40,.08)] active:cursor-grabbing",
        viejo && "border-l-[3px] border-l-red-400",
        drag.isDragging && !fantasma && "opacity-30",
        drop.isOver && !drag.isDragging && "ring-2 ring-[#08a742]/50",
        fantasma && "w-[260px] rotate-2 shadow-xl",
      )}
    >
      <Link href={`/pulse/leads/${marcaSlug}/${t.id}`} className="block cursor-pointer p-3" draggable={false} onClick={(e) => drag.isDragging && e.preventDefault()}>
        <div className="flex items-start gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white uppercase"
            style={{ background: conLetras ? colorDe(t.nombre) : "#e5e7eb" }}
          >
            {letras || <span className="text-sm leading-none">{t.nombre.trim().slice(0, 2) || "·"}</span>}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="min-w-0 flex-1 truncate text-[13px] leading-tight font-semibold">{titulo}</p>
              {t.noLeidos > 0 && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-[#25d366] px-1.5 py-px text-[10px] font-bold text-white" title={`${t.noLeidos} mensaje(s) sin leer`}>
                  <MessageCircle className="size-2.5" />
                  {t.noLeidos}
                </span>
              )}
            </div>
            {t.negocio || t.nicho ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.negocio ?? t.nicho}</p> : null}
            <p className="mt-1 flex items-center gap-1 text-[10.5px] text-muted-foreground/80" title={new Date(t.creadoEl).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" })}>
              {origen ? <span className="size-1.5 shrink-0 rounded-full" style={{ background: origen.color }} title={origen.texto} /> : null}
              Llegó {horaLlegada(t.creadoEl, ahora)}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-dashed border-black/[0.06] pt-2">
          {t.duenoNombre ? (
            <span className="flex min-w-0 items-center gap-1.5" title={`Dueño: ${t.duenoNombre}`}>
              <UserAvatar nombre={t.duenoNombre} color={t.duenoColor as ColorPulse | null} className="size-5 text-[9px] ring-0" />
              <span className="truncate text-[11px] text-muted-foreground">{t.duenoNombre.split(" ")[0]}</span>
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/60">Sin dueño</span>
          )}
          {t.valor ? <span className="text-[11px] font-semibold text-foreground tabular-nums">{usd(t.valor)}</span> : null}
          {viejo && <span className="text-[10px] font-medium text-red-500" title="Días en esta etapa">{diasEnEtapa(t.etapaDesde, ahora)}d</span>}
          <span className={cn("ml-auto shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium ring-1", seg.clase)} title={seg.titulo}>
            {seg.texto || fechaSeg}
          </span>
        </div>
      </Link>
    </div>
  );
}
