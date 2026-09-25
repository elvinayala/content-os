"use client";

import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { actualizarEticoAction, reporteEticoAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
const select = "h-11 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";

export function FormEtico({ categorias }: { categorias: { id: string; nombre: string }[] }) {
  const [v, setV] = useState({ categoria: "", descripcion: "", involucrados: "", anonimo: true });
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const enviar = async () => {
    setCargando(true);
    const r = await reporteEticoAction(v);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setEnviado(true);
  };
  if (enviado)
    return (
      <div className="panel flex flex-col items-center gap-3 p-8 text-center">
        <ShieldCheck className="size-10 text-primary" />
        <p className="font-medium">Recibido. Gracias por decirlo.</p>
        <p className="max-w-sm text-sm text-muted-foreground">Lo lee solamente Elvin. {v.anonimo ? "Se envió de forma anónima: no guardamos quién eres." : ""}</p>
      </div>
    );
  return (
    <div className="panel flex flex-col gap-4 p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">¿De qué se trata?</span>
        <select className={select} value={v.categoria} onChange={(e) => setV((x) => ({ ...x, categoria: e.target.value }))}>
          <option value="">Escoge una opción</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Cuéntanos qué pasó (cuándo, dónde, cómo)</span>
        <Textarea rows={6} maxLength={5000} value={v.descripcion} onChange={(e) => setV((x) => ({ ...x, descripcion: e.target.value }))} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">¿Quién estuvo involucrado? (opcional)</span>
        <Input className="h-11" maxLength={300} value={v.involucrados} onChange={(e) => setV((x) => ({ ...x, involucrados: e.target.value }))} />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={v.anonimo} onChange={(e) => setV((x) => ({ ...x, anonimo: e.target.checked }))} className="mt-0.5 size-4 accent-[var(--neon)]" />
        <span>
          Enviar de forma anónima
          <span className="block text-xs text-muted-foreground">No se guarda tu nombre. Si lo desmarcas, Elvin sabrá que fuiste tú y podrá darte seguimiento.</span>
        </span>
      </label>
      <Button onClick={enviar} disabled={cargando} className="h-12 rounded-full text-base">
        {cargando ? <Loader2 className="animate-spin" /> : null} Enviar reporte
      </Button>
    </div>
  );
}

export interface ReporteUI {
  id: string;
  categoria: string;
  descripcion: string;
  involucrados: string | null;
  autor: string | null;
  estado: string;
  notaInterna: string | null;
  fecha: string;
}

const ESTADOS: Record<string, string> = { nuevo: "Nuevo", revisando: "Revisando", cerrado: "Cerrado" };

export function BandejaEtica({ reportes }: { reportes: ReporteUI[] }) {
  if (!reportes.length) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay reportes.</p>;
  return (
    <div className="flex flex-col gap-3">
      {reportes.map((r) => (
        <Reporte key={r.id} r={r} />
      ))}
    </div>
  );
}

function Reporte({ r }: { r: ReporteUI }) {
  const [estado, setEstado] = useState(r.estado);
  const [nota, setNota] = useState(r.notaInterna ?? "");
  const [cargando, setCargando] = useState(false);
  const guardar = async () => {
    setCargando(true);
    const x = await actualizarEticoAction({ id: r.id, estado, notaInterna: nota });
    setCargando(false);
    if (!x.ok) return toast.error(x.error, aviso);
    toast.success("Guardado", aviso);
  };
  return (
    <div className={cn("panel flex flex-col gap-3 p-4", r.estado === "nuevo" && "border-[color:var(--coral)]/40")}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{r.categoria}</span>
        <span className="text-muted-foreground">· {r.fecha} · {r.autor ?? "Anónimo"}</span>
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="ml-auto h-8 rounded-lg border border-input bg-card px-2 text-xs">
          {Object.entries(ESTADOS).map(([id, n]) => (
            <option key={id} value={id}>{n}</option>
          ))}
        </select>
      </div>
      <p className="text-sm whitespace-pre-line">{r.descripcion}</p>
      {r.involucrados ? <p className="text-xs text-muted-foreground">Involucrados: {r.involucrados}</p> : null}
      <div className="flex gap-2">
        <Input className="h-9 flex-1" placeholder="Nota interna (solo tú)" value={nota} onChange={(e) => setNota(e.target.value)} />
        <Button size="sm" variant="outline" onClick={guardar} disabled={cargando} className="rounded-full">
          {cargando ? <Loader2 className="animate-spin" /> : <Check />}
        </Button>
      </div>
    </div>
  );
}
