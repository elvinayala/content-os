"use client";

import { Check, KeyRound, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { crearProduccionAction, guardarMetaAction, guardarPerfilAction, linkAccesoAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Perfil } from "@/lib/desempeno/datos";
import { kpisDe, PUESTOS, type OverrideMeta } from "@/lib/desempeno/reglas";

import { EmpresaBadge } from "./piezas";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
const DIAS = [
  { n: 1, t: "L" },
  { n: 2, t: "M" },
  { n: 3, t: "X" },
  { n: 4, t: "J" },
  { n: 5, t: "V" },
  { n: 6, t: "S" },
  { n: 0, t: "D" },
];
const select = "h-10 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";

type Usuario = { id: string; nombre: string; email: string };
type Borrador = Omit<Perfil, "nombre" | "email" | "color" | "desde">;

const nuevo = (userId: string): Borrador => ({ userId, puesto: "estratega", empresa: "level_up", liderId: null, horaEntrada: "09:00", horaSalida: "18:00", diasLaborables: [1, 2, 3, 4, 5], tipoContrato: "contratista", fechaIngreso: null, activo: true });

export function Ajustes({ usuarios, perfiles, metas, produccion }: { usuarios: Usuario[]; perfiles: Perfil[]; metas: OverrideMeta[]; produccion: boolean }) {
  const [tab, setTab] = useState<"personas" | "metas">("personas");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quién se mide, su horario y su líder; y las metas de cada puesto. Todo cambio queda en la bitácora.</p>
      </div>
      <Produccion existe={produccion} />
      <div className="flex gap-1 self-start rounded-full border border-border bg-card/60 p-1 text-sm">
        {(["personas", "metas"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 capitalize transition", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>
      {tab === "personas" ? <Personas usuarios={usuarios} perfiles={perfiles} /> : <Metas metas={metas} />}
    </div>
  );
}

function Produccion({ existe }: { existe: boolean }) {
  const [cargando, setCargando] = useState(false);
  const crear = async () => {
    setCargando(true);
    const r = await crearProduccionAction();
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Tablero Producción creado en Pulse", aviso);
  };
  return (
    <div className="panel flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">Tablero Producción</p>
        <p className="text-sm text-muted-foreground">
          Donde quien pide una pieza la crea con responsable y fecha límite; el responsable la pasa a “En revisión” y quien pidió la aprueba (“Listo”) o la devuelve (“Cambios”). De ahí salen solos los KPIs de diseño, video, copy y web.
        </p>
      </div>
      {existe ? (
        <Link href="/pulse/produccion" className="flex items-center gap-1.5 text-sm text-primary">
          <Check className="size-4" /> Abrir en Pulse
        </Link>
      ) : (
        <Button onClick={crear} disabled={cargando} className="rounded-full">
          {cargando ? <Loader2 className="animate-spin" /> : <Plus />} Crear tablero
        </Button>
      )}
    </div>
  );
}

function Personas({ usuarios, perfiles }: { usuarios: Usuario[]; perfiles: Perfil[] }) {
  const [q, setQ] = useState("");
  const conPerfil = new Set(perfiles.map((p) => p.userId));
  const lista = useMemo(
    () => [...usuarios].sort((a, b) => Number(conPerfil.has(b.id)) - Number(conPerfil.has(a.id)) || a.nombre.localeCompare(b.nombre)).filter((u) => !q || `${u.nombre} ${u.email}`.toLowerCase().includes(q.toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuarios, perfiles, q],
  );
  return (
    <div className="flex flex-col gap-3">
      <Input placeholder="Buscar persona…" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 max-w-sm" />
      {lista.map((u) => (
        <FilaPerfil key={u.id} usuario={u} perfil={perfiles.find((p) => p.userId === u.id) ?? null} usuarios={usuarios} />
      ))}
    </div>
  );
}

function FilaPerfil({ usuario, perfil, usuarios }: { usuario: Usuario; perfil: Perfil | null; usuarios: Usuario[] }) {
  const [b, setB] = useState<Borrador>(() => {
    if (!perfil) return nuevo(usuario.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { nombre, email, color, desde, ...resto } = perfil;
    return resto;
  });
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((x) => ({ ...x, [k]: v }));
  const guardar = async () => {
    setCargando(true);
    const r = await guardarPerfilAction(b);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(`${usuario.nombre}: guardado`, aviso);
    setAbierto(false);
  };
  const puesto = PUESTOS.find((p) => p.id === (perfil?.puesto ?? b.puesto));

  return (
    <div className={cn("panel p-4", !perfil && "opacity-70")}>
      <button type="button" onClick={() => setAbierto((x) => !x)} className="flex w-full items-center gap-3 text-left">
        <span className={cn("size-2 shrink-0 rounded-full", perfil?.activo ? "bg-primary" : "bg-white/20")} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 truncate font-medium">{usuario.nombre}{perfil ? <EmpresaBadge empresa={perfil.empresa} /> : null}</span>
          <span className="block truncate text-xs text-muted-foreground">{perfil ? `${puesto?.nombre} · ${perfil.horaEntrada}–${perfil.horaSalida}${perfil.activo ? "" : " · pausado"}` : usuario.email}</span>
        </span>
        <span className="text-xs text-primary">{perfil ? "Editar" : "Agregar"}</span>
      </button>
      {abierto ? (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <Campo label="Puesto">
            <select className={select} value={b.puesto} onChange={(e) => set("puesto", e.target.value)}>
              {PUESTOS.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Empresa">
            <select className={select} value={b.empresa} onChange={(e) => set("empresa", e.target.value)}>
              <option value="level_up">Level Up</option>
              <option value="ai_borinquen">AI Borinquen</option>
            </select>
          </Campo>
          <Campo label="Supervisor">
            <select className={select} value={b.liderId ?? ""} onChange={(e) => set("liderId", e.target.value || null)}>
              <option value="">— Sin supervisor (va directo a RR.HH.) —</option>
              {usuarios.filter((x) => x.id !== usuario.id).map((x) => (
                <option key={x.id} value={x.id}>{x.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Horario (hora PR)">
            <div className="flex items-center gap-2">
              <Input type="time" className="h-10" value={b.horaEntrada} onChange={(e) => set("horaEntrada", e.target.value)} />
              <span className="text-muted-foreground">a</span>
              <Input type="time" className="h-10" value={b.horaSalida} onChange={(e) => set("horaSalida", e.target.value)} />
            </div>
          </Campo>
          <Campo label="Días">
            <div className="flex gap-1">
              {DIAS.map((d) => {
                const on = b.diasLaborables.includes(d.n);
                return (
                  <button key={d.n} type="button" onClick={() => set("diasLaborables", on ? b.diasLaborables.filter((x) => x !== d.n) : [...b.diasLaborables, d.n])} className={cn("size-9 rounded-full text-sm transition", on ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground")}>
                    {d.t}
                  </button>
                );
              })}
            </div>
          </Campo>
          <Campo label="Contrato">
            <select className={select} value={b.tipoContrato} onChange={(e) => set("tipoContrato", e.target.value)}>
              <option value="contratista">Contratista</option>
              <option value="nomina">Nómina</option>
              <option value="eor">EOR (Deel/Ontop)</option>
            </select>
          </Campo>
          <Campo label="Fecha de ingreso">
            <Input type="date" className="h-10" value={b.fechaIngreso ?? ""} onChange={(e) => set("fechaIngreso", e.target.value || null)} />
          </Campo>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={b.activo} onChange={(e) => set("activo", e.target.checked)} className="size-4 accent-[var(--neon)]" />
            Activo en Ritmo
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2">
            <LinkAcceso userId={usuario.id} nombre={usuario.nombre} />
            <Button onClick={guardar} disabled={cargando} className="rounded-full px-6">
              {cargando ? <Loader2 className="animate-spin" /> : <Check />} Guardar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Genera el link para que la persona cree su propia clave; se copia para mandárselo por Slack/WhatsApp.
function LinkAcceso({ userId, nombre }: { userId: string; nombre: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const generar = async () => {
    setCargando(true);
    const r = await linkAccesoAction(userId);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setUrl(r.url);
    try {
      await navigator.clipboard.writeText(r.url);
      toast.success(`Link de ${nombre.split(" ")[0]} copiado (vence en 72 h)`, aviso);
    } catch {
      toast.success("Link listo: cópialo abajo", aviso);
    }
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <Button variant="outline" onClick={generar} disabled={cargando} className="rounded-full">
        {cargando ? <Loader2 className="animate-spin" /> : <KeyRound />} Link de acceso
      </Button>
      {url ? <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-9 min-w-0 flex-1 text-xs" /> : null}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Metas({ metas }: { metas: OverrideMeta[] }) {
  const [puesto, setPuesto] = useState(PUESTOS[0].id);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Score = 20 % asistencia + 80 % KPIs. Cada KPI se compara con su meta; el peso dice cuánto pesa dentro del puesto (0 = solo informativo). Las primeras semanas son de calibración: ajusta con los números reales.
      </p>
      <select className={cn(select, "max-w-xs")} value={puesto} onChange={(e) => setPuesto(e.target.value)}>
        {PUESTOS.map((p) => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
      <div className="panel divide-y divide-border">
        {kpisDe(puesto, metas).map((k) => (
          <FilaMeta key={`${puesto}:${k.id}`} puesto={puesto} kpi={k} />
        ))}
      </div>
    </div>
  );
}

function FilaMeta({ puesto, kpi }: { puesto: string; kpi: ReturnType<typeof kpisDe>[number] }) {
  const [meta, setMeta] = useState(String(kpi.meta));
  const [peso, setPeso] = useState(String(kpi.peso));
  const [cargando, setCargando] = useState(false);
  const cambiado = meta !== String(kpi.meta) || peso !== String(kpi.peso);
  const guardar = async () => {
    setCargando(true);
    const r = await guardarMetaAction({ puesto, kpi: kpi.id, meta: Number(meta), peso: Number(peso) });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(`${kpi.nombre}: guardado`, aviso);
  };
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{kpi.nombre}</p>
        <p className="text-xs text-muted-foreground">
          {kpi.sentido === "mayor" ? "Más es mejor" : kpi.sentido === "menor" ? "Menos es mejor" : "Informativo"}
          {kpi.unidad ? ` · ${kpi.unidad === "u" ? "cantidad" : kpi.unidad}` : ""}
        </p>
      </div>
      {kpi.sentido !== "info" ? (
        <>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Meta
            <Input type="number" inputMode="decimal" min={0} className="h-9 w-20 text-right" value={meta} onChange={(e) => setMeta(e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Peso
            <Input type="number" inputMode="numeric" min={0} max={10} className="h-9 w-16 text-right" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </label>
          <Button size="sm" variant={cambiado ? "default" : "outline"} disabled={!cambiado || cargando} onClick={guardar} className="rounded-full">
            {cargando ? <Loader2 className="animate-spin" /> : "Guardar"}
          </Button>
        </>
      ) : null}
    </div>
  );
}
