import { ChevronRight, Settings } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Correcciones } from "@/components/ritmo/correcciones";
import { COLOR, EmpresaBadge, EstadoChip, FiltroEmpresa, fmtHoras, horaPR, MiniDias, ScoreBadge, Tarjeta } from "@/components/ritmo/piezas";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { armarPanel, modoScore, type FilaPersona, type Panel } from "@/lib/desempeno/datos";
import { DEPARTAMENTOS, fechaPR, puedeAprobar, puestoPorId, sumarDias, type Color } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipo" };

const esProduccion = (puesto: string) => puestoPorId(puesto)?.kpis.some((k) => k.fuente === "produccion" && k.id === "terminadas");

export default async function DesempenoPage({ searchParams }: { searchParams: Promise<{ d?: string; e?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const { d: depto, e: empresa } = await searchParams;
  const url = (p: { d?: string | null; e?: string | null }) => {
    const q = new URLSearchParams();
    const dd = p.d === undefined ? depto : p.d;
    const ee = p.e === undefined ? empresa : p.e;
    if (dd) q.set("d", dd);
    if (ee) q.set("e", ee);
    return `/ritmo/equipo${q.size ? `?${q}` : ""}`;
  };
  const hoy = fechaPR(Date.now());
  const gestor = u.maestro;

  let panel: Panel;
  try {
    panel = await armarPanel(u, sumarDias(hoy, -6), hoy);
  } catch (e) {
    console.error("[desempeno] panel", e);
    return (
      <Marco gestor={gestor}>
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Desempeño todavía no está activado en esta base (falta la migración 0008).
        </p>
      </Marco>
    );
  }

  // La vista maestra es solo de admin/editoras; los demás van a su propia ficha.
  if (!gestor) redirect(`/ritmo/equipo/${u.id}`);

  const modo = modoScore(u.rol);
  const oculto = modo === "oculto";
  const deEmpresa = empresa ? panel.filas.filter((f) => f.perfil.empresa === empresa) : panel.filas;
  const filas = depto ? deEmpresa.filter((f) => f.departamento === depto) : deEmpresa;
  const laborables = filas.filter((f) => f.hoy.asistencia.estado !== "libre");
  const presentes = laborables.filter((f) => ["trabajando", "a_tiempo", "tarde"].includes(f.hoy.asistencia.estado)).length;
  const tarde = laborables.filter((f) => f.hoy.asistencia.minutosTarde > 15).length;
  const sinMarcar = laborables.filter((f) => f.hoy.asistencia.estado === "ausente").length;
  const vencidas = filas.reduce((s, f) => s + (f.produccion?.vencidas ?? 0), 0);
  const terminadas = filas.reduce((s, f) => s + (f.produccion?.terminadas ?? 0), 0);
  const conteo: Record<Color, number> = { verde: 0, amarillo: 0, rojo: 0 };
  for (const f of filas) if (f.colorSemana) conteo[f.colorSemana]++;
  const correcciones = deEmpresa
    .filter((f) => puedeAprobar(u, f.perfil))
    .flatMap((f) => f.correcciones.map((c) => ({ id: c.id, nombre: f.perfil.nombre, fecha: c.fecha, entradaAt: c.entradaAt.toISOString(), salidaAt: c.salidaAt?.toISOString() ?? null, nota: c.nota })));
  const deptos = DEPARTAMENTOS.filter((x) => deEmpresa.some((f) => f.departamento === x));
  const fechaLarga = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Marco gestor={gestor}>
      <section className="flex flex-col gap-4">
        <div>
          <p className="mb-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{fechaLarga}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Equipo</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Asistencia, tareas y resultados por puesto. Lo mide el sistema solo; el equipo solo marca entrada, salida y bloqueos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <FiltroEmpresa actual={empresa} href={(e) => url({ e, d: null })} />
        {deptos.length > 1 ? (
          <div className="flex flex-wrap gap-1 rounded-full border border-border bg-card/60 p-1 text-xs">
            <Link href={url({ d: null })} className={cn("rounded-full px-3 py-1.5 transition", !depto ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Todos</Link>
            {deptos.map((x) => (
              <Link key={x} href={url({ d: x })} className={cn("rounded-full px-3 py-1.5 transition", depto === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{x}</Link>
            ))}
          </div>
        ) : null}
        </div>
      </section>

      {modo !== "visible" ? (
        <p className="rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-2.5 text-sm text-foreground/90">
          <b>Calibrando.</b> Las primeras semanas solo se recogen datos para fijar metas reales; el score no se le enseña al equipo.
          {modo === "vista-previa" ? " Tú lo ves como vista previa." : ""}
        </p>
      ) : null}

      {!panel.filas.length ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {gestor ? (
            <>
              Todavía no hay nadie en Desempeño.{" "}
              <Link href="/ritmo/ajustes" className="font-medium text-primary underline-offset-4 hover:underline">Crea los perfiles</Link> (puesto, líder y horario).
            </>
          ) : (
            "Todavía no tienes gente a cargo en Desempeño."
          )}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Tarjeta titulo="Presentes hoy" valor={`${presentes}/${laborables.length}`} detalle={tarde ? `${tarde} llegaron tarde` : "Todos a tiempo"} tono={tarde ? "ambar" : undefined} />
            <Tarjeta titulo="Sin marcar" valor={sinMarcar} detalle="Día laborable sin entrada" tono={sinMarcar ? "rojo" : undefined} />
            <Tarjeta titulo="Terminadas (7 d)" valor={panel.hayProduccion ? terminadas : "—"} detalle={panel.hayProduccion ? "Tablero Producción" : "Falta el tablero Producción"} />
            <Tarjeta titulo="Vencidas" valor={panel.hayProduccion ? vencidas : "—"} detalle="Entregables atrasados" tono={vencidas ? "rojo" : undefined} />
            <div className="col-span-2 panel p-4 md:col-span-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Semana</p>
              {oculto ? (
                <p className="mt-2 text-sm text-muted-foreground">Calibrando</p>
              ) : (
                <div className="mt-2 flex flex-col gap-1 text-sm">
                  {(Object.keys(conteo) as Color[]).map((c) => (
                    <span key={c} className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", COLOR[c].punto)} />
                      <span className="tabular-nums font-semibold">{conteo[c]}</span>
                      <span className="text-muted-foreground">{COLOR[c].nombre}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <Correcciones lista={correcciones} />

          {(depto ? [depto] : deptos).map((dep) => {
            const gente = filas.filter((f) => f.departamento === dep);
            if (!gente.length) return null;
            return (
              <section key={dep} className="overflow-hidden panel">
                <header className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">{dep}</h2>
                  <span className="text-xs text-muted-foreground">{gente.length} {gente.length === 1 ? "persona" : "personas"}</span>
                </header>
                <ul className="divide-y">
                  {gente.map((f) => (
                    <FilaPersonaUI key={f.perfil.userId} f={f} oculto={oculto} />
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </Marco>
  );
}

function FilaPersonaUI({ f, oculto }: { f: FilaPersona; oculto: boolean }) {
  const a = f.hoy.asistencia;
  const prod = esProduccion(f.perfil.puesto) ? f.produccion : null;
  return (
    <li>
      <Link href={`/ritmo/equipo/${f.perfil.userId}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-white/[0.03] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto_auto_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar nombre={f.perfil.nombre} color={f.perfil.color as ColorPulse | null} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-sm font-medium">{f.perfil.nombre}<EmpresaBadge empresa={f.perfil.empresa} /></p>
            <p className="truncate text-xs text-muted-foreground">{f.puestoNombre}</p>
          </div>
        </div>
        <div className="order-3 col-span-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:order-none md:col-span-1">
          <EstadoChip estado={a.estado} extra={a.minutosTarde > 15 ? `${a.minutosTarde} min` : undefined} />
          {a.entrada ? (
            <span className="tabular-nums">
              {horaPR(a.entrada)} – {a.estado === "trabajando" ? "ahora" : horaPR(a.salida)} · {fmtHoras(a.horas)}
            </span>
          ) : null}
          {f.hoy.reporte?.bloqueos ? <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-amber-300">bloqueo</span> : null}
        </div>
        <div className="hidden text-xs text-muted-foreground tabular-nums md:block">
          {prod ? (
            <>
              <b className="text-foreground">{prod.terminadas}</b> terminadas · <b className={prod.vencidas ? "text-red-400" : "text-foreground"}>{prod.vencidas}</b> vencidas · {prod.backlog} en cola
            </>
          ) : f.perfil.puesto === "pm" && f.produccion ? (
            <>
              <b className={f.produccion.vencidasPedidas ? "text-red-400" : "text-foreground"}>{f.produccion.vencidasPedidas}</b> entregables vencidos
            </>
          ) : (
            "KPIs en fase 2"
          )}
        </div>
        <div className="hidden md:block">
          <MiniDias dias={f.dias} oculto={oculto} />
        </div>
        <div className="order-2 flex flex-col items-end gap-0.5 md:order-none">
          <ScoreBadge score={f.hoy.score.score} color={f.hoy.color} oculto={oculto} />
          {!oculto && f.scoreSemana !== null ? <span className="text-[11px] text-muted-foreground tabular-nums">sem. {f.scoreSemana}</span> : null}
        </div>
        <ChevronRight className="hidden size-4 text-muted-foreground md:block" />
      </Link>
    </li>
  );
}

function Marco({ children, gestor }: { children: React.ReactNode; gestor: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {gestor ? (
        <Link href="/ritmo/ajustes" className="-mb-2 flex items-center gap-1.5 self-end text-xs text-muted-foreground hover:text-foreground">
          <Settings className="size-3.5" /> Ajustes
        </Link>
      ) : null}
      {children}
    </div>
  );
}
