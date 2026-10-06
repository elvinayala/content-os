import { Activity, ArrowRight, ArrowUpRight, BookOpenCheck, CalendarCheck, CalendarClock, Clock, Crown, CreditCard, FileText, Kanban, Lock, MessageSquare, MoveRight, Plus, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { crearBoardAction } from "@/app/pulse/(app)/actions";
import { BotonBuscar } from "@/components/pulse/boton-buscar";
import { ColorPicker } from "@/components/pulse/color-picker";
import { IconoTablero } from "@/components/pulse/icono-tablero";
import { NumeroInicio } from "@/components/pulse/numero-inicio";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { puedeFormularios } from "@/lib/formularios/reglas";
import { marcasConAcceso } from "@/lib/leads/repo";
import { tipoAcceso, usuarioActual } from "@/lib/pulse/auth";
import type { Pendiente, TipoPendiente } from "@/lib/pulse/mi-dia";
import { pendientesDe } from "@/lib/pulse/mi-dia-datos";
import { actividadReciente, boardsVisibles, clientesInicio, listarBoards, ultimosClientes, type EventoInicio } from "@/lib/pulse/repo";
import { VISTAS } from "@/lib/pulse/inicio-clientes";
import { esAltoValor, type ClienteReciente } from "@/lib/pulse/ultimos-clientes";
import type { ColorPulse } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";

const TZ = "America/Puerto_Rico";

function saludo(): string {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: TZ }));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

function hace(iso: string | null): string {
  if (!iso) return "sin actividad";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

const TIPOS: Record<TipoPendiente, { nombre: string; icono: typeof Clock; tono: string }> = {
  nuevo: { nombre: "Clientes nuevos", icono: UserPlus, tono: "#00a862" },
  onboarding: { nombre: "Onboardings detenidos", icono: Clock, tono: "#e8900c" },
  seguimiento: { nombre: "Seguimientos", icono: CalendarClock, tono: "#3b82f6" },
  reporte: { nombre: "Reportes", icono: FileText, tono: "#8b5cf6" },
};

export default async function PulseInicio() {
  const usuario = await usuarioActual();
  if (!usuario) return null;
  // El equipo de ventas entra directo a Leads: los tableros de clientes no son para ellos.
  if ((await tipoAcceso(usuario.id, usuario.rol)) === "solo_leads") redirect("/pulse/leads");
  const visibles = [...(await boardsVisibles(usuario))];
  const [boards, dia, actividad, numeros, marcas, recientes] = await Promise.all([
    listarBoards(usuario),
    pendientesDe(visibles).catch(() => ({ pendientes: [] as Pendiente[], hoy: "" })),
    actividadReciente(visibles).catch(() => [] as EventoInicio[]),
    clientesInicio(visibles).catch((e) => (console.error("[pulse/inicio] numeros", e), null)),
    marcasConAcceso(usuario).catch(() => []),
    ultimosClientes(visibles).catch((e) => (console.error("[pulse/inicio] ultimos", e), [] as ClienteReciente[])),
  ]);
  const fecha = new Date().toLocaleDateString("es-PR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
  const porTipo = (Object.keys(TIPOS) as TipoPendiente[]).map((t) => ({ t, n: dia.pendientes.filter((p) => p.tipo === t).length }));
  const sop = boards.find((b) => b.slug === "sops-level-up") ?? boards.find((b) => b.slug.startsWith("sops"));
  const atajos = [
    { href: "/pulse/preguntar", titulo: "Preguntarle al CRM", sub: "En español, con la lista", icono: Sparkles },
    ...(marcas.length ? [{ href: "/pulse/leads", titulo: "Leads", sub: "Embudos y WhatsApp", icono: Kanban }] : []),
    ...(puedeFormularios(usuario, process.env.FORMULARIOS_ACCESO || undefined) ? [{ href: "/pulse/formularios", titulo: "Formularios", sub: "Onboarding y encuestas", icono: FileText }] : []),
    ...(sop ? [{ href: `/pulse/${sop.slug}`, titulo: "SOPs", sub: "Procesos del equipo", icono: BookOpenCheck }] : []),
  ].slice(0, 4);

  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Inicio</span>
        <div className="ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8">
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

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
        {/* Saludo + búsqueda */}
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ceja-pulse first-letter:uppercase">{fecha}</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-[34px]">
              {saludo()}, {usuario.nombre.split(" ")[0]}
            </h1>
            <p className="mt-1.5 text-[15px] text-muted-foreground">Esto es lo que está pasando hoy en EA Market.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/api/pase?a=ritmo" className="superficie superficie-hover flex h-11 shrink-0 items-center gap-2 px-4 text-sm font-medium whitespace-nowrap" title="Pasar a Ritmo con la misma sesión">
              <Activity className="size-4 text-emerald-600" /> Ir a Ritmo
            </a>
            <BotonBuscar />
          </div>
        </section>

        {/* Números */}
        {numeros ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {VISTAS.map((v) => (
              <NumeroInicio key={v.id} vista={v.id} titulo={v.titulo} nota={v.nota} total={numeros[v.id].length} muestra={numeros[v.id].slice(0, 6)} destacado={v.id === "nuevos"} />
            ))}
          </section>
        ) : null}

        {/* Últimos clientes */}
        {recientes.length ? <UltimosClientes clientes={recientes} /> : null}

        <section className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="flex min-w-0 flex-col gap-6">
            {/* Tu día */}
            <Panel titulo="Tu día" accion={{ href: "/pulse/mi-dia", texto: "Abrir Mi día" }}>
              <div className="grid grid-cols-2 gap-2 border-b px-5 pb-4 sm:grid-cols-4">
                {porTipo.map(({ t, n }) => {
                  const T = TIPOS[t];
                  return (
                    <div key={t} className="flex flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <T.icono className="size-3.5" style={{ color: T.tono }} /> {T.nombre}
                      </span>
                      <span className="text-xl font-semibold tabular-nums">{n}</span>
                    </div>
                  );
                })}
              </div>
              {dia.pendientes.length ? (
                <ul className="divide-y">
                  {dia.pendientes.slice(0, 5).map((p) => {
                    const T = TIPOS[p.tipo];
                    return (
                      <li key={`${p.itemId}-${p.tipo}`}>
                        <Link href={`/pulse/${p.boardSlug}?item=${p.itemId}`} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-[var(--pulse-hover)]">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${T.tono} 12%, white)`, color: T.tono }}>
                            <T.icono className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{p.nombre}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[p.empresa, T.nombre.toLowerCase()].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nada pendiente hoy. Buen trabajo. 🎉</p>
              )}
            </Panel>

            {/* Actividad */}
            <Panel titulo="Actividad reciente">
              {actividad.length ? (
                <ul className="flex flex-col">
                  {actividad.map((e) => (
                    <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
                      {e.usuario ? <UserAvatar nombre={e.usuario.nombre} color={e.usuario.color as ColorPulse | null} className="mt-0.5 size-7 text-[10px]" /> : <span className="mt-0.5 size-7 shrink-0 rounded-full bg-muted" />}
                      <p className="min-w-0 flex-1 text-[13px] leading-snug text-muted-foreground">
                        <b className="font-medium text-foreground">{e.usuario?.nombre.split(" ")[0] ?? "Alguien"}</b> {verbo(e)}{" "}
                        <Link href={`/pulse/${e.board.slug}?item=${e.item.id}`} className="font-medium text-foreground hover:underline">
                          {e.item.nombre}
                        </Link>
                        {e.tipo === "mover" && e.grupo ? (
                          <>
                            {" "}
                            <MoveRight className="inline size-3.5 align-[-2px]" /> <span className="text-foreground">{e.grupo}</span>
                          </>
                        ) : null}
                        {e.texto ? <span className="mt-0.5 block truncate text-xs italic">“{e.texto}”</span> : null}
                        <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
                          {e.board.nombre} · {hace(e.at)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">Todavía no hay movimiento.</p>
              )}
            </Panel>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            {/* Tableros */}
            <Panel titulo="Espacios de trabajo">
              <ul className="flex flex-col px-2 pb-2">
                {boards.map((b) => (
                  <li key={b.id}>
                    <Link href={`/pulse/${b.slug}`} className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-[var(--pulse-hover)]">
                      <IconoTablero nombre={b.nombre} color={b.color} tam="md" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                          <span className="truncate">{b.nombre}</span>
                          {b.privado ? <Lock className="size-3 shrink-0 text-muted-foreground" /> : null}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {b.items.toLocaleString("en-US")} · {hace(b.actualizadoEl)}
                        </span>
                      </span>
                      <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* Atajos */}
            {atajos.length ? (
              <section className="grid grid-cols-2 gap-3">
                {atajos.map((a) => (
                  <Link key={a.href} href={a.href} className="superficie superficie-hover group flex flex-col gap-3 p-4">
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <a.icono className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{a.titulo}</span>
                      <span className="block text-xs text-muted-foreground">{a.sub}</span>
                    </span>
                  </Link>
                ))}
              </section>
            ) : null}
          </div>
        </section>

        <p className="flex items-center justify-center gap-2 pt-4 text-[11px] text-muted-foreground/80">
          <MessageSquare className="size-3" /> Pulse · el sistema operativo de EA Market
        </p>
      </main>
    </div>
  );
}

function verbo(e: EventoInicio): string {
  if (e.tipo === "crear") return "agregó a";
  if (e.tipo === "mover") return "movió a";
  if (e.tipo === "comentario") return "comentó en";
  return e.columna ? `actualizó «${e.columna}» de` : "actualizó a";
}

function Panel({ titulo, accion, children }: { titulo: string; accion?: { href: string; texto: string }; children: React.ReactNode }) {
  return (
    <section className="superficie overflow-hidden">
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-[15px] font-semibold">{titulo}</h2>
        {accion ? (
          <Link href={accion.href} className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground">
            {accion.texto} <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: n % 1 ? 2 : 0 })}`;
const diaCorto = (iso?: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "short" }).replace(".", "") : "—");

function UltimosClientes({ clientes }: { clientes: ClienteReciente[] }) {
  const total = clientes.reduce((a, c) => a + (c.monto ?? 0), 0);
  const altos = clientes.filter(esAltoValor).length;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold">Últimos clientes</h2>
          <p className="text-xs text-muted-foreground">Los que acaban de entrar, aunque ya estén atendidos.</p>
        </div>
        {total ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{usd(total)}</span> entre estos {clientes.length}
            {altos ? <> · <span className="font-medium text-amber-700">{altos} de alto valor</span></> : null}
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((c) => {
          const alto = esAltoValor(c);
          return (
            <Link
              key={c.itemId}
              href={`/pulse/${c.boardSlug}?item=${c.itemId}`}
              className={`superficie superficie-hover group relative flex flex-col gap-3 overflow-hidden p-4 ${alto ? "ring-1 ring-amber-400/60" : ""}`}
              style={alto ? { background: "linear-gradient(160deg, color-mix(in srgb, #f5b50a 9%, white) 0%, white 55%)" } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.empresa ?? c.grupo}</p>
                </div>
                {alto ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-300/70">
                    <Crown className="size-3" /> Alto valor
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{c.marca}</span>
                )}
              </div>

              <div>
                <p className={`text-2xl leading-none font-semibold tabular-nums ${c.monto ? (alto ? "text-amber-700" : "") : "text-muted-foreground/60"}`}>{c.monto ? usd(c.monto) : "Sin monto"}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">{c.detallePago ?? (c.monto ? "" : "Falta la venta en la ficha")}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {c.nicho ? <span className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/15">{c.nicho}</span> : <span className="text-[11px] text-muted-foreground/70">Sin nicho</span>}
                {alto ? <span className="text-[11px] text-muted-foreground">· {c.marca}</span> : null}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t pt-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CreditCard className="size-3.5" /> Pagó <b className="font-medium text-foreground">{diaCorto(c.pagoEl)}</b>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarCheck className="size-3.5" /> Onboarding <b className="font-medium text-foreground">{diaCorto(c.onboardingEl)}</b>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
