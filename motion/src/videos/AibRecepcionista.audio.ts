// Audio del video: pista de música + efectos sincronizados por frame (archivos en public/audio/,
// generados con motion/scripts/audio.mjs). La pista trae un riser de 2 s y el primer golpe en 2.0 s
// (120 BPM = un golpe cada 15 frames): cae justo con la entrada del coquí (frame 62).
export const PISTA: { archivo: string; volumen: number; desde: number } | null = {
  archivo: "audio/aib-recepcionista-musica.wav",
  volumen: 0.55,
  desde: 2,
};

export const SFX: { archivo: string; en: number; volumen: number; dur?: number }[] = [
  // 1 · el problema
  { archivo: "audio/vibra.mp3", en: 0, volumen: 0.5 },
  { archivo: "audio/ding.mp3", en: 8, volumen: 0.4 },
  { archivo: "audio/ding.mp3", en: 20, volumen: 0.45 },
  { archivo: "audio/vibra.mp3", en: 24, volumen: 0.45 },
  { archivo: "audio/ding.mp3", en: 32, volumen: 0.5 },
  { archivo: "audio/whoosh.mp3", en: 50, volumen: 0.7 },
  // 2 · el coquí
  { archivo: "audio/aterriza.mp3", en: 90, volumen: 0.8 },
  { archivo: "audio/coqui.mp3", en: 98, volumen: 0.9, dur: 60 },
  // 3 · presenta
  { archivo: "audio/whoosh.mp3", en: 131, volumen: 0.6 },
  // 4 · la prueba
  { archivo: "audio/whoosh.mp3", en: 235, volumen: 0.6 },
  { archivo: "audio/contesta.mp3", en: 264, volumen: 0.5 },
  { archivo: "audio/pop.mp3", en: 264, volumen: 0.35 },
  { archivo: "audio/pop.mp3", en: 286, volumen: 0.35 },
  { archivo: "audio/pop.mp3", en: 302, volumen: 0.35 },
  { archivo: "audio/pop.mp3", en: 322, volumen: 0.4 },
  // 5 · cierre
  { archivo: "audio/impacto.mp3", en: 358, volumen: 0.8, dur: 60 },
  { archivo: "audio/brillo.mp3", en: 410, volumen: 0.5 },
];
