// Tema de marca para un CLIENTE, armado desde JSON (sin tocar código): lo manda Max en el guion
// (campo `cliente`) con el logo real, los colores y la fuente del cliente. Paquete de Level Up: acuerdo ≥ $3,500 pagado completo = 2 motion.
// Fuentes permitidas (Google Fonts cargadas aquí): la del cliente tiene que ser una de estas.
import React from "react";
import { Img, useCurrentFrame } from "remotion";
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
    if (!c.logoUrl) return null;
    return (
      <Img src={c.logoUrl} style={{
        width: size, height: size, objectFit: "contain", opacity: entrada === null ? 1 : tw(e, 0, 8),
        transform: `translateY(${flota}px) scale(${s})`, filter: `drop-shadow(0 0 ${size * 0.08 * brillo}px ${c.acento})`,
      }} />
    );
  };
  const Firma: TemaMarca["Firma"] = ({ size, entrada }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.08 }}>
      {c.logoUrl ? <Logo size={size * 0.7} entrada={entrada} vivo={entrada > 30} /> : null}
      <div style={{ fontFamily: fuente, fontWeight: 800, fontSize: size * (c.logoUrl ? 0.2 : 0.26), color: texto, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.05, opacity: tw(entrada, c.logoUrl ? 12 : 0, c.logoUrl ? 24 : 14), transform: `translateY(${(1 - tw(entrada, c.logoUrl ? 12 : 0, c.logoUrl ? 24 : 14)) * 24}px)` }}>{c.nombre}</div>
      {c.subtitulo ? <div style={{ fontFamily: fuente, fontWeight: 600, fontSize: size * 0.085, color: c.acento, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "center", opacity: tw(entrada, 14, 28) }}>{c.subtitulo}</div> : null}
      {!c.logoUrl ? <div style={{ width: size * 0.5 * tw(entrada, 10, 30), height: Math.max(3, size * 0.012), borderRadius: 99, background: `linear-gradient(90deg, ${c.acento}, ${acento2})` }} /> : null}
    </div>
  );
  return {
    id: "level-up", // no se usa para buscar el tema: el tema viene armado
    nombre: c.nombre, fuente, mono: monoF,
    fondo: c.fondo, superficie: mezclar(c.fondo, oscuro ? "#ffffff" : "#000000", 0.06), borde: mezclar(c.fondo, oscuro ? "#ffffff" : "#000000", 0.16),
    texto, gris: hex(texto, 0.62), acento: c.acento, acento2, alarma: "#FF5A4E", textoCta: oscuro ? mezclar(c.fondo, "#000000", 0.2) : "#ffffff",
    gradiente: `linear-gradient(120deg, ${c.acento} 0%, ${acento2} 100%)`, brillo: mezclar(c.fondo, c.acento, 0.25), brillo2: mezclar(c.fondo, acento2, 0.2),
    musica: c.musica || "audio/lu-musica.mp3", Logo, Firma,
  };
}
