"use client";

import { Check, ChevronRight, Clock, FileText, Loader2, PartyPopper, Sparkles, UserCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { marcarHechoAction } from "@/app/pulse/(app)/mi-dia/actions";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import { cuando, type Pendiente, type TipoPendiente } from "@/lib/pulse/mi-dia";
import type { UsuarioPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

const SECCION: Record<TipoPendiente, { titulo: string; ayuda: string; icono: React.ReactNode; boton: string | null; color: string }> = {
  nuevo: { titulo: "Clientes nuevos", ayuda: "Llenaron el formulario de onboarding en las últimas 48 horas.", icono: <Sparkles className="size-4" />, boton: "Revisado", color: "#00c875" },
  onboarding: { titulo: "Onboardings detenidos", ayuda: "Llevan más de 48 horas en ONBOARDING & SETUP.", icono: <Clock className="size-4" />, boton: "Revisado", color: "#fdab3d" },
  seguimiento: { titulo: "Seguimientos de 10 días", ayuda: "Vencen hoy o vencieron esta semana.", icono: <UserCheck className="size-4" />, boton: "Hecho", color: "#579bfc" },
  reporte: { titulo: "Reportes por enviar", ayuda: "Al marcarlo, el próximo reporte se calcula solo.", icono: <FileText className="size-4" />, boton: "Reporte enviado", color: "#a25ddc" },
};
const ORDEN: TipoPendiente[] = ["nuevo", "onboarding", "seguimiento", "reporte"];

export function MiDia({ pendientes, hoy, yo, usuarios }: { pendientes: Pendiente[]; hoy: string; yo: UsuarioPulse; usuarios: UsuarioPulse[] }) {
  const [soloMios, setSoloMios] = useState(false);
  const [hechos, setHechos] = useState<Set<string>>(new Set());
  const [marcando, setMarcando] = useState<string | null>(null);
  const k = (p: Pendiente) => `${p.itemId}:${p.tipo}:${p.fecha ?? ""}`;
  const lista = useMemo(() => pendientes.filter((p) => !hechos.has(k(p)) && (!soloMios || p.personas.includes(yo.id))), [pendientes, hechos, soloMios, yo.id]);
  const mios = pendientes.filter((p) => p.personas.includes(yo.id)).length;
  const fecha = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });

  const marcar = async (p: Pendiente) => {
    setMarcando(k(p));
    const r = await marcarHechoAction({ itemId: p.itemId, tipo: p.tipo, fecha: p.fecha });
    setMarcando(null);
    if (!r.ok) return toast.error(r.error, { className: "pulse" });
    setHechos((h) => new Set(h).add(k(p)));
    toast.success(`${p.nombre}: listo`, { className: "pulse" });
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase first-letter:uppercase">{fecha}</p>
          <h1 className="text-3xl font-semibold tracking-tight">Mi día</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lista.length ? `${lista.length} ${lista.length === 1 ? "cosa te toca" : "cosas te tocan"} hoy.` : "Todo al día."} Lo que marques como hecho queda en el historial del cliente.
          </p>
        </div>
        <div className="segmentado flex text-xs">
          <button type="button" data-activo={!soloMios} onClick={() => setSoloMios(false)} className="rounded-[7px] px-3 py-1.5">Todo el equipo</button>
          <button type="button" data-activo={soloMios} onClick={() => setSoloMios(true)} className="rounded-[7px] px-3 py-1.5">Solo míos ({mios})</button>
        </div>
      </section>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-white/60 p-12 text-center">
          <PartyPopper className="size-8 text-primary" />
          <p className="font-medium">No hay pendientes{soloMios ? " asignados a ti" : ""}.</p>
          <p className="text-sm text-muted-foreground">Cuando un seguimiento, un reporte o un onboarding te toque, aparece aquí.</p>
        </div>
      ) : null}

      {ORDEN.map((tipo) => {
        const items = lista.filter((p) => p.tipo === tipo);
        if (!items.length) return null;
        const s = SECCION[tipo];
        return (
          <section key={tipo} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: s.color }}>{s.icono}</span>
              <h2 className="text-base font-semibold">{s.titulo}</h2>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `color-mix(in srgb, ${s.color} 14%, transparent)`, color: s.color }}>{items.length}</span>
              <span className="hidden text-xs text-muted-foreground sm:inline">· {s.ayuda}</span>
            </div>
            <ul className="overflow-hidden rounded-xl border bg-white">
              {items.map((p) => (
                <li key={k(p)} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <Link href={`/pulse/${p.boardSlug}?item=${p.itemId}`} className="group flex items-center gap-1 font-medium hover:text-primary">
                      <span className="truncate">{p.nombre}</span>
                      <ChevronRight className="size-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.empresa, p.boardNombre].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className={cn("hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline", p.dias > 0 ? "bg-[#e2445c]/10 text-[#e2445c]" : "bg-muted text-muted-foreground")}>
                    {tipo === "onboarding" ? `hace ${p.dias} días` : tipo === "nuevo" ? "nuevo" : cuando(p.dias)}
                  </span>
                  <div className="hidden shrink-0 -space-x-1.5 sm:flex">
                    {p.personas.slice(0, 3).map((id) => {
                      const u = usuarios.find((x) => x.id === id);
                      return u ? <UserAvatar key={id} nombre={u.nombre} color={u.color} className="size-6 text-[10px] ring-2 ring-white" /> : null;
                    })}
                  </div>
                  {s.boton ? (
                    <Button variant="outline" size="sm" disabled={marcando === k(p)} onClick={() => marcar(p)} className="shrink-0">
                      {marcando === k(p) ? <Loader2 className="animate-spin" /> : <Check />} <span className="hidden sm:inline">{s.boton}</span>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
