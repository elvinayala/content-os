// Tema de marca para un CLIENTE, armado desde JSON (sin tocar código): lo manda Max en el guion
// (campo `cliente`) con el logo real, los colores y la fuente del cliente. Paquete de Level Up: acuerdo ≥ $3,500 pagado completo = 2 motion.
// Fuentes permitidas (Google Fonts cargadas aquí): la del cliente tiene que ser una de estas.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as poppins } from "@remotion/google-fonts/Poppins";
import { loadFont as jakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as dmsans } from "@remotion/google-fonts/DMSans";
import { loadFont as manrope } from "@remotion/google-fonts/Manrope";
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as sora } from "@remotion/google-fonts/Sora";
import { loadFont as outfit } from "@remotion/google-fonts/Outfit";
import { loadFont as mono } from "@remotion/google-fonts/JetBrainsMono";
import { rebote, tw } from "../kit/fx";
import type { TemaMarca } from "./temas";

const W = ["400", "500", "600", "700", "800"] as const;
const FUENTES: Record<string, () => string> = {
  Inter: () => inter("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
  Montserrat: () => montserrat("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
  Poppins: () => poppins("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
  "Plus Jakarta Sans": () => jakarta("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
  "DM Sans": () => dmsans("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily,
  Manrope: () => manrope("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
  "Bebas Neue": () => bebas("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily,
  Sora: () => sora("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
  Outfit: () => outfit("normal", { weights: [...W], subsets: ["latin"] }).fontFamily,
};
export const FUENTES_CLIENTE = Object.keys(FUENTES);

export type TemaCliente = {
  nombre: string; // nombre comercial (va en la firma del cierre)
  logoUrl?: string; // URL https del logo REAL (PNG/SVG, fondo transparente). Sin él: firma solo con el nombre (nunca un logo inventado)
  subtitulo?: string; // línea bajo el nombre en la firma (p. ej. "Neuropsicología clínica")
  fondo: string; // hex
  acento: string; // hex (CTA, resaltados)
  texto?: string; // hex (por defecto casi blanco)
  acento2?: string;
  fuente?: string; // una de FUENTES_CLIENTE (por defecto Inter)
  musica?: string; // pista de public/audio (por defecto la de Level Up)
  /** Logo por CAPAS para animarlo por piezas: `base` (la forma, p. ej. la cabeza) + `brillo` (lo que se enciende
   *  encima, p. ej. el cerebro de colores). Rutas https o de public/ (clientes/<slug>/…). Proporción ancho/alto. */
  logoCapas?: { base: string; brillo: string; proporcion?: number };
  /** Motivo gráfico de su marca detrás de todo el video: "fibras" = haces de fibras de colores que fluyen. */
  motivo?: "fibras";
  /** Colores del motivo (por defecto los del cerebro: azul, violeta, magenta, verde, cian, amarillo). */
  paletaMotivo?: string[];
};

/** https → tal cual; si no, archivo de public/ (lo que Max sube con el guion vive en el repo). */
export const archivo = (u: string) => (/^https?:\/\//.test(u) ? u : staticFile(u.replace(/^\//, "")));

const PALETA_FIBRAS = ["#3D5AFE", "#7C4DFF", "#FF3D8B", "#22C55E", "#22D3EE", "#FACC15", "#FF6B3D"];

/** Haces de fibras (tipo tractografía) que fluyen arriba y abajo, con impulsos de luz que las recorren. */
const Fibras: React.FC<{ paleta: string[] }> = ({ paleta }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const v = H > W;
  const haces = [
    { y: v ? 0.13 : 0.1, amp: v ? -0.05 : -0.08, n: 16 },
    { y: v ? 0.9 : 0.93, amp: v ? 0.05 : 0.07, n: 16 },
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none", filter: "blur(0.6px)" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {haces.flatMap((hz, hi) => Array.from({ length: hz.n }, (_, i) => {
          const k = hi * 100 + i;
          const col = paleta[(i + hi * 3) % paleta.length];
          const off = (i - hz.n / 2) * (v ? 9 : 7);
          const s1 = noise2D(`a${k}`, f / 90, i * 0.3) * H * 0.035;
          const s2 = noise2D(`b${k}`, i * 0.3, f / 90) * H * 0.035;
          const y0 = H * hz.y + off;
          const d = `M${-W * 0.05} ${y0 + s1} C${W * 0.3} ${y0 + H * hz.amp + s2}, ${W * 0.7} ${y0 + H * hz.amp - s1}, ${W * 1.05} ${y0 + s2}`;
          const largo = W * 1.25;
          const vel = 5 + (i % 5) * 1.6;
          return (
            <g key={k}>
              <path d={d} fill="none" stroke={col} strokeWidth={1.6 + (i % 3) * 0.7} strokeOpacity={0.16 + (i % 4) * 0.04} strokeLinecap="round" />
              <path d={d} fill="none" stroke={col} strokeWidth={3 + (i % 2)} strokeOpacity={0.85} strokeLinecap="round"
                strokeDasharray={`${largo * 0.05} ${largo}`} strokeDashoffset={-((f * vel + i * 137) % (largo * 1.05)) + largo * 0.05}
                style={{ filter: `drop-shadow(0 0 6px ${col})` }} />
            </g>
          );
        }))}
      </svg>
    </AbsoluteFill>
  );
};

const hex = (h: string, a: number) => h + Math.round(a * 255).toString(16).padStart(2, "0");
// Mezcla sencilla hacia blanco/negro para derivar superficie y borde del fondo del cliente.
const mezclar = (h: string, con: string, p: number) => {
  const n = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [a, b] = [n(h), n(con)];
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * p).toString(16).padStart(2, "0")).join("");
};

export function temaCliente(c: TemaCliente): TemaMarca {
  const fuente = (FUENTES[c.fuente || "Inter"] || FUENTES.Inter)();
  const monoF = mono("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;
  const oscuro = parseInt(c.fondo.slice(1, 3), 16) + parseInt(c.fondo.slice(3, 5), 16) + parseInt(c.fondo.slice(5, 7), 16) < 384;
  const texto = c.texto || (oscuro ? "#F4F4F5" : "#111114");
  const acento2 = c.acento2 || mezclar(c.acento, oscuro ? "#ffffff" : "#000000", 0.35);
  const Logo: TemaMarca["Logo"] = ({ size, entrada = null, vivo = false }) => {
    const f = useCurrentFrame();
    const e = entrada ?? 999;
    const s = entrada === null ? 1 : 0.4 + 0.6 * rebote(e, 0, 20);
    const brillo = entrada === null ? 0.3 + (vivo ? 0.15 * Math.sin(f / 8) : 0) : tw(e, 8, 24, 1, 0.3);
    const flota = vivo ? Math.sin(f / 18) * size * 0.02 : 0;
    if (c.logoCapas) {
      // Por piezas: la forma entra con rebote y un halo blanco; luego lo de adentro se enciende de atrás
      // hacia adelante con una línea de luz que lo barre; vivo = respira y brilla.
      const prop = c.logoCapas.proporcion ?? 0.86;
      const w = size * prop;
      const eB = entrada === null ? 1 : tw(e, 0, 10);
      const sB = entrada === null ? 1 : 0.82 + 0.18 * rebote(e, 0, 22);
      // El barrido recorre solo la zona del cerebro (≈ 90 % → 10 % del ancho) y la línea desaparece al terminar.
      const p = entrada === null ? 1 : tw(e, 12, 40);
      const borde = 90 - 80 * p;
      const flash = entrada === null ? 0 : Math.max(0, 1 - Math.abs(e - 42) / 12);
      const pulso = vivo ? 1 + 0.12 * Math.sin(f / 9) : 1;
      return (
        <div style={{ position: "relative", width: w, height: size, opacity: eB, transform: `translateY(${flota}px) scale(${sB})` }}>
          <Img src={archivo(c.logoCapas.base)} style={{ position: "absolute", inset: 0, width: w, height: size, objectFit: "contain",
            filter: `drop-shadow(0 0 ${size * (0.03 + 0.05 * flash)}px rgba(255,255,255,${0.35 + 0.4 * flash}))` }} />
          <Img src={archivo(c.logoCapas.brillo)} style={{ position: "absolute", inset: 0, width: w, height: size, objectFit: "contain",
            clipPath: `inset(0 0 0 ${p >= 1 ? 0 : borde}%)`, filter: `brightness(${pulso + flash * 0.5}) saturate(${1.1 + flash * 0.4}) drop-shadow(0 0 ${size * 0.04 * (pulso + flash)}px ${c.acento}88)` }} />
          {p > 0 && p < 1 && (
            <div style={{ position: "absolute", top: size * 0.05, bottom: size * 0.45, left: `${borde}%`, width: Math.max(3, size * 0.012), opacity: Math.min(1, (1 - p) * 6),
              background: "linear-gradient(180deg, transparent, #fff, transparent)", boxShadow: `0 0 ${size * 0.06}px #fff, 0 0 ${size * 0.12}px ${c.acento}`, borderRadius: 99 }} />
          )}
        </div>
      );
    }
    if (!c.logoUrl) return null;
    return (
      <Img src={archivo(c.logoUrl)} style={{
        width: size, height: size, objectFit: "contain", opacity: entrada === null ? 1 : tw(e, 0, 8),
        transform: `translateY(${flota}px) scale(${s})`, filter: `drop-shadow(0 0 ${size * 0.08 * brillo}px ${c.acento})`,
      }} />
    );
  };
  const Firma: TemaMarca["Firma"] = ({ size, entrada }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.08 }}>
      {c.logoUrl || c.logoCapas ? <Logo size={size * (c.logoCapas ? 0.78 : 0.7)} entrada={entrada} vivo={entrada > 44} /> : null}
      <div style={{ fontFamily: fuente, fontWeight: 800, fontSize: size * (c.logoUrl || c.logoCapas ? 0.2 : 0.26), color: texto, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.05, opacity: tw(entrada, c.logoUrl || c.logoCapas ? 12 : 0, c.logoUrl || c.logoCapas ? 24 : 14), transform: `translateY(${(1 - tw(entrada, c.logoUrl || c.logoCapas ? 12 : 0, c.logoUrl || c.logoCapas ? 24 : 14)) * 24}px)` }}>{c.nombre}</div>
      {c.subtitulo ? <div style={{ fontFamily: fuente, fontWeight: 600, fontSize: size * 0.085, color: c.acento, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center", opacity: tw(entrada, 14, 28) }}>{c.subtitulo}</div> : null}
      {!c.logoUrl && !c.logoCapas ? <div style={{ width: size * 0.5 * tw(entrada, 10, 30), height: Math.max(3, size * 0.012), borderRadius: 99, background: `linear-gradient(90deg, ${c.acento}, ${acento2})` }} /> : null}
    </div>
  );
  return {
    id: "level-up", // no se usa para buscar el tema: el tema viene armado
    nombre: c.nombre, fuente, mono: monoF,
    fondo: c.fondo, superficie: mezclar(c.fondo, oscuro ? "#ffffff" : "#000000", 0.06), borde: mezclar(c.fondo, oscuro ? "#ffffff" : "#000000", 0.16),
    texto, gris: hex(texto, 0.62), acento: c.acento, acento2, alarma: "#FF5A4E", textoCta: oscuro ? mezclar(c.fondo, "#000000", 0.2) : "#ffffff",
    gradiente: `linear-gradient(120deg, ${c.acento} 0%, ${acento2} 100%)`, brillo: mezclar(c.fondo, c.acento, 0.25), brillo2: mezclar(c.fondo, acento2, 0.2),
    musica: c.musica || "audio/lu-musica.mp3", Logo, Firma,
    Motivo: c.motivo === "fibras" ? () => <Fibras paleta={c.paletaMotivo ?? PALETA_FIBRAS} /> : undefined,
  };
}
