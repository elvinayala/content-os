// Tipografía cinética: palabras que suben por máscara, con stagger y salida.
import React from "react";
import { useCurrentFrame } from "remotion";
import { tw, golpe } from "./fx";

type Props = {
  texto: string;
  entra: number;
  sale?: number;
  stagger?: number;
  tam: number;
  fuente: string;
  peso?: number;
  color?: string;
  /** Si se da, el texto se pinta con este gradiente (background-clip). */
  gradiente?: string;
  espaciado?: number;
  alinear?: "left" | "center";
  sombra?: string;
};

export const Palabras: React.FC<Props> = ({
  texto, entra, sale, stagger = 3, tam, fuente, peso = 800, color = "#fff", gradiente, espaciado = -0.035, alinear = "center", sombra,
}) => {
  const f = useCurrentFrame();
  const palabras = texto.split(" ");
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", justifyContent: alinear === "center" ? "center" : "flex-start",
      gap: `0 ${tam * 0.26}px`, fontFamily: fuente, fontWeight: peso, fontSize: tam, lineHeight: 1.02,
      letterSpacing: `${espaciado}em`,
    }}>
      {palabras.map((p, i) => {
        const e = tw(f, entra + i * stagger, entra + i * stagger + 14);
        const s = sale !== undefined ? tw(f, sale + i * 1.5, sale + i * 1.5 + 9, 0, 1, golpe) : 0;
        const y = (1 - e) * 110 - s * 110;
        const rot = (1 - e) * 6;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: tam * 0.12, marginBottom: -tam * 0.12 }}>
            <span style={{
              display: "inline-block", transform: `translateY(${y}%) rotate(${rot}deg)`, transformOrigin: "left bottom",
              color: gradiente ? "transparent" : color,
              backgroundImage: gradiente, backgroundClip: gradiente ? "text" : undefined,
              WebkitBackgroundClip: gradiente ? "text" : undefined,
              textShadow: sombra,
            }}>
              {p}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Una etiqueta tipo "chip" que entra con escala y brillo. */
export const Chip: React.FC<{ texto: string; entra: number; fuente: string; fondo: string; borde: string; color: string; tam?: number; icono?: React.ReactNode }> = ({
  texto, entra, fuente, fondo, borde, color, tam = 44, icono,
}) => {
  const f = useCurrentFrame();
  const e = tw(f, entra, entra + 14);
  const brillo = tw(f, entra + 6, entra + 26, -30, 130);
  return (
    <div style={{
      position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: tam * 0.35,
      padding: `${tam * 0.32}px ${tam * 0.6}px`, borderRadius: 999, background: fondo, border: `2px solid ${borde}`,
      fontFamily: fuente, fontWeight: 600, fontSize: tam, color,
      transform: `translateY(${(1 - e) * 40}px) scale(${0.85 + e * 0.15})`, opacity: e,
    }}>
      {icono}
      {texto}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: `${brillo}%`, width: "30%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)", transform: "skewX(-20deg)",
      }} />
    </div>
  );
};
