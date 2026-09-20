"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Voz de Jarvis con la Web Speech API (nativa del navegador, sin API key).
// - Reconocimiento (dictado): hablás → texto.
// - Habla (TTS): Jarvis te responde en voz.

// ---- tipos mínimos (la API no está en lib.dom estándar) ----
interface SpeechRecognitionAlt {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlt;
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Dictado: acumula lo dicho y lo entrega por onTexto (texto completo hasta ahora).
export function useReconocimiento({
  lang = "es-PR",
  onTexto,
  onFin,
}: {
  lang?: string;
  onTexto: (texto: string) => void;
  onFin?: (textoFinal: string) => void;
}) {
  const [escuchando, setEscuchando] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    setSoportado(getRecognitionCtor() !== null);
  }, []);

  const detener = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const iniciar = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      onTexto((finalRef.current + interim).trim());
    };
    rec.onend = () => {
      setEscuchando(false);
      onFin?.(finalRef.current.trim());
    };
    rec.onerror = () => setEscuchando(false);
    recRef.current = rec;
    rec.start();
    setEscuchando(true);
  }, [lang, onTexto, onFin]);

  const toggle = useCallback(() => {
    if (escuchando) detener();
    else iniciar();
  }, [escuchando, detener, iniciar]);

  return { escuchando, soportado, toggle, detener };
}

// Limpia markdown para que el TTS no lea "asterisco asterisco" ni URLs largas.
function limpiarParaVoz(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " (bloque de código) ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`~]/g, "")
    .replace(/^\s*[-•]\s*/gm, ". ") // viñetas → pausa de frase (más natural que coma)
    .replace(/https?:\/\/\S+/g, " un enlace ")
    .replace(/\$(\d[\d.,]*)/g, "$1 dólares") // "$2,500" → "2,500 dólares"
    .replace(/(\d)\s*%/g, "$1 por ciento")
    .replace(/\s*·\s*/g, ", ") // el separador · se lee raro → coma
    .replace(/\n{2,}/g, ". ") // párrafos → punto (pausa)
    .replace(/\s+/g, " ")
    .trim();
}

// Puntúa una voz en español: más alto = más natural/clara. Prioriza las voces
// de red de Google (Chrome) y las "enhanced/premium" de Apple sobre las
// "compact" robóticas, y el acento latino (es-US/419/MX) sobre el de España.
function puntuarVoz(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  const l = v.lang.toLowerCase();
  if (!l.startsWith("es")) return -1;
  let p = 0;
  // Motor / calidad
  if (n.includes("google")) p += 6; // voces de red de Chrome: muy naturales
  if (/enhanced|premium|natural|neural|siri/.test(n)) p += 5; // Apple mejoradas
  if (v.localService === false) p += 2; // servidas por red = mejor calidad
  if (/compact|eloquence|espeak/.test(n)) p -= 6; // robóticas
  // Nombres premium latinos de Apple (voces masculinas primero para "Jarvis")
  if (/jorge|juan|diego|carlos/.test(n)) p += 3;
  if (/paulina|mónica|monica|marisol|angelica|angélica/.test(n)) p += 2;
  // Acento: latino > neutro > España
  if (l.startsWith("es-us") || l.startsWith("es-419")) p += 4;
  else if (l.startsWith("es-mx") || l.startsWith("es-pr")) p += 3;
  else if (l.startsWith("es-es")) p -= 1; // acento de España, peor fit para PR
  return p;
}

// Perfil ROBÓTICO/futurista (tipo Jarvis de película): preferí una voz masculina
// grave; un poco de penalización a las "compact" pero sin descartarlas (el timbre
// sintético suma al efecto). El carácter robótico se logra sobre todo con el pitch.
function puntuarVozRobotica(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  const l = v.lang.toLowerCase();
  if (!l.startsWith("es")) return -1;
  let p = 0;
  // Masculinas graves primero (Jarvis es voz de hombre).
  if (/jorge|juan|diego|carlos|arturo|miguel/.test(n)) p += 6;
  if (/google/.test(n)) p += 4; // clara y consistente
  if (/enhanced|premium|neural/.test(n)) p += 2;
  // acento latino
  if (l.startsWith("es-us") || l.startsWith("es-419") || l.startsWith("es-mx")) p += 3;
  else if (l.startsWith("es-es")) p += 1;
  // femeninas al fondo para este perfil
  if (/paulina|monica|mónica|marisol|angelica|angélica|esperanza/.test(n)) p -= 3;
  return p;
}

export function useHabla({
  lang = "es-US",
  perfil = "natural",
}: { lang?: string; perfil?: "natural" | "robotico" } = {}) {
  const [habilitado, setHabilitado] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setSoportado(ok);
    if (!ok) return;
    const puntuar = perfil === "robotico" ? puntuarVozRobotica : puntuarVoz;
    const elegir = () => {
      const voces = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.toLowerCase().startsWith("es"));
      if (voces.length === 0) return;
      // La mejor por puntaje.
      vozRef.current = voces
        .map((v) => ({ v, p: puntuar(v) }))
        .sort((a, b) => b.p - a.p)[0].v;
    };
    elegir();
    window.speechSynthesis.onvoiceschanged = elegir;
  }, [perfil]);

  const hablar = useCallback(
    (texto: string) => {
      if (!habilitado || !soportado) return;
      const limpio = limpiarParaVoz(texto);
      if (!limpio) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(limpio);
      // Usar el idioma real de la voz elegida evita el mismatch robótico.
      u.lang = vozRef.current?.lang ?? lang;
      if (vozRef.current) u.voice = vozRef.current;
      if (perfil === "robotico") {
        // Grave pero ÁGIL (antes iba muy lento). Timbre de IA de película.
        u.rate = 1.12;
        u.pitch = 0.7;
      } else {
        u.rate = 1.0;
        u.pitch = 1.0;
      }
      u.volume = 1.0;
      u.onstart = () => setHablando(true);
      u.onend = () => setHablando(false);
      u.onerror = () => setHablando(false);
      window.speechSynthesis.speak(u);
    },
    [habilitado, soportado, lang, perfil],
  );

  const cancelar = useCallback(() => {
    if (soportado) window.speechSynthesis.cancel();
    setHablando(false);
  }, [soportado]);

  const toggle = useCallback(() => {
    setHabilitado((prev) => {
      if (prev) window.speechSynthesis?.cancel();
      return !prev;
    });
  }, []);

  return { habilitado, hablando, soportado, hablar, cancelar, toggle };
}
