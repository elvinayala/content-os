import Link from "next/link";
import { redirect } from "next/navigation";

import { Alerta, Bonos, MiDiario } from "@/components/ritmo/arena";
import { Avatar, BarraMeta, CarreraVivo, MarcadorEquipo, Pulso } from "@/components/ritmo/arena-vivo";
import { MiMarcador, usd } from "@/components/ritmo/arena-marcador";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { accesoArena, armarArena, bonosDe } from "@/lib/ventas/datos";
import { CLOSE_RATE, ESCALONES_DIRECTOR, escalones, KPIS_VENTAS, METAS_DIARIAS, RANGOS, rankingVentas, TASAS_VENTAS, tasasVentas, type Empresa, type Nivel, type RolVentas } from "@/lib/ventas/reglas";
import { cn } from "@/lib/utils";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Arena" };

const NOMBRE: Record<Empresa, string> = { level_up: "Level Up", ai_borinquen: "AI Borinquen" };
const ROLES: { id: RolVentas; t: string }[] = [
  { id: "closer", t: "Closers" },
  { id: "setter", t: "Setters" },
  { id: "chatter", t: "Chatters" },
];

// Arena: ventas dentro de Ritmo (closers, setters y chatters de LU y AIB). Sin ponche: todo resultados.
// La carrera muestra cash collected de cada uno; la comisión es privada (cada quien la suya; el director y
// la dirección ven la de todos). Diseño: vault/proyectos/ritmo/arena-ventas.md.
export default async function ArenaPage({ searchParams }: { searchParams: Promise<{ e?: string; r?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const a = await accesoArena(u);
  if (!a.empresas.length) redirect("/ritmo");
  const sp = await searchParams;
  const pedida = sp.e as Empresa | undefined;
  const empresa = pedida && a.empresas.includes(pedida) ? pedida : a.empresas[0];
  const [ar, bonosFilas] = await Promise.all([armarArena(u, a, empresa, sp.r), bonosDe(empresa).catch(() => [])]);
  // Rango de los KPIs (6/oct, Elvin): hoy, ayer, últimos 7/30 días, este mes o el pasado. Comisiones y carrera siguen siendo del mes.
  const rangos = (ancla: string) => RANGOS.map((x) => ({ id: x.id, t: x.t, href: `/ritmo/arena?${a.empresas.length > 1 ? `e=${empresa}&` : ""}r=${x.id}${ancla ? `#${ancla}` : ""}` }));
  const hoyD = new Date(`${ar.hoy}T12:00:00Z`);
  const mesNombre = hoyD.toLocaleDateString("es-PR", { month: "long", year: "numeric", timeZone: "UTC" }).replace(/^./, (c) => c.toUpperCase());
  const diasFaltan = new Date(Date.UTC(hoyD.getUTCFullYear(), hoyD.getUTCMonth() + 1, 0)).getUTCDate() - hoyD.getUTCDate();
  const d = await db();
  const nombres = new Map((await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers)).map((x) => [x.id, x.nombre]));
  const gestiona = a.director || a.direccion;
  const e = ar.equipo;
  const ayer = new Date(Date.parse(`${ar.hoy}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      {a.empresas.length > 1 ? (
        <div className="-mb-3 flex justify-end">
          <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 text-sm ring-1 ring-border">
            {a.empresas.map((x) => (
              <Link key={x} href={`/ritmo/arena?e=${x}${sp.r ? `&r=${sp.r}` : ""}`} className={cn("rounded-full px-3 py-1 transition", x === empresa ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {NOMBRE[x]}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <MarcadorEquipo
        empresa={NOMBRE[empresa]}
        mesNombre={mesNombre}
        diasFaltan={diasFaltan}
        conectada={!ar.hoja.error}
        e={{ hoy: e.hoy, semana: e.semana, mes: e.mes, nuevasMes: e.nuevasMes, metaDia: e.metaDia, metaSemana: e.metaSemana, mesTotal: e.metas.mesTotal, mesNuevas: e.metas.mesNuevas, ritmoMes: e.ritmoMes }}
        escalones={gestiona && ESCALONES_DIRECTOR[empresa] ? escalones(e.nuevasMes, ESCALONES_DIRECTOR[empresa]!).metas : null}
        rangos={rangos("")}
        rangoId={ar.rango.id}
      />
      {e.alerta && !ar.hoja.error ? <Alerta nivel={e.alerta.nivel!} texto={e.alerta.texto} /> : null}

      {ar.mio ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="lg:sticky lg:top-20">
            <MiMarcador rol={ar.mio.rol} m={ar.mio.m} goal={ar.mio.goal} />
          </div>
          <MiDiario
            rol={ar.mio.rol}
            hoy={ar.hoy}
            ayer={ayer}
            kpis={KPIS_VENTAS[ar.mio.rol]}
            rango={ar.mio.rango}
            diasRango={ar.mio.diasRango}
            etiqueta={ar.rango.etiqueta}
            dias={ar.mio.diario.map((x) => ({ fecha: x.fecha, kpis: x.kpis ?? {}, animo: x.animo, nota: x.nota }))}
          />
        </div>
      ) : null}

      <Pulso pulso={ar.pulso} etiqueta={ar.rango.etiqueta} />


      <CarreraVivo carreras={{ closer: ar.carreras.closer.map((c) => ({ ...c, yo: c.userId === u.id })), setter: ar.carreras.setter.map((c) => ({ ...c, yo: c.userId === u.id })), chatter: ar.carreras.chatter.map((c) => ({ ...c, yo: c.userId === u.id })) }} />

      <Bonos
        empresa={empresa}
        gestiona={gestiona}
        autoriza={a.autoriza}
        equipo={ar.gente.filter((g) => g.rol !== "director_ventas").map((g) => ({ userId: g.userId, nombre: g.nombre }))}
        bonos={bonosFilas.map((b) => ({ id: b.id, titulo: b.titulo, detalle: b.detalle, monto: b.monto, rol: b.rol, desde: b.desde, hasta: b.hasta, estado: b.estado, ganador: b.ganadorId ? (nombres.get(b.ganadorId) ?? null) : null, creadoPor: b.creadoPor ? (nombres.get(b.creadoPor) ?? null) : null }))}
      />

      {gestiona && ar.kpisEquipo.length ? <RankingVentas filas={ar.kpisEquipo} etiqueta={ar.rango.etiqueta} /> : null}

      {gestiona && ar.kpisEquipo.length ? (
        <section id="kpis" className="panel flex scroll-mt-20 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">KPIs del equipo · {ar.rango.etiqueta.toLowerCase()}</h2>
            <span className="text-[11px] text-muted-foreground">el más alto de cada columna brilla más</span>
          </div>
          {ROLES.map((r) => {
            const filas = ar.kpisEquipo.filter((x) => x.rol === r.id);
            if (!filas.length) return null;
            const cols = KPIS_VENTAS[r.id];
            const tasas = TASAS_VENTAS[r.id] ?? [];
            const maxDe = Object.fromEntries(cols.map((c) => [c.id, Math.max(0, ...filas.map((x) => x.mes[c.id] ?? 0))]));
            return (
              <div key={r.id} className="overflow-x-auto">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{r.t}</p>
                <table className="w-full min-w-[520px] border-separate border-spacing-y-1 text-sm">
                  <thead className="text-left text-[11px] text-muted-foreground">
                    <tr>
                      <th className="sticky left-0 bg-card py-1.5 pr-3 font-normal">Persona</th>
                      <th className="py-1.5 pr-3 text-right font-normal">Días</th>
                      {cols.map((c) => (
                        <th key={c.id} className="py-1.5 pr-3 text-right font-normal">{c.nombre}</th>
                      ))}
                      {tasas.map((t) => (
                        <th key={t.id} className="py-1.5 pr-3 text-right font-normal">{t.nombre}</th>
                      ))}
                      {r.id === "closer" ? <th className="py-1.5 text-right font-normal">Cash collected (mes)</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((x) => (
                      <tr key={x.userId}>
                        <td className="sticky left-0 z-10 bg-card py-1.5 pr-3 whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Avatar nombre={x.nombre} tamano={24} /> {x.nombre}
                          </span>
                        </td>
                        <td className="num py-1.5 pr-3 text-right font-mono text-muted-foreground">{x.dias}</td>
                        {cols.map((c) => (
                          <td key={c.id} className="num py-1 pr-1 text-right font-mono">
                            <span
                              className={cn("inline-block min-w-12 rounded-md px-2 py-1", (x.mes[c.id] ?? 0) && (x.mes[c.id] ?? 0) === maxDe[c.id] && "font-semibold text-primary")}
                              style={{ background: maxDe[c.id] ? `color-mix(in oklch, var(--neon) ${Math.round(((x.mes[c.id] ?? 0) / maxDe[c.id]) * 22)}%, transparent)` : undefined }}
                            >
                              {c.dinero ? usd(x.mes[c.id] ?? 0) : (x.mes[c.id] ?? 0)}
                            </span>
                          </td>
                        ))}
                        {tasasVentas(r.id, x.mes).map((t) => (
                          <td key={t.id} className="num py-1.5 pr-3 text-right font-mono text-muted-foreground">{t.valor == null ? "—" : `${t.valor} %`}</td>
                        ))}
                        {r.id === "closer" ? <td className="num py-1.5 text-right font-mono">{usd(x.cash)}</td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">Lo anota cada quien en su diario (hoy o ayer). Los % se calculan solos sobre las conversaciones (chatters), las llamadas (setters) o las demos (closers). El cash collected de los closers es del mes y sale de la hoja de ventas.</p>
        </section>
      ) : null}

      {gestiona ? (
        <section className="panel flex flex-col gap-3 p-5">
          <h2 className="text-sm font-semibold">Comisiones del mes · privado</h2>
          {ar.comisiones.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Persona</th>
                    <th className="py-2 pr-3 font-normal">Cash</th>
                    <th className="py-2 pr-3 font-normal">Neto</th>
                    <th className="py-2 pr-3 font-normal">Show-up / cierre</th>
                    <th className="py-2 pr-3 font-normal">Agendas</th>
                    <th className="py-2 pr-3 font-normal">%</th>
                    <th className="py-2 text-right font-normal">Comisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ar.comisiones.map((c) => (
                    <tr key={c.userId}>
                      <td className="py-2 pr-3">
                        {c.nombre} <span className="text-xs text-muted-foreground">· {c.rol}</span>
                      </td>
                      <td className="num py-2 pr-3 font-mono">{usd(c.m.mes)}</td>
                      <td className="num py-2 pr-3 font-mono">{usd(c.m.netoMes)}</td>
                      <td className="num py-2 pr-3 font-mono text-xs">
                        {c.rol === "closer" ? `${c.m.tasas.showUp == null ? "—" : Math.round(c.m.tasas.showUp * 100) + " %"} / ${c.m.tasas.cierre == null ? "—" : Math.round(c.m.tasas.cierre * 100) + " %"}` : "—"}
                        {c.rol === "closer" && c.m.tasas.sinMarcar ? <span className="block text-[10px] text-amber-300">{c.m.tasas.sinMarcar} sin marcar en Leads</span> : null}
                      </td>
                      <td className="num py-2 pr-3 font-mono text-xs">{c.rol === "closer" ? "—" : c.m.tasas.agendas}</td>
                      <td className="num py-2 pr-3 font-mono">{Math.round(c.m.pct * 100)} %</td>
                      <td className="num py-2 text-right font-mono font-semibold text-primary">{usd(c.m.comision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nadie tiene puesto de ventas en {NOMBRE[empresa]} todavía: se pone en Ritmo → Ajustes (Closer, Setter, Chatter o Director de ventas).</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Reglas (Nahuel): closer 7 %, y con show-up ≥ 60 % sube a 8/9/10 % con cierre de 25/30/35 % · setter 4 % de lo que agendó · chatter 4 %, 5 % con más de 200
            agendas propias. Sobre lo cobrado menos la pasarela (Stripe, PayPal y ATH 3.5 %, Klarna y FanBasis 4.5 %). Show-up y citas salen del diario de cada closer; el cierre, de las
            ventas nuevas de la hoja.
          </p>
          {!ar.hoja.error ? (
            <p className="text-[11px] text-muted-foreground">
              Hoja: {ar.hoja.pestana ?? "—"} · {ar.hoja.ventas} ventas · neto por {ar.hoja.metodoNeto === "pasarela" ? "pasarela" : ar.hoja.metodoNeto === "valor-neto" ? "“Valor neto” de la hoja" : "monto cobrado (sin pasarela)"}
              {ar.hoja.avisos.length ? ` · ⚠️ ${ar.hoja.avisos.join(" ")}` : ""}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

// Ranking de ventas con metas diarias y recomendaciones (30/sep, Elvin): lo ven Nahuel (director), Aure y Elvin.
const NIVEL: Record<Nivel, { t: string; c: string }> = {
  elite: { t: "Élite", c: "bg-primary/15 text-primary ring-primary/30" },
  verde: { t: "En meta", c: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30" },
  amarillo: { t: "Atención", c: "bg-amber-400/10 text-amber-300 ring-amber-400/30" },
  rojo: { t: "Alerta roja", c: "bg-red-500/10 text-red-300 ring-red-500/30" },
  "sin-datos": { t: "Sin diario", c: "bg-white/5 text-muted-foreground ring-border" },
};

const MEDALLA = ["🥇", "🥈", "🥉"];

function RankingVentas({ filas, etiqueta }: { filas: Parameters<typeof rankingVentas>[0]; etiqueta: string }) {
  const ranking = rankingVentas(filas);
  return (
    <section id="ranking" className="panel flex scroll-mt-20 flex-col gap-5 p-5">
      <div>
        <h2 className="text-sm font-semibold">Ranking de ventas · {etiqueta.toLowerCase()}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Promedio por día que llenó su diario en ese rango. La rayita blanca es la meta: setters 125 llamadas, 30 conectadas y 3–5 agendas · chatters 20–30 conversaciones (mínimo 15), 5–10 pases y 3–5 agendas · closers 30 % de close rate (élite 40 %).
        </p>
      </div>
      {ROLES.map((r) => {
        const del = ranking.filter((f) => f.rol === r.id);
        if (!del.length) return null;
        const metas = METAS_DIARIAS[r.id] ?? {};
        return (
          <div key={r.id} className="flex flex-col gap-2.5">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">{r.t}</p>
            <ol className="grid gap-2.5 lg:grid-cols-2">
              {del.map((f) => (
                <li key={f.userId} className={cn("arena-tarjeta rounded-2xl bg-white/[0.03] p-4 ring-1 transition hover:bg-white/[0.045]", f.nivel === "rojo" ? "ring-red-500/25" : f.nivel === "elite" ? "ring-primary/40" : "ring-border/70")} style={{ animationDelay: `${(f.posicion - 1) * 0.06}s` }}>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar nombre={f.nombre} tamano={40} />
                      <span className="absolute -right-1 -bottom-1 text-base">{f.nivel !== "sin-datos" && f.posicion <= 3 ? MEDALLA[f.posicion - 1] : ""}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        <span className="mr-1 font-mono text-xs text-muted-foreground">#{f.posicion}</span>
                        {f.nombre}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {f.dias} {f.dias === 1 ? "día" : "días"} con diario{f.rol === "closer" ? ` · ${usd(f.cash)} cobrado` : ""}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", NIVEL[f.nivel].c)}>{NIVEL[f.nivel].t}</span>
                  </div>
                  {f.indicadores.length ? (
                    <div className="mt-3 flex flex-col gap-2.5">
                      {f.indicadores
                        .filter((i) => i.unidad !== "total")
                        .map((i) => {
                          const m = metas[i.id];
                          const meta = i.unidad === "%" ? CLOSE_RATE.super : (m?.meta ?? 1);
                          const tope = i.unidad === "%" ? 50 : Math.max(m?.top ?? meta, meta) * 1.35;
                          return (
                            <div key={i.id}>
                              <div className="mb-1 flex items-baseline justify-between text-xs">
                                <span className="text-muted-foreground">{i.nombre}</span>
                                <span className="font-mono">
                                  <b>{i.valor}{i.unidad === "%" ? " %" : ""}</b>
                                  <span className="text-muted-foreground"> {i.unidad === "/día" ? "/día" : ""} · meta {i.meta}</span>
                                </span>
                              </div>
                              <BarraMeta valor={i.valor} meta={meta} tope={tope} nivel={i.nivel} />
                            </div>
                          );
                        })}
                    </div>
                  ) : null}
                  <details className="group mt-3">
                    <summary className="cursor-pointer list-none text-[11px] text-primary/90 hover:text-primary">
                      <span className="group-open:hidden">Ver recomendaciones ({f.recomendaciones.length}) →</span>
                      <span className="hidden group-open:inline">Ocultar</span>
                    </summary>
                    <ul className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
                      {f.recomendaciones.map((x) => (
                        <li key={x}>→ {x}</li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
