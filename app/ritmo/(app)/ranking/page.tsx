import { AlertTriangle, ChevronLeft, ChevronRight, ThumbsDown, ThumbsUp, TrendingUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Hora } from "@/components/ritmo/hora-local";
import { EmpresaBadge, EstadoChip, FiltroEmpresa } from "@/components/ritmo/piezas";
import { armarPanel, type FilaPersona } from "@/lib/desempeno/datos";
import { rachaBaja, rankingMes } from "@/lib/desempeno/ranking";
import { personasRank } from "@/lib/desempeno/ranking-datos";
import { DEPARTAMENTOS, fechaPR, puestoPorId, sumarDias } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ranking" };

// Ranking del equipo (30/sep, Elvin: "que por la mañana pueda ver la data de ayer… los KPIs desplegados en un solo lugar…
// y mensual un ranking de los empleados según productividad, con lo bueno, lo malo y lo que tiene que mejorar"). Solo la
// vista maestra (Elvin, Carilin, Aure, Yaileen).

const largo = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });
const nombreMes = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString("es-PR", { month: "long", year: "numeric" });
const ultimoDia = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${m}-${String(new Date(Date.UTC(y, mm, 0)).getUTCDate()).padStart(2, "0")}`;
};
const mesMas = (m: string, n: number) => {
  const [y, mm] = m.split("-").map(Number);
  const t = new Date(Date.UTC(y, mm - 1 + n, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
};
const colorIndice = (n: number) => (n >= 90 ? "text-emerald-300" : n >= 75 ? "text-amber-300" : "text-red-300");
const barraIndice = (n: number) => (n >= 90 ? "bg-emerald-400" : n >= 75 ? "bg-amber-400" : "bg-red-400");

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ v?: string; m?: string; e?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  if (!u.maestro) redirect("/ritmo");
  const { v, m, e: empresa } = await searchParams;
  const vista = v === "mes" ? "mes" : "ayer";
  const hoy = fechaPR(Date.now());
  const ayer = sumarDias(hoy, -1);
  const href = (p: { v?: string; m?: string | null; e?: string | null }) => {
    const q = new URLSearchParams();
    const vv = p.v ?? vista;
    if (vv === "mes") q.set("v", "mes");
    const mm = p.m === undefined ? m : p.m;
    if (vv === "mes" && mm) q.set("m", mm);
    const ee = p.e === undefined ? empresa : p.e;
    if (ee) q.set("e", ee);
    return `/ritmo/ranking${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="ceja">Equipo</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ranking</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Lo de ayer de cada persona en un solo lugar, y el ranking del mes por productividad (0 a 100). Se actualiza solo con lo que marcan y reportan.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 text-sm">
            <Link href={href({ v: "ayer" })} className={cn("rounded-full px-4 py-1.5 transition", vista === "ayer" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Ayer</Link>
            <Link href={href({ v: "mes" })} className={cn("rounded-full px-4 py-1.5 transition", vista === "mes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Mes</Link>
          </div>
          <FiltroEmpresa actual={empresa} href={(e) => href({ e })} />
        </div>
      </div>
      {vista === "ayer" ? <VistaAyer u={u} hoy={hoy} ayer={ayer} empresa={empresa} /> : <VistaMes u={u} ayer={ayer} mes={m && /^\d{4}-\d{2}$/.test(m) ? m : ayer.slice(0, 7)} empresa={empresa} href={href} />}
    </div>
  );
}

type Usuario = NonNullable<Awaited<ReturnType<typeof usuarioRitmo>>>;

async function VistaAyer({ u, hoy, ayer, empresa }: { u: Usuario; hoy: string; ayer: string; empresa?: string }) {
  const panel = await armarPanel(u, sumarDias(hoy, -12), ayer);
  const filas = panel.filas.filter((f) => !empresa || f.perfil.empresa === empresa);
  // "Ayer" = el último día que le tocaba trabajar a alguien (el lunes muestra el viernes).
  let dia = ayer;
  for (let i = 0; i < 6 && !filas.some((f) => f.dias.find((d) => d.fecha === dia && d.asistencia.estado !== "libre")); i++) dia = sumarDias(dia, -1);
  const rachas = personasRank(filas).flatMap((p) => {
    const r = rachaBaja(p);
    return r ? [{ id: p.id, nombre: p.nombre, ...r }] : [];
  });
  const deps = DEPARTAMENTOS.filter((x) => filas.some((f) => f.departamento === x));
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold capitalize">{largo(dia)}</h2>
        <span className="text-sm text-muted-foreground">
          {filas.filter((f) => ["a_tiempo", "tarde", "trabajando"].includes(f.dias.find((d) => d.fecha === dia)?.asistencia.estado ?? "")).length} de{" "}
          {filas.filter((f) => (f.dias.find((d) => d.fecha === dia)?.asistencia.estado ?? "libre") !== "libre").length} trabajaron
        </span>
      </div>

      {rachas.length ? (
        <section className="panel border-red-400/30 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-300">
            <AlertTriangle className="size-4" /> Varios días seguidos con baja productividad
          </h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {rachas.map((r) => (
              <li key={r.id}>
                <Link href={`/ritmo/equipo/${r.id}`} className="font-medium hover:underline">{r.nombre}</Link>
                <span className="text-muted-foreground"> · {r.dias} días seguidos ({r.motivo})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] px-4 py-2.5 text-sm text-emerald-200">✅ Nadie lleva varios días seguidos con baja productividad.</p>
      )}

      {deps.map((dep) => (
        <section key={dep} className="panel overflow-hidden">
          <header className="border-b border-border/50 px-4 py-2.5 text-sm font-semibold">{dep}</header>
          <ul className="divide-y divide-border/40">
            {filas
              .filter((f) => f.departamento === dep)
              .map((f) => (
                <FilaAyer key={f.perfil.userId} f={f} dia={dia} />
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function FilaAyer({ f, dia }: { f: FilaPersona; dia: string }) {
  const d = f.dias.find((x) => x.fecha === dia);
  const a = d?.asistencia;
  const kpis = puestoPorId(f.perfil.puesto)?.manual ?? [];
  const trabajo = !!a && ["a_tiempo", "tarde", "trabajando"].includes(a.estado);
  return (
    <li className="grid gap-x-6 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.6fr)]">
      <div className="min-w-0">
        <Link href={`/ritmo/equipo/${f.perfil.userId}`} className="flex items-center gap-2 text-sm font-medium hover:underline">
          {f.perfil.nombre}
          <EmpresaBadge empresa={f.perfil.empresa} />
        </Link>
        <p className="truncate text-xs text-muted-foreground">{f.puestoNombre}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground tabular-nums">
        {a ? <EstadoChip estado={a.estado} extra={a.minutosTarde > 15 ? `${a.minutosTarde} min` : undefined} /> : null}
        {a?.entrada ? (
          <span>
            <Hora iso={a.entrada} />
            {d?.almuerzo ? (
              <>
                {" · alm. "}
                <Hora iso={d.almuerzo.salida} />
                {d.almuerzo.vuelta ? (
                  <>
                    –<Hora iso={d.almuerzo.vuelta} />
                  </>
                ) : null}
              </>
            ) : null}
            {" · "}
            {a.salida ? <Hora iso={a.salida} /> : "sin salida"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        {!kpis.length ? (
          <span className="text-xs text-muted-foreground">Su puesto no reporta KPIs.</span>
        ) : d?.reporte ? (
          kpis.map((k) => (
            <span key={k.id} className="flex flex-wrap gap-x-1.5">
              <span className="text-muted-foreground">{k.nombre}:</span>
              <b className={cn("tabular-nums", !(d.reporte!.datos[k.id] ?? 0) && "text-muted-foreground")}>{d.reporte!.datos[k.id] ?? 0}</b>
              {d.reporte!.detalles[k.id] ? <span className="text-xs text-muted-foreground italic">· {d.reporte!.detalles[k.id]}</span> : null}
            </span>
          ))
        ) : trabajo ? (
          <span className="text-xs text-red-300">No anotó sus KPIs</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
        {d?.reporte?.bloqueos ? <span className="rounded bg-amber-400/10 px-2 py-1 text-xs text-amber-200">Bloqueo: {d.reporte.bloqueos}</span> : null}
      </div>
    </li>
  );
}

async function VistaMes({ u, ayer, mes, empresa, href }: { u: Usuario; ayer: string; mes: string; empresa?: string; href: (p: { v?: string; m?: string | null; e?: string | null }) => string }) {
  const desde = `${mes}-01`;
  const fin = ultimoDia(mes);
  const hasta = fin < ayer ? fin : ayer;
  const actual = ayer.slice(0, 7);
  if (desde > hasta) return <p className="panel p-6 text-center text-sm text-muted-foreground">Todavía no hay datos de {nombreMes(mes)}.</p>;
  const panel = await armarPanel(u, desde, hasta);
  const filas = panel.filas.filter((f) => !empresa || f.perfil.empresa === empresa);
  const ranking = rankingMes(personasRank(filas));
  const empresaDe = new Map(filas.map((f) => [f.perfil.userId, f.perfil.empresa]));
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={href({ m: mesMas(mes, -1) })} className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground" aria-label="Mes anterior"><ChevronLeft className="size-4" /></Link>
        <h2 className="text-lg font-semibold capitalize">{nombreMes(mes)}</h2>
        {mes < actual ? <Link href={href({ m: mesMas(mes, 1) })} className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground" aria-label="Mes siguiente"><ChevronRight className="size-4" /></Link> : null}
        <span className="text-sm text-muted-foreground">{mes === actual ? `hasta ayer (${largo(hasta)})` : "mes completo"}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Índice de productividad: 30 % asistencia (puntualidad) · 20 % constancia (anotó sus KPIs al salir) · 50 % producción (sus KPIs comparados con el mejor de su mismo puesto). Sin KPIs en su puesto, cuenta solo la asistencia.
      </p>
      {!ranking.length ? <p className="panel p-6 text-center text-sm text-muted-foreground">No hay datos para este mes.</p> : null}
      <ol className="flex flex-col gap-3">
        {ranking.map((f) => (
          <li key={f.id} className="panel p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", f.posicion <= 3 ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-white/5 text-muted-foreground")}>{f.posicion}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/ritmo/equipo/${f.id}`} className="flex items-center gap-2 font-medium hover:underline">
                  {f.nombre}
                  <EmpresaBadge empresa={empresaDe.get(f.id) ?? "level_up"} />
                </Link>
                <p className="text-xs text-muted-foreground">{f.puestoNombre} · {f.diasTrabajados} días trabajados</p>
              </div>
              <div className="flex w-40 flex-col items-end gap-1">
                <span className={cn("num text-2xl font-semibold tabular-nums", colorIndice(f.indice))}>
                  {f.indice}
                  <span className="text-sm text-muted-foreground">/100</span>
                </span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <span className={cn("block h-full rounded-full", barraIndice(f.indice))} style={{ width: `${f.indice}%` }} />
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Asistencia <b className="text-foreground">{f.asistencia ?? "—"}</b></span>
              <span>Constancia <b className="text-foreground">{f.constancia ?? "—"}</b></span>
              <span>Producción <b className="text-foreground">{f.produccion ?? "—"}</b></span>
              {f.totales.map((k) => (
                <span key={k.id}>
                  {k.nombre}: <b className="text-foreground">{k.total}</b>
                  {k.lider > k.total ? <span className="opacity-70"> (mejor {k.lider})</span> : null}
                </span>
              ))}
            </div>
            {f.bueno.length || f.malo.length || f.mejorar.length ? (
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                <Lista icono={<ThumbsUp className="size-3.5" />} titulo="Lo bueno" items={f.bueno} clase="text-emerald-300" />
                <Lista icono={<ThumbsDown className="size-3.5" />} titulo="Lo malo" items={f.malo} clase="text-red-300" />
                <Lista icono={<TrendingUp className="size-3.5" />} titulo="Qué mejorar" items={f.mejorar} clase="text-amber-300" />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">El día 1 de cada mes, el ranking del mes que terminó le llega por Slack a RR.HH. (Yaileen) y a Carilin.</p>
    </>
  );
}

function Lista({ icono, titulo, items, clase }: { icono: React.ReactNode; titulo: string; items: string[]; clase: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-2.5">
      <p className={cn("mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase", clase)}>
        {icono} {titulo}
      </p>
      {items.length ? (
        <ul className="flex flex-col gap-0.5 text-xs text-foreground/90">
          {items.map((x) => (
            <li key={x}>· {x}</li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">—</p>
      )}
    </div>
  );
}
