"use client";

import { Check, Flag, Gift, Loader2, Minus, PenLine, Plus, Target, Trophy, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { crearBonoAction, decidirBonoAction, ganadorBonoAction, guardarDiarioAction, guardarGoalAction, pagarBonoAction } from "@/app/ritmo/arena-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { tasasVentas, type RolVentas } from "@/lib/ventas/reglas";
import { cn } from "@/lib/utils";

import { Cifra, Confeti } from "./arena-vivo";

const aviso = { className: "ritmo" };
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const soloNum = (s: string) => s.replace(/[^\d]/g, "");

// ─── Piezas ───────────────────────────────────────────────────────────────────────────────────

export function Barra({ valor, meta, etiqueta, grande = false }: { valor: number; meta: number | null; etiqueta: string; grande?: boolean }) {
  const p = meta ? Math.min(100, Math.round((valor / meta) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted-foreground">{etiqueta}</span>
        <span className={cn("num font-mono", grande ? "text-lg font-semibold" : "text-sm")}>
          {usd(valor)}
          {meta ? <span className="text-muted-foreground"> / {usd(meta)}</span> : null}
        </span>
      </div>
      <div className={cn("overflow-hidden rounded-full bg-white/[0.06]", grande ? "h-3" : "h-1.5")}>
        <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)] transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

export function Alerta({ nivel, texto }: { nivel: "rojo" | "ambar"; texto: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold ring-1", nivel === "rojo" ? "bg-red-500/12 text-red-300 ring-red-500/40" : "bg-amber-500/12 text-amber-200 ring-amber-500/40")}>
      <Flag className="size-5 shrink-0" />
      {texto}
    </div>
  );
}

export type CorredorUI = { nombre: string; userId: string | null; monto: number; ventas: number; yo: boolean };

export function Carrera({ titulo, corredores, meta }: { titulo: string; corredores: CorredorUI[]; meta: number | null }) {
  const tope = Math.max(meta ?? 0, ...corredores.map((c) => c.monto), 1);
  return (
    <section className="panel flex flex-col gap-3 p-5">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {corredores.length ? (
        corredores.map((c, i) => (
          <div key={`${c.userId ?? c.nombre}`} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("grid size-6 place-items-center rounded-full text-[11px] font-semibold", i === 0 ? "bg-[color:var(--coral)] text-background" : "bg-white/[0.06] text-muted-foreground")}>{i + 1}</span>
              <span className={cn("min-w-0 flex-1 truncate", c.yo && "font-semibold text-primary")}>
                {c.nombre}
                {c.yo ? " (tú)" : ""}
              </span>
              <span className="num font-mono text-xs text-muted-foreground">{c.ventas} {c.ventas === 1 ? "venta" : "ventas"}</span>
              <span className="num w-20 text-right font-mono">{usd(c.monto)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <div className={cn("h-full rounded-full", c.yo ? "bg-primary shadow-[0_0_10px_var(--neon)]" : "bg-primary/50")} style={{ width: `${Math.max(2, (c.monto / tope) * 100)}%` }} />
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay ventas este mes.</p>
      )}
    </section>
  );
}

// ─── Meta personal ────────────────────────────────────────────────────────────────────────────

export function MiGoal({ goal, mes }: { goal: number | null; mes: number }) {
  const [editando, setEditando] = useState(!goal);
  const [monto, setMonto] = useState(goal ? String(goal) : "");
  const [guardando, setGuardando] = useState(false);
  const guardar = async () => {
    setGuardando(true);
    const r = await guardarGoalAction(Number(monto));
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Meta guardada 🎯", aviso);
    setEditando(false);
  };
  if (!editando && goal)
    return (
      <button type="button" onClick={() => setEditando(true)} className="text-left">
        <Barra valor={mes} meta={goal} etiqueta="🎯 Mi meta personal del mes" />
      </button>
    );
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground">🎯 ¿Cuánto quieres vender este mes? (tu meta personal)</Label>
      <div className="flex gap-2">
        <Input className="h-10" inputMode="numeric" placeholder="50000" value={monto} onChange={(e) => setMonto(soloNum(e.target.value))} />
        <Button className="h-10 rounded-full" onClick={guardar} disabled={guardando || !monto}>
          {guardando ? <Loader2 className="animate-spin" /> : <Target className="size-4" />} Guardar
        </Button>
      </div>
    </div>
  );
}

// ─── Diario ───────────────────────────────────────────────────────────────────────────────────

export type DiarioUI = { fecha: string; kpis: Record<string, number>; animo: number | null; nota: string | null };
type KpiUI = { id: string; nombre: string; ayuda?: string; dinero?: boolean };
const soloDinero = (s: string) => {
  const limpio = s.replace(/[^\d.]/g, "");
  const [ent, ...dec] = limpio.split(".");
  return dec.length ? `${ent}.${dec.join("").slice(0, 2)}` : ent;
};

export function MiDiario({
  rol,
  hoy,
  ayer,
  dias,
  kpis,
  rango,
  diasRango,
  etiqueta,
}: {
  rol: RolVentas;
  hoy: string;
  ayer: string;
  dias: DiarioUI[];
  kpis: KpiUI[];
  rango: Record<string, number>; // totales del rango que se mira
  diasRango: number;
  etiqueta: string;
}) {
  const [fecha, setFecha] = useState(hoy);
  const inicial = (d?: DiarioUI) => ({ valores: Object.fromEntries(kpis.map((k) => [k.id, d?.kpis?.[k.id] ? String(d.kpis[k.id]) : ""])) as Record<string, string>, animo: d?.animo ?? null, nota: d?.nota ?? "" });
  const [f, setF] = useState(inicial(dias.find((d) => d.fecha === hoy)));
  const [guardando, setGuardando] = useState(false);
  const [fiesta, setFiesta] = useState(0);
  // Tras guardar, el servidor trae el diario nuevo: el formulario queda con lo guardado (no se borra lo que escribió).
  const [previo, setPrevio] = useState(dias);
  if (previo !== dias) {
    setPrevio(dias);
    const d = dias.find((x) => x.fecha === fecha);
    if (d) setF(inicial(d));
  }
  const cambiarFecha = (x: string) => {
    setFecha(x);
    setF(inicial(dias.find((d) => d.fecha === x)));
  };
  const poner = (id: string, v: string) => setF((x) => ({ ...x, valores: { ...x.valores, [id]: v } }));
  const sumar = (id: string, n: number) => poner(id, String(Math.max(0, Math.min(1000, Number(f.valores[id] || 0) + n))));
  const guardar = async () => {
    setGuardando(true);
    const r = await guardarDiarioAction({ fecha, kpis: Object.fromEntries(kpis.map((k) => [k.id, Number(f.valores[k.id] || 0)])), animo: f.animo, nota: f.nota });
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setFiesta((n) => n + 1);
    toast.success("Diario guardado ✍️", aviso);
  };
  const guardado = dias.find((d) => d.fecha === fecha);
  const numeros = Object.fromEntries(kpis.map((k) => [k.id, Number(f.valores[k.id] || 0)]));
  const vivas = tasasVentas(rol, numeros);
  const llenos = kpis.filter((k) => f.valores[k.id] !== "" && f.valores[k.id] !== undefined).length;
  const dineros = kpis.filter((k) => k.dinero);
  const conteos = kpis.filter((k) => !k.dinero);
  return (
    <section id="diario" className="panel relative flex scroll-mt-20 flex-col gap-4 overflow-hidden p-5">
      <Confeti disparo={fiesta} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <PenLine className="size-4 text-primary" /> Mi diario
          </h3>
          <p className={cn("mt-0.5 text-[11px]", guardado ? "text-emerald-300" : "text-amber-300")}>{guardado ? "✓ Ya lo llenaste: puedes corregirlo." : `Anota tus números de ${fecha === hoy ? "hoy" : "ayer"}.`}</p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 text-xs ring-1 ring-border">
          {[
            { f: ayer, t: "Ayer" },
            { f: hoy, t: "Hoy" },
          ].map((x) => (
            <button key={x.f} type="button" onClick={() => cambiarFecha(x.f)} className={cn("rounded-full px-3 py-1 transition", fecha === x.f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {x.t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="arena-barra h-full rounded-full bg-gradient-to-r from-[color:var(--neon)] to-[color:var(--coral)]" style={{ width: `${(llenos / Math.max(1, kpis.length)) * 100}%` }} />
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {llenos}/{kpis.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {conteos.map((k) => (
          <div key={k.id} className={cn("flex flex-col gap-1.5 rounded-xl bg-white/[0.03] p-2.5 ring-1 transition", f.valores[k.id] ? "ring-primary/30" : "ring-border/60")} title={k.ayuda}>
            <Label className="min-h-[2lh] text-[11px] leading-tight text-muted-foreground">{k.nombre}</Label>
            <div className="flex items-center gap-1">
              <button type="button" aria-label={`Menos ${k.nombre}`} onClick={() => sumar(k.id, -1)} className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-muted-foreground transition hover:bg-white/10 hover:text-foreground active:scale-90">
                <Minus className="size-3.5" />
              </button>
              <Input className="h-8 min-w-0 px-1 text-center num font-mono text-base" inputMode="numeric" value={f.valores[k.id] ?? ""} onChange={(e) => poner(k.id, soloNum(e.target.value))} placeholder="0" />
              <button type="button" aria-label={`Más ${k.nombre}`} onClick={() => sumar(k.id, 1)} className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary transition hover:bg-primary/25 active:scale-90">
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {dineros.length ? (
        <div className="grid grid-cols-2 gap-2.5">
          {dineros.map((k) => (
            <div key={k.id} className="flex flex-col gap-1.5 rounded-xl bg-[color:var(--coral)]/[0.06] p-2.5 ring-1 ring-[color:var(--coral)]/25" title={k.ayuda}>
              <Label className="text-[11px] text-muted-foreground">{k.nombre}</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-2.5 -translate-y-1/2 font-mono text-sm text-muted-foreground">$</span>
                <Input className="h-9 pl-6 num font-mono" inputMode="decimal" value={f.valores[k.id] ?? ""} onChange={(e) => poner(k.id, soloDinero(e.target.value))} placeholder="0" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {vivas.length ? (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {vivas.map((t) => (
            <span key={t.id} className={cn("rounded-lg px-2 py-1 ring-1 transition", t.valor == null ? "bg-white/[0.03] text-muted-foreground ring-border/60" : "bg-primary/10 text-primary ring-primary/30")}>
              {t.nombre}: <b className="font-mono">{t.valor == null ? "—" : `${t.valor} %`}</b>
            </span>
          ))}
          <span className="self-center text-[10px] text-muted-foreground">se calculan mientras escribes</span>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">¿Cómo te fue?</Label>
        <div className="flex gap-1.5">
          {["😣", "😕", "😐", "🙂", "🔥"].map((e, i) => (
            <button key={e} type="button" onClick={() => setF((x) => ({ ...x, animo: i + 1 }))} className={cn("grid size-10 place-items-center rounded-xl text-xl ring-1 transition hover:scale-110", f.animo === i + 1 ? "scale-110 bg-primary/15 ring-primary/50" : "ring-border hover:bg-white/[0.04]")}>
              {e}
            </button>
          ))}
        </div>
        <Textarea rows={2} value={f.nota} maxLength={400} onChange={(e) => setF((x) => ({ ...x, nota: e.target.value }))} placeholder="Qué funcionó, qué objeción salió, qué vas a mejorar…" />
      </div>
      <Button className="h-11 w-full rounded-full text-sm font-semibold sm:w-fit sm:px-8" onClick={guardar} disabled={guardando}>
        {guardando ? <Loader2 className="animate-spin" /> : <Check className="size-4" />} Guardar {fecha === hoy ? "hoy" : "ayer"}
      </Button>
      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <p className="text-[11px] tracking-wider text-muted-foreground uppercase">
          {etiqueta} · {diasRango} {diasRango === 1 ? "día" : "días"} con diario
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.id} className="rounded-lg bg-white/[0.025] px-2 py-1.5">
              <p className="truncate text-[10px] text-muted-foreground">{k.nombre.replace(" (US$)", "")}</p>
              <Cifra valor={rango[k.id] ?? 0} tipo={k.dinero ? "usd" : "num"} className="font-mono text-sm font-semibold" />
            </div>
          ))}
        </div>
        {tasasVentas(rol, rango).length ? (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {tasasVentas(rol, rango).map((t) => (
              <span key={t.id} className="rounded-lg bg-white/[0.04] px-2 py-1">
                {t.nombre}: <b className="font-mono">{t.valor == null ? "—" : `${t.valor} %`}</b>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── Bonos ────────────────────────────────────────────────────────────────────────────────────

export type BonoUI = { id: string; titulo: string; detalle: string | null; monto: number; rol: string | null; desde: string; hasta: string | null; estado: string; ganador: string | null; creadoPor: string | null };

const ESTADO: Record<string, { t: string; c: string }> = {
  propuesto: { t: "Esperando a Elvin", c: "bg-amber-500/15 text-amber-200" },
  autorizado: { t: "Disponible", c: "bg-primary/15 text-primary" },
  ganado: { t: "Ganado · por aprobar pago", c: "bg-[color:var(--coral)]/15 text-[color:var(--coral)]" },
  pagado: { t: "Pagado", c: "bg-white/[0.06] text-muted-foreground" },
  rechazado: { t: "No autorizado", c: "bg-white/[0.06] text-muted-foreground" },
  cerrado: { t: "Cerrado", c: "bg-white/[0.06] text-muted-foreground" },
};
const fechaCorta = (f: string) => new Date(`${f}T12:00:00Z`).toLocaleDateString("es-PR", { day: "numeric", month: "short", timeZone: "UTC" });

export function Bonos({ empresa, bonos, gestiona, autoriza, equipo }: { empresa: string; bonos: BonoUI[]; gestiona: boolean; autoriza: boolean; equipo: { userId: string; nombre: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const vacio = { titulo: "", detalle: "", monto: "", rol: "", desde: "", hasta: "" };
  const [f, setF] = useState(vacio);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const correr = async (k: string, fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => {
    setOcupado(k);
    const r = await fn();
    setOcupado(null);
    if (!r.ok) {
      toast.error(r.error ?? "Error", aviso);
      return false;
    }
    toast.success(ok, aviso);
    return true;
  };
  const visibles = gestiona ? bonos : bonos.filter((b) => ["autorizado", "ganado", "pagado"].includes(b.estado));
  return (
    <section className="panel flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gift className="size-4 text-[color:var(--coral)]" /> Bonos
        </h3>
        {gestiona && !abierto ? (
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setAbierto(true)}>
            <Plus className="size-4" /> Nuevo bono
          </Button>
        ) : null}
      </div>
      {abierto ? (
        <div className="flex flex-col gap-3 rounded-xl bg-white/[0.02] p-4 ring-1 ring-border">
          <Input className="h-10" placeholder='Ej.: "$200 al primero que cierre 5 esta semana"' value={f.titulo} onChange={(e) => setF((x) => ({ ...x, titulo: e.target.value }))} />
          <Textarea rows={2} placeholder="Reglas (opcional)" value={f.detalle} onChange={(e) => setF((x) => ({ ...x, detalle: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input className="h-10" inputMode="numeric" placeholder="Monto US$" value={f.monto} onChange={(e) => setF((x) => ({ ...x, monto: soloNum(e.target.value) }))} />
            <select className="h-10 rounded-md border border-input bg-transparent px-2 text-sm" value={f.rol} onChange={(e) => setF((x) => ({ ...x, rol: e.target.value }))}>
              <option value="">Para todos</option>
              <option value="closer">Closers</option>
              <option value="setter">Setters</option>
              <option value="chatter">Chatters</option>
            </select>
            <Input className="h-10" type="date" value={f.desde} onChange={(e) => setF((x) => ({ ...x, desde: e.target.value }))} />
            <Input className="h-10" type="date" value={f.hasta} onChange={(e) => setF((x) => ({ ...x, hasta: e.target.value }))} />
          </div>
          <p className="text-[11px] text-muted-foreground">{autoriza ? "Tú lo creas: sale autorizado." : "Le llega a Elvin para autorizarlo antes de que el equipo lo vea."}</p>
          <div className="flex gap-2">
            <Button
              className="h-9 rounded-full"
              disabled={ocupado === "nuevo"}
              onClick={() =>
                correr("nuevo", () => crearBonoAction({ empresa: empresa as "level_up", titulo: f.titulo, detalle: f.detalle, monto: Number(f.monto), rol: f.rol, desde: f.desde, hasta: f.hasta }), autoriza ? "Bono publicado 🎁" : "Bono enviado a Elvin").then((ok) => {
                  if (!ok) return;
                  setF(vacio);
                  setAbierto(false);
                })
              }
            >
              {ocupado === "nuevo" ? <Loader2 className="animate-spin" /> : <Gift className="size-4" />} {autoriza ? "Publicar bono" : "Enviar a Elvin"}
            </Button>
            <Button variant="ghost" className="h-9 rounded-full" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
      {visibles.length ? (
        <div className="flex flex-col divide-y divide-border/60">
          {visibles.map((b) => (
            <div key={b.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-start gap-3">
                <span className="num font-mono text-lg font-semibold text-[color:var(--coral)]">{usd(b.monto)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{b.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.rol ? `${b.rol[0].toUpperCase()}${b.rol.slice(1)}s · ` : ""}desde {fechaCorta(b.desde)}
                    {b.hasta ? ` hasta ${fechaCorta(b.hasta)}` : ""}
                    {b.ganador ? ` · 🏆 ${b.ganador}` : ""}
                  </p>
                  {b.detalle ? <p className="mt-1 text-xs text-muted-foreground">{b.detalle}</p> : null}
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px]", ESTADO[b.estado]?.c)}>{ESTADO[b.estado]?.t ?? b.estado}</span>
              </div>
              {autoriza && b.estado === "propuesto" ? (
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full" disabled={!!ocupado} onClick={() => correr(b.id, () => decidirBonoAction(b.id, "autorizar"), "Bono autorizado")}>
                    <Check className="size-4" /> Autorizar
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full" disabled={!!ocupado} onClick={() => correr(b.id, () => decidirBonoAction(b.id, "rechazar"), "Bono rechazado")}>
                    <X className="size-4" /> No
                  </Button>
                </div>
              ) : null}
              {gestiona && b.estado === "autorizado" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => e.target.value && correr(b.id, () => ganadorBonoAction(b.id, e.target.value), "Ganador marcado: le llega a Elvin para aprobar el pago")}
                  >
                    <option value="">🏆 Marcar ganador…</option>
                    {equipo.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" disabled={!!ocupado} onClick={() => correr(b.id, () => decidirBonoAction(b.id, "cerrar"), "Bono cerrado")}>
                    Cerrar sin ganador
                  </Button>
                </div>
              ) : null}
              {autoriza && b.estado === "ganado" ? (
                <Button size="sm" className="w-fit rounded-full" disabled={!!ocupado} onClick={() => correr(b.id, () => pagarBonoAction(b.id), "Pago aprobado 🏆")}>
                  <Trophy className="size-4" /> Aprobar pago
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{gestiona ? "Crea el primer bono del equipo." : "No hay bonos activos ahora mismo."}</p>
      )}
    </section>
  );
}

