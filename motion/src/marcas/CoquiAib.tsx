// El coquí de circuitos de AI Borinquen. El logo oficial solo existe en PNG, así que NO se parte
// ni se redibuja: se anima entero (revelado por escaneo, glitch RGB, pulsos de señal que salen de
// sus ondas, brillo de los nodos). Con los valores por defecto se ve igual al logo.
import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { C, FUENTE, LOGO_COQUI } from "./aib";

const PROPORCION = 754 / 741; // alto / ancho del recorte
// Dónde nacen las ondas de voz del logo (arriba a la derecha), en fracción del recorte.
const ONDAS = { x: 0.78, y: 0.07 };

export type CoquiAibProps = {
  size: number; // ancho en px
  /** 0 → 1: se revela de abajo hacia arriba con una línea de escaneo. */
  revela?: number;
  /** Glitch RGB activo en este frame. */
  glitch?: boolean;
  /** Pulsos de señal (0 → 1 es un ciclo). null = sin pulsos. */
  senal?: number | null;
  /** Brillo extra (0–1) para golpes. */
  brillo?: number;
};

export const CoquiAib: React.FC<CoquiAibProps> = ({ size, revela = 1, glitch = false, senal = null, brillo = 0 }) => {
  const f = useCurrentFrame();
  const alto = size * PROPORCION;
  const corte = (1 - revela) * 100; // % tapado desde arriba
  const dx = glitch ? (random(`cg${f}`) - 0.5) * size * 0.05 : 0;
  const src = staticFile(LOGO_COQUI);
  const capa: React.CSSProperties = { position: "absolute", inset: 0, width: size, height: alto, clipPath: `inset(${corte}% 0 0 0)` };
  return (
    <div style={{ position: "relative", width: size, height: alto }}>
      {/* pulsos de señal: salen de las ondas del logo */}
      {senal !== null &&
        [0, 1, 2].map((i) => {
          const p = (senal + i / 3) % 1;
          const d = size * (0.1 + p * 0.9);
          return (
            <div key={i} style={{
              position: "absolute", left: size * ONDAS.x, top: alto * ONDAS.y, width: d, height: d, borderRadius: "50%",
              transform: "translate(-50%,-50%)", border: `${Math.max(1, size * 0.008 * (1 - p))}px solid ${i === 1 ? C.teal : C.verde}`,
              opacity: (1 - p) * 0.7,
            }} />
          );
        })}
      {glitch && (
        <>
          <Img src={src} style={{ ...capa, transform: `translateX(${dx}px)`, filter: "hue-rotate(140deg) saturate(3)", opacity: 0.55, mixBlendMode: "screen" }} />
          <Img src={src} style={{ ...capa, transform: `translateX(${-dx}px)`, filter: "hue-rotate(-60deg) saturate(3)", opacity: 0.55, mixBlendMode: "screen" }} />
        </>
      )}
      {/* El resplandor va en un contenedor aparte: si comparte elemento con el clip-path, el
          recorte lo corta en rectángulo y se ve una "caja" alrededor del coquí. */}
      <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${size * (0.02 + brillo * 0.05)}px ${C.verde}${brillo > 0.3 ? "99" : "44"})` }}>
        <Img src={src} style={capa} />
      </div>
      {/* línea de escaneo mientras se revela */}
      {revela > 0 && revela < 1 && (
        <div style={{
          position: "absolute", left: -size * 0.1, right: -size * 0.1, top: `${corte}%`, height: 4,
          background: C.verde, boxShadow: `0 0 24px 6px ${C.verde}`, borderRadius: 2,
        }} />
      )}
    </div>
  );
};

/** El nombre "AI Borinquen" con el punto rojo del logo (el PNG oficial trae el nombre cortado). */
export const NombreAib: React.FC<{ tam: number; color?: string; style?: React.CSSProperties }> = ({ tam, color = C.texto, style }) => (
  <div style={{ position: "relative", display: "inline-block", fontFamily: FUENTE, fontWeight: 700, fontSize: tam, color, letterSpacing: "-0.01em", lineHeight: 1, ...style }}>
    AI Borinquen
    <span style={{ position: "absolute", right: -tam * 0.2, top: -tam * 0.02, width: tam * 0.2, height: tam * 0.2, borderRadius: "50%", background: C.rojoLogo }} />
  </div>
);
