"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGERENCIAS = [
  "Necesito 5 reels para Level Up esta semana",
  "6 anuncios para AI Borinquen enfocados en no responder los leads",
  "3 carruseles estilo libreta para Shadow",
];

export function PedirChat() {
  const [usuario, setUsuario] = useState("");
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem("pedir-usuario");
      if (u) setUsuario(u);
    } catch {}
  }, []);
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  async function enviar(contenido: string) {
    const msg = contenido.trim();
    if (!msg || cargando) return;
    if (usuario) {
      try {
        localStorage.setItem("pedir-usuario", usuario);
      } catch {}
    }
    const nuevos: Msg[] = [...mensajes, { role: "user", content: msg }];
    setMensajes(nuevos);
    setTexto("");
    setCargando(true);
    try {
      const res = await fetch("/api/pedir-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: nuevos, usuario }),
      });
      const data = (await res.json()) as { texto?: string };
      setMensajes((m) => [
        ...m,
        { role: "assistant", content: data.texto ?? "…" },
      ]);
    } catch {
      setMensajes((m) => [
        ...m,
        { role: "assistant", content: "Se cayó la conexión, probá de nuevo." },
      ]);
    }
    setCargando(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Quién sos */}
      <div className="mb-3 flex items-center gap-2">
        <span className="label-mono text-muted-foreground">Sos:</span>
        <Input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Tu nombre (ej. Valentina, Juan Diego)"
          className="h-8 max-w-[220px]"
        />
      </div>

      {/* Conversación */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-card/40 p-4">
        {mensajes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="size-6 text-primary" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Contale a Sofi qué contenido necesitás (marca, cantidad, tipo, para
              quién, para cuándo). Ella lo pasa al equipo y cae en la bandeja de
              Elvin para revisión.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm " +
                  (m.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "bg-muted/60 text-foreground/90")
                }
              >
                {m.role === "assistant" ? (
                  <span className="label-mono mb-1 block text-primary">Sofi</span>
                ) : null}
                {m.content}
              </div>
            </div>
          ))
        )}
        {cargando ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted/60 px-3.5 py-2 text-sm text-muted-foreground">
              Sofi está escribiendo…
            </div>
          </div>
        ) : null}
        <div ref={finRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pedile a Sofi lo que necesitás…"
          disabled={cargando}
        />
        <Button type="submit" disabled={cargando || !texto.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
