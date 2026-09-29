"use client";

import { CalendarDays, Check, Loader2, Plus, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { anotarCalendarioAction, desconectarGoogleAction } from "@/app/ritmo/google-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
type Evento = { id: string; titulo: string; todoElDia: boolean; inicio: string | null; fin: string | null; link: string | null; lugar: string | null };

// Mi día (Google Calendar del correo corporativo): lo que la persona tiene hoy y un campo para anotar sin salir de Ritmo.
export function MiDiaGoogle({ conectado, email, eventos, error, hoy }: { conectado: boolean; email: string | null; eventos: Evento[]; error: string | null; hoy: string }) {
  const [abierto, setAbierto] = useState(false);
  const vacio = { titulo: "", fecha: hoy, hora: "", minutos: "30", nota: "" };
  const [f, setF] = useState(vacio);
  const [ocupado, setOcupado] = useState(false);

  if (!conectado)
    return (
      <section className="panel flex w-full max-w-md items-center gap-3 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
          <CalendarDays className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Conecta tu calendario</p>
          <p className="text-xs text-muted-foreground">Ve tu día aquí y anota lo que no quieres olvidar (tu Google Calendar del correo de trabajo).</p>
        </div>
        <a href="/ritmo/google/conectar" className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">
          Conectar
        </a>
      </section>
    );

  const guardar = async () => {
    setOcupado(true);
    const r = await anotarCalendarioAction({ titulo: f.titulo, fecha: f.fecha, hora: f.hora, minutos: f.hora ? Number(f.minutos) : null, nota: f.nota });
    setOcupado(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Anotado en tu calendario 📅", aviso);
    setF(vacio);
    setAbierto(false);
  };
  const salir = async () => {
    if (!confirm("¿Desconectar tu calendario de Ritmo?")) return;
    const r = await desconectarGoogleAction();
    if (!r.ok) toast.error(r.error, aviso);
  };

  return (
    <section className="panel flex w-full max-w-md flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-primary" />
        <p className="flex-1 text-sm font-semibold">Mi día</p>
        <button type="button" onClick={() => setAbierto((x) => !x)} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
          <Plus className="size-3.5" /> Anotar
        </button>
      </div>

      {abierto ? (
        <div className="flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 ring-1 ring-border">
          <Input className="h-10" autoFocus maxLength={150} placeholder="¿Qué no quieres olvidar?" value={f.titulo} onChange={(e) => setF((x) => ({ ...x, titulo: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <Input className="h-10" type="date" value={f.fecha} onChange={(e) => setF((x) => ({ ...x, fecha: e.target.value }))} />
            <Input className="h-10" type="time" value={f.hora} onChange={(e) => setF((x) => ({ ...x, hora: e.target.value }))} title="Sin hora = recordatorio de todo el día" />
            <select className="h-10 rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-40" disabled={!f.hora} value={f.minutos} onChange={(e) => setF((x) => ({ ...x, minutos: e.target.value }))}>
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} min` : `${m / 60} h`}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-muted-foreground">{f.hora ? "Te avisa 10 min antes." : "Sin hora: queda para todo el día y te avisa a las 9 AM."}</p>
          <Button className="h-9 w-fit rounded-full" onClick={guardar} disabled={ocupado || !f.titulo.trim()}>
            {ocupado ? <Loader2 className="animate-spin" /> : <Check className="size-4" />} Guardar en mi calendario
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-amber-200">No pude leer tu calendario ahora ({error.slice(0, 120)}). Si sigue, desconéctalo y vuelve a conectarlo.</p>
      ) : eventos.length ? (
        <ul className="flex flex-col divide-y divide-border/60">
          {eventos.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
              <span className={cn("num w-20 shrink-0 font-mono text-xs", e.todoElDia ? "text-[color:var(--coral)]" : "text-muted-foreground")}>{e.todoElDia ? "Todo el día" : e.inicio}</span>
              <span className="min-w-0 flex-1 truncate">{e.titulo}</span>
              {e.link ? (
                <a href={e.link} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-primary" title="Abrir">
                  <Video className="size-4" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No tienes nada en el calendario hoy.</p>
      )}
      <p className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="truncate">{email}</span>
        <button type="button" onClick={salir} className="hover:text-foreground">
          Desconectar
        </button>
      </p>
    </section>
  );
}
