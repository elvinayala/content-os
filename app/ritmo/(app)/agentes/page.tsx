import { Bot, CircleAlert, FileCheck2, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { AutoRefresco } from "@/components/ritmo/auto-refresco";
import { Tarjeta } from "@/components/ritmo/piezas";
import { AGENTES_IA, ladoAgente, ladoHumano, veces, type Humano, type LadoComparado } from "@/lib/desempeno/agentes-ia";
import { reportesAgentesEntre, salariosPorPersona } from "@/lib/desempeno/agentes-reportes";
import { armarPanel } from "@/lib/desempeno/datos";
import { fechaPR, puestoPorId, sumarDias } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agentes" };

// Equipo digital: el reporte del día de cada agente de IA y la comparación con el puesto humano
// equivalente (últimos 7 días). Solo Elvin, Carilin y Aure (admin/editoras con 2 pasos): es para decidir.
const usd = (n: number | null, dec = 2) => (n === null ? "—" : `US$${n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`);
const num = (n: number | null, suf = "") => (n === null ? "—" : `${n.toLocaleString("es-PR", { maximumFractionDigits: 1 })}${suf}`);
const horas = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, "0")}m` : `${Math.round(min)} min`);

export default async function AgentesPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  if (!u.maestro || (u.rol !== "admin" && u.rol !== "editor")) redirect("/ritmo");
  const hoy = fechaPR(Date.now());
  const desde = sumarDias(hoy, -6);
  const [reportes, panel, salarios] = await Promise.all([reportesAgentesEntre(desde, hoy), armarPanel(u, desde, hoy).catch(() => null), salariosPorPersona()]);

  const deHoy = (id: string) => reportes.find((r) => r.agente === id && r.fecha === hoy) ?? null;
  const hoyTodos = reportes.filter((r) => r.fecha === hoy);
  const tareasHoy = hoyTodos.reduce((n, r) => n + (r.tareas ?? 0), 0);
  const minHoy = hoyTodos.reduce((n, r) => n + r.minutos, 0);
  const costoHoy = hoyTodos.reduce((n, r) => n + r.costoUsd, 0);
  const costo7 = reportes.reduce((n, r) => n + r.costoUsd, 0);

  // Humanos por puesto (del panel de Ritmo): horas por día trabajado, tareas de Producción y salario.
  const humanosDe = (puesto: string): Humano[] =>
    (panel?.filas ?? [])
      .filter((f) => f.perfil.puesto === puesto)
      .map((f) => ({ dias: f.dias.map((d) => ({ horas: d.asistencia.horas, tareas: null })), salarioMensual: salarios.get(f.perfil.userId) ?? null, tareasVentana: f.produccion ? f.produccion.terminadas : null }));

  const filas = AGENTES_IA.map((a) => {
    const ag = ladoAgente(reportes.filter((r) => r.agente === a.id), { sinMedicion: a.sinCosto });
    const hu = ladoHumano(humanosDe(a.comparaCon));
    return { a, ag, hu, puesto: puestoPorId(a.comparaCon)?.nombre ?? a.comparaCon };
  });

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresco segundos={60} />
      <div>
        <p className="ceja">Equipo digital</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Agentes</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Lo que hicieron tus agentes de IA y cómo se comparan con el equipo humano. Cada agente deja su reporte al cierre del día (6:30 PM); lo medible lo pone el sistema. Solo lo ven Elvin, Carilin y Aure.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tarjeta titulo="Tareas hoy" valor={tareasHoy} detalle={`${hoyTodos.filter((r) => r.resumen || (r.agente === "leo" && r.tareas)).length} de ${AGENTES_IA.length} reportaron`} />
        <Tarjeta titulo="Tiempo activo hoy" valor={horas(minHoy)} detalle="Suma de todos los agentes" />
        <Tarjeta titulo="Costo IA hoy" valor={usd(costoHoy)} detalle="Lo que costó la IA" />
        <Tarjeta titulo="Costo IA (7 d)" valor={usd(costo7)} detalle={`${sumarDias(hoy, -6).slice(5)} → ${hoy.slice(5)}`} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Hoy</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {AGENTES_IA.map((a) => {
            const r = deHoy(a.id);
            const resumen = r?.resumen ?? (a.id === "leo" && r?.tareas ? `Revisó ${r.tareas} ${r.tareas === 1 ? "pieza" : "piezas"} del equipo en Slack.` : null);
            return (
              <article key={a.id} className="panel flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-primary/10 text-primary">
                    <Bot className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.rol} · {a.donde}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ring-1", resumen || r?.corridas ? "bg-primary/10 text-primary ring-primary/30" : "bg-white/5 text-muted-foreground ring-white/10")}>
                    {resumen ? "Reportó" : r?.corridas ? "● En vivo" : "Sin actividad"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono text-[11px] text-muted-foreground">
                  <div><p className="tracking-wider uppercase">Tareas</p><p className="num text-base text-foreground">{r?.tareas ?? "—"}</p></div>
                  <div><p className="tracking-wider uppercase">Corridas</p><p className="num text-base text-foreground">{r ? r.corridas : "—"}</p></div>
                  <div><p className="tracking-wider uppercase">Activo</p><p className="num text-base text-foreground">{r ? horas(r.minutos) : "—"}</p></div>
                  <div><p className="tracking-wider uppercase">Costo</p><p className="num text-base text-foreground">{r && !a.sinCosto ? usd(r.costoUsd) : "—"}</p></div>
                </div>
                {resumen ? <p className="text-sm whitespace-pre-line text-foreground/85">{resumen}</p> : <p className="text-sm text-muted-foreground">{r?.corridas ? "Trabajando: los números se actualizan en vivo; el resumen llega al cierre (6:30 PM)." : "Todavía no ha trabajado hoy."}</p>}
                {r?.entregables?.length ? (
                  <ul className="flex flex-col gap-1 text-sm">
                    {r.entregables.map((e, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FileCheck2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        <span className="break-words">{e}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r?.bloqueos ? (
                  <p className="flex items-start gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ring-1 ring-amber-400/25">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0" /> {r.bloqueos}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold">Últimos 7 días · agente vs. humano</h2>
          <p className="text-xs text-muted-foreground">
            Promedio por día activo (debajo del nombre, el total de los 7 días). Humanos: horas del ponche, tareas del tablero Producción y costo = salario ÷ 21.7 días. “—” = todavía no hay ese dato (no se estima).
          </p>
        </div>
        <div className="panel overflow-hidden">
          <div className="hidden grid-cols-[1.3fr_repeat(4,1fr)_0.9fr] gap-3 border-b border-border/60 px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase md:grid">
            <span>Quién</span>
            <span>Tareas / día</span>
            <span>Horas / día</span>
            <span>Costo / día</span>
            <span>Costo / tarea</span>
            <span>Agente vs humano</span>
          </div>
          {filas.map(({ a, ag, hu, puesto }) => {
            const prod = veces(ag.tareasDia, hu.tareasDia);
            const ahorro = veces(hu.costoPorTarea, ag.costoPorTarea);
            return (
              <div key={a.id} className="fila border-b border-border/40 px-4 py-3 last:border-0">
                <Linea icono={<Bot className="size-3.5 text-primary" />} titulo={a.nombre} sub={`${ag.diasActivos} ${ag.diasActivos === 1 ? "día activo" : "días activos"}${ag.totales.tareas !== null || ag.totales.costo !== null ? ` · en 7 días: ${[ag.totales.tareas !== null ? `${ag.totales.tareas} tareas` : null, ag.totales.horas !== null ? `${ag.totales.horas} h` : null, ag.totales.costo !== null ? `US$${ag.totales.costo.toFixed(2)}` : null].filter(Boolean).join(" · ")}` : ""}`} l={ag} />
                <Linea icono={<UserRound className="size-3.5 text-[color:var(--coral)]" />} titulo={puesto} sub={hu.personas ? `${hu.personas} ${hu.personas === 1 ? "persona" : "personas"} · ${hu.diasActivos} días` : "sin personas en Ritmo"} l={hu} tenue
                  extra={
                    <span className="font-mono text-[11px]">
                      {prod !== null ? <span className={prod >= 1 ? "text-primary" : "text-[color:var(--coral)]"}>{prod}× tareas</span> : <span className="text-muted-foreground">—</span>}
                      {ahorro !== null ? <span className="block text-muted-foreground">{ahorro}× más barato/tarea</span> : null}
                    </span>
                  }
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Linea({ icono, titulo, sub, l, tenue, extra }: { icono: React.ReactNode; titulo: string; sub: string; l: LadoComparado; tenue?: boolean; extra?: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-2 items-center gap-x-3 gap-y-1 py-1 text-sm md:grid-cols-[1.3fr_repeat(4,1fr)_0.9fr]", tenue && "text-foreground/75")}>
      <div className="col-span-2 flex min-w-0 items-start gap-2 md:col-span-1">
        <span className="mt-1">{icono}</span>
        <div className="min-w-0">
          <p className="leading-snug font-medium">{titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      <Dato k="Tareas/día" v={num(l.tareasDia)} />
      <Dato k="Horas/día" v={num(l.horasDia, " h")} />
      <Dato k="Costo/día" v={usd(l.costoDia)} />
      <Dato k="Costo/tarea" v={usd(l.costoPorTarea)} />
      <div className="col-span-2 md:col-span-1">{extra ?? null}</div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <p className="num">
      <span className="mr-1.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase md:hidden">{k}</span>
      {v}
    </p>
  );
}
