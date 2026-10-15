import { ChevronRight, Target } from "lucide-react";
import Link from "next/link";

import type { Prioridad } from "@/lib/desempeno/optimizaciones";
import { cn } from "@/lib/utils";

// "Tus prioridades de hoy" (15/oct, Elvin): cuando el estratega abre Ritmo para ponchar, lo primero que ve son las cuentas
// que tiene que optimizar esta semana (salen el lunes, vencen el miércoles), por dónde empezar y cuánto le queda.
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const dia = (f: string) => DIAS[new Date(f + "T12:00:00Z").getUTCDay()];
const PLAZO = {
  "a-tiempo": (v: string) => ({ t: `Hasta el ${dia(v)}`, c: "bg-primary/10 text-primary ring-primary/25" }),
  "vence-hoy": () => ({ t: "Vence hoy", c: "bg-amber-400/15 text-amber-200 ring-amber-400/30" }),
  vencido: () => ({ t: "Vencido", c: "bg-[color:var(--coral)]/15 text-[color:var(--coral)] ring-[color:var(--coral)]/30" }),
};

export function Prioridades({ items, hoy }: { items: Prioridad[]; hoy: string }) {
  if (!items.length) return null;
  const lunes = new Date(hoy + "T12:00:00Z").getUTCDay() === 1;
  const venceHoy = items.some((x) => x.plazo === "vence-hoy");
  const vencidos = items.filter((x) => x.plazo === "vencido").length;
  const puntos = items.reduce((s, x) => s + x.pendientes, 0);
  const intro = vencidos
    ? `Tienes ${vencidos === 1 ? "1 cuenta vencida" : `${vencidos} cuentas vencidas`}: empieza el día por ahí.`
    : venceHoy
      ? "Hoy vence la revisión de la semana: termina de optimizar y marca cada punto."
      : lunes
        ? `Hoy te llegaron ${items.length === 1 ? "1 cuenta" : `${items.length} cuentas`} para optimizar. Tienes hasta el miércoles.`
        : `Te ${puntos === 1 ? "queda 1 punto" : `quedan ${puntos} puntos`} de la revisión de la semana.`;
  return (
    <section className="panel flex w-full flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-amber-400/12 text-amber-300 ring-1 ring-amber-400/30">
          <Target className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Tus prioridades de hoy</h2>
          <p className="text-[12px] text-muted-foreground">{intro}</p>
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {items.slice(0, 4).map((x, i) => {
          const p = PLAZO[x.plazo](x.vence);
          return (
            <li key={x.id}>
              <Link href={`/ritmo/cuentas#caso-${x.id}`} className="group flex items-start gap-3 rounded-xl bg-muted/40 p-3 transition hover:bg-muted/70">
                <span className="num mt-0.5 text-xs text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <b className="truncate text-sm">{x.cliente}</b>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] ring-1", p.c)}>{p.t}</span>
                    <span className="text-[11px] text-muted-foreground">{x.pendientes} de {x.total} sin marcar</span>
                  </span>
                  {x.primero ? <span className="mt-1 block text-[12px] text-muted-foreground">{x.urgente ? "🔴 " : ""}Empieza por: {x.primero}</span> : null}
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
              </Link>
            </li>
          );
        })}
      </ol>
      {items.length > 4 ? (
        <Link href="/ritmo/cuentas" className="text-center text-xs text-muted-foreground hover:text-foreground">
          Ver las {items.length} cuentas
        </Link>
      ) : null}
    </section>
  );
}
