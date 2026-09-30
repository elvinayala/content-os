"use client";

import { Check, Clock, Laptop, Loader2, Monitor, ShieldAlert, Wifi, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { decidirEquipoAction, decidirPoncheManualAction, decidirRedAction, guardarWifiAction, poncheManualAction, registrarEquipoAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { noEsComputadora, TEXTO_BLOQUEO, type MotivoBloqueo, type PistaEquipo } from "@/lib/desempeno/seguridad-reglas";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };

export type SeguridadUI = { modo: string; exento: boolean; equipo: { nombre: string; estado: string } | null; bloqueo: MotivoBloqueo | null; tieneEquipos: boolean; manualPendientes: number; redNueva?: boolean; wifiPrincipal?: string | null };

/** Pista para el servidor: el iPad con Safari se presenta como Mac (pero es táctil) y la app instalada corre
 * "standalone". Desde ninguno de los dos se poncha (29/sep, Elvin). */
export function pistaEquipo(): PistaEquipo {
  try {
    const ipad = /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
    const app = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return { ipad, app };
  } catch {
    return {};
  }
}

/** null = computadora en el navegador (se puede ponchar); si no, teléfono/tablet o la app instalada. */
export function useFueraDeComputadora(): "movil" | "app" | null {
  const [fuera, setFuera] = useState<"movil" | "app" | null>(null);
  useEffect(() => setFuera(noEsComputadora(navigator.userAgent, pistaEquipo())), []);
  return fuera;
}

/** En el teléfono o en la app, en vez del círculo: el ponche es solo en la computadora de trabajo. */
export function FueraDeComputadora({ motivo, abierto, manual }: { motivo: "movil" | "app"; abierto: boolean; manual: number | null }) {
  return (
    <div className="panel mx-auto flex w-full max-w-md flex-col gap-3 p-6 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25">
        <Monitor className="size-6" />
      </span>
      <h2 className="font-semibold">El ponche se marca en tu computadora</h2>
      <p className="text-sm text-muted-foreground">
        {motivo === "app" ? "La app de Ritmo es para recibir los avisos." : "Desde el teléfono o la tablet no se poncha."} Entrada, almuerzo y salida se marcan solo desde la computadora de trabajo que tienes autorizada, en el navegador.
      </p>
      {abierto ? <p className="text-sm">Tu entrada de hoy está abierta: marca la salida desde tu computadora al terminar.</p> : null}
      {manual !== null ? (
        <>
          <p className="text-[12px] text-muted-foreground">¿No estás en tu computadora? Pide un ponche manual y RR.HH. lo autoriza.</p>
          <div className="flex justify-center">
            <PoncheManual pendientes={manual} />
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Huella del equipo: características estables del navegador y la máquina, en un hash. Sirve para reconocer la
 * computadora si alguien borra las cookies (junto con la red); no identifica a la persona. */
export async function huellaEquipo(): Promise<string | null> {
  try {
    const n = navigator as Navigator & { deviceMemory?: number };
    const partes = [n.userAgent, n.platform, n.language, Intl.DateTimeFormat().resolvedOptions().timeZone, `${screen.width}x${screen.height}x${screen.colorDepth}`, n.hardwareConcurrency, n.deviceMemory ?? "", n.maxTouchPoints].join("|");
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(partes));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

/** En vez del círculo, cuando no puede ponchar desde aquí: registrar esta computadora o pedir ponche manual. */
export function SeguridadPonche({ s }: { s: SeguridadUI }) {
  const [nombre, setNombre] = useState("");
  const [motivo, setMotivo] = useState("");
  const [reemplaza, setReemplaza] = useState(false);
  const [cargando, setCargando] = useState(false);
  const puedeRegistrar = s.bloqueo === "sin-equipo";
  const primera = puedeRegistrar && !s.tieneEquipos;
  const registrar = async () => {
    setCargando(true);
    const r = await registrarEquipoAction({ nombre, huella: await huellaEquipo(), pista: pistaEquipo(), motivo: primera ? undefined : motivo, reemplaza: primera ? false : reemplaza });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(r.estado === "aprobado" ? "¡Listo! Esta es tu computadora de trabajo. Ya puedes ponchar." : "Enviado a RR.HH. Te avisamos por Slack cuando la aprueben.", aviso);
  };
  return (
    <div className="panel mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <div className="flex items-center gap-2 text-amber-300">
        <ShieldAlert className="size-5" />
        <h2 className="font-semibold">{primera ? "Registra tu computadora de trabajo" : "Desde aquí no puedes ponchar"}</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {primera
          ? "Para cuidar la asistencia de todos, solo se poncha desde la computadora con la que trabajas y desde tu red de internet. Hazlo desde la computadora que usas para trabajar (no desde el teléfono)."
          : TEXTO_BLOQUEO[s.bloqueo!]}
      </p>
      {puedeRegistrar ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="equipo">{primera ? "¿Cómo le llamamos a esta computadora?" : "Registrar esta computadora"}</Label>
            <Input id="equipo" value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Laptop HP, Desktop de la casa" className="h-11" />
          </div>
          {!primera ? (
            <>
              <Textarea rows={2} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="¿Por qué? (ej. tengo laptop y desktop · cambié de computadora)" />
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={reemplaza} onChange={(e) => setReemplaza(e.target.checked)} className="size-4 accent-[color:var(--neon)]" />
                Reemplaza a la computadora anterior (ya no la voy a usar)
              </label>
              <p className="text-[11px] text-muted-foreground">Una segunda computadora o un cambio lo aprueba RR.HH.</p>
            </>
          ) : null}
          <Button onClick={registrar} disabled={cargando || nombre.trim().length < 2} className="h-11 rounded-full">
            {cargando ? <Loader2 className="animate-spin" /> : <Laptop className="size-4" />} {primera ? "Esta es mi computadora de trabajo" : "Pedir autorización"}
          </Button>
        </div>
      ) : null}
      <PoncheManual pendientes={s.manualPendientes} />
    </div>
  );
}

const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
const horaPR = () => new Date().toLocaleTimeString("en-GB", { timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit", hour12: false });

/** Pedirle a RR.HH. que marque una entrada o salida (cuando no está en su computadora). */
export function PoncheManual({ pendientes, discreto }: { pendientes: number; discreto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada");
  const [fecha, setFecha] = useState(hoyPR);
  const [hora, setHora] = useState(horaPR);
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const enviar = async () => {
    setCargando(true);
    const r = await poncheManualAction({ tipo, fecha, hora, motivo });
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Enviado a RR.HH. Te avisamos por Slack cuando lo autoricen.", aviso);
    setAbierto(false);
    setMotivo("");
  };
  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", discreto ? "justify-center text-xs" : "")}>
        <Button variant={discreto ? "ghost" : "outline"} size={discreto ? "sm" : "default"} onClick={() => setAbierto(true)} className={cn("rounded-full", !discreto && "h-11")}>
          <Clock className="size-4" /> Pedir ponche manual
        </Button>
        {pendientes ? <span className="text-xs text-amber-300">{pendientes} esperando a RR.HH.</span> : null}
      </div>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="ritmo sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pedir ponche manual</DialogTitle>
            <DialogDescription>Cuando no estás en tu computadora de trabajo. RR.HH. lo revisa y lo autoriza.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex gap-1 rounded-full border border-border p-1 text-sm">
              {(["entrada", "salida"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)} className={cn("flex-1 cursor-pointer rounded-full py-1.5 capitalize transition", tipo === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label>Día</Label>
                <Input type="date" value={fecha} max={hoyPR()} onChange={(e) => setFecha(e.target.value)} className="h-11" />
              </div>
              <div className="flex w-32 flex-col gap-1.5">
                <Label>Hora (PR)</Label>
                <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="h-11" />
              </div>
            </div>
            <Textarea rows={3} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="¿Por qué no pudiste ponchar desde tu computadora?" />
          </div>
          <DialogFooter>
            <Button onClick={enviar} disabled={cargando || motivo.trim().length < 5} className="h-11 rounded-full px-6">
              {cargando ? <Loader2 className="animate-spin" /> : null} Enviar a RR.HH.
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---- Panel de RR.HH. (/ritmo/seguridad) ----

export function BotonesDecision({ id, tipo }: { id: string; tipo: "equipo" | "red" | "manual" }) {
  const [cargando, setCargando] = useState<boolean | null>(null);
  const decidir = async (aprobar: boolean) => {
    if (!aprobar && !confirm(tipo === "equipo" ? "¿Quitarle la autorización a esta computadora?" : "¿Rechazar?")) return;
    setCargando(aprobar);
    const accion = tipo === "equipo" ? decidirEquipoAction : tipo === "red" ? decidirRedAction : decidirPoncheManualAction;
    const r = await accion({ id, aprobar });
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(aprobar ? "Autorizado" : tipo === "equipo" ? "Autorización quitada" : "Rechazado", aviso);
  };
  return (
    <div className="flex shrink-0 gap-1.5">
      <Button size="sm" className="rounded-full" onClick={() => decidir(true)} disabled={cargando !== null}>
        {cargando === true ? <Loader2 className="animate-spin" /> : <Check className="size-3.5" />} Autorizar
      </Button>
      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => decidir(false)} disabled={cargando !== null}>
        {cargando === false ? <Loader2 className="animate-spin" /> : <X className="size-3.5" />} {tipo === "equipo" ? "No" : "Rechazar"}
      </Button>
    </div>
  );
}

export function QuitarEquipo({ id }: { id: string }) {
  const [cargando, setCargando] = useState(false);
  const quitar = async () => {
    if (!confirm("¿Quitarle la autorización a esta computadora? Ya no podrá ponchar desde ahí.")) return;
    setCargando(true);
    const r = await decidirEquipoAction({ id, aprobar: false });
    setCargando(false);
    if (!r.ok) toast.error(r.error, aviso);
  };
  return (
    <button type="button" onClick={quitar} disabled={cargando} className="cursor-pointer text-[11px] text-muted-foreground underline-offset-4 hover:text-red-300 hover:underline">
      {cargando ? "…" : "Quitar"}
    </button>
  );
}

// ─── Wi-Fi principal y red nueva (30/sep, Elvin) ──────────────────────────────────────────────
// La red no bloquea el ponche, pero cada quien dice cuál es su Wi-Fi de trabajo y sabe que no puede usar cualquiera:
// desde Ritmo/Pulse tienen acceso al CRM y a datos de clientes.

export const TEXTO_RED_NUEVA = "Estás conectado a una red distinta a la de siempre y RR.HH. recibe un aviso. Recuerda proteger los datos: con acceso al CRM y a la información de clientes, no uses Wi-Fi públicos ni compartidos (cafés, aeropuertos, centros comerciales).";

export function WifiPrincipal() {
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const r = await guardarWifiAction(nombre);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success("Listo, guardamos tu Wi-Fi principal.", aviso);
  };
  return (
    <form onSubmit={guardar} className="panel flex w-full max-w-md flex-col gap-3 border-primary/30 p-5">
      <div className="flex items-center gap-2 font-semibold">
        <Wifi className="size-4 text-primary" /> ¿Cuál es tu Wi-Fi principal de trabajo?
      </div>
      <p className="text-sm text-muted-foreground">
        Desde aquí tienes acceso al CRM y a datos de clientes. Trabaja siempre desde tu red de confianza (la de tu casa u oficina), nunca desde Wi-Fi públicos o compartidos. Si un día te conectas desde otra red, RR.HH. recibe un aviso.
      </p>
      <div className="flex gap-2">
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del Wi-Fi (ej.: Casa_Fibra_5G)" maxLength={60} required className="h-10" />
        <Button type="submit" disabled={cargando} className="h-10 rounded-full px-5">
          {cargando ? <Loader2 className="animate-spin" /> : null} Guardar
        </Button>
      </div>
    </form>
  );
}

export function AvisoRedNueva({ wifi }: { wifi: string | null | undefined }) {
  return (
    <div className="flex w-full max-w-md items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3 text-xs text-amber-200">
      <Wifi className="mt-0.5 size-4 shrink-0" />
      <span>
        {wifi ? <>No estás en tu Wi-Fi principal («{wifi}»). </> : null}
        {TEXTO_RED_NUEVA}
      </span>
    </div>
  );
}
