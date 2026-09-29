import { CircleAlert, FileCheck2 } from "lucide-react";
import { redirect } from "next/navigation";

import { AutoRefresco } from "@/components/ritmo/auto-refresco";
import { Oficina, type AgenteOficina } from "@/components/ritmo/oficina";
import { AGENTES_IA, burbuja, estadoOficina, ladoAgente, ladoHumano, pantalla, veces, type Humano } from "@/lib/desempeno/agentes-ia";
import { cafesDe, CON_BUZON_CAFE, DIRECCION, ejecutivos, marcarPresencia, puedeCafe, reportesAgentesEntre, salariosPorPersona, ultimosMensajes } from "@/lib/desempeno/agentes-reportes";
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
const COLOR_AGENTE: Record<string, string> = { sofi: "#f472b6", nico: "#34d399", max: "#f5ce1a", lola: "#fb923c", iris: "#a78bfa", leo: "#60a5fa", remi: "#22d3ee" };
const horas = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, "0")}m` : `${Math.round(min)} min`);

export default async function AgentesPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  if (!u.maestro || (u.rol !== "admin" && u.rol !== "editor")) redirect("/ritmo");
  const hoy = fechaPR(Date.now());
  const desde = sumarDias(hoy, -6);
  await marcarPresencia(u.id).catch(() => null);
  // Rincón del café: quién soy en el buzón (elvin | carilin | aure) y mis cafés de las últimas 24 h.
  const correo = u.email.toLowerCase();
  const yo = correo === DIRECCION.ceo ? "elvin" : correo === DIRECCION.carilin ? "carilin" : correo === DIRECCION.aure ? "aure" : null;
  const cafe = { yo, permitidos: yo ? CON_BUZON_CAFE.filter((a) => puedeCafe(yo, a)) : [], conversacion: yo ? await cafesDe(yo) : [] } as const;
  const [reportes, panel, salarios, dichos, dire] = await Promise.all([reportesAgentesEntre(desde, hoy), armarPanel(u, desde, hoy).catch(() => null), salariosPorPersona(), ultimosMensajes(AGENTES_IA.map((a) => a.id)), ejecutivos(u.email)]);

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

  // Oficina virtual: dónde está cada agente, qué dice su pantalla y lo último que dijo.
  const ahora = Date.now();
  const hace = (iso: string) => {
    const min = Math.max(0, Math.round((ahora - Date.parse(iso)) / 60000));
    return min < 60 ? `hace ${min} min` : min < 1440 ? `hace ${Math.round(min / 60)} h` : "ayer";
  };
  const oficina: AgenteOficina[] = AGENTES_IA.map((a) => {
    const r = deHoy(a.id);
    const d = dichos[a.id];
    const texto = burbuja(d?.texto);
    return {
      id: a.id,
      nombre: a.nombre,
      rol: a.rol,
      color: COLOR_AGENTE[a.id] ?? "#7dd3fc",
      foto: a.id === "max" ? "/marcas/max/max-avatar-v3-512.png" : null,
      estado: estadoOficina(r ? { corridas: r.corridas, tareas: r.tareas, actualizado: r.updatedAt.toISOString() } : null, ahora),
      pantalla: pantalla(r?.resumen) ?? (a.id === "leo" && r?.tareas ? `Revisó ${r.tareas} piezas del equipo` : null),
      dijo: d && texto ? { para: d.para, texto, hace: hace(d.creado) } : null,
      tareas: r?.tareas ?? null,
      corridas: r?.corridas ?? 0,
      minutos: r?.minutos ?? 0,
      costo: a.sinCosto ? null : (r?.costoUsd ?? 0),
      resumen: r?.resumen ?? null,
      entregables: r?.entregables ?? [],
      bloqueos: r?.bloqueos ?? null,
    };
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

      <Oficina agentes={oficina} ejecutivos={dire} cafe={{ ...cafe, permitidos: [...cafe.permitidos], conversacion: [...cafe.conversacion] }} kpis={{ tareas: tareasHoy, minutos: minHoy, costo: costoHoy, activos: oficina.filter((x) => x.estado !== "descansando").length }} />

      {/* resumen en una línea (la TV de la oficina ya enseña lo de hoy) */}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span><b className="num text-foreground">{tareasHoy}</b> tareas hoy</span>
        <span><b className="num text-foreground">{horas(minHoy)}</b> activos</span>
        <span><b className="num text-foreground">{usd(costoHoy)}</b> de IA hoy</span>
        <span><b className="num text-foreground">{usd(costo7)}</b> en 7 días</span>
        <span>{hoyTodos.filter((r) => r.resumen || (r.agente === "leo" && r.tareas)).length} de {AGENTES_IA.length} reportaron</span>
      </p>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold">Hoy, uno por uno</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {AGENTES_IA.map((a) => {
            const r = deHoy(a.id);
            const resumen = r?.resumen ?? (a.id === "leo" && r?.tareas ? `Revisó ${r.tareas} ${r.tareas === 1 ? "pieza" : "piezas"} del equipo en Slack.` : null);
            const activo = !!(r?.corridas || r?.tareas); // "Sin actividad hoy" también es un reporte: no cuenta como activo
            return (
              <article key={a.id} className={cn("panel flex flex-col gap-2 p-3.5", !activo && "opacity-60")}>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold text-background" style={{ background: COLOR_AGENTE[a.id] ?? "#7dd3fc" }}>
                    {a.nombre[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-semibold">{a.nombre}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{a.rol}</p>
                  </div>
                  <span className={cn("size-2 shrink-0 rounded-full", activo ? "bg-primary shadow-[0_0_8px_var(--neon)]" : "bg-white/20")} title={activo ? "Trabajó hoy" : "Sin actividad"} />
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  <b className="text-foreground">{r?.tareas ?? "—"}</b> tareas · <b className="text-foreground">{r?.corridas ?? 0}</b> corridas · <b className="text-foreground">{r ? horas(r.minutos) : "—"}</b>
                  {!a.sinCosto ? <> · <b className="text-foreground">{r ? usd(r.costoUsd) : "—"}</b></> : null}
                </p>
                {resumen ? (
                  <details className="group text-[13px] leading-snug text-foreground/85">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="line-clamp-2 group-open:line-clamp-none">{resumen}</span>
                      <span className="mt-1 inline-flex gap-2 text-[11px] text-muted-foreground">
                        {r?.entregables?.length ? <span className="text-primary">✓ {r.entregables.length} entregable{r.entregables.length === 1 ? "" : "s"}</span> : null}
                        {r?.bloqueos ? <span className="text-amber-300">⚠ bloqueo</span> : null}
                        <span className="group-open:hidden">ver más</span>
                      </span>
                    </summary>
                    {r?.entregables?.length ? (
                      <ul className="mt-2 flex flex-col gap-1 text-[12px]">
                        {r.entregables.map((e, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <FileCheck2 className="mt-0.5 size-3 shrink-0 text-primary" />
                            <span className="break-words">{e}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {r?.bloqueos ? (
                      <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[12px] text-amber-200 ring-1 ring-amber-400/25">
                        <CircleAlert className="mt-0.5 size-3 shrink-0" /> {r.bloqueos}
                      </p>
                    ) : null}
                  </details>
                ) : (
                  <p className="text-[12px] text-muted-foreground">{r?.corridas ? "Trabajando: el resumen llega al cierre (6:30 PM)." : "Todavía no ha trabajado hoy."}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div>
          <h2 className="text-sm font-semibold">Últimos 7 días · agente vs. humano</h2>
          <p className="text-xs text-muted-foreground">Promedio por día que trabajó. Debajo, en gris, el puesto humano que hace lo mismo. “—” = todavía no hay ese dato.</p>
        </div>
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              <tr className="border-b border-border/60">
                <th className="px-3 py-2 text-left font-normal">Agente</th>
                <th className="px-3 py-2 text-right font-normal">Tareas/día</th>
                <th className="px-3 py-2 text-right font-normal">Horas/día</th>
                <th className="px-3 py-2 text-right font-normal">Costo/día</th>
                <th className="px-3 py-2 text-right font-normal">Costo/tarea</th>
                <th className="px-3 py-2 text-right font-normal">vs. humano</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(({ a, ag, hu, puesto }) => {
                const prod = veces(ag.tareasDia, hu.tareasDia);
                const ahorro = veces(hu.costoPorTarea, ag.costoPorTarea);
                const celda = (agente: string, humano: string) => (
                  <td className="px-3 py-2 text-right align-top">
                    <span className="num block font-mono">{agente}</span>
                    <span className="num block font-mono text-[11px] text-muted-foreground/70">{humano}</span>
                  </td>
                );
                return (
                  <tr key={a.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 align-top">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: COLOR_AGENTE[a.id] ?? "#7dd3fc" }} />
                        <b className="font-medium">{a.nombre}</b>
                        <span className="text-[11px] text-muted-foreground">{ag.diasActivos} {ag.diasActivos === 1 ? "día" : "días"}</span>
                      </span>
                      <span className="block pl-4 text-[11px] text-muted-foreground/70">{puesto}{hu.personas ? ` · ${hu.personas} ${hu.personas === 1 ? "persona" : "personas"}` : " · sin personas en Ritmo"}</span>
                    </td>
                    {celda(num(ag.tareasDia), num(hu.tareasDia))}
                    {celda(num(ag.horasDia, " h"), num(hu.horasDia, " h"))}
                    {celda(usd(ag.costoDia), usd(hu.costoDia))}
                    {celda(usd(ag.costoPorTarea), usd(hu.costoPorTarea))}
                    <td className="px-3 py-2 text-right align-top font-mono text-[11px]">
                      {prod !== null ? <span className={cn("block", prod >= 1 ? "text-primary" : "text-[color:var(--coral)]")}>{prod}× tareas</span> : <span className="block text-muted-foreground">—</span>}
                      {ahorro !== null ? <span className="block text-muted-foreground">{ahorro}× más barato</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
