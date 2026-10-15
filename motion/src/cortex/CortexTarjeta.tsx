// Tarjetas de diseño para el b-roll de Cortex (16/oct, Elvin: «te autorizo a mejorar todo… a un nivel mucho más
// profesional»). Cuando el cliente no mandó una toma de lo que se dice, el b-roll ya no es una imagen de IA (el equipo
// las quitaba TODAS: 8 de 8 en la auditoría) sino una TARJETA como las de Yulianna: fondo oscuro con rejilla en
// perspectiva (o el color de la marca, o claro y limpio), un ícono de línea de UN solo estilo dentro de un panel de
// vidrio (o una foto del cliente en su marco), texto grande en Inter apretado y entrada con movimiento real
// (desenfoque que se abre, el ícono se dibuja, las palabras suben una a una, acercamiento lento todo el tiempo).
// «Serio» (médicos, abogados…) = nada de caricaturas ni brillos de neón que laten: la misma tarjeta, sobria.
// Se renderiza OPACA: como composición propia (CortexTarjeta) y también dentro de CortexCapa (elemento "tarjeta"),
// que es lo que el servicio de Remi ya sabe pedir (/capas) sin tocar el servidor.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as cargarInter } from "@remotion/google-fonts/Inter";

const INTER = cargarInter("normal", { weights: ["300", "600", "900"], subsets: ["latin"] }).fontFamily;

export const ICONOS = [
  "reloj", "calendario", "chat", "llamada", "celular", "grafica", "dinero", "check", "salud", "corazon", "pulso", "ubicacion",
  "estrella", "usuarios", "documento", "herramienta", "comida", "carrito", "idea", "objetivo", "escudo", "chip", "hogar",
  "tienda", "rayo",
] as const;
export type Icono = (typeof ICONOS)[number];

export type Tarjeta = {
  titulo: string;                       // lo grande (1–4 palabras de lo que se dice)
  entrada?: string;                     // frase pequeña de entrada ("que combina")
  icono?: Icono | null;                 // ícono de línea (un solo estilo para todo Cortex)
  foto?: string | null;                 // foto del cliente (URL o data URL) en marco, en vez del ícono
  estilo: "oscuro" | "marca" | "claro"; // oscuro = rejilla tipo Yulianna · marca = color del cliente · claro = limpio
  acento: string;                       // color del ícono, la rejilla y la barra (#hex)
  fondo?: string | null;                // estilo marca: color de fondo (#hex)
  tono?: "neutral" | "pain" | "solution";
  sobrio?: boolean;                     // serio: movimiento suave, sin brillos que laten
  semilla?: number;
};

export type PropsTarjeta = { ancho: number; alto: number; fps: number; dur: number; tarjeta: Tarjeta };

const B = (W: number, H: number) => Math.min(W, 0.75 * H);   // misma unidad de tamaño que Cortex y CortexCapa

function rgb(hex: string): [number, number, number] {
  const h = /^#?[0-9a-fA-F]{6}$/.test(hex || "") ? hex.replace("#", "") : "8A5CFF";
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
const mezcla = (hex: string, k: number, con: [number, number, number] = [0, 0, 0]) => {
  const [r, g, b] = rgb(hex);
  return `rgb(${Math.round(r * (1 - k) + con[0] * k)},${Math.round(g * (1 - k) + con[1] * k)},${Math.round(b * (1 - k) + con[2] * k)})`;
};
const luminancia = (hex: string) => { const [r, g, b] = rgb(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

// ---- íconos de línea (24×24, trazo redondo; dibujados a mano, un solo estilo) ----
const TRAZOS: Record<Icono, string[]> = {
  reloj: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M12 7v5l3.2 2"],
  calendario: ["M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M3 10h18", "M8 3v4", "M16 3v4", "M8 14h2", "M14 14h2", "M8 17.5h2"],
  chat: ["M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.6A8.5 8.5 0 1 1 21 11.5z", "M8.5 11.5h.01", "M12.5 11.5h.01", "M16.5 11.5h.01"],
  llamada: ["M5 3.5h3l2 5-2.5 1.6a11.5 11.5 0 0 0 5.4 5.4L14.5 13l5 2v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"],
  celular: ["M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5z", "M11 18.5h2"],
  grafica: ["M3 3v18h18", "M7 15l4-4 3 3 6-7", "M15 7h5v5"],
  dinero: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M15 9.3c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.1s1.3 1.8 3 2.1 3 .9 3 2.1-1.3 2.1-3 2.1c-1.4 0-2.6-.6-3.1-1.6", "M12 5.8v2", "M12 16.2v2"],
  check: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M8 12.4l2.7 2.7L16.2 9.6"],
  salud: ["M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"],
  corazon: ["M12 20.3S3.5 15.2 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 6-8.5 11.1-8.5 11.1z"],
  pulso: ["M2.5 12h4.2l2.1-5.5 4.2 11 2.1-5.5h6.4"],
  ubicacion: ["M12 21s-7-6.3-7-11.2a7 7 0 0 1 14 0C19 14.7 12 21 12 21z", "M12 7.3a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z"],
  estrella: ["M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"],
  usuarios: ["M9 4.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z", "M2.5 20.5a6.5 6.5 0 0 1 13 0", "M15.5 4.7a3.5 3.5 0 0 1 0 6.6", "M17.5 14.3a6.3 6.3 0 0 1 4 6.2"],
  documento: ["M6.5 2.5H14l4.5 4.5v13a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5z", "M14 2.5V7h4.5", "M8.5 12h7", "M8.5 15.5h7", "M8.5 9h3"],
  herramienta: ["M14.5 6.5a4.5 4.5 0 0 0 5.6 5.6l-8.6 8.6a2.2 2.2 0 0 1-3.1-3.1l8.6-8.6a4.5 4.5 0 0 0-2.5-2.5z", "M14.5 6.5l2.2-2.2a4.5 4.5 0 0 1 3.3 3.3l-2.2 2.2"],
  comida: ["M6 3v6.5a2.5 2.5 0 0 0 5 0V3", "M8.5 3v18", "M17.5 21V3c-2.2 1.2-3.5 4-3.5 8.5h3.5"],
  carrito: ["M2.5 4h2.6l2.3 11.2h10.4l2.2-7.7H6.2", "M9 19.2a1.3 1.3 0 1 0 0 .01", "M16.8 19.2a1.3 1.3 0 1 0 0 .01"],
  idea: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"],
  objetivo: ["M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z", "M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z", "M12 10.6a1.4 1.4 0 1 0 0 2.8a1.4 1.4 0 1 0 0-2.8z"],
  escudo: ["M12 3l7.5 3v6c0 4.6-3.2 7.8-7.5 9.2C7.7 19.8 4.5 16.6 4.5 12V6z", "M8.8 12.2l2.2 2.2 4.2-4.3"],
  chip: ["M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z", "M10 10h4v4h-4z", "M9.5 3v4", "M14.5 3v4", "M9.5 17v4", "M14.5 17v4", "M3 9.5h4", "M3 14.5h4", "M17 9.5h4", "M17 14.5h4"],
  hogar: ["M3 11l9-7.5 9 7.5", "M5.5 9.3V20h13V9.3", "M10 20v-5.5h4V20"],
  tienda: ["M3.5 9l1.8-5h13.4l1.8 5", "M3.5 9h17", "M5 9v11h14V9", "M10 20v-5h4v5"],
  rayo: ["M13.5 2.5L4.5 14h6.5l-1 7.5 9-11.5h-6.5z"],
};

const IconoLinea: React.FC<{ icono: Icono; lado: number; color: string; progreso: number; grosor: number }> = ({ icono, lado, color, progreso, grosor }) => (
  <svg width={lado} height={lado} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {(TRAZOS[icono] ?? TRAZOS.check).map((d, i, arr) => {
      // cada trazo se dibuja después del anterior (escalonado): el ícono "se escribe", no aparece de golpe
      const w = arr.length > 1 ? 0.6 : 1, g = arr.length > 1 ? (1 - w) / (arr.length - 1) : 0;
      const p = Math.max(0, Math.min(1, (progreso - i * g) / w));
      return <path key={i} d={d} pathLength={1} stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={1} strokeDashoffset={1 - p} />;
    })}
  </svg>
);

// ---- fondos ----
const FondoOscuro: React.FC<{ acento: string; sobrio: boolean; t: number }> = ({ acento, sobrio, t }) => {
  const { width: W, height: H } = useVideoConfig();
  const paso = W * 0.11;
  const avance = (t * paso * (sobrio ? 0.35 : 0.6)) % paso;   // la rejilla del piso viene hacia ti (lento)
  const lineas = Array.from({ length: 15 }, (_, i) => i);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse ${W * 0.95}px ${H * 0.55}px at 50% 38%, ${mezcla(acento, 0.78)} 0%, #07080D 62%, #040406 100%)` }}>
      {/* piso en perspectiva: la rejilla se va hacia el horizonte y avanza despacio hacia ti */}
      <div style={{ position: "absolute", left: 0, right: 0, top: H * (W > H ? 0.76 : 0.6), bottom: 0, perspective: H * 0.35, perspectiveOrigin: "50% 0%", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -W, right: -W, top: 0, height: H * 1.6, transform: "rotateX(72deg)", transformOrigin: "50% 0%",
          backgroundImage: `linear-gradient(${rgba(acento, sobrio ? 0.22 : 0.38)} 3px, transparent 3px), linear-gradient(90deg, ${rgba(acento, sobrio ? 0.22 : 0.38)} 3px, transparent 3px)`,
          backgroundSize: `${paso}px ${paso}px`, backgroundPosition: `0px ${avance}px` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #05060A 0%, rgba(5,6,10,0.2) 30%, rgba(5,6,10,0) 60%, rgba(5,6,10,0.85) 100%)" }} />
      </div>
      {/* luz del horizonte */}
      <div style={{ position: "absolute", left: 0, right: 0, top: H * 0.52, height: H * 0.14,
        background: `radial-gradient(ellipse ${W * 0.7}px ${H * 0.05}px at 50% 50%, ${rgba(acento, sobrio ? 0.18 : 0.35)}, transparent 70%)` }} />
      {/* partículas que suben despacio */}
      {lineas.map((i) => {
        const r = (k: string) => random(`p-${i}-${k}`);
        const y = ((r("y") * H - t * H * (0.02 + 0.03 * r("v"))) % H + H) % H;
        const lado = (sobrio ? 2 : 3) + r("s") * W * 0.004;
        return <div key={i} style={{ position: "absolute", left: r("x") * W, top: y, width: lado, height: lado, borderRadius: "50%",
          background: rgba(i % 3 === 0 ? acento : "#FFFFFF", sobrio ? 0.18 : 0.35 + 0.3 * r("o")) }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      {/* sombra suave detrás del texto: la rejilla nunca compite con la letra */}
      <div style={{ position: "absolute", left: W * 0.5, top: H * 0.7, width: W * 1.1, height: H * 0.3, transform: "translate(-50%,-50%)",
        background: "radial-gradient(ellipse at 50% 50%, rgba(4,5,8,0.8) 0%, rgba(4,5,8,0) 70%)" }} />
    </AbsoluteFill>
  );
};

const FondoMarca: React.FC<{ color: string; t: number }> = ({ color, t }) => {
  const { width: W, height: H } = useVideoConfig();
  const mov = t * W * 0.02;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${mezcla(color, 0.12, [255, 255, 255])} 0%, ${color} 45%, ${mezcla(color, 0.45)} 100%)` }}>
      <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent ${W * 0.045}px)`,
        backgroundPosition: `${mov}px 0px` }} />
      <div style={{ position: "absolute", left: W * 0.5, top: H * 0.36, width: W * 1.1, height: W * 1.1, transform: "translate(-50%,-50%)", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};

const FondoClaro: React.FC<{ acento: string; t: number }> = ({ acento, t }) => {
  const { width: W, height: H } = useVideoConfig();
  const paso = W * 0.075;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(170deg, #FAFAFB 0%, #EEF0F3 60%, #E3E6EB 100%)" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(20,30,50,0.05) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(20,30,50,0.05) 1.5px, transparent 1.5px)",
        backgroundSize: `${paso}px ${paso}px`, backgroundPosition: `0px ${-t * paso * 0.25}px`,
        maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 80%)" }} />
      <div style={{ position: "absolute", left: W * 0.5, top: H * 0.36, width: W * 0.95, height: W * 0.95, transform: "translate(-50%,-50%)", borderRadius: "50%",
        background: `radial-gradient(circle, ${rgba(acento, 0.12)} 0%, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

// ---- partir el título en 1–2 líneas parejas ----
export function partirTitulo(titulo: string, maxCar = 13): string[] {
  const palabras = (titulo || "").trim().split(/\s+/).filter(Boolean);
  if (palabras.join(" ").length <= maxCar || palabras.length < 2) return [palabras.join(" ")];
  let mejor = [palabras.join(" ")], peor = Infinity;
  for (let k = 1; k < palabras.length; k++) {
    const a = palabras.slice(0, k).join(" "), b = palabras.slice(k).join(" ");
    const d = Math.max(a.length, b.length);
    if (d < peor) { peor = d; mejor = [a, b]; }
  }
  return mejor;
}

export const TarjetaVista: React.FC<{ t: Tarjeta }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H, durationInFrames } = useVideoConfig();
  const s = t.sobrio ?? false;
  const tt = frame / fps;
  const u = B(W, H);
  const horizontal = W > H * 1.05;
  const claro = t.estilo === "claro";
  const acento = t.acento || "#8A5CFF";
  const tinta = claro ? "#141821" : "#FFFFFF";
  const colorTitulo = t.tono === "pain" && !s ? "#FF5A47" : tinta;

  // entrada de toda la tarjeta: se abre de un desenfoque (Yulianna reparte la entrada en 7–14 cuadros) + acercamiento lento
  const abre = interpolate(frame, [0, Math.round(0.4 * fps)], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const empuje = 1.06 - 0.06 * abre + interpolate(frame, [0, durationInFrames], [0, s ? 0.025 : 0.04]);
  const desenfoque = (1 - abre) * u * 0.018;

  // el visual (ícono en panel de vidrio, o la foto del cliente)
  const pop = spring({ frame: frame - 3, fps, config: s ? { damping: 20, stiffness: 110 } : { damping: 13, stiffness: 140, mass: 0.8 } });
  const dibujo = interpolate(frame, [4, 4 + Math.round(0.75 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const flota = s ? 0 : Math.sin(tt * 2.1) * u * 0.008;
  const lado = horizontal ? H * 0.42 : u * 0.40;
  const cx = horizontal ? W * 0.3 : W / 2;
  const cy = horizontal ? H * 0.5 : H * 0.355;
  const pulso = s ? 0.55 : 0.55 + 0.25 * Math.sin(tt * 3.2);

  // el texto: palabras que suben una a una desde un desenfoque
  const lineas = partirTitulo(t.titulo, horizontal ? 15 : 13);
  const largo = Math.max(...lineas.map((l) => l.length), 1);
  const ancho = horizontal ? W * 0.5 : W * 0.86;
  const tam = Math.min(u * (horizontal ? 0.13 : 0.125), ancho / (largo * 0.56));
  const tamEntrada = u * 0.046;
  const tx = horizontal ? W * 0.56 : W / 2;
  const ty = horizontal ? H * 0.5 : H * 0.64;
  let n = 0;
  const palabra = (p: string, key: string, ultima: boolean) => {
    const k = n++;
    const a = interpolate(frame, [7 + k * 3, 7 + k * 3 + Math.round(0.35 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return <span key={key} style={{ display: "inline-block", opacity: a, transform: `translateY(${(1 - a) * tam * 0.45}px)`, filter: `blur(${(1 - a) * tam * 0.08}px)`, marginRight: ultima ? 0 : tam * 0.24 }}>{p}</span>;
  };
  const barra = interpolate(frame, [12, 12 + Math.round(0.5 * fps)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const entradaOp = interpolate(frame, [5, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fondo = t.estilo === "marca" ? <FondoMarca color={t.fondo || acento} t={tt} /> : claro ? <FondoClaro acento={acento} t={tt} /> : <FondoOscuro acento={acento} sobrio={s} t={tt} />;
  // en fondo de marca el ícono va blanco; en claro, del acento (si el acento es muy claro, tinta oscura)
  const colorIcono = t.estilo === "marca" ? "#FFFFFF" : claro ? (luminancia(acento) > 0.72 ? "#141821" : acento) : mezcla(acento, 0.35, [255, 255, 255]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050507", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${empuje})`, filter: desenfoque > 0.3 ? `blur(${desenfoque}px)` : undefined }}>
        {fondo}
        {/* aros alrededor del visual (tipo holograma de Yulianna); en serio, uno solo y quieto */}
        {!claro ? [1.55, 1.95].slice(0, s ? 1 : 2).map((k, i) => (
          <div key={k} style={{ position: "absolute", left: cx, top: cy + flota, width: lado * k, height: lado * k, borderRadius: "50%",
            border: `${Math.max(2, u * 0.003)}px ${i === 0 ? "solid" : "dashed"} ${t.estilo === "marca" ? "rgba(255,255,255,0.28)" : rgba(acento, 0.35 * pulso)}`,
            transform: `translate(-50%,-50%) rotate(${s ? 0 : tt * (i === 0 ? 14 : -9)}deg) scale(${0.85 + 0.15 * pop})`, opacity: pop }} />
        )) : null}
        {t.foto ? (
          <div style={{ position: "absolute", left: cx, top: cy + flota, width: lado * 1.25, height: lado * 1.5, transform: `translate(-50%,-50%) translateY(${(1 - pop) * u * 0.06}px) scale(${0.9 + 0.1 * pop})`,
            opacity: Math.min(1, pop * 1.4), borderRadius: u * 0.035, overflow: "hidden", boxShadow: `0 ${u * 0.03}px ${u * 0.07}px rgba(0,0,0,0.5), 0 0 0 ${u * 0.006}px ${claro ? "#FFFFFF" : rgba(acento, 0.85)}` }}>
            <Img src={t.foto} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + 0.05 * (frame / Math.max(1, durationInFrames))})` }} />
          </div>
        ) : t.icono ? (
          <div style={{ position: "absolute", left: cx, top: cy + flota, width: lado, height: lado, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * pop})`, opacity: Math.min(1, pop * 1.5),
            borderRadius: lado * 0.22, display: "flex", alignItems: "center", justifyContent: "center",
            background: t.estilo === "marca" ? "rgba(255,255,255,0.14)" : claro ? "#FFFFFF" : `linear-gradient(150deg, ${rgba(acento, 0.28)}, rgba(255,255,255,0.04))`,
            border: `${Math.max(2, u * 0.004)}px solid ${t.estilo === "marca" ? "rgba(255,255,255,0.55)" : claro ? rgba(acento, 0.45) : rgba(acento, 0.75)}`,
            boxShadow: claro ? `0 ${u * 0.02}px ${u * 0.05}px rgba(20,30,50,0.14)` : `0 0 ${u * (s ? 0.03 : 0.06) * pulso}px ${rgba(acento, 0.7)}, inset 0 0 ${u * 0.04}px ${rgba(acento, 0.35)}` }}>
            <IconoLinea icono={t.icono} lado={lado * 0.56} color={colorIcono} progreso={dibujo} grosor={1.5} />
          </div>
        ) : null}
        {/* texto */}
        <div style={{ position: "absolute", left: tx, top: ty, transform: horizontal ? "translate(0,-50%)" : "translate(-50%,0)", width: ancho,
          textAlign: horizontal ? "left" : "center", fontFamily: INTER }}>
          {t.entrada ? <div style={{ fontWeight: 300, fontSize: tamEntrada, color: claro ? "#3A4150" : "rgba(255,255,255,0.88)", letterSpacing: -tamEntrada * 0.02,
            marginBottom: tam * 0.1, opacity: entradaOp }}>{t.entrada}</div> : null}
          {lineas.map((l, i) => (
            <div key={i} style={{ fontWeight: 900, fontSize: tam, lineHeight: 1.0, letterSpacing: -tam * 0.045, color: colorTitulo, whiteSpace: "nowrap",
              textShadow: claro ? "none" : `0 ${tam * 0.05}px ${tam * 0.18}px rgba(0,0,0,0.55)` }}>
              {l.split(" ").map((p, j, ps) => palabra(p, `${i}-${j}`, j === ps.length - 1))}
            </div>
          ))}
          <div style={{ height: Math.max(4, u * 0.007), width: u * 0.16 * barra, marginTop: tam * 0.28, borderRadius: 99,
            marginLeft: horizontal ? 0 : "auto", marginRight: horizontal ? 0 : "auto",
            background: t.estilo === "marca" ? "#FFFFFF" : acento, boxShadow: claro || s ? "none" : `0 0 ${u * 0.02}px ${rgba(acento, 0.8)}` }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const CortexTarjeta: React.FC<PropsTarjeta> = ({ tarjeta }) => <TarjetaVista t={tarjeta} />;

export const TARJETA_EJEMPLO: PropsTarjeta = {
  ancho: 1080, alto: 1920, fps: 30, dur: 3,
  tarjeta: { titulo: "Se te olvidan las citas", entrada: "y encima", icono: "calendario", estilo: "oscuro", acento: "#4F8BFF", tono: "neutral", sobrio: false, semilla: 1 },
};
