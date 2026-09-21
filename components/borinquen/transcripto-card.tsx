import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface TranscriptoVista {
  id: string;
  fecha: string | null; // ISO
  duracionSeg: number | null;
  turnos: { rol: "agente" | "cliente"; texto: string; latenciaMs?: number }[];
  resultado?: string | null;
  resumen?: string | null;
  grabacionUrl?: string | null;
  estado?: "iniciada" | "terminada" | "analizada" | "error";
  sentimiento?: string | null;
}

const fmtFecha = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Puerto_Rico" });

function duracion(seg: number | null): string {
  if (!seg || seg <= 0) return "—";
  if (seg < 60) return `${seg} s`;
  return `${Math.floor(seg / 60)} min ${seg % 60 ? `${seg % 60} s` : ""}`.trim();
}

// Una llamada transcrita, en burbujas. La usan el detalle del agente de voz y el portal.
export function TranscriptoCard({ t }: { t: TranscriptoVista }) {
  const enCurso = t.estado === "iniciada";
  return (
    <Card className="bg-gradient-to-b from-card to-background/40">
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t.fecha ? fmtFecha.format(new Date(t.fecha)) : "Sin fecha"} · {duracion(t.duracionSeg)} · {t.turnos.length} turnos
          </span>
          <span className="flex items-center gap-2">
            {t.sentimiento ? <Badge variant="outline" className="label-mono">{t.sentimiento}</Badge> : null}
            {t.resultado ? (
              <Badge variant="outline" className="label-mono text-[var(--status-working)]">
                {t.resultado}
              </Badge>
            ) : enCurso ? (
              <Badge variant="outline" className="label-mono">en curso · la transcripción llega al terminar</Badge>
            ) : null}
          </span>
        </div>
        {t.resumen ? <p className="mb-3 text-sm text-muted-foreground">{t.resumen}</p> : null}
        {t.turnos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {enCurso
              ? "Todavía no hay transcripción. Actualiza en un minuto."
              : t.estado === "error"
                ? "La llamada no llegó a conectar (micrófono o red). Vuelve a intentar."
                : "Retell no devolvió transcripción para esta llamada."}
          </p>
        ) : (
          <div className="space-y-2">
            {t.turnos.map((turno, i) => (
              <div key={i} className={turno.rol === "agente" ? "flex justify-start" : "flex justify-end"}>
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                    (turno.rol === "agente" ? "rounded-bl-sm bg-muted/70" : "rounded-br-sm bg-primary text-primary-foreground")
                  }
                >
                  {turno.texto}
                  {turno.latenciaMs ? <span className="ml-2 font-mono text-[0.65rem] opacity-70">{turno.latenciaMs}ms</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
        {t.grabacionUrl ? (
          <audio controls preload="none" src={t.grabacionUrl} className="mt-4 h-9 w-full">
            Tu navegador no reproduce audio.
          </audio>
        ) : null}
      </CardContent>
    </Card>
  );
}
