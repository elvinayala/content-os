"use client";

import { Bell, Copy, ExternalLink, Link2, Loader2, Power, RefreshCw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  avisarClienteAction,
  cambiarLinkAppAction,
  crearLinkAppAction,
  desactivarAppAction,
  estadoAppClienteAction,
  guardarSlackAppAction,
  type EstadoAppCliente,
} from "@/app/pulse/(app)/[board]/app-cliente-actions";
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
        La app del cliente (<b>app.levelupmediapr.net</b>): en qué va, sus resultados de Meta, sus archivos y su equipo. Entra con su link personal; se instala en el teléfono sin App Store.
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
