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

/** Etiqueta de empresa: AI Borinquen en coral, Level Up en verde (sutil). */
export function EmpresaBadge({ empresa, siempre = false }: { empresa: string; siempre?: boolean }) {
  if (empresa !== "ai_borinquen" && !siempre) return null;
  const aib = empresa === "ai_borinquen";
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ring-1", aib ? "bg-[color:var(--coral)]/15 text-[color:var(--coral)] ring-[color:var(--coral)]/30" : "bg-primary/10 text-primary ring-primary/25")}>
      {aib ? "AI BORINQUEN" : "LEVEL UP"}
    </span>
  );
}

/** Filtro por empresa (links que conservan los demás parámetros). */
export function FiltroEmpresa({ actual, href }: { actual: string | undefined; href: (e: string | null) => string }) {
  const op = [
    { id: null, n: "Todas" },
    { id: "level_up", n: "Level Up" },
    { id: "ai_borinquen", n: "AI Borinquen" },
  ];
  return (
    <div className="flex gap-1 rounded-full border border-border bg-card/60 p-1 text-xs">
      {op.map((o) => (
        <a key={o.n} href={href(o.id)} className={cn("rounded-full px-3 py-1.5 transition", (actual ?? null) === o.id ? (o.id === "ai_borinquen" ? "bg-[color:var(--coral)] text-background" : "bg-primary text-primary-foreground") : "text-muted-foreground hover:text-foreground")}>
          {o.n}
        </a>
      ))}
    </div>
  );
}
