"use client";

import { Check, Clock, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { decidirCambioAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";

const aviso = { className: "ritmo" };

export interface CambioUI {
  id: string;
  persona: string;
  propuso: string | null;
  lineas: string[];
  cuando: string;
}

/** Cambios sensibles que Carilin, Aure o RR.HH. hicieron a mano y esperan a Elvin. Solo Elvin decide. */
export function CambiosPendientes({ cambios, decide }: { cambios: CambioUI[]; decide: boolean }) {
  if (!cambios.length) return null;
  return (
    <section className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-amber-300" />
        <h2 className="font-semibold">{decide ? "Por aprobar" : "Esperando a Elvin"}</h2>
        <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs text-amber-300">{cambios.length}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {decide
          ? "Cambios sensibles (puesto, empresa, supervisor, activo, acceso a Pulse, contrato o salario) que hizo alguien de la dirección o RR.HH. No se aplican hasta que los apruebes."
          : "Estos cambios ya se enviaron. Se aplican cuando Elvin los apruebe y te llega el aviso por Slack."}
      </p>
      <ul className="flex flex-col divide-y divide-border/60">
        {cambios.map((c) => (
          <Fila key={c.id} c={c} decide={decide} />
        ))}
      </ul>
    </section>
  );
}

function Fila({ c, decide }: { c: CambioUI; decide: boolean }) {
  const [cargando, setCargando] = useState<boolean | null>(null);
  const decidir = async (aprobar: boolean) => {
    const nota = aprobar ? undefined : (prompt("¿Por qué no? (opcional, le llega a quien lo propuso)") ?? undefined);
    setCargando(aprobar);
    const r = await decidirCambioAction({ id: c.id, aprobar, nota });
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(aprobar ? "Aprobado y aplicado" : "Rechazado", aviso);
  };
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{c.persona}</p>
        {c.lineas.map((l) => (
          <p key={l} className="text-xs text-foreground/90">
            {l}
          </p>
        ))}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {c.propuso ? `Lo pidió ${c.propuso}` : "—"} · {c.cuando}
        </p>
      </div>
      {decide ? (
        <div className="flex shrink-0 gap-1.5">
          <Button size="sm" className="rounded-full" onClick={() => decidir(true)} disabled={cargando !== null}>
            {cargando === true ? <Loader2 className="animate-spin" /> : <Check className="size-3.5" />} Aprobar
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => decidir(false)} disabled={cargando !== null}>
            {cargando === false ? <Loader2 className="animate-spin" /> : <X className="size-3.5" />} No
          </Button>
        </div>
      ) : null}
    </li>
  );
}
