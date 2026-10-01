// Testimonio con subtítulos (28/sep/2026): toma un video ya cortado (p. ej. un Zoom donde solo quedó el cliente),
// le pone subtítulos en la letra de la marca, un rótulo con el nombre al inicio y, si hace falta, la pregunta que
// se le hizo arriba (para que se entienda la respuesta sin la voz de quien entrevista). Todo sale de props:
//   npx remotion render src/index.ts Testimonio out/x.mp4 --props=<json { video, dur, nombre, rol, etiqueta?, subtitulos, pregunta? }>
import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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
  /** 9:16: el video (16:9) al centro sobre un fondo difuminado de sí mismo, nombre arriba y subtítulos debajo. */
  vertical?: boolean;
  /** 9:16 con un video que YA es vertical (Zoom en celular): a pantalla completa, rótulo y subtítulos abajo. */
  retrato?: boolean;
  /** Logo del negocio del cliente (PNG blanco, transparente), suave arriba a la izquierda. */
  logoCliente?: string;
  /** Logo de nuestra marca (PNG para fondo oscuro), pequeño arriba a la derecha; reemplaza la etiqueta. */
  logoMarca?: string;
};

const entra = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Testimonio: React.FC<PropsTestimonio> = (props) =>
  props.retrato ? <TestimonioRetrato {...props} /> : props.vertical ? <TestimonioVertical {...props} /> : <TestimonioHorizontal {...props} />;

/** 9:16 con el video vertical a pantalla completa (30/sep, Yazan · Sola Boutique). Logos discretos arriba,
 *  rótulo con el nombre los primeros segundos y subtítulos en el tercio de abajo (fuera de la zona de los botones de Reels). */
const TestimonioRetrato: React.FC<PropsTestimonio> = ({ video, nombre, rol, etiqueta, acento = "#4cc66e", subtitulos, logoCliente, logoMarca }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = f / fps;
  const fin = durationInFrames / fps;
  const sub = subtitulos.find((s) => t >= s.desde && t < s.hasta);
  const eSub = sub ? Math.min(entra(t, sub.desde, sub.desde + 0.18), 1 - entra(t, sub.hasta - 0.12, sub.hasta)) : 0;
  const rotulo = Math.min(entra(t, 0.4, 1.0), 1 - entra(t, 5.6, 6.2));
  const eLogos = entra(t, 0.2, 1.2);
  const salida = 1 - entra(t, fin - 0.5, fin);
  return (
    <AbsoluteFill style={{ background: "#050e0a", opacity: Math.max(salida, 0.0001) }}>
      <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,14,10,.55) 0%, rgba(5,14,10,0) 16%, rgba(5,14,10,0) 55%, rgba(5,14,10,.82) 100%)" }} />
      {logoCliente && (
        <Img src={staticFile(logoCliente)} style={{ position: "absolute", left: 64, top: 96, height: 92, opacity: 0.88 * eLogos, filter: "drop-shadow(0 2px 10px rgba(0,0,0,.35))" }} />
      )}
      {logoMarca ? (
        <Img src={staticFile(logoMarca)} style={{ position: "absolute", right: 60, top: 112, height: 50, opacity: 0.92 * eLogos, filter: "drop-shadow(0 2px 10px rgba(0,0,0,.35))" }} />
      ) : etiqueta ? (
        <div style={{ position: "absolute", right: 60, top: 112, fontFamily: MONO, fontSize: 22, letterSpacing: ".18em", color: "#eef2f9", background: "rgba(8,17,32,.62)", padding: "10px 18px", borderRadius: 10 }}>{etiqueta}</div>
      ) : null}
      <div style={{ position: "absolute", left: 64, bottom: 640, opacity: rotulo, transform: `translateX(${(1 - rotulo) * -30}px)`, display: "flex", gap: 18, alignItems: "stretch" }}>
        <div style={{ width: 6, borderRadius: 4, background: acento }} />
        <div style={{ background: "rgba(5,14,10,.7)", padding: "16px 26px", borderRadius: 14 }}>
          <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 50, color: "#eef2f9" }}>{nombre}</div>
          <div style={{ fontFamily: GROT, fontWeight: 500, fontSize: 32, color: "#c9d6cf", marginTop: 4 }}>{rol}</div>
        </div>
      </div>
      {sub && (
        <div style={{ position: "absolute", left: 70, right: 70, bottom: 360, display: "flex", justifyContent: "center", opacity: eSub, transform: `translateY(${(1 - eSub) * 12}px)` }}>
          <div style={{ fontFamily: GROT, fontWeight: 600, fontSize: 58, lineHeight: 1.22, color: "#ffffff", textAlign: "center", textWrap: "balance", background: "rgba(5,14,10,.74)", padding: "16px 30px", borderRadius: 18 } as React.CSSProperties}>{sub.texto}</div>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 250, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: ".12em", color: "rgba(238,242,249,.6)", opacity: eLogos }}>
        RESULTADOS DE CLIENTES REALES · CADA NEGOCIO ES DISTINTO
      </div>
    </AbsoluteFill>
  );
};

const TestimonioHorizontal: React.FC<PropsTestimonio> = ({ video, nombre, rol, etiqueta, acento = "#4cc66e", subtitulos, pregunta }) => {
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

/** Versión 9:16 (WhatsApp, Reels): el Zoom horizontal al centro, fondo difuminado, nombre arriba, subtítulo debajo. */
const TestimonioVertical: React.FC<PropsTestimonio> = ({ video, nombre, rol, etiqueta, acento = "#4cc66e", subtitulos, pregunta }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const sub = subtitulos.find((s) => t >= s.desde && t < s.hasta);
  const eSub = sub ? Math.min(entra(t, sub.desde, sub.desde + 0.18), 1 - entra(t, sub.hasta - 0.12, sub.hasta)) : 0;
  const ePreg = pregunta ? Math.min(entra(t, pregunta.desde, pregunta.desde + 0.3), 1 - entra(t, pregunta.hasta - 0.3, pregunta.hasta)) : 0;
  const altoVideo = Math.round((1080 * 9) / 16) + 90; // un poco más alto que 16:9: recorta los lados y agranda la cara
  return (
    <AbsoluteFill style={{ background: "#081120" }}>
      <OffthreadVideo src={staticFile(video)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(38px) brightness(.45) saturate(1.2)", transform: "scale(1.15)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,17,32,.55) 0%, rgba(8,17,32,.1) 35%, rgba(8,17,32,.1) 65%, rgba(8,17,32,.7) 100%)" }} />
      {etiqueta && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: ".18em", color: "#eef2f9", background: "rgba(8,17,32,.62)", padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(79,207,226,.35)" }}>{etiqueta}</div>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ width: 90, height: 6, borderRadius: 4, background: acento, marginBottom: 14 }} />
        <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 58, color: "#eef2f9", textAlign: "center" }}>{nombre}</div>
        <div style={{ fontFamily: GROT, fontWeight: 500, fontSize: 34, color: "#b9c6de", textAlign: "center" }}>{rol}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: (1920 - altoVideo) / 2 - 40, height: altoVideo, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,.55)" }}>
        <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {pregunta && ePreg > 0 && (
        <div style={{ position: "absolute", left: 60, right: 60, top: (1920 - altoVideo) / 2 - 150, display: "flex", justifyContent: "center", opacity: ePreg }}>
          <div style={{ fontFamily: GROT, fontWeight: 600, fontSize: 46, color: "#081120", background: "#eef2f9", padding: "14px 28px", borderRadius: 14, textAlign: "center" }}>{pregunta.texto}</div>
        </div>
      )}
      {sub && (
        <div style={{ position: "absolute", left: 70, right: 70, top: (1920 + altoVideo) / 2 + 10, display: "flex", justifyContent: "center", opacity: eSub, transform: `translateY(${(1 - eSub) * 12}px)` }}>
          <div style={{ fontFamily: GROT, fontWeight: 600, fontSize: 60, lineHeight: 1.2, color: "#ffffff", textAlign: "center", textWrap: "balance", background: "rgba(8,17,32,.78)", padding: "16px 30px", borderRadius: 18 } as React.CSSProperties}>{sub.texto}</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
