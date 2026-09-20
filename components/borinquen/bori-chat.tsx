"use client";

import { useRef, useState } from "react";
import { Bot, SendHorizonal } from "lucide-react";

import { cn } from "@/lib/utils";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const SALUDO =
  "¡Wepa, Elvin! 🇵🇷 Soy Bori, tu copiloto. Preguntame cómo van tus agentes, tus leads, o pedime que arme algo.";

export function BoriChat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function bajar() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }

  async function enviar() {
    const texto = input.trim();
    if (!texto || cargando) return;
    setError(null);
    setInput("");
    const nuevos: Mensaje[] = [...mensajes, { role: "user", content: texto }];
    setMensajes([...nuevos, { role: "assistant", content: "" }]);
    setCargando(true);
    bajar();

    try {
      const res = await fetch("/api/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: nuevos }),
      });
      if (!res.ok || !res.body) {
        const cuerpo = await res.json().catch(() => ({}));
        const msg =
          cuerpo.error === "jarvis-desactivado"
            ? "Bori necesita ANTHROPIC_API_KEY para conversar. Mientras tanto, el tablero anda igual."
            : cuerpo.error === "no-autorizado"
              ? "Iniciá sesión para hablar con Bori."
              : cuerpo.error === "rate-limit"
                ? "Muchas preguntas seguidas — esperá un toque."
                : "No pude conectar con Bori.";
        setMensajes(nuevos);
        setError(msg);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acumulado = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const partes = buffer.split("\n\n");
        buffer = partes.pop() ?? "";
        for (const parte of partes) {
          const linea = parte.trim();
          if (!linea.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(linea.slice(5).trim());
            if (ev.tipo === "texto" && ev.delta) {
              acumulado += ev.delta;
              setMensajes([
                ...nuevos,
                { role: "assistant", content: acumulado },
              ]);
              bajar();
            } else if (ev.tipo === "error") {
              setError(ev.mensaje ?? "Error de Bori.");
            }
          } catch {
            // fragmento incompleto — se completa en el próximo chunk
          }
        }
      }
      if (!acumulado) setMensajes(nuevos);
    } catch {
      setMensajes(nuevos);
      setError("Se cortó la conexión con Bori.");
    } finally {
      setCargando(false);
      bajar();
    }
  }

  return (
    <aside className="glow flex h-[calc(100vh-8rem)] min-h-[420px] flex-col rounded-xl border border-primary/25 bg-gradient-to-b from-card to-background/40 xl:sticky xl:top-24">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
          <Bot className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Bori</p>
          <p className="label-mono text-muted-foreground">
            <span className="mr-1 inline-block size-1.5 rounded-full bg-[var(--status-working)]" />
            En línea — tu copiloto AI
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        <Burbuja role="assistant">{SALUDO}</Burbuja>
        {mensajes.map((m, i) => (
          <Burbuja key={i} role={m.role}>
            {m.content ||
              (cargando && i === mensajes.length - 1 ? "Bori está pensando…" : "")}
          </Burbuja>
        ))}
        {error ? (
          <p className="rounded-lg bg-[color-mix(in_oklch,var(--status-waiting)_15%,transparent)] px-3 py-2 text-xs text-[var(--status-waiting)]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-input bg-background/60 px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            placeholder="Preguntale a Bori…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={enviar}
            disabled={cargando || !input.trim()}
            aria-label="Enviar"
            className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <SendHorizonal className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Burbuja({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const esUser = role === "user";
  return (
    <div className={cn("flex", esUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
          esUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted/70 text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
