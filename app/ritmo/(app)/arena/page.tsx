import Link from "next/link";
import { redirect } from "next/navigation";

import { Alerta, Barra, Bonos, Carrera, MiDiario } from "@/components/ritmo/arena";
import { MiMarcador, usd } from "@/components/ritmo/arena-marcador";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { accesoArena, armarArena, bonosDe } from "@/lib/ventas/datos";
import { ESCALONES_DIRECTOR, escalones, KPIS_VENTAS, RANGOS, rankingVentas, TASAS_VENTAS, tasasVentas, type Empresa, type Nivel, type RolVentas } from "@/lib/ventas/reglas";
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
  const rangos = (ancla: string) => RANGOS.map((x) => ({ id: x.id, t: x.t, href: `/ritmo/arena?${a.empresas.length > 1 ? `e=${empresa}&` : ""}r=${x.id}#${ancla}` }));
  const d = await db();
  const nombres = new Map((await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers)).map((x) => [x.id, x.nombre]));
  const gestiona = a.director || a.direccion;
  const e = ar.equipo;
  const ayer = new Date(Date.parse(`${ar.hoy}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ceja">Arena · ventas</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">La carrera de {NOMBRE[empresa]}</h1>
        </div>
        {a.empresas.length > 1 ? (
          <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 text-sm">
            {a.empresas.map((x) => (
              <Link key={x} href={`/ritmo/arena?e=${x}`} className={cn("rounded-full px-3 py-1", x === empresa ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
                {NOMBRE[x]}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {ar.hoja.error ? (
        <div className="panel p-4 text-sm text-muted-foreground">
          📄 {ar.hoja.error} {gestiona ? "Cuando la hoja esté conectada, la carrera y las comisiones se llenan solas." : "En cuanto esté, aquí sale todo."}
        </div>
      ) : null}
      {e.alerta && !ar.hoja.error ? <Alerta nivel={e.alerta.nivel!} texto={e.alerta.texto} /> : null}

      <section className="panel flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold">Meta del equipo</h2>
        <Barra grande valor={e.mes} meta={e.metas.mesTotal} etiqueta="Cash collected del mes" />
        {e.metas.mesNuevas ? <Barra valor={e.nuevasMes} meta={e.metas.mesNuevas} etiqueta="Ventas nuevas del mes" /> : null}
        <Barra valor={e.semana} meta={e.metaSemana} etiqueta="Esta semana" />
        <Barra valor={e.hoy} meta={e.metaDia} etiqueta="Hoy" />
        <p className="text-[11px] text-muted-foreground">A este paso el mes cierra en {usd(e.ritmoMes)}.</p>
        {gestiona && ESCALONES_DIRECTOR[empresa] ? <EscalonesDirector valor={e.nuevasMes} metas={ESCALONES_DIRECTOR[empresa]!} sinDatos={!!ar.hoja.error} /> : null}
      </section>

      {ar.mio ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <MiMarcador rol={ar.mio.rol} m={ar.mio.m} goal={ar.mio.goal} />
          <MiDiario
            hoy={ar.hoy}
            ayer={ayer}
            kpis={KPIS_VENTAS[ar.mio.rol]}
            rango={ar.mio.rango}
            tasas={tasasVentas(ar.mio.rol, ar.mio.rango)}
            diasRango={ar.mio.diasRango}
            rangoId={ar.rango.id}
            rangos={rangos("diario")}
            dias={ar.mio.diario.map((x) => ({ fecha: x.fecha, kpis: x.kpis ?? {}, animo: x.animo, nota: x.nota }))}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {ROLES.map((r) => (
          <Carrera key={r.id} titulo={r.t} meta={null} corredores={ar.carreras[r.id].map((c) => ({ ...c, yo: c.userId === u.id }))} />
        ))}
      </div>

      <Bonos
        empresa={empresa}
        gestiona={gestiona}
        autoriza={a.autoriza}
        equipo={ar.gente.filter((g) => g.rol !== "director_ventas").map((g) => ({ userId: g.userId, nombre: g.nombre }))}
        bonos={bonosFilas.map((b) => ({ id: b.id, titulo: b.titulo, detalle: b.detalle, monto: b.monto, rol: b.rol, desde: b.desde, hasta: b.hasta, estado: b.estado, ganador: b.ganadorId ? (nombres.get(b.ganadorId) ?? null) : null, creadoPor: b.creadoPor ? (nombres.get(b.creadoPor) ?? null) : null }))}
      />

      {gestiona && ar.kpisEquipo.length ? <RankingVentas filas={ar.kpisEquipo} etiqueta={ar.rango.etiqueta} rangoId={ar.rango.id} rangos={rangos("ranking")} /> : null}

      {gestiona && ar.kpisEquipo.length ? (
        <section id="kpis" className="panel flex scroll-mt-20 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">KPIs del equipo · {ar.rango.etiqueta.toLowerCase()}</h2>
            <SelectorRango rangos={rangos("kpis")} actual={ar.rango.id} />
          </div>
          {ROLES.map((r) => {
            const filas = ar.kpisEquipo.filter((x) => x.rol === r.id);
            if (!filas.length) return null;
            const cols = KPIS_VENTAS[r.id];
            const tasas = TASAS_VENTAS[r.id] ?? [];
            return (
              <div key={r.id} className="overflow-x-auto">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{r.t}</p>
                <table className="w-full min-w-[520px] text-sm">
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
                  <tbody className="divide-y divide-border/60">
                    {filas.map((x) => (
                      <tr key={x.userId}>
                        <td className="sticky left-0 bg-card py-1.5 pr-3 whitespace-nowrap">{x.nombre}</td>
                        <td className="num py-1.5 pr-3 text-right font-mono text-muted-foreground">{x.dias}</td>
                        {cols.map((c) => (
                          <td key={c.id} className="num py-1.5 pr-3 text-right font-mono">{c.dinero ? usd(x.mes[c.id] ?? 0) : (x.mes[c.id] ?? 0)}</td>
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

function SelectorRango({ rangos, actual }: { rangos: { id: string; t: string; href: string }[]; actual: string }) {
  return (
    <div className="flex flex-wrap gap-1 text-[11px]">
      {rangos.map((r) => (
        <Link key={r.id} href={r.href} scroll={false} className={cn("rounded-full px-2.5 py-1 ring-1 transition", r.id === actual ? "bg-primary/15 text-primary ring-primary/40" : "text-muted-foreground ring-border hover:text-foreground")}>
          {r.t}
        </Link>
      ))}
    </div>
  );
}

function RankingVentas({ filas, etiqueta, rangoId, rangos }: { filas: Parameters<typeof rankingVentas>[0]; etiqueta: string; rangoId: string; rangos: { id: string; t: string; href: string }[] }) {
  const ranking = rankingVentas(filas);
  return (
    <section id="ranking" className="panel flex scroll-mt-20 flex-col gap-4 p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Ranking de ventas · {etiqueta.toLowerCase()}</h2>
          <SelectorRango rangos={rangos} actual={rangoId} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Promedio por día que llenó su diario en ese rango. Metas: setters 125 llamadas, 30 conectadas y 3–5 agendas al día · chatters 20–30 conversaciones (mínimo 15), 5–10 pases y 3–5 agendas · closers 30 % de close rate (menos de 20 % alerta roja, 40 % élite).
        </p>
      </div>
      {ROLES.map((r) => {
        const del = ranking.filter((f) => f.rol === r.id);
        if (!del.length) return null;
        return (
          <div key={r.id} className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">{r.t}</p>
            <ol className="flex flex-col gap-2">
              {del.map((f) => (
                <li key={f.userId} className="rounded-xl bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-white/5 text-xs font-bold">{f.posicion}</span>
                    <span className="font-medium">{f.nombre}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", NIVEL[f.nivel].c)}>{NIVEL[f.nivel].t}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{f.dias} {f.dias === 1 ? "día" : "días"} con diario{f.rol === "closer" ? ` · ${usd(f.cash)} cobrado` : ""}</span>
                  </div>
                  {f.indicadores.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {f.indicadores.map((i) => (
                        <span key={i.id} className={cn("rounded-lg px-2 py-1 ring-1", NIVEL[i.nivel].c)}>
                          {i.nombre}: <b className="tabular-nums">{i.valor}{i.unidad === "%" ? " %" : ""}</b>
                          {i.unidad === "/día" ? <span className="opacity-70"> /día · meta {i.meta}</span> : i.unidad === "%" ? <span className="opacity-70"> · meta {i.meta}</span> : null}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <ul className="mt-2 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {f.recomendaciones.map((x) => (
                      <li key={x}>→ {x}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}

// Metas del director de ventas: solo ventas nuevas cobradas este mes. Pequeño a propósito (referencia, no tarea).
function EscalonesDirector({ valor, metas, sinDatos }: { valor: number; metas: number[]; sinDatos: boolean }) {
  const e = escalones(valor, metas);
  const k = (n: number) => `$${Math.round(n / 1000)}K`;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/[0.06] pt-3 text-[11px] text-muted-foreground">
      <span>Metas del director · ventas nuevas</span>
      {e.metas.map((m) => (
        <span key={m.meta} className={cn("rounded-full px-2 py-0.5 font-mono", m.logrado && !sinDatos ? "bg-primary/15 text-primary" : "bg-white/[0.04]")}>
          {m.logrado && !sinDatos ? "✓ " : ""}
          {k(m.meta)}
        </span>
      ))}
      <span className="text-foreground/80">
        {sinDatos ? <span>El avance sale cuando la hoja de ventas esté conectada.</span> : e.siguiente ? <>Faltan <b className="font-mono font-semibold text-foreground">{usd(e.siguiente.falta)}</b> para la meta {e.siguiente.n} ({k(e.siguiente.meta)})</> : <b className="font-semibold text-primary">Las 3 metas cumplidas 🎉</b>}
      </span>
    </div>
  );
}
