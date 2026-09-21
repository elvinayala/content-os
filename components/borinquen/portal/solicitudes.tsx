"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { crearSolicitudAction } from "@/app/portal/[slug]/actions";
import { cambiarEstadoSolicitudAction } from "@/app/borinquen/portales/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ESTADOS_SOLICITUD, type EstadoSolicitud, type SolicitudCambio } from "@/lib/portal/types";

const fmt = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Puerto_Rico" });
const COLOR: Record<EstadoSolicitud, string> = {
  recibida: "",
  en_progreso: "text-primary",
  lista: "text-[var(--status-working)]",
};
const titulo = (e: EstadoSolicitud) => ESTADOS_SOLICITUD.find((x) => x.estado === e)?.titulo ?? e;
const CLAVE_NOMBRE = "portal-autor";

// Buzón "Solicitar un cambio": el cliente escribe en lenguaje natural; AIB lo ve en el portal del
// closer y en Telegram/Slack; el estado (recibida → en progreso → lista) se ve acá.
export function Solicitudes({
  slug,
  asistente,
  solicitudes,
  modo,
}: {
  slug: string;
  asistente: string;
  solicitudes: SolicitudCambio[];
  modo: "cliente" | "closer";
}) {
  const [texto, setTexto] = useState("");
  const [autor, setAutor] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_NOMBRE) ?? "";
    } catch {
      return "";
    }
  });
  const [pendiente, start] = useTransition();

  function enviar() {
    if (texto.trim().length < 5) { toast.error("Cuéntanos un poco más qué quieres cambiar."); return; }
    start(async () => {
      const r = await crearSolicitudAction(slug, texto, autor);
      if (!r.ok) { toast.error(r.error); return; }
      try {
        localStorage.setItem(CLAVE_NOMBRE, autor);
      } catch {}
      setTexto("");
      toast.success("Recibido. Te avisamos cuando esté listo.");
    });
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-b from-card to-background/40">
        <CardContent className="space-y-3 p-5">
          <div>
            <h3 className="font-semibold">¿Qué quieres cambiar de {asistente}?</h3>
            <p className="text-sm text-muted-foreground">
              Escríbelo como se lo dirías a una persona: un precio nuevo, un horario, cómo debe saludar, un servicio
              que ya no ofreces. El equipo de AI Borinquen lo aplica y te avisa.
            </p>
          </div>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Ej: "Cuando pregunten por precios, que diga que la evaluación es sin costo y que agende."`}
            rows={4}
            maxLength={2000}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input value={autor} onChange={(e) => setAutor(e.target.value)} placeholder="Tu nombre (opcional)" className="max-w-56" maxLength={80} />
            <Button onClick={enviar} disabled={pendiente}>
              <Send className="size-4" /> {pendiente ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {solicitudes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no has pedido ningún cambio.</p>
      ) : (
        <div className="space-y-2">
          {solicitudes.map((s) => (
            <Card key={s.id} className="bg-gradient-to-b from-card to-background/40">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {fmt.format(new Date(s.creadoEl))}
                    {s.autor ? ` · ${s.autor}` : ""}
                  </span>
                  {modo === "closer" ? (
                    <EstadoEditor slug={slug} solicitud={s} />
                  ) : (
                    <Badge variant="outline" className={"label-mono " + COLOR[s.estado]}>
                      {titulo(s.estado)}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{s.texto}</p>
                {s.respuesta ? (
                  <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                    <span className="label-mono mr-2 text-primary">AI Borinquen</span>
                    {s.respuesta}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EstadoEditor({ slug, solicitud }: { slug: string; solicitud: SolicitudCambio }) {
  const [pendiente, start] = useTransition();
  const [respuesta, setRespuesta] = useState(solicitud.respuesta ?? "");
  const [abierto, setAbierto] = useState(false);
  function cambiar(estado: EstadoSolicitud) {
    start(async () => {
      const r = await cambiarEstadoSolicitudAction(slug, solicitud.id, estado, respuesta);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`Solicitud ${titulo(estado).toLowerCase()}`);
      setAbierto(false);
    });
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <select
        value={solicitud.estado}
        disabled={pendiente}
        onChange={(e) => cambiar(e.target.value as EstadoSolicitud)}
        className="h-7 rounded-md border border-border bg-background px-2 text-xs"
      >
        {ESTADOS_SOLICITUD.map((e) => (
          <option key={e.estado} value={e.estado}>
            {e.titulo}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAbierto((v) => !v)}>
        {abierto ? "Cerrar" : "Responder"}
      </Button>
      {abierto ? (
        <span className="mt-2 flex w-full items-center gap-2">
          <Input value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Qué se hizo / cuándo queda" maxLength={1000} />
          <Button size="sm" className="h-8" disabled={pendiente} onClick={() => cambiar(solicitud.estado)}>
            Guardar
          </Button>
        </span>
      ) : null}
    </span>
  );
}
