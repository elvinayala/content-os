// Efectos base del kit de motion: curvas, fondo vivo, grano, barridos y destellos.
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";

export const suave = Easing.bezier(0.22, 1, 0.36, 1); // out-expo-ish: entra rápido, frena elegante
export const golpe = Easing.bezier(0.7, 0, 0.84, 0); // in: acelera hacia el corte
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);

/** interpolate con clamp y curva por defecto. */
export const tw = (f: number, desde: number, hasta: number, a = 0, b = 1, easing = suave) =>
  interpolate(f, [desde, hasta], [a, b], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Rebote tipo resorte sin depender del fps (para escalas que "pican"). */
export const rebote = (f: number, inicio: number, dur = 18) => {
  const t = Math.max(0, Math.min(1, (f - inicio) / dur));
  if (t === 0) return 0;
  return 1 - Math.exp(-6 * t) * Math.cos(10 * t);
};

export const Fondo: React.FC<{ color: string; brillo: string; brillo2?: string; grid?: string; intensidad?: number }> = ({
  color, brillo, brillo2, grid, intensidad = 1,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const x = 50 + noise2D("fx", f / 120, 0) * 18;
  const y = 45 + noise2D("fy", 0, f / 120) * 14;
  return (
    <AbsoluteFill style={{ background: color }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 70% at ${x}% ${y}%, ${brillo} 0%, transparent 70%)`, opacity: 0.55 * intensidad }} />
      {brillo2 && (
        <AbsoluteFill style={{ background: `radial-gradient(40% 50% at ${100 - x}% ${100 - y}%, ${brillo2} 0%, transparent 70%)`, opacity: 0.35 * intensidad }} />
      )}
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            backgroundPosition: `${(f * 0.6) % 80}px ${(f * 0.3) % 80}px`,
            opacity: 0.22,
            maskImage: `radial-gradient(70% 70% at 50% 50%, black 0%, transparent 100%)`,
          }}
        />
      )}
      <Particulas ancho={width} alto={height} />
    </AbsoluteFill>
  );
};

const Particulas: React.FC<{ ancho: number; alto: number }> = ({ ancho, alto }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {new Array(38).fill(0).map((_, i) => {
        const bx = random(`px${i}`) * ancho;
        const by = random(`py${i}`) * alto;
        const vel = 0.2 + random(`pv${i}`) * 0.8;
        const y = (by - f * vel * 1.4 + alto * 10) % alto;
        const x = bx + noise2D(`pn${i}`, f / 90, i) * 30;
        const r = 1 + random(`pr${i}`) * 2.4;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: r,
            background: "#7BE08A", opacity: 0.15 + random(`po${i}`) * 0.35, filter: "blur(0.5px)",
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Grano de película + viñeta: une todo y le quita lo "digital plano". */
/** Grano + viñeta. `vineta` = qué tan oscuras quedan las esquinas: 0.55 en fondos oscuros; en fondos CLAROS (marcas de
 *  clientes como Quiroplaza o Med Spa, 9/oct) va mucho más suave: una viñeta negra fuerte sobre crema se ve sucia. */
export const Grano: React.FC<{ vineta?: number }> = ({ vineta = 0.55 }) => {
  const f = useCurrentFrame();
  const semilla = f % 8;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,${vineta}) 100%)` }} />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id={`g${semilla}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={semilla} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${semilla})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Barrido diagonal de color que tapa un corte (centrado en `centro`). */
export const Barrido: React.FC<{ centro: number; dur?: number; colores: string[]; angulo?: number }> = ({
  centro, dur = 16, colores, angulo = -12,
}) => {
  const f = useCurrentFrame();
  const inicio = centro - dur / 2;
  if (f < inicio - 2 || f > centro + dur / 2 + 6) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {colores.map((c, i) => {
        const p = tw(f, inicio + i * 2, inicio + dur + i * 2, 0, 1, inOut);
        const x = interpolate(p, [0, 1], [-160, 160]);
        return (
          <div key={i} style={{
            position: "absolute", top: "-50%", left: `${x}%`, width: "140%", height: "200%",
            background: c, transform: `rotate(${angulo}deg)`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/** Destello blanco/verde corto en un golpe. */
export const Destello: React.FC<{ en: number; color?: string; dur?: number; max?: number }> = ({ en, color = "#EAF5EE", dur = 8, max = 0.7 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [en, en + 1, en + dur], [0, max, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Sacudida de cámara que decae (px). */
export const sacudida = (f: number, en: number, fuerza = 18, dur = 12) => {
  const t = f - en;
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = (1 - t / dur) * fuerza;
  return { x: noise2D("sx", t / 2, en) * k, y: noise2D("sy", en, t / 2) * k };
};

/** Aberración cromática / glitch en un rango de frames: devuelve un text-shadow. */
export const glitch = (f: number, desde: number, hasta: number, fuerza = 10) => {
  if (f < desde || f > hasta) return "none";
  const d = (random(`gl${f}`) - 0.5) * fuerza;
  return `${d}px 0 #1FB6A6, ${-d}px 0 #FF4D4D`;
};
