import Link from "next/link";
import { redirect } from "next/navigation";

import { Alerta, Barra, Bonos, Carrera, MiDiario } from "@/components/ritmo/arena";
import { MiMarcador, usd } from "@/components/ritmo/arena-marcador";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { accesoArena, armarArena, bonosDe } from "@/lib/ventas/datos";
import { KPIS_VENTAS, kpisDelMes, type Empresa, type RolVentas } from "@/lib/ventas/reglas";
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
export default async function ArenaPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const a = await accesoArena(u);
  if (!a.empresas.length) redirect("/ritmo");
  const pedida = (await searchParams).e as Empresa | undefined;
  const empresa = pedida && a.empresas.includes(pedida) ? pedida : a.empresas[0];
  const [ar, bonosFilas] = await Promise.all([armarArena(u, a, empresa), bonosDe(empresa).catch(() => [])]);
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
      </section>

      {ar.mio ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <MiMarcador rol={ar.mio.rol} m={ar.mio.m} goal={ar.mio.goal} />
          <MiDiario hoy={ar.hoy} ayer={ayer} kpis={KPIS_VENTAS[ar.mio.rol]} mes={kpisDelMes(ar.mio.diario)} dias={ar.mio.diario.map((x) => ({ fecha: x.fecha, kpis: x.kpis ?? {}, animo: x.animo, nota: x.nota }))} />
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

      {gestiona && ar.kpisEquipo.length ? (
        <section className="panel flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold">KPIs del equipo · este mes</h2>
          {ROLES.map((r) => {
            const filas = ar.kpisEquipo.filter((x) => x.rol === r.id);
            if (!filas.length) return null;
            const cols = KPIS_VENTAS[r.id];
            return (
              <div key={r.id} className="overflow-x-auto">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{r.t}</p>
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-left text-[11px] text-muted-foreground">
                    <tr>
                      <th className="py-1.5 pr-3 font-normal">Persona</th>
                      {cols.map((c) => (
                        <th key={c.id} className="py-1.5 pr-3 text-right font-normal">{c.nombre}</th>
                      ))}
                      {r.id === "closer" ? <th className="py-1.5 text-right font-normal">Cash collected</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filas.map((x) => (
                      <tr key={x.userId}>
                        <td className="py-1.5 pr-3">{x.nombre}</td>
                        {cols.map((c) => (
                          <td key={c.id} className="num py-1.5 pr-3 text-right font-mono">{x.mes[c.id] ?? 0}</td>
                        ))}
                        {r.id === "closer" ? <td className="num py-1.5 text-right font-mono">{usd(x.cash)}</td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">Lo anota cada quien en su diario (hoy o ayer); el cash collected de los closers sale de la hoja de ventas.</p>
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
