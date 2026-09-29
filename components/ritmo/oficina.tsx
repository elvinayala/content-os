"use client";

import { Coffee, FileCheck2, Loader2, Send, Tv, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cafeAction } from "@/app/ritmo/oficina-actions";
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


// ─── Ala ejecutiva (28/sep, Elvin): la dirección supervisa a los agentes. Elvin aprueba; Carilin y Aure piden. ──────────

export type Ejecutivos = {
  ceo: { presente: boolean; porAprobar: number };
  carilin: { presente: boolean; pedidos: number };
  aure: { presente: boolean; pedidos: number };
};

/** La silueta de quien está en su oficina, con aura por rango (CEO la más grande). */
function Silueta({ color, aura, size = 56, nombre }: { color: string; aura: number; size?: number; nombre: string }) {
  return (
    <span className="relative grid place-items-center" title={`${nombre} · aquí`} style={{ width: size, height: size }}>
      <span className="absolute inset-0 animate-pulse rounded-full" style={{ boxShadow: `0 0 ${aura}px ${aura / 3}px ${color}55` }} />
      <svg viewBox="0 0 48 48" width={size} height={size} className="relative">
        <circle cx="24" cy="15" r="9" fill={color} />
        <path d="M6 46c0-11 8-18 18-18s18 7 18 18z" fill={color} />
      </svg>
    </span>
  );
}

/** Silla vacía (su dueño no está viendo la oficina ahora). */
function Silla({ ancho = 48, color = "#2a3348" }: { ancho?: number; color?: string }) {
  return (
    <span className="relative block" style={{ width: ancho, height: ancho }} title="Silla vacía">
      <span className="absolute inset-x-[12%] top-0 h-[62%] rounded-t-[40%] rounded-b-md" style={{ background: color }} />
      <span className="absolute inset-x-0 bottom-[14%] h-[24%] rounded-lg" style={{ background: color, filter: "brightness(1.25)" }} />
      <span className="absolute bottom-0 left-1/2 h-[16%] w-[8%] -translate-x-1/2 bg-white/20" />
    </span>
  );
}

function Planta({ className }: { className?: string }) {
  return <span className={cn("select-none text-2xl", className)}>🪴</span>;
}

function OficinaCEO({ e, trabajando }: { e: Ejecutivos["ceo"]; trabajando: number }) {
  const oro = "#f5ce1a";
  return (
    <div className="relative overflow-hidden rounded-3xl border p-5" style={{ borderColor: `${oro}55`, background: "linear-gradient(160deg, #15130b 0%, #0c0f16 55%, #0b0e14 100%)", boxShadow: `0 0 60px -12px ${oro}66, inset 0 0 0 1px ${oro}22` }}>
      <div className="flex items-center gap-3">
        <span className="rounded-md border px-2 py-0.5 font-mono text-xs font-bold tracking-[0.4em]" style={{ borderColor: `${oro}88`, color: oro }}>CEO</span>
        <span className="text-sm font-semibold">Elvin Ayala</span>
        <span className="text-[11px] text-muted-foreground">Aprueba lo que piden Carilin y Aure</span>
        <span className="ml-auto font-mono text-[10px] tracking-widest uppercase" style={{ color: e.presente ? oro : undefined }}>{e.presente ? "● En la oficina" : "Fuera"}</span>
      </div>
      <div className="mt-4 grid gap-5 md:grid-cols-[1.1fr_1.6fr_1fr]">
        {/* pizarra */}
        <div className="flex flex-col rounded-xl border-4 border-[#2b2f38] bg-[#eef1f4] p-3 text-[#1b2230] shadow-inner">
          <p className="font-mono text-[10px] font-bold tracking-widest text-[#4b5563] uppercase">Pizarra</p>
          <p className="mt-1 text-sm font-semibold" style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui" }}>Plan de guerra Q4</p>
          <ul className="mt-1 space-y-0.5 text-[12px]" style={{ fontFamily: "ui-rounded, 'Comic Sans MS', system-ui" }}>
            <li>☐ Por aprobar: <b className="text-[#c2410c]">{e.porAprobar}</b></li>
            <li>☐ Equipo digital: <b>{trabajando}</b> trabajando</li>
            <li>☐ Meta LU: $150K / mes</li>
          </ul>
        </div>
        {/* escritorio con el monitor grande */}
        <div className="flex flex-col items-center justify-end">
          <div className="w-full max-w-md rounded-xl border-[3px] p-1.5" style={{ borderColor: "#2b3140", boxShadow: e.presente ? `0 0 34px -6px ${oro}88` : undefined }}>
            <div className="grid h-28 grid-cols-3 gap-1.5 rounded-lg bg-gradient-to-br from-[#0e1726] to-[#101520] p-2 font-mono text-[10px]">
              <div className="col-span-2 rounded bg-white/[0.04] p-1.5">
                <p style={{ color: oro }}>APROBACIONES</p>
                <p className="num mt-1 text-3xl font-semibold text-foreground">{e.porAprobar}</p>
                <p className="text-muted-foreground">esperando tu OK</p>
              </div>
              <div className="rounded bg-white/[0.04] p-1.5">
                <p className="text-primary">EQUIPO</p>
                <p className="num mt-1 text-2xl font-semibold text-foreground">{trabajando}</p>
                <p className="text-muted-foreground">trabajando</p>
              </div>
            </div>
          </div>
          <span className="h-3 w-10 bg-[#2b3140]" />
          <div className="relative flex h-5 w-full max-w-lg items-center justify-end rounded-full bg-gradient-to-r from-[#3b2c1f] via-[#5a4230] to-[#3b2c1f] px-6">
            <span className="h-2.5 w-12 -translate-y-2 rounded-sm bg-[#1c2230] ring-1 ring-white/10" title="Su computadora" />
          </div>
          <div className="-mt-1 flex h-16 items-end">{e.presente ? <Silueta color={oro} aura={60} size={60} nombre="Elvin" /> : <Silla ancho={54} color="#3a3120" />}</div>
        </div>
        {/* rincón con sofá */}
        <div className="flex flex-col items-center justify-end gap-2">
          <div className="flex w-full items-end justify-between">
            <Planta className="text-3xl" />
            <span className="text-xl">☕</span>
          </div>
          <div className="relative h-14 w-full rounded-t-3xl rounded-b-xl bg-gradient-to-b from-[#3a3326] to-[#27231b]">
            <span className="absolute -left-1.5 bottom-0 h-10 w-3 rounded-full bg-[#322c20]" />
            <span className="absolute -right-1.5 bottom-0 h-10 w-3 rounded-full bg-[#322c20]" />
          </div>
          <span className="h-2 w-2/3 rounded-full bg-white/10" title="Mesa de centro" />
        </div>
      </div>
    </div>
  );
}

function OficinaPequena({ titulo, nombre, rol, color, aura, presente, pedidos, grande = false }: { titulo: string; nombre: string; rol: string; color: string; aura: number; presente: boolean; pedidos: number; grande?: boolean }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border p-4" style={{ borderColor: `${color}55`, background: `linear-gradient(160deg, ${color}14 0%, #0c1018 60%)`, boxShadow: `0 0 ${aura}px -10px ${color}88` }}>
      <div className="flex items-center gap-2">
        <span className="rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.25em] uppercase" style={{ borderColor: `${color}88`, color }}>{titulo}</span>
        <span className="ml-auto font-mono text-[10px] tracking-widest uppercase" style={{ color: presente ? color : undefined }}>{presente ? "● Aquí" : "Fuera"}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold">{nombre}</p>
      <p className="text-[11px] text-muted-foreground">{rol}</p>
      <div className="mt-3 flex flex-1 flex-col items-center justify-end">
        <div className={cn("rounded-lg border-2 border-[#2b3140] p-1", grande ? "w-[85%]" : "w-[72%]")}>
          <div className={cn("rounded bg-[#0e1522] p-1.5 font-mono text-[10px]", grande ? "h-16" : "h-12")}>
            <p style={{ color }}>PEDIDOS A LOS AGENTES</p>
            <p className="num text-lg font-semibold text-foreground">{pedidos} <span className="text-[10px] font-normal text-muted-foreground">en 24 h</span></p>
          </div>
        </div>
        <span className="h-2 w-6 bg-[#2b3140]" />
        <div className="h-3 w-full rounded-full" style={{ background: `linear-gradient(90deg, #2c3342, ${color}33, #2c3342)` }} />
        <div className="-mt-1 flex h-14 w-full items-end justify-between px-1">
          <Planta />
          {presente ? <Silueta color={color} aura={aura} size={grande ? 50 : 44} nombre={nombre} /> : <Silla ancho={grande ? 46 : 40} />}
          <span className="text-lg">{grande ? "🗂️" : "🌸"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Ping pong con marcador (a 11; cuando alguien gana, empieza otro partido) ────────────────────────────────
function PingPong({ a, b, onAbrir }: { a: AgenteOficina | undefined; b: AgenteOficina | undefined; onAbrir: (x: AgenteOficina) => void }) {
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [ganador, setGanador] = useState<string | null>(null);
  const jugando = !!(a && b);
  useEffect(() => {
    if (!jugando) return;
    const id = setInterval(() => {
      setScore(([x, y]) => {
        const nx = Math.random() < 0.5 ? x + 1 : x;
        const ny = nx === x ? y + 1 : y;
        if ((nx >= 11 || ny >= 11) && Math.abs(nx - ny) >= 2) {
          setGanador(nx > ny ? a!.nombre : b!.nombre);
          return [0, 0];
        }
        return [nx, ny];
      });
    }, 1600); // un punto por cada ida y vuelta de la bola
    return () => clearInterval(id);
  }, [jugando, a, b]);
  const lider = score[0] === score[1] ? null : score[0] > score[1] ? a : b;
  return (
    <>
      <div className="flex items-center gap-2">
        {a ? (
          <button type="button" onClick={() => onAbrir(a)} title={`${a.nombre} · jugando`}>
            <Avatar a={a} size={34} />
          </button>
        ) : (
          <span className="size-[34px]" />
        )}
        <div className="relative h-20 flex-1 rounded-lg border-2 border-white/40 bg-[#10456b]">
          <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
          {jugando ? <span className="oficina-bola absolute size-2 rounded-full bg-white shadow" /> : null}
          {jugando ? (
            <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/80 px-2.5 py-0.5 font-mono text-xs font-bold ring-1 ring-white/20">
              <span style={{ color: a!.color }}>{score[0]}</span>
              <span className="text-white/40">–</span>
              <span style={{ color: b!.color }}>{score[1]}</span>
            </span>
          ) : null}
        </div>
        {b ? (
          <button type="button" onClick={() => onAbrir(b)} title={`${b.nombre} · jugando`}>
            <Avatar a={b} size={34} />
          </button>
        ) : (
          <span className="size-[34px]" />
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {jugando ? (lider ? `Va ganando ${lider.nombre}` : "Van empatados") + (ganador ? ` · último partido: ${ganador} 🏆` : "") : a ? `${a.nombre} espera rival` : "Todos están trabajando 💪"}
      </p>
    </>
  );
}

// ─── Rincón del café: invitar a un agente a un café y hablar con él ─────────────────────────────────────────
export type CafeUI = { yo: "elvin" | "carilin" | "aure" | null; permitidos: string[]; conversacion: { id: number; para: string; texto: string; respuesta: string | null; estado: string; creado: string }[] };

function RinconCafe({ agentes, cafe, onAbrirChat }: { agentes: AgenteOficina[]; cafe: CafeUI; onAbrirChat: () => void }) {
  const esperando = new Set(cafe.conversacion.filter((c) => !c.respuesta && c.estado !== "fallido").map((c) => c.para));
  const enCafe = agentes.filter((a) => esperando.has(a.id));
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] p-4 text-center">
      <Coffee className="size-7 text-[color:var(--coral)]" />
      <p className="text-xs text-muted-foreground">Rincón del café</p>
      {enCafe.length ? (
        <div className="flex -space-x-2">
          {enCafe.map((a) => (
            <Avatar key={a.id} a={a} size={30} />
          ))}
        </div>
      ) : (
        <span className="text-2xl">🪴</span>
      )}
      {cafe.yo ? (
        <button type="button" onClick={onAbrirChat} className="mt-1 rounded-full bg-[color:var(--coral)]/15 px-3 py-1.5 text-xs font-medium text-[color:var(--coral)] ring-1 ring-[color:var(--coral)]/40 hover:bg-[color:var(--coral)]/25">
          ☕ Invitar a un café
        </button>
      ) : null}
    </div>
  );
}

function ChatCafe({ agentes, cafe, onCerrar }: { agentes: AgenteOficina[]; cafe: CafeUI; onCerrar: () => void }) {
  const opciones = agentes.filter((a) => cafe.permitidos.includes(a.id));
  const [para, setPara] = useState(opciones[0]?.id ?? "");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const conv = cafe.conversacion.filter((c) => c.para === para);
  const ag = agentes.find((a) => a.id === para);
  const enviar = async () => {
    setEnviando(true);
    const r = await cafeAction(para, texto);
    setEnviando(false);
    if (!r.ok) return toast.error(r.error, { className: "ritmo" });
    setTexto("");
    toast.success(`${ag?.nombre ?? "El agente"} ya va para el café ☕ (contesta en 1-2 min)`, { className: "ritmo" });
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onCerrar}>
      <aside className="ritmo flex h-full w-full max-w-md flex-col gap-4 border-l border-white/10 bg-[#0a0f18] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Coffee className="size-5 text-[color:var(--coral)]" />
          <p className="flex-1 text-lg font-semibold">Un café con…</p>
          <button type="button" onClick={onCerrar} className="rounded-full p-2 text-muted-foreground hover:bg-white/5" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {opciones.map((a) => (
            <button key={a.id} type="button" onClick={() => setPara(a.id)} className={cn("flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm ring-1 transition", para === a.id ? "bg-white/10 ring-white/40" : "ring-white/10 hover:bg-white/5")}>
              <Avatar a={a} size={26} />
              {a.nombre}
            </button>
          ))}
        </div>
        {cafe.yo !== "elvin" ? <p className="text-[11px] text-muted-foreground">Tu café con Nico va como solicitud: él la revisa y Elvin da el OK antes de cambiar algo.</p> : null}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]">
          {conv.length ? (
            conv.map((c) => (
              <div key={c.id} className="flex flex-col gap-2">
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--coral)]/20 px-3 py-2 text-sm">{c.texto}</p>
                {c.respuesta ? (
                  <div className="flex max-w-[90%] items-end gap-2">
                    {ag ? <Avatar a={ag} size={24} /> : null}
                    <p className="rounded-2xl rounded-bl-sm bg-white/[0.07] px-3 py-2 text-sm whitespace-pre-line">{c.respuesta}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{c.estado === "fallido" ? "No pudo venir al café (falló su turno)." : `☕ ${ag?.nombre ?? "El agente"} está sirviéndose el café… (se actualiza solo)`}</p>
                )}
              </div>
            ))
          ) : (
            <p className="m-auto text-center text-sm text-muted-foreground">Pregúntale lo que quieras: cómo va, qué le falta, qué necesita de ti.</p>
          )}
        </div>
        <div className="flex gap-2">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={2000} placeholder={ag ? `Escríbele a ${ag.nombre}…` : "Escribe…"} className="flex-1 resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/30" />
          <button type="button" onClick={enviar} disabled={enviando || !texto.trim() || !para} className="grid w-12 place-items-center rounded-xl bg-[color:var(--coral)] text-background disabled:opacity-40" aria-label="Enviar">
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </aside>
    </div>
  );
}

export function Oficina({ agentes, kpis, ejecutivos, cafe }: { agentes: AgenteOficina[]; kpis: { tareas: number; minutos: number; costo: number; activos: number }; ejecutivos: Ejecutivos; cafe: CafeUI }) {
  const [abierto, setAbierto] = useState<AgenteOficina | null>(null);
  const [chat, setChat] = useState(false);
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
            {kpis.activos} de {agentes.length} trabajaron hoy · Carilin y Aure piden, Elvin aprueba · toca un cubículo para ver su reporte
          </span>
          <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" />trabajando</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-sky-400" />trabajó hoy</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-white/25" />descansando</span>
          </span>
        </div>

        {/* ala ejecutiva: la oficina del CEO y, al lado, la de Aure */}
        <div className="grid gap-4 border-b border-white/[0.06] bg-[#080c13] p-4 lg:grid-cols-[1fr_260px]">
          <OficinaCEO e={ejecutivos.ceo} trabajando={agentes.filter((a) => a.estado === "trabajando").length} />
          <OficinaPequena titulo="Dirección" nombre="Aure" rol="Le pide trabajo a los agentes · AI Borinquen" color="#a78bfa" aura={22} presente={ejecutivos.aure.presente} pedidos={ejecutivos.aure.pedidos} />
        </div>

        <div className="grid gap-4 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:28px_28px] p-4 lg:grid-cols-[1fr_340px]">
          {/* open space: los cubículos */}
          <div className="rounded-3xl border border-white/[0.06] bg-[#0b111b]/80 p-4">
            <p className="mb-3 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Open space</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {agentes.map((a) => (
                <Cubiculo key={a.id} a={a} onAbrir={() => setAbierto(a)} />
              ))}
              {/* rincón del café: invitar a un agente a un café y hablar con él */}
              <RinconCafe agentes={agentes} cafe={cafe} onAbrirChat={() => setChat(true)} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* oficina de la Directora de Operaciones (lejos de la del CEO) */}
            <OficinaPequena titulo="Directora de Operaciones" nombre="Carilin" rol="Le pide trabajo a los agentes · Level Up" color="#fb7185" aura={36} presente={ejecutivos.carilin.presente} pedidos={ejecutivos.carilin.pedidos} grande />
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
              <PingPong a={ping[0]} b={ping[1]} onAbrir={setAbierto} />
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
      {chat ? createPortal(<ChatCafe agentes={agentes} cafe={cafe} onCerrar={() => setChat(false)} />, document.body) : null}
    </section>
  );
}
