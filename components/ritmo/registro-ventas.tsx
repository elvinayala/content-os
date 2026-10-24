"use client";

import { ExternalLink, Loader2, Plus, Receipt, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { borrarVentaAction, registrarVentaAction } from "@/app/ritmo/arena-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIAS_ATRAS_REGISTRO, FUENTES_VENTA, METODOS_PAGO, resumenRegistro, TIPOS_VENTA, type TipoVenta, type Venta } from "@/lib/ventas/registro-reglas";
import type { Empresa } from "@/lib/ventas/reglas";
import { cn } from "@/lib/utils";

import { Avatar } from "./arena-vivo";

// Registro de ventas (19/oct, María García, tesorera): cada cobro con quién lo vendió, de dónde vino, cash collected y
// total del acuerdo. Con ventas registradas en el mes, la Arena cuenta con ellas (marcador, carrera y comisiones).

const aviso = { className: "ritmo" };
const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const sumarDias = (f: string, n: number) => new Date(Date.parse(`${f}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const diaBonito = (f: string, hoy: string) =>
  f === hoy ? "Hoy" : f === sumarDias(hoy, -1) ? "Ayer" : new Date(`${f}T12:00:00Z`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).replace(/^./, (c) => c.toUpperCase());
const TIPO = Object.fromEntries(TIPOS_VENTA.map((t) => [t.id, t])) as Record<TipoVenta, (typeof TIPOS_VENTA)[number]>;
const COLOR: Record<TipoVenta, string> = {
  nueva: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  referido: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  recurrente: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
  balance: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
};

export function RegistroVentas({ empresa, hoy, ventas, equipo, puedeRegistrar, cuenta }: { empresa: Empresa; hoy: string; ventas: Venta[]; equipo: string[]; puedeRegistrar: boolean; cuenta: boolean }) {
  const vacio = { fecha: hoy, cliente: "", vendedor: "", agendo: "", tipo: "nueva" as TipoVenta, fuente: "", anuncio: "", referidoPor: "", cash: "", acuerdo: "", metodo: "", nota: "" };
  const [f, setF] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const set = (k: keyof typeof vacio) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  // Totales del mes; la lista también enseña lo anotado tarde del mes pasado.
  const r = resumenRegistro(ventas.filter((v) => v.fecha.slice(0, 7) === hoy.slice(0, 7)));
  const dias = [...new Set(ventas.map((v) => v.fecha))].sort().reverse();

  const guardar = async () => {
    setGuardando(true);
    const res = await registrarVentaAction(empresa, f);
    setGuardando(false);
    if (!res.ok) return toast.error(res.error, aviso);
    toast.success("Venta registrada 💰", aviso);
    setF((x) => ({ ...vacio, fecha: x.fecha }));
  };
  const borrar = async (v: Venta) => {
    if (!confirm(`¿Borrar la venta de ${v.cliente} (${usd(v.cash)})?`)) return;
    setBorrando(v.id);
    const res = await borrarVentaAction(v.id);
    setBorrando(null);
    if (!res.ok) return toast.error(res.error, aviso);
    toast.success("Venta borrada", aviso);
  };

  return (
    <section id="registro" className="panel flex scroll-mt-20 flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Receipt className="size-4 text-primary" /> Registro de ventas
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cuenta ? "Este mes la Arena cuenta con estas ventas: marcador, carrera y comisiones." : "Cada cobro con quién lo vendió y de dónde vino."}
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-[11px] text-muted-foreground">Cobrado este mes</p>
            <p className="num font-mono text-xl font-semibold">{usd(r.cash)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Ventas</p>
            <p className="num font-mono text-xl font-semibold">{r.ventas}</p>
          </div>
        </div>
      </div>

      {r.ventas ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {TIPOS_VENTA.filter((t) => r.porTipo[t.id].n).map((t) => (
            <span key={t.id} className={cn("rounded-full px-2.5 py-1 ring-1", COLOR[t.id])}>
              {t.emoji} {t.nombre} · {r.porTipo[t.id].n} · {usd(r.porTipo[t.id].cash)}
            </span>
          ))}
          {r.porCobrarNuevas > 0 ? <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-muted-foreground ring-1 ring-border">Por cobrar de lo nuevo: {usd(r.porCobrarNuevas)}</span> : null}
        </div>
      ) : null}
      {r.porFuente.length ? (
        <p className="-mt-2 text-xs text-muted-foreground">
          De dónde vino: {r.porFuente.slice(0, 5).map((x) => `${x.fuente} ${usd(x.cash)}`).join(" · ")}
        </p>
      ) : null}

      {puedeRegistrar ? (
        <div className="flex flex-col gap-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-border/70">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIPOS_VENTA.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setF((x) => ({ ...x, tipo: t.id }))}
                className={cn("flex flex-col items-start rounded-xl px-3 py-2 text-left ring-1 transition active:scale-[0.98]", f.tipo === t.id ? COLOR[t.id] : "bg-white/[0.02] text-muted-foreground ring-border hover:text-foreground")}
              >
                <span className="text-sm font-medium">
                  {t.emoji} {t.nombre}
                </span>
                <span className="text-[11px] opacity-80">{t.detalle}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
            <Campo id="rv-fecha" label="Día del cobro">
              <Input id="rv-fecha" type="date" className="h-10 px-2 text-sm" value={f.fecha} min={sumarDias(hoy, -DIAS_ATRAS_REGISTRO)} max={hoy} onChange={set("fecha")} />
            </Campo>
            <Campo id="rv-cliente" label="Cliente o negocio">
              <Input id="rv-cliente" className="h-10" maxLength={120} placeholder="Ej.: Tinos Pizza · Juan Rivera" value={f.cliente} onChange={set("cliente")} />
            </Campo>
          </div>

          <datalist id="rv-equipo">
            {equipo.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo id="rv-vendedor" label="¿Quién la vendió?">
              <Input id="rv-vendedor" className="h-10" list="rv-equipo" maxLength={80} placeholder="Closer o quien cerró" value={f.vendedor} onChange={set("vendedor")} />
            </Campo>
            <Campo id="rv-agendo" label="¿Quién la agendó? (opcional)">
              <Input id="rv-agendo" className="h-10" list="rv-equipo" maxLength={80} placeholder="Setter o chatter" value={f.agendo} onChange={set("agendo")} />
            </Campo>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {f.tipo === "referido" ? (
              <Campo id="rv-referido" label="¿De quién vino el referido?">
                <Input id="rv-referido" className="h-10" maxLength={120} placeholder="Ej.: María López (cliente de Tinos)" value={f.referidoPor} onChange={set("referidoPor")} />
              </Campo>
            ) : (
              <Campo id="rv-fuente" label="Fuente (de dónde vino · UTM)">
                <Input id="rv-fuente" className="h-10" list="rv-fuentes" maxLength={80} placeholder="Ej.: Anuncio de Meta" value={f.fuente} onChange={set("fuente")} />
                <datalist id="rv-fuentes">
                  {FUENTES_VENTA.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </Campo>
            )}
            {f.tipo === "nueva" ? (
              <Campo id="rv-anuncio" label="Enlace del anuncio (si vino de uno)">
                <Input id="rv-anuncio" className="h-10" inputMode="url" maxLength={600} placeholder="https://…" value={f.anuncio} onChange={set("anuncio")} />
              </Campo>
            ) : (
              <Campo id="rv-metodo" label="Método de pago">
                <Metodo value={f.metodo} onChange={set("metodo")} />
              </Campo>
            )}
          </div>

          <div className={cn("grid gap-3", f.tipo === "nueva" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            <Campo id="rv-cash" label="Cash collected (0 si no cobró)">
              <Dinero id="rv-cash" value={f.cash} onChange={set("cash")} />
            </Campo>
            <Campo id="rv-acuerdo" label="Total del acuerdo">
              <Dinero id="rv-acuerdo" value={f.acuerdo} onChange={set("acuerdo")} />
            </Campo>
            {f.tipo === "nueva" ? (
              <Campo id="rv-metodo" label="Método de pago">
                <Metodo value={f.metodo} onChange={set("metodo")} />
              </Campo>
            ) : null}
          </div>

          <Campo id="rv-nota" label="Nota (opcional)">
            <Input id="rv-nota" className="h-10" maxLength={300} placeholder="Ej.: 2 de 3 cuotas" value={f.nota} onChange={set("nota")} />
          </Campo>

          <Button onClick={guardar} disabled={guardando} className="h-11 rounded-full">
            {guardando ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />} Registrar venta
          </Button>
        </div>
      ) : null}

      {dias.length ? (
        <div className="flex flex-col gap-4">
          {dias.map((dia) => {
            const del = ventas.filter((v) => v.fecha === dia);
            return (
              <div key={dia} className="flex flex-col gap-2">
                <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {diaBonito(dia, hoy)} · {del.length} {del.length === 1 ? "venta" : "ventas"} · {usd(del.reduce((n, v) => n + v.cash, 0))}
                </p>
                <ol className="flex flex-col gap-2">
                  {del.map((v) => (
                    <li key={v.id} className="flex gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-border/60">
                      <Avatar nombre={v.vendedor} tamano={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium">{v.cliente}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] ring-1", COLOR[v.tipo])}>
                            {TIPO[v.tipo].emoji} {TIPO[v.tipo].nombre}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Vendió <span className="text-foreground/85">{v.vendedor}</span>
                          {v.agendo ? <> · agendó <span className="text-foreground/85">{v.agendo}</span></> : null} · {v.fuente}
                          {v.metodo ? ` · ${v.metodo}` : ""}
                        </p>
                        {v.referidoPor ? (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-sky-300">
                            <UserRound className="size-3" /> Referido por {v.referidoPor}
                          </p>
                        ) : null}
                        {v.anuncio ? (
                          <a href={v.anuncio} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <ExternalLink className="size-3" /> Ver el anuncio
                          </a>
                        ) : null}
                        {v.nota ? <p className="mt-0.5 text-xs text-foreground/70">{v.nota}</p> : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="num font-mono font-semibold">{usd(v.cash)}</span>
                        <span className="text-[11px] text-muted-foreground">de {usd(v.acuerdo)}</span>
                        {v.hoja ? (
                          <span className={cn("text-[10px]", v.hoja === "ok" ? "text-emerald-300/80" : v.hoja === "error" ? "text-amber-300" : "text-muted-foreground")} title={v.hoja === "error" ? "Se vuelve a intentar sola cuando registres la próxima venta" : undefined}>
                            {v.hoja === "ok" ? "✓ en tu hoja" : v.hoja === "error" ? "no pasó a la hoja" : "pasando a la hoja…"}
                          </span>
                        ) : null}
                        {puedeRegistrar ? (
                          <button type="button" aria-label="Borrar venta" disabled={borrando === v.id} onClick={() => borrar(v)} className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-red-500/10 hover:text-red-300">
                            {borrando === v.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay ventas registradas este mes.</p>
      )}
    </section>
  );
}

function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Dinero({ id, value, onChange }: { id: string; value: string; onChange: (e: { target: { value: string } }) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input id={id} className="h-10 pl-6 font-mono" inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange({ target: { value: e.target.value.replace(/[^\d.,]/g, "") } })} />
    </div>
  );
}

function Metodo({ value, onChange }: { value: string; onChange: (e: { target: { value: string } }) => void }) {
  return (
    <select id="rv-metodo" value={value} onChange={onChange} className="h-10 rounded-md border border-input bg-transparent px-2 text-sm">
      <option value="">—</option>
      {METODOS_PAGO.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
