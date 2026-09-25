"use client";

import { Check, FileText, Film, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { borrarAjusteAction, borrarArchivoAction, borrarAusenciaAction, crearAjusteAction, crearAusenciaAction, guardarFichaAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usd } from "@/lib/desempeno/rrhh";
import { cn } from "@/lib/utils";

import { BotonSubir } from "./subir";

const aviso = { className: "ritmo" };
const select = "h-10 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";
const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric" });
const peso = (b: number | null) => (b === null ? "" : b > 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function Campo({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

// ─── Datos (solo la vista maestra edita) ──────────────────────────────────────────────────────

export interface DatosFicha {
  userId: string;
  telefono: string | null;
  telefonoAlterno: string | null;
  ciudad: string | null;
  pais: string | null;
  documentoTipo: string | null;
  documentoNumero: string | null;
  salarioMensual: number | null;
  notas: string | null;
  contactoEmergencia: string | null;
}

export function FormDatos({ d }: { d: DatosFicha }) {
  const [v, setV] = useState({
    telefono: d.telefono ?? "",
    telefonoAlterno: d.telefonoAlterno ?? "",
    ciudad: d.ciudad ?? "",
    pais: d.pais ?? "",
    documentoTipo: d.documentoTipo ?? "",
    documentoNumero: d.documentoNumero ?? "",
    salarioMensual: d.salarioMensual?.toString() ?? "",
    notas: d.notas ?? "",
    contactoEmergencia: d.contactoEmergencia ?? "",
  });
  const [cargando, setCargando] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const guardar = async () => {
    setCargando(true);
    const r = await guardarFichaAction({ userId: d.userId, ...v });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Ficha guardada", aviso);
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Campo label="Teléfono"><Input className="h-10" inputMode="tel" value={v.telefono} onChange={set("telefono")} placeholder="+1 787 555 1234" /></Campo>
      <Campo label="Teléfono alterno"><Input className="h-10" inputMode="tel" value={v.telefonoAlterno} onChange={set("telefonoAlterno")} /></Campo>
      <Campo label="Ciudad"><Input className="h-10" value={v.ciudad} onChange={set("ciudad")} placeholder="Medellín" /></Campo>
      <Campo label="País"><Input className="h-10" value={v.pais} onChange={set("pais")} placeholder="Colombia" /></Campo>
      <Campo label="Documento (tipo)"><Input className="h-10" value={v.documentoTipo} onChange={set("documentoTipo")} placeholder="Cédula, pasaporte…" /></Campo>
      <Campo label="Documento (número)"><Input className="h-10" value={v.documentoNumero} onChange={set("documentoNumero")} /></Campo>
      <Campo label="Contacto de emergencia"><Input className="h-10" value={v.contactoEmergencia} onChange={set("contactoEmergencia")} placeholder="Nombre y teléfono" /></Campo>
      <Campo label="Salario mensual (USD)"><Input className="h-10" inputMode="decimal" value={v.salarioMensual} onChange={set("salarioMensual")} placeholder="900" /></Campo>
      <Campo label="Notas de RR.HH." className="sm:col-span-2"><Textarea rows={2} value={v.notas} onChange={set("notas")} /></Campo>
      <div className="flex justify-end sm:col-span-2">
        <Button onClick={guardar} disabled={cargando} className="rounded-full px-6">
          {cargando ? <Loader2 className="animate-spin" /> : <Check />} Guardar datos
        </Button>
      </div>
    </div>
  );
}

// ─── Documentos ───────────────────────────────────────────────────────────────────────────────

export interface ArchivoUI {
  id: string;
  categoria: string;
  nombre: string;
  mime: string | null;
  bytes: number | null;
  createdAt: string;
}

export function Documentos({ userId, archivos, categorias, maestro }: { userId: string; archivos: ArchivoUI[]; categorias: { id: string; nombre: string }[]; maestro: boolean }) {
  const [borrando, setBorrando] = useState<string | null>(null);
  const borrar = async (id: string) => {
    if (!confirm("¿Borrar este archivo? No se puede deshacer.")) return;
    setBorrando(id);
    const r = await borrarArchivoAction(id);
    setBorrando(null);
    if (!r.ok) toast.error(r.error, aviso);
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categorias.map((c) => {
        const lista = archivos.filter((a) => a.categoria === c.id);
        const puedeSubir = maestro || c.id !== "nomina";
        return (
          <div key={c.id} className="rounded-xl border border-border bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{c.nombre}</p>
              {puedeSubir ? <BotonSubir userId={userId} categoria={c.id} accept={c.id === "entrenamiento" ? "video/*,application/pdf,image/*" : undefined} /> : null}
            </div>
            {lista.length ? (
              <ul className="flex flex-col gap-1">
                {lista.map((a) => (
                  <li key={a.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.04]">
                    {a.mime?.startsWith("video/") ? <Film className="size-4 shrink-0 text-[color:var(--coral)]" /> : <FileText className="size-4 shrink-0 text-primary" />}
                    <a href={`/ritmo/archivo/${a.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">
                      {a.nombre}
                    </a>
                    <span className="shrink-0 text-xs text-muted-foreground">{peso(a.bytes)}</span>
                    {maestro ? (
                      <button type="button" aria-label="Borrar" disabled={borrando === a.id} onClick={() => borrar(a.id)} className="rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-400 focus:opacity-100">
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 text-xs text-muted-foreground">Nada todavía.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tiempo libre ─────────────────────────────────────────────────────────────────────────────

export interface AusenciaUI {
  id: string;
  tipo: string;
  desde: string;
  hasta: string;
  dias: number;
  certificado: boolean;
  nota: string | null;
  cargo: { vacaciones: number; enfermedad: number; maternidad: number; sinPaga: number } | null;
}

const TIPOS: Record<string, string> = { vacaciones: "Vacaciones", enfermedad: "Enfermedad", maternidad: "Maternidad", personal: "Ausencia personal" };

export function Ausencias({ userId, lista, maestro }: { userId: string; lista: AusenciaUI[]; maestro: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState({ tipo: "vacaciones", desde: "", hasta: "", dias: "1", certificado: false, nota: "" });
  const [cargando, setCargando] = useState(false);
  const crear = async () => {
    setCargando(true);
    const r = await crearAusenciaAction({ userId, tipo: v.tipo, desde: v.desde, hasta: v.hasta || v.desde, dias: Number(v.dias), certificado: v.certificado, nota: v.nota });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Ausencia registrada", aviso);
    setAbierto(false);
    setV({ tipo: "vacaciones", desde: "", hasta: "", dias: "1", certificado: false, nota: "" });
  };
  const borrar = async (id: string) => {
    if (!confirm("¿Borrar esta ausencia?")) return;
    const r = await borrarAusenciaAction(id);
    if (!r.ok) toast.error(r.error, aviso);
  };
  const cargoTexto = (c: AusenciaUI["cargo"]) =>
    c ? [c.vacaciones && `${c.vacaciones} vac.`, c.enfermedad && `${c.enfermedad} enf.`, c.maternidad && `${c.maternidad} mat.`, c.sinPaga && `${c.sinPaga} sin paga`].filter(Boolean).join(" · ") : "";
  return (
    <div className="flex flex-col gap-3">
      {lista.length ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {lista.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
              <span className="font-medium">{TIPOS[a.tipo] ?? a.tipo}</span>
              <span className="text-muted-foreground">
                {fecha(a.desde)}
                {a.hasta !== a.desde ? ` → ${fecha(a.hasta)}` : ""} · {a.dias} {a.dias === 1 ? "día" : "días"}
                {a.tipo === "enfermedad" ? (a.certificado ? " · con certificado" : " · sin certificado") : ""}
              </span>
              <span className={cn("ml-auto text-xs", a.cargo?.sinPaga ? "text-red-300" : "text-muted-foreground")}>{cargoTexto(a.cargo)}</span>
              {maestro ? (
                <button type="button" aria-label="Borrar" onClick={() => borrar(a.id)} className="rounded p-1 text-muted-foreground hover:text-red-400">
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sin ausencias registradas.</p>
      )}
      {maestro ? (
        abierto ? (
          <div className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-4">
            <Campo label="Tipo">
              <select className={select} value={v.tipo} onChange={(e) => setV((x) => ({ ...x, tipo: e.target.value }))}>
                {Object.entries(TIPOS).map(([id, n]) => (
                  <option key={id} value={id}>{n}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Desde"><Input type="date" className="h-10" value={v.desde} onChange={(e) => setV((x) => ({ ...x, desde: e.target.value }))} /></Campo>
            <Campo label="Hasta"><Input type="date" className="h-10" value={v.hasta} onChange={(e) => setV((x) => ({ ...x, hasta: e.target.value }))} /></Campo>
            <Campo label="Días laborables"><Input type="number" step="0.5" min="0.5" className="h-10" value={v.dias} onChange={(e) => setV((x) => ({ ...x, dias: e.target.value }))} /></Campo>
            {v.tipo === "enfermedad" ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={v.certificado} onChange={(e) => setV((x) => ({ ...x, certificado: e.target.checked }))} className="size-4 accent-[var(--neon)]" />
                Trajo certificado médico válido
              </label>
            ) : null}
            <Campo label="Nota" className="sm:col-span-4"><Input className="h-10" value={v.nota} onChange={(e) => setV((x) => ({ ...x, nota: e.target.value }))} /></Campo>
            <div className="flex justify-end gap-2 sm:col-span-4">
              <Button variant="ghost" onClick={() => setAbierto(false)} className="rounded-full">Cancelar</Button>
              <Button onClick={crear} disabled={cargando || !v.desde} className="rounded-full px-6">
                {cargando ? <Loader2 className="animate-spin" /> : <Check />} Registrar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAbierto(true)} className="self-start rounded-full">
            <Plus /> Registrar ausencia
          </Button>
        )
      ) : null}
    </div>
  );
}

// ─── Nómina ───────────────────────────────────────────────────────────────────────────────────

export function Ajustes({ userId, mes, lista, maestro }: { userId: string; mes: string; lista: { id: string; concepto: string; monto: number }[]; maestro: boolean }) {
  const [v, setV] = useState({ concepto: "", monto: "" });
  const [cargando, setCargando] = useState(false);
  const crear = async () => {
    setCargando(true);
    const r = await crearAjusteAction({ userId, mes, concepto: v.concepto, monto: Number(v.monto) });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setV({ concepto: "", monto: "" });
  };
  const borrar = async (id: string) => {
    const r = await borrarAjusteAction(id);
    if (!r.ok) toast.error(r.error, aviso);
  };
  return (
    <div className="flex flex-col gap-2">
      {lista.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1">{a.concepto}</span>
          <span className={cn("num", a.monto < 0 ? "text-red-300" : "text-primary")}>{a.monto < 0 ? "−" : "+"}{usd(Math.abs(a.monto))}</span>
          {maestro ? (
            <button type="button" aria-label="Borrar" onClick={() => borrar(a.id)} className="rounded p-1 text-muted-foreground hover:text-red-400">
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      {maestro ? (
        <div className="flex gap-2 pt-1">
          <Input className="h-9 flex-1" placeholder="Bono, comisión, descuento…" value={v.concepto} onChange={(e) => setV((x) => ({ ...x, concepto: e.target.value }))} />
          <Input className="h-9 w-28 text-right" inputMode="decimal" placeholder="+100 / −50" value={v.monto} onChange={(e) => setV((x) => ({ ...x, monto: e.target.value.replace("−", "-") }))} />
          <Button size="sm" variant="outline" disabled={cargando || !v.concepto || !v.monto} onClick={crear} className="rounded-full">
            {cargando ? <Loader2 className="animate-spin" /> : <Plus />}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
