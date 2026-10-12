"use client";

import { Camera, Clapperboard, Loader2, MapPin, Minus, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { agregarTrabajoAction, borrarTrabajoAction } from "@/app/ritmo/trabajos-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DIAS_ATRAS_TRABAJOS, horaBonita, PUEBLOS_PR, type Trabajo } from "@/lib/desempeno/trabajos-reglas";
import { cn } from "@/lib/utils";

// Mis trabajos (12/oct, Derek Toro, videógrafo): no poncha; anota cada trabajo del día (qué hizo, negocio, pueblo, cuántos
// videos, hora y día). Con `para`, la vista maestra se lo anota desde su ficha en Equipo.

const aviso = { className: "ritmo" };
const sumarDias = (f: string, n: number) => new Date(Date.parse(`${f}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const diaBonito = (f: string, hoy: string) =>
  f === hoy ? "Hoy" : f === sumarDias(hoy, -1) ? "Ayer" : new Date(`${f}T12:00:00Z`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).replace(/^./, (c) => c.toUpperCase());

export function MisTrabajos({ trabajos, hoy, ahora, para, nombre }: { trabajos: Trabajo[]; hoy: string; ahora: string; para?: string; nombre?: string }) {
  const vacio = { fecha: hoy, hora: ahora, negocio: "", pueblo: "", videos: 1, trabajo: "" };
  const [f, setF] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const deHoy = trabajos.filter((t) => t.fecha === hoy);
  const dias = [...new Set(trabajos.map((t) => t.fecha))].sort().reverse();
  const quien = nombre ? nombre.split(" ")[0] : null;

  const guardar = async () => {
    setGuardando(true);
    const r = await agregarTrabajoAction(f, para);
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Trabajo anotado 🎬", aviso);
    // Queda el mismo día y pueblo (suele seguir en la zona); lo demás se limpia para el próximo.
    setF((x) => ({ ...vacio, fecha: x.fecha, pueblo: x.pueblo }));
  };
  const borrar = async (t: Trabajo) => {
    if (!confirm(`¿Borrar el trabajo de ${t.negocio} (${horaBonita(t.hora)})?`)) return;
    setBorrando(t.id);
    const r = await borrarTrabajoAction(t.id, para);
    setBorrando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Trabajo borrado", aviso);
  };

  return (
    <section className={cn("panel flex w-full flex-col gap-4 p-5", !deHoy.length ? "border-amber-400/40" : "border-emerald-400/25")}>
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <Clapperboard className="size-4 text-primary" /> {quien ? `Trabajos de ${quien}` : "Mis trabajos"}
        </h2>
        <p className={cn("mt-0.5 text-sm", deHoy.length ? "text-emerald-300" : "text-amber-300")}>
          {deHoy.length
            ? `Hoy: ${deHoy.length} ${deHoy.length === 1 ? "trabajo" : "trabajos"} · ${deHoy.reduce((n, t) => n + t.videos, 0)} videos`
            : quien
              ? `${quien} no ha anotado trabajos hoy.`
              : "Anota cada trabajo que hagas hoy (uno por negocio)."}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-border/70">
        <div className="grid grid-cols-[3fr_2fr] gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-fecha" className="text-xs text-muted-foreground">Día</Label>
            <Input id="t-fecha" type="date" className="h-10 px-2 text-sm" value={f.fecha} min={sumarDias(hoy, -DIAS_ATRAS_TRABAJOS)} max={hoy} onChange={(e) => setF((x) => ({ ...x, fecha: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-hora" className="text-xs text-muted-foreground">Hora</Label>
            <Input id="t-hora" type="time" className="h-10 px-2 text-sm" value={f.hora} onChange={(e) => setF((x) => ({ ...x, hora: e.target.value }))} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-negocio" className="text-xs text-muted-foreground">Negocio</Label>
          <Input id="t-negocio" className="h-10" maxLength={120} placeholder="Ej.: Tinos Pizza" value={f.negocio} onChange={(e) => setF((x) => ({ ...x, negocio: e.target.value }))} />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="t-pueblo" className="text-xs text-muted-foreground">Pueblo</Label>
            <Input id="t-pueblo" className="h-10" list="pueblos-pr" placeholder="Ej.: Ponce" value={f.pueblo} onChange={(e) => setF((x) => ({ ...x, pueblo: e.target.value }))} />
            <datalist id="pueblos-pr">
              {PUEBLOS_PR.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Videos</Label>
            <div className="flex h-10 items-center gap-1">
              <button type="button" aria-label="Menos videos" onClick={() => setF((x) => ({ ...x, videos: Math.max(0, x.videos - 1) }))} className="grid size-9 place-items-center rounded-lg bg-white/[0.05] text-muted-foreground transition hover:bg-white/10 active:scale-90">
                <Minus className="size-3.5" />
              </button>
              <Input aria-label="Videos" className="h-9 w-12 px-1 text-center font-mono" inputMode="numeric" value={String(f.videos)} onChange={(e) => setF((x) => ({ ...x, videos: Math.min(200, Number(e.target.value.replace(/\D/g, "") || 0)) }))} />
              <button type="button" aria-label="Más videos" onClick={() => setF((x) => ({ ...x, videos: Math.min(200, x.videos + 1) }))} className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary transition hover:bg-primary/25 active:scale-90">
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="t-trabajo" className="text-xs text-muted-foreground">Trabajo realizado</Label>
          <Textarea id="t-trabajo" rows={2} maxLength={300} placeholder="Ej.: grabé 3 reels del menú nuevo y entrevista al dueño" value={f.trabajo} onChange={(e) => setF((x) => ({ ...x, trabajo: e.target.value }))} />
        </div>
        <Button onClick={guardar} disabled={guardando} className="h-11 rounded-full">
          {guardando ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />} Anotar trabajo
        </Button>
      </div>

      {dias.length ? (
        <div className="flex flex-col gap-4">
          {dias.map((dia) => {
            const del = trabajos.filter((t) => t.fecha === dia).sort((a, b) => a.hora.localeCompare(b.hora));
            return (
              <div key={dia} className="flex flex-col gap-2">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {diaBonito(dia, hoy)} · {del.length} {del.length === 1 ? "trabajo" : "trabajos"} · {del.reduce((n, t) => n + t.videos, 0)} videos
                </p>
                <ol className="flex flex-col gap-2">
                  {del.map((t) => (
                    <li key={t.id} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-border/60">
                      <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{horaBonita(t.hora)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="flex items-center gap-1 font-medium">
                            <Store className="size-3.5 text-primary" /> {t.negocio}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {t.pueblo}
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            <Camera className="size-3" /> {t.videos} {t.videos === 1 ? "video" : "videos"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm break-words whitespace-pre-wrap text-foreground/85">{t.trabajo}</p>
                      </div>
                      <button type="button" aria-label="Borrar trabajo" disabled={borrando === t.id} onClick={() => borrar(t)} className="grid size-8 shrink-0 place-items-center self-start rounded-lg text-muted-foreground transition hover:bg-red-500/10 hover:text-red-300">
                        {borrando === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
