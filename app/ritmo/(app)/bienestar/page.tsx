import { Flame, HeartPulse, Users } from "lucide-react";

import { Animo, BarrasSemana, NuevaActividad, PausaActiva } from "@/components/ritmo/bienestar";
import { MuroComunidad, TableroComunidad, UnirseComunidad } from "@/components/ritmo/comunidad";
import { Tarjeta } from "@/components/ritmo/piezas";
import { esVisible, feedComunidad, hoyPR, miembrosComunidad, personasActivas, registrosDe, registrosEquipo } from "@/lib/desempeno/bienestar";
import { ANIMOS, equipoSemana, META_SEMANAL_MIN, MIN_RESPUESTAS_ANIMO, miSemana, rutinaDelDia, semanaDe, tableroComunidad } from "@/lib/desempeno/bienestar-reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bienestar" };

// La parte wellness de Ritmo: pausa activa, ejercicio y energía. Voluntario, privado y fuera del score.
export default async function BienestarPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const hoy = hoyPR();
  const dias = semanaDe(hoy);
  const [mios, equipo, personas, visible, miembros] = await Promise.all([registrosDe(u.id, dias), registrosEquipo(dias), personasActivas(), esVisible(u.id), miembrosComunidad()]);
  // Comunidad: solo quien se unió la ve (reciprocidad: nadie mira sin aparecer). La dirección puede moderar.
  const veComunidad = visible || u.maestro;
  const tablero = veComunidad ? tableroComunidad(equipo, miembros, hoy) : [];
  const feed = veComunidad ? await feedComunidad(u.id, miembros) : [];
  const yo = miSemana(mios, dias, hoy);
  const eq = equipoSemana(equipo, personas);
  const rutina = rutinaDelDia(hoy);
  const animoHoy = mios.find((r) => r.fecha === hoy && r.tipo === "animo")?.valor ?? null;
  const animoEquipo = eq.animo !== null ? ANIMOS[Math.round(eq.animo) - 1] : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="ceja">Bienestar</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Muévete</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">5 minutos al día hacen diferencia cuando trabajas frente a una pantalla. Todo aquí es voluntario, es tuyo y no cuenta para tu desempeño.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PausaActiva rutina={rutina} hecha={mios.some((r) => r.fecha === hoy && r.tipo === "pausa")} />
        <div className="flex flex-col gap-4">
          <section className="panel hud-esquinas flex flex-col gap-3 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Mi semana</p>
                <p className="num mt-1 text-3xl font-semibold tracking-tight">
                  {yo.minutos}
                  <span className="text-base text-muted-foreground"> / {META_SEMANAL_MIN} min</span>
                </p>
              </div>
              {yo.racha > 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--coral)]/12 px-2.5 py-1 text-xs text-[color:var(--coral)] ring-1 ring-[color:var(--coral)]/30">
                  <Flame className="size-3.5" /> {yo.racha} días seguidos
                </span>
              ) : null}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)] transition-all" style={{ width: `${yo.pct}%` }} />
            </div>
            <BarrasSemana dias={yo.porDia} hoy={hoy} />
            <p className="text-[11px] text-muted-foreground">Cuentan tus pausas activas y el ejercicio que anotes. Meta de la OMS: {META_SEMANAL_MIN} min por semana.</p>
          </section>
          <Animo valor={animoHoy} />
        </div>
      </div>

      <NuevaActividad />

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-[color:var(--coral)]" /> Comunidad
        </h2>
        <UnirseComunidad visible={visible} miembros={miembros.length} />
        {veComunidad ? (
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Tablero de la semana</p>
              {tablero.length ? <TableroComunidad filas={tablero} yo={u.id} /> : <div className="panel p-6 text-center text-sm text-muted-foreground">Nadie se ha unido todavía.</div>}
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Lo que pasa en el grupo</p>
              <MuroComunidad items={feed} yo={u.id} maestro={u.maestro} puedeEscribir={visible} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-primary" /> El equipo esta semana
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tarjeta titulo="Participando" valor={`${eq.participantes}/${eq.personas || "—"}`} detalle="Personas que se movieron" />
          <Tarjeta titulo="Minutos juntos" valor={eq.minutos.toLocaleString("es-PR")} detalle="Todo el equipo" />
          <Tarjeta titulo="Llegaron a la meta" valor={eq.cumplieron} detalle={`${META_SEMANAL_MIN}+ min esta semana`} />
          <Tarjeta titulo="Pausas activas" valor={eq.pausas} detalle="Hechas esta semana" />
        </div>
        {u.maestro ? (
          <div className="panel flex items-center gap-3 p-4 text-sm">
            <HeartPulse className="size-5 text-[color:var(--coral)]" />
            {animoEquipo ? (
              <span>
                Energía del equipo esta semana: <b>{animoEquipo.emoji} {eq.animo}</b> de 5 ({eq.respuestasAnimo} respuestas). Solo la vista maestra ve este promedio, nunca respuestas individuales.
              </span>
            ) : (
              <span className="text-muted-foreground">La energía del equipo se muestra cuando haya al menos {MIN_RESPUESTAS_ANIMO} respuestas en la semana ({eq.respuestasAnimo} hasta ahora), para que nadie se pueda identificar.</span>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
