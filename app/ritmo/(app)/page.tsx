import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { EstadoChip, fmtHoras, MiniDias, ScoreBadge } from "@/components/ritmo/piezas";
import { Ponche } from "@/components/ritmo/ponche";
import { armarPanel, estadoPonche, modoScore } from "@/lib/desempeno/datos";
import { fichaCompleta } from "@/lib/desempeno/fichas";
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
  const estado = await estadoPonche(u.id);
  const panel = estado ? await armarPanel(u, sumarDias(hoy, -6), hoy).catch(() => null) : null;
  const yo = panel?.filas.find((f) => f.perfil.userId === u.id);
  const oculto = modoScore(u.rol) === "oculto";
  const ficha = await fichaCompleta(u.id).catch(() => null);
  const vac = ficha?.saldos?.puedeSolicitar && ficha.saldos.vacaciones.disponibles >= 1 ? ficha.saldos.vacaciones.disponibles : null;
  const fecha = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col items-center gap-10 pt-4">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{fecha}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {saludo()}, <span className="texto-ritmo">{u.nombre.split(" ")[0]}</span>
        </h1>
      </div>

      {vac ? (
        <Link href={`/ritmo/personas/${u.id}`} className="w-full max-w-md rounded-2xl border border-[color:var(--coral)]/40 bg-[color:var(--coral)]/10 px-4 py-3 text-center text-sm">
          🌴 <b>Ya cumpliste 12 meses.</b> Tienes <b>{vac} días</b> de vacaciones para solicitar. Coordínalo con RR.HH.
        </Link>
      ) : null}

      {estado ? (
        <Ponche estado={estado} horasHoy={yo?.hoy.asistencia.horas ?? 0} />
      ) : (
        <div className="panel max-w-sm p-6 text-center text-sm text-muted-foreground">
          {u.maestro ? (
            <>
              <b className="text-foreground">Tú estás en la dirección de Ritmo:</b> ves al equipo desde <Link href="/ritmo/equipo" className="text-primary">Equipo</Link> y <Link href="/ritmo/personas" className="text-primary">Personas</Link>, y no necesitas marcar entrada ni salida.
              <span className="mt-2 block text-xs">
                Si también quieres marcar tu día, entra en{" "}
                <Link href={`/ritmo/ajustes?q=${encodeURIComponent(u.nombre)}`} className="text-primary">Ajustes → tu nombre → Agregar</Link> y guarda tu puesto y horario.
              </span>
            </>
          ) : (
            "Todavía no tienes perfil en Ritmo. Pídele a Carilin que te lo active (puesto, líder y horario)."
          )}
        </div>
      )}

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

      <p className="max-w-sm text-center text-xs text-muted-foreground">
        Ritmo solo guarda tu hora de entrada y salida y lo que tú reportes. Tus tareas y resultados salen de las herramientas del equipo. Sin capturas, sin GPS.
      </p>
    </div>
  );
}
