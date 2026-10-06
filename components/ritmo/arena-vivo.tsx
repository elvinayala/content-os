"use client";

import { Crown, Flame, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { tasasVentas, type RolVentas } from "@/lib/ventas/reglas";
import { cn } from "@/lib/utils";

// Piezas vivas de la Arena (6/oct, Elvin: "la Arena debe estar mucho mejor en lo visual… animada, más interactiva").
// Todo respeta prefers-reduced-motion: sin animación, los números y barras salen directo en su valor.

const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cuenta de 0 (o del valor anterior) al valor nuevo con easing. */
export function useCuenta(valor: number, ms = 1100): number {
  const [v, setV] = useState(0);
  const desde = useRef(0);
  useEffect(() => {
    const dur = sinMovimiento() ? 0 : ms;
    const inicio = performance.now();
    const de = desde.current;
    let raf = 0;
    const paso = (t: number) => {
      const p = dur ? Math.min(1, (t - inicio) / dur) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      setV(de + (valor - de) * e);
      if (p < 1) raf = requestAnimationFrame(paso);
      else desde.current = valor;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, ms]);
  return v;
}

/** true un instante después de montar: para que barras y anillos "crezcan" con transición CSS. */
export function useMontado(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setM(true));
    return () => cancelAnimationFrame(t);
  }, []);
  return m;
}

export const formato = (n: number, tipo: "usd" | "num" | "pct" = "num") =>
  tipo === "usd" ? "$" + Math.round(n).toLocaleString("en-US") : tipo === "pct" ? `${Math.round(n * 10) / 10} %` : Math.round(n).toLocaleString("en-US");

export function Cifra({ valor, tipo = "num", className }: { valor: number; tipo?: "usd" | "num" | "pct"; className?: string }) {
  const v = useCuenta(valor);
  return <span className={cn("num tabular-nums", className)}>{formato(tipo === "pct" ? Math.round(v * 10) / 10 : v, tipo)}</span>;
}

// ─── Anillo de progreso ──────────────────────────────────────────────────────────────────────

export function Anillo({ valor, meta, tamano = 168, grosor = 14, children, apagado = false }: { valor: number; meta: number | null; tamano?: number; grosor?: number; children?: React.ReactNode; apagado?: boolean }) {
  const id = useId().replace(/:/g, "");
  const montado = useMontado();
  const r = (tamano - grosor) / 2;
  const c = 2 * Math.PI * r;
  const p = meta ? Math.min(1, valor / meta) : 0;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--neon)" />
            <stop offset="100%" stopColor="var(--coral)" />
          </linearGradient>
        </defs>
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth={grosor} />
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="oklch(1 0 0 / 4%)" strokeWidth={grosor} strokeDasharray="2 10" />
        {!apagado ? (
          <circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={r}
            fill="none"
            stroke={`url(#g${id})`}
            strokeWidth={grosor}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={montado ? c * (1 - p) : c}
            className="arena-anillo"
            style={{ filter: p > 0 ? "drop-shadow(0 0 8px color-mix(in oklch, var(--neon) 55%, transparent))" : undefined }}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

// ─── Avatar con iniciales (color estable por nombre) ─────────────────────────────────────────

export function Avatar({ nombre, tamano = 36, className, anillo = false }: { nombre: string; tamano?: number; className?: string; anillo?: boolean }) {
  const ini = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]!.toUpperCase())
    .join("");
  let h = 0;
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white/95 shadow-inner", anillo && "ring-2 ring-primary ring-offset-2 ring-offset-background", className)}
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.36, background: `linear-gradient(135deg, oklch(0.62 0.15 ${h}), oklch(0.45 0.12 ${(h + 50) % 360}))` }}
    >
      {ini || "?"}
    </span>
  );
}

// ─── Mini-gráfica ────────────────────────────────────────────────────────────────────────────

export function Spark({ serie, alto = 40, className }: { serie: number[]; alto?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (serie.length < 2) return <div style={{ height: alto }} className={className} />;
  const w = 160;
  const max = Math.max(...serie, 1);
  const pts = serie.map((v, i) => [(i / (serie.length - 1)) * w, alto - 3 - (v / max) * (alto - 8)] as const);
  const linea = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${linea} L${w},${alto} L0,${alto} Z`;
  const [ux, uy] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${alto}`} preserveAspectRatio="none" className={cn("w-full overflow-visible", className)} style={{ height: alto }} aria-hidden>
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--neon)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#a${id})`} className="arena-aparece" />
      <path d={linea} fill="none" stroke="var(--neon)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" pathLength={1} className="arena-traza" />
      <circle cx={ux} cy={uy} r="2.6" fill="var(--neon)" className="arena-punto" />
    </svg>
  );
}

// ─── Barra con meta ──────────────────────────────────────────────────────────────────────────

export type NivelUI = "elite" | "verde" | "amarillo" | "rojo" | "sin-datos";
export const COLOR_NIVEL: Record<NivelUI, string> = {
  elite: "from-[color:var(--neon)] to-[color:var(--coral)]",
  verde: "from-emerald-400 to-emerald-300",
  amarillo: "from-amber-400 to-amber-300",
  rojo: "from-red-500 to-red-400",
  "sin-datos": "from-white/20 to-white/10",
};

export function BarraMeta({ valor, meta, tope, nivel, alto = "h-2" }: { valor: number; meta: number; tope?: number; nivel: NivelUI; alto?: string }) {
  const montado = useMontado();
  const max = Math.max(tope ?? meta * 1.3, valor, 1);
  return (
    <div className={cn("relative overflow-visible rounded-full bg-white/[0.06]", alto)}>
      <div className={cn("arena-barra h-full rounded-full bg-gradient-to-r", COLOR_NIVEL[nivel])} style={{ width: montado ? `${Math.max(2, (valor / max) * 100)}%` : "0%" }} />
      <span className="absolute -top-1 -bottom-1 w-0.5 rounded bg-white/70" style={{ left: `${(meta / max) * 100}%` }} title={`Meta: ${meta}`} />
    </div>
  );
}

// ─── Marcador del equipo (hero) ──────────────────────────────────────────────────────────────

export function MarcadorEquipo({
  empresa,
  mesNombre,
  diasFaltan,
  e,
  conectada,
  escalones,
  rangos,
  rangoId,
}: {
  empresa: string;
  mesNombre: string;
  diasFaltan: number;
  e: { hoy: number; semana: number; mes: number; nuevasMes: number; metaDia: number; metaSemana: number; mesTotal: number; mesNuevas: number | null; ritmoMes: number };
  conectada: boolean;
  escalones: { meta: number; logrado: boolean }[] | null;
  rangos: { id: string; t: string; href: string }[];
  rangoId: string;
}) {
  const pct = e.mesTotal ? Math.round((e.mes / e.mesTotal) * 100) : 0;
  const mini = [
    { t: "Ventas nuevas", v: e.nuevasMes, m: e.mesNuevas },
    { t: "Esta semana", v: e.semana, m: e.metaSemana },
    { t: "Hoy", v: e.hoy, m: e.metaDia },
  ];
  return (
    <section className="panel hud-esquinas arena-hero relative overflow-hidden p-5 sm:p-7">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[color:var(--coral)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            <span className="arena-vivo-punto" /> Arena · en vivo
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            La carrera de <span className="texto-ritmo">{empresa}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mesNombre} · {diasFaltan === 0 ? "último día del mes" : `faltan ${diasFaltan} ${diasFaltan === 1 ? "día" : "días"}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-full bg-black/20 p-1 text-[11px] ring-1 ring-border">
          {rangos.map((r) => (
            <Link key={r.id} href={r.href} scroll={false} className={cn("rounded-full px-2.5 py-1 transition", r.id === rangoId ? "bg-primary text-primary-foreground shadow-[0_0_14px_color-mix(in_oklch,var(--neon)_45%,transparent)]" : "text-muted-foreground hover:text-foreground")}>
              {r.t}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative mt-6 flex flex-col items-center gap-7 md:flex-row md:items-center">
        <Anillo valor={e.mes} meta={e.mesTotal} tamano={196} grosor={16} apagado={!conectada}>
          <div>
            <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Cash del mes</p>
            {conectada ? <Cifra valor={e.mes} tipo="usd" className="mt-1 block font-mono text-2xl font-semibold" /> : <p className="mt-1 font-mono text-2xl font-semibold text-muted-foreground">—</p>}
            <p className="mt-0.5 text-[11px] text-muted-foreground">de {formato(e.mesTotal, "usd")}</p>
            {conectada ? <p className="mt-1 text-xs font-semibold text-primary">{pct} %</p> : null}
          </div>
        </Anillo>
        <div className="grid w-full flex-1 gap-3 sm:grid-cols-3">
          {mini.map((x, i) => (
            <div key={x.t} className="arena-tarjeta rounded-2xl bg-white/[0.03] p-4 ring-1 ring-border/70" style={{ animationDelay: `${0.08 * i}s` }}>
              <p className="text-[11px] text-muted-foreground">{x.t}</p>
              {conectada ? <Cifra valor={x.v} tipo="usd" className="mt-1 block font-mono text-xl font-semibold" /> : <p className="mt-1 font-mono text-xl text-muted-foreground">—</p>}
              {x.m ? (
                <>
                  <div className="mt-3">
                    <BarraMeta valor={conectada ? x.v : 0} meta={x.m} tope={x.m} nivel={x.v >= x.m ? "elite" : "verde"} alto="h-1.5" />
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">meta {formato(x.m, "usd")}</p>
                </>
              ) : null}
            </div>
          ))}
          <div className="rounded-2xl bg-black/15 px-4 py-3 text-xs text-muted-foreground ring-1 ring-border/60 sm:col-span-3">
            {conectada ? (
              <>
                <Flame className="mr-1 inline size-3.5 text-[color:var(--coral)]" /> A este paso el mes cierra en <b className="font-mono text-foreground">{formato(e.ritmoMes, "usd")}</b>
                {e.mesTotal ? <> ({Math.round((e.ritmoMes / e.mesTotal) * 100)} % de la meta)</> : null}.
              </>
            ) : (
              <>📄 La hoja de ventas todavía no está conectada: el cash, la carrera y las comisiones se llenan solos cuando lo esté. El pulso de abajo ya sale del diario de cada quien.</>
            )}
            {escalones ? (
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                <span>Metas del director · ventas nuevas:</span>
                {escalones.map((m) => (
                  <span key={m.meta} className={cn("rounded-full px-2 py-0.5 font-mono", m.logrado && conectada ? "bg-primary/15 text-primary" : "bg-white/[0.05]")}>
                    {m.logrado && conectada ? "✓ " : ""}${Math.round(m.meta / 1000)}K
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pulso (KPIs del diario con mini-gráfica) ────────────────────────────────────────────────

const PULSO: Record<RolVentas, { id: string; t: string; tipo?: "usd" | "pct" }[]> = {
  chatter: [
    { id: "conversaciones", t: "Conversaciones" },
    { id: "agendadas", t: "Agendas" },
    { id: "pct_agenda", t: "% Agenda", tipo: "pct" },
    { id: "collections", t: "Collections", tipo: "usd" },
  ],
  setter: [
    { id: "llamadas", t: "Llamadas" },
    { id: "conectadas", t: "Conectadas" },
    { id: "agendadas", t: "Agendas" },
    { id: "pct_conexion", t: "% Conexión", tipo: "pct" },
  ],
  closer: [
    { id: "demos", t: "Demos" },
    { id: "cerradas", t: "Cerradas" },
    { id: "pct_cierre", t: "Close rate", tipo: "pct" },
  ],
};
const ROL_T: Record<RolVentas, string> = { closer: "Closers", setter: "Setters", chatter: "Chatters" };

export function Pulso({ pulso, etiqueta }: { pulso: Partial<Record<RolVentas, { fecha: string; kpis: Record<string, number> }[]>>; etiqueta: string }) {
  const roles = (["chatter", "setter", "closer"] as RolVentas[]).filter((r) => pulso[r]?.length);
  if (!roles.length) return null;
  return (
    <section className="panel flex flex-col gap-4 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Pulso del diario · {etiqueta.toLowerCase()}</h2>
        <span className="text-[11px] text-muted-foreground">sale de lo que cada quien anota en Mi diario</span>
      </div>
      {roles.map((rol) => {
        const dias = pulso[rol]!;
        const total: Record<string, number> = {};
        for (const d of dias) for (const [k, v] of Object.entries(d.kpis)) total[k] = (total[k] ?? 0) + v;
        const tasas = Object.fromEntries(tasasVentas(rol, total).map((t) => [t.id, t.valor]));
        const conDatos = dias.filter((d) => Object.keys(d.kpis).length).length;
        return (
          <div key={rol} className="flex flex-col gap-2">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {ROL_T[rol]} <span className="normal-case opacity-70">· {conDatos} {conDatos === 1 ? "día" : "días"} con diario</span>
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PULSO[rol].map((m, i) => {
                const esTasa = m.tipo === "pct";
                const valor = esTasa ? (tasas[m.id] ?? 0) : (total[m.id] ?? 0);
                const serie = esTasa ? [] : dias.map((d) => d.kpis[m.id] ?? 0);
                return (
                  <div key={m.id} className="arena-tarjeta group relative overflow-hidden rounded-2xl bg-white/[0.03] p-4 ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:ring-primary/40" style={{ animationDelay: `${0.05 * i}s` }}>
                    <p className="text-[11px] text-muted-foreground">{m.t}</p>
                    {esTasa && tasas[m.id] == null ? <p className="mt-1 font-mono text-2xl text-muted-foreground">—</p> : <Cifra valor={valor} tipo={m.tipo ?? "num"} className="mt-1 block font-mono text-2xl font-semibold" />}
                    {!esTasa && conDatos > 1 ? <p className="text-[10px] text-muted-foreground">{formato(valor / conDatos, m.tipo === "usd" ? "usd" : "num")} por día</p> : <p className="text-[10px] text-transparent">.</p>}
                    <div className="mt-2">{esTasa ? <BarraMeta valor={valor} meta={rol === "closer" ? 30 : rol === "setter" ? 24 : 20} tope={rol === "closer" ? 50 : 50} nivel={valor >= (rol === "closer" ? 30 : 20) ? "verde" : "amarillo"} alto="h-1.5" /> : <Spark serie={serie} alto={34} />}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Carrera con podio y pestañas por puesto ─────────────────────────────────────────────────

export type CorredorVivo = { nombre: string; userId: string | null; monto: number; ventas: number; yo: boolean };

export function CarreraVivo({ carreras }: { carreras: Record<RolVentas, CorredorVivo[]> }) {
  const roles: RolVentas[] = ["closer", "setter", "chatter"];
  const inicial = roles.find((r) => carreras[r].some((c) => c.yo)) ?? roles.find((r) => carreras[r].length) ?? "closer";
  const [rol, setRol] = useState<RolVentas>(inicial);
  const montado = useMontado();
  const lista = carreras[rol];
  const tope = Math.max(...lista.map((c) => c.monto), 1);
  const podio = [lista[1], lista[0], lista[2]];
  return (
    <section className="panel flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Trophy className="size-4 text-[color:var(--coral)]" /> La carrera del mes
        </h2>
        <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 text-xs ring-1 ring-border">
          {roles.map((r) => (
            <button key={r} type="button" onClick={() => setRol(r)} className={cn("rounded-full px-3 py-1 transition", r === rol ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
              {ROL_T[r]} <span className="opacity-60">{carreras[r].length || ""}</span>
            </button>
          ))}
        </div>
      </div>
      {lista.length ? (
        <>
          <div key={rol} className="mx-auto grid w-full max-w-xl grid-cols-3 items-end gap-3">
            {podio.map((c, i) => {
              const lugar = i === 1 ? 1 : i === 0 ? 2 : 3;
              const alto = lugar === 1 ? "h-28" : lugar === 2 ? "h-20" : "h-14";
              if (!c) return <div key={i} />;
              return (
                <div key={c.userId ?? c.nombre} className="arena-podio flex flex-col items-center gap-2 text-center" style={{ animationDelay: `${(3 - lugar) * 0.12}s` }}>
                  <div className="relative">
                    {lugar === 1 ? <Crown className="arena-corona absolute -top-5 left-1/2 size-5 -translate-x-1/2 text-[color:var(--coral)]" /> : null}
                    <Avatar nombre={c.nombre} tamano={lugar === 1 ? 58 : 46} anillo={c.yo} />
                  </div>
                  <p className={cn("max-w-full truncate text-xs font-medium", c.yo && "text-primary")}>{c.nombre.split(" ")[0]}</p>
                  <Cifra valor={c.monto} tipo="usd" className="font-mono text-sm font-semibold" />
                  <div className={cn("relative w-full overflow-hidden rounded-t-xl ring-1", alto, lugar === 1 ? "bg-gradient-to-b from-[color:var(--coral)]/35 to-[color:var(--coral)]/5 ring-[color:var(--coral)]/40" : "bg-gradient-to-b from-primary/20 to-transparent ring-border")}>
                    <span className="absolute inset-x-0 top-2 text-lg font-bold text-white/80">{lugar}</span>
                    {lugar === 1 ? <span className="arena-brillo absolute inset-0" /> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <ol className="flex flex-col gap-2.5">
            {lista.map((c, i) => (
              <li key={c.userId ?? c.nombre} className={cn("flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.03]", c.yo && "bg-primary/[0.06] ring-1 ring-primary/30")}>
                <span className="w-5 text-center font-mono text-xs text-muted-foreground">{i < 3 ? <Medal className={cn("mx-auto size-4", i === 0 ? "text-[color:var(--coral)]" : i === 1 ? "text-slate-300" : "text-amber-700")} /> : i + 1}</span>
                <Avatar nombre={c.nombre} tamano={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className={cn("truncate", c.yo && "font-semibold text-primary")}>
                      {c.nombre}
                      {c.yo ? " (tú)" : ""}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {c.ventas} {c.ventas === 1 ? "venta" : "ventas"} · <b className="text-foreground">{formato(c.monto, "usd")}</b>
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 rounded-full bg-white/[0.05]">
                    <div className={cn("arena-barra h-full rounded-full", c.yo ? "bg-primary shadow-[0_0_10px_var(--neon)]" : i === 0 ? "bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)]" : "bg-primary/45")} style={{ width: montado ? `${Math.max(2, (c.monto / tope) * 100)}%` : "0%", transitionDelay: `${i * 60}ms` }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Trophy className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Todavía no hay ventas de {ROL_T[rol].toLowerCase()} este mes.</p>
          <p className="text-[11px] text-muted-foreground/70">El podio se arma solo con el cash collected de la hoja de ventas.</p>
        </div>
      )}
    </section>
  );
}

// ─── Confeti (al guardar el diario) ──────────────────────────────────────────────────────────

export function Confeti({ disparo }: { disparo: number }) {
  if (!disparo || sinMovimiento()) return null;
  const piezas = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div key={disparo} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {piezas.map((i) => (
        <span
          key={i}
          className="arena-confeti absolute top-1/2 left-1/2 block size-1.5 rounded-[2px]"
          style={
            {
              background: i % 3 === 0 ? "var(--coral)" : i % 3 === 1 ? "var(--neon)" : "oklch(0.9 0.12 90)",
              "--dx": `${Math.cos((i / 26) * Math.PI * 2) * (90 + (i % 5) * 22)}px`,
              "--dy": `${Math.sin((i / 26) * Math.PI * 2) * (70 + (i % 4) * 20) - 40}px`,
              animationDelay: `${(i % 6) * 15}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

