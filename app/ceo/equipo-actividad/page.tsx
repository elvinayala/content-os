import { fmtDur, leerActividadEquipo, type EstadoActividad } from "@/lib/actividad-equipo";
import { fmtFecha } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Actividad del equipo · CEO Command Center" };
export const dynamic = "force-dynamic";

const DOT: Record<EstadoActividad, string> = {
  rojo: "bg-destructive",
  amarillo: "bg-[var(--status-waiting)]",
  verde: "bg-[var(--status-working)]",
  na: "bg-muted-foreground",
};

// Productividad/asistencia real en Slack. Regla: +2h sin escribir en horario
// laboral (L-V 8am-6pm, Sáb 8am-1pm) = rojo. El reporte del día va al DM de Carilin.
export default async function ActividadEquipoPage() {
  const data = await leerActividadEquipo();
  const personas = data?.personas ?? [];
  const max7d = Math.max(1, ...personas.map((p) => p.mensajes7d));
  const rojos = personas.filter((p) => p.estado === "rojo").length;

  return (
    <>
      <PageHeader
        titulo="Actividad del equipo"
        descripcion="Productividad real en Slack. Regla: +2h sin escribir en horario laboral = alerta roja. El reporte del día llega al DM de Carilin."
      >
        {rojos > 0 ? (
          <Badge className="label-mono bg-destructive text-destructive-foreground">
            {rojos} en rojo
          </Badge>
        ) : null}
        {data ? (
          <Badge variant="outline" className="label-mono">
            {data.canalesLeidos} canales
          </Badge>
        ) : null}
      </PageHeader>

      <main className="flex-1 space-y-3 p-4 sm:p-6">
        {!data ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay datos — corré{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              node scripts/actividad-equipo.mjs
            </code>{" "}
            (o esperá el reporte del fin de jornada).
          </p>
        ) : (
          <>
            <p className="label-mono text-muted-foreground">
              {data.ventana
                ? `${data.ventana.sabado ? "Sábado (8am-1pm)" : "L-V (8am-6pm)"} · `
                : "Domingo (no se monitorea) · "}
              actualizado {fmtFecha(data.actualizadoEl)}
            </p>

            {personas.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  "bg-gradient-to-b from-card to-background/60",
                  p.estado === "rojo" && "border-destructive/50",
                )}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <span className={cn("size-2.5 shrink-0 rounded-full", DOT[p.estado])} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="label-mono text-muted-foreground">{p.rol}</span>
                    </div>
                    {p.motivo ? (
                      <p
                        className={cn(
                          "text-xs",
                          p.estado === "rojo"
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {p.motivo}
                      </p>
                    ) : (
                      <div className="mt-1.5 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(p.mensajes7d / max7d) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right text-xs">
                    <div className="w-12">
                      <div className="font-mono text-base font-semibold tabular-nums">
                        {p.mensajesHoy}
                      </div>
                      <div className="label-mono text-muted-foreground">hoy</div>
                    </div>
                    <div className="w-12">
                      <div className="font-mono tabular-nums">{p.mensajes7d}</div>
                      <div className="label-mono text-muted-foreground">7d</div>
                    </div>
                    <div className="w-20">
                      <div className="font-mono tabular-nums">
                        {p.respuestaMin != null ? fmtDur(p.respuestaMin) : "—"}
                      </div>
                      <div className="label-mono text-muted-foreground">resp.</div>
                    </div>
                    <div className="w-20">
                      <div className="label-mono">{p.ultimaHace}</div>
                      <div className="label-mono text-muted-foreground">últ.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <p className="pt-1 text-xs text-muted-foreground">
              Rojo = más de 2h sin escribir en horario laboral, o sin actividad hoy
              (posible ausencia). Carilin recibe este reporte por DM para averiguar
              qué pasó. "resp." = tiempo aprox. en que la persona entra cuando otro
              escribe (7d).
            </p>
          </>
        )}
      </main>
    </>
  );
}
