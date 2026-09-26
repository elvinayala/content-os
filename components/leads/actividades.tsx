"use client";

import { MessageCircle, Phone, Users, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { completarActividadAction } from "@/app/pulse/(app)/leads/actions";
import { telefonoLegible } from "@/lib/leads/reglas";
import { cn } from "@/lib/utils";

export interface ActividadFila {
  id: string;
  tipo: string;
  asunto: string;
  venceAt: string;
  tratoId: string;
  trato: string;
  negocio: string | null;
  telefono: string | null;
  asignado: string | null;
}

export const ICONO_ACTIVIDAD: Record<string, typeof Phone> = { llamada: Phone, reunion: Users, whatsapp: MessageCircle, tarea: CheckSquare };

const TZ = "America/Puerto_Rico";
const dia = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const hora = (d: Date) => d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export function ListaActividades({ filas, marcaSlug }: { filas: ActividadFila[]; marcaSlug: string }) {
  const [hechas, setHechas] = useState<Set<string>>(new Set());
  const [, start] = useTransition();
  const hoy = dia(new Date());
  const grupos = [
    { t: "Vencidas", c: "text-red-600", f: filas.filter((a) => new Date(a.venceAt) < new Date() && dia(new Date(a.venceAt)) !== hoy) },
    { t: "Hoy", c: "text-[#08a742]", f: filas.filter((a) => dia(new Date(a.venceAt)) === hoy) },
    { t: "Próximos días", c: "text-muted-foreground", f: filas.filter((a) => dia(new Date(a.venceAt)) > hoy) },
  ];
  const marcar = (id: string) => {
    setHechas((s) => new Set(s).add(id));
    start(async () => {
      const r = await completarActividadAction(id, true);
      if (!r.ok) {
        toast.error(r.error);
        setHechas((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    });
  };
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6">
      {grupos.map((g) => (
        <section key={g.t}>
          <h2 className={cn("mb-2 text-xs font-bold uppercase tracking-wider", g.c)}>
            {g.t} · {g.f.length}
          </h2>
          {!g.f.length && <p className="text-sm text-muted-foreground">—</p>}
          <ul className="divide-y rounded-lg border bg-background">
            {g.f.map((a) => {
              const Icono = ICONO_ACTIVIDAD[a.tipo] ?? CheckSquare;
              const v = new Date(a.venceAt);
              const lista = hechas.has(a.id);
              return (
                <li key={a.id} className={cn("flex items-center gap-3 px-3 py-2.5", lista && "opacity-40")}>
                  <input type="checkbox" className="size-4 accent-[#08a742]" checked={lista} disabled={lista} onChange={() => marcar(a.id)} aria-label="Marcar como hecha" />
                  <Icono className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", lista && "line-through")}>{a.asunto}</p>
                    <Link href={`/pulse/leads/${marcaSlug}/${a.tratoId}`} className="truncate text-xs text-muted-foreground hover:underline">
                      {a.trato}
                      {a.negocio ? ` · ${a.negocio}` : ""}
                      {a.telefono ? ` · ${telefonoLegible(a.telefono)}` : ""}
                    </Link>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{dia(v) === hoy ? hora(v) : v.toLocaleDateString("es-PR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })}</p>
                    {a.asignado && <p>{a.asignado.split(" ")[0]}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
