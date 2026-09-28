import type { Marcador, RolVentas } from "@/lib/ventas/reglas";

import { MiGoal } from "./arena";

// (Estas dos viven aquí: una función de un archivo "use client" no se puede llamar desde el servidor.)
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pctTxt = (n: number | null) => (n == null ? "—" : `${Math.round(n * 100)} %`);

// Mi marcador (Arena): lo que vendí hoy / semana / mes, mi meta y MI comisión (privada: solo la veo yo, el
// director y la dirección). Va en Hoy para el equipo de ventas (en lugar del reloj) y arriba de la Arena.
export function MiMarcador({ rol, m, goal, compacto = false }: { rol: RolVentas; m: Marcador; goal: number | null; compacto?: boolean }) {
  return (
    <section className="panel hud-esquinas flex w-full flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="ceja">Mi marcador · {rol}</p>
        <span className="text-[11px] text-muted-foreground">Cash collected</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { t: "Hoy", v: m.hoy },
          { t: "Semana", v: m.semana },
          { t: "Mes", v: m.mes },
        ].map((x) => (
          <div key={x.t} className="rounded-xl bg-white/[0.03] px-2 py-3 ring-1 ring-border/60">
            <p className="text-[11px] text-muted-foreground uppercase">{x.t}</p>
            <p className="num mt-1 font-mono text-xl font-semibold">{usd(x.v)}</p>
          </div>
        ))}
      </div>
      <MiGoal goal={goal} mes={m.mes} />
      <div className="rounded-xl bg-primary/[0.06] p-4 ring-1 ring-primary/25">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">Mi comisión del mes · {Math.round(m.pct * 100)} %</span>
          <span className="num font-mono text-2xl font-semibold text-primary">{usd(m.comision)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Sobre {usd(m.netoMes)} netos (lo cobrado menos la pasarela de pago). Solo la ves tú.</p>
        {m.siguiente ? <p className="mt-2 text-xs text-foreground">⬆️ {m.siguiente}</p> : null}
      </div>
      {!compacto ? (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {rol === "closer" ? (
            <>
              <Dato t="Show-up" v={pctTxt(m.tasas.showUp)} />
              <Dato t="Cierre" v={pctTxt(m.tasas.cierre)} />
              <Dato t="Ventas nuevas" v={String(m.cierresMes)} />
            </>
          ) : (
            <>
              <Dato t={m.tasas.agendasFuente === "leads" ? "Agendas (Calendly)" : "Agendas (diario)"} v={String(m.tasas.agendas)} />
              <Dato t="Ventas" v={String(m.ventasMes)} />
              <Dato t="Ventas nuevas" v={usd(m.nuevasMes)} />
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] px-2 py-2 ring-1 ring-border/50">
      <p className="text-muted-foreground">{t}</p>
      <p className="num mt-0.5 font-mono text-sm text-foreground">{v}</p>
    </div>
  );
}

