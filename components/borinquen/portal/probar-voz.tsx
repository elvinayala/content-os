"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, PhoneOff } from "lucide-react";
import { toast } from "sonner";

import { consentirGrabacionAction, resincronizarLlamadasAction } from "@/app/portal/[slug]/actions";
import { Button } from "@/components/ui/button";
import { LEGAL } from "@/lib/legal/versiones";

type Estado = "listo" | "conectando" | "en-llamada" | "error";
interface RetellUpdate {
  transcript?: { role: string; content: string }[];
}
interface RetellClient {
  startCall(o: { accessToken: string }): Promise<void>;
  stopCall(): void;
  on(ev: string, cb: (u?: RetellUpdate) => void): void;
}

// Llamada de prueba dentro del portal: pide el token efímero a /api/demo-webcall (con el slug
// para que la llamada quede registrada en este portal) y muestra la transcripción en vivo.
// El SDK se carga desde esm.sh solo cuando la persona toca "Llamar".
export function ProbarVoz({ slug, agentId, asistente }: { slug: string; agentId: string; asistente: string }) {
  const [estado, setEstado] = useState<Estado>("listo");
  const [lineas, setLineas] = useState<{ role: string; content: string }[]>([]);
  // Aviso de IA + grabación: casilla sin marcar; se registra en el servidor antes de pedir el token de la llamada.
  const [acepto, setAcepto] = useState(false);
  const cliente = useRef<RetellClient | null>(null);

  useEffect(() => () => cliente.current?.stopCall(), []);

  async function llamar() {
    setEstado("conectando");
    setLineas([]);
    try {
      const ok = await consentirGrabacionAction(slug, acepto);
      if (!ok.ok) throw new Error(ok.error);
      // Import dinámico fuera del bundler (Turbopack/webpack no lo analizan).
      const importar = new Function("u", "return import(u)") as (u: string) => Promise<{ RetellWebClient: new () => RetellClient }>;
      const mod = await importar("https://esm.sh/retell-client-js-sdk");
      const res = await fetch("/api/demo-webcall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, slug }),
      });
      const data = (await res.json()) as { access_token?: string; error?: string };
      if (!res.ok || !data.access_token) throw new Error(data.error || `HTTP ${res.status}`);
      const c = new mod.RetellWebClient();
      cliente.current = c;
      c.on("call_started", () => setEstado("en-llamada"));
      c.on("update", (u) => {
        if (u?.transcript) setLineas(u.transcript.slice(-12));
      });
      c.on("call_ended", terminar);
      c.on("error", () => {
        setEstado("error");
        terminar();
      });
      await c.startCall({ accessToken: data.access_token });
    } catch (e) {
      setEstado("error");
      toast.error(`No pude iniciar la llamada: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function terminar() {
    cliente.current?.stopCall();
    cliente.current = null;
    setEstado((s) => (s === "error" ? s : "listo"));
    // La transcripción final la trae Retell en 1-2 min; el botón Actualizar la muestra.
    setTimeout(() => void resincronizarLlamadasAction(slug), 90_000);
  }

  return (
    <div className="space-y-3">
      {estado !== "en-llamada" ? (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/60 p-3 text-xs leading-relaxed text-muted-foreground transition-colors hover:border-primary/40">
          <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
          {/* Mismo texto que CASILLAS.grabacionLlamada (lib/legal/versiones.ts). */}
          <span>
            Entiendo que voy a hablar con un agente de inteligencia artificial y que la llamada se graba y se transcribe para
            mostrarla en este portal.{" "}
            <a href={`${LEGAL.privacidad.ruta}#datos`} target="_blank" rel="noopener" className="font-medium text-primary underline underline-offset-4 hover:opacity-80">
              Privacidad
            </a>
          </span>
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {estado === "en-llamada" ? (
          <Button variant="destructive" onClick={terminar}>
            <PhoneOff className="size-4" /> Colgar
          </Button>
        ) : (
          <Button onClick={llamar} disabled={estado === "conectando" || !acepto}>
            <Mic className="size-4" /> {estado === "conectando" ? "Conectando…" : `Llamar a ${asistente} ahora`}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Usa Chrome y permite el micrófono. La llamada queda registrada aquí abajo.</span>
      </div>
      {lineas.length ? (
        <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-3">
          {lineas.map((l, i) => (
            <p key={i} className={"text-sm " + (l.role === "agent" ? "text-foreground" : "text-right text-primary")}>
              {l.content}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
