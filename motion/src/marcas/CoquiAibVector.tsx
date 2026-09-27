// Logo v2 de AI Borinquen (aprobado por Elvin el 27/sep/2026), animado POR PIEZAS.
// Las formas salen de aib-logo.json, que genera vault/proyectos/ai-borinquen/marca/logo-generador.py
// (única fuente: si el logo cambia, se corre el generador y el video se actualiza solo).
// Con entrada = null y vivo = false se ve idéntico a 01-logo/logo-color.svg.
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { evolvePath } from "@remotion/paths";
import L from "./aib-logo.json";
import { rebote, tw } from "../kit/fx";

type Dedo = [string, [number, number]];

export type CoquiAibVectorProps = {
  size: number; // ancho en px (viewBox 740×754)
  /** Frames desde que empieza la entrada (el logo se arma). null = ya armado. */
  entrada?: number | null;
  /** Loops de reposo: ecualizador, ondas, puntos rojos y parpadeo. */
  vivo?: boolean;
  /** Brillo neón extra (0–1) para golpes. */
  brillo?: number;
};

// Momentos de la entrada (frames desde el inicio)
const T = { contorno: [0, 16], relleno: [8, 20], cortes: [14, 34], patas: 16, brazo: 20, ojo: 24, nodos: 28, rojos: 32, ondas: [32, 46] } as const;

export const CoquiAibVector: React.FC<CoquiAibVectorProps> = ({ size, entrada = null, vivo = false, brillo = 0 }) => {
  const f = useCurrentFrame();
  const uid = useId().replace(/:/g, "");
  const e = entrada ?? 999;
  const dash = (p: number, d: string) => (p >= 1 ? {} : { strokeDasharray: evolvePath(p, d).strokeDasharray, strokeDashoffset: evolvePath(p, d).strokeDashoffset });
  const pop = (inicio: number, dur = 16) => (e >= 999 ? 1 : rebote(e, inicio, dur));
  const esc = (s: number, x: number, y: number) => `translate(${x} ${y}) scale(${Math.max(0, s)}) translate(${-x} ${-y})`;

  const contorno = tw(e, T.contorno[0], T.contorno[1]);
  const relleno = tw(e, T.relleno[0], T.relleno[1]);
  const cortes = tw(e, T.cortes[0], T.cortes[1]);
  const ondas = tw(e, T.ondas[0], T.ondas[1]);

  // Reposo
  const parpadeo = vivo && f % 75 >= 70 ? Math.sin(((f % 75) - 70) / 5 * Math.PI) : 0;
  const latido = vivo ? 0.5 + 0.5 * Math.sin(f / 6) : 1;
  const onda = vivo ? (f / 22) % 1 : null;

  const corte = (d: string, p: number, w = L.CORTE) => (
    <path key={d} d={d} fill="none" stroke="#000" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" {...dash(p, d)} />
  );
  const dedos = (lista: Dedo[], color: string, r: number) =>
    lista.map(([d, [x, y]]) => (
      <g key={d}>
        <path d={d} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" />
        <circle cx={x} cy={y} r={r} fill={color} />
      </g>
    ));

  return (
    <svg viewBox="0 0 740 754" width={size} height={(size * 754) / 740} style={{ overflow: "visible", filter: brillo > 0 ? `drop-shadow(0 0 ${size * 0.04 * brillo}px #2BFF88)` : undefined }}>
      <defs>
        <clipPath id={`${uid}c`}><path d={L.CUERPO} /></clipPath>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={800} height={800}>
          <rect x={-20} y={-20} width={800} height={800} fill="#fff" />
          {[...L.LOMO, ...L.CIRCUITOS, ...L.PR].map((d, i) => corte(d, Math.min(1, Math.max(0, cortes * 1.4 - i * 0.04))))}
          {corte(L.BOCA, cortes, 9)}
          {L.NODOS.map(([x, y, r]) => <circle key={`n${x}`} cx={x} cy={y} r={r * pop(T.nodos)} fill="#000" />)}
          <circle cx={L.OJO[0]} cy={L.OJO[1]} r={(L.OJO[2] + 12) * pop(T.ojo)} fill="#000" />
          <circle cx={L.FOSA[0]} cy={L.FOSA[1]} r={L.FOSA[2] * relleno} fill="#000" />
          <path d={L.MUSLO} fill="none" stroke="#000" strokeWidth={L.CORTE * 2 * pop(T.patas)} />
          <path d={L.BRAZO} fill="none" stroke="#000" strokeWidth={(58 + L.CORTE * 2) * pop(T.brazo)} strokeLinecap="round" />
          <circle cx={416} cy={462} r={(34 + L.CORTE) * pop(T.brazo)} fill="#000" />
        </mask>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={800} height={800}>
          <rect x={-20} y={-20} width={800} height={800} fill="#fff" />
          {corte("M84 566 C140 534 236 530 304 556", cortes)}
          {corte("M118 604 C170 590 230 590 270 604", cortes, 9)}
        </mask>
      </defs>

      {/* Contorno que se traza antes de rellenarse */}
      {relleno < 1 && (
        <path d={L.CUERPO} fill="none" stroke="#2BFF88" strokeWidth={6} strokeLinejoin="round" opacity={1 - relleno} {...dash(contorno, L.CUERPO)} />
      )}

      <g mask={`url(#${uid}m)`} opacity={relleno}>
        <path d={L.CUERPO} fill={L.VERDE} />
        <path d={L.LIMITE_AZUL} fill={L.AZUL} clipPath={`url(#${uid}c)`} />
        <circle cx={40} cy={418} r={38} fill={L.AZUL} />
      </g>

      <g>
        {L.NODOS.map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={(r - 5) * pop(T.nodos)} fill="none" stroke={y < 300 ? L.VERDE : L.AZUL} strokeWidth={5} />
        ))}
      </g>

      {/* Ojo */}
      <g transform={esc(pop(T.ojo), L.OJO[0], L.OJO[1])}>
        <g transform={`translate(0 ${L.OJO[1]}) scale(1 ${1 - parpadeo * 0.9}) translate(0 ${-L.OJO[1]})`}>
          <circle cx={L.OJO[0]} cy={L.OJO[1]} r={L.OJO[2]} fill={L.AZUL} />
          <circle cx={L.OJO[0] + 12} cy={L.OJO[1] - 12} r={10} fill="#fff" />
        </g>
      </g>

      {/* Pata trasera: crece desde la cadera */}
      <g transform={esc(pop(T.patas), 190, 520)}>
        <path d={L.MUSLO} fill={L.VERDE} mask={`url(#${uid}k)`} />
        <path d="M150 690 C160 660 200 662 230 676" fill="none" stroke={L.AZUL} strokeWidth={44} strokeLinecap="round" />
        {dedos(L.PIE_DEDOS as Dedo[], L.AZUL, 17)}
      </g>

      {/* Brazo y manos: crecen desde el hombro */}
      <g transform={esc(pop(T.brazo), 470, 360)}>
        <path d={L.BRAZO} fill="none" stroke={L.VERDE} strokeWidth={58} strokeLinecap="round" />
        <circle cx={416} cy={462} r={34} fill={L.AZUL} />
        {dedos(L.MANO_AZUL_DEDOS as Dedo[], L.AZUL, 17)}
        {dedos(L.MANO_VERDE_DEDOS as Dedo[], L.VERDE, 16)}
      </g>

      {/* Puntos rojos: la chispa de la IA (laten en reposo) */}
      <g>
        {L.ROJOS.map(([x, y, r], i) => {
          const s = pop(T.rojos + i * 3, 14) * (vivo ? 0.85 + 0.25 * Math.max(0, Math.sin(f / 5 + i * 2)) : 1);
          return (
            <g key={x}>
              {vivo && <circle cx={x} cy={y} r={r * (1.6 + latido)} fill={L.ROJO} opacity={0.18 * latido} />}
              <circle cx={x} cy={y} r={r * s} fill={L.ROJO} />
            </g>
          );
        })}
      </g>

      {/* Voz: ondas (se dibujan y después laten hacia afuera) */}
      <g>
        {(L.ONDAS as [string, number][]).map(([d, i]) => {
          const p = Math.min(1, Math.max(0, ondas * 1.5 - i * 0.25));
          const pulso = onda === null ? 0 : ((onda + i / 3) % 1);
          return (
            <path key={d} d={d} fill="none" stroke={L.AZUL} strokeWidth={7} strokeLinecap="round" {...dash(p, d)}
              opacity={(1 - i * 0.2) * (onda === null ? 1 : 0.55 + 0.45 * Math.sin(pulso * Math.PI))}
              transform={onda === null ? undefined : `translate(0 ${-pulso * 10})`} />
          );
        })}
        <circle cx={668} cy={50} r={7 * pop(T.ondas[1] - 4)} fill={L.ROJO} />
        {L.ONDAS_BOCA.map((d, i) => (
          <path key={d} d={d} fill="none" stroke={L.AZUL} strokeWidth={7} strokeLinecap="round" {...dash(Math.min(1, Math.max(0, ondas * 1.4 - i * 0.2)), d)}
            transform={onda === null ? undefined : `translate(${((onda + i * 0.5) % 1) * 12} 0)`} />
        ))}
      </g>

      {/* Ecualizador: las barras bailan con la voz */}
      <g>
        {(L.ECUALIZADOR as [number, number, number][]).map(([x, y, h], i) => {
          const base = h * 0.5 * Math.min(1, Math.max(0, ondas * 1.6 - i * 0.08));
          const baile = vivo ? 0.45 + 0.55 * Math.abs(Math.sin(f / 3.2 + i * 1.3)) : 1;
          return <path key={i} d={`M${x} ${y} L${x} ${y - Math.max(0.1, base * baile)}`} fill="none" stroke={L.AZUL} strokeWidth={7} strokeLinecap="round" />;
        })}
        <circle cx={300} cy={150} r={6 * pop(T.ondas[0] + 6)} fill={L.ROJO} />
        <circle cx={460} cy={60} r={6 * pop(T.ondas[0] + 10)} fill={L.ROJO} />
      </g>
    </svg>
  );
};
