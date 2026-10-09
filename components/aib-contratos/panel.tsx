"use client";

import { Copy, FileDown, MessageCircle, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { anularContratoAction, crearContratoAction } from "@/app/pulse/(app)/contratos-aib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Contratos de AI Borinquen (9/oct): el equipo llena a mano lo que se le ofreció al cliente y el costo (Aure: "estos
// datos se llenan manual") → link → el cliente completa su parte, inicia cada hoja y firma desde el teléfono.

export interface FilaContrato {
  id: number; codigo: string; estado: "pendiente" | "firmado" | "anulado"; abierto: boolean;
  nombre: string; negocio: string; telefono: string; servicio: string; costos: string;
  emitidoPor: string; emitidoEn: string; firmadoEn: string | null; link: string; pdf: string | null;
}

const fecha = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const copiar = (t: string) => navigator.clipboard.writeText(t).then(() => toast.success("Link copiado"), () => toast.error("No se pudo copiar"));
const whatsapp = (tel: string, nombre: string, link: string) => `https://wa.me/1${tel}?text=${encodeURIComponent(`Hola ${nombre.split(" ")[0]}, aquí está tu acuerdo con AI Borinquen. Lo completas y lo firmas desde el teléfono en un par de minutos: ${link}`)}`;

export function ContratosAib({ contratos }: { contratos: FilaContrato[] }) {
  const [abierto, setAbierto] = useState(contratos.length === 0);
  const [nuevo, setNuevo] = useState<{ link: string; codigo: string; telefono: string; nombre: string } | null>(null);
  const [pend, start] = useTransition();
  const [v, setV] = useState({ nombre: "", telefono: "", email: "", negocio: "", servicio: "", total: "", hoy: "", mensual: "", nota: "" });
  const [cuotas, setCuotas] = useState<{ monto: string; fecha: string }[]>([]);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  function crear() {
    start(async () => {
      const r = await crearContratoAction({ ...v, cuotas: JSON.stringify(cuotas) });
      if (!r.ok) return void toast.error(r.error);
      setNuevo({ link: r.link, codigo: r.codigo, telefono: v.telefono.replace(/\D/g, "").slice(-10), nombre: v.nombre });
      setV({ nombre: "", telefono: "", email: "", negocio: "", servicio: "", total: "", hoy: "", mensual: "", nota: "" }); setCuotas([]);
      setAbierto(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos · AI Borinquen</h1>
          <p className="text-sm text-muted-foreground">Llena lo que se le ofreció y el costo; el cliente completa sus datos, inicia cada página y firma desde su teléfono.</p>
        </div>
        {!abierto && <Button onClick={() => { setAbierto(true); setNuevo(null); }}><Plus className="size-4" /> Nuevo contrato</Button>}
      </div>

      {nuevo && (
        <div className="superficie rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">{nuevo.codigo} listo · mándale este link a {nuevo.nombre.split(" ")[0]}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="max-w-full truncate rounded bg-white px-2 py-1 text-xs">{nuevo.link}</code>
            <Button size="sm" variant="outline" onClick={() => copiar(nuevo.link)}><Copy className="size-3.5" /> Copiar</Button>
            <Button size="sm" variant="outline" asChild><a href={whatsapp(nuevo.telefono, nuevo.nombre, nuevo.link)} target="_blank" rel="noopener"><MessageCircle className="size-3.5" /> WhatsApp</a></Button>
          </div>
        </div>
      )}

      {abierto && (
        <div className="superficie space-y-4 rounded-xl border bg-background p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Nuevo contrato</h2>{contratos.length > 0 && <button onClick={() => setAbierto(false)} className="text-muted-foreground"><X className="size-4" /></button>}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <L t="Nombre completo del cliente"><Input value={v.nombre} onChange={set("nombre")} /></L>
            <L t="Teléfono"><Input value={v.telefono} onChange={set("telefono")} inputMode="tel" placeholder="787 555 1234" /></L>
            <L t="Correo electrónico" o><Input value={v.email} onChange={set("email")} type="email" /></L>
            <L t="Negocio" o><Input value={v.negocio} onChange={set("negocio")} /></L>
          </div>
          <L t="Incluye el servicio (lo que se le ofreció)"><Textarea rows={4} value={v.servicio} onChange={set("servicio")} placeholder={"Agente de ventas por WhatsApp e Instagram\nAgente de voz para citas\nConfiguración, entrenamiento y 30 días de soporte"} /></L>
          <div className="grid gap-3 sm:grid-cols-3">
            <L t="Costo total (US$)"><Input value={v.total} onChange={set("total")} inputMode="decimal" placeholder="3500" /></L>
            <L t="Pago de hoy (US$)" o a="Si paga en partes. Vacío = el total."><Input value={v.hoy} onChange={set("hoy")} inputMode="decimal" placeholder="1500" /></L>
            <L t="Mensualidad (US$)" o><Input value={v.mensual} onChange={set("mensual")} inputMode="decimal" placeholder="497" /></L>
          </div>
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <div className="flex items-center justify-between gap-3">
              <div><div className="text-sm font-medium">Cuotas a pagar <span className="font-normal text-muted-foreground">· opcional</span></div><div className="text-xs text-muted-foreground">Lo que queda después del pago de hoy. El pago de hoy más las cuotas tiene que dar el total.</div></div>
              <Button type="button" size="sm" variant="outline" onClick={() => setCuotas((q) => [...q, { monto: "", fecha: "" }])}><Plus className="size-3.5" /> Cuota</Button>
            </div>
            {cuotas.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 text-xs text-muted-foreground">Cuota {i + 1}</span>
                <Input className="w-32" inputMode="decimal" placeholder="1000" value={q.monto} onChange={(e) => setCuotas((xs) => xs.map((x, j) => (j === i ? { ...x, monto: e.target.value } : x)))} />
                <Input className="w-44" type="date" value={q.fecha} onChange={(e) => setCuotas((xs) => xs.map((x, j) => (j === i ? { ...x, fecha: e.target.value } : x)))} />
                <button type="button" className="text-muted-foreground" onClick={() => setCuotas((xs) => xs.filter((_, j) => j !== i))}><X className="size-4" /></button>
              </div>
            ))}
            {cuotas.length > 0 && (() => {
              const n = (x: string) => Number(x.replace(/[$,\s]/g, "")) || 0, suma = n(v.hoy) + cuotas.reduce((a, q) => a + n(q.monto), 0), total = n(v.total);
              return <div className={`text-xs ${Math.abs(suma - total) < 0.01 ? "text-emerald-700" : "text-amber-700"}`}>Hoy + cuotas = ${suma.toLocaleString("en-US", { minimumFractionDigits: 2 })} {total ? `de $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : ""}</div>;
            })()}
          </div>
          <L t="Nota del pago" o><Input value={v.nota} onChange={set("nota")} placeholder="Cualquier detalle del pago" /></L>
          <div className="flex justify-end"><Button onClick={crear} disabled={pend}>{pend ? "Creando…" : "Crear link para firmar"}</Button></div>
        </div>
      )}

      <div className="superficie overflow-hidden rounded-xl border bg-background">
        {contratos.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Todavía no hay contratos.</p>
        ) : contratos.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{c.codigo}</span><span className="truncate font-medium">{c.nombre}</span>{c.negocio && <span className="truncate text-sm text-muted-foreground">· {c.negocio}</span>}</div>
              <div className="truncate text-xs text-muted-foreground">{c.costos} · {c.emitidoPor}, {fecha(c.emitidoEn)}{c.firmadoEn ? ` · firmó ${fecha(c.firmadoEn)}` : ""}</div>
            </div>
            <Estado e={c.estado} abierto={c.abierto} />
            <div className="flex gap-1.5">
              {c.pdf && <Button size="sm" variant="outline" asChild><a href={c.pdf} target="_blank" rel="noopener"><FileDown className="size-3.5" /> PDF</a></Button>}
              {c.estado === "pendiente" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => copiar(c.link)}><Copy className="size-3.5" /> Link</Button>
                  <Button size="sm" variant="outline" asChild><a href={whatsapp(c.telefono, c.nombre, c.link)} target="_blank" rel="noopener"><MessageCircle className="size-3.5" /></a></Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { if (confirm(`¿Anular ${c.codigo}? El link deja de funcionar.`)) start(async () => { const r = await anularContratoAction(c.id); if (!r.ok) toast.error(r.error ?? "No se pudo"); }); }}>Anular</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Estado({ e, abierto }: { e: FilaContrato["estado"]; abierto: boolean }) {
  const [t, cl] = e === "firmado" ? ["Firmado", "bg-emerald-100 text-emerald-800"] : e === "anulado" ? ["Anulado", "bg-zinc-100 text-zinc-500"] : abierto ? ["Lo abrió", "bg-amber-100 text-amber-800"] : ["Sin abrir", "bg-sky-100 text-sky-800"];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cl}`}>{t}</span>;
}
const L = ({ t, o, a, children }: { t: string; o?: boolean; a?: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5"><span className="text-sm font-medium">{t}{o && <span className="font-normal text-muted-foreground"> · opcional</span>}</span>{children}{a && <span className="block text-xs text-muted-foreground">{a}</span>}</label>
);
