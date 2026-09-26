"use client";

import { ArrowLeft, ChevronDown, Download, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { borrarRespuestaAction } from "@/app/pulse/(app)/formularios/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface RespuestaFila {
  id: string;
  fecha: string;
  origen: string | null;
  resultado: string | null;
  pares: { pregunta: string; respuesta: string }[];
}

const fecha = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function Resultado({ r }: { r: string | null }) {
  if (!r) return null;
  if (r.startsWith("error")) return <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 uppercase" title={r}>No creó la ficha</span>;
  if (r.startsWith("ficha-")) return <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase" title={r}>{r.startsWith("ficha-creado") ? "Ficha nueva en Pulse" : "Ficha actualizada"}</span>;
  return null;
}

export function RespuestasFormulario({ formulario, respuestas }: { formulario: { id: string; titulo: string; link: string; esAdmin: boolean }; respuestas: RespuestaFila[] }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<string | null>(respuestas[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [pend, start] = useTransition();
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? respuestas.filter((r) => r.pares.some((p) => p.respuesta.toLowerCase().includes(t))) : respuestas;
  }, [q, respuestas]);

  const borrar = (id: string) =>
    start(async () => {
      if (!confirm("¿Borrar esta respuesta? No se puede deshacer.")) return;
      const r = await borrarRespuestaAction(formulario.id, id);
      if (!r.ok) return void toast.error(r.error);
      toast("Respuesta borrada");
      router.refresh();
    });

  return (
    <div className="pulse fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4">
        <Button asChild variant="ghost" size="icon" aria-label="Volver">
          <Link href={`/pulse/formularios/${formulario.id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{formulario.titulo}</div>
          <div className="text-xs text-muted-foreground">{respuestas.length} respuestas</div>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href={formulario.link} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> <span className="hidden sm:inline">Abrir</span>
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/pulse/formularios/${formulario.id}/csv`}>
            <Download className="size-4" /> Excel (CSV)
          </a>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-6">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en las respuestas (nombre, e-mail, negocio…)" className="bg-card" />
        {lista.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">{respuestas.length ? "Nada coincide con la búsqueda." : "Todavía no hay respuestas. Comparte el link y aparecen aquí."}</p> : null}
        {lista.map((r) => {
          const on = abierta === r.id;
          const resumen = r.pares.slice(0, 3).map((p) => p.respuesta).join(" · ");
          return (
            <div key={r.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
              <button type="button" onClick={() => setAbierta(on ? null : r.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">{fecha(r.fecha)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{resumen || "(vacía)"}</span>
                <Resultado r={r.resultado} />
                <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition ${on ? "rotate-180" : ""}`} />
              </button>
              {on ? (
                <div className="border-t px-4 py-4">
                  <dl className="grid gap-3">
                    {r.pares.map((p, i) => (
                      <div key={i} className="grid gap-0.5 sm:grid-cols-[220px_1fr] sm:gap-4">
                        <dt className="text-xs font-medium text-muted-foreground">{p.pregunta}</dt>
                        <dd className="text-sm whitespace-pre-line">{p.respuesta}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    {r.origen ? <span>Origen: {r.origen}</span> : null}
                    {r.resultado ? <span className="truncate">Resultado: {r.resultado}</span> : null}
                    <span className="flex-1" />
                    {formulario.esAdmin ? (
                      <Button variant="ghost" size="sm" disabled={pend} onClick={() => borrar(r.id)}>
                        <Trash2 className="size-4 text-red-600" /> Borrar
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </main>
    </div>
  );
}
