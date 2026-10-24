"use client";

import { Check, ChevronDown, ClipboardCheck, Loader2, RotateCcw, SearchX, Send, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cerrarCasoAction, marcarAccionAction, pedirOptimizacionAction } from "@/app/ritmo/cuentas-actions";
import { Button } from "@/components/ui/button";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { Textarea } from "@/components/ui/textarea";
import type { CasoCuenta } from "@/lib/desempeno/optimizaciones";
import { ETIQUETA_CUENTA, progreso, type Accion, type RolCuentas, type cumplimiento } from "@/lib/desempeno/optimizaciones-reglas";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };
const dia = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { weekday: "short", day: "numeric", month: "short" });
const cuando = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short" }) : "");
const PRIORIDAD = { 1: "bg-[color:var(--coral)]", 2: "bg-amber-400", 3: "bg-muted-foreground/50" } as const;

// "*negrita*" de Slack → <b>, línea por línea (el resumen es el mismo que le llega al estratega).
function Resumen({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-[13px] leading-relaxed">
      {texto.split("\n").map((l, i) =>
        l.trim() ? (
          <p key={i}>
            {l.split(/(\*[^*\n]+\*)/g).map((p, j) => (p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <b key={j}>{p.slice(1, -1)}</b> : p))}
          </p>
        ) : (
          <span key={i} className="h-2" />
        ),
      )}
    </div>
  );
}

function FilaAccion({ casoId, a, editable }: { casoId: number; a: Accion; editable: boolean }) {
  const [porque, setPorque] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const marcar = async (estado: string, motivo?: string) => {
    setCargando(true);
    const r = await marcarAccionAction(casoId, a.id, estado, motivo);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setPorque(null);
    if (estado === "ejecutado") toast.success("Marcado como ejecutado", aviso);
  };
  return (
    <li className="flex flex-col gap-2 border-t border-border/50 py-3 first:border-t-0">
      <div className="flex items-start gap-3">
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", PRIORIDAD[a.prioridad])} title={a.prioridad === 1 ? "Urgente" : a.prioridad === 2 ? "Importante" : "Cuando se pueda"} />
        <p className={cn("flex-1 text-sm", a.estado !== "pendiente" && "text-muted-foreground")}>{a.texto}</p>
        {a.estado === "pendiente" && editable ? (
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" className="h-8" disabled={cargando} onClick={() => marcar("ejecutado")}>
              {cargando ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Ejecutado
            </Button>
            <Button size="sm" variant="outline" className="h-8" disabled={cargando} onClick={() => setPorque(porque === null ? "" : null)}>
              <X className="size-3.5" /> No se hizo
            </Button>
          </div>
        ) : a.estado === "ejecutado" ? (
          <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/30">✓ Ejecutado</span>
        ) : a.estado === "no" ? (
          <span className="shrink-0 rounded-full bg-amber-400/12 px-2.5 py-1 text-[11px] font-medium text-amber-200 ring-1 ring-amber-400/30">No se hizo</span>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">Sin marcar</span>
        )}
      </div>
      {a.estado === "no" && a.motivo ? <p className="ml-5 rounded-lg bg-amber-400/[0.06] px-3 py-2 text-[13px]">Por qué: {a.motivo}</p> : null}
      {a.estado !== "pendiente" ? (
        <p className="ml-5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {a.por} · {cuando(a.at)}
          {editable ? (
            <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" disabled={cargando} onClick={() => marcar("pendiente")}>
              <RotateCcw className="size-3" /> Deshacer
            </button>
          ) : null}
        </p>
      ) : null}
      {porque !== null ? (
        <div className="ml-5 flex flex-col gap-2">
          <Textarea autoFocus rows={2} placeholder="¿Por qué no se hizo? (p. ej. el cliente no ha mandado el material nuevo)" value={porque} onChange={(e) => setPorque(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={cargando || porque.trim().length < 8} onClick={() => marcar("no", porque)}>Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => setPorque(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function TarjetaCaso({ c, rol, yo }: { c: CasoCuenta; rol: RolCuentas; yo: string }) {
  const [verResumen, setVerResumen] = useState(false);
  const [modo, setModo] = useState<"bien" | "pedir" | null>(null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const p = progreso(c.acciones);
  const abierta = c.estado === "abierta";
  const editable = abierta && (rol === "direccion" || c.estrategaId === yo);
  const enviar = async () => {
    setCargando(true);
    const r = modo === "bien" ? await cerrarCasoAction(c.id, texto) : await pedirOptimizacionAction(c.id, texto);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(modo === "bien" ? "Cuenta marcada como bien" : "Pedido enviado al estratega", aviso);
    setModo(null);
    setTexto("");
  };
  return (
    <article id={`caso-${c.id}`} className={cn("panel flex scroll-mt-24 flex-col gap-3 p-5", !abierta && "opacity-75")}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{c.empresa || c.cliente}</h3>
          <p className="text-xs text-muted-foreground">
            {c.empresa && c.empresa !== c.cliente ? `${c.cliente} · ` : ""}
            {c.estratega ?? "Sin estratega"} · revisión del {dia(c.fecha)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {abierta ? (
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium ring-1", c.estadoCuenta === "no-optimizada" ? "bg-amber-400/12 text-amber-200 ring-amber-400/30" : "bg-primary/12 text-primary ring-primary/30")}>
              {ETIQUETA_CUENTA[c.estadoCuenta]}
            </span>
          ) : (
            <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary ring-1 ring-primary/30">✅ Bien</span>
          )}
          <span className="num rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
            {p.ejecutadas + p.no} de {p.total} marcados
          </span>
          {abierta && p.completo && rol === "direccion" ? <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] text-sky-300 ring-1 ring-sky-500/30">Todo marcado · revisar</span> : null}
        </div>
      </header>

      <ul className="flex flex-col">
        {c.acciones.map((a) => (
          <FilaAccion key={a.id} casoId={c.id} a={a} editable={editable} />
        ))}
      </ul>

      {c.pedidos.length ? (
        <div className="flex flex-col gap-1.5 rounded-xl bg-[color:var(--coral)]/[0.07] p-3">
          {c.pedidos.map((x, i) => (
            <p key={i} className="text-[13px]">🔧 <b>{x.por}</b> pidió ({cuando(x.at)}): {x.texto}</p>
          ))}
        </div>
      ) : null}
      {!abierta && c.cerradoPor ? <p className="text-xs text-muted-foreground">Marcada bien por {c.cerradoPor} · {cuando(c.cerradoAt)}{c.notaCierre ? ` · ${c.notaCierre}` : ""}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setVerResumen((v) => !v)}>
          <ChevronDown className={cn("size-3.5 transition", verResumen && "rotate-180")} /> {verResumen ? "Ocultar" : "Ver"} el resumen de Max
        </button>
        <span className="flex-1" />
        {abierta && rol === "direccion" ? (
          <>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setModo(modo === "pedir" ? null : "pedir")}>
              <Send className="size-3.5" /> Pedir optimización
            </Button>
            <Button size="sm" className="h-8" onClick={() => setModo(modo === "bien" ? null : "bien")}>
              <ShieldCheck className="size-3.5" /> Ya está bien
            </Button>
          </>
        ) : null}
      </div>
      {verResumen ? <div className="rounded-xl bg-muted/40 p-4"><Resumen texto={c.resumen} /></div> : null}
      {modo ? (
        <div className="flex flex-col gap-2">
          <Textarea autoFocus rows={2} placeholder={modo === "bien" ? "Nota (opcional): qué se arregló" : "¿Qué hay que optimizar? Le llega al estratega por Slack."} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={cargando || (modo === "pedir" && texto.trim().length < 8)} onClick={enviar}>
              {cargando ? <Loader2 className="size-3.5 animate-spin" /> : null} {modo === "bien" ? "Marcar la cuenta como bien" : "Enviar pedido"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setModo(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function Cuentas({ casos, rol, yo, vistaPrevia, resumen }: { casos: CasoCuenta[]; rol: RolCuentas; yo: string; vistaPrevia: boolean; resumen: ReturnType<typeof cumplimiento> }) {
  const [ver, setVer] = useState<"abiertas" | "cerradas">("abiertas");
  const [estratega, setEstratega] = useState("");
  const estrategas = [...new Map(casos.map((c) => [c.estrategaId ?? "—", c.estratega ?? "Sin estratega"])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const lista = casos.filter((c) => (ver === "abiertas" ? c.estado === "abierta" : c.estado !== "abierta") && (!estratega || (c.estrategaId ?? "—") === estratega));
  const abiertas = casos.filter((c) => c.estado === "abierta");
  const sinMarcar = abiertas.reduce((s, c) => s + progreso(c.acciones).pendientes, 0);
  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <p className="ceja">Revisión de cuentas · Max</p>
        <h1 className="text-2xl font-semibold tracking-tight">{rol === "direccion" ? "Cuentas por optimizar" : "Mis cuentas por optimizar"}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Lo que pidió la revisión de Max. Marca cada punto: <b>Ejecutado</b>, o <b>No se hizo</b> con el porqué.
          {rol === "direccion" ? " Cuando la cuenta ya esté bien, márcala; si hace falta más, pide la optimización." : ""}
        </p>
      </header>

      {vistaPrevia ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm">
          👀 <b>Vista previa: solo tú lo ves.</b> Los estrategas todavía no reciben nada. Se prende cuando Carilin verifique los montos en Pulse.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="text-xs text-muted-foreground">Cuentas abiertas</p><p className="num mt-1 text-2xl font-semibold">{abiertas.length}</p></div>
        <div className="panel p-4"><p className="text-xs text-muted-foreground">No optimizadas</p><p className="num mt-1 text-2xl font-semibold text-amber-200">{abiertas.filter((c) => c.estadoCuenta === "no-optimizada").length}</p></div>
        <div className="panel p-4"><p className="text-xs text-muted-foreground">Puntos sin marcar</p><p className="num mt-1 text-2xl font-semibold text-[color:var(--coral)]">{sinMarcar}</p></div>
      </section>

      {rol === "direccion" && resumen.length ? (
        <section className="panel overflow-x-auto p-5">
          <h2 className="mb-3 font-semibold">Por estratega · últimos 30 días</h2>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr><th className="pb-2 font-normal">Estratega</th><th className="pb-2 font-normal">Abiertas</th><th className="pb-2 font-normal">Sin marcar</th><th className="pb-2 font-normal">Marcó</th><th className="pb-2 font-normal">Ejecutó</th></tr>
            </thead>
            <tbody>
              {resumen.map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="py-2">{r.estratega}</td>
                  <td className="num py-2">{r.abiertos}</td>
                  <td className={cn("num py-2", r.pendientes && "text-[color:var(--coral)]")}>{r.pendientes}</td>
                  <td className="num py-2">{r.marcado == null ? "—" : `${r.marcado} %`}</td>
                  <td className="num py-2">{r.ejecutado == null ? "—" : `${r.ejecutado} %`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {(["abiertas", "cerradas"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setVer(v)} className={cn("rounded-full px-3.5 py-1.5 text-sm transition", ver === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
            {v === "abiertas" ? "Abiertas" : "Cerradas"}
          </button>
        ))}
        {rol === "direccion" && estrategas.length > 1 ? (
          <select className="ml-auto h-9 rounded-lg border border-input bg-card px-2.5 text-sm" value={estratega} onChange={(e) => setEstratega(e.target.value)}>
            <option value="">Todos los estrategas</option>
            {estrategas.map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        ) : null}
      </div>

      {lista.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {lista.map((c) => (
            <TarjetaCaso key={c.id} c={c} rol={rol} yo={yo} />
          ))}
        </div>
      ) : (
        <div className="panel">
          {estratega ? (
            <EstadoVacio
              icono={SearchX}
              tipo="filtro"
              titulo={ver === "abiertas" ? "Ese estratega no tiene cuentas pendientes" : "Ese estratega no tiene cuentas cerradas"}
              accion={
                <Button variant="outline" className="rounded-full" onClick={() => setEstratega("")}>
                  Ver todos los estrategas
                </Button>
              }
            />
          ) : (
            <EstadoVacio icono={ClipboardCheck} titulo={ver === "abiertas" ? "Nada pendiente 🎉" : "Todavía no hay cuentas cerradas"}>
              {ver === "abiertas" ? "Cuando Max revise las cuentas y algo necesite optimizarse, el caso aparece aquí." : "Las cuentas que se cierren después de optimizarlas quedan aquí de historial."}
            </EstadoVacio>
          )}
        </div>
      )}
    </div>
  );
}
