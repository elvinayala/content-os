// Capas de motion de Cortex (14/oct, Elvin: «pon Remotion también en todo»). Cortex (el editor de video) le pide a Remi
// UNA capa transparente por gráfico (cifra, anillo de %, ícono 3D, cursor del CTA, lluvia); FFmpeg la pone encima del
// video en su momento. Subtítulos, cortes y audio siguen en FFmpeg (el estándar de Yulianna). El estilo copia el que
// Cortex dibujaba antes con libass/PIL, pero con animación de verdad (resortes, brillo, rebote).
// Se renderiza en VP9 con alpha (Remi /capas). Coordenadas normalizadas 0-1 sobre el cuadro de salida.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as cargarInter } from "@remotion/google-fonts/Inter";
import { loadFont as cargarMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as cargarPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as cargarDmSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as cargarCormorant } from "@remotion/google-fonts/CormorantGaramond";

const FUENTES = {
  inter: cargarInter("normal", { weights: ["300", "600", "900"], subsets: ["latin"] }).fontFamily,
  montserrat: cargarMontserrat("normal", { weights: ["300", "500", "900"], subsets: ["latin"] }).fontFamily,
  poppins: cargarPoppins("normal", { weights: ["400", "600", "800"], subsets: ["latin"] }).fontFamily,
  dmserif: cargarDmSerif("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  cormorant: cargarCormorant("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily,
} as const;
export type Fuente = keyof typeof FUENTES;
const PESO: Record<Fuente, number> = { inter: 900, montserrat: 900, poppins: 800, dmserif: 400, cormorant: 700 };

export type Elemento =
  | { tipo: "cifra"; texto: string; sub?: string | null; clase: "money" | "count" | "percent" | "plain"; desde?: number | null; hasta?: number | null; sufijo?: string; x: number; y: number; color: string }
  | { tipo: "anillo"; pct: number; etiqueta?: string; color: string; x: number; y: number; diametro: number }
  | { tipo: "icono"; src: string; lado: "left" | "right"; x: number; y: number; escala: number }
  | { tipo: "cursor"; src: string; x: number; y: number }
  | { tipo: "lluvia"; src: string; cantidad: number; escala: number; apilar: boolean; desdeY?: number | null; semilla: number };

export type PropsCapa = { ancho: number; alto: number; fps: number; dur: number; fuente: Fuente; elemento: Elemento };

const base = (W: number, H: number) => Math.min(W, 0.75 * H); // misma medida que Cortex para los tamaños de letra

function oscurecer(hex: string, k = 0.45) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.round(((n >> s) & 255) * k);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

function salida(frame: number, total: number, fps: number) {
  return interpolate(frame, [total - Math.round(0.22 * fps), total - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

const Cifra: React.FC<{ e: Extract<Elemento, { tipo: "cifra" }>; f: string; peso: number }> = ({ e, f, peso }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const B = base(W, H);
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const esc = interpolate(pop, [0, 1], [0.55, 1]);
  const op = Math.min(interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" }), salida(frame, durationInFrames, fps));
  const dinero = e.clase === "money";
  const col = dinero ? e.color : "#FFFFFF";
  let texto = e.texto;
  if (e.clase === "count" && e.desde != null && e.hasta != null && durationInFrames > 12) {
    const p = interpolate(frame, [0, durationInFrames * 0.8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.poly(2.2)) });
    texto = Math.round(e.desde + (e.hasta - e.desde) * p).toLocaleString("en-US");
  }
  const tam = dinero ? 0.14 * B : e.clase === "count" ? 0.078 * B / 0.7 : 0.11 * B;
  const prof = Math.max(4, Math.round(tam * 0.09));
  const extrusion = Array.from({ length: prof }, (_, i) => `${i * 0.6}px ${i + 1}px 0 ${dinero ? oscurecer(e.color) : "#111"}`).join(",");
  const brillo = interpolate(frame, [0, 6, 18], [0, 1, 0.35], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: e.x * W, top: e.y * H, transform: `translate(-50%,-50%) scale(${esc})`, textAlign: "center", whiteSpace: "nowrap" }}>
        <div style={{
          fontFamily: f, fontWeight: peso, fontSize: tam, lineHeight: 1, color: col, letterSpacing: -tam * 0.03,
          WebkitTextStroke: dinero ? `${Math.max(2, tam * 0.025)}px #FFFFFF` : undefined, paintOrder: "stroke fill",
          textShadow: `${extrusion}, 0 ${tam * 0.12}px ${tam * 0.25}px rgba(0,0,0,0.55), 0 0 ${tam * 0.35 * brillo}px ${dinero ? e.color : "rgba(255,255,255,0.6)"}`,
        }}>
          {texto}
          {e.clase === "count" && e.sufijo ? <span style={{ fontSize: tam * 0.38, color: "#DDDDDD", marginLeft: tam * 0.15, fontWeight: 600 }}>{e.sufijo}</span> : null}
        </div>
        {e.sub ? <div style={{ fontFamily: f, fontWeight: 600, fontSize: 0.036 * B / 0.7, color: "#FFFFFF", marginTop: tam * 0.18, textShadow: "0 3px 6px rgba(0,0,0,0.7)" }}>{e.sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

const Anillo: React.FC<{ e: Extract<Elemento, { tipo: "anillo" }>; f: string }> = ({ e, f }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const D = W * e.diametro, grosor = Math.max(10, D * 0.085), r = (D - grosor) / 2, C = 2 * Math.PI * r;
  const crece = interpolate(frame, [0, fps * 1.1], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 160 } });
  const op = salida(frame, durationInFrames, fps);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: e.x * W, top: e.y * H, width: D, height: D, transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * pop})` }}>
        <svg width={D} height={D} style={{ position: "absolute", filter: `drop-shadow(0 ${D * 0.03}px ${D * 0.06}px rgba(0,0,0,0.5))` }}>
          <circle cx={D / 2} cy={D / 2} r={D / 2 - 1} fill="rgba(10,12,18,0.72)" />
          <circle cx={D / 2} cy={D / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={grosor} />
          <circle cx={D / 2} cy={D / 2} r={r} fill="none" stroke={e.color} strokeWidth={grosor} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - (e.pct / 100) * crece)} transform={`rotate(-90 ${D / 2} ${D / 2})`}
            style={{ filter: `drop-shadow(0 0 ${grosor * 0.6}px ${e.color})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: f }}>
          <div style={{ fontWeight: 900, fontSize: D * 0.3, lineHeight: 1 }}>{Math.round(e.pct * crece)}%</div>
          {e.etiqueta ? <div style={{ fontWeight: 300, fontSize: D * 0.1, marginTop: D * 0.03, opacity: 0.9 }}>{e.etiqueta}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Icono: React.FC<{ e: Extract<Elemento, { tipo: "icono" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const lado = W * e.escala;
  const entra = spring({ frame, fps, config: { damping: 12, stiffness: 120, mass: 0.8 } });
  const sale = interpolate(frame, [durationInFrames - Math.round(0.35 * fps), durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const fuera = e.lado === "right" ? W + lado : -lado;
  const x = interpolate(entra, [0, 1], [fuera, e.x * W]) + (fuera - e.x * W) * sale;
  const flota = Math.sin((frame / fps) * 2.6) * lado * 0.05;
  const gira = interpolate(entra, [0, 1], [e.lado === "right" ? 18 : -18, 0]) + Math.sin((frame / fps) * 1.8) * 3;
  return (
    <AbsoluteFill>
      <Img src={e.src} style={{ position: "absolute", left: x, top: e.y * H + flota, width: lado, height: lado, objectFit: "contain",
        transform: `translate(-50%,-50%) rotate(${gira}deg) scale(${0.7 + 0.3 * entra})`, filter: `drop-shadow(0 ${lado * 0.06}px ${lado * 0.08}px rgba(0,0,0,0.45))` }} />
    </AbsoluteFill>
  );
};

const Cursor: React.FC<{ e: Extract<Elemento, { tipo: "cursor" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const lado = W * 0.11;
  const viaje = Math.max(0.35, Math.min(0.7, (durationInFrames / fps) * 0.4)) * fps;
  const p = interpolate(frame, [0, viaje], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const x = interpolate(p, [0, 1], [W + 20, e.x * W + lado * 0.35]), y = interpolate(p, [0, 1], [H + 20, e.y * H + lado * 0.2]);
  const clic = frame - viaje;
  const aprieta = clic > 2 && clic < 7 ? 0.86 : 1;
  const onda = interpolate(clic, [2, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      {onda > 0 && onda < 1 ? <div style={{ position: "absolute", left: e.x * W + lado * 0.35, top: e.y * H + lado * 0.2, width: lado * 1.6 * onda, height: lado * 1.6 * onda,
        borderRadius: "50%", border: `${lado * 0.05}px solid rgba(255,255,255,${1 - onda})`, transform: "translate(-50%,-50%)" }} /> : null}
      <Img src={e.src} style={{ position: "absolute", left: x, top: y, width: lado, transform: `scale(${aprieta})`, transformOrigin: "top left",
        filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }} />
    </AbsoluteFill>
  );
};

const Lluvia: React.FC<{ e: Extract<Elemento, { tipo: "lluvia" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const t = frame / fps, total = durationInFrames / fps;
  const lado = W * e.escala;
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      {Array.from({ length: e.cantidad }, (_, i) => {
        const r = (k: string) => random(`${e.semilla}-${i}-${k}`);
        const nace = r("t") * total * 0.45;
        if (t < nace) return null;
        const dt = t - nace;
        const x0 = (0.08 + 0.84 * r("x")) * W;
        const y0 = (e.desdeY ?? -0.1) * H - lado;
        const piso = e.apilar ? H * (0.78 + 0.12 * r("p")) : H + lado;
        const y = Math.min(piso, y0 + 0.5 * 2.2 * H * dt * dt + 0.25 * H * dt);
        const giro = (r("g") - 0.5) * 540 * (y >= piso ? 0.3 : dt);
        return <Img key={i} src={e.src} style={{ position: "absolute", left: x0 + Math.sin(dt * 4 + i) * lado * 0.2, top: y, width: lado,
          transform: `translate(-50%,-50%) rotate(${giro}deg)`, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" }} />;
      })}
    </AbsoluteFill>
  );
};

export const CortexCapa: React.FC<PropsCapa> = ({ elemento, fuente }) => {
  const f = FUENTES[fuente] ?? FUENTES.inter;
  const peso = PESO[fuente] ?? 900;
  switch (elemento.tipo) {
    case "cifra": return <Cifra e={elemento} f={f} peso={peso} />;
    case "anillo": return <Anillo e={elemento} f={f} />;
    case "icono": return <Icono e={elemento} />;
    case "cursor": return <Cursor e={elemento} />;
    case "lluvia": return <Lluvia e={elemento} />;
  }
};

export const CAPA_EJEMPLO: PropsCapa = {
  ancho: 1080, alto: 1920, fps: 30, dur: 2.2, fuente: "inter",
  elemento: { tipo: "cifra", texto: "$3,500", sub: "al mes", clase: "money", x: 0.5, y: 0.3, color: "#3DDC84" },
};
