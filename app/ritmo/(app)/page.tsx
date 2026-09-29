import { Bot, Briefcase, Building2, CalendarDays, ChevronRight, HeartPulse, Inbox, Newspaper, Plane, ShieldCheck, Trophy, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { diasYHoras } from "@/lib/desempeno/rrhh";

import { EstadoChip, fmtHoras, MiniDias, ScoreBadge } from "@/components/ritmo/piezas";
import { Animo } from "@/components/ritmo/bienestar";
import { Noticia } from "@/components/ritmo/noticias";
import { MiMarcador } from "@/components/ritmo/arena-marcador";
import { MiDiaGoogle } from "@/components/ritmo/mi-dia-google";
import { Ponche } from "@/components/ritmo/ponche";
import { AppMovil } from "@/components/ritmo/app-movil";
import { armarPanel, estadoPonche, modoScore } from "@/lib/desempeno/datos";
import { estadoSeguridad } from "@/lib/desempeno/seguridad";
import { faltantesFicha, listaHumana } from "@/lib/desempeno/ficha-completa";
import { fichaCompleta } from "@/lib/desempeno/fichas";
import { hoyPR as hoyBienestar, registrosDe } from "@/lib/desempeno/bienestar";
import { META_SEMANAL_MIN, miSemana, rutinaDelDia, semanaDe } from "@/lib/desempeno/bienestar-reglas";
import { listarNoticias } from "@/lib/desempeno/noticias";
import { fechaPR, sumarDias } from "@/lib/desempeno/reglas";
import { googleListo, miDia } from "@/lib/desempeno/google-cal";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { pendientesDe } from "@/lib/desempeno/solicitudes";
import { accesoArena, armarArena } from "@/lib/ventas/datos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hoy" };

const saludo = () => {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", hour12: false }));
  return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
};

export default async function HoyPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const hoy = fechaPR(Date.now());
  // Dirección (Elvin, Carilin, Aure): ve el ponche como todos, opcional, con su nota especial.
  const direccion = u.rol === "admin" || u.rol === "editor";
  const estado = await estadoPonche(u.id, direccion);
  // Ventas (Arena): sin reloj; en su lugar, su marcador (el ponche devuelve null para su puesto).
  const arena = !estado && !direccion ? await accesoArena(u).catch(() => null) : null;
  const vende = arena?.perfil ? arena : null;
  const ventas = vende ? await armarArena(u, vende, vende.perfil!.empresa as "level_up").catch(() => null) : null;
  const seguridad = estado && !estado.sinPerfil ? await estadoSeguridad(u).catch(() => undefined) : undefined;
  // Sin perfil (dirección) no hay "Mi semana": no vale la pena armar el panel.
  const panel = estado && !estado.sinPerfil ? await armarPanel(u, sumarDias(hoy, -6), hoy).catch(() => null) : null;
  const yo = panel?.filas.find((f) => f.perfil.userId === u.id);
  const oculto = modoScore(u.rol) === "oculto";
  const ficha = await fichaCompleta(u.id).catch(() => null);
  // Elvin, 28/sep: "todo el mundo debe tener todos los datos llenos, incluyendo fotos".
  const faltan = ficha && !direccion ? faltantesFicha(ficha.ficha, { identificacion: ficha.archivos.filter((a) => a.categoria === "identificacion").length, contrato: ficha.archivos.filter((a) => a.categoria === "contrato").length }) : [];
  const vac = ficha?.saldos?.puedeSolicitar && ficha.saldos.vacaciones.disponibles >= 1 ? ficha.saldos.vacaciones.disponibles : null;
  const noticias = await listarNoticias(3).catch(() => []);
  const semanaB = semanaDe(hoyBienestar());
  const misB = await registrosDe(u.id, semanaB).catch(() => []);
  const bien = miSemana(misB, semanaB, hoyBienestar());
  const pausaHoy = misB.some((r) => r.fecha === hoyBienestar() && r.tipo === "pausa");
  const animoHoy = misB.find((r) => r.fecha === hoyBienestar() && r.tipo === "animo")?.valor ?? null;
  // Mi día (Google Calendar del correo de trabajo): solo si la app de Google está configurada.
  const calendario = googleListo() ? await miDia(u.id, hoy).catch(() => null) : undefined;
  const porFirmar = u.maestro || direccion ? await pendientesDe(u).catch(() => 0) : 0;
  const fecha = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });

  const esDireccion = u.maestro || direccion;
  // Accesos de la dirección (Elvin, 29/sep: "más organizado, que aproveche los lados, no todo hacia abajo").
  const accesos = [
    { href: "/ritmo/equipo", t: "Equipo", d: "Asistencia y KPIs", i: Users },
    { href: "/ritmo/personas", t: "Personas", d: "Fichas y nómina", i: UsersRound },
    ...(direccion ? [{ href: "/ritmo/agentes", t: "Agentes", d: "Equipo digital", i: Bot }] : []),
    { href: "/ritmo/arena", t: "Arena", d: "Ventas y comisiones", i: Trophy },
    { href: "/ritmo/solicitudes", t: "Solicitudes", d: "Aprobar y firmar", i: Inbox, n: porFirmar },
    { href: "/ritmo/calendario", t: "Calendario", d: "Quién está fuera", i: CalendarDays },
    { href: "/ritmo/carreras", t: "Carreras", d: "Vacantes y referidos", i: Briefcase },
    { href: "/ritmo/noticias", t: "Noticias", d: "Publicar al equipo", i: Newspaper },
    { href: "/ritmo/empresa", t: "Empresa", d: "Quiénes somos", i: Building2 },
    { href: "/ritmo/seguridad", t: "Seguridad", d: "Equipos y ponches", i: ShieldCheck },
    { href: "/ritmo/bienestar", t: "Bienestar", d: "Pausas y energía", i: HeartPulse },
    ...(u.rol === "admin" ? [{ href: "/ritmo/viajes", t: "Viajes", d: "Solo tú, por ahora", i: Plane }] : []),
  ] as { href: string; t: string; d: string; i: typeof Users; n?: number }[];

  const avisos = (
    <>
      {faltan.length ? (
        <Link href="/ritmo/bienvenida" className="rounded-2xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm">
          📋 <b>Completa tu ficha hoy.</b> Te falta: <b>{listaHumana(faltan)}</b>. Toca aquí para llenarla.
        </Link>
      ) : null}
      {vac ? (
        <Link href={`/ritmo/personas/${u.id}`} className="rounded-2xl border border-[color:var(--coral)]/40 bg-[color:var(--coral)]/10 px-4 py-3 text-sm">
          🌴 <b>Ya cumpliste 12 meses.</b> Tienes <b>{diasYHoras(vac, ficha?.saldos?.horasDia ?? 8)}</b> de vacaciones para solicitar. Coordínalo con RR.HH.
        </Link>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ceja">{fecha}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            {saludo()}, <span className="texto-ritmo">{u.nombre.split(" ")[0]}</span>
          </h1>
        </div>
        {esDireccion ? <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] tracking-widest text-primary uppercase ring-1 ring-primary/30">Dirección · el ponche es opcional</span> : null}
      </header>

      {faltan.length || vac ? <div className="flex flex-col gap-2">{avisos}</div> : null}

      {/* La app en el teléfono: solo aparece en el celular mientras falte instalarla o activar los avisos. */}
      <AppMovil clave={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} tarjeta />

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        {/* izquierda: el ponche (o el marcador de ventas) y mi semana */}
        <div className="flex flex-col items-center gap-5 lg:sticky lg:top-20">
          {estado ? <Ponche estado={estado} horasHoy={yo?.hoy.asistencia.horas ?? 0} seguridad={seguridad} /> : null}
          {estado?.sinPerfil ? <p className="max-w-xs text-center text-[11px] text-muted-foreground">Si lo usas, queda solo para ti y no cuenta en ningún reporte.</p> : null}

          {ventas?.mio ? (
            <div className="flex w-full flex-col gap-3">
              <MiMarcador rol={ventas.mio.rol} m={ventas.mio.m} goal={ventas.mio.goal} compacto />
              <Link href="/ritmo/arena" className="panel group flex items-center gap-3 p-4 transition hover:border-primary/40">
                <Trophy className="size-5 text-[color:var(--coral)]" />
                <span className="flex-1 text-sm font-medium">La carrera, los bonos y mi diario</span>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
              </Link>
            </div>
          ) : vende ? (
            <Link href="/ritmo/arena" className="panel group flex w-full items-center gap-3 p-4 transition hover:border-primary/40">
              <Trophy className="size-5 text-[color:var(--coral)]" />
              <span className="flex-1 text-sm font-medium">Arena: la carrera, las comisiones y los bonos del equipo</span>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
            </Link>
          ) : null}

          {!estado && !vende && !esDireccion ? <div className="panel p-5 text-center text-sm text-muted-foreground">Todavía no tienes perfil en Ritmo. Pídele a Carilin que te lo active (puesto, líder y horario).</div> : null}

          {yo ? (
            <Link href={`/ritmo/equipo/${u.id}`} className="panel group flex w-full items-center gap-4 p-4 transition hover:border-primary/40">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <EstadoChip estado={yo.hoy.asistencia.estado} />
                  <span className="num text-sm text-muted-foreground">{fmtHoras(yo.hoy.asistencia.horas)} hoy</span>
                </div>
                <MiniDias dias={yo.dias} oculto={oculto} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] text-muted-foreground uppercase">Mi semana</span>
                <ScoreBadge score={yo.scoreSemana} color={yo.colorSemana} oculto={oculto} />
              </div>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
            </Link>
          ) : null}
        </div>

        {/* derecha: accesos, mi día, bienestar, empresa y noticias */}
        <div className="flex min-w-0 flex-col gap-5">
          {esDireccion ? (
            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {accesos.map((a) => (
                <Link key={a.href} href={a.href} className="panel group relative flex flex-col gap-2 p-3 transition hover:border-primary/40 hover:bg-primary/[0.04]">
                  <span className="flex items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/25">
                      <a.i className="size-4" />
                    </span>
                    <span className="text-sm leading-tight font-medium">{a.t}</span>
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{a.d}</span>
                  {a.n ? <span className="absolute top-2 right-2 rounded-full bg-[color:var(--coral)] px-1.5 text-[10px] font-semibold text-background">{a.n}</span> : null}
                </Link>
              ))}
            </section>
          ) : null}

          {calendario !== undefined ? (
            <MiDiaGoogle
              conectado={!!calendario}
              email={calendario?.email ?? null}
              eventos={calendario && "eventos" in calendario ? calendario.eventos : []}
              error={calendario && "error" in calendario ? calendario.error : null}
              hoy={hoy}
            />
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <section className="panel flex flex-col gap-3 p-4">
              <Link href="/ritmo/bienestar" className="group flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--coral)]/12 text-[color:var(--coral)] ring-1 ring-[color:var(--coral)]/30">
                  <HeartPulse className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{pausaHoy ? "✓ Pausa activa hecha" : `Pausa activa: ${rutinaDelDia(hoyBienestar()).titulo} · 5 min`}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)]" style={{ width: `${bien.pct}%` }} />
                    </div>
                    <span className="num font-mono text-[11px] text-muted-foreground">{bien.minutos}/{META_SEMANAL_MIN} min</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
              </Link>
              <div className="border-t border-border/60 pt-3">
                <p className="mb-1 text-xs text-muted-foreground">¿Cómo está tu energía hoy?</p>
                <Animo valor={animoHoy} compacto />
              </div>
            </section>

            <div className="flex flex-col gap-5">
              <Link href="/ritmo/empresa" className="panel group flex items-center gap-3 p-4 transition hover:border-primary/40">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Conoce la empresa</p>
                  <p className="text-xs text-muted-foreground">Quiénes somos, el equipo, políticas y respuestas rápidas</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
              </Link>
              {u.maestro && u.rol === "admin" ? (
                <Link href="/ritmo/viajes" className="panel group flex items-center gap-3 p-4 transition hover:border-primary/40">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
                    <Plane className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Planifica tus próximas vacaciones</p>
                    <p className="text-xs text-muted-foreground">Local, dentro de tu país o internacional · y el viaje del año 🏆</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
                </Link>
              ) : null}
            </div>
          </div>

          {noticias.length ? (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="ceja">Noticias</p>
                <Link href="/ritmo/noticias" className="text-xs text-muted-foreground hover:text-foreground">
                  Ver todas →
                </Link>
              </div>
              <div className="panel divide-y divide-border/60 overflow-hidden">
                {noticias.map((n) => (
                  <Noticia key={n.id} n={{ ...n, createdAt: n.createdAt.toISOString() }} maestro={false} compacta />
                ))}
              </div>
            </section>
          ) : u.maestro ? (
            <Link href="/ritmo/noticias" className="text-xs text-muted-foreground hover:text-foreground">
              📰 Publica la primera noticia del equipo →
            </Link>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Ritmo solo guarda tu hora de entrada y salida y lo que tú reportes. Tus tareas y resultados salen de las herramientas del equipo. Sin capturas, sin GPS.
          </p>
        </div>
      </div>
    </div>
  );
}
