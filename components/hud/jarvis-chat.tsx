"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CornerDownLeft,
  Mic,
  Radio,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

import { JarvisOrb } from "@/components/hud/jarvis-orb";
import { useHabla, useReconocimiento } from "@/hooks/use-voz";
import { useAplausos, useEscuchaContinua } from "@/hooks/use-manos-libres";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Mensaje {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "jarvis-historial";

export function JarvisChat({
  habilitado,
  promptInicial,
}: {
  habilitado: boolean;
  promptInicial?: string;
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState(promptInicial ?? "");
  const [pensando, setPensando] = useState(false);
  const [toolActiva, setToolActiva] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voz: TTS robótico/futurista (Jarvis responde hablando) + dictado (le hablás).
  const voz = useHabla({ lang: "es-PR", perfil: "robotico" });
  const enviarRef = useRef<(texto?: string) => void>(() => {});
  const dictado = useReconocimiento({
    lang: "es-PR",
    onTexto: setInput,
    onFin: (t) => {
      if (t) enviarRef.current(t);
    },
  });

  // Manos libres: escucha continua (cada frase se envía sola) + prender/apagar con
  // dos aplausos. El micrófono se arma una vez con un click (requisito del navegador).
  const [manosLibres, setManosLibres] = useState(false);
  const manosLibresRef = useRef(false);
  manosLibresRef.current = manosLibres;
  const escucha = useEscuchaContinua({
    lang: "es-PR",
    onFrase: (t) => {
      if (t) enviarRef.current(t);
    },
    onInterino: setInput,
  });

  const saludar = useCallback(async () => {
    try {
      const res = await fetch("/api/hud/saludo");
      const data = (await res.json()) as { saludo?: string };
      if (data.saludo) voz.hablar(data.saludo);
    } catch {}
  }, [voz]);

  // Dos aplausos → prende/apaga la sesión de manos libres.
  const aplausos = useAplausos(() => {
    if (manosLibresRef.current) {
      setManosLibres(false);
      escucha.detener();
    } else {
      if (!voz.habilitado) voz.toggle();
      setManosLibres(true);
      escucha.iniciar();
      void saludar();
    }
  });

  // Mientras Jarvis habla, pausá la escucha para que no se oiga a sí mismo.
  const {
    activa: escuchaActiva,
    pausar: escuchaPausar,
    reanudar: escuchaReanudar,
  } = escucha;
  useEffect(() => {
    if (!escuchaActiva) return;
    if (voz.hablando) escuchaPausar();
    else escuchaReanudar();
  }, [voz.hablando, escuchaActiva, escuchaPausar, escuchaReanudar]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMensajes(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes.slice(-40)));
    } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [mensajes]);

  // Los botones de skills del panel derecho precargan el prompt acá.
  useEffect(() => {
    const handler = (e: Event) => {
      const detalle = (e as CustomEvent<string>).detail;
      setInput(detalle);
      inputRef.current?.focus();
    };
    window.addEventListener("jarvis-prompt", handler);
    return () => window.removeEventListener("jarvis-prompt", handler);
  }, []);

  async function enviar(textoOverride?: string) {
    const texto = (textoOverride ?? input).trim();
    if (!texto || pensando || !habilitado) return;
    voz.cancelar(); // cortar cualquier lectura en curso
    setInput("");
    const historial: Mensaje[] = [...mensajes, { role: "user", content: texto }];
    setMensajes([...historial, { role: "assistant", content: "" }]);
    setPensando(true);
    setToolActiva(null);

    try {
      const res = await fetch("/api/jarvis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: historial }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          res.status === 503
            ? "Jarvis está desactivado: falta ANTHROPIC_API_KEY en .env.local."
            : res.status === 429
              ? "Demasiadas consultas seguidas — esperá un minuto."
              : (err.error ?? `Error ${res.status}`),
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let respuesta = "";

      const aplicar = () =>
        setMensajes([
          ...historial,
          { role: "assistant", content: respuesta },
        ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n\n");
        buffer = lineas.pop() ?? "";
        for (const linea of lineas) {
          if (!linea.startsWith("data: ")) continue;
          const evento = JSON.parse(linea.slice(6));
          if (evento.tipo === "texto") {
            respuesta += evento.delta;
            setToolActiva(null);
            aplicar();
          } else if (evento.tipo === "tool") {
            setToolActiva(evento.nombre);
          } else if (evento.tipo === "accion") {
            // Jarvis dispara algo en la pantalla (ej. poner un video).
            window.dispatchEvent(
              new CustomEvent("jarvis-accion", { detail: evento }),
            );
          } else if (evento.tipo === "error") {
            respuesta += `\n\n⚠️ ${evento.mensaje}`;
            aplicar();
          }
        }
      }
      voz.hablar(respuesta); // lee la respuesta si el TTS está prendido
    } catch (e) {
      setMensajes([
        ...historial,
        {
          role: "assistant",
          content: `⚠️ ${e instanceof Error ? e.message : "Error de conexión"}`,
        },
      ]);
    } finally {
      setPensando(false);
      setToolActiva(null);
    }
  }
  enviarRef.current = enviar;

  const TOOL_LABELS: Record<string, string> = {
    leer_metricas: "leyendo métricas…",
    leer_ops: "revisando operaciones…",
    leer_vault: "buscando en la memoria…",
    buscar_memoria: "buceando en la memoria…",
    listar_skills: "listando skills…",
    usar_skill: "cargando skill…",
    leer_ganchos: "abriendo el baúl…",
    encargar_trabajo: "encolando trabajo…",
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <JarvisOrb
        estado={
          pensando || voz.hablando || dictado.escuchando || escucha.activa
            ? "pensando"
            : "idle"
        }
      />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-3"
      >
        {mensajes.length === 0 ? (
          <div className="mt-6 space-y-1 text-center">
            <p className="label-mono text-primary">Jarvis online</p>
            <p className="text-sm text-muted-foreground">
              Preguntame por métricas, clientes, o pedime contenido con tu
              estilo. Tocá el micrófono para hablarme.
            </p>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[92%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "ml-auto bg-primary/15 text-foreground"
                  : "bg-card border border-border",
              )}
            >
              {m.content ||
                (pensando && i === mensajes.length - 1 ? (
                  <span className="label-mono text-primary animate-pulse">
                    {toolActiva
                      ? (TOOL_LABELS[toolActiva] ?? "trabajando…")
                      : "pensando…"}
                  </span>
                ) : (
                  ""
                ))}
            </div>
          ))
        )}
      </div>

      {/* Barra de voz */}
      {dictado.soportado || voz.soportado ? (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {escucha.soportado ? (
            <button
              onClick={() => {
                if (!aplausos.armado) void aplausos.armar();
                // Toggle manual además de los 2 aplausos.
                if (manosLibres) {
                  setManosLibres(false);
                  escucha.detener();
                } else {
                  if (!voz.habilitado) voz.toggle();
                  setManosLibres(true);
                  escucha.iniciar();
                  void saludar();
                }
              }}
              disabled={!habilitado}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40",
                manosLibres
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              title="Manos libres: prendé/apagá con dos aplausos"
            >
              <Radio className={cn("size-3.5", manosLibres && "animate-pulse")} />
              {manosLibres
                ? "manos libres · escuchando (2 aplausos p/ apagar)"
                : aplausos.armado
                  ? "manos libres (2 aplausos)"
                  : "activar manos libres"}
            </button>
          ) : null}
          {dictado.soportado ? (
            <button
              onClick={dictado.toggle}
              disabled={!habilitado || pensando}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40",
                dictado.escuchando
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              title="Hablarle a Jarvis"
            >
              <Mic
                className={cn("size-3.5", dictado.escuchando && "animate-pulse")}
              />
              {dictado.escuchando ? "escuchando… (tocá para enviar)" : "hablar"}
            </button>
          ) : null}
          {voz.soportado ? (
            <button
              onClick={voz.toggle}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                voz.habilitado
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              title={
                voz.habilitado ? "Jarvis responde en voz" : "Respuestas en voz"
              }
            >
              {voz.habilitado ? (
                <Volume2 className="size-3.5" />
              ) : (
                <VolumeX className="size-3.5" />
              )}
              {voz.habilitado ? "voz activa" : "voz off"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-end gap-2 border-t border-border pt-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder={
            habilitado
              ? "Hablale a Jarvis… (Enter para enviar)"
              : "Jarvis desactivado — configurá ANTHROPIC_API_KEY en .env.local"
          }
          disabled={!habilitado || pensando}
          rows={2}
          className="min-h-0 flex-1 resize-none rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
        />
        <div className="flex flex-col gap-1.5">
          <Button
            size="icon"
            onClick={() => enviar()}
            disabled={!habilitado || pensando || !input.trim()}
            title="Enviar"
          >
            <CornerDownLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMensajes([])}
            title="Limpiar conversación"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
