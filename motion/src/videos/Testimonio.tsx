// Testimonio con subtítulos (28/sep/2026): toma un video ya cortado (p. ej. un Zoom donde solo quedó el cliente),
// le pone subtítulos en la letra de la marca, un rótulo con el nombre al inicio y, si hace falta, la pregunta que
// se le hizo arriba (para que se entienda la respuesta sin la voz de quien entrevista). Todo sale de props:
//   npx remotion render src/index.ts Testimonio out/x.mp4 --props=<json { video, dur, nombre, rol, etiqueta?, subtitulos, pregunta? }>
import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as mono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: GROT } = loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
const { fontFamily: MONO } = mono("normal", { weights: ["500"], subsets: ["latin"] });

export type Subtitulo = { desde: number; hasta: number; texto: string };
export type PropsTestimonio = {
  video: string; // archivo en public/
  dur: number; // segundos
  nombre: string;
  rol: string;
  etiqueta?: string; // arriba a la derecha, p. ej. "AI BORINQUEN · TESTIMONIO"
  acento?: string;
  subtitulos: Subtitulo[];
  pregunta?: Subtitulo;
};

const entra = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Testimonio: React.FC<PropsTestimonio> = ({ video, nombre, rol, etiqueta, acento = "#4cc66e", subtitulos, pregunta }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sub = subtitulos.find((s) => t >= s.desde && t < s.hasta);
  const eSub = sub ? Math.min(entra(t, sub.desde, sub.desde + 0.18), 1 - entra(t, sub.hasta - 0.12, sub.hasta)) : 0;
  const rotulo = Math.min(entra(t, 0.3, 0.9), 1 - entra(t, 5.2, 5.8));
  const ePreg = pregunta ? Math.min(entra(t, pregunta.desde, pregunta.desde + 0.3), 1 - entra(t, pregunta.hasta - 0.3, pregunta.hasta)) : 0;
  return (
    <AbsoluteFill style={{ background: "#081120" }}>
      <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* Degradado abajo para que el subtítulo se lea sobre cualquier fondo */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,17,32,0) 58%, rgba(8,17,32,.78) 100%)" }} />
      {etiqueta && (
        <div style={{ position: "absolute", right: 56, top: 44, fontFamily: MONO, fontSize: 22, letterSpacing: ".18em", color: "#eef2f9", background: "rgba(8,17,32,.62)", padding: "10px 18px", borderRadius: 10, border: "1px solid rgba(79,207,226,.35)" }}>
          {etiqueta}
        </div>
      )}
      {/* Rótulo con el nombre */}
      <div style={{ position: "absolute", left: 64, top: 64, opacity: rotulo, transform: `translateX(${(1 - rotulo) * -30}px)`, display: "flex", gap: 18, alignItems: "stretch" }}>
        <div style={{ width: 6, borderRadius: 4, background: acento }} />
        <div style={{ background: "rgba(8,17,32,.72)", padding: "16px 26px", borderRadius: 14 }}>
          <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 40, color: "#eef2f9" }}>{nombre}</div>
          <div style={{ fontFamily: GROT, fontWeight: 500, fontSize: 26, color: "#b9c6de", marginTop: 4 }}>{rol}</div>
        </div>
      </div>
      {/* La pregunta que se le hizo (la voz de quien entrevista se cortó) */}
      {pregunta && ePreg > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: ePreg }}>
          <div style={{ fontFamily: GROT, fontWeight: 600, fontSize: 44, color: "#081120", background: "#eef2f9", padding: "14px 30px", borderRadius: 14 }}>{pregunta.texto}</div>
        </div>
      )}
      {/* Subtítulo */}
      {sub && (
        <div style={{ position: "absolute", left: 160, right: 160, bottom: 70, display: "flex", justifyContent: "center", opacity: eSub, transform: `translateY(${(1 - eSub) * 12}px)` }}>
          <div style={{ fontFamily: GROT, fontWeight: 600, fontSize: 54, lineHeight: 1.22, color: "#ffffff", textAlign: "center", textWrap: "balance", background: "rgba(8,17,32,.78)", padding: "14px 30px", borderRadius: 16, maxWidth: 1500 } as React.CSSProperties}>
            {sub.texto}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
