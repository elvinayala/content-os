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
import { loadFont as cargarAnton } from "@remotion/google-fonts/Anton";

const ANTON = cargarAnton("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;

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
  // sobrio (video serio, 16/oct): sin brillo, sin extrusión de color ni borde blanco: blanco marfil con sombra suave
  | { tipo: "cifra"; texto: string; sub?: string | null; clase: "money" | "count" | "percent" | "plain"; desde?: number | null; hasta?: number | null; sufijo?: string; x: number; y: number; color: string; sobrio?: boolean }
  | { tipo: "anillo"; pct: number; etiqueta?: string; color: string; x: number; y: number; diametro: number }
  | { tipo: "icono"; src: string; lado: "left" | "right"; x: number; y: number; escala: number }
  | { tipo: "cursor"; src: string; x: number; y: number }
  | { tipo: "lluvia"; src: string; cantidad: number; escala: number; apilar: boolean; desdeY?: number | null; semilla: number }
  // testimonio (referencia Giovanni Ayala · Cars Auto Sales, 14/oct)
  | { tipo: "logo"; src: string; x: number; y: number; escala: number }
  | { tipo: "rotulo"; pre: string; nombre: string; cargo: string; color: string; x: number; y: number }
  | { tipo: "etiqueta"; texto: string; color: string; x: number; y: number; cursor: string }
  | { tipo: "link"; texto: string; color: string; x: number; y: number; cursor: string }
  // «GIOVANNI AYALA» gigante DETRÁS de la cabeza: esta capa va debajo de la persona recortada (Cortex pone la persona encima)
  | { tipo: "detras"; texto: string; color: string; y: number }
  // lavado de luz (light leak morado/dorado) sobre una palabra fuerte
  | { tipo: "lavado"; colores: string[] }
  // alternativas de dinero (Elvin 16/oct: «lluvia de billetes solo cuando se habla de dinero, con varias alternativas»)
  | { tipo: "monedas"; x: number; y: number; desdeY?: number | null; cantidad: number; semilla: number; color: string }
  | { tipo: "fajo"; x: number; y: number; desdeY?: number | null; cantidad: number; semilla: number; color: string }
  // tarjeta de oferta para PRECIOS («2x$69», «4 x $24»): lo que paga quien mira nunca lleva lluvia de billetes
  | { tipo: "oferta"; texto: string; sub?: string; color: string; x: number; y: number; sobrio?: boolean };

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
  const sobrio = !!e.sobrio;
  const dinero = e.clase === "money" && !sobrio;
  const col = dinero ? e.color : sobrio ? "#F4F1EA" : "#FFFFFF";
  let texto = e.texto;
  if (e.clase === "count" && e.desde != null && e.hasta != null && durationInFrames > 12) {
    const p = interpolate(frame, [0, durationInFrames * 0.8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.poly(2.2)) });
    texto = Math.round(e.desde + (e.hasta - e.desde) * p).toLocaleString("en-US");
  } else if (e.clase === "money" && e.desde != null && e.hasta != null && e.hasta > 0 && durationInFrames > 12) {
    // contador de $ (16/oct): la MISMA cifra que se dijo, contando desde $0 («$3,500», «$500K», «$1.5M» conservan su forma)
    const p = interpolate(frame, [0, durationInFrames * 0.7], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.poly(2.6)) });
    texto = contarCifra(e.texto, p);
  }
  const tam = e.clase === "money" ? (sobrio ? 0.12 : 0.14) * B : e.clase === "count" ? 0.078 * B / 0.7 : 0.11 * B;
  const prof = sobrio ? 0 : Math.max(4, Math.round(tam * 0.09));
  const extrusion = Array.from({ length: prof }, (_, i) => `${i * 0.6}px ${i + 1}px 0 ${dinero ? oscurecer(e.color) : "#111"}`).join(",");
  const brillo = sobrio ? 0 : interpolate(frame, [0, 6, 18], [0, 1, 0.35], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: e.x * W, top: e.y * H, transform: `translate(-50%,-50%) scale(${esc})`, textAlign: "center", whiteSpace: "nowrap" }}>
        <div style={{
          fontFamily: f, fontWeight: peso, fontSize: tam, lineHeight: 1, color: col, letterSpacing: -tam * 0.03,
          WebkitTextStroke: dinero ? `${Math.max(2, tam * 0.025)}px #FFFFFF` : undefined, paintOrder: "stroke fill",
          textShadow: `${extrusion ? extrusion + ", " : ""}0 ${tam * 0.12}px ${tam * 0.25}px rgba(0,0,0,0.55), 0 0 ${tam * 0.35 * brillo}px ${dinero ? e.color : "rgba(255,255,255,0.6)"}`,
          fontVariantNumeric: "tabular-nums",
        }}>
          {texto}
          {e.clase === "count" && e.sufijo ? <span style={{ fontSize: tam * 0.38, color: "#DDDDDD", marginLeft: tam * 0.15, fontWeight: 600 }}>{e.sufijo}</span> : null}
        </div>
        {e.sub ? <div style={{ fontFamily: f, fontWeight: 600, fontSize: 0.036 * B / 0.7, color: "#FFFFFF", marginTop: tam * 0.18, textShadow: "0 3px 6px rgba(0,0,0,0.7)" }}>{e.sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// «$3,500» con p=0.5 → «$1,750»; «$500K» → «$250K»; «$1.5M» → «$0.8M»; «$1,5 millones» → «$0,8 millones» (misma forma)
function contarCifra(texto: string, p: number): string {
  const m = texto.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!m) return texto;
  const crudo = m[1];
  // «$1,5 millones» (coma DECIMAL: una sola coma con 1–2 cifras detrás) = 1.5, no 15 (16/oct, revisión)
  const comaDecimal = /^\d+,\d{1,2}$/.test(crudo);
  const valor = parseFloat(comaDecimal ? crudo.replace(",", ".") : crudo.replace(/,/g, ""));
  const sep = comaDecimal ? "," : ".";
  const dec = crudo.includes(sep) ? crudo.split(sep)[1].length : 0;
  const ahora = valor * p;
  const conComas = !comaDecimal && (crudo.includes(",") || valor >= 10000);
  const num = conComas ? ahora.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : comaDecimal ? ahora.toFixed(dec).replace(".", ",") : ahora.toFixed(dec);
  return texto.replace(crudo, p >= 1 ? crudo : num);
}

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

// ---- testimonio ----
const LogoNegocio: React.FC<{ e: Extract<Elemento, { tipo: "logo" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const lado = W * e.escala;
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 150, mass: 0.7 } });
  const brillo = interpolate(frame, [0, 8, 24], [0, 1, 0.45], { extrapolateRight: "clamp" });
  const flota = Math.sin((frame / fps) * 2.2) * lado * 0.025;
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      <Img src={e.src} style={{ position: "absolute", left: e.x * W, top: e.y * H + flota, width: lado, height: lado, objectFit: "contain",
        transform: `translate(-50%,-50%) scale(${interpolate(pop, [0, 1], [0.4, 1])})`,
        filter: `drop-shadow(0 0 ${lado * 0.08 * brillo}px rgba(255,255,255,0.95)) drop-shadow(0 ${lado * 0.05}px ${lado * 0.07}px rgba(0,0,0,0.45))` }} />
    </AbsoluteFill>
  );
};

const Rotulo: React.FC<{ e: Extract<Elemento, { tipo: "rotulo" }>; f: string }> = ({ e, f }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const B = base(W, H);
  const entra = (d: number) => spring({ frame: frame - d, fps, config: { damping: 14, stiffness: 140 } });
  const fila = (d: number): React.CSSProperties => ({ opacity: entra(d), transform: `translateY(${(1 - entra(d)) * B * 0.04}px)` });
  const tam = B * 0.115;   // medido en la referencia: el nombre ocupa ~55 % del ancho
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      <div style={{ position: "absolute", left: e.x * W, top: e.y * H, transform: "translate(-50%,-50%)", textAlign: "center", whiteSpace: "nowrap", fontFamily: f, lineHeight: 1 }}>
        <div style={{ ...fila(0), color: "#fff", fontWeight: 600, fontSize: tam * 0.36, textShadow: "0 3px 8px rgba(0,0,0,0.7)" }}>{e.pre}</div>
        <div style={{ ...fila(3), fontWeight: 900, fontSize: tam, letterSpacing: -tam * 0.03, marginTop: tam * 0.06,
          background: `linear-gradient(180deg, #FFF3B0 0%, ${e.color} 55%, #B8860B 100%)`, WebkitBackgroundClip: "text", color: "transparent",
          filter: "drop-shadow(0 4px 0 rgba(60,40,0,0.85)) drop-shadow(0 8px 14px rgba(0,0,0,0.55))" }}>{e.nombre}</div>
        {e.cargo ? <div style={{ ...fila(7), color: "#fff", fontWeight: 600, fontSize: tam * 0.36, marginTop: tam * 0.1, textShadow: "0 3px 8px rgba(0,0,0,0.7)" }}>{e.cargo}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

const CursorClic: React.FC<{ src: string; x: number; y: number; desde: number }> = ({ src, x, y, desde }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const lado = W * 0.085, viaje = Math.round(0.45 * fps);
  const p = interpolate(frame - desde, [0, viaje], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  if (frame < desde) return null;
  const clic = frame - desde - viaje;
  const onda = interpolate(clic, [1, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cx = interpolate(p, [0, 1], [W * 0.95, x]), cy = interpolate(p, [0, 1], [H * 0.95, y]);
  return (
    <>
      {onda > 0 && onda < 1 ? <div style={{ position: "absolute", left: x, top: y, width: lado * 1.5 * onda, height: lado * 1.5 * onda, borderRadius: "50%",
        border: `${lado * 0.05}px solid rgba(255,255,255,${1 - onda})`, transform: "translate(-50%,-50%)" }} /> : null}
      <Img src={src} style={{ position: "absolute", left: cx, top: cy, width: lado, transform: `scale(${clic > 1 && clic < 6 ? 0.86 : 1})`, transformOrigin: "top left",
        filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }} />
    </>
  );
};

const Etiqueta: React.FC<{ e: Extract<Elemento, { tipo: "etiqueta" }>; f: string }> = ({ e, f }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const B = base(W, H);
  const tam = B * 0.145;   // referencia: «TRÁFICO» ocupa ~50 % del ancho
  const glitch = frame < 6 ? (random(`g${frame}`) - 0.5) * tam * 0.5 : 0;
  const ancho = interpolate(spring({ frame, fps, config: { damping: 16, stiffness: 180 } }), [0, 1], [0, 1]);
  // borde de brocha: polígono con muescas deterministas
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) pts.push(`${(i / 24) * 100}% ${random(`t${i}`) * 9}%`);
  for (let i = 24; i >= 0; i--) pts.push(`${(i / 24) * 100}% ${100 - random(`b${i}`) * 9}%`);
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      <div style={{ position: "absolute", left: e.x * W + glitch, top: e.y * H, transform: `translate(-50%,-50%) scaleX(${ancho})`, padding: `${tam * 0.18}px ${tam * 0.4}px`,
        background: e.color, clipPath: `polygon(${pts.join(",")})`, boxShadow: `0 0 ${tam * 0.4}px ${e.color}` }}>
        <div style={{ fontFamily: f, fontWeight: 900, fontSize: tam, letterSpacing: tam * 0.02, color: "#0B0B0B", lineHeight: 1, whiteSpace: "nowrap",
          textShadow: frame < 6 ? `${tam * 0.06}px 0 rgba(0,200,255,0.8), ${-tam * 0.06}px 0 rgba(255,0,80,0.8)` : "none" }}>{e.texto}</div>
      </div>
      <CursorClic src={e.cursor} x={e.x * W + W * 0.22} y={e.y * H + tam * 0.35} desde={Math.round(0.5 * fps)} />
    </AbsoluteFill>
  );
};

const PastillaLink: React.FC<{ e: Extract<Elemento, { tipo: "link" }>; f: string }> = ({ e, f }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const B = base(W, H);
  const tam = B * 0.072;   // referencia: la pastilla ocupa ~55 % del ancho
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const ciclo = (frame % Math.round(1.4 * fps)) / Math.round(1.4 * fps);
  const latido = 0.75 + 0.25 * Math.sin((frame / fps) * Math.PI * 2);
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      <div style={{ position: "absolute", left: e.x * W, top: e.y * H, transform: `translate(-50%,-50%) scale(${interpolate(pop, [0, 1], [0.6, 1])})`,
        padding: `${tam * 0.45}px ${tam * 0.9}px`, borderRadius: tam * 0.35, background: `linear-gradient(180deg, #FF4D55, ${e.color})`, overflow: "hidden",
        boxShadow: `0 0 ${tam * 0.9 * latido}px ${e.color}, 0 0 ${tam * 0.3}px rgba(255,255,255,0.5) inset` }}>
        <div style={{ fontFamily: f, fontWeight: 900, fontSize: tam, letterSpacing: tam * 0.08, color: "#fff", lineHeight: 1, whiteSpace: "nowrap", textShadow: "0 2px 4px rgba(0,0,0,0.35)" }}>{e.texto}</div>
        <div style={{ position: "absolute", top: "-50%", bottom: "-50%", width: tam * 0.6, left: `${interpolate(ciclo, [0, 0.5, 1], [-20, 120, 120])}%`,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)", transform: "rotate(20deg)" }} />
      </div>
      <CursorClic src={e.cursor} x={e.x * W + W * 0.25} y={e.y * H + tam * 0.4} desde={Math.round(0.6 * fps)} />
    </AbsoluteFill>
  );
};

const Detras: React.FC<{ e: Extract<Elemento, { tipo: "detras" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const n = Math.max(4, e.texto.length);
  // Anton: ~0.46 del alto por letra → que ocupe ~94 % del ancho; estirada ×1.45 en alto como la condensada de la referencia
  const tam = Math.min(H * 0.26, (W * 0.94) / (n * 0.46));
  const pop = spring({ frame, fps, config: { damping: 15, stiffness: 150, mass: 0.7 } });
  const esc = interpolate(pop, [0, 1], [1.35, 1]);
  const desen = interpolate(frame, [0, 5], [14, 0], { extrapolateRight: "clamp" });
  const brillo = interpolate(frame, [Math.round(0.35 * fps), Math.round(1.1 * fps)], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(interpolate(frame, [0, 3], [0, 1], { extrapolateRight: "clamp" }), salida(frame, durationInFrames, fps));
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", left: W / 2, top: e.y * H, transform: `translate(-50%,-50%) scale(${esc}) scaleY(1.45)`, filter: `blur(${desen}px)`, whiteSpace: "nowrap",
        fontFamily: ANTON, fontSize: tam, lineHeight: 0.95, letterSpacing: tam * 0.01, textTransform: "uppercase",
        backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${brillo - 12}%, rgba(255,255,255,0.9) ${brillo}%, rgba(255,255,255,0) ${brillo + 12}%), linear-gradient(180deg, #FFFFFF 18%, ${e.color} 100%)`,
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        textShadow: "none", WebkitTextStroke: `${Math.max(1, tam * 0.006)}px rgba(255,255,255,0.25)` }}>{e.texto}</div>
    </AbsoluteFill>
  );
};

const Lavado: React.FC<{ e: Extract<Elemento, { tipo: "lavado" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const k = frame / Math.max(1, durationInFrames - 1);
  const op = interpolate(k, [0, 0.3, 1], [0, 0.62, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const [c1, c2] = [e.colores[0] ?? "#8A3FFC", e.colores[1] ?? "#F5C542"];
  const x = interpolate(k, [0, 1], [-0.2, 1.1]);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse ${W * 0.9}px ${H * 0.55}px at ${x * W}px ${H * 0.35}px, ${c1}EE, ${c1}00 70%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse ${W * 0.7}px ${H * 0.45}px at ${(1.1 - x) * W}px ${H * 0.75}px, ${c2}CC, ${c2}00 70%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${100 + k * 40}deg, rgba(255,255,255,0) 30%, rgba(255,240,220,0.35) 50%, rgba(255,255,255,0) 70%)` }} />
    </AbsoluteFill>
  );
};

// ---- alternativas de dinero (16/oct) ----
// Monedas doradas dibujadas (sin PNG): caen desde debajo de la cifra, rebotan un poco y se apilan en columnas al pecho.
const Moneda: React.FC<{ d: number; giro: number }> = ({ d, giro }) => {
  const canto = Math.abs(Math.cos(giro)); // de frente ↔ de canto mientras cae
  return (
    <div style={{ width: d, height: d, transform: `scaleX(${0.25 + 0.75 * canto})`, borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #FFF4B8 0%, #F7C948 32%, #D9A21B 70%, #9C6B0B 100%)",
      boxShadow: `inset 0 0 0 ${d * 0.07}px #B7860F, inset 0 0 0 ${d * 0.12}px #F5D36A, 0 ${d * 0.06}px ${d * 0.12}px rgba(0,0,0,0.45)`,
      display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: d * 0.55, color: "#8A5A00", opacity: canto > 0.35 ? 0.85 : 0, lineHeight: 1 }}>$</div>
    </div>
  );
};

const Monedas: React.FC<{ e: Extract<Elemento, { tipo: "monedas" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const t = frame / fps, total = durationInFrames / fps;
  const d = W * 0.085;
  const y0 = ((e.desdeY ?? e.y) + 0.02) * H;
  const columnas = 4;
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      {Array.from({ length: e.cantidad }, (_, i) => {
        const r = (k: string) => random(`m${e.semilla}-${i}-${k}`);
        const nace = (i / e.cantidad) * total * 0.5 + r("t") * 0.08;
        if (t < nace) return null;
        const dt = t - nace;
        const col = i % columnas;
        const fila = Math.floor(i / columnas);
        const xCol = W * (0.5 + (col - (columnas - 1) / 2) * 0.13) + (r("x") - 0.5) * d * 0.15;
        const piso = Math.min(H * 0.93, y0 + H * 0.2) - fila * d * 0.22;
        const caida = y0 + 0.5 * 3.2 * H * dt * dt;
        const toca = caida >= piso;
        const tToca = Math.sqrt(Math.max(0, (piso - y0) / (0.5 * 3.2 * H)));
        const rebote = toca ? Math.abs(Math.sin((dt - tToca) * 14)) * Math.exp(-(dt - tToca) * 9) * d * 0.35 : 0;
        const y = (toca ? piso : caida) - rebote;
        const x0 = W * 0.5 + (r("o") - 0.5) * W * 0.12;
        const x = toca ? xCol : interpolate(Math.min(1, dt / Math.max(0.05, tToca)), [0, 1], [x0, xCol]);
        const giro = toca ? 0 : dt * (9 + r("g") * 6);
        return <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}><Moneda d={d} giro={giro} /></div>;
      })}
    </AbsoluteFill>
  );
};

// Fajo: billetes que entran uno por uno de lado y se apilan, con una faja de papel del color de la marca.
const Billete: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ width: w, height: w * 0.43, borderRadius: w * 0.025, position: "relative", overflow: "hidden",
    background: "linear-gradient(160deg, #CFE8C8 0%, #8FC48A 45%, #5E9E62 100%)", boxShadow: "0 3px 6px rgba(0,0,0,0.35)",
    border: `${Math.max(1, w * 0.008)}px solid #3F7A45` }}>
    <div style={{ position: "absolute", inset: w * 0.03, border: `${Math.max(1, w * 0.006)}px solid rgba(40,90,50,0.55)`, borderRadius: w * 0.015 }} />
    <div style={{ position: "absolute", left: "50%", top: "50%", width: w * 0.2, height: w * 0.2, transform: "translate(-50%,-50%)", borderRadius: "50%",
      background: "radial-gradient(circle, #E9F5E4 0%, #A8D3A0 70%)", border: `${Math.max(1, w * 0.006)}px solid #3F7A45`,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: w * 0.12, color: "#2F5E35" }}>$</div>
  </div>
);

const Fajo: React.FC<{ e: Extract<Elemento, { tipo: "fajo" }> }> = ({ e }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const w = W * 0.4;
  const base_ = Math.min(H * 0.9, ((e.desdeY ?? e.y) + 0.16) * H);
  const n = Math.max(4, Math.min(10, e.cantidad));
  const cada = Math.max(2, Math.round(0.07 * fps));
  const faja = spring({ frame: frame - n * cada - 2, fps, config: { damping: 12, stiffness: 170 } });
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      {Array.from({ length: n }, (_, i) => {
        const p = spring({ frame: frame - i * cada, fps, config: { damping: 15, stiffness: 210, mass: 0.6 } });
        if (frame < i * cada) return null;
        const desde = i % 2 === 0 ? -W * 0.6 : W * 0.6;
        const rot = (random(`f${e.semilla}-${i}`) - 0.5) * 7;
        return (
          <div key={i} style={{ position: "absolute", left: W / 2 + desde * (1 - p), top: base_ - i * w * 0.045,
            transform: `translate(-50%,-50%) rotate(${rot * p + (1 - p) * (i % 2 ? 18 : -18)}deg)` }}><Billete w={w} /></div>
        );
      })}
      {frame >= n * cada ? <div style={{ position: "absolute", left: W / 2, top: base_ - (n - 1) * w * 0.045 / 2, width: w * 0.16, height: w * 0.43 + (n - 1) * w * 0.045 + 8,
        transform: `translate(-50%,-50%) scaleY(${faja})`, background: `linear-gradient(90deg, ${oscurecer(e.color, 0.8)}, ${e.color}, ${oscurecer(e.color, 0.8)})`,
        boxShadow: "0 0 0 2px rgba(255,255,255,0.35) inset, 0 4px 8px rgba(0,0,0,0.35)", borderRadius: 3 }} /> : null}
    </AbsoluteFill>
  );
};

// Tarjeta de oferta: vidrio oscuro con borde del acento, etiqueta «OFERTA» y el precio que entra con resorte + barrido de luz.
// Sobria (serio): etiqueta «PRECIO», borde fino, sin barrido.
const Oferta: React.FC<{ e: Extract<Elemento, { tipo: "oferta" }>; f: string; peso: number }> = ({ e, f, peso }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const B = base(W, H);
  const sobrio = !!e.sobrio;
  const pop = spring({ frame, fps, config: { damping: sobrio ? 18 : 12, stiffness: 170, mass: 0.7 } });
  const precio = spring({ frame: frame - 4, fps, config: { damping: 11, stiffness: 200, mass: 0.6 } });
  const barrido = interpolate(frame, [Math.round(0.35 * fps), Math.round(0.95 * fps)], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tam = Math.min(0.15 * B, (W * 0.62) / Math.max(4, e.texto.length * 0.62));
  const claro = (() => { const n = parseInt(e.color.slice(1), 16); return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) > 150; })();
  return (
    <AbsoluteFill style={{ opacity: salida(frame, durationInFrames, fps) }}>
      <div style={{ position: "absolute", left: e.x * W, top: e.y * H, transform: `translate(-50%,-50%) scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
        opacity: Math.min(1, pop * 1.4), padding: `${tam * 0.32}px ${tam * 0.55}px ${tam * 0.36}px`, borderRadius: tam * 0.32, overflow: "hidden",
        background: "rgba(14,18,32,0.88)", border: `${sobrio ? 2 : Math.max(3, tam * 0.04)}px solid ${e.color}`, textAlign: "center",
        boxShadow: sobrio ? "0 14px 30px rgba(0,0,0,0.45)" : `0 18px 40px rgba(0,0,0,0.5), 0 0 ${tam * 0.5}px ${e.color}55` }}>
        <div style={{ display: "inline-block", padding: `${tam * 0.06}px ${tam * 0.22}px`, borderRadius: 999, background: e.color, color: claro ? "#121212" : "#FFFFFF",
          fontFamily: f, fontWeight: 900, fontSize: tam * 0.24, letterSpacing: tam * 0.03, lineHeight: 1.1 }}>{sobrio ? "PRECIO" : "OFERTA"}</div>
        <div style={{ fontFamily: f, fontWeight: peso, fontSize: tam, color: "#FFFFFF", lineHeight: 1.05, marginTop: tam * 0.12, whiteSpace: "nowrap",
          letterSpacing: -tam * 0.03, transform: `scale(${interpolate(precio, [0, 1], [0.6, 1])})`, textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>{e.texto}</div>
        {e.sub ? <div style={{ fontFamily: f, fontWeight: 600, fontSize: tam * 0.3, color: "#E6E6E6", marginTop: tam * 0.1, whiteSpace: "nowrap" }}>{e.sub}</div> : null}
        {!sobrio ? <div style={{ position: "absolute", top: "-30%", bottom: "-30%", width: tam * 0.7, left: `${barrido}%`,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)", transform: "skewX(-20deg)" }} /> : null}
      </div>
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
    case "logo": return <LogoNegocio e={elemento} />;
    case "rotulo": return <Rotulo e={elemento} f={f} />;
    case "etiqueta": return <Etiqueta e={elemento} f={f} />;
    case "link": return <PastillaLink e={elemento} f={f} />;
    case "detras": return <Detras e={elemento} />;
    case "lavado": return <Lavado e={elemento} />;
    case "monedas": return <Monedas e={elemento} />;
    case "fajo": return <Fajo e={elemento} />;
    case "oferta": return <Oferta e={elemento} f={f} peso={peso} />;
  }
};

export const CAPA_EJEMPLO: PropsCapa = {
  ancho: 1080, alto: 1920, fps: 30, dur: 2.2, fuente: "inter",
  elemento: { tipo: "cifra", texto: "$3,500", sub: "al mes", clase: "money", x: 0.5, y: 0.3, color: "#3DDC84" },
};
