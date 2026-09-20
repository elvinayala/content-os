"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Manos libres para Jarvis: (1) detección de DOS APLAUSOS con el micrófono para
// prender/apagar la sesión, y (2) ESCUCHA CONTINUA que entrega cada frase hablada
// sin tocar botón. Ambos usan la Web Audio / Web Speech API (sin API key).
// El micrófono se "arma" una vez con un gesto del usuario (requisito del navegador).

// ---- Detección de dos aplausos ----
export function useAplausos(onDobleAplauso: () => void) {
  const [armado, setArmado] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ultimoPicoRef = useRef(0);
  const primerAplausoRef = useRef(0);
  const cbRef = useRef(onDobleAplauso);
  cbRef.current = onDobleAplauso;

  const desarmar = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    streamRef.current = null;
    setArmado(false);
  }, []);

  const armar = useCallback(async () => {
    if (armado) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const datos = new Uint8Array(analyser.fftSize);
      ctxRef.current = ctx;
      streamRef.current = stream;

      const loop = () => {
        analyser.getByteTimeDomainData(datos);
        // pico = máxima desviación del centro (128)
        let pico = 0;
        for (let i = 0; i < datos.length; i++) {
          const d = Math.abs(datos[i] - 128);
          if (d > pico) pico = d;
        }
        const ahora = performance.now();
        // Un aplauso = transiente fuerte y corto. Umbral alto + debounce 180ms.
        if (pico > 92 && ahora - ultimoPicoRef.current > 180) {
          ultimoPicoRef.current = ahora;
          if (ahora - primerAplausoRef.current < 900) {
            // segundo aplauso dentro de la ventana → dispara
            primerAplausoRef.current = 0;
            cbRef.current();
          } else {
            primerAplausoRef.current = ahora;
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      setArmado(true);
    } catch {
      setArmado(false);
    }
  }, [armado]);

  useEffect(() => () => desarmar(), [desarmar]);

  return { armado, armar, desarmar };
}

// ---- Escucha continua: entrega cada FRASE final, se reinicia sola, pausable ----
interface RecLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
        resultIndex: number;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}
type RecCtor = new () => RecLike;

function getCtor(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecCtor;
    webkitSpeechRecognition?: RecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useEscuchaContinua({
  lang = "es-PR",
  onFrase,
  onInterino,
}: {
  lang?: string;
  onFrase: (texto: string) => void;
  onInterino?: (texto: string) => void;
}) {
  const [activa, setActiva] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const recRef = useRef<RecLike | null>(null);
  const activaRef = useRef(false);
  const pausadaRef = useRef(false);
  const onFraseRef = useRef(onFrase);
  const onInterinoRef = useRef(onInterino);
  onFraseRef.current = onFrase;
  onInterinoRef.current = onInterino;

  useEffect(() => {
    setSoportado(getCtor() !== null);
  }, []);

  const crear = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0].transcript;
        if (r.isFinal) {
          const frase = t.trim();
          if (frase && !pausadaRef.current) onFraseRef.current(frase);
        } else {
          interim += t;
        }
      }
      if (interim && !pausadaRef.current) onInterinoRef.current?.(interim.trim());
    };
    rec.onend = () => {
      // Chrome corta tras un silencio: reiniciar mientras la sesión siga activa.
      if (activaRef.current) {
        try {
          rec.start();
        } catch {
          /* ya arrancó */
        }
      }
    };
    rec.onerror = () => {};
    return rec;
  }, [lang]);

  const iniciar = useCallback(() => {
    if (activaRef.current) return;
    const rec = crear();
    if (!rec) return;
    recRef.current = rec;
    activaRef.current = true;
    setActiva(true);
    try {
      rec.start();
    } catch {}
  }, [crear]);

  const detener = useCallback(() => {
    activaRef.current = false;
    setActiva(false);
    try {
      recRef.current?.abort();
    } catch {}
    recRef.current = null;
  }, []);

  // Pausar mientras Jarvis habla (evita que se escuche a sí mismo).
  const pausar = useCallback(() => {
    pausadaRef.current = true;
  }, []);
  const reanudar = useCallback(() => {
    pausadaRef.current = false;
  }, []);

  useEffect(() => () => detener(), [detener]);

  return { activa, soportado, iniciar, detener, pausar, reanudar };
}
