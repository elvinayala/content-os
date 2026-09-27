"use client";

import { Loader2, Send, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { borrarMensajeComunidadAction, comunidadVisibleAction, mensajeComunidadAction, reaccionComunidadAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVIDADES, MAX_MENSAJE, META_SEMANAL_MIN, REACCIONES } from "@/lib/desempeno/bienestar-reglas";
import type { ItemComunidad } from "@/lib/desempeno/bienestar";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };

function haceCuanto(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

/** Unirse o salir: nadie aparece en la comunidad sin decir que sí. */
export function UnirseComunidad({ visible, miembros = 0 }: { visible: boolean; miembros?: number }) {
  const [cargando, setCargando] = useState(false);
  const cambiar = async (v: boolean) => {
    setCargando(true);
    const r = await comunidadVisibleAction(v);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(v ? "¡Bienvenido a la comunidad! 💪" : "Saliste de la comunidad", aviso);
  };
  if (visible)
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--neon)]" /> Estás en la comunidad: los demás ven tu nombre, tus minutos y tus actividades (nunca tu energía).
        <button type="button" onClick={() => cambiar(false)} disabled={cargando} className="ml-auto shrink-0 underline-offset-4 hover:text-foreground hover:underline">
          Salir
        </button>
      </p>
    );
  return (
    <div className="panel hud-esquinas flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
        <Users className="size-5" />
      </div>
      <div className="flex-1">
        <p className="font-semibold">Entrena en grupo{miembros ? <span className="ml-2 text-xs font-normal text-primary">{miembros} {miembros === 1 ? "persona ya está" : "personas ya están"}</span> : null}</p>
        <p className="text-sm text-muted-foreground">Únete a la comunidad para ver quién se está moviendo, animarse entre todos y aparecer en el tablero de la semana. Es opcional: puedes salir cuando quieras y tu energía del día nunca se comparte.</p>
      </div>
      <Button className="h-10 rounded-full" onClick={() => cambiar(true)} disabled={cargando}>
        {cargando ? <Loader2 className="animate-spin" /> : null} Unirme
      </Button>
    </div>
  );
}

type FilaTablero = { id: string; nombre: string; minutos: number; pausas: number; activoHoy: boolean; meta: boolean };

export function TableroComunidad({ filas, yo }: { filas: FilaTablero[]; yo: string }) {
  const max = Math.max(META_SEMANAL_MIN, ...filas.map((f) => f.minutos));
  const medalla = ["🥇", "🥈", "🥉"];
  return (
    <div className="panel divide-y divide-border/50 overflow-hidden">
      {filas.map((f, i) => (
        <div key={f.id} className={cn("flex items-center gap-3 px-4 py-2.5", f.id === yo && "bg-primary/[0.04]")}>
          <span className="w-6 text-center text-sm">{f.minutos ? (medalla[i] ?? <span className="num font-mono text-xs text-muted-foreground">{i + 1}</span>) : <span className="font-mono text-xs text-muted-foreground">·</span>}</span>
          <span className="relative flex size-2 shrink-0">{f.activoHoy ? <span className="size-2 rounded-full bg-primary shadow-[0_0_6px_var(--neon)]" title="Se movió hoy" /> : <span className="size-2 rounded-full bg-white/10" />}</span>
          <span className="w-28 truncate text-sm font-medium sm:w-36">
            {f.nombre}
            {f.id === yo ? <span className="text-muted-foreground"> (tú)</span> : null}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)]" style={{ width: `${(f.minutos / max) * 100}%` }} />
          </div>
          <span className="num w-16 text-right font-mono text-xs">
            {f.minutos} min{f.meta ? " ✓" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MuroComunidad({ items, yo, maestro, puedeEscribir }: { items: ItemComunidad[]; yo: string; maestro: boolean; puedeEscribir: boolean }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const publicar = async () => {
    setEnviando(true);
    const r = await mensajeComunidadAction(texto);
    setEnviando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setTexto("");
  };
  const reaccionar = async (postId: string, emoji: string) => {
    const r = await reaccionComunidadAction({ postId, emoji });
    if (!r.ok) toast.error(r.error, aviso);
  };
  const borrar = async (id: string) => {
    if (!confirm("¿Borrar este mensaje?")) return;
    const r = await borrarMensajeComunidadAction(id);
    if (!r.ok) toast.error(r.error, aviso);
  };
  const act = (id: string | null) => ACTIVIDADES.find((a) => a.id === id);
  return (
    <div className="flex flex-col gap-3">
      {puedeEscribir ? (
        <div className="panel flex flex-col gap-2 p-3">
          <Textarea rows={2} value={texto} maxLength={MAX_MENSAJE} onChange={(e) => setTexto(e.target.value)} placeholder="¿Cómo va tu rutina? Hoy le di… 🔥" className="resize-none border-0 bg-transparent focus-visible:ring-0" />
          <div className="flex items-center justify-between">
            <span className="num font-mono text-[11px] text-muted-foreground">{texto.length}/{MAX_MENSAJE}</span>
            <Button size="sm" className="rounded-full" onClick={publicar} disabled={enviando || texto.trim().length < 2}>
              {enviando ? <Loader2 className="animate-spin" /> : <Send className="size-3.5" />} Publicar
            </Button>
          </div>
        </div>
      ) : null}
      {items.length ? (
        <div className="panel divide-y divide-border/50 overflow-hidden">
          {items.map((it) =>
            it.tipo === "mensaje" ? (
              <div key={`m-${it.id}`} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">{it.autor}</span>
                  <span className="text-muted-foreground" suppressHydrationWarning>{haceCuanto(it.at)}</span>
                  {it.autorId === yo || maestro ? (
                    <button type="button" onClick={() => borrar(it.id)} title="Borrar" className="ml-auto rounded-full p-1 text-muted-foreground hover:text-red-300">
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="text-sm whitespace-pre-line">{it.texto}</p>
                <div className="flex gap-1.5">
                  {REACCIONES.map((e) => (
                    <button key={e} type="button" disabled={!puedeEscribir} onClick={() => reaccionar(it.id, e)} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 transition disabled:opacity-60", it.mia === e ? "bg-primary/10 ring-primary/40" : "ring-border hover:bg-white/[0.04]")}>
                      {e} {it.reacciones[e] ? <span className="num font-mono">{it.reacciones[e]}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p key={`a-${it.id}`} className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
                <span className="text-base" aria-hidden>{it.clase === "pausa" ? "🧘" : (act(it.actividad)?.emoji ?? "✨")}</span>
                <span>
                  <b className="font-medium text-foreground">{it.autor}</b> {it.clase === "pausa" ? "hizo la pausa activa" : `se movió ${it.minutos} min${act(it.actividad) ? ` · ${act(it.actividad)!.nombre.toLowerCase()}` : ""}`}
                </span>
                <span className="ml-auto shrink-0" suppressHydrationWarning>{haceCuanto(it.at)}</span>
              </p>
            ),
          )}
        </div>
      ) : (
        <div className="panel p-6 text-center text-sm text-muted-foreground">Todavía no hay movimiento esta semana. ¡Sé el primero en romper el hielo! 💪</div>
      )}
    </div>
  );
}
