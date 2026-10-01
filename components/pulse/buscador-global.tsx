"use client";

import { CornerDownLeft, Kanban, LayoutGrid, Loader2, Search, Settings, Sparkles, Sun, Table2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { buscarGlobalAction } from "@/app/pulse/(app)/actions";
import { buscarLeadsGlobalAction } from "@/app/pulse/(app)/leads/actions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cssColor } from "@/lib/pulse/colores";
import type { ResultadoBusqueda } from "@/lib/pulse/repo";
import type { ColorPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

const telCorto = (t: string | null) => {
  const d = (t ?? "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : null;
};

type Opcion = { id: string; titulo: string; detalle?: string; icono: React.ReactNode; href: string };

export const abrirBuscador = () => window.dispatchEvent(new Event("pulse:buscar"));

// ⌘K / Ctrl+K: buscar clientes en todos los tableros visibles e ir a cualquier parte de Pulse.
export function BuscadorGlobal({ boards, puedeConfigurar }: { boards: { slug: string; nombre: string; color: ColorPulse | null }[]; puedeConfigurar: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [leads, setLeads] = useState<Awaited<ReturnType<typeof buscarLeadsGlobalAction>>>([]);
  const [cargando, setCargando] = useState(false);
  const [activo, setActivo] = useState(0);
  const pedido = useRef(0);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const abrir = () => setOpen(true);
    window.addEventListener("keydown", k);
    window.addEventListener("pulse:buscar", abrir);
    return () => {
      window.removeEventListener("keydown", k);
      window.removeEventListener("pulse:buscar", abrir);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResultados([]);
    }
  }, [open]);

  useEffect(() => {
    const texto = q.trim();
    if (texto.length < 2) {
      setResultados([]);
      setLeads([]);
      return;
    }
    const n = ++pedido.current;
    setCargando(true);
    const t = setTimeout(async () => {
      const [r, l] = await Promise.all([buscarGlobalAction({ q: texto }), buscarLeadsGlobalAction(texto).catch(() => [])]);
      if (n !== pedido.current) return;
      setCargando(false);
      setResultados(r.ok ? r.resultados : []);
      setLeads(l);
      setActivo(0);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const opciones: Opcion[] = useMemo(() => {
    const bajo = q.trim().toLowerCase();
    const nav: Opcion[] = [
      { id: "mi-dia", titulo: "Mi día", detalle: "Lo que te toca hoy", icono: <Sun className="size-4" />, href: "/pulse/mi-dia" },
      { id: "preguntar", titulo: "Preguntarle al CRM", detalle: "Pregunta en español y te responde con la lista", icono: <Sparkles className="size-4" />, href: "/pulse/preguntar" + (bajo.length > 3 ? `?q=${encodeURIComponent(q.trim())}` : "") },
      { id: "tableros", titulo: "Inicio", icono: <LayoutGrid className="size-4" />, href: "/pulse" },
      ...(puedeConfigurar ? [{ id: "config", titulo: "Usuarios y configuración", icono: <Settings className="size-4" />, href: "/pulse/configuracion" }] : []),
      ...boards.map((b) => ({ id: `b-${b.slug}`, titulo: b.nombre, detalle: "Tablero", icono: <Table2 className="size-4" style={{ color: cssColor(b.color) }} />, href: `/pulse/${b.slug}` })),
    ].filter((o) => !bajo || o.titulo.toLowerCase().includes(bajo) || o.id === "preguntar");
    const items: Opcion[] = resultados.map((r) => ({
      id: r.itemId,
      titulo: r.nombre,
      detalle: [r.detalle, `${r.boardNombre} · ${r.grupo}`].filter(Boolean).join(" — "),
      icono: <span className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">{r.nombre.slice(0, 1).toUpperCase()}</span>,
      href: `/pulse/${r.boardSlug}?item=${r.itemId}`,
    }));
    const deLeads: Opcion[] = leads.map((l) => ({
      id: `lead-${l.id}`,
      titulo: l.nombre,
      detalle: [telCorto(l.telefono), `Lead · ${l.marca} · ${l.embudo}${l.etapa ? ` → ${l.etapa}` : ""}${l.estado !== "abierto" ? ` (${l.estado})` : ""}`].filter(Boolean).join(" — "),
      icono: <Kanban className="size-4 text-[#08a742]" />,
      href: `/pulse/leads/${l.slug}/${l.id}`,
    }));
    return bajo.length >= 2 ? [...items, ...deLeads, ...nav] : nav;
  }, [q, resultados, leads, boards, puedeConfigurar]);

  const ir = (o: Opcion | undefined) => {
    if (!o) return;
    setOpen(false);
    router.push(o.href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="pulse top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Buscar en Pulse</DialogTitle>
        <div className="flex items-center gap-2 border-b px-4">
          {cargando ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Search className="size-4 text-muted-foreground" />}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActivo((a) => Math.min(a + 1, opciones.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActivo((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                ir(opciones[activo]);
              }
            }}
            placeholder="Busca un cliente o lead: nombre, empresa, teléfono, e-mail…"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-1.5">
          {q.trim().length >= 2 && !cargando && resultados.length === 0 && leads.length === 0 ? <li className="px-3 py-2 text-xs text-muted-foreground">Ningún cliente ni lead coincide con «{q.trim()}».</li> : null}
          {opciones.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseEnter={() => setActivo(i)}
                onClick={() => ir(o)}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === activo && "bg-muted")}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">{o.icono}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.titulo}</span>
                  {o.detalle ? <span className="block truncate text-xs text-muted-foreground">{o.detalle}</span> : null}
                </span>
                {i === activo ? <CornerDownLeft className="size-3.5 text-muted-foreground" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
