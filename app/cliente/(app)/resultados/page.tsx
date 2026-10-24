import { BarChart3, CloudOff, Link2, RotateCw } from "lucide-react";
import Link from "next/link";

import { Anuncio, Dato, GraficoDiario, detalleResultados, dinero, entero } from "@/components/cliente/resultados";
import { BotonSlack } from "@/components/cliente/piezas";
import { TextoPendiente } from "@/components/cliente/pendiente";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
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
            <Link key={x.id} href={`/cliente/resultados?p=${x.id}`} aria-current={x.id === periodo ? "page" : undefined} className={cn("rounded-full px-3 py-1.5 transition-colors", x.id === periodo ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
              <TextoPendiente>{x.nombre}</TextoPendiente>
            </Link>
          ))}
        </nav>
      </header>

      {r.estado === "sin-cuenta" ? (
        <EstadoVacio className="panel" icono={Link2} titulo="Tu cuenta publicitaria todavía no está conectada">
          En cuanto tus campañas estén activas, aquí vas a ver tu inversión, tus resultados y lo que te cuesta cada uno.
        </EstadoVacio>
      ) : r.estado === "no-disponible" || !t ? (
        <EstadoVacio
          className="panel"
          tipo="error"
          icono={CloudOff}
          titulo="No pudimos traer tus resultados ahora"
          accion={
            <Button asChild variant="outline" className="rounded-full">
              <a href={`/cliente/resultados?p=${periodo}`}>
                <RotateCw /> Reintentar
              </a>
            </Button>
          }
        >
          Suele ser algo pasajero. Vuelve a intentar en un rato; si sigue igual, escríbenos por Slack.
        </EstadoVacio>
      ) : !t.inversion ? (
        <EstadoVacio className="panel" icono={BarChart3} titulo="No hubo inversión en este periodo">
          Cuando tus anuncios estén corriendo, aquí vas a ver los números. Prueba otro periodo arriba.
        </EstadoVacio>
      ) : (
        <>
          <section className="entra-suave grid grid-cols-2 gap-3">
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
