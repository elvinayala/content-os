"use client";

import { Coffee, FileCheck2, Tv, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

// Oficina virtual del equipo digital (28/sep, Elvin): cada agente en su cubículo con su computadora (lo que está haciendo),
// una sala con TV (los números del día) y un cuarto de ping pong donde se van los que no tienen trabajo. Tocar un
// cubículo abre su reporte. Todo sale de los datos reales de Ritmo (reportes + buzón); nada inventado.

export type AgenteOficina = {
  id: string;
  nombre: string;
  rol: string;
  color: string; // acento del agente
  foto: string | null;
  estado: "trabajando" | "en-escritorio" | "descansando";
  pantalla: string | null;
  dijo: { para: string; texto: string; hace: string } | null;
  tareas: number | null;
  corridas: number;
  minutos: number;
  costo: number | null;
  resumen: string | null;
  entregables: string[];
  bloqueos: string | null;
};

const ESTADO = {
  trabajando: { t: "Trabajando", c: "text-primary", punto: "bg-primary shadow-[0_0_10px_var(--neon)] animate-pulse" },
  "en-escritorio": { t: "Trabajó hoy", c: "text-sky-300", punto: "bg-sky-400" },
  descansando: { t: "Descansando", c: "text-muted-foreground", punto: "bg-white/25" },
} as const;

function Avatar({ a, size = 40, className }: { a: AgenteOficina; size?: number; className?: string }) {
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-background ring-2 ring-background", className)} style={{ width: size, height: size, background: a.color, fontSize: size * 0.42 }}>
      {a.foto ? <Image src={a.foto} alt={a.nombre} width={size} height={size} className="size-full object-cover" /> : a.nombre[0]}
    </span>
  );
}

function Cubiculo({ a, onAbrir }: { a: AgenteOficina; onAbrir: () => void }) {
  const aqui = a.estado !== "descansando";
  const e = ESTADO[a.estado];
  return (
    <button type="button" onClick={onAbrir} className="group relative flex min-h-56 flex-col rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-transparent p-3 text-left transition hover:border-primary/40 hover:bg-white/[0.04]">
      {/* mampara del cubículo */}
      <span className="absolute inset-x-3 top-0 h-1 rounded-b-full" style={{ background: a.color, opacity: 0.55 }} />
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", e.punto)} />
        <span className="text-sm font-semibold">{a.nombre}</span>
        <span className={cn("ml-auto font-mono text-[10px] tracking-wider uppercase", e.c)}>{e.t}</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{a.rol}</p>

      {/* escritorio + computadora */}
      <div className="relative mt-3 flex flex-1 flex-col items-center justify-end">
        {a.dijo && aqui ? (
          <span className="absolute -top-1 right-0 z-10 max-w-[85%] rounded-xl rounded-br-sm bg-white/[0.92] px-2.5 py-1.5 text-[11px] leading-snug text-[#0b1220] shadow-lg">
            <b className="font-semibold">a {a.dijo.para}:</b> {a.dijo.texto}
          </span>
        ) : null}
        <div className={cn("relative mt-8 w-[78%] rounded-lg border-2 p-1.5 transition", a.estado === "trabajando" ? "border-primary/60 shadow-[0_0_24px_-4px_var(--neon)]" : "border-white/15")}>
          <div className={cn("h-16 overflow-hidden rounded-[5px] p-1.5 font-mono text-[9.5px] leading-tight", aqui ? "bg-[#06121a] text-primary/90" : "bg-[#0a0d14] text-white/20")}>
            {a.estado === "trabajando" ? (
              <div className="oficina-codigo">
                <p>&gt; {a.pantalla ?? "trabajando…"}</p>
                <p className="opacity-60">  ✓ corrida {a.corridas}</p>
                <p className="opacity-40">  … {Math.round(a.minutos)} min hoy</p>
                <p>&gt; {a.pantalla ?? "trabajando…"}</p>
              </div>
            ) : a.pantalla ? (
              <p>{a.pantalla}</p>
            ) : (
              <p className="grid h-full place-items-center">{aqui ? "—" : "💤 en pausa"}</p>
            )}
          </div>
          <span className="absolute -bottom-2 left-1/2 h-2 w-6 -translate-x-1/2 rounded-b bg-white/15" />
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full bg-gradient-to-r from-[#3a2a1e] via-[#4a3526] to-[#3a2a1e] opacity-80" />
        {/* la silla: el agente sentado, o vacía si anda en la sala */}
        <div className="-mt-1 flex h-12 items-end justify-center">
          {aqui ? <Avatar a={a} size={40} className={a.estado === "trabajando" ? "oficina-escribe" : ""} /> : <span className="h-9 w-10 rounded-t-2xl border border-white/10 bg-white/[0.04]" />}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1 border-t border-white/[0.06] pt-2 text-center font-mono text-[10px] text-muted-foreground">
        <span>
          <b className="block text-sm text-foreground">{a.tareas ?? "—"}</b>tareas
        </span>
        <span>
          <b className="block text-sm text-foreground">{a.corridas}</b>corridas
        </span>
        <span>
          <b className="block text-sm text-foreground">{a.costo === null ? "—" : `$${a.costo.toFixed(2)}`}</b>costo
        </span>
      </div>
    </button>
  );
}

export function Oficina({ agentes, kpis }: { agentes: AgenteOficina[]; kpis: { tareas: number; minutos: number; costo: number; activos: number } }) {
  const [abierto, setAbierto] = useState<AgenteOficina | null>(null);
  // El panel solo se abre con un toque (en el navegador): ahí `document` ya existe para el portal.
  const libres = agentes.filter((a) => a.estado === "descansando");
  const ping = libres.slice(0, 2);
  const sala = libres.slice(2);

  return (
    <section className="lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2 lg:px-6">
      <style>{`
        @keyframes oficina-sube { from { transform: translateY(0) } to { transform: translateY(-50%) } }
        .oficina-codigo { animation: oficina-sube 6s linear infinite }
        @keyframes oficina-teclea { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2px) } }
        .oficina-escribe { animation: oficina-teclea .5s ease-in-out infinite }
        @keyframes oficina-bola { 0% { left: 12%; top: 55% } 25% { top: 20% } 50% { left: 84%; top: 50% } 75% { top: 22% } 100% { left: 12%; top: 55% } }
        .oficina-bola { animation: oficina-bola 1.6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .oficina-codigo, .oficina-escribe, .oficina-bola { animation: none } }
      `}</style>
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[28px] border border-white/10 bg-[#070b12] shadow-2xl">
        {/* letrero del edificio */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] bg-gradient-to-r from-primary/[0.08] via-transparent to-[color:var(--coral)]/[0.06] px-5 py-3">
          <span className="font-mono text-[11px] tracking-[0.3em] text-primary uppercase">EA Market · Piso digital</span>
          <span className="text-xs text-muted-foreground">
            {kpis.activos} de {agentes.length} trabajaron hoy · toca un cubículo para ver su reporte
          </span>
          <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />trabajando</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-sky-400" />trabajó hoy</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-white/25" />descansando</span>
          </span>
        </div>

        <div className="grid gap-4 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:28px_28px] p-4 lg:grid-cols-[1fr_340px]">
          {/* open space: los cubículos */}
          <div className="rounded-3xl border border-white/[0.06] bg-[#0b111b]/80 p-4">
            <p className="mb-3 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Open space</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {agentes.map((a) => (
                <Cubiculo key={a.id} a={a} onAbrir={() => setAbierto(a)} />
              ))}
              {/* rincón del café */}
              <div className="hidden flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] p-4 text-center xl:flex">
                <Coffee className="size-7 text-[color:var(--coral)]" />
                <p className="text-xs text-muted-foreground">Rincón del café</p>
                <span className="text-2xl">🪴</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* sala con TV */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#0d1320]/80 p-4">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                <Tv className="size-3.5" /> Sala
              </p>
              <div className="rounded-xl border-4 border-[#1c2433] bg-gradient-to-br from-[#0b1a24] to-[#10131d] p-3 shadow-[0_0_30px_-10px_var(--neon)]">
                <p className="font-mono text-[10px] tracking-widest text-primary uppercase">● En vivo · hoy</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="num text-2xl font-semibold">{kpis.tareas}</p>
                    <p className="text-[10px] text-muted-foreground">tareas</p>
                  </div>
                  <div>
                    <p className="num text-2xl font-semibold">{Math.round(kpis.minutos)}</p>
                    <p className="text-[10px] text-muted-foreground">min activos</p>
                  </div>
                  <div>
                    <p className="num text-2xl font-semibold">${kpis.costo.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">costo IA</p>
                  </div>
                </div>
              </div>
              {/* el sofá, con quien esté descansando */}
              <div className="relative mx-auto mt-5 h-16 w-[88%] rounded-t-3xl rounded-b-xl bg-gradient-to-b from-[#2a3348] to-[#1b2232]">
                <span className="absolute -left-2 bottom-0 h-12 w-4 rounded-full bg-[#232b3e]" />
                <span className="absolute -right-2 bottom-0 h-12 w-4 rounded-full bg-[#232b3e]" />
                <div className="absolute inset-x-0 -top-5 flex justify-center gap-1">
                  {sala.map((a) => (
                    <button key={a.id} type="button" title={`${a.nombre} · descansando`} onClick={() => setAbierto(a)}>
                      <Avatar a={a} size={34} />
                    </button>
                  ))}
                </div>
                <p className="absolute inset-x-0 bottom-1.5 text-center text-[10px] text-white/30">{sala.length ? "" : "sofá libre"}</p>
              </div>
              <div className="mt-3 flex justify-between text-xl">
                <span>🪴</span>
                <span>🎧</span>
                <span>🪴</span>
              </div>
            </div>

            {/* ping pong */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#0c1219]/80 p-4">
              <p className="mb-3 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">🏓 Ping pong</p>
              <div className="flex items-center gap-2">
                {ping[0] ? (
                  <button type="button" onClick={() => setAbierto(ping[0])} title={`${ping[0].nombre} · jugando`}>
                    <Avatar a={ping[0]} size={34} />
                  </button>
                ) : (
                  <span className="size-[34px]" />
                )}
                <div className="relative h-20 flex-1 rounded-lg border-2 border-white/40 bg-[#10456b]">
                  <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
                  <span className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
                  {ping.length === 2 ? <span className="oficina-bola absolute size-2 rounded-full bg-white shadow" /> : null}
                </div>
                {ping[1] ? (
                  <button type="button" onClick={() => setAbierto(ping[1])} title={`${ping[1].nombre} · jugando`}>
                    <Avatar a={ping[1]} size={34} />
                  </button>
                ) : (
                  <span className="size-[34px]" />
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                {ping.length === 2 ? `${ping[0].nombre} vs ${ping[1].nombre}` : ping.length === 1 ? `${ping[0].nombre} espera rival` : "Todos están trabajando 💪"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* reporte del agente */}
      {abierto ? createPortal(
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setAbierto(null)}>
          <aside className="ritmo flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto border-l border-white/10 bg-[#0a0f18] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar a={abierto} size={48} />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{abierto.nombre}</p>
                <p className="text-xs text-muted-foreground">{abierto.rol}</p>
              </div>
              <button type="button" onClick={() => setAbierto(null)} className="rounded-full p-2 text-muted-foreground hover:bg-white/5" aria-label="Cerrar">
                <X className="size-5" />
              </button>
            </div>
            <p className={cn("font-mono text-[11px] tracking-widest uppercase", ESTADO[abierto.estado].c)}>● {ESTADO[abierto.estado].t}</p>
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-[10px] text-muted-foreground">
              {[
                ["tareas", abierto.tareas ?? "—"],
                ["corridas", abierto.corridas],
                ["min", Math.round(abierto.minutos)],
                ["costo", abierto.costo === null ? "—" : `$${abierto.costo.toFixed(2)}`],
              ].map(([t, v]) => (
                <div key={t} className="rounded-lg bg-white/[0.03] py-2 ring-1 ring-white/[0.06]">
                  <b className="block text-base text-foreground">{v}</b>
                  {t}
                </div>
              ))}
            </div>
            {abierto.dijo ? (
              <div className="rounded-xl bg-white/[0.04] p-3 text-sm ring-1 ring-white/[0.06]">
                <p className="mb-1 text-[11px] text-muted-foreground">
                  Lo último que dijo · a {abierto.dijo.para} · {abierto.dijo.hace}
                </p>
                {abierto.dijo.texto}
              </div>
            ) : null}
            <div>
              <p className="mb-1 text-xs font-semibold">Reporte de hoy</p>
              <p className="text-sm whitespace-pre-line text-foreground/85">{abierto.resumen ?? "Todavía no hay reporte de hoy (llega al cierre, 6:30 PM)."}</p>
            </div>
            {abierto.entregables.length ? (
              <ul className="flex flex-col gap-1.5 text-sm">
                {abierto.entregables.map((x) => (
                  <li key={x} className="flex gap-2">
                    <FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">{x}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {abierto.bloqueos ? <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200 ring-1 ring-amber-500/30">⚠️ {abierto.bloqueos}</p> : null}
          </aside>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
