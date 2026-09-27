// El coquí de Bori partido en capas para animarlo. Las formas son EXACTAMENTE las de
// vault/proyectos/bori-crecimiento/marca/01-logo/logo-color.svg (viewBox 200×200):
// no se redibuja nada, solo se mueve. Con los valores por defecto se ve igual al logo.
import React, { useId } from "react";
import { evolvePath } from "@remotion/paths";
import { C } from "./bori";

const HOJA = "M6 178 C40 150, 100 136, 150 130 C176 127, 190 124, 196 118 C186 140, 160 156, 126 162 C88 168, 40 176, 6 178 Z";
const VENA = "M12 174 C60 158, 120 146, 190 122";
const CUERPO = "M52 110 C44 88, 62 62, 96 56 C126 50, 156 56, 176 72 L186 78 C180 86, 168 96, 152 104 C128 116, 98 124, 74 122 C62 120, 56 116, 52 110 Z";
const ONDA_1 = "M180 58 C186 50, 188 40, 186 30";
const ONDA_2 = "M192 70 C200 58, 202 44, 198 28";

export type CoquiProps = {
  size: number;
  /** 0 → 1: la hoja se dibuja (trazo) y luego se rellena. */
  hoja?: number;
  /** Visibilidad del coquí (0 = no está). */
  cuerpo?: number;
  /** Desplazamiento vertical del coquí en unidades del viewBox (caída). */
  caidaY?: number;
  /** Squash & stretch: 1 = normal, <1 aplastado, >1 estirado. */
  squash?: number;
  /** 0 → 1: párpado cerrado. */
  parpadeo?: number;
  /** Escala del saco vocal (1 = logo). */
  saco?: number;
  /** 0 → 1: las dos ondas del logo se dibujan. */
  ondas?: number;
  /** Ondas extra que salen del saco al cantar (0 → 1 es un ciclo). null = sin canto. */
  canto?: number | null;
  style?: React.CSSProperties;
};

export const Coqui: React.FC<CoquiProps> = ({
  size,
  hoja = 1,
  cuerpo = 1,
  caidaY = 0,
  squash = 1,
  parpadeo = 0,
  saco = 1,
  ondas = 1,
  canto = null,
  style,
}) => {
  const id = useId().replace(/:/g, "");
  const trazoHoja = evolvePath(Math.min(1, hoja * 1.6), HOJA);
  const rellenoHoja = Math.max(0, (hoja - 0.45) / 0.55);
  const onda1 = evolvePath(Math.min(1, ondas * 1.8), ONDA_1);
  const onda2 = evolvePath(Math.max(0, Math.min(1, ondas * 1.8 - 0.8)), ONDA_2);

  // El squash se ancla en las patas (≈ y 150) para que "aterrice" sobre la hoja.
  const sx = 1 + (1 - squash) * 0.6;
  const ancla = { x: 110, y: 150 };
  const cuerpoTransform = `translate(0 ${caidaY}) translate(${ancla.x} ${ancla.y}) scale(${sx} ${squash}) translate(${-ancla.x} ${-ancla.y})`;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.cobre} />
          <stop offset="1" stopColor={C.cobreOscuro} />
        </linearGradient>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.teal} />
          <stop offset="0.55" stopColor={C.verde} />
          <stop offset="1" stopColor={C.verdeClaro} />
        </linearGradient>
        <linearGradient id={`w${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={C.verde} />
          <stop offset="1" stopColor={C.verdeClaro} />
        </linearGradient>
      </defs>

      {/* Hoja: primero el contorno se dibuja, después se rellena */}
      <g>
        <path d={HOJA} fill={`url(#h${id})`} opacity={rellenoHoja} />
        {hoja < 1 && (
          <path d={HOJA} fill="none" stroke={C.verdeClaro} strokeWidth={2.2} strokeLinejoin="round"
            strokeDasharray={trazoHoja.strokeDasharray} strokeDashoffset={trazoHoja.strokeDashoffset}
            opacity={1 - rellenoHoja * 0.7} />
        )}
        <path d={VENA} fill="none" stroke={C.verdeClaro} strokeWidth={2.4} strokeLinecap="round" opacity={0.7 * rellenoHoja} />
      </g>

      {/* Coquí */}
      <g opacity={cuerpo} transform={cuerpoTransform}>
        <path d="M64 114 C46 110, 30 118, 26 134" fill="none" stroke={C.cobreSombra} strokeWidth={15} strokeLinecap="round" />
        <path d="M26 134 C30 150, 44 160, 62 158" fill="none" stroke={C.cobreOscuro} strokeWidth={12} strokeLinecap="round" />
        <path d="M62 158 C78 158, 92 152, 104 146" fill="none" stroke={C.cobreOscuro} strokeWidth={9} strokeLinecap="round" />
        <circle cx={106} cy={145} r={6.5} fill={C.crema} />
        <circle cx={96} cy={154} r={5} fill={C.crema} />
        {/* Saco vocal: crece desde su centro */}
        <g transform={`translate(124 116) scale(${saco}) translate(-124 -116)`}>
          <circle cx={124} cy={116} r={23} fill={C.crema} />
        </g>
        <path d={CUERPO} fill={`url(#b${id})`} />
        <path d="M62 118 C88 124, 118 118, 148 104 C132 118, 100 126, 74 122 Z" fill={C.crema} opacity={0.92} />
        <path d="M72 74 C102 62, 138 62, 168 76" fill="none" stroke={C.crema} strokeWidth={3.5} strokeLinecap="round" />
        {/* Ojo + párpado */}
        <g transform={`translate(150 74) scale(1 ${1 - parpadeo * 0.92}) translate(-150 -74)`}>
          <circle cx={150} cy={74} r={14} fill={C.pupila} />
          <circle cx={150} cy={74} r={11} fill={C.oro} />
          <circle cx={150} cy={75} r={6} fill={C.pupila} />
          <circle cx={153} cy={71} r={2.2} fill="#fff" />
        </g>
        {parpadeo > 0.05 && (
          <path d="M137 74 C142 80, 158 80, 163 74" fill="none" stroke={C.cobreOscuro} strokeWidth={3} strokeLinecap="round" opacity={parpadeo} />
        )}
        <path d="M134 110 C136 124, 142 134, 156 136" fill="none" stroke={C.cobreOscuro} strokeWidth={10} strokeLinecap="round" />
        <circle cx={160} cy={136} r={6} fill={C.crema} />
        <circle cx={152} cy={142} r={4.5} fill={C.crema} />

        {/* Las dos ondas del logo */}
        <path d={ONDA_1} fill="none" stroke={`url(#w${id})`} strokeWidth={6.5} strokeLinecap="round"
          strokeDasharray={onda1.strokeDasharray} strokeDashoffset={onda1.strokeDashoffset} />
        <path d={ONDA_2} fill="none" stroke={`url(#w${id})`} strokeWidth={6.5} strokeLinecap="round" opacity={0.6}
          strokeDasharray={onda2.strokeDasharray} strokeDashoffset={onda2.strokeDashoffset} />

        {/* Canto: las ondas se repiten hacia afuera, como una señal */}
        {canto !== null &&
          [0, 1, 2].map((i) => {
            const p = (canto + i / 3) % 1;
            const d = 12 + p * 46;
            return (
              <path key={i} d={ONDA_2} fill="none" stroke={C.verdeClaro} strokeWidth={5 - p * 3} strokeLinecap="round"
                opacity={(1 - p) * 0.8}
                transform={`translate(${d * 0.9} ${-d * 0.25}) scale(${1 + p * 0.4})`}
                style={{ transformOrigin: "192px 50px" }} />
            );
          })}
      </g>
    </svg>
  );
};
