import { FileText } from "lucide-react";

import { QuitarEntrega, SubirEntregas } from "@/components/cliente/entregas-equipo";
import type { Entrega } from "@/lib/clientes-app/entregas";
import { TIPOS_ENTREGA } from "@/lib/clientes-app/entregas-reglas";

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Puerto_Rico" });

// Solo tres cosas (Elvin, 30/sep): su plan de marketing, sus creativos aprobados y sus videos. El equipo (vista previa)
// ve además los botones de subir y quitar.
export function Entregables({ entregas, equipo }: { entregas: Entrega[]; equipo: boolean }) {
  const secciones = TIPOS_ENTREGA.map((t) => ({ ...t, items: entregas.filter((e) => e.tipo === t.id) })).filter((s) => equipo || s.items.length);
  if (!secciones.length) return null;
  return (
    <div className="flex flex-col gap-6">
      {equipo ? <p className="panel border-dashed border-primary/40 px-4 py-3 text-xs text-muted-foreground">Solo el equipo ve los botones de subir y quitar. Sube aquí únicamente lo aprobado: el plan inicial, los flyers y los videos.</p> : null}
      {secciones.map((s) => (
          <section key={s.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="lu-titulo text-base font-semibold">{s.nombre}</h2>
              {equipo ? <SubirEntregas tipo={s.id} texto={s.subir} acepta={s.acepta} /> : null}
            </div>
            {!s.items.length ? (
              <p className="text-xs text-muted-foreground">Todavía nada aquí.</p>
            ) : s.id === "creativo" ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {s.items.map((e) => (
                  <div key={e.id} className="relative">
                    <a href={`/cliente/entrega/${e.id}`} target="_blank" className="block overflow-hidden rounded-2xl border border-border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/cliente/entrega/${e.id}`} alt={e.nombre} loading="lazy" className="aspect-square w-full object-cover" />
                    </a>
                    {equipo ? (
                      <span className="absolute top-1.5 right-1.5">
                        <QuitarEntrega id={e.id} nombre={e.nombre} />
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : s.id === "video" ? (
              <div className="flex flex-col gap-3">
                {s.items.map((e) => (
                  <div key={e.id} className="panel overflow-hidden p-0">
                    <video src={`/cliente/entrega/${e.id}`} controls playsInline preload="metadata" className="aspect-video w-full bg-black" />
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-sm">{e.nombre}</span>
                      {equipo ? <QuitarEntrega id={e.id} nombre={e.nombre} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="panel divide-y divide-border/60">
                {s.items.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <FileText className="size-5 shrink-0 text-primary" />
                    <a href={`/cliente/entrega/${e.id}`} target="_blank" className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.nombre}</span>
                      <span className="block text-[11px] text-muted-foreground">{fecha(e.creadoAt)}</span>
                    </a>
                    {equipo ? <QuitarEntrega id={e.id} nombre={e.nombre} /> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
    </div>
  );
}
