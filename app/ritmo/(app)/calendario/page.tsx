import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { tramosEntre } from "@/lib/desempeno/calendario";
import { diasEnConflicto, mesSiguiente, PUESTO_PLURAL, rango, semanasDelMes, TOPE_FUERA, type Tramo } from "@/lib/desempeno/calendario-reglas";
import { perfilDe } from "@/lib/desempeno/datos";
import { fechaPR, puestoPorId } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendario" };

// Calendario de ausencias (28/sep, Elvin): quién está fuera y cuándo, para no irse en las mismas fechas. Los
// estrategas no pueden estar fuera dos a la vez (TOPE_FUERA): los días que se pasan salen en rojo. El motivo
// (vacaciones, enfermedad…) solo lo ve la vista maestra; el resto ve "Fuera" o "Pedido".
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const TIPO: Record<string, { t: string; c: string }> = {
  vacaciones: { t: "Vacaciones", c: "bg-primary/15 text-primary ring-primary/30" },
  dia_libre: { t: "Día libre", c: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
  permiso: { t: "Permiso", c: "bg-amber-500/15 text-amber-200 ring-amber-500/30" },
  personal: { t: "Personal", c: "bg-amber-500/15 text-amber-200 ring-amber-500/30" },
  enfermedad: { t: "Enfermedad", c: "bg-[color:var(--coral)]/15 text-[color:var(--coral)] ring-[color:var(--coral)]/30" },
  maternidad: { t: "Maternidad", c: "bg-[color:var(--coral)]/15 text-[color:var(--coral)] ring-[color:var(--coral)]/30" },
};
const corto = (n: string) => {
  const p = n.split(" ");
  return p.length > 1 ? `${p[0]} ${p[1][0]}.` : p[0];
};

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ m?: string; e?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const q = await searchParams;
  const hoy = fechaPR(Date.now());
  const mes = /^\d{4}-\d{2}$/.test(q.m ?? "") ? q.m! : hoy.slice(0, 7);
  const semanas = semanasDelMes(mes);
  const desde = semanas[0][0];
  const hasta = semanas[semanas.length - 1][6];
  const miPerfil = await perfilDe(u.id).catch(() => null);
  // La maestra ve las dos empresas (filtro); cada empleado, la suya.
  const empresa = u.maestro ? (q.e === "ai_borinquen" ? "ai_borinquen" : q.e === "todas" ? "todas" : "level_up") : (miPerfil?.empresa ?? "level_up");
  const todos = await tramosEntre(desde, hasta);
  const tramos = todos.filter((t) => empresa === "todas" || t.empresa === empresa);
  const rojo = diasEnConflicto(tramos, desde, hasta);
  const etiqueta = (t: Tramo) => (u.maestro ? (TIPO[t.tipo]?.t ?? t.tipo) : t.estado === "pendiente" ? "Pedido" : "Fuera");
  const color = (t: Tramo) => (u.maestro ? (TIPO[t.tipo]?.c ?? TIPO.permiso.c) : "bg-primary/15 text-primary ring-primary/30");
  const delMes = tramos.filter((t) => t.hasta >= `${mes}-01` && t.desde <= `${mes}-31`);
  const url = (m: string, e = empresa) => `/ritmo/calendario?m=${m}${u.maestro ? `&e=${e}` : ""}`;
  const topes = Object.entries(TOPE_FUERA).map(([p, n]) => `${n === 1 ? "un" : n} ${n === 1 ? (puestoPorId(p)?.nombre ?? p).toLowerCase() : (PUESTO_PLURAL[p] ?? p)}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ceja">Calendario del equipo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">¿Quién está fuera?</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Antes de pedir tus días, mira aquí quién ya los tiene. Solo puede estar fuera {topes.join(", ")} a la vez: si ya hay uno aprobado, esas fechas no se pueden pedir.
          </p>
        </div>
        {u.maestro ? (
          <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 text-sm">
            {[
              { e: "level_up", t: "Level Up" },
              { e: "ai_borinquen", t: "AI Borinquen" },
              { e: "todas", t: "Todas" },
            ].map((x) => (
              <Link key={x.e} href={url(mes, x.e)} className={cn("rounded-full px-3 py-1", x.e === empresa ? "bg-primary/15 text-primary" : "text-muted-foreground")}>
                {x.t}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <section className="panel flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Link href={url(mesSiguiente(mes, -1))} className="rounded-full p-2 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground" aria-label="Mes anterior">
            <ChevronLeft className="size-5" />
          </Link>
          <h2 className="text-lg font-semibold">
            {MESES[Number(mes.slice(5, 7)) - 1]} {mes.slice(0, 4)}
          </h2>
          <Link href={url(mesSiguiente(mes, 1))} className="rounded-full p-2 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground" aria-label="Mes siguiente">
            <ChevronRight className="size-5" />
          </Link>
        </div>
        <div className="hidden grid-cols-7 gap-1 md:grid">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <p key={d} className="px-2 pb-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {d}
            </p>
          ))}
          {semanas.flat().map((d) => {
            const fuera = tramos.filter((t) => t.desde <= d && d <= t.hasta);
            const otroMes = !d.startsWith(mes);
            return (
              <div key={d} className={cn("flex min-h-24 flex-col gap-1 rounded-xl p-1.5 ring-1", rojo.has(d) ? "bg-red-500/10 ring-red-500/50" : "bg-white/[0.02] ring-border/50", otroMes && "opacity-40", d === hoy && "ring-primary/60")}>
                <span className={cn("px-1 font-mono text-[11px]", d === hoy ? "text-primary" : "text-muted-foreground")}>{Number(d.slice(8, 10))}</span>
                {fuera.slice(0, 4).map((t) => (
                  <span key={t.id} title={`${t.nombre} · ${etiqueta(t)} · ${rango(t.desde, t.hasta)}`} className={cn("truncate rounded-md px-1.5 py-0.5 text-[11px] ring-1", color(t), t.estado === "pendiente" && "border border-dashed border-current bg-transparent")}>
                    {corto(t.nombre)}
                  </span>
                ))}
                {fuera.length > 4 ? <span className="px-1 text-[10px] text-muted-foreground">+{fuera.length - 4} más</span> : null}
                {rojo.has(d) ? <span className="mt-auto px-1 text-[10px] font-semibold text-red-300">Choque</span> : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col divide-y divide-border/60">
          {delMes.length ? (
            delMes.map((t) => {
              const choca = TOPE_FUERA[t.puesto] != null && [...rojo].some((d) => t.desde <= d && d <= t.hasta && d.startsWith(mes));
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] ring-1", color(t), t.estado === "pendiente" && "border border-dashed border-current bg-transparent")}>{etiqueta(t)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <b className="font-medium">{t.nombre}</b>
                    <span className="text-muted-foreground"> · {puestoPorId(t.puesto)?.nombre ?? "—"}</span>
                  </span>
                  <span className="num shrink-0 font-mono text-xs text-muted-foreground">{rango(t.desde, t.hasta)}</span>
                  {t.estado === "pendiente" ? <span className="shrink-0 text-[11px] text-amber-200">por aprobar</span> : null}
                  {choca ? <span className="shrink-0 text-[11px] font-semibold text-red-300">choque</span> : null}
                </div>
              );
            })
          ) : (
            <p className="py-3 text-sm text-muted-foreground">Nadie tiene días fuera este mes.</p>
          )}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Borde punteado = pedido que todavía no se aprueba. Para pedir días: <Link href="/ritmo/solicitudes" className="text-primary hover:underline">Solicitudes</Link>.
      </p>
    </div>
  );
}
