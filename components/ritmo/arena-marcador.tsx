import type { Marcador, RolVentas } from "@/lib/ventas/reglas";

import { cn } from "@/lib/utils";

import { MiGoal } from "./arena";
import { Anillo, Cifra } from "./arena-vivo";

// (Estas dos viven aquí: una función de un archivo "use client" no se puede llamar desde el servidor.)
export const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pctTxt = (n: number | null) => (n == null ? "—" : `${Math.round(n * 100)} %`);

// Mi marcador (Arena): lo que vendí hoy / semana / mes, mi meta y MI comisión (privada: solo la veo yo, el
// director y la dirección). Va en Hoy para el equipo de ventas (en lugar del reloj) y arriba de la Arena.
// 6/oct: números que cuentan, anillo de la meta personal y la escalera de comisión del closer.
const ESCALERA: Partial<Record<RolVentas, { pct: number; t: string }[]>> = {
  closer: [
    { pct: 0.07, t: "Base" },
    { pct: 0.08, t: "Cierre 25 %" },
    { pct: 0.09, t: "Cierre 30 %" },
    { pct: 0.1, t: "Cierre 35 %" },
  ],
  chatter: [
    { pct: 0.04, t: "Base" },
    { pct: 0.05, t: "+200 agendas" },
  ],
};

export function MiMarcador({ rol, m, goal, compacto = false }: { rol: RolVentas; m: Marcador; goal: number | null; compacto?: boolean }) {
  const escalera = ESCALERA[rol];
  return (
    <section className="panel hud-esquinas relative flex w-full flex-col gap-4 overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <p className="ceja">Mi marcador · {rol}</p>
        <span className="text-[11px] text-muted-foreground">Cash collected</span>
      </div>
      <div className="relative flex items-center gap-4">
        <Anillo valor={m.mes} meta={goal} tamano={112} grosor={10} apagado={!goal}>
          <div>
            <p className="text-[9px] tracking-widest text-muted-foreground uppercase">Mes</p>
            <Cifra valor={m.mes} tipo="usd" className="block font-mono text-base font-semibold" />
            {goal ? <p className="text-[10px] text-primary">{Math.round((m.mes / goal) * 100)} %</p> : null}
          </div>
        </Anillo>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {[
            { t: "Hoy", v: m.hoy },
            { t: "Semana", v: m.semana },
          ].map((x) => (
            <div key={x.t} className="arena-tarjeta rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-border/60">
              <p className="text-[10px] text-muted-foreground uppercase">{x.t}</p>
              <Cifra valor={x.v} tipo="usd" className="mt-0.5 block font-mono text-lg font-semibold" />
            </div>
          ))}
        </div>
      </div>
      <MiGoal goal={goal} mes={m.mes} />
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.12] to-[color:var(--coral)]/[0.08] p-4 ring-1 ring-primary/30">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">Mi comisión del mes · {Math.round(m.pct * 100)} %</span>
          <Cifra valor={m.comision} tipo="usd" className="font-mono text-3xl font-semibold text-primary" />
        </div>
        {escalera ? (
          <div className="mt-3 flex gap-1">
            {escalera.map((p) => {
              const activo = Math.round(m.pct * 100) >= Math.round(p.pct * 100);
              return (
                <div key={p.pct} className="flex-1">
                  <div className={cn("h-1.5 rounded-full transition", activo ? "bg-primary shadow-[0_0_8px_var(--neon)]" : "bg-white/10")} />
                  <p className={cn("mt-1 text-[10px]", activo ? "text-primary" : "text-muted-foreground")}>
                    {Math.round(p.pct * 100)} % <span className="hidden sm:inline">· {p.t}</span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}
        <p className="mt-2 text-[11px] text-muted-foreground">Sobre {usd(m.netoMes)} netos (lo cobrado menos la pasarela de pago). Solo la ves tú.</p>
        {m.siguiente ? <p className="mt-2 text-xs text-foreground">⬆️ {m.siguiente}</p> : null}
      </div>
      {!compacto ? (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {rol === "closer" ? (
            <>
              <Dato t={m.tasas.showUpFuente === "diario" ? "Show-up (diario)" : "Show-up (CRM)"} v={pctTxt(m.tasas.showUp)} />
              <Dato t="Cierre" v={pctTxt(m.tasas.cierre)} />
              <Dato t="Ventas nuevas" v={String(m.cierresMes)} />
              {m.tasas.sinMarcar ? (
                <p className="col-span-3 text-left text-[11px] text-amber-300">
                  {m.tasas.sinMarcar} cita{m.tasas.sinMarcar === 1 ? "" : "s"} que ya pasaron siguen en «Llamada agendada» en Leads: muévelas (No show, Follow up, Closed…) para que cuenten en tu show-up.
                </p>
              ) : null}
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
