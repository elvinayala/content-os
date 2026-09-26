"use client";

import { ArrowUpRight, BadgeDollarSign, Briefcase, Check, ExternalLink, Handshake, Loader2, MapPin, Pencil, Plus, Rocket, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { aplicarVacanteAction, estadoPostulacionAction, guardarVacanteAction, referirVacanteAction, retirarPostulacionAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CIERRES, etapasDe, MODALIDADES, nombreEstado } from "@/lib/desempeno/carreras-reglas";
import { cn } from "@/lib/utils";

import { EmpresaBadge } from "./piezas";

const aviso = { className: "ritmo" };
const select = "h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";
const cuando = (iso: string) => new Date(iso).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" });
const modalidad = (m: string) => MODALIDADES.find((x) => x.id === m)?.nombre ?? m;

export type VacanteUI = {
  id: string;
  titulo: string;
  empresa: string;
  departamento: string | null;
  modalidad: string;
  ubicacion: string | null;
  descripcion: string;
  requisitos: string | null;
  salario: string | null;
  bonoReferido: number;
  estado: string;
  createdAt: string;
  nueva: boolean;
  yaAplico: boolean;
  internas?: number;
  referidos?: number;
};

export type PostulacionUI = {
  id: string;
  vacante: string;
  tipo: string;
  persona?: string;
  candidatoNombre: string | null;
  candidatoEmail: string | null;
  candidatoTelefono: string | null;
  relacion: string | null;
  motivo: string;
  enlace: string | null;
  estado: string;
  notaRrhh: string | null;
  bono: number;
  bonoMes: string | null;
  bonoPagado: boolean;
  createdAt: string;
};

function Campo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Tarjeta de una vacante: lo esencial arriba; descripción y requisitos al abrir. */
export function TarjetaVacante({ v, maestro }: { v: VacanteUI; maestro: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [modo, setModo] = useState<null | "aplicar" | "referir" | "editar">(null);
  const cerrada = v.estado !== "abierta";
  return (
    <article className={cn("panel flex flex-col gap-4 p-5", cerrada && "opacity-70")}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-primary/10 text-primary">
          <Briefcase className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{v.titulo}</h3>
            {v.nueva && !cerrada ? <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary uppercase">Nueva</span> : null}
            {cerrada ? <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase ring-1 ring-white/10">{v.estado}</span> : null}
            {maestro ? <EmpresaBadge empresa={v.empresa} siempre /> : null}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {v.departamento ? <span>{v.departamento}</span> : null}
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {modalidad(v.modalidad)}
              {v.ubicacion ? ` · ${v.ubicacion}` : ""}
            </span>
            {v.salario ? <span className="num">{v.salario}</span> : null}
            <span className="font-mono text-[11px] tracking-wider">{cuando(v.createdAt)}</span>
          </p>
        </div>
        {maestro ? (
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setModo("editar")}>
            <Pencil className="size-3.5" /> Editar
          </Button>
        ) : null}
      </div>

      <div className="text-sm leading-relaxed text-foreground/85">
        <p className={cn("whitespace-pre-line", !abierta && "line-clamp-3")}>{v.descripcion}</p>
        {abierta && v.requisitos ? (
          <div className="mt-3">
            <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Lo que buscamos</p>
            <p className="mt-1 whitespace-pre-line">{v.requisitos}</p>
          </div>
        ) : null}
        {v.descripcion.length > 180 || v.requisitos ? (
          <button type="button" onClick={() => setAbierta((x) => !x)} className="mt-2 text-xs font-medium text-primary hover:underline">
            {abierta ? "Ver menos" : "Ver más"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        {maestro ? (
          <span className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            {v.internas ?? 0} aplicaciones · {v.referidos ?? 0} referidos
          </span>
        ) : null}
        {!cerrada ? (
          <>
            <Button variant="outline" className="ml-auto h-10 rounded-full" onClick={() => setModo("referir")}>
              <Handshake className="size-4" /> Referir <span className="font-mono text-xs text-[color:var(--coral)]">+US${v.bonoReferido}</span>
            </Button>
            {v.yaAplico ? (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary/10 px-4 text-sm text-primary ring-1 ring-primary/30">
                <Check className="size-4" /> Ya aplicaste
              </span>
            ) : (
              <Button className="h-10 rounded-full" onClick={() => setModo("aplicar")}>
                <Rocket className="size-4" /> Aplicar
              </Button>
            )}
          </>
        ) : null}
      </div>

      {modo === "aplicar" ? <DialogoAplicar v={v} cerrar={() => setModo(null)} /> : null}
      {modo === "referir" ? <DialogoReferir v={v} cerrar={() => setModo(null)} /> : null}
      {modo === "editar" ? <EditorVacante v={v} cerrar={() => setModo(null)} /> : null}
    </article>
  );
}

function DialogoAplicar({ v, cerrar }: { v: VacanteUI; cerrar: () => void }) {
  const [f, setF] = useState({ motivo: "", enlace: "" });
  const [cargando, setCargando] = useState(false);
  const enviar = async () => {
    setCargando(true);
    const r = await aplicarVacanteAction({ vacanteId: v.id, ...f });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("¡Aplicación enviada! RR.HH. te avisa por Slack cómo va.", aviso);
    cerrar();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="ritmo sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aplicar a {v.titulo}</DialogTitle>
          <DialogDescription>Para crecer o cambiar de puesto dentro del equipo. Solo RR.HH. ve tu aplicación.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Campo label="¿Por qué te interesa y qué aportarías?">
            <Textarea rows={5} value={f.motivo} onChange={(e) => setF((x) => ({ ...x, motivo: e.target.value }))} placeholder="Ej.: llevo 1 año como trafficker, manejo 8 cuentas y quiero crecer a estratega…" />
          </Campo>
          <Campo label="Enlace (opcional): LinkedIn, portafolio o CV">
            <Input className="h-10" value={f.enlace} onChange={(e) => setF((x) => ({ ...x, enlace: e.target.value }))} placeholder="https://" />
          </Campo>
        </div>
        <DialogFooter>
          <Button onClick={enviar} disabled={cargando} className="h-11 rounded-full px-6">
            {cargando ? <Loader2 className="animate-spin" /> : <Rocket className="size-4" />} Enviar aplicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoReferir({ v, cerrar }: { v: VacanteUI; cerrar: () => void }) {
  const [f, setF] = useState({ nombre: "", email: "", telefono: "", relacion: "", motivo: "", enlace: "" });
  const [cargando, setCargando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const enviar = async () => {
    setCargando(true);
    const r = await referirVacanteAction({ vacanteId: v.id, ...f });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("¡Gracias por referir! Te avisamos cómo va.", aviso);
    cerrar();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="ritmo sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Referir para {v.titulo}</DialogTitle>
          <DialogDescription>
            Si la contratamos y completa su onboarding, te damos <b className="text-[color:var(--coral)]">US${v.bonoReferido}</b> en tu nómina.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre completo" className="sm:col-span-2">
            <Input className="h-10" value={f.nombre} onChange={set("nombre")} />
          </Campo>
          <Campo label="Correo">
            <Input className="h-10" type="email" value={f.email} onChange={set("email")} />
          </Campo>
          <Campo label="Teléfono / WhatsApp">
            <Input className="h-10" inputMode="tel" value={f.telefono} onChange={set("telefono")} />
          </Campo>
          <Campo label="¿De dónde la conoces?" className="sm:col-span-2">
            <Input className="h-10" value={f.relacion} onChange={set("relacion")} placeholder="Ex compañero, amiga, familiar…" />
          </Campo>
          <Campo label="¿Por qué la recomiendas?" className="sm:col-span-2">
            <Textarea rows={4} value={f.motivo} onChange={set("motivo")} />
          </Campo>
          <Campo label="Enlace (opcional): LinkedIn, portafolio o CV" className="sm:col-span-2">
            <Input className="h-10" value={f.enlace} onChange={set("enlace")} placeholder="https://" />
          </Campo>
        </div>
        <DialogFooter>
          <Button onClick={enviar} disabled={cargando} className="h-11 rounded-full px-6">
            {cargando ? <Loader2 className="animate-spin" /> : <Handshake className="size-4" />} Enviar referido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const VACIA = { titulo: "", empresa: "level_up", departamento: "", modalidad: "remoto", ubicacion: "", descripcion: "", requisitos: "", salario: "", bonoReferido: "100", estado: "abierta" };

export function NuevaVacante({ empresas }: { empresas: { id: string; nombre: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button className="h-10 rounded-full" onClick={() => setAbierto(true)}>
        <Plus className="size-4" /> Publicar vacante
      </Button>
      {abierto ? <EditorVacante empresas={empresas} cerrar={() => setAbierto(false)} /> : null}
    </>
  );
}

function EditorVacante({ v, empresas = [{ id: "level_up", nombre: "Level Up" }, { id: "ai_borinquen", nombre: "AI Borinquen" }], cerrar }: { v?: VacanteUI; empresas?: { id: string; nombre: string }[]; cerrar: () => void }) {
  const [f, setF] = useState(() =>
    v
      ? { titulo: v.titulo, empresa: v.empresa, departamento: v.departamento ?? "", modalidad: v.modalidad, ubicacion: v.ubicacion ?? "", descripcion: v.descripcion, requisitos: v.requisitos ?? "", salario: v.salario ?? "", bonoReferido: String(v.bonoReferido), estado: v.estado }
      : VACIA,
  );
  const [cargando, setCargando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const guardar = async () => {
    setCargando(true);
    const r = await guardarVacanteAction({ id: v?.id ?? null, ...f });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(v ? "Vacante actualizada" : "Vacante publicada", aviso);
    cerrar();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="ritmo max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{v ? "Editar vacante" : "Publicar vacante"}</DialogTitle>
          <DialogDescription>Aparece al instante en Carreras para todo el equipo. La empresa solo la ve la vista maestra.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Título del puesto" className="sm:col-span-2">
            <Input className="h-10" value={f.titulo} onChange={set("titulo")} placeholder="Ej.: Estratega digital Sr." />
          </Campo>
          <Campo label="Empresa">
            <select className={select} value={f.empresa} onChange={set("empresa")}>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Departamento">
            <Input className="h-10" value={f.departamento} onChange={set("departamento")} placeholder="Estrategia y tráfico" />
          </Campo>
          <Campo label="Modalidad">
            <select className={select} value={f.modalidad} onChange={set("modalidad")}>
              {MODALIDADES.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Ubicación (opcional)">
            <Input className="h-10" value={f.ubicacion} onChange={set("ubicacion")} placeholder="Colombia · LatAm" />
          </Campo>
          <Campo label="Qué hará la persona" className="sm:col-span-2">
            <Textarea rows={5} value={f.descripcion} onChange={set("descripcion")} />
          </Campo>
          <Campo label="Lo que buscamos (opcional)" className="sm:col-span-2">
            <Textarea rows={4} value={f.requisitos} onChange={set("requisitos")} />
          </Campo>
          <Campo label="Salario (opcional, lo ve el equipo)">
            <Input className="h-10" value={f.salario} onChange={set("salario")} placeholder="US$900 – 1,200 / mes" />
          </Campo>
          <Campo label="Bono por referido (US$)">
            <Input className="h-10" inputMode="numeric" value={f.bonoReferido} onChange={set("bonoReferido")} />
          </Campo>
          {v ? (
            <Campo label="Estado">
              <select className={select} value={f.estado} onChange={set("estado")}>
                <option value="abierta">Abierta</option>
                <option value="pausada">Pausada (no se ve)</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </Campo>
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={guardar} disabled={cargando} className="h-11 rounded-full px-6">
            {cargando ? <Loader2 className="animate-spin" /> : null} {v ? "Guardar" : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Camino de etapas (puntos + línea) de un caso. */
function Camino({ tipo, estado }: { tipo: string; estado: string }) {
  const etapas = etapasDe(tipo);
  const cerrado = CIERRES.some((c) => c.id === estado);
  const i = etapas.findIndex((e) => e.id === estado);
  return (
    <div className="flex items-center gap-1.5">
      {etapas.map((e, n) => (
        <div key={e.id} className="flex items-center gap-1.5" title={e.nombre}>
          <span className={cn("size-2 rounded-full", !cerrado && n <= i ? "punto-luz bg-primary text-primary" : "bg-white/15")} />
          {n < etapas.length - 1 ? <span className={cn("h-px w-4 sm:w-6", !cerrado && n < i ? "bg-primary/60" : "bg-white/10")} /> : null}
        </div>
      ))}
      <span className={cn("ml-2 text-xs", cerrado ? "text-muted-foreground" : "text-primary")}>{nombreEstado(estado)}</span>
    </div>
  );
}

/** Mis aplicaciones y referidos. */
export function MisCasos({ casos }: { casos: PostulacionUI[] }) {
  const [cargando, setCargando] = useState<string | null>(null);
  const retirar = async (id: string) => {
    setCargando(id);
    const r = await retirarPostulacionAction(id);
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Retirada", aviso);
  };
  return (
    <div className="panel divide-y divide-border/60 overflow-hidden">
      {casos.map((c) => (
        <div key={c.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {c.tipo === "referido" ? (
                <>
                  Referiste a <b>{c.candidatoNombre}</b> <span className="text-muted-foreground">para</span> {c.vacante}
                </>
              ) : (
                <>
                  Aplicaste a <b>{c.vacante}</b>
                </>
              )}
            </p>
            <div className="mt-1.5">
              <Camino tipo={c.tipo} estado={c.estado} />
            </div>
            {c.bonoPagado ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--coral)]/15 px-2.5 py-1 text-xs text-[color:var(--coral)] ring-1 ring-[color:var(--coral)]/30">
                <BadgeDollarSign className="size-3.5" /> Bono de US${c.bono} en tu nómina de {c.bonoMes}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground">{cuando(c.createdAt)}</span>
            {c.estado === "recibida" ? (
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" disabled={cargando === c.id} onClick={() => retirar(c.id)}>
                {cargando === c.id ? <Loader2 className="animate-spin" /> : <Undo2 className="size-3.5" />} Retirar
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vista maestra: todos los casos, con su etapa editable y el bono automático. */
export function GestionCasos({ casos }: { casos: PostulacionUI[] }) {
  return (
    <div className="panel divide-y divide-border/60 overflow-hidden">
      {casos.map((c) => (
        <FilaCaso key={c.id} c={c} />
      ))}
    </div>
  );
}

function FilaCaso({ c }: { c: PostulacionUI }) {
  const [estado, setEstado] = useState(c.estado);
  const [nota, setNota] = useState(c.notaRrhh ?? "");
  const [cargando, setCargando] = useState(false);
  const cambiado = estado !== c.estado || nota !== (c.notaRrhh ?? "");
  const guardar = async () => {
    setCargando(true);
    const r = await estadoPostulacionAction({ id: c.id, estado, nota });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(r.bono ? `Guardado · bono de US$${r.bono} agregado a la nómina de ${c.persona}` : "Guardado", aviso);
  };
  return (
    <div className="fila flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ring-1", c.tipo === "referido" ? "bg-[color:var(--coral)]/12 text-[color:var(--coral)] ring-[color:var(--coral)]/30" : "bg-primary/10 text-primary ring-primary/30")}>
              {c.tipo === "referido" ? "Referido" : "Interna"}
            </span>
            <b>{c.tipo === "referido" ? c.candidatoNombre : c.persona}</b>
            <span className="text-muted-foreground">→ {c.vacante}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {c.tipo === "referido" ? (
              <>
                Referido por <b className="text-foreground/80">{c.persona}</b>
                {c.relacion ? ` (${c.relacion})` : ""} · {[c.candidatoEmail, c.candidatoTelefono].filter(Boolean).join(" · ")}
              </>
            ) : (
              "Crecimiento interno"
            )}{" "}
            · {cuando(c.createdAt)}
          </p>
        </div>
        {c.bonoPagado ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--coral)]/15 px-2.5 py-1 text-xs text-[color:var(--coral)]">
            <BadgeDollarSign className="size-3.5" /> Bono en nómina {c.bonoMes}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-line text-sm text-foreground/85">{c.motivo}</p>
      {c.enlace ? (
        <a href={c.enlace} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="size-3.5" /> {c.enlace.replace(/^https?:\/\//, "").slice(0, 60)}
        </a>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select className={cn(select, "sm:w-52")} value={estado} onChange={(e) => setEstado(e.target.value)}>
          {etapasDe(c.tipo).map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
          {CIERRES.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        <Input className="h-10 flex-1" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota interna (solo RR.HH.)" />
        <Button onClick={guardar} disabled={!cambiado || cargando} className="h-10 rounded-full">
          {cargando ? <Loader2 className="animate-spin" /> : <ArrowUpRight className="size-4" />} Guardar
        </Button>
      </div>
      {c.tipo === "referido" && !c.bonoPagado && estado === "onboarding_completo" && c.estado !== "onboarding_completo" ? (
        <p className="text-xs text-[color:var(--coral)]">Al guardar se agregan US${c.bono} a la nómina del mes siguiente de {c.persona}.</p>
      ) : null}
    </div>
  );
}
