import { Building2, ChevronRight, HeartPulse, Plane } from "lucide-react";
import Link from "next/link";
import { diasYHoras } from "@/lib/desempeno/rrhh";

import { EstadoChip, fmtHoras, MiniDias, ScoreBadge } from "@/components/ritmo/piezas";
import { Animo } from "@/components/ritmo/bienestar";
import { Noticia } from "@/components/ritmo/noticias";
import { Ponche } from "@/components/ritmo/ponche";
import { armarPanel, estadoPonche, modoScore } from "@/lib/desempeno/datos";
import { fichaCompleta } from "@/lib/desempeno/fichas";
import { hoyPR as hoyBienestar, registrosDe } from "@/lib/desempeno/bienestar";
import { META_SEMANAL_MIN, miSemana, rutinaDelDia, semanaDe } from "@/lib/desempeno/bienestar-reglas";
import { listarNoticias } from "@/lib/desempeno/noticias";
import { fechaPR, sumarDias } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

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
  // Sin perfil (dirección) no hay "Mi semana": no vale la pena armar el panel.
  const panel = estado && !estado.sinPerfil ? await armarPanel(u, sumarDias(hoy, -6), hoy).catch(() => null) : null;
  const yo = panel?.filas.find((f) => f.perfil.userId === u.id);
  const oculto = modoScore(u.rol) === "oculto";
  const ficha = await fichaCompleta(u.id).catch(() => null);
  const vac = ficha?.saldos?.puedeSolicitar && ficha.saldos.vacaciones.disponibles >= 1 ? ficha.saldos.vacaciones.disponibles : null;
  const noticias = await listarNoticias(3).catch(() => []);
  const semanaB = semanaDe(hoyBienestar());
  const misB = await registrosDe(u.id, semanaB).catch(() => []);
  const bien = miSemana(misB, semanaB, hoyBienestar());
  const pausaHoy = misB.some((r) => r.fecha === hoyBienestar() && r.tipo === "pausa");
  const animoHoy = misB.find((r) => r.fecha === hoyBienestar() && r.tipo === "animo")?.valor ?? null;
  const fecha = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col items-center gap-10 pt-4">
      <div className="text-center">
        <p className="ceja">{fecha}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {saludo()}, <span className="texto-ritmo">{u.nombre.split(" ")[0]}</span>
        </h1>
      </div>

      {vac ? (
        <Link href={`/ritmo/personas/${u.id}`} className="w-full max-w-md rounded-2xl border border-[color:var(--coral)]/40 bg-[color:var(--coral)]/10 px-4 py-3 text-center text-sm">
          🌴 <b>Ya cumpliste 12 meses.</b> Tienes <b>{diasYHoras(vac, ficha?.saldos?.horasDia ?? 8)}</b> de vacaciones para solicitar. Coordínalo con RR.HH.
        </Link>
      ) : null}

      {estado ? <Ponche estado={estado} horasHoy={yo?.hoy.asistencia.horas ?? 0} /> : null}

      {!estado || estado.sinPerfil || u.maestro ? (
        <div className={`panel ${u.maestro ? "max-w-lg" : "max-w-sm"} p-6 text-center text-sm text-muted-foreground`}>
          {u.maestro || direccion ? (
            <>
              <b className="text-foreground">Tú estás en la dirección de Ritmo</b>: no tienes que marcar entrada ni salida.
              {estado?.sinPerfil ? <span className="mt-1 block text-xs">El ponche de arriba es opcional: si lo usas, queda solo para ti y no cuenta en ningún reporte.</span> : null}
              <span className="mt-4 grid grid-cols-2 gap-2 text-left sm:grid-cols-3">
                {[
                  { href: "/ritmo/equipo", t: "Equipo", d: "Asistencia y KPIs" },
                  { href: "/ritmo/personas", t: "Personas", d: "Fichas y nómina" },
                  ...(u.rol === "admin" || u.rol === "editor" ? [{ href: "/ritmo/agentes", t: "Agentes", d: "Equipo digital" }] : []),
                  { href: "/ritmo/carreras", t: "Carreras", d: "Vacantes y referidos" },
                  { href: "/ritmo/noticias", t: "Noticias", d: "Publicar al equipo" },
                  { href: "/ritmo/empresa", t: "Empresa", d: "Quiénes somos y recursos" },
                  { href: "/ritmo/solicitudes", t: "Solicitudes", d: "Aprobar y firmar" },
                  { href: "/ritmo/bienestar", t: "Bienestar", d: "Pausas y energía" },
                  ...(u.rol === "admin" ? [{ href: "/ritmo/viajes", t: "Viajes", d: "Solo tú, por ahora" }] : []),
                ].map((a) => (
                  <Link key={a.href} href={a.href} className="rounded-xl border border-border/70 bg-white/[0.02] px-3 py-2.5 transition hover:border-primary/40 hover:bg-primary/[0.04]">
                    <span className="block text-sm font-medium text-foreground">{a.t}</span>
                    <span className="block text-[11px] text-muted-foreground">{a.d}</span>
                  </Link>
                ))}
              </span>
            </>
          ) : (
            "Todavía no tienes perfil en Ritmo. Pídele a Carilin que te lo active (puesto, líder y horario)."
          )}
        </div>
      ) : null}

      {yo ? (
        <Link href={`/ritmo/equipo/${u.id}`} className="panel group flex w-full max-w-md items-center gap-4 p-4 transition hover:border-primary/40">
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

      <Link href="/ritmo/empresa" className="panel group flex w-full max-w-md items-center gap-3 p-4 transition hover:border-primary/40">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Conoce la empresa</p>
          <p className="text-xs text-muted-foreground">Quiénes somos, el equipo, políticas y respuestas rápidas</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
      </Link>

      <section className="panel flex w-full max-w-md flex-col gap-3 p-4">
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

      {u.maestro && u.rol === "admin" ? (
      <Link href="/ritmo/viajes" className="panel group flex w-full max-w-md items-center gap-3 p-4 transition">
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

      {noticias.length ? (
        <section className="flex w-full max-w-md flex-col gap-2">
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

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Ritmo solo guarda tu hora de entrada y salida y lo que tú reportes. Tus tareas y resultados salen de las herramientas del equipo. Sin capturas, sin GPS.
      </p>
    </div>
  );
}
