import Link from "next/link";

import { unidadInfo, type AgenteEjecutivoUI } from "@/lib/ceo";
import { UNIDADES } from "@/lib/ceo";
import { AgentStatusBadge } from "@/components/ceo/agent-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Card de agente especialista, estilo referencia: ícono + estado arriba,
// nombre, subtítulo mono, descripción y chip MODEL abajo.
export function AgentCard({
  agente,
  children,
  className,
}: {
  agente: AgenteEjecutivoUI;
  children?: React.ReactNode; // extras (ej. squad del CMO)
  className?: string;
}) {
  const unidad = unidadInfo(agente.unidad);
  return (
    <Card
      className={cn(
        "bg-gradient-to-b from-card to-background/60",
        agente.estado === "idle" && "opacity-75",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <agente.icon className="size-4.5" />
          </div>
          <AgentStatusBadge estado={agente.estado} />
        </div>

        <div>
          <h3 className="font-semibold leading-tight">{agente.nombre}</h3>
          <p className="label-mono mt-0.5 text-primary">{agente.subtitulo}</p>
        </div>

        <p className="text-sm text-muted-foreground">{agente.descripcion}</p>

        {agente.tareaActual ? (
          <p className="text-xs text-foreground/80">
            <span className="label-mono text-muted-foreground">Ahora · </span>
            {agente.tareaActual}
          </p>
        ) : null}

        {children}

        {agente.fuentes && agente.fuentes.length > 0 ? (
          <div className="space-y-1">
            <div className="label-mono text-muted-foreground">Fuentes</div>
            {agente.fuentes.map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    f.vivo
                      ? "bg-[var(--status-working)]"
                      : "bg-muted-foreground/40",
                  )}
                />
                <span
                  className={cn(
                    "truncate",
                    f.vivo ? "text-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {f.label}
                </span>
                {!f.vivo ? (
                  <span className="label-mono ml-auto shrink-0 text-muted-foreground">
                    pendiente
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-auto space-y-2 pt-1">
          <div className="rounded-md border border-border bg-background/50 px-2.5 py-1.5">
            <div className="label-mono text-muted-foreground">Model</div>
            <div className="font-mono text-xs text-foreground">
              {agente.modelo}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="label-mono text-muted-foreground">
              {unidad.abrev} · {unidad.nombre}
            </span>
            {agente.vinculos.map((v) =>
              v.href.startsWith("http") ? (
                <a
                  key={v.href}
                  href={v.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  {v.label} ↗
                </a>
              ) : (
                <Link
                  key={v.href}
                  href={v.href}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  {v.label} →
                </Link>
              ),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
