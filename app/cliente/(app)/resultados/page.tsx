import Link from "next/link";

import { Anuncio, Dato, GraficoDiario, detalleResultados, dinero, entero } from "@/components/cliente/resultados";
import { BotonSlack } from "@/components/cliente/piezas";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { resultadosCliente } from "@/lib/clientes-app/resultados";
import { PERIODOS, type Periodo } from "@/lib/clientes-app/resultados-reglas";
import { visorActual } from "@/lib/clientes-app/sesion";
import { cn } from "@/lib/utils";

export const metadata = { title: "Resultados" };

export default async function ResultadosPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const v = await visorActual();
  if (!v) return null;
  const f = await fichaCliente(v.itemId);
  if (!f) return null;
  const { p } = await searchParams;
  const periodo: Periodo = PERIODOS.some((x) => x.id === p) ? (p as Periodo) : "7d";
  const r = await resultadosCliente(f.cuentaAnuncios, periodo);
  const t = r.totales;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ceja">Tus anuncios en Meta</p>
          <h1 className="lu-titulo mt-1 text-2xl font-semibold">Resultados</h1>
        </div>
        <nav className="flex rounded-full border border-border bg-card p-1 text-xs">
          {PERIODOS.map((x) => (
            <Link key={x.id} href={`/cliente/resultados?p=${x.id}`} className={cn("rounded-full px-3 py-1.5 transition", x.id === periodo ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground")}>
              {x.nombre}
            </Link>
          ))}
        </nav>
      </header>

      {r.estado === "sin-cuenta" ? (
        <p className="panel p-5 text-sm text-muted-foreground">Todavía no conectamos tu cuenta publicitaria a la app. En cuanto tus campañas estén activas, aquí vas a ver tu inversión, tus resultados y lo que te cuesta cada uno.</p>
      ) : r.estado === "no-disponible" || !t ? (
        <p className="panel p-5 text-sm text-muted-foreground">Tus resultados no están disponibles en este momento. Vuelve a intentar en un rato; si sigue igual, escríbenos por Slack.</p>
      ) : !t.inversion ? (
        <p className="panel p-5 text-sm text-muted-foreground">No hubo inversión en este periodo. Cuando tus anuncios estén corriendo, aquí vas a ver los números.</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <Dato titulo="Resultados" valor={entero(t.resultados)} detalle={detalleResultados(t)} destacado />
            <Dato titulo="Costo por resultado" valor={dinero(t.costoResultado, r.moneda)} />
            <Dato titulo="Inversión" valor={dinero(t.inversion, r.moneda)} />
            <Dato titulo="Personas alcanzadas" valor={entero(t.alcance)} detalle={`${entero(t.clics)} clics`} />
            {t.ventas ? (
              <>
                <Dato titulo="Ventas" valor={entero(t.ventas)} detalle={dinero(t.ingresos, r.moneda)} />
                <Dato titulo="ROAS" valor={t.roas ? `${t.roas.toFixed(1)}x` : "—"} detalle="Ingresos por cada $1 invertido" />
              </>
            ) : null}
          </section>
          <GraficoDiario serie={r.serie} />
          {r.anuncios.length ? (
            <section className="flex flex-col gap-2">
              <h2 className="lu-titulo text-base font-semibold">Los anuncios que mejor van</h2>
              {r.anuncios.map((a) => (
                <Anuncio key={a.id} a={a} moneda={r.moneda} />
              ))}
            </section>
          ) : null}
          <p className="text-center text-[11px] text-muted-foreground">
            Números de Meta (Ads Manager), actualizados cada hora · {new Date(r.actualizado).toLocaleTimeString("es-PR", { hour: "numeric", minute: "2-digit", timeZone: "America/Puerto_Rico" })}
          </p>
        </>
      )}
      <BotonSlack url={f.slackUrl} />
    </div>
  );
}
