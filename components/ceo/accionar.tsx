"use client";

import { useState } from "react";
import { Send, Zap } from "lucide-react";

import {
  RESPONSABLES,
  sugerirResponsable,
  type ResponsableSlack,
} from "@/lib/equipo-slack";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Botón ⚡ Accionar: desde cualquier punto del debrief, Elvin le escribe por
// Slack al responsable preguntando qué pasó. El mensaje viene pre-redactado
// (editable) y el destinatario pre-sugerido según el texto del item.

export function Accionar({ item }: { item: string }) {
  const [abierto, setAbierto] = useState(false);
  const [dest, setDest] = useState<ResponsableSlack>(() => sugerirResponsable(item));
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("");

  function abrir() {
    if (!abierto) {
      const d = sugerirResponsable(item);
      setDest(d);
      setTexto(
        `Hola ${d.nombre}, vi esto en mi brief de hoy:\n\n"${item.slice(0, 350)}"\n\n¿Qué pasó con esto? ¿Está atendido? Dame un update cuando puedas. 🙏`,
      );
    }
    setAbierto((v) => !v);
  }

  async function enviar() {
    const t = texto.trim();
    if (!t) return;
    setEstado("enviando");
    try {
      const res = await fetch("/api/accionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinatario: dest.id, texto: t }),
      });
      setEstado(res.ok ? "ok" : "error");
      if (res.ok) setAbierto(false);
    } catch {
      setEstado("error");
    }
    setTimeout(() => setEstado(""), 5000);
  }

  return (
    <span className="inline-flex flex-col">
      <button
        onClick={abrir}
        title="Accionar: escribirle por Slack al responsable"
        className={cn(
          "ml-1.5 inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 align-middle text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
          estado === "ok" && "border-[var(--status-working)] text-[var(--status-working)]",
        )}
      >
        <Zap className="size-3" />
        {estado === "ok" ? "enviado ✓" : estado === "error" ? "error" : "accionar"}
      </button>

      {abierto ? (
        <span className="mt-2 block rounded-lg border border-border bg-background/70 p-3">
          <span className="mb-1.5 flex items-center gap-2">
            <span className="label-mono text-muted-foreground">Para:</span>
            <select
              value={dest.id}
              onChange={(ev) => {
                const r = RESPONSABLES.find((x) => x.id === ev.target.value);
                if (r) {
                  setDest(r);
                  setTexto((prev) =>
                    prev.replace(/^Hola [^,]+,/, `Hola ${r.nombre},`),
                  );
                }
              }}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs"
            >
              {RESPONSABLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} — {r.rol}
                </option>
              ))}
            </select>
          </span>
          <textarea
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            rows={4}
            className="w-full resize-y rounded-md border border-border bg-background/60 p-2 text-sm outline-none focus:border-primary/50"
          />
          <span className="mt-1.5 flex items-center gap-2">
            <Button size="sm" onClick={enviar} disabled={!texto.trim() || estado === "enviando"}>
              <Send className="size-3.5" />
              {estado === "enviando" ? "Enviando…" : `Enviar a ${dest.nombre} por Slack`}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <span className="label-mono text-muted-foreground">se envía como tú (DM)</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
