"use client";

import { Check, Loader2, Plane, Plus, Send, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { borrarPlanViajeAction, crearPlanViajeAction, elegirGanadorViajeAction, guardarViajeAnualAction, pedirVacacionesPlanAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { diasHasta, TIPOS_VIAJE, tipoViaje, VIAJE_MIN_DIAS, VIAJE_MIN_INDICE, VIAJE_MIN_MESES, type Elegibilidad } from "@/lib/desempeno/viajes-reglas";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
const fecha = (f: string | null) => (f ? new Date(`${f}T12:00:00Z`).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

export type PlanUI = { id: string; tipo: string; destino: string; desde: string | null; hasta: string | null; presupuestoUsd: number | null; notas: string | null; pedida: boolean };

export function NuevoPlan() {
  const vacio = { tipo: "local", destino: "", desde: "", hasta: "", presupuesto: "", notas: "" };
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const guardar = async () => {
    setGuardando(true);
    const r = await crearPlanViajeAction(f);
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("¡Viaje en tu lista! ✈️", aviso);
    setF(vacio);
    setAbierto(false);
  };
  if (!abierto)
    return (
      <Button className="h-11 w-fit rounded-full" onClick={() => setAbierto(true)}>
        <Plus className="size-4" /> Planificar un viaje
      </Button>
    );
  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div className="grid grid-cols-3 gap-2">
        {TIPOS_VIAJE.map((t) => (
          <button key={t.id} type="button" onClick={() => setF((x) => ({ ...x, tipo: t.id }))} className={cn("flex flex-col items-center gap-0.5 rounded-xl p-3 text-center ring-1 transition", f.tipo === t.id ? "bg-primary/10 ring-primary/40" : "ring-border hover:bg-white/[0.03]")}>
            <span className="text-2xl" aria-hidden>{t.emoji}</span>
            <span className="text-sm font-medium">{t.nombre}</span>
            <span className="text-[11px] text-muted-foreground">{t.detalle}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">¿A dónde?</Label>
          <Input className="h-10" value={f.destino} onChange={set("destino")} placeholder="Ej.: Santa Marta, Colombia" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Salida (opcional)</Label>
          <Input className="h-10" type="date" value={f.desde} onChange={set("desde")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Regreso (opcional)</Label>
          <Input className="h-10" type="date" value={f.hasta} onChange={set("hasta")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Presupuesto US$ (opcional)</Label>
          <Input className="h-10" inputMode="numeric" value={f.presupuesto} onChange={(e) => setF((x) => ({ ...x, presupuesto: e.target.value.replace(/[^\d]/g, "") }))} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
          <Textarea rows={2} value={f.notas} onChange={set("notas")} placeholder="Con quién vas, qué quieres hacer, pendientes…" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="h-10 rounded-full" onClick={guardar} disabled={guardando}>
          {guardando ? <Loader2 className="animate-spin" /> : <Plane className="size-4" />} Guardar viaje
        </Button>
        <Button variant="ghost" className="h-10 rounded-full" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function TarjetaPlan({ p, hoy, puedePedir }: { p: PlanUI; hoy: string; puedePedir: boolean }) {
  const [cargando, setCargando] = useState(false);
  const t = tipoViaje(p.tipo);
  const faltan = p.desde ? diasHasta(p.desde, hoy) : null;
  const pedir = async () => {
    setCargando(true);
    const r = await pedirVacacionesPlanAction(p.id);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(`Solicitud enviada (${r.dias} días laborables). Tu supervisor la aprueba y RR.HH. la firma.`, aviso);
  };
  const borrar = async () => {
    if (!confirm("¿Borrar este viaje de tu lista?")) return;
    const r = await borrarPlanViajeAction(p.id);
    if (!r.ok) toast.error(r.error, aviso);
  };
  return (
    <article className="panel fila flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-2xl ring-1 ring-border" aria-hidden>{t.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-tight">{p.destino}</p>
          <p className="text-xs text-muted-foreground">
            {t.nombre}
            {p.desde ? ` · ${fecha(p.desde)}${p.hasta && p.hasta !== p.desde ? ` → ${fecha(p.hasta)}` : ""}` : " · sin fecha todavía"}
            {p.presupuestoUsd ? ` · US$${p.presupuestoUsd.toLocaleString("en-US")}` : ""}
          </p>
        </div>
        {faltan !== null && faltan >= 0 ? (
          <span className="text-right">
            <span className="num block text-2xl leading-none font-semibold">{faltan}</span>
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{faltan === 1 ? "día" : "días"}</span>
          </span>
        ) : null}
      </div>
      {p.notas ? <p className="text-sm whitespace-pre-line text-foreground/80">{p.notas}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {p.pedida ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary ring-1 ring-primary/30">
            <Check className="size-3.5" /> Vacaciones pedidas
          </span>
        ) : p.desde && p.hasta ? (
          <Button size="sm" className="rounded-full" onClick={pedir} disabled={cargando || !puedePedir} title={puedePedir ? "" : "Las vacaciones se piden a partir de los 12 meses"}>
            {cargando ? <Loader2 className="animate-spin" /> : <Send className="size-3.5" />} Pedir estas vacaciones
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Ponle fechas cuando lo tengas claro para pedirlas.</span>
        )}
        <button type="button" onClick={borrar} className="ml-auto rounded-full p-1.5 text-muted-foreground hover:text-red-300" title="Borrar">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

/** Lo que ve cada empleado del viaje del año: el premio, cómo se gana y SU avance (nunca el de otros). */
export function MiViajeDelAnio({ anio, premio, anuncio, ganador, e }: { anio: number; premio: string; anuncio: string; ganador: string | null; e: Elegibilidad | null }) {
  return (
    <section className="panel hud-esquinas relative flex flex-col gap-4 overflow-hidden p-5">
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[color:var(--coral)]/15 blur-3xl" aria-hidden />
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[color:var(--coral)]/12 text-[color:var(--coral)] ring-1 ring-[color:var(--coral)]/30">
          <Trophy className="size-6" />
        </div>
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Viaje del año {anio}</p>
          <p className="mt-0.5 text-lg font-semibold tracking-tight">{premio}</p>
          <p className="text-sm text-muted-foreground">No es un sorteo: se lo gana quien se destaca todo el año. Lo anunciamos el {fecha(anuncio)}.</p>
        </div>
      </div>
      {ganador ? (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm ring-1 ring-primary/30">
          🏆 Este año se lo ganó <b>{ganador}</b>. ¡El próximo puede ser tuyo!
        </p>
      ) : e ? (
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Tu índice (asistencia + desempeño)</span>
              <span className="num font-mono">
                {e.indice ?? "—"} <span className="text-muted-foreground">/ {VIAJE_MIN_INDICE}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)]" style={{ width: `${Math.min(100, ((e.indice ?? 0) / VIAJE_MIN_INDICE) * 100)}%` }} />
            </div>
          </div>
          {e.enCarrera ? (
            <p className="text-sm text-primary">🟢 Estás en carrera. Sigue así hasta el anuncio.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {e.falta.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Cuando tengas tu perfil en Ritmo verás aquí tu avance.</p>
      )}
      <p className="font-mono text-[10.5px] tracking-wider text-muted-foreground uppercase">
        Requisitos: {VIAJE_MIN_MESES}+ meses · {VIAJE_MIN_DIAS}+ días marcados · índice {VIAJE_MIN_INDICE}+ · la dirección escoge
      </p>
    </section>
  );
}

type Candidato = { userId: string; nombre: string; puesto: string; e: Elegibilidad };

/** Dirección: configurar el premio y escoger al ganador entre los que califican. */
export function ViajeDireccion({ anio, programa, candidatos, ganadorId }: { anio: number; programa: { premio: string; topeUsd: number | null; anuncio: string; nota: string | null } | null; candidatos: Candidato[]; ganadorId: string | null }) {
  const [f, setF] = useState({ premio: programa?.premio ?? "Pasajes ida y vuelta + hospedaje para 2 personas", topeUsd: programa?.topeUsd ? String(programa.topeUsd) : "", anuncio: programa?.anuncio ?? `${anio}-12-15`, nota: programa?.nota ?? "" });
  const [cargando, setCargando] = useState<string | null>(null);
  const guardar = async () => {
    setCargando("guardar");
    const r = await guardarViajeAnualAction({ anio, ...f });
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Viaje del año guardado", aviso);
  };
  const elegir = async (c: Candidato) => {
    if (!confirm(`¿Anunciar a ${c.nombre} como ganador del viaje del año ${anio}? Sale en Noticias y se le avisa.`)) return;
    setCargando(c.userId);
    const r = await elegirGanadorViajeAction({ anio, userId: c.userId, nombre: c.nombre });
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(`🏆 ${c.nombre} ganó el viaje del año`, aviso);
  };
  const enCarrera = candidatos.filter((c) => c.e.enCarrera).sort((a, b) => (b.e.indice ?? 0) - (a.e.indice ?? 0));
  const cerca = candidatos.filter((c) => !c.e.enCarrera && (c.e.indice ?? 0) >= VIAJE_MIN_INDICE - 10).sort((a, b) => (b.e.indice ?? 0) - (a.e.indice ?? 0)).slice(0, 5);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-[color:var(--coral)]">Dirección · viaje del año {anio}</h2>
      <div className="panel grid gap-3 p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Premio (lo ve el equipo)</Label>
          <Input className="h-10" value={f.premio} onChange={(e) => setF((x) => ({ ...x, premio: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Tope de hospedaje US$ (solo dirección)</Label>
          <Input className="h-10" inputMode="numeric" value={f.topeUsd} onChange={(e) => setF((x) => ({ ...x, topeUsd: e.target.value.replace(/[^\d]/g, "") }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Fecha del anuncio</Label>
          <Input className="h-10" type="date" value={f.anuncio} onChange={(e) => setF((x) => ({ ...x, anuncio: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Nota interna (opcional)</Label>
          <Input className="h-10" value={f.nota} onChange={(e) => setF((x) => ({ ...x, nota: e.target.value }))} />
        </div>
        <Button className="h-10 w-fit rounded-full" onClick={guardar} disabled={cargando === "guardar"}>
          {cargando === "guardar" ? <Loader2 className="animate-spin" /> : null} {programa ? "Guardar cambios" : "Activar el viaje del año"}
        </Button>
      </div>
      {programa ? (
        <div className="panel divide-y divide-border/60 overflow-hidden">
          <p className="px-4 py-2.5 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Califican ({enCarrera.length}) · ordenados por índice</p>
          {enCarrera.length ? (
            enCarrera.map((c, i) => (
              <div key={c.userId} className="fila flex items-center gap-3 px-4 py-3">
                <span className="w-5 text-center text-sm">{["🥇", "🥈", "🥉"][i] ?? <span className="num font-mono text-xs text-muted-foreground">{i + 1}</span>}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.puesto} · {c.e.meses} meses · asistencia {c.e.asistencia ?? "—"}
                    {c.e.desempeno !== null ? ` · desempeño ${c.e.desempeno}` : ""}
                  </p>
                </div>
                <span className="num font-mono text-sm">{c.e.indice}</span>
                {ganadorId === c.userId ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">🏆 Ganador</span>
                ) : !ganadorId ? (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => elegir(c)} disabled={cargando === c.userId}>
                    {cargando === c.userId ? <Loader2 className="animate-spin" /> : <Trophy className="size-3.5" />} Escoger
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Todavía nadie cumple los requisitos. Ritmo empezó a medir en septiembre: el índice se llena con los meses.</p>
          )}
          {cerca.length ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              Cerca de calificar: {cerca.map((c) => `${c.nombre} (${c.e.indice})`).join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
