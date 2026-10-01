// ESTILOS de la fábrica (Elvin, 28/sep: "todos se ven iguales… pero mantener una identidad dentro de ese cliente, sin
// abusar"). La MARCA pone la identidad fija: colores, logo y su letra (1 principal + 1 de acento opcional). El ESTILO
// pone la plantilla: cómo se resalta, cómo entran las palabras, cómo lucen los bullets, transiciones, fondo, cierre y
// el RITMO. Nunca cambia la letra de la marca. Un mismo guion con otro estilo = otro video, misma marca.
// Se escoge con `estilo` en el guion; sin él, los anuncios viejos quedan en "neon" (el look aprobado del 27/sep) y
// remi.mjs le sortea uno a cada guion nuevo. "auto" = uno fijo según el id (siempre el mismo para ese video).
import React, { createContext, useContext } from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Barrido, Destello, Fondo, inOut, tw } from "../kit/fx";
import type { TemaMarca } from "./temas";

export const ESTILOS_ID = ["neon", "editorial", "impacto", "minimal", "pop", "tecno"] as const;
export type EstiloId = (typeof ESTILOS_ID)[number];

export type Estilo = {
  id: EstiloId;
  /** Para el skill y para escoger: qué es y para qué va bien. */
  describe: string;
  /** Titulares en la letra de ACENTO de la marca (si tiene una; p. ej. su serif). */
  usaAcento?: boolean;
  /** Ritmo: multiplica los tiempos de entrada y de las transiciones (0.7 rápido · 1 normal · 1.4 calmado). */
  tempo: number;
  mayus: boolean;
  peso: number;
  tracking: string;
  interlinea: number;
  /** Multiplica el tamaño que calcula `ajustar` (mayúsculas ocupan más: se achica). */
  escala: number;
  alinear: "center" | "left";
  /** Cómo se ve la *palabra resaltada*. */
  resaltado: "color" | "italica" | "bloque" | "subrayado" | "sticker";
  /** Cómo entran las palabras. */
  entrada: "subir" | "desenfoque" | "escala" | "corte";
  /** Cómo lucen los bullets (lista, pasos, puntos del retrato). */
  tarjeta: "pildora" | "linea" | "bloque" | "numeral" | "sticker" | "terminal";
  radio: number;
  /** Halos y brillos (neón). */
  brillo: boolean;
  transicion: "barrido" | "persiana" | "iris" | "fundido" | "bloque" | "glitch";
  fondo: "brillo" | "liso" | "diagonal" | "puntos" | "grid";
  etiqueta: "mono" | "regla" | "pastilla";
  /** Cierre: todo al centro, o partido (logo a un lado, CTA al otro) en 16:9. */
  cierre: "centro" | "partido";
};


export const ESTILOS: Record<EstiloId, Estilo> = {
  neon: {
    id: "neon", describe: "El look de lanzamiento: negrita, resaltado de color con halo, píldoras, barridos diagonales, brillo y partículas. Ritmo normal. Tecnología, IA, energía.",
    tempo: 1, mayus: false, peso: 800, tracking: "-0.035em", interlinea: 1.05, escala: 1, alinear: "center",
    resaltado: "color", entrada: "subir", tarjeta: "pildora", radio: 26, brillo: true, transicion: "barrido", fondo: "brillo", etiqueta: "mono", cierre: "centro",
  },
  editorial: {
    id: "editorial", describe: "Revista: resaltado en itálica (en la letra de acento si la marca tiene), a la izquierda, números grandes 01·02·03 con filetes finos, persianas suaves. Ritmo calmado. Salud, profesionales, lujo, confianza.",
    usaAcento: true, tempo: 1.35, mayus: false, peso: 700, tracking: "-0.03em", interlinea: 1.04, escala: 1, alinear: "left",
    resaltado: "italica", entrada: "desenfoque", tarjeta: "numeral", radio: 0, brillo: false, transicion: "persiana", fondo: "liso", etiqueta: "regla", cierre: "partido",
  },
  impacto: {
    id: "impacto", describe: "Póster de impacto: MAYÚSCULAS en negrita, resaltado en bloque de color, bullets como bloques sólidos, cortes secos con panel de color. Ritmo rápido. Ofertas, urgencia, gimnasios, construcción.",
    tempo: 0.7, mayus: true, peso: 800, tracking: "-0.01em", interlinea: 1, escala: 0.9, alinear: "center",
    resaltado: "bloque", entrada: "corte", tarjeta: "bloque", radio: 0, brillo: false, transicion: "bloque", fondo: "diagonal", etiqueta: "pastilla", cierre: "centro",
  },
  minimal: {
    id: "minimal", describe: "Minimalista: peso medio, mucho aire, resaltado con subrayado que se dibuja, bullets de línea fina, fundidos lentos. Ritmo calmado. Servicios premium, consultoría, bienes raíces.",
    tempo: 1.5, mayus: false, peso: 600, tracking: "-0.035em", interlinea: 1.08, escala: 0.86, alinear: "left",
    resaltado: "subrayado", entrada: "desenfoque", tarjeta: "linea", radio: 14, brillo: false, transicion: "fundido", fondo: "liso", etiqueta: "regla", cierre: "partido",
  },
  pop: {
    id: "pop", describe: "Pop: resaltado tipo sticker inclinado, bullets como stickers con sombra dura, palabras que rebotan, iris circular y fondo de puntos. Ritmo ágil. Comida, belleza, retail, jóvenes.",
    tempo: 0.85, mayus: false, peso: 800, tracking: "-0.03em", interlinea: 1.06, escala: 0.95, alinear: "center",
    resaltado: "sticker", entrada: "escala", tarjeta: "sticker", radio: 28, brillo: false, transicion: "iris", fondo: "puntos", etiqueta: "pastilla", cierre: "centro",
  },
  tecno: {
    id: "tecno", describe: "Tecno: a la izquierda, bullets de consola [✓], cuadrícula visible, cortes con glitch. Ritmo rápido. Software, IA, trading, datos.",
    tempo: 0.8, mayus: false, peso: 700, tracking: "-0.035em", interlinea: 1.04, escala: 0.96, alinear: "left",
    resaltado: "color", entrada: "corte", tarjeta: "terminal", radio: 6, brillo: true, transicion: "glitch", fondo: "grid", etiqueta: "mono", cierre: "partido",
  },
};

export type EstiloListo = Estilo;
export const EstiloCtx = createContext<EstiloListo>(ESTILOS.neon);
export const useEstilo = () => useContext(EstiloCtx);

/** "auto" = uno fijo según el id (siempre el mismo para ese video). */
export const resolverEstilo = (pedido: string | undefined, id: string): EstiloListo => {
  const clave = pedido === "auto" ? ESTILOS_ID[Math.floor(random(`estilo-${id}`) * ESTILOS_ID.length)] : (pedido as EstiloId) || "neon";
  return ESTILOS[clave] ?? ESTILOS.neon;
};

/* ───────── Fondos ───────── */
export const FondoEstilo: React.FC<{ tema: TemaMarca; estilo: Estilo }> = ({ tema, estilo }) => {
  const f = useCurrentFrame();
  switch (estilo.fondo) {
    case "brillo":
      return <Fondo color={tema.fondo} brillo={tema.brillo} brillo2={tema.brillo2} grid={tema.borde} intensidad={0.9} />;
    case "grid":
      return (
        <AbsoluteFill style={{ background: tema.fondo }}>
          <AbsoluteFill style={{ background: `radial-gradient(70% 60% at 30% 40%, ${tema.brillo} 0%, transparent 70%)`, opacity: 0.5 }} />
          <AbsoluteFill style={{
            backgroundImage: `linear-gradient(${tema.borde} 1px, transparent 1px), linear-gradient(90deg, ${tema.borde} 1px, transparent 1px)`,
            backgroundSize: "60px 60px", backgroundPosition: `0px ${(f * 0.8) % 60}px`, opacity: 0.45,
          }} />
          {/* Línea de escaneo */}
          <div style={{ position: "absolute", left: 0, right: 0, top: `${(f * 0.7) % 110 - 5}%`, height: 120, background: `linear-gradient(180deg, transparent, ${tema.acento}14, transparent)` }} />
        </AbsoluteFill>
      );
    case "diagonal": {
      const x = interpolate(f, [0, 900], [-8, 8]);
      return (
        <AbsoluteFill style={{ background: tema.fondo, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-40%", left: `${58 + x}%`, width: "38%", height: "180%", background: tema.superficie, transform: "rotate(18deg)" }} />
          <div style={{ position: "absolute", top: "-40%", left: `${78 + x}%`, width: "6%", height: "180%", background: tema.acento, opacity: 0.85, transform: "rotate(18deg)" }} />
        </AbsoluteFill>
      );
    }
    case "puntos":
      return (
        <AbsoluteFill style={{ background: tema.fondo }}>
          <AbsoluteFill style={{ background: `radial-gradient(55% 55% at 50% 50%, ${tema.brillo} 0%, transparent 75%)`, opacity: 0.5 }} />
          <AbsoluteFill style={{
            backgroundImage: `radial-gradient(${tema.acento} 2.2px, transparent 2.6px)`, backgroundSize: "44px 44px",
            backgroundPosition: `${(f * 0.4) % 44}px ${(f * 0.4) % 44}px`, opacity: 0.22,
          }} />
        </AbsoluteFill>
      );
    case "liso":
    default:
      return (
        <AbsoluteFill style={{ background: tema.fondo }}>
          <AbsoluteFill style={{ background: `radial-gradient(90% 70% at 20% 10%, ${tema.brillo} 0%, transparent 70%)`, opacity: 0.35 }} />
        </AbsoluteFill>
      );
  }
};

/* ───────── Transiciones (tapan cada corte, centradas en `c`) ───────── */
const Persiana: React.FC<{ c: number; color: string; linea: string; k: number }> = ({ c, color, linea, k }) => {
  const f0 = useCurrentFrame();
  const f = c + (f0 - c) / k;
  if (f < c - 10 || f > c + 12) return null;
  const n = 7;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const a = tw(f, c - 9 + i, c - 2 + i * 0.5, 0, 1, inOut);
        const b = tw(f, c + 1 + i * 0.5, c + 8 + i, 0, 1, inOut);
        const s = a * (1 - b);
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${(i * 100) / n}%`, height: `${100 / n + 0.3}%`, background: color, transform: `scaleY(${s})`, transformOrigin: i % 2 ? "top" : "bottom", borderBottom: `1px solid ${linea}` }} />
        );
      })}
    </AbsoluteFill>
  );
};
const Iris: React.FC<{ c: number; color: string; color2: string; k: number }> = ({ c, color, color2, k }) => {
  const f0 = useCurrentFrame();
  const f = c + (f0 - c) / k;
  if (f < c - 9 || f > c + 10) return null;
  const crece = tw(f, c - 9, c - 1, 0, 1, inOut);
  const sale = tw(f, c + 1, c + 9, 0, 1, inOut);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 3000, height: 3000, marginLeft: -1500, marginTop: -1500, borderRadius: "50%", background: color, transform: `scale(${crece * (1 - sale)})` }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 3000, height: 3000, marginLeft: -1500, marginTop: -1500, borderRadius: "50%", background: color2, transform: `scale(${tw(f, c - 6, c, 0, 0.6) * (1 - sale)})` }} />
    </AbsoluteFill>
  );
};
const Fundido: React.FC<{ c: number; color: string; k: number }> = ({ c, color, k }) => {
  const f0 = useCurrentFrame();
  const f = c + (f0 - c) / k;
  const o = interpolate(f, [c - 8, c, c + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} />;
};
const Bloque: React.FC<{ c: number; color: string; k: number }> = ({ c, color, k }) => {
  const f0 = useCurrentFrame();
  const f = c + (f0 - c) / k;
  if (f < c - 8 || f > c + 9) return null;
  const y = f < c ? interpolate(f, [c - 7, c - 1], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inOut })
    : interpolate(f, [c + 1, c + 7], [0, -100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: inOut });
  return <AbsoluteFill style={{ background: color, transform: `translateY(${y}%)`, pointerEvents: "none" }} />;
};
const Glitch: React.FC<{ c: number; colores: string[] }> = ({ c, colores }) => {
  const f = useCurrentFrame();
  if (f < c - 4 || f > c + 4) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} style={{
          position: "absolute", left: `${(random(`gx${c}${f}${i}`) - 0.5) * 30}%`, width: "100%",
          top: `${random(`gy${c}${f}${i}`) * 100}%`, height: `${2 + random(`gh${c}${f}${i}`) * 9}%`,
          background: colores[i % colores.length], opacity: 0.55 + random(`go${c}${f}${i}`) * 0.4, mixBlendMode: "screen",
        }} />
      ))}
    </AbsoluteFill>
  );
};

export const Transicion: React.FC<{ c: number; i: number; tema: TemaMarca; estilo: Estilo; barridoSiempre?: boolean }> = ({ c, i, tema, estilo, barridoSiempre }) => {
  switch (estilo.transicion) {
    case "persiana": return <Persiana c={c} color={tema.superficie} linea={tema.borde} k={estilo.tempo} />;
    case "iris": return <Iris c={c} color={tema.acento} color2={tema.fondo} k={estilo.tempo} />;
    case "fundido": return <Fundido c={c} color={tema.fondo} k={estilo.tempo} />;
    case "bloque": return <Bloque c={c} color={i % 2 ? tema.acento2 : tema.acento} k={estilo.tempo} />;
    case "glitch": return <><Glitch c={c} colores={[tema.acento, tema.acento2, tema.texto]} /><Destello en={c} color={tema.acento} max={0.18} dur={5} /></>;
    case "barrido":
    default:
      return i % 2 === 0 || barridoSiempre
        ? <Barrido centro={c} dur={Math.round(12 * estilo.tempo)} colores={[tema.acento2, tema.acento, tema.fondo]} angulo={i % 4 === 0 ? -12 : 12} />
        : <Destello en={c} color={tema.acento} max={0.22} dur={6} />;
  }
};
