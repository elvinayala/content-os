"use client";

import { ArrowUp, ChevronRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { preguntarAction } from "@/app/pulse/(app)/preguntar/actions";
import { Button } from "@/components/ui/button";
import type { RespuestaCRM } from "@/lib/pulse/preguntar-ia";

const EJEMPLOS = [
  "¿Qué clientes de solar se fueron por presupuesto?",
  "¿Cuántos clientes activos hay por industria?",
  "Clientes activos con presupuesto mensual de más de $2,000",
  "¿Quiénes entraron este mes?",
];

interface Turno {
  pregunta: string;
  r?: RespuestaCRM;
  error?: string;
}

// El modelo a veces marca negritas con ** — acá se muestra texto limpio.
const limpio = (t: string) => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");

export function Preguntar({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState("");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [cargando, setCargando] = useState(false);
  const lanzado = useRef(false);

  const preguntar = async (q: string) => {
    const pregunta = q.trim();
    if (pregunta.length < 3 || cargando) return;
    setTexto("");
    setCargando(true);
    setTurnos((t) => [{ pregunta }, ...t]);
    const r = await preguntarAction({ pregunta });
    setCargando(false);
    setTurnos((t) => [{ pregunta, ...(r.ok ? { r: { respuesta: r.respuesta, items: r.items } } : { error: r.error }) }, ...t.slice(1)]);
  };

  // Viene del buscador ⌘K con la pregunta ya escrita.
  useEffect(() => {
    if (inicial && !lanzado.current) {
      lanzado.current = true;
      void preguntar(inicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" /> Preguntarle al CRM
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Pregunta como se lo preguntarías a alguien del equipo. Solo busca en los tableros que tú puedes ver.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void preguntar(texto);
        }}
        className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40"
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void preguntar(texto);
            }
          }}
          rows={2}
          maxLength={500}
          placeholder="¿Qué clientes de solar se fueron por presupuesto?"
          className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <Button type="submit" size="icon" disabled={cargando || texto.trim().length < 3} aria-label="Preguntar">
          {cargando ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </Button>
      </form>

      {!turnos.length && (
        <div className="flex flex-wrap gap-2">
          {EJEMPLOS.map((e) => (
            <button key={e} type="button" onClick={() => void preguntar(e)} className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {turnos.map((t, i) => (
          <section key={turnos.length - i} className="rounded-xl border bg-card shadow-sm">
            <p className="border-b px-4 py-3 text-sm font-medium">{t.pregunta}</p>
            <div className="px-4 py-3">
              {!t.r && !t.error && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Buscando en el CRM… puede tardar unos segundos
                </p>
              )}
              {t.error && <p className="text-sm text-destructive">{t.error}</p>}
              {t.r && (
                <>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{limpio(t.r.respuesta)}</p>
                  {t.r.items.length > 0 && (
                    <ul className="-mx-2 mt-3 divide-y">
                      {t.r.items.map((it) => (
                        <li key={it.id}>
                          <Link href={`/pulse/${it.slug}?item=${it.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{it.nombre}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {it.nota ? `${it.nota} · ` : ""}
                                {it.grupo}
                              </span>
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
