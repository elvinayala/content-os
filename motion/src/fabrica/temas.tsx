// Temas de marca de la fábrica de anuncios. Cada uno trae paleta, tipografía, logo animado,
// registro (tú / usted) y el audio de la marca. Una escena nunca usa colores fuera de su tema.
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as cargarSora } from "@remotion/google-fonts/Sora";
import { loadFont as cargarGeist } from "@remotion/google-fonts/Geist";
import { evolvePath } from "@remotion/paths";
import { C as BORI, FUENTE as ONEST, FUENTE_MONO as MONO } from "../marcas/bori";
import { C as AIB, FUENTE as OUTFIT } from "../marcas/aib";
import { Coqui } from "../marcas/Coqui";
import { CoquiAibVector } from "../marcas/CoquiAibVector";
import { NombreAib } from "../marcas/CoquiAib";
import { rebote, tw } from "../kit/fx";

const geist = cargarGeist("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
const sora = cargarSora("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

export type MarcaId = "level-up" | "bori" | "ai-borinquen" | "ritmo";

export type TemaMarca = {
  id: MarcaId;
  nombre: string;
  fuente: string;
  mono: string;
  fondo: string;
  superficie: string;
  borde: string;
  texto: string;
  gris: string;
  acento: string; // color de énfasis / CTA
  acento2: string;
  alarma: string;
  textoCta: string; // color del texto sobre el botón
  gradiente: string;
  brillo: string; // halo del fondo
  brillo2: string;
  musica: string;
  /** Logo animado. entrada = frames desde que aparece (null = ya armado). */
  Logo: React.FC<{ size: number; entrada?: number | null; vivo?: boolean }>;
  /** Logo con nombre para el cierre. */
  Firma: React.FC<{ size: number; entrada: number }>;
};

/* ───────── Level Up Media: negro + oro, Sora, cohete sobre la gráfica (PNG oficial) ───────── */
const LogoLU: TemaMarca["Logo"] = ({ size, entrada = null }) => {
  const f = useCurrentFrame();
  const e = entrada ?? 999;
  const sube = tw(e, 0, 18); // las barras "crecen": revelado de abajo hacia arriba
  const brillo = entrada === null ? 0.35 + 0.15 * Math.sin(f / 8) : tw(e, 10, 24, 1, 0.35);
  return (
    <Img src={staticFile("marcas/level-up-icon-dark.png")}
      style={{ width: size, height: size * (208 / 240), clipPath: `inset(${(1 - sube) * 100}% 0 0 0)`, filter: `drop-shadow(0 0 ${size * 0.08 * brillo}px #F5CE1A)` }} />
  );
};
const FirmaLU: TemaMarca["Firma"] = ({ size, entrada }) => {
  const s = rebote(entrada, 0, 20);
  const sube = tw(entrada, 0, 16);
  return (
    <Img src={staticFile("marcas/level-up-logo-dark.png")}
      style={{ width: size, height: size * (651 / 900), transform: `scale(${0.6 + 0.4 * s})`, clipPath: `inset(${(1 - sube) * 100}% 0 0 0)`, filter: "drop-shadow(0 0 30px rgba(245,206,26,0.35))" }} />
  );
};

export const LEVEL_UP: TemaMarca = {
  id: "level-up", nombre: "Level Up Media", fuente: sora.fontFamily, mono: MONO,
  fondo: "#0B0B0B", superficie: "#161513", borde: "#2C2A24", texto: "#F5F1E8", gris: "#A3A3A3",
  acento: "#F5CE1A", acento2: "#FFE27A", alarma: "#FF5A4E", textoCta: "#0B0B0B",
  gradiente: "linear-gradient(120deg, #F5CE1A 0%, #FFE27A 100%)", brillo: "#3a2f06", brillo2: "#1d1a10",
  musica: "audio/lu-musica.mp3", Logo: LogoLU, Firma: FirmaLU,
};

/* ───────── Bori: la agencia de marketing en una sola plataforma (coquí cobre) ───────── */
const LogoBori: TemaMarca["Logo"] = ({ size, entrada = null, vivo = false }) => {
  const f = useCurrentFrame();
  const e = entrada ?? 999;
  const cae = 20;
  return (
    <Coqui size={size} hoja={tw(e, 0, 18)} cuerpo={e >= 8 ? 1 : 0}
      caidaY={e < cae ? -200 * (1 - tw(e, 8, cae)) : 0}
      squash={e < cae ? 1.15 : 1 - 0.25 * Math.exp(-(e - cae) / 3) * Math.cos((e - cae) / 2.2)}
      saco={vivo ? 1 + 0.3 * Math.max(0, Math.sin(f / 6)) : 1} ondas={tw(e, 24, 36)} canto={vivo ? (f / 16) % 1 : null} />
  );
};
const FirmaBori: TemaMarca["Firma"] = ({ size, entrada }) => {
  const n = tw(entrada, 10, 24);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.06 }}>
      <LogoBori size={size} entrada={entrada} vivo={entrada > 30} />
      <div style={{ fontFamily: ONEST, fontWeight: 800, fontSize: size * 0.34, color: BORI.texto, letterSpacing: "-0.03em", lineHeight: 1, opacity: n, transform: `translateY(${(1 - n) * 30}px)` }}>Bori</div>
    </div>
  );
};

export const BORI_T: TemaMarca = {
  id: "bori", nombre: "Bori", fuente: ONEST, mono: MONO,
  fondo: BORI.fondo, superficie: BORI.superficie, borde: BORI.borde, texto: BORI.texto, gris: BORI.gris,
  acento: BORI.verde, acento2: BORI.teal, alarma: BORI.alarma, textoCta: "#04130B",
  gradiente: `linear-gradient(120deg, ${BORI.teal} 0%, ${BORI.verde} 55%, ${BORI.verdeClaro} 100%)`, brillo: "#0f3d2a", brillo2: BORI.teal,
  musica: "audio/bori-musica.mp3", Logo: LogoBori, Firma: FirmaBori,
};

/* ───────── AI Borinquen: agentes de IA de voz y chat a la medida (logo v2, coquí de circuitos) ───────── */
const LogoAib: TemaMarca["Logo"] = ({ size, entrada = null, vivo = false }) => <CoquiAibVector size={size} entrada={entrada} vivo={vivo} />;
const FirmaAib: TemaMarca["Firma"] = ({ size, entrada }) => {
  const n = tw(entrada, 12, 26);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.08 }}>
      <CoquiAibVector size={size} entrada={entrada} vivo={entrada > 48} />
      <div style={{ opacity: n, transform: `translateY(${(1 - n) * 30}px)` }}><NombreAib tam={size * 0.3} /></div>
    </div>
  );
};

export const AIB_T: TemaMarca = {
  id: "ai-borinquen", nombre: "AI Borinquen", fuente: OUTFIT, mono: MONO,
  fondo: AIB.fondo, superficie: AIB.superficie, borde: AIB.borde, texto: AIB.texto, gris: AIB.gris,
  acento: AIB.verde, acento2: AIB.teal, alarma: AIB.alarma, textoCta: "#04140B",
  gradiente: `linear-gradient(120deg, ${AIB.teal} 0%, ${AIB.verde} 60%, ${AIB.verdeClaro} 100%)`, brillo: "#0f4a2e", brillo2: AIB.azulLogo,
  musica: "audio/aib-musica.mp3", Logo: LogoAib, Firma: FirmaAib,
};

/* ───────── Ritmo: asistencia y desempeño del equipo (app interna, tema .ritmo de globals.css) ───────── */
const LATIDO = "M5 17h5l2.5-6 4 11 3-8 1.5 3H27"; // el trazo de app/ritmo/icon.svg
const LogoRitmo: TemaMarca["Logo"] = ({ size, entrada = null, vivo = false }) => {
  const f = useCurrentFrame();
  const e = entrada ?? 999;
  const p = Math.min(1, tw(e, 0, 20));
  const d = evolvePath(p, LATIDO);
  const pulso = vivo ? 1 + 0.04 * Math.max(0, Math.sin(f / 4)) ** 8 : 1;
  const id = `rg${size}`;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ transform: `scale(${(entrada === null ? 1 : 0.7 + 0.3 * rebote(e, 0, 18)) * pulso})` }}>
      <defs><linearGradient id={id} x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse"><stop stopColor="#5cf09a" /><stop offset="1" stopColor="#f59e7a" /></linearGradient></defs>
      <rect width="32" height="32" rx="8" fill="#191c2b" />
      <path d={LATIDO} fill="none" stroke={`url(#${id})`} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={p < 1 ? d.strokeDasharray : undefined} strokeDashoffset={p < 1 ? d.strokeDashoffset : undefined}
        style={{ filter: "drop-shadow(0 0 1.2px #5cf09a)" }} />
    </svg>
  );
};
const FirmaRitmo: TemaMarca["Firma"] = ({ size, entrada }) => {
  const n = tw(entrada, 12, 26);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.08 }}>
      <LogoRitmo size={size * 0.62} entrada={entrada} vivo={entrada > 30} />
      <div style={{ fontFamily: geist.fontFamily, fontWeight: 800, fontSize: size * 0.3, letterSpacing: "-0.04em", lineHeight: 1, opacity: n, transform: `translateY(${(1 - n) * 30}px)`,
        backgroundImage: "linear-gradient(90deg, #5cf09a, #f59e7a)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Ritmo</div>
    </div>
  );
};

export const RITMO_T: TemaMarca = {
  id: "ritmo", nombre: "Ritmo", fuente: geist.fontFamily, mono: MONO,
  fondo: "#12141f", superficie: "#1d2133", borde: "#2c3148", texto: "#eef0f7", gris: "#9aa0b8",
  acento: "#5cf09a", acento2: "#f59e7a", alarma: "#f59e7a", textoCta: "#0f1a14",
  gradiente: "linear-gradient(110deg, #5cf09a 0%, #a8e88c 45%, #f59e7a 100%)", brillo: "#1f3a33", brillo2: "#3a2a2a",
  musica: "audio/ritmo-musica.mp3", Logo: LogoRitmo, Firma: FirmaRitmo,
};

export const TEMAS: Record<MarcaId, TemaMarca> = { "level-up": LEVEL_UP, bori: BORI_T, "ai-borinquen": AIB_T, ritmo: RITMO_T };
