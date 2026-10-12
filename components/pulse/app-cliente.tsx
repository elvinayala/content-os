"use client";

import { Bell, Copy, ExternalLink, Link2, Loader2, Power, RefreshCw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  agendarReunionAppAction,
  avisarClienteAction,
  cancelarReunionAppAction,
  cambiarLinkAppAction,
  crearLinkAppAction,
  desactivarAppAction,
  estadoAppClienteAction,
  guardarSlackAppAction,
  type EstadoAppCliente,
} from "@/app/pulse/(app)/[board]/app-cliente-actions";
import { textoHorario } from "@/lib/clientes-app/reunion-reglas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const aviso = { className: "pulse" };
const cuando = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-PR", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "America/Puerto_Rico" }) : "nunca");

// Pestaña "App" de la ficha del cliente (solo LEVEL UP MEDIA): su link personal a app.levelupmediapr.net y su estado.
export function AppClientePanel({ itemId }: { itemId: string }) {
  const [e, setE] = useState<EstadoAppCliente | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const [slack, setSlack] = useState("");
  const [texto, setTexto] = useState("");
  const [cita, setCita] = useState("");
  const [enlace, setEnlace] = useState("");

  useEffect(() => {
    let vivo = true;
    estadoAppClienteAction(itemId).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setE(r.estado);
        setSlack(r.estado.slackUrl ?? "");
      } else toast.error(r.error, aviso);
    });
    return () => {
      vivo = false;
    };
  }, [itemId]);

  const hacer = async (clave: string, fn: () => Promise<{ ok: true; estado: EstadoAppCliente } | { ok: false; error: string }>, ok?: string) => {
    setCargando(clave);
    const r = await fn();
    setCargando(null);
    if (!r.ok) return toast.error(r.error, aviso);
    setE(r.estado);
    if (ok) toast.success(ok, aviso);
  };

  if (!e) return <div className="h-32 animate-pulse rounded-xl bg-muted" />;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        La app del cliente (<b>app.levelupmediapr.net</b>): en qué va, sus resultados de Meta, el trabajo hecho, sus entregables y su equipo. Entra con su link personal; se instala en el teléfono sin App Store.
      </p>
      {!e.secretoListo ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Falta CLIENTES_APP_SECRET en el servidor.</p> : null}

      {e.activo && e.link ? (
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <p className="flex items-center gap-1.5 font-medium">
            <Link2 className="size-4" /> Link personal
          </p>
          <code className="truncate rounded bg-muted px-2 py-1 text-xs">{e.link}</code>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigator.clipboard.writeText(e.link!).then(() => toast.success("Link copiado: mándaselo al cliente", aviso))}>
              <Copy className="size-3.5" /> Copiar link
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`/cliente/ver/${itemId}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" /> Ver como el cliente
              </a>
            </Button>
            <Button size="sm" variant="outline" disabled={!!cargando} onClick={() => confirm("¿Cambiar el link? El que tiene el cliente deja de servir y hay que mandarle el nuevo.") && hacer("cambiar", () => cambiarLinkAppAction(itemId), "Link nuevo listo: mándaselo al cliente")}>
              {cargando === "cambiar" ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Cambiar link
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" disabled={!!cargando} onClick={() => confirm("¿Desactivar la app de este cliente? No podrá entrar hasta que se la vuelvas a activar.") && hacer("desactivar", () => desactivarAppAction(itemId), "App desactivada")}>
              <Power className="size-3.5" /> Desactivar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Último acceso: {cuando(e.ultimoAcceso)} · {e.telefonos.length ? `${e.telefonos.length} teléfono(s) con avisos: ${e.telefonos.map((t) => t.dispositivo ?? "teléfono").join(", ")}` : "todavía sin avisos activos"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed p-3">
          <p className="text-muted-foreground">{e.existe ? "La app de este cliente está desactivada." : "Este cliente todavía no tiene la app."}</p>
          <Button size="sm" disabled={!!cargando || !e.secretoListo} onClick={() => hacer("crear", () => crearLinkAppAction(itemId), "Link creado")}>
            {cargando === "crear" ? <Loader2 className="size-3.5 animate-spin" /> : <Smartphone className="size-3.5" />} {e.existe ? "Activar con link nuevo" : "Crear link de la app"}
          </Button>
        </div>
      )}

      {e.altoValor ? (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50/60 p-3">
          <p className="font-medium">Reunión de estrategia del mes</p>
          <p className="text-xs text-muted-foreground">Pagó $3,000 o más (o está marcado Alto): tiene derecho a 1 al mes. Al cliente no se le dice por qué.</p>
          {!e.reunion ? (
            <p className="text-xs">Todavía no la ha pedido este mes.</p>
          ) : e.reunion.estado === "agendada" ? (
            <p className="text-xs">
              ✅ Confirmada para{" "}
              {e.reunion.agendadaPara
                ? new Date(e.reunion.agendadaPara).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })
                : "—"}
              {e.reunion.enlace ? " · con enlace" : ""}
            </p>
          ) : (
            <>
              <p className="text-xs font-medium">La pidió. Horarios que prefiere (hora PR):</p>
              <ul className="text-xs">
                {e.reunion.opciones.map((o) => (
                  <li key={o.fecha + o.hora}>· {textoHorario(o)}</li>
                ))}
              </ul>
              {e.reunion.tema ? <p className="text-xs">Quiere revisar: “{e.reunion.tema}”</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="datetime-local" value={cita} onChange={(x) => setCita(x.target.value)} />
                <Input value={enlace} onChange={(x) => setEnlace(x.target.value)} placeholder="Enlace de Meet o Zoom (https://…)" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={!!cargando || !cita} onClick={() => hacer("cita", () => agendarReunionAppAction(itemId, e.reunion!.id, cita, enlace), "Reunión confirmada: el cliente la ve en su app")}>
                  Confirmar reunión
                </Button>
                <Button size="sm" variant="ghost" disabled={!!cargando} onClick={() => confirm("¿Cancelar esta solicitud? El cliente podrá pedir otra este mes.") && hacer("cancelar", () => cancelarReunionAppAction(itemId, e.reunion!.id), "Solicitud cancelada")}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-xl border p-3">
        <p className="font-medium">Lo que ve en Trabajo</p>
        <p className="text-xs text-muted-foreground">
          Solo su plan de marketing, sus creativos aprobados y sus videos. Plan: {e.entregas.plan ? "✓" : "falta"} · Creativos: {e.entregas.creativo} · Videos: {e.entregas.video}
        </p>
        <Button size="sm" variant="outline" className="self-start" asChild>
          <a href={`/cliente/ver/${itemId}?ir=archivos`} target="_blank" rel="noreferrer">
            Subir plan, creativos o videos
          </a>
        </Button>
        <p className="text-[11px] text-muted-foreground">Lo que Max le envía aprobado por su canal de Slack entra solo.</p>
      </div>

      {e.existe ? (
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <p className="font-medium">Canal de Slack del negocio</p>
          <p className="text-xs text-muted-foreground">En Slack: el canal → Copiar enlace. La app le pone el botón "Escríbenos en Slack".</p>
          <div className="flex gap-2">
            <Input value={slack} onChange={(x) => setSlack(x.target.value)} placeholder="https://levelupmediaespacio.slack.com/archives/C0…" />
            <Button size="sm" variant="outline" disabled={!!cargando || slack === (e.slackUrl ?? "")} onClick={() => hacer("slack", () => guardarSlackAppAction(itemId, slack), "Canal guardado")}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {e.activo ? (
        <div className="flex flex-col gap-2 rounded-xl border p-3">
          <p className="flex items-center gap-1.5 font-medium">
            <Bell className="size-4" /> Enviar aviso a su teléfono
          </p>
          {!e.avisosReales ? <p className="text-xs text-amber-700">Los avisos a clientes están apagados hasta que Elvin los active.</p> : null}
          <Textarea rows={2} maxLength={160} value={texto} onChange={(x) => setTexto(x.target.value)} placeholder="Ej.: Tu estrategia está lista. Revísala en tu canal de Slack." />
          <Button
            size="sm"
            className="self-start"
            disabled={!!cargando || texto.trim().length < 3 || !e.avisosReales || !e.telefonos.length}
            onClick={async () => {
              setCargando("aviso");
              const r = await avisarClienteAction(itemId, texto);
              setCargando(null);
              if (!r.ok) return toast.error(r.error, aviso);
              toast.success(r.enviados ? `Aviso enviado a ${r.enviados} teléfono(s)` : "No llegó: el cliente no tiene avisos activos", aviso);
              if (r.enviados) setTexto("");
            }}
          >
            {cargando === "aviso" ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />} Enviar aviso
          </Button>
        </div>
      ) : null}
    </div>
  );
}
