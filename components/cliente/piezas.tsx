import { CalendarDays, Check, MessageSquare } from "lucide-react";

import { PASOS, pasoActual, type Etapa } from "@/lib/clientes-app/etapa";
import { iniciales } from "@/lib/clientes-app/formato";
import type { PersonaEquipo } from "@/lib/clientes-app/datos";
import { cn } from "@/lib/utils";

/** En qué va: los 4 pasos con el actual resaltado. */
export function EtapaCliente({ etapa }: { etapa: Etapa }) {
  const actual = pasoActual(etapa);
  const paso = PASOS[actual];
  return (
    <section className="panel flex flex-col gap-4 p-5">
      <div>
        <p className="ceja">En qué vamos</p>
        <h2 className="lu-titulo mt-1 text-lg font-semibold">{paso ? paso.nombre : "Cuenta inactiva"}</h2>
        {paso ? <p className="mt-0.5 text-sm text-muted-foreground">{paso.detalle}</p> : null}
      </div>
      <ol className="grid grid-cols-4 gap-1.5">
        {PASOS.map((p, i) => (
          <li key={p.id} className="flex flex-col gap-1.5">
            <span className={cn("h-1.5 rounded-full", i < actual ? "bg-primary" : i === actual ? "bg-primary shadow-[0_0_12px_rgb(245_206_26/60%)]" : "bg-muted")} />
            <span className={cn("flex min-w-0 items-center gap-0.5 text-[10.5px] leading-tight", i <= actual ? "text-foreground" : "text-muted-foreground")}>
              {i < actual ? <Check className="size-3 shrink-0 text-primary" /> : null}
              <span className="truncate">{p.corto}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PersonaFila({ p, conAgenda = false }: { p: PersonaEquipo; conAgenda?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/30">{iniciales(p.nombre)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.nombre}</p>
        <p className="text-xs text-muted-foreground">{p.rol}</p>
      </div>
      {conAgenda && p.agenda ? (
        <a href={p.agenda} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <CalendarDays className="size-3.5" /> Agendar
        </a>
      ) : null}
    </div>
  );
}

/** Botón al canal de Slack del negocio (ahí van las solicitudes, reportes y soporte). */
export function BotonSlack({ url, grande = false }: { url: string | null; grande?: boolean }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={cn("flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 font-semibold text-primary transition hover:bg-primary/20", grande ? "h-12 text-sm" : "h-10 px-4 text-xs")}>
      <MessageSquare className="size-4" /> Escríbenos en Slack
    </a>
  );
}
