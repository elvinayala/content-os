// El coquí de AI Borinquen "Hollywood" (Elvin, 27/sep/2026: "ponlo a brincar, bien Hollywood, dale interacción").
// Entra de un salto desde fuera de cuadro con una vuelta en el aire y estela neón, aterriza con squash & stretch,
// onda expansiva, polvo, destello y su canto; después queda vivo (ecualizador, ondas, chispas) y da brincos cortos.
// t = frames desde que empieza el salto. Usa el logo v2 por piezas (CoquiAibVector), nunca lo redibuja.
import React from "react";
import { Audio, Sequence, interpolate, random, staticFile } from "remotion";
import { CoquiAibVector } from "./CoquiAibVector";

export const T_ATERRIZA = 18; // frames de vuelo

const choque = (t: number) => (t < T_ATERRIZA ? 0 : Math.max(0, 1 - (t - T_ATERRIZA) / 22));

export const CoquiAibHeroe: React.FC<{
  size: number;
  t: number;
  /** De dónde salta, en múltiplos del tamaño (negativo = izquierda / arriba). */
  desde?: { x: number; y: number };
  /** Cada cuántos frames da un brinco corto después de aterrizar (0 = nunca). */
  brincoCada?: number;
  sonido?: boolean;
}> = ({ size, t, desde = { x: -1.8, y: 0.35 }, brincoCada = 72, sonido = true }) => {
  const alto = (size * 754) / 740;
  const T = T_ATERRIZA;

  // Posición en el vuelo (parábola) y giro completo
  const pos = (tt: number) => {
    const p = Math.max(0, Math.min(1, tt / T));
    const x = (1 - p) * desde.x * size;
    const y = (1 - p) * desde.y * size - 4 * 1.25 * size * p * (1 - p);
    const rot = interpolate(p, [0, 1], [-360, 0], { easing: (v) => 1 - (1 - v) ** 2 });
    return { x, y, rot, p };
  };

  // Brinco corto periódico después de aterrizar
  let saltoY = 0;
  let sx = 1;
  let sy = 1;
  const post = t - T;
  if (t < T) {
    sx = 0.9; sy = 1.14; // estirado en el aire
  } else {
    const k = Math.exp(-post / 3.2) * Math.cos(post / 1.9);
    sy = 1 - 0.34 * k;
    sx = 1 + 0.28 * k;
    if (brincoCada > 0 && post > 40) {
      const c = (post - 40) % brincoCada;
      if (c < 14) {
        const q = c / 14;
        saltoY = -Math.sin(q * Math.PI) * size * 0.16;
        const anticip = c < 2 ? 0.85 : c > 12 ? 0.9 : 1.06;
        sy *= anticip; sx *= 2 - anticip;
      }
    }
  }

  const { x, y, rot, p } = pos(t);
  const vivo = t > T + 6;
  const golpe = choque(t);

  const coqui = (tt: number, opacidad: number, estela = false) => {
    const q = pos(tt);
    return (
      <div style={{
        position: "absolute", left: 0, top: 0, width: size, height: alto, opacity: opacidad,
        transform: `translate(${q.x}px, ${q.y + (estela ? 0 : saltoY)}px) rotate(${q.rot}deg) scale(${estela ? 0.95 : sx}, ${estela ? 1.05 : sy})`,
        transformOrigin: "50% 100%",
        filter: estela ? "grayscale(1) brightness(1.5) sepia(1) saturate(7) hue-rotate(85deg) drop-shadow(0 0 14px #2BFF88)" : undefined,
      }}>
        <CoquiAibVector size={size} vivo={!estela && vivo} brillo={estela ? 0 : 0.6 * golpe} />
      </div>
    );
  };

  return (
    <div style={{ position: "relative", width: size, height: alto }}>
      {/* Onda expansiva y polvo al aterrizar */}
      {t >= T && golpe > 0 && (
        <>
          {[0, 1].map((i) => {
            const g = Math.min(1, (post - i * 3) / 16);
            if (g <= 0) return null;
            return (
              <div key={i} style={{
                position: "absolute", left: size / 2, top: alto * 0.93, width: size * (0.4 + g * 2.6), height: size * (0.1 + g * 0.5),
                transform: "translate(-50%,-50%)", borderRadius: "50%", border: `${Math.max(1, 6 * (1 - g))}px solid ${i ? "#1FB6A6" : "#2BFF88"}`,
                opacity: 1 - g, boxShadow: `0 0 30px ${i ? "#1FB6A6" : "#2BFF88"}`,
              }} />
            );
          })}
          {new Array(16).fill(0).map((_, i) => {
            const ang = Math.PI + (random(`pa${i}`) * Math.PI);
            const vel = 0.6 + random(`pv${i}`) * 1.2;
            const g = Math.min(1, post / 20);
            const dx = Math.cos(ang) * vel * size * 0.7 * g;
            const dy = Math.sin(ang) * vel * size * 0.35 * g + g * g * size * 0.25;
            return <div key={i} style={{ position: "absolute", left: size / 2 + dx, top: alto * 0.95 + dy, width: 8, height: 8, borderRadius: 4, background: i % 3 ? "#2BFF88" : "#E63946", opacity: 1 - g, boxShadow: "0 0 10px #2BFF88" }} />;
          })}
          <div style={{ position: "absolute", left: size / 2, top: alto / 2, width: size * 3, height: size * 3, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(43,255,136,0.35), transparent 60%)", opacity: golpe }} />
        </>
      )}
      {/* Estela en el aire */}
      {t < T + 2 && [6, 4, 2].map((d, i) => (t - d > 0 ? <React.Fragment key={d}>{coqui(t - d, 0.12 + i * 0.1, true)}</React.Fragment> : null))}
      {t >= 0 && coqui(t, p > 0 || t >= T ? 1 : 0)}
      {sonido && (
        <>
          <Sequence from={-Math.min(0, 0)} durationInFrames={30} layout="none"><Audio src={staticFile("audio/whoosh.mp3")} volume={0.55} /></Sequence>
          <Sequence from={T} durationInFrames={40} layout="none"><Audio src={staticFile("audio/aterriza.mp3")} volume={0.8} /></Sequence>
          <Sequence from={T} durationInFrames={50} layout="none"><Audio src={staticFile("audio/boom.mp3")} volume={0.45} /></Sequence>
          <Sequence from={T + 6} durationInFrames={60} layout="none"><Audio src={staticFile("audio/coqui.mp3")} volume={0.75} /></Sequence>
        </>
      )}
      <div style={{ display: "none" }}>{x + y + rot}</div>
    </div>
  );
};

/** Desplazamiento vertical para que algo "reciba el golpe" del aterrizaje (p. ej. el nombre rebota). */
export const rebotePorGolpe = (t: number, fuerza = 18) => {
  if (t < T_ATERRIZA) return 0;
  const k = t - T_ATERRIZA;
  return fuerza * Math.exp(-k / 4) * Math.sin(k / 1.6);
};
