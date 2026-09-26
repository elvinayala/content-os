"use client";

import { ArrowLeft, CalendarPlus, CheckSquare, MessageCircle, StickyNote, Trash2, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { actividadAction, actualizarLeadAction, cerrarLeadAction, completarActividadAction, eliminarLeadAction, marcarLeidoAction, moverLeadAction, notaAction, whatsappAction } from "@/app/pulse/(app)/leads/actions";
import { ICONO_ACTIVIDAD } from "@/components/leads/actividades";
import { PerdidoDialog, type UsuarioUI } from "@/components/leads/dialogos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { diasEnEtapa, estadoActividad, telefonoLegible } from "@/lib/leads/reglas";
import { cn } from "@/lib/utils";

export interface DetalleUI {
  trato: {
    id: string;
    nombre: string;
    negocio: string | null;
    telefono: string | null;
    email: string | null;
    valor: number;
    duenoId: string | null;
    estado: string;
    motivoPerdida: string | null;
    origen: string;
    agendoPor: string | null;
    etapaId: string;
    embudoId: string;
    etapaDesde: string;
    createdAt: string;
    noLeidos: number;
    datos: Record<string, unknown>;
    tieneChat: boolean;
  };
  etapas: { id: string; nombre: string }[];
  embudos: { id: string; nombre: string }[];
  historial: { id: string; tipo: string; texto: string; createdAt: string; autor: string | null }[];
  actividades: { id: string; tipo: string; asunto: string; venceAt: string; hecha: boolean; asignado: string | null }[];
}

const TZ = "America/Puerto_Rico";
const cuando = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function manana10(): string {
  const d = new Date(Date.now() + 86_400_000);
  const ymd = d.toLocaleDateString("en-CA", { timeZone: TZ });
  return `${ymd}T10:00`;
}

export function DetalleLead({ d, marcaSlug, usuarios, puedeBorrar, etapasDeOtros }: { d: DetalleUI; marcaSlug: string; usuarios: UsuarioUI[]; puedeBorrar: boolean; etapasDeOtros: Record<string, { id: string; nombre: string }[]> }) {
  const router = useRouter();
  const t = d.trato;
  const [pend, start] = useTransition();
  const [pestana, setPestana] = useState<"whatsapp" | "nota" | "actividad">(t.telefono ? "whatsapp" : "nota");
  const [texto, setTexto] = useState("");
  const [act, setAct] = useState({ tipo: "llamada", asunto: "Llamar", venceAt: manana10() });
  const [perdido, setPerdido] = useState(false);
  const [f, setF] = useState({ nombre: t.nombre, negocio: t.negocio ?? "", telefono: t.telefono ?? "", email: t.email ?? "", valor: String(t.valor) });

  useEffect(() => {
    if (t.noLeidos > 0) void marcarLeidoAction(t.id);
  }, [t.id, t.noLeidos]);

  const correr = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string, despues?: () => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error ?? "No se pudo");
      if (ok) toast.success(ok);
      despues?.();
      router.refresh();
    });

  const guardarCampo = (k: keyof typeof f) => {
    const actual = k === "valor" ? String(t.valor) : ((t as unknown as Record<string, string | null>)[k] ?? "");
    if (f[k] === actual) return;
    correr(() => actualizarLeadAction(t.id, { [k]: k === "valor" ? Number(f[k]) || 0 : f[k] }));
  };

  const enviar = () => {
    const x = texto.trim();
    if (!x) return;
    if (pestana === "whatsapp") correr(() => whatsappAction(t.id, x), "Enviado por WhatsApp", () => setTexto(""));
    else correr(() => notaAction(t.id, x), "Nota guardada", () => setTexto(""));
  };

  const idxEtapa = d.etapas.findIndex((e) => e.id === t.etapaId);
  const pendientes = d.actividades.filter((a) => !a.hecha);
  const cerrado = t.estado !== "abierto";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start gap-3">
        <Link href={`/pulse/leads/${marcaSlug}?embudo=${t.embudoId}`} className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Volver al embudo">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{t.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            ${t.valor.toLocaleString("en-US")}
            {t.negocio ? ` · ${t.negocio}` : ""} · creado {cuando(t.createdAt)} · {t.origen}
            {t.agendoPor ? ` · agendó ${t.agendoPor}` : ""}
          </p>
        </div>
        {cerrado ? (
          <div className="flex items-center gap-2">
            <span className={cn("rounded-md px-3 py-1.5 text-sm font-bold uppercase", t.estado === "ganado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
              {t.estado}
              {t.motivoPerdida ? ` · ${t.motivoPerdida}` : ""}
            </span>
            <Button variant="outline" size="sm" disabled={pend} onClick={() => correr(() => cerrarLeadAction(t.id, "abierto"), "Reabierto")}>
              Reabrir
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" disabled={pend} className="bg-[#08a742] text-white hover:bg-[#07923a]" onClick={() => correr(() => cerrarLeadAction(t.id, "ganado"), "🏆 Ganado")}>
              <Trophy className="size-4" /> Ganado
            </Button>
            <Button size="sm" disabled={pend} className="bg-red-600 text-white hover:bg-red-700" onClick={() => setPerdido(true)}>
              Perdido
            </Button>
          </div>
        )}
      </div>

      {/* Barra de etapas (clic para mover), la firma de Pipedrive */}
      <div className="mt-4 flex overflow-x-auto rounded-md">
        {d.etapas.map((e, i) => (
          <button
            key={e.id}
            disabled={pend || cerrado}
            onClick={() => e.id !== t.etapaId && correr(() => moverLeadAction(t.id, e.id, null, null), `→ ${e.nombre}`)}
            title={e.nombre}
            className={cn(
              "relative min-w-24 flex-1 truncate px-4 py-1.5 text-[11px] font-medium transition [clip-path:polygon(0_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,0_100%,8px_50%)] first:[clip-path:polygon(0_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,0_100%)]",
              i <= idxEtapa ? "bg-[#08a742] text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20",
              i === idxEtapa && "font-bold",
            )}
          >
            {e.nombre}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{diasEnEtapa(t.etapaDesde)} días en esta etapa</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Resumen editable */}
        <aside className="grid content-start gap-3 rounded-lg border bg-background p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen</h2>
          {(
            [
              ["nombre", "Persona"],
              ["negocio", "Negocio"],
              ["telefono", "WhatsApp / teléfono"],
              ["email", "Email"],
              ["valor", "Valor (USD)"],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className="grid gap-1 text-xs text-muted-foreground">
              {l}
              <Input className="h-8 text-sm text-foreground" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} onBlur={() => guardarCampo(k)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
            </label>
          ))}
          {t.telefono && (
            <a href={`https://wa.me/${t.telefono}`} target="_blank" rel="noreferrer" className="-mt-1 text-xs text-[#128c7e] hover:underline">
              {telefonoLegible(t.telefono)} · abrir en WhatsApp
            </a>
          )}
          <label className="grid gap-1 text-xs text-muted-foreground">
            Dueño
            <select className="h-8 rounded-md border bg-background px-2 text-sm text-foreground" defaultValue={t.duenoId ?? ""} onChange={(e) => correr(() => actualizarLeadAction(t.id, { duenoId: e.target.value || null }), "Dueño cambiado")}>
              <option value="">Sin asignar</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Embudo
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
              value={t.embudoId}
              disabled={cerrado}
              onChange={(e) => {
                const primera = etapasDeOtros[e.target.value]?.[0];
                if (primera) correr(() => moverLeadAction(t.id, primera.id, null, null), "Movido de embudo");
              }}
            >
              {d.embudos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
          {Object.keys(t.datos).length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Más datos</summary>
              <dl className="mt-2 grid gap-1">
                {Object.entries(t.datos)
                  .filter(([, v]) => v != null && v !== "" && typeof v !== "object")
                  .map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
                      <dt className="truncate text-muted-foreground">{k}</dt>
                      <dd className="break-words">{String(v)}</dd>
                    </div>
                  ))}
              </dl>
            </details>
          )}
          {puedeBorrar && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-self-start text-muted-foreground hover:text-red-600"
              onClick={() => {
                if (confirm(`¿Borrar a ${t.nombre}? No se puede deshacer.`)) correr(() => eliminarLeadAction(t.id), "Borrado", () => router.push(`/pulse/leads/${marcaSlug}`));
              }}
            >
              <Trash2 className="size-4" /> Borrar lead
            </Button>
          )}
        </aside>

        <section className="grid content-start gap-4">
          {/* Compositor: WhatsApp · Nota · Actividad */}
          <div className="rounded-lg border bg-background">
            <div className="flex border-b text-sm">
              {(
                [
                  ["whatsapp", MessageCircle, "WhatsApp"],
                  ["nota", StickyNote, "Nota"],
                  ["actividad", CalendarPlus, "Seguimiento"],
                ] as const
              ).map(([k, I, l]) => (
                <button key={k} onClick={() => setPestana(k)} className={cn("flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-medium", pestana === k ? "border-[#08a742] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  <I className="size-4" /> {l}
                </button>
              ))}
            </div>
            <div className="p-3">
              {pestana === "actividad" ? (
                <div className="grid gap-2 sm:grid-cols-[130px_1fr_190px_auto]">
                  <select className="h-9 rounded-md border bg-background px-2 text-sm" value={act.tipo} onChange={(e) => setAct({ ...act, tipo: e.target.value, asunto: { llamada: "Llamar", whatsapp: "Escribir por WhatsApp", reunion: "Reunión", tarea: "Tarea" }[e.target.value] ?? act.asunto })}>
                    <option value="llamada">📞 Llamada</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="reunion">👥 Reunión</option>
                    <option value="tarea">✅ Tarea</option>
                  </select>
                  <Input value={act.asunto} onChange={(e) => setAct({ ...act, asunto: e.target.value })} placeholder="¿Qué hay que hacer?" />
                  <Input type="datetime-local" value={act.venceAt} onChange={(e) => setAct({ ...act, venceAt: e.target.value })} />
                  <Button
                    disabled={pend}
                    onClick={() =>
                      correr(
                        // La hora escrita es hora de PR (UTC-4 todo el año).
                        () => actividadAction(t.id, { tipo: act.tipo, asunto: act.asunto, venceAt: `${act.venceAt}:00-04:00` }),
                        "Seguimiento programado",
                        () => setAct({ tipo: "llamada", asunto: "Llamar", venceAt: manana10() }),
                      )
                    }
                  >
                    Programar
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && enviar()}
                    placeholder={pestana === "whatsapp" ? (t.telefono || t.tieneChat ? "Escribe el mensaje de WhatsApp…" : "Este lead no tiene teléfono") : "Escribe una nota interna…"}
                    className={cn("min-h-20", pestana === "nota" && "bg-amber-50/60")}
                    disabled={pestana === "whatsapp" && !t.telefono && !t.tieneChat}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{pestana === "whatsapp" ? "Sale por Timelines desde el número de la empresa" : "Solo la ve el equipo"} · ⌘/Ctrl + Enter</span>
                    <Button size="sm" disabled={pend || !texto.trim()} onClick={enviar} className={pestana === "whatsapp" ? "bg-[#25d366] text-white hover:bg-[#1eb455]" : ""}>
                      {pestana === "whatsapp" ? "Enviar WhatsApp" : "Guardar nota"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pendientes */}
          {pendientes.length > 0 && (
            <div className="rounded-lg border bg-background">
              <h2 className="border-b px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pendientes</h2>
              <ul className="divide-y">
                {pendientes.map((a) => {
                  const I = ICONO_ACTIVIDAD[a.tipo] ?? CheckSquare;
                  const est = estadoActividad(a.venceAt);
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                      <input type="checkbox" className="size-4 accent-[#08a742]" onChange={() => correr(() => completarActividadAction(a.id, true), "Hecho ✓")} aria-label="Marcar hecha" />
                      <I className="size-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{a.asunto}</span>
                      <span className={cn("text-xs", est === "vencida" ? "font-medium text-red-600" : est === "hoy" ? "font-medium text-green-700" : "text-muted-foreground")}>{cuando(a.venceAt)}</span>
                      {a.asignado && <span className="text-xs text-muted-foreground">{a.asignado.split(" ")[0]}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Historial: conversación de WhatsApp + notas + cambios */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial</h2>
            {!d.historial.length && <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>}
            <ol className="grid gap-2">
              {d.historial.map((h) =>
                h.tipo === "sistema" ? (
                  <li key={h.id} className="text-center text-[11px] text-muted-foreground">
                    {h.texto} · {cuando(h.createdAt)}
                    {h.autor ? ` · ${h.autor.split(" ")[0]}` : ""}
                  </li>
                ) : (
                  <li key={h.id} className={cn("flex", h.tipo === "saliente" && "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm shadow-sm",
                        h.tipo === "entrante" && "bg-background",
                        h.tipo === "saliente" && "bg-[#dcf8c6] text-[#111b21]",
                        h.tipo === "nota" && "w-full max-w-none border border-amber-200 bg-amber-50 text-amber-950",
                      )}
                    >
                      {h.tipo === "nota" && <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Nota</p>}
                      <p className="whitespace-pre-wrap break-words">{h.texto}</p>
                      <p className="mt-1 text-right text-[10px] opacity-60">
                        {cuando(h.createdAt)}
                        {h.autor ? ` · ${h.autor.split(" ")[0]}` : h.tipo === "saliente" ? " · desde el teléfono" : ""}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </div>
        </section>
      </div>

      <PerdidoDialog
        tratoId={perdido ? t.id : null}
        nombre={t.nombre}
        onCerrar={() => setPerdido(false)}
        onHecho={() => {
          setPerdido(false);
          router.refresh();
        }}
      />
    </div>
  );
}
