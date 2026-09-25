import type { DiaPersona } from "@/lib/desempeno/datos";
import type { Color, EstadoAsistencia } from "@/lib/desempeno/reglas";
import { cn } from "@/lib/utils";

// Piezas de presentación del panel de Desempeño (sin estado: sirven en server y client).

export const COLOR: Record<Color, { punto: string; texto: string; fondo: string; nombre: string }> = {
  verde: { punto: "bg-emerald-400", texto: "text-emerald-300", fondo: "bg-emerald-400/10 ring-emerald-400/30", nombre: "Cumpliendo" },
  amarillo: { punto: "bg-amber-400", texto: "text-amber-300", fondo: "bg-amber-400/10 ring-amber-400/30", nombre: "Atención" },
  rojo: { punto: "bg-red-500", texto: "text-red-300", fondo: "bg-red-500/10 ring-red-500/30", nombre: "Requiere intervención" },
};

export function ScoreBadge({ score, color, oculto, className }: { score: number | null; color: Color | null; oculto?: boolean; className?: string }) {
  if (oculto) return <span className={cn("text-xs text-muted-foreground", className)}>calibrando</span>;
  if (score === null || !color) return <span className={cn("text-sm text-muted-foreground", className)}>—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold tabular-nums ring-1", COLOR[color].fondo, COLOR[color].texto, className)}>
      <span className={cn("size-2 rounded-full", COLOR[color].punto)} />
      {score}
    </span>
  );
}

const ESTADO: Record<EstadoAsistencia, { nombre: string; clase: string }> = {
  trabajando: { nombre: "Trabajando", clase: "bg-primary/10 text-primary ring-primary/30" },
  a_tiempo: { nombre: "A tiempo", clase: "bg-white/5 text-foreground/80 ring-white/10" },
  tarde: { nombre: "Tarde", clase: "bg-amber-400/10 text-amber-300 ring-amber-400/30" },
  ausente: { nombre: "Sin marcar", clase: "bg-red-500/10 text-red-300 ring-red-500/30" },
  pendiente: { nombre: "Aún no entra", clase: "bg-white/5 text-muted-foreground ring-white/10" },
  libre: { nombre: "Libre", clase: "bg-white/5 text-muted-foreground ring-white/10" },
};

export function EstadoChip({ estado, extra }: { estado: EstadoAsistencia; extra?: string }) {
  const e = ESTADO[estado];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1", e.clase)}>
      {e.nombre}
      {extra ? <span className="ml-1 opacity-70">{extra}</span> : null}
    </span>
  );
}

export const horaPR = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("es-PR", { timeZone: "America/Puerto_Rico", hour: "numeric", minute: "2-digit" }) : "—";

export const fmtHoras = (h: number) => (h ? `${Math.floor(h)}h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}m` : "—");

export const diaCorto = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "short", day: "numeric" });

/** 7 puntitos: color del score de cada día (gris si no se califica / calibrando). */
export function MiniDias({ dias, oculto }: { dias: DiaPersona[]; oculto?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {dias.map((d) => (
        <span
          key={d.fecha}
          title={`${diaCorto(d.fecha)} · ${oculto || d.score.score === null ? ESTADO[d.asistencia.estado].nombre : d.score.score}`}
          className={cn("size-2.5 rounded-full", !oculto && d.color ? COLOR[d.color].punto : d.asistencia.estado === "ausente" ? "bg-red-500/50" : d.asistencia.puntaje === null ? "bg-white/10" : "bg-white/40")}
        />
      ))}
    </div>
  );
}

export function Tarjeta({ titulo, valor, detalle, tono }: { titulo: string; valor: React.ReactNode; detalle?: React.ReactNode; tono?: "rojo" | "ambar" }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</p>
      <p className={cn("num mt-1 text-2xl font-semibold", tono === "rojo" && "text-red-400", tono === "ambar" && "text-amber-300")}>{valor}</p>
      {detalle ? <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p> : null}
    </div>
  );
}
