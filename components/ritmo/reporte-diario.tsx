"use client";

import { CheckCircle2, ClipboardList, Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { guardarReporteDiaAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Reporte del día de quien no poncha (Lis, 30/sep; Elvin: "ya no poncha, pero déjaselo visible en su pantalla todos los
// días, que tienen que llenarlo"). Siempre a la vista en Hoy; se puede corregir el de hoy o el de ayer.

type Manual = { id: string; nombre: string; detalle?: string; dinero?: boolean };
type Rep = { datos: Record<string, number>; detalles: Record<string, string>; bloqueos: string | null } | null;

const aviso = { className: "ritmo" };
const dia = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "short" });

function aValores(r: Rep) {
  const v: Record<string, string> = {};
  for (const [k, n] of Object.entries(r?.datos ?? {})) v[k] = String(n);
  for (const [k, t] of Object.entries(r?.detalles ?? {})) v[`${k}__detalle`] = t;
  return v;
}

export function ReporteDiario({ manual, hoy, ayer, repHoy, repAyer }: { manual: Manual[]; hoy: string; ayer: string; repHoy: Rep; repAyer: Rep }) {
  const [fecha, setFecha] = useState(hoy);
  const actual = fecha === hoy ? repHoy : repAyer;
  const [valores, setValores] = useState<Record<string, string>>(() => aValores(repHoy));
  const [bloqueos, setBloqueos] = useState(repHoy?.bloqueos ?? "");
  const [cargando, setCargando] = useState(false);
  // Lis (1/oct): "no me deja ver lo que escribí". Con reporte guardado se muestra lo que reportó; "Corregir" abre el formulario.
  const [editando, setEditando] = useState(!repHoy);
  const cambiarFecha = (f: string) => {
    setFecha(f);
    const r = f === hoy ? repHoy : repAyer;
    setValores(aValores(r));
    setBloqueos(r?.bloqueos ?? "");
    setEditando(!r);
  };
  // Tras guardar, refresh() trae el reporte nuevo: el formulario se vuelve a llenar con lo guardado.
  const [previo, setPrevio] = useState({ repHoy, repAyer });
  if (previo.repHoy !== repHoy || previo.repAyer !== repAyer) {
    setPrevio({ repHoy, repAyer });
    const r = fecha === hoy ? repHoy : repAyer;
    if (r) {
      setValores(aValores(r));
      setBloqueos(r.bloqueos ?? "");
    }
  }
  const dinero = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const guardar = async () => {
    setCargando(true);
    const datos: Record<string, number> = {};
    const detalles: Record<string, string> = {};
    for (const m of manual) {
      if (valores[m.id]?.trim() !== "" && valores[m.id] !== undefined) datos[m.id] = Number(valores[m.id]);
      if (valores[`${m.id}__detalle`]?.trim()) detalles[m.id] = valores[`${m.id}__detalle`];
    }
    const r = await guardarReporteDiaAction({ fecha, datos, detalles, bloqueos });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(fecha === hoy ? "Listo: tu reporte de hoy quedó guardado." : "Listo: el reporte de ayer quedó guardado.", aviso);
    setEditando(false);
  };
  return (
    <section className={cn("panel flex flex-col gap-4 p-5", !repHoy && fecha === hoy ? "border-amber-400/40" : "border-emerald-400/25")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardList className="size-4 text-primary" /> Mi reporte del día
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {actual ? (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="size-3.5" /> Ya lo llenaste ({dia(fecha)}). Esto es lo que reportaste.
              </span>
            ) : fecha === hoy ? (
              <span className="text-amber-300">Pendiente: llénalo antes de terminar tu día (si algo fue 0, pon 0).</span>
            ) : (
              <span className="text-amber-300">No llenaste el de ayer: todavía estás a tiempo.</span>
            )}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 text-xs">
          {[
            { f: hoy, t: "Hoy" },
            { f: ayer, t: "Ayer" },
          ].map((x) => (
            <button key={x.f} type="button" onClick={() => cambiarFecha(x.f)} className={cn("rounded-full px-3 py-1 transition", fecha === x.f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {x.t}
            </button>
          ))}
        </div>
      </div>
      {actual && !editando ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {manual.map((m) => (
              <div key={m.id} className="flex flex-col gap-0.5 rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{m.nombre}</span>
                  <span className="text-lg font-semibold tabular-nums">{actual.datos[m.id] === undefined ? "—" : m.dinero ? dinero(actual.datos[m.id]) : actual.datos[m.id]}</span>
                </div>
                {actual.detalles[m.id] ? <p className="whitespace-pre-wrap break-words text-sm">{actual.detalles[m.id]}</p> : null}
              </div>
            ))}
          </div>
          {actual.bloqueos ? (
            <div className="rounded-xl bg-white/[0.03] p-3 text-sm">
              <span className="text-muted-foreground">Bloqueos: </span>
              <span className="whitespace-pre-wrap break-words">{actual.bloqueos}</span>
            </div>
          ) : null}
          <Button variant="outline" onClick={() => setEditando(true)} className="h-10 self-start rounded-full px-6">
            <Pencil /> Corregir
          </Button>
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {manual.map((m) => (
              <div key={m.id} className="flex flex-col gap-1.5 rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`r-${m.id}`} className="leading-snug">
                    {m.nombre} <span className="text-[color:var(--coral)]">*</span>
                  </Label>
                  <Input
                    id={`r-${m.id}`}
                    type="number"
                    inputMode={m.dinero ? "decimal" : "numeric"}
                    min={0}
                    step={m.dinero ? "0.01" : "1"}
                    className="h-10 w-28 text-right"
                    value={valores[m.id] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [m.id]: e.target.value }))}
                    placeholder={m.dinero ? "$0" : "0"}
                  />
                </div>
                {m.detalle ? (
                  <Textarea
                    rows={2}
                    className="min-h-0 resize-y text-sm"
                    maxLength={300}
                    value={valores[`${m.id}__detalle`] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [`${m.id}__detalle`]: e.target.value }))}
                    placeholder={Number(valores[m.id] || 0) > 0 ? m.detalle : `${m.detalle} (si fue 0, puedes dejarlo vacío)`}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="r-bloqueos">¿Algún bloqueo? (opcional)</Label>
            <Textarea id="r-bloqueos" rows={2} maxLength={1000} value={bloqueos} onChange={(e) => setBloqueos(e.target.value)} placeholder="Ej.: espero respuesta de un aliado" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={guardar} disabled={cargando} className="h-11 rounded-full px-8">
              {cargando ? <Loader2 className="animate-spin" /> : null} {actual ? "Guardar cambios" : "Enviar mi reporte"}
            </Button>
            {actual ? (
              <Button variant="ghost" onClick={() => cambiarFecha(fecha)} className="h-11 rounded-full px-5">
                Cancelar
              </Button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
