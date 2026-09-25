"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { corregirSalidaAction, entrarAction, salirAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface EstadoPonche {
  hoy: string;
  abiertoHoy: string | null; // ISO de la entrada abierta
  pendiente: { id: string; fecha: string; entradaAt: string } | null; // salida olvidada de otro día
  manual: { id: string; nombre: string }[];
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-PR", { timeZone: "America/Puerto_Rico", hour: "numeric", minute: "2-digit" });
const dia = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "short" });

function reloj(desde: string, ahora: number) {
  const s = Math.max(0, Math.floor((ahora - Date.parse(desde)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

const aviso = { className: "ritmo" };

// El ponche: un círculo grande. Un toque para entrar; otro para salir (con bloqueos opcionales).
export function Ponche({ estado, horasHoy }: { estado: EstadoPonche; horasHoy: number }) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [abrir, setAbrir] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [bloqueos, setBloqueos] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [horaSalida, setHoraSalida] = useState("18:00");
  const [nota, setNota] = useState("");
  const abierto = estado.abiertoHoy;

  useEffect(() => {
    if (!abierto) return;
    const t = setInterval(() => setAhora(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [abierto]);

  const entrar = async () => {
    setCargando(true);
    const r = await entrarAction();
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    navigator.vibrate?.(15);
    toast.success(`Entrada a las ${hora(r.entradaAt)}`, aviso);
  };

  const salir = async () => {
    setCargando(true);
    const datos: Record<string, number> = {};
    for (const m of estado.manual) if (valores[m.id]) datos[m.id] = Number(valores[m.id]);
    const r = await salirAction({ bloqueos, datos });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    navigator.vibrate?.(15);
    setAbrir(false);
    setBloqueos("");
    setValores({});
    toast.success("Salida marcada. ¡Buen trabajo hoy!", aviso);
  };

  const corregir = async () => {
    if (!estado.pendiente) return;
    setCargando(true);
    const r = await corregirSalidaAction({ poncheId: estado.pendiente.id, hora: horaSalida, nota });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Listo: tu líder la confirma", aviso);
  };

  if (estado.pendiente)
    return (
      <div className="panel mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="size-5" />
          <h2 className="font-semibold">Te faltó marcar la salida</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          El {dia(estado.pendiente.fecha)} entraste a las {hora(estado.pendiente.entradaAt)}. ¿A qué hora terminaste? Tu líder lo confirma.
        </p>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="hora">Hora de salida (PR)</Label>
          <Input id="hora" type="time" className="h-11 w-32" value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)} />
        </div>
        <Textarea rows={2} maxLength={300} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" />
        <Button onClick={corregir} disabled={cargando} className="h-12 rounded-full">
          {cargando ? <Loader2 className="animate-spin" /> : null} Enviar
        </Button>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        disabled={cargando}
        onClick={abierto ? () => setAbrir(true) : entrar}
        aria-label={abierto ? "Marcar salida" : "Marcar entrada"}
        className={cn(
          "relative flex size-60 flex-col items-center justify-center rounded-full border transition duration-300 select-none active:scale-[0.97] disabled:opacity-80 sm:size-64",
          abierto ? "brillo border-primary/60 bg-primary/[0.06]" : "border-border bg-card hover:border-[color:var(--coral)]/50",
        )}
      >
        {abierto ? (
          <>
            <span className="absolute inset-3 animate-[spin_14s_linear_infinite] rounded-full border border-dashed border-[color:var(--coral)]/50 motion-reduce:animate-none" />
            {/* El pulso del logo late mientras la persona trabaja */}
            <svg viewBox="0 0 200 40" className="pointer-events-none absolute bottom-10 left-1/2 w-40 -translate-x-1/2 opacity-80" fill="none" aria-hidden>
              <defs>
                <linearGradient id="latido-g" x1="0" x2="200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--neon)" />
                  <stop offset="1" stopColor="var(--coral)" />
                </linearGradient>
              </defs>
              <path d="M0 22h55l8-14 12 28 10-22 6 8h109" stroke="url(#latido-g)" strokeOpacity="0.18" strokeWidth="2" />
              <path className="latido" d="M0 22h55l8-14 12 28 10-22 6 8h109" stroke="url(#latido-g)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        ) : null}
        {cargando ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : abierto ? (
          <>
            <span className="text-xs font-medium tracking-[0.2em] text-primary uppercase">Trabajando</span>
            <span className="num mt-1 text-6xl font-semibold tracking-tight">{reloj(abierto, ahora)}</span>
            <span className="mt-1 mb-6 text-sm text-muted-foreground">desde las {hora(abierto)}</span>
          </>
        ) : (
          <>
            <span className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{horasHoy ? "Volver a" : "Toca para"}</span>
            <span className="texto-ritmo mt-1 text-4xl font-semibold tracking-tight">Entrar</span>
            {horasHoy ? <span className="num mt-2 text-sm text-muted-foreground">hoy llevas {Math.floor(horasHoy)}h {String(Math.round((horasHoy % 1) * 60)).padStart(2, "0")}m</span> : null}
          </>
        )}
      </button>
      {abierto ? (
        <Button variant="outline" onClick={() => setAbrir(true)} className="h-12 rounded-full px-8">
          Marcar salida
        </Button>
      ) : null}

      <Dialog open={abrir} onOpenChange={setAbrir}>
        <DialogContent className="ritmo sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar salida</DialogTitle>
            <DialogDescription>
              {abierto ? `Entraste a las ${hora(abierto)} · ${reloj(abierto, ahora)} h.` : ""} Lo demás lo mide el sistema solo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {estado.manual.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3">
                <Label htmlFor={m.id}>{m.nombre}</Label>
                <Input id={m.id} type="number" inputMode="numeric" min={0} max={50} className="h-11 w-24 text-right" value={valores[m.id] ?? ""} onChange={(e) => setValores((v) => ({ ...v, [m.id]: e.target.value }))} placeholder="0" />
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <Label htmlFor="bloqueos">¿Algún bloqueo? (opcional)</Label>
              <Textarea id="bloqueos" rows={3} maxLength={1000} value={bloqueos} onChange={(e) => setBloqueos(e.target.value)} placeholder="Ej.: espero acceso a la cuenta de Meta de un cliente" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={salir} disabled={cargando} className="h-12 w-full rounded-full sm:w-auto sm:px-8">
              {cargando ? <Loader2 className="animate-spin" /> : null} Marcar salida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
