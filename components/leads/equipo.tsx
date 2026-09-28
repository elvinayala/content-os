"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { accesoEquipoLeadsAction } from "@/app/pulse/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { ALCANCES } from "@/lib/leads/equipo";
import type { MiembroLeads } from "@/lib/leads/equipo-datos";
import type { Marca } from "@/lib/leads/reglas";

const aviso = { className: "pulse" };
const select = "h-9 rounded-md border bg-background px-2 text-sm";

export function EquipoLeads({ marca, yoId, conAcceso, candidatos }: { marca: Marca; yoId: string; conAcceso: MiembroLeads[]; candidatos: MiembroLeads[] }) {
  const [nuevo, setNuevo] = useState("");
  const [alcance, setAlcance] = useState<"todos" | "mios">("todos");
  const [cargando, setCargando] = useState<string | null>(null);
  const [buscar, setBuscar] = useState("");
  const opciones = useMemo(() => candidatos.filter((c) => `${c.nombre} ${c.email}`.toLowerCase().includes(buscar.toLowerCase())), [candidatos, buscar]);

  const cambiar = async (userId: string, a: "todos" | "mios" | null, nombre: string) => {
    if (a === null && !confirm(`¿Quitarle a ${nombre} el acceso a Leads?`)) return;
    setCargando(userId);
    const r = await accesoEquipoLeadsAction({ marca, userId, alcance: a });
    setCargando(null);
    if (!r.ok) return toast.error(r.error ?? "No se pudo", aviso);
    toast.success(a === null ? `${nombre} ya no entra a Leads` : `${nombre}: listo`, aviso);
    if (userId === nuevo) setNuevo("");
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="superficie flex flex-col gap-3 p-5">
        <h3 className="text-[15px] font-semibold">Dar acceso</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre o correo…" className={`${select} w-52`} />
          <select value={nuevo} onChange={(e) => setNuevo(e.target.value)} className={`${select} min-w-60 flex-1`}>
            <option value="">— Escoge la persona —</option>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.puesto ? ` · ${c.puesto}` : ""}
                {c.soloRitmo ? " · solo Ritmo" : ""}
              </option>
            ))}
          </select>
          <select value={alcance} onChange={(e) => setAlcance(e.target.value as "todos" | "mios")} className={select}>
            {ALCANCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          <Button size="sm" className="h-9" disabled={!nuevo || cargando !== null} onClick={() => cambiar(nuevo, alcance, candidatos.find((c) => c.id === nuevo)?.nombre ?? "")}>
            {cargando === nuevo ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />} Dar acceso
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Todo lo de cuentas y accesos lo maneja <b>Yaileen (RR.HH.)</b>: si la persona no aparece, ella la da de alta; si sale como «solo Ritmo», ella le abre Pulse; y si «todavía no creó su clave», ella le manda su link de acceso.
        </p>
      </section>

      <section className="superficie overflow-hidden">
        <h3 className="px-5 pt-4 pb-2 text-[15px] font-semibold">Con acceso ({conAcceso.length})</h3>
        <ul className="divide-y">
          {conAcceso.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{m.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {m.puesto ?? m.email}
                  {m.sinClave ? " · todavía no creó su clave" : ""}
                </p>
              </div>
              {m.implicito ? (
                <span className="text-xs text-muted-foreground">Dirección · ve todo</span>
              ) : (
                <>
                  <select value={m.alcance ?? "todos"} disabled={cargando !== null} onChange={(e) => cambiar(m.id, e.target.value as "todos" | "mios", m.nombre)} className={select}>
                    {ALCANCES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                  {m.id !== yoId ? (
                    <Button size="sm" variant="ghost" className="h-9 text-muted-foreground hover:text-destructive" disabled={cargando !== null} onClick={() => cambiar(m.id, null, m.nombre)} title="Quitar acceso">
                      {cargando === m.id ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
