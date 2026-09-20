"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, RotateCcw, Send } from "lucide-react";

import { useHabla, useReconocimiento } from "@/hooks/use-voz";
import { PERSONAJES, SCORECARD, type PersonajeSparring } from "@/lib/sparring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Sala de práctica: el vendedor habla, el cliente (IA) responde por voz.
// Al colgar, se califica contra el framework de Joe.

type Turno = { rol: "vendedor" | "cliente"; texto: string };

interface Scorecard {
  puntaje: number;
  veredicto: string;
  criterios: { id: string; cumplio: boolean | null; nota: string }[];
  loMejor: string;
  aCorregir: string;
}

const DUREZA_COLOR: Record<string, string> = {
  tibio: "var(--status-working)",
  normal: "var(--status-waiting)",
  duro: "var(--destructive)",
};

export function SparringSala() {
  const [personaje, setPersonaje] = useState<PersonajeSparring | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pensando, setPensando] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [calificando, setCalificando] = useState(false);
  const [error, setError] = useState("");
  const [escrito, setEscrito] = useState("");
  const finRef = useRef<HTMLDivElement>(null);
  const turnosRef = useRef<Turno[]>([]);
  turnosRef.current = turnos;

  const { habilitado, hablar, cancelar, toggle: toggleVoz, soportado: ttsOk } =
    useHabla({ lang: "es-US", perfil: "natural" });

  // Al terminar de dictar, se manda solo — como una llamada de verdad.
  const { escuchando, soportado: micOk, toggle: toggleMic, detener } =
    useReconocimiento({
      lang: "es-PR",
      onTexto: () => {},
      onFin: (textoFinal) => {
        const t = textoFinal.trim();
        if (t) enviar(t);
      },
    });

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turnos, pensando]);

  async function enviar(texto: string) {
    if (!personaje || pensando) return;
    setError("");
    const nuevos: Turno[] = [...turnosRef.current, { rol: "vendedor", texto }];
    setTurnos(nuevos);
    setPensando(true);
    try {
      const res = await fetch("/api/sparring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "turno",
          personaje: personaje.id,
          mensajes: nuevos,
        }),
      });
      const data = (await res.json()) as { ok: boolean; texto?: string; error?: string };
      if (!data.ok || !data.texto) throw new Error(data.error ?? "sin respuesta");
      setTurnos((prev) => [...prev, { rol: "cliente", texto: data.texto! }]);
      if (habilitado) hablar(data.texto);
    } catch (e) {
      setError(e instanceof Error ? e.message : "no se pudo responder");
    }
    setPensando(false);
  }

  async function colgar() {
    detener();
    cancelar();
    if (turnosRef.current.length < 2) {
      setPersonaje(null);
      setTurnos([]);
      return;
    }
    setCalificando(true);
    setError("");
    try {
      const res = await fetch("/api/sparring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "scorecard",
          personaje: personaje!.id,
          mensajes: turnosRef.current,
        }),
      });
      const data = (await res.json()) as { ok: boolean; scorecard?: Scorecard; error?: string };
      if (!data.ok || !data.scorecard) throw new Error(data.error ?? "error");
      setScorecard(data.scorecard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "no se pudo calificar");
    }
    setCalificando(false);
  }

  function reiniciar() {
    detener();
    cancelar();
    setPersonaje(null);
    setTurnos([]);
    setScorecard(null);
    setError("");
    setEscrito("");
  }

  // ---- Scorecard ----
  if (scorecard) {
    const color =
      scorecard.puntaje >= 75
        ? "var(--status-working)"
        : scorecard.puntaje >= 50
          ? "var(--status-waiting)"
          : "var(--destructive)";
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-b from-card to-background/60">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="font-mono text-5xl font-semibold tabular-nums"
                style={{ color }}
              >
                {scorecard.puntaje}
              </div>
              <div className="min-w-0 flex-1">
                <p className="label-mono text-muted-foreground">Veredicto</p>
                <p className="text-lg font-medium">{scorecard.veredicto}</p>
              </div>
              <Button onClick={reiniciar}>
                <RotateCcw className="size-4" /> Otra práctica
              </Button>
            </div>

            <div className="mt-5 space-y-2">
              {SCORECARD.map((c) => {
                const r = scorecard.criterios.find((x) => x.id === c.id);
                const estado = r?.cumplio;
                return (
                  <div key={c.id} className="flex items-start gap-3 text-sm">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          estado === true
                            ? "var(--status-working)"
                            : estado === false
                              ? "var(--destructive)"
                              : "var(--muted-foreground)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{c.titulo}</span>
                      {r?.nota ? (
                        <p className="text-xs text-muted-foreground">{r.nota}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[var(--status-working)]/40 p-3">
                <p className="label-mono text-[var(--status-working)]">Lo mejor</p>
                <p className="mt-1 text-sm">{scorecard.loMejor}</p>
              </div>
              <div className="rounded-md border border-primary/40 p-3">
                <p className="label-mono text-primary">Corrige esto</p>
                <p className="mt-1 text-sm">{scorecard.aCorregir}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Elegir personaje ----
  if (!personaje) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Elige contra quién practicar. El cliente te va a tirar objeciones
          reales del catálogo de Joe; al colgar recibes tu calificación.
        </p>
        {!micOk ? (
          <p className="text-sm text-[var(--status-waiting)]">
            Este navegador no soporta dictado por voz — vas a poder practicar
            escribiendo. Para voz usa Chrome.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONAJES.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer bg-gradient-to-b from-card to-background/60 transition-colors hover:border-primary/50"
              onClick={() => {
                setPersonaje(p);
                setTurnos([]);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.nombre}</span>
                  <Badge
                    variant="outline"
                    className="label-mono"
                    style={{ color: DUREZA_COLOR[p.dureza] }}
                  >
                    {p.dureza}
                  </Badge>
                </div>
                <p className="label-mono mt-0.5 text-muted-foreground">
                  {p.negocio}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.descripcion}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---- Llamada en curso ----
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{personaje.nombre}</span>
        <span className="label-mono text-muted-foreground">
          {personaje.negocio}
        </span>
        <Badge
          variant="outline"
          className="label-mono"
          style={{ color: DUREZA_COLOR[personaje.dureza] }}
        >
          {personaje.dureza}
        </Badge>
        {ttsOk ? (
          <Button
            size="sm"
            variant={habilitado ? "default" : "outline"}
            className="ml-auto"
            onClick={toggleVoz}
          >
            {habilitado ? "Voz activa" : "Activar voz"}
          </Button>
        ) : null}
      </div>

      <Card className="bg-gradient-to-b from-card to-background/60">
        <CardContent className="max-h-[46vh] space-y-3 overflow-y-auto p-4">
          {turnos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Arranca tú: saluda y preséntate como lo harías en una llamada real.
            </p>
          ) : null}
          {turnos.map((t, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                t.rol === "vendedor"
                  ? "ml-auto bg-primary/15"
                  : "bg-muted/60",
              )}
            >
              <p className="label-mono mb-0.5 text-muted-foreground">
                {t.rol === "vendedor" ? "Tú" : personaje.nombre}
              </p>
              {t.texto}
            </div>
          ))}
          {pensando ? (
            <p className="label-mono text-muted-foreground">
              {personaje.nombre} está respondiendo…
            </p>
          ) : null}
          <div ref={finRef} />
        </CardContent>
      </Card>

      {error ? (
        <p className="text-sm text-[var(--status-waiting)]">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {micOk ? (
          <Button
            variant={escuchando ? "default" : "outline"}
            onClick={toggleMic}
            disabled={pensando}
          >
            {escuchando ? (
              <>
                <Mic className="size-4" /> Hablando… (toca para enviar)
              </>
            ) : (
              <>
                <MicOff className="size-4" /> Hablar
              </>
            )}
          </Button>
        ) : null}

        <form
          className="flex min-w-[240px] flex-1 items-center gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            const t = escrito.trim();
            if (!t) return;
            setEscrito("");
            enviar(t);
          }}
        >
          <input
            value={escrito}
            onChange={(ev) => setEscrito(ev.target.value)}
            placeholder="…o escríbelo"
            className="min-w-0 flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <Button type="submit" variant="outline" disabled={pensando}>
            <Send className="size-4" />
          </Button>
        </form>

        <Button
          variant="outline"
          onClick={colgar}
          disabled={calificando}
          className="text-[var(--destructive)]"
        >
          <PhoneOff className="size-4" />
          {calificando ? "Calificando…" : "Colgar y calificar"}
        </Button>
      </div>
    </div>
  );
}
