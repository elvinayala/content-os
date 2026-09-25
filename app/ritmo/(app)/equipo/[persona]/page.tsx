import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { diaCorto, EstadoChip, fmtHoras, horaPR, ScoreBadge } from "@/components/ritmo/piezas";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { armarPanel, modoScore } from "@/lib/desempeno/datos";
import { colorScore, fechaPR, sumarDias, type DetalleKpi } from "@/lib/desempeno/reglas";
import { usuarioActual } from "@/lib/pulse/auth";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipo" };

const FUENTE: Record<string, string> = {
  produccion: "Tablero Producción",
  pulse: "Pulse",
  meta: "Meta Ads",
  n8n: "Monitoreo n8n",
  nocodb: "Reportes (NocoDB)",
  chatwoot: "Chatwoot",
  slack: "Slack",
  manual: "Reportado",
};

const fmtValor = (d: DetalleKpi) => (d.valor === null ? "—" : `${d.valor}${d.kpi.unidad === "%" ? "%" : d.kpi.unidad === "min" ? " min" : ""}`);
const fmtMeta = (d: DetalleKpi) => (d.kpi.sentido === "info" ? "—" : `${d.kpi.sentido === "mayor" ? "≥" : "≤"} ${d.kpi.meta}${d.kpi.unidad === "%" ? "%" : d.kpi.unidad === "min" ? " min" : ""}`);

export default async function PersonaPage({ params }: { params: Promise<{ persona: string }> }) {
  const u = await usuarioActual();
  if (!u) return null;
  const { persona } = await params;
  const hoy = fechaPR(Date.now());
  const panel = await armarPanel(u, sumarDias(hoy, -6), hoy);
  const f = panel.filas.find((x) => x.perfil.userId === persona);
  if (!f) notFound();
  const oculto = modoScore(u.rol) === "oculto";
  const lider = f.perfil.liderId ? panel.lideres[f.perfil.liderId] : null;
  const bloqueos = f.dias.filter((d) => d.reporte?.bloqueos).reverse();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Link href="/ritmo/equipo" className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Equipo
      </Link>
        <section className="flex flex-wrap items-center gap-4">
          <UserAvatar nombre={f.perfil.nombre} color={f.perfil.color as ColorPulse | null} className="size-12 text-base" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{f.perfil.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {f.puestoNombre} · {f.departamento}
              {lider ? ` · líder: ${lider}` : ""} · horario {f.perfil.horaEntrada}–{f.perfil.horaSalida} PR
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Hoy</p>
              <ScoreBadge score={f.hoy.score.score} color={f.hoy.color} oculto={oculto} className="mt-1" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Semana</p>
              <ScoreBadge score={f.scoreSemana} color={f.colorSemana} oculto={oculto} className="mt-1" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden panel">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">KPIs de hoy</h2>
            <p className="text-xs text-muted-foreground">Asistencia vale 20 %; los KPIs medidos, 80 %. Los que todavía no están conectados no cuentan.</p>
          </header>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-2 font-medium">KPI</th>
                <th className="px-2 py-2 text-right font-medium">Valor</th>
                <th className="px-2 py-2 text-right font-medium">Meta</th>
                {!oculto ? <th className="px-2 py-2 text-right font-medium">Puntos</th> : null}
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-2.5">Asistencia y puntualidad</td>
                <td className="px-2 py-2.5 text-right"><EstadoChip estado={f.hoy.asistencia.estado} /></td>
                <td className="px-2 py-2.5 text-right text-muted-foreground">{f.perfil.horaEntrada} ± 15 min</td>
                {!oculto ? <td className="px-2 py-2.5 text-right tabular-nums">{f.hoy.asistencia.puntaje ?? "—"}</td> : null}
                <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">Ponche</td>
              </tr>
              {f.hoy.score.kpis.map((d) => (
                <tr key={d.kpi.id} className={cn(!d.conectado && "text-muted-foreground")}>
                  <td className="px-4 py-2.5" title={d.kpi.ayuda}>{d.kpi.nombre}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{d.conectado ? fmtValor(d) : "—"}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{fmtMeta(d)}</td>
                  {!oculto ? (
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {d.puntaje === null ? "—" : <span className={cn(colorScore(d.puntaje) === "rojo" && "text-red-400", colorScore(d.puntaje) === "amarillo" && "text-amber-300")}>{d.puntaje}</span>}
                    </td>
                  ) : null}
                  <td className="hidden px-4 py-2.5 sm:table-cell">{d.conectado ? FUENTE[d.kpi.fuente] : <span className="text-xs">{FUENTE[d.kpi.fuente]} · por conectar</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden panel">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Últimos 7 días</h2>
          </header>
          <ul className="divide-y text-sm">
            {[...f.dias].reverse().map((d) => (
              <li key={d.fecha} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <span className="w-16 font-medium capitalize">{diaCorto(d.fecha)}</span>
                <EstadoChip estado={d.asistencia.estado} extra={d.asistencia.minutosTarde > 15 ? `${d.asistencia.minutosTarde} min` : undefined} />
                <span className="text-muted-foreground tabular-nums">
                  {d.asistencia.entrada ? `${horaPR(d.asistencia.entrada)} – ${d.asistencia.estado === "trabajando" ? "ahora" : horaPR(d.asistencia.salida)} · ${fmtHoras(d.asistencia.horas)}` : ""}
                  {d.asistencia.sinSalida ? " · sin salida" : ""}
                  {d.asistencia.correccionPendiente ? " · corrección por confirmar" : ""}
                </span>
                {d.reporte && Object.keys(d.reporte.datos).length ? (
                  <span className="text-xs text-muted-foreground">{Object.entries(d.reporte.datos).map(([k, v]) => `${v} ${k === "reuniones_cliente" ? "reuniones" : k}`).join(" · ")}</span>
                ) : null}
                <span className="ml-auto">
                  <ScoreBadge score={d.score.score} color={d.color} oculto={oculto} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        {f.produccion && (f.produccion.asignadas || f.produccion.vencidasPedidas) ? (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Asignadas (7 d)", f.produccion.asignadas],
              ["Terminadas", f.produccion.terminadas],
              ["A tiempo", f.produccion.entregas ? `${f.produccion.entregasATiempo}/${f.produccion.entregas}` : "—"],
              ["Revisiones", f.produccion.revisiones],
              ["Vencidas", f.produccion.vencidas],
              ["En cola", f.produccion.backlog],
              ["Pedidas y vencidas", f.produccion.vencidasPedidas],
              ["Se autoaprobó", f.produccion.autoaprobadas],
            ].map(([t, v]) => (
              <div key={t as string} className="panel rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground uppercase">{t}</p>
                <p className="text-lg font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section className="panel p-4">
          <h2 className="mb-2 text-sm font-semibold">Bloqueos reportados</h2>
          {bloqueos.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {bloqueos.map((d) => (
                <li key={d.fecha} className="rounded-lg bg-amber-400/10 px-3 py-2">
                  <span className="mr-2 text-xs font-medium text-amber-300 capitalize">{diaCorto(d.fecha)}</span>
                  <span className="whitespace-pre-line">{d.reporte!.bloqueos}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Ninguno esta semana.</p>
          )}
        </section>
    </div>
  );
}
