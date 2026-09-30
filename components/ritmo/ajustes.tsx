"use client";

import { Check, KeyRound, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { crearProduccionAction, crearPuestoAction, guardarMetaAction, guardarPerfilAction, linkAccesoAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Perfil } from "@/lib/desempeno/datos";
import { kpisDe, type OverrideMeta } from "@/lib/desempeno/reglas";
import { esPuestoVentas } from "@/lib/ventas/reglas";

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
type PuestoUI = { id: string; nombre: string; departamento: string; nuevo?: boolean };
type Borrador = Omit<Perfil, "nombre" | "email" | "color" | "desde">;

// Sin puesto por defecto: antes arrancaba en "estratega" y así quedó mal María (tesorera), 28/sep.
const nuevo = (userId: string): Borrador => ({ userId, puesto: "", empresa: "level_up", tambienEn: null, slackId: null, soloRitmo: true, liderId: null, horaEntrada: "09:00", horaSalida: "18:00", diasLaborables: [1, 2, 3, 4, 5], tipoContrato: "contratista", fechaIngreso: null, activo: true });

export function Ajustes({ usuarios, perfiles, metas, produccion, buscar = "", gestorPulse = false, arriba, puestos }: { usuarios: Usuario[]; perfiles: Perfil[]; metas: OverrideMeta[]; produccion: boolean; buscar?: string; gestorPulse?: boolean; arriba?: React.ReactNode; puestos: PuestoUI[] }) {
  const [tab, setTab] = useState<"personas" | "puestos" | "metas">("personas");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Quién se mide, su horario y su líder; y las metas de cada puesto. Todo cambio queda en la bitácora. Lo sensible (puesto, empresa, supervisor, activo, acceso a Pulse, contrato y salario) lo aprueba Elvin.</p>
      </div>
      {arriba}
      <Produccion existe={produccion} />
      <div className="flex gap-1 self-start rounded-full border border-border bg-card/60 p-1 text-sm">
        {(["personas", "puestos", "metas"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 capitalize transition", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>
      {tab === "personas" ? <Personas usuarios={usuarios} perfiles={perfiles} buscar={buscar} gestorPulse={gestorPulse} puestos={puestos} /> : tab === "puestos" ? <Puestos puestos={puestos} /> : <Metas metas={metas} puestos={puestos} />}
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

function Personas({ usuarios, perfiles, buscar, gestorPulse, puestos }: { usuarios: Usuario[]; perfiles: Perfil[]; buscar: string; gestorPulse: boolean; puestos: PuestoUI[] }) {
  const [q, setQ] = useState(buscar);
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
        <FilaPerfil key={u.id} usuario={u} perfil={perfiles.find((p) => p.userId === u.id) ?? null} usuarios={usuarios} gestorPulse={gestorPulse} puestos={puestos} />
      ))}
    </div>
  );
}

function FilaPerfil({ usuario, perfil, usuarios, gestorPulse, puestos }: { usuario: Usuario; perfil: Perfil | null; usuarios: Usuario[]; gestorPulse: boolean; puestos: PuestoUI[] }) {
  const [tocoPulse, setTocoPulse] = useState(false);
  const [nombre, setNombre] = useState(usuario.nombre);
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
    // El acceso a Pulse solo se manda si un admin/editora lo cambió a propósito; si no, decide el servidor.
    const r = await guardarPerfilAction({ ...b, nombre, soloRitmo: gestorPulse && tocoPulse ? b.soloRitmo : undefined });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    if (r.pendientes?.length) toast.success(`${usuario.nombre}: enviado a Elvin para aprobar`, { ...aviso, description: r.pendientes.join(" · "), duration: 8000 });
    else toast.success(`${usuario.nombre}: guardado`, aviso);
    setAbierto(false);
  };
  const puesto = puestos.find((p) => p.id === (perfil?.puesto ?? b.puesto));

  return (
    <div className={cn("panel p-4", !perfil && "opacity-70")}>
      <button type="button" onClick={() => setAbierto((x) => !x)} className="flex w-full items-center gap-3 text-left">
        <span className={cn("size-2 shrink-0 rounded-full", perfil?.activo ? "bg-primary" : "bg-white/20")} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 truncate font-medium">{usuario.nombre}{perfil ? <EmpresaBadge empresa={perfil.empresa} /> : null}</span>
          <span className="block truncate text-xs text-muted-foreground">{perfil ? `${puesto?.nombre} · ${perfil.horaEntrada}–${perfil.horaSalida}${perfil.activo ? "" : " · pausado"}${perfil.slackId ? "" : " · sin Slack"}` : usuario.email}</span>
        </span>
        <span className="text-xs text-primary">{perfil ? "Editar" : "Agregar"}</span>
      </button>
      {abierto ? (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <Campo label="Nombre (se corrige directo)">
            <Input className="h-10" value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} />
          </Campo>
          <Campo label="Puesto">
            <select className={select} value={b.puesto} onChange={(e) => set("puesto", e.target.value)}>
              {!b.puesto ? <option value="">— Escoge el puesto —</option> : null}
              {puestos.map((p) => (
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
          {esPuestoVentas(b.puesto) ? (
            <Campo label="También vende en">
              <select className={select} value={b.tambienEn ?? ""} onChange={(e) => set("tambienEn", e.target.value || null)}>
                <option value="">— Solo en su empresa —</option>
                {b.empresa !== "level_up" ? <option value="level_up">Level Up</option> : null}
                {b.empresa !== "ai_borinquen" ? <option value="ai_borinquen">AI Borinquen</option> : null}
              </select>
            </Campo>
          ) : null}
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
          <Campo label="Slack (para sus avisos)">
            <Input className="h-10" value={b.slackId ?? ""} onChange={(e) => set("slackId", e.target.value.trim() || null)} placeholder="Se busca solo por el nombre" />
          </Campo>
          {gestorPulse && perfil ? (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={!b.soloRitmo} onChange={(e) => { setTocoPulse(true); set("soloRitmo", !e.target.checked); }} className="size-4 accent-[var(--neon)]" />
              También puede entrar a Pulse (clientes, Leads, Tesorería)
            </label>
          ) : null}
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
  const [tieneClave, setTieneClave] = useState(false);
  // Olvidó la clave (30/sep): RR.HH. le manda un link para crear una nueva, sin pasar por Elvin ni Nico.
  const resetear = async () => {
    setCargando(true);
    const r = await linkAccesoAction(userId, true);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    const texto = `Hola ${nombre.split(" ")[0]}: abre este link para crear tu clave nueva de Ritmo (es la misma de Pulse). Vence en 72 horas y sirve una sola vez: ${r.url}`;
    setUrl(texto);
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`Mensaje con el link para ${nombre.split(" ")[0]} copiado (vence en 72 h)`, aviso);
    } catch {
      toast.success("Link listo: cópialo abajo", aviso);
    }
  };
  const generar = async () => {
    setCargando(true);
    const r = await linkAccesoAction(userId);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    // Ya tiene clave (usa Pulse): no necesita link; se le manda cómo entrar. Si la olvidó, Carilin/Aure/Elvin le generan uno.
    const texto = r.yaTieneClave
      ? `Hola ${nombre.split(" ")[0]}: entra a Ritmo en https://ritmo.levelupmediapr.net con tu correo ${r.yaTieneClave.email} y la MISMA clave que ya creaste (la que usas para Pulse o Leads). Si no la recuerdas, avísame y te mandamos un link para crear una nueva.`
      : r.url;
    setUrl(texto);
    setTieneClave(!!r.yaTieneClave);
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(r.yaTieneClave ? `${nombre.split(" ")[0]} ya tiene clave: mensaje para mandarle copiado` : `Link de ${nombre.split(" ")[0]} copiado (vence en 72 h)`, aviso);
    } catch {
      toast.success("Link listo: cópialo abajo", aviso);
    }
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <Button variant="outline" onClick={generar} disabled={cargando} className="rounded-full">
        {cargando ? <Loader2 className="animate-spin" /> : <KeyRound />} Link de acceso
      </Button>
      {tieneClave ? (
        <Button variant="outline" onClick={resetear} disabled={cargando} className="rounded-full border-[color:var(--coral)]/40 text-[color:var(--coral)]">
          Olvidó su clave: link para una nueva
        </Button>
      ) : null}
      {url ? <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-9 min-w-0 flex-1 text-xs" /> : null}
    </div>
  );
}

// Puestos (29/sep): RR.HH. y la dirección crean los que falten sin pedírselo a Nico. Nacen sin KPIs (la nota sale de la
// asistencia); asignárselo a alguien sigue siendo un cambio que aprueba Elvin.
function Puestos({ puestos }: { puestos: PuestoUI[] }) {
  const [f, setF] = useState({ nombre: "", departamento: "" });
  const [cargando, setCargando] = useState(false);
  const deps = [...new Set(puestos.map((p) => p.departamento))];
  const crear = async () => {
    setCargando(true);
    const r = await crearPuestoAction(f);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(`Puesto «${f.nombre.trim()}» creado. Ya lo puedes escoger en Personas.`, aviso);
    setF({ nombre: "", departamento: "" });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="panel flex flex-col gap-3 p-4">
        <p className="font-medium">Crear un puesto</p>
        <p className="text-sm text-muted-foreground">Si el puesto de alguien no está en la lista, créalo aquí. Nace sin KPIs: su nota sale de la asistencia hasta que se le definan.</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Input className="h-10" placeholder="Nombre del puesto (ej.: Community Manager)" value={f.nombre} maxLength={60} onChange={(e) => setF((x) => ({ ...x, nombre: e.target.value }))} />
          <Input className="h-10" list="departamentos" placeholder="Departamento (ej.: Contenido)" value={f.departamento} maxLength={40} onChange={(e) => setF((x) => ({ ...x, departamento: e.target.value }))} />
          <datalist id="departamentos">
            {deps.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <Button className="h-10 rounded-full" onClick={crear} disabled={cargando || f.nombre.trim().length < 3 || f.departamento.trim().length < 3}>
            {cargando ? <Loader2 className="animate-spin" /> : <Plus />} Crear
          </Button>
        </div>
      </div>
      {deps.map((d) => (
        <div key={d} className="panel p-4">
          <p className="mb-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{d}</p>
          <div className="flex flex-wrap gap-2">
            {puestos
              .filter((p) => p.departamento === d)
              .map((p) => (
                <span key={p.id} className={cn("rounded-full px-3 py-1 text-sm ring-1", p.nuevo ? "bg-primary/10 text-primary ring-primary/30" : "ring-border")}>
                  {p.nombre}
                </span>
              ))}
          </div>
        </div>
      ))}
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

function Metas({ metas, puestos }: { metas: OverrideMeta[]; puestos: PuestoUI[] }) {
  const [puesto, setPuesto] = useState(puestos[0]?.id ?? "");
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Score = 20 % asistencia + 80 % KPIs. Cada KPI se compara con su meta; el peso dice cuánto pesa dentro del puesto (0 = solo informativo). Las primeras semanas son de calibración: ajusta con los números reales.
      </p>
      <select className={cn(select, "max-w-xs")} value={puesto} onChange={(e) => setPuesto(e.target.value)}>
        {puestos.map((p) => (
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
