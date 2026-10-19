"use client";

import { Check, Circle, CircleCheck, CircleX, Loader2, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cancelarSolicitudAction, crearSolicitudAction, decidirSolicitudAction, revisarFechasAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { diasYHoras, duracionTexto } from "@/lib/desempeno/rrhh";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
const select = "h-11 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";
const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "short", day: "numeric", month: "short" });
const cuando = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" }) : "");

type Tipo = { id: string; nombre: string; conFechas: boolean };
// Duraciones de una cita médica, en días de 8 h (1 h = 0.125).
const HORAS_CITA = [
  { v: "0.125", t: "1 hora" },
  { v: "0.25", t: "2 horas" },
  { v: "0.375", t: "3 horas" },
  { v: "0.5", t: "4 horas (medio día)" },
  { v: "0.75", t: "6 horas" },
  { v: "1", t: "Día completo" },
];

// 17/oct (Elvin): las citas médicas se descuentan de los días de enfermedad (se ven aquí) y las vacaciones se piden con
// mínimo 60 días de anticipación (`minVacaciones` = primer día que se puede pedir hoy).
type Dias = { vacaciones: string; enfermedad: number; cupoEnfermedad: number; renueva: string };
const fechaLarga = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" });

export function NuevaSolicitud({ tipos, saldo, dias, minVacaciones }: { tipos: Tipo[]; saldo: string | null; dias?: Dias | null; minVacaciones: string }) {
  const [v, setV] = useState({ tipo: "", desde: "", hasta: "", dias: "1", detalle: "" });
  const [cargando, setCargando] = useState(false);
  const tipo = tipos.find((t) => t.id === v.tipo);
  // Choques de fechas en vivo (28/sep): p. ej. dos estrategas no pueden estar fuera a la vez.
  const [choque, setChoque] = useState<{ error: string | null; aviso: string | null }>({ error: null, aviso: null });
  const conCalendario = !!tipo && ["vacaciones", "dia_libre", "permiso"].includes(tipo.id);
  useEffect(() => {
    if (!conCalendario || !v.desde) return;
    let vivo = true;
    revisarFechasAction(v.desde, v.hasta).then((r) => vivo && setChoque(r.ok ? { error: r.error, aviso: r.aviso } : { error: null, aviso: null }));
    return () => {
      vivo = false;
    };
  }, [conCalendario, v.desde, v.hasta]);
  const visible0 = conCalendario && v.desde ? choque : { error: null, aviso: null };
  const tarde = tipo?.id === "vacaciones" && !!v.desde && v.desde < minVacaciones;
  const visible = tarde ? { error: `Las vacaciones se piden con mínimo 60 días de anticipación: lo más pronto es desde el ${fechaLarga(minVacaciones)}.`, aviso: null } : visible0;
  const pedidos = Number(v.dias) || 0;
  const enviar = async () => {
    setCargando(true);
    const r = await crearSolicitudAction(v);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Solicitud enviada", aviso);
    setV({ tipo: "", desde: "", hasta: "", dias: "1", detalle: "" });
  };
  return (
    <div className="panel flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-semibold">Pedir algo a Recursos Humanos</h2>
        <p className="text-sm text-muted-foreground">Tu supervisor lo aprueba y RR.HH. lo firma. Te avisamos en cada paso.</p>
      </div>
      {dias ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-border/70">
            <p className="text-[11px] text-muted-foreground">Vacaciones</p>
            <p className="font-semibold">{dias.vacaciones}</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-border/70">
            <p className="text-[11px] text-muted-foreground">Días de enfermedad</p>
            <p className="font-semibold">
              {diasYHoras(dias.enfermedad, 8)} <span className="text-xs font-normal text-muted-foreground">de {dias.cupoEnfermedad} · se renuevan el {fechaLarga(dias.renueva)}</span>
            </p>
          </div>
        </div>
      ) : null}
      <select className={select} value={v.tipo} onChange={(e) => { const t = e.target.value; setV((x) => ({ ...x, tipo: t, dias: t === "cita_medica" ? "0.25" : x.dias === "0.25" ? "1" : x.dias, hasta: t === "cita_medica" ? "" : x.hasta })); }}>
        <option value="">¿Qué necesitas?</option>
        {tipos.map((t) => (
          <option key={t.id} value={t.id}>{t.nombre}</option>
        ))}
      </select>
      {tipo?.id === "cita_medica" ? (
        // 19/oct: la cita médica va por horas (María pidió 2 h y le contó un día). "Más de un día" abre las fechas y los días.
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Día de la cita</span><Input type="date" className="h-11" value={v.desde} onChange={(e) => setV((x) => ({ ...x, desde: e.target.value }))} /></label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">¿Cuánto tiempo?</span>
            <select className={select} value={HORAS_CITA.some((h) => h.v === v.dias) ? v.dias : "varios"} onChange={(e) => setV((x) => ({ ...x, dias: e.target.value === "varios" ? "2" : e.target.value, hasta: e.target.value === "varios" ? x.hasta : "" }))}>
              {HORAS_CITA.map((h) => (
                <option key={h.v} value={h.v}>{h.t}</option>
              ))}
              <option value="varios">Más de un día</option>
            </select>
          </label>
          {!HORAS_CITA.some((h) => h.v === v.dias) ? (
            <>
              <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Hasta</span><Input type="date" className="h-11" value={v.hasta} onChange={(e) => setV((x) => ({ ...x, hasta: e.target.value }))} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Días laborables</span><Input type="number" step="0.5" min="1" className="h-11" value={v.dias} onChange={(e) => setV((x) => ({ ...x, dias: e.target.value }))} /></label>
            </>
          ) : null}
        </div>
      ) : tipo?.conFechas ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Desde</span><Input type="date" className="h-11" min={tipo.id === "vacaciones" ? minVacaciones : undefined} value={v.desde} onChange={(e) => setV((x) => ({ ...x, desde: e.target.value }))} /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Hasta</span><Input type="date" className="h-11" value={v.hasta} onChange={(e) => setV((x) => ({ ...x, hasta: e.target.value }))} /></label>
          <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"><span className="text-xs text-muted-foreground">Días laborables (0.5 = medio día)</span><Input type="number" step="0.5" min="0" className="h-11" value={v.dias} onChange={(e) => setV((x) => ({ ...x, dias: e.target.value }))} /></label>
        </div>
      ) : null}
      {tipo?.id === "vacaciones" ? (
        <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/70">
          🗓️ Las vacaciones se piden con <b className="text-foreground">mínimo 60 días de anticipación</b> (no se pueden pedir para el mismo mes). Hoy lo más pronto es desde el <b className="text-foreground">{fechaLarga(minVacaciones)}</b>.
        </p>
      ) : null}
      {tipo?.id === "cita_medica" ? (
        <p className={cn("rounded-xl px-3 py-2 text-xs ring-1", dias && pedidos > dias.enfermedad ? "bg-amber-500/10 text-amber-200 ring-amber-500/30" : "bg-white/[0.03] text-muted-foreground ring-border/70")}>
          🩺 Al aprobarse se descuenta de tus días de enfermedad
          {dias ? (
            <>
              : te quedan <b className="text-foreground">{diasYHoras(dias.enfermedad, 8)}</b>
              {pedidos > dias.enfermedad ? ". Lo que pase de ahí se cobra de tus vacaciones o va sin paga." : "."}
            </>
          ) : "."}{" "}
          Escoge cuánto tiempo vas a estar fuera (si son 2 horas, se descuentan 2 horas, no el día) y, en el detalle, la hora y el médico o la especialidad.
        </p>
      ) : null}
      {visible.error ? <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">⛔ {visible.error}</p> : null}
      {visible.aviso ? <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200 ring-1 ring-amber-500/30">⚠️ {visible.aviso}</p> : null}
      {conCalendario ? <a href="/ritmo/calendario" className="w-fit text-xs text-primary hover:underline">Ver el calendario del equipo →</a> : null}
      {tipo && ["vacaciones", "dia_libre"].includes(tipo.id) && saldo ? <p className="text-xs text-[color:var(--coral)]">{saldo}</p> : null}
      <Textarea rows={3} maxLength={2000} value={v.detalle} onChange={(e) => setV((x) => ({ ...x, detalle: e.target.value }))} placeholder={tipo?.id === "cita_medica" ? "Hora de la cita y médico o especialidad (ej.: 2:00 PM, dentista)" : "Explica brevemente (motivo, a quién va dirigida la carta, horario del permiso…)"} />
      <Button onClick={enviar} disabled={cargando || !v.tipo || !!visible.error} className="h-12 rounded-full text-base">
        {cargando ? <Loader2 className="animate-spin" /> : <Send />} Enviar solicitud
      </Button>
    </div>
  );
}

export interface SolicitudUI {
  id: string;
  nombre: string;
  tipo: string;
  desde: string | null;
  hasta: string | null;
  dias: number | null;
  detalle: string;
  estado: string;
  supervisorNombre: string | null;
  supervisorAt: string | null;
  supervisorNota: string | null;
  rrhhNombre: string | null;
  rrhhAt: string | null;
  rrhhNota: string | null;
  createdAt: string;
  mia: boolean;
  meToca: boolean;
  quienDecide: string; // "tu supervisor" | "RR.HH."
}

const ESTADO: Record<string, { txt: string; cls: string }> = {
  supervisor: { txt: "Esperando al supervisor", cls: "bg-amber-400/10 text-amber-300 ring-amber-400/30" },
  rrhh: { txt: "Esperando firma de RR.HH.", cls: "bg-sky-400/10 text-sky-300 ring-sky-400/30" },
  aprobada: { txt: "Aprobada y firmada", cls: "bg-primary/10 text-primary ring-primary/30" },
  rechazada: { txt: "No aprobada", cls: "bg-red-500/10 text-red-300 ring-red-500/30" },
  cancelada: { txt: "Cancelada", cls: "bg-white/5 text-muted-foreground ring-white/10" },
};

function Paso({ ok, no, texto }: { ok: boolean; no?: boolean; texto: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 text-xs", ok ? "text-foreground" : "text-muted-foreground")}>
      {no ? <CircleX className="size-3.5 text-red-400" /> : ok ? <CircleCheck className="size-3.5 text-primary" /> : <Circle className="size-3.5" />}
      {texto}
    </span>
  );
}

export function TarjetaSolicitud({ s, tipos }: { s: SolicitudUI; tipos: Tipo[] }) {
  const [nota, setNota] = useState("");
  const [cargando, setCargando] = useState<"si" | "no" | "x" | null>(null);
  const decidir = async (aprobar: boolean) => {
    setCargando(aprobar ? "si" : "no");
    const r = await decidirSolicitudAction({ id: s.id, aprobar, nota });
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(r.estado === "aprobada" ? "Firmada" : r.estado === "rrhh" ? "Aprobada: pasa a RR.HH." : "Rechazada", aviso);
  };
  const cancelar = async () => {
    setCargando("x");
    const r = await cancelarSolicitudAction(s.id);
    setCargando(null);
    if (!r.ok) toast.error(r.error, aviso);
  };
  const tipo = tipos.find((t) => t.id === s.tipo)?.nombre ?? s.tipo;
  const rechazoSup = s.estado === "rechazada" && !s.rrhhAt;
  return (
    <div className={cn("panel flex flex-col gap-3 p-4", s.meToca && "border-[color:var(--coral)]/50")}>
      <div className="flex flex-wrap items-center gap-2">
        {!s.mia ? <span className="font-medium">{s.nombre}</span> : null}
        <span className={cn(!s.mia && "text-muted-foreground")}>{tipo}</span>
        {s.desde ? (
          <span className="text-sm text-muted-foreground">
            · {fecha(s.desde)}
            {s.hasta && s.hasta !== s.desde ? ` → ${fecha(s.hasta)}` : ""}
            {s.dias ? ` · ${duracionTexto(s.dias)}` : ""}
          </span>
        ) : null}
        <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs ring-1", ESTADO[s.estado]?.cls)}>{ESTADO[s.estado]?.txt ?? s.estado}</span>
      </div>
      <p className="text-sm whitespace-pre-line text-foreground/90">{s.detalle}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Paso ok texto={`Pedida ${cuando(s.createdAt)}`} />
        <Paso ok={!!s.supervisorAt && !rechazoSup} no={rechazoSup} texto={s.supervisorAt ? `Supervisor: ${s.supervisorNombre} ${cuando(s.supervisorAt)}` : s.supervisorNombre ? `Supervisor: ${s.supervisorNombre}` : "Sin supervisor (directo a RR.HH.)"} />
        <Paso ok={s.estado === "aprobada"} no={s.estado === "rechazada" && !!s.rrhhAt} texto={s.rrhhAt ? `Firmó RR.HH.: ${s.rrhhNombre} ${cuando(s.rrhhAt)}` : "Firma de RR.HH."} />
      </div>
      {s.supervisorNota || s.rrhhNota ? <p className="text-xs text-muted-foreground">{[s.supervisorNota && `Supervisor: “${s.supervisorNota}”`, s.rrhhNota && `RR.HH.: “${s.rrhhNota}”`].filter(Boolean).join(" · ")}</p> : null}
      {s.meToca ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
          <Input className="h-10 flex-1" placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => decidir(false)} disabled={!!cargando} className="rounded-full">
              {cargando === "no" ? <Loader2 className="animate-spin" /> : <X />} Rechazar
            </Button>
            <Button onClick={() => decidir(true)} disabled={!!cargando} className="rounded-full">
              {cargando === "si" ? <Loader2 className="animate-spin" /> : <Check />} {s.estado === "rrhh" ? "Firmar" : "Aprobar"}
            </Button>
          </div>
        </div>
      ) : s.mia && ["supervisor", "rrhh"].includes(s.estado) ? (
        <button type="button" onClick={cancelar} disabled={!!cargando} className="self-start text-xs text-muted-foreground hover:text-foreground">
          Cancelar solicitud
        </button>
      ) : null}
    </div>
  );
}
