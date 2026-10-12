import { Gift } from "lucide-react";

import { FormReferir } from "@/components/cliente/referir";
import { referidosDe } from "@/lib/clientes-app/referidos";
import { estadoReferido } from "@/lib/clientes-app/referidos-reglas";
import { visorActual } from "@/lib/clientes-app/sesion";
import { cn } from "@/lib/utils";

export const metadata = { title: "Referir" };

// Refiere y gana (Elvin, 30/sep). El premio lo define Elvin: CLIENTES_APP_PREMIO_REFERIDO (sin él, no se promete nada).
export default async function ReferirPage() {
  const v = await visorActual();
  if (!v) return null;
  const referidos = await referidosDe(v.itemId).catch(() => []);
  const premio = process.env.CLIENTES_APP_PREMIO_REFERIDO?.trim();
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="ceja">Refiere y gana</p>
        <h1 className="lu-titulo mt-1 text-2xl font-semibold">¿Conoces un negocio que necesite más clientes?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Déjanos sus datos y nosotros le escribimos de tu parte. Aquí ves cómo va cada uno.</p>
      </header>

      {premio ? (
        <div className="panel flex items-center gap-3 border-primary/40 bg-primary/[0.07] p-4">
          <Gift className="size-6 shrink-0 text-primary" />
          <p className="text-sm">{premio}</p>
        </div>
      ) : null}

      <FormReferir deshabilitado={v.modo === "equipo" ? "Vista previa del equipo: el formulario lo usa el cliente." : undefined} />

      <section className="flex flex-col gap-2">
        <h2 className="lu-titulo text-base font-semibold">Tus referidos</h2>
        {referidos.length ? (
          <ul className="panel divide-y divide-border/60">
            {referidos.map((r) => {
              const e = estadoReferido(r.estado);
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{r.negocio || r.nombre}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.createdAt.toLocaleDateString("es-PR", { day: "numeric", month: "short", timeZone: "America/Puerto_Rico" })}</span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", e.tono === "ganado" ? "bg-primary text-primary-foreground" : e.tono === "cerrado" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>{e.texto}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="panel px-4 py-3 text-sm text-muted-foreground">Todavía no has referido a nadie.</p>
        )}
      </section>
    </div>
  );
}
