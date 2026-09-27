"use client";

import { Check, Loader2, Pause, Play, SkipForward, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { actividadAction, animoAction, pausaHechaAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVIDADES, ANIMOS, type Rutina } from "@/lib/desempeno/bienestar-reglas";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };

/** Pausa activa guiada: un ejercicio a la vez con su cuenta regresiva; al terminar se marca sola. */
export function PausaActiva({ rutina, hecha }: { rutina: Rutina; hecha: boolean }) {
  const [paso, setPaso] = useState<number | null>(null);
  const [resta, setResta] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const total = rutina.ejercicios.reduce((n, e) => n + e.segundos, 0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const terminar = async () => {
    setPaso(null);
    setGuardando(true);
    const r = await pausaHechaAction();
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    navigator.vibrate?.([20, 60, 20]);
    toast.success("¡Pausa activa hecha! 💪", aviso);
  };

  useEffect(() => {
    if (paso === null || pausado) return;
    ref.current = setInterval(() => setResta((s) => s - 1), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [paso, pausado]);

  useEffect(() => {
    if (paso === null || resta > 0) return;
    if (paso + 1 < rutina.ejercicios.length) {
      navigator.vibrate?.(15);
      setPaso(paso + 1);
      setResta(rutina.ejercicios[paso + 1].segundos);
    } else void terminar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resta, paso]);

  const empezar = () => { setPaso(0); setResta(rutina.ejercicios[0].segundos); setPausado(false); };
  const saltar = () => setResta(0);

  if (paso !== null) {
    const e = rutina.ejercicios[paso];
    const pct = 1 - resta / e.segundos;
    return (
      <div className="panel hud-esquinas flex flex-col items-center gap-4 p-6 text-center">
        <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {paso + 1} de {rutina.ejercicios.length} · {rutina.titulo}
        </p>
        <div className="relative grid size-40 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/[0.07]" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--neon)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct * 282.7).toFixed(1)} 282.7`} className="drop-shadow-[0_0_4px_var(--neon)] transition-[stroke-dasharray] duration-1000 ease-linear" />
          </svg>
          <span className="num text-5xl font-semibold">{resta}</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{e.nombre}</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{e.como}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 rounded-full" onClick={() => setPausado((x) => !x)}>
            {pausado ? <Play className="size-4" /> : <Pause className="size-4" />} {pausado ? "Seguir" : "Pausar"}
          </Button>
          <Button variant="outline" className="h-10 rounded-full" onClick={saltar}>
            <SkipForward className="size-4" /> Siguiente
          </Button>
          <Button variant="ghost" className="h-10 rounded-full text-muted-foreground" onClick={() => setPaso(null)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Pausa activa de hoy · {Math.ceil(total / 60)} min</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">{rutina.titulo}</h3>
          <p className="text-sm text-muted-foreground">{rutina.foco}</p>
        </div>
        {hecha ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary ring-1 ring-primary/30">
            <Check className="size-3.5" /> Hecha
          </span>
        ) : null}
      </div>
      <ol className="flex flex-col gap-1.5 text-sm">
        {rutina.ejercicios.map((e, i) => (
          <li key={e.nombre} className="flex items-baseline gap-3">
            <span className="num w-4 font-mono text-xs text-muted-foreground">{i + 1}</span>
            <span className="flex-1">{e.nombre}</span>
            <span className="num font-mono text-xs text-muted-foreground">{e.segundos}s</span>
          </li>
        ))}
      </ol>
      <Button className="h-11 rounded-full" onClick={empezar} disabled={guardando}>
        {guardando ? <Loader2 className="animate-spin" /> : <Play className="size-4" />} {hecha ? "Hacerla otra vez" : "Empezar"}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">Muévete a tu ritmo. Si algo duele, para.</p>
    </div>
  );
}

/** ¿Cómo está tu energía hoy? (opcional; el equipo solo ve el promedio). */
export function Animo({ valor, compacto }: { valor: number | null; compacto?: boolean }) {
  const [actual, setActual] = useState(valor);
  const elegir = async (v: number) => {
    setActual(v);
    const r = await animoAction(v);
    if (!r.ok) { setActual(valor); toast.error(r.error, aviso); }
  };
  return (
    <div className={cn("flex flex-col gap-2", !compacto && "panel p-5")}>
      {!compacto ? (
        <div>
          <h3 className="font-semibold">¿Cómo está tu energía hoy?</h3>
          <p className="text-xs text-muted-foreground">Opcional. Nadie ve tu respuesta: solo el promedio del equipo.</p>
        </div>
      ) : null}
      <div className="flex justify-between gap-1">
        {ANIMOS.map((a) => (
          <button key={a.valor} type="button" onClick={() => elegir(a.valor)} title={a.nombre} className={cn("flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-2xl ring-1 transition", actual === a.valor ? "bg-primary/10 ring-primary/40" : "ring-transparent hover:bg-white/[0.04]")}>
            <span aria-hidden>{a.emoji}</span>
            {!compacto ? <span className="text-[10px] text-muted-foreground">{a.nombre}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Anotar ejercicio de hoy. */
export function NuevaActividad() {
  const [actividad, setActividad] = useState("caminar");
  const [minutos, setMinutos] = useState("30");
  const [guardando, setGuardando] = useState(false);
  const guardar = async () => {
    setGuardando(true);
    const r = await actividadAction({ actividad, minutos: Number(minutos) });
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(`+${minutos} min anotados`, aviso);
  };
  return (
    <div className="panel flex flex-col gap-3 p-5">
      <h3 className="font-semibold">Anota tu ejercicio de hoy</h3>
      <div className="flex flex-wrap gap-1.5">
        {ACTIVIDADES.map((a) => (
          <button key={a.id} type="button" onClick={() => setActividad(a.id)} className={cn("rounded-full px-3 py-1.5 text-sm ring-1 transition", actividad === a.id ? "bg-primary/10 text-primary ring-primary/40" : "text-muted-foreground ring-border hover:text-foreground")}>
            {a.emoji} {a.nombre}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {["15", "30", "45", "60"].map((m) => (
          <button key={m} type="button" onClick={() => setMinutos(m)} className={cn("num h-10 w-12 rounded-lg font-mono text-sm ring-1 transition", minutos === m ? "bg-primary/10 text-primary ring-primary/40" : "text-muted-foreground ring-border")}>
            {m}
          </button>
        ))}
        <Input className="h-10 w-20" inputMode="numeric" value={minutos} onChange={(e) => setMinutos(e.target.value.replace(/\D/g, ""))} aria-label="Minutos" />
        <span className="text-sm text-muted-foreground">min</span>
        <Button className="ml-auto h-10 rounded-full" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" /> : null} Anotar
        </Button>
      </div>
    </div>
  );
}

/** Barras lun-dom de minutos. */
export function BarrasSemana({ dias, hoy }: { dias: { fecha: string; minutos: number; pausa: boolean }[]; hoy: string }) {
  const max = Math.max(30, ...dias.map((d) => d.minutos));
  return (
    <div className="flex items-end gap-2">
      {dias.map((d) => (
        <div key={d.fecha} className="flex flex-1 flex-col items-center gap-1">
          <span className="num font-mono text-[10px] text-muted-foreground">{d.minutos || ""}</span>
          <div className="relative h-14 w-full">
            <div className={cn("absolute inset-x-0 bottom-0 rounded-t-md transition-all", d.minutos ? "bg-gradient-to-t from-[color:var(--neon)]/40 to-[color:var(--neon)]" : "bg-white/[0.06]")} style={{ height: `${Math.max(6, (d.minutos / max) * 100)}%` }} />
          </div>
          <span className={cn("font-mono text-[10px] uppercase", d.fecha === hoy ? "text-primary" : "text-muted-foreground")}>
            {new Date(`${d.fecha}T12:00:00Z`).toLocaleDateString("es-PR", { weekday: "narrow", timeZone: "UTC" })}
            {d.pausa ? "•" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
