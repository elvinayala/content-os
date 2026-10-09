// Un anuncio de la fábrica: fondo vivo continuo + escenas en secuencia + transiciones que tapan
// los cortes + grano + música de la marca. El gancho entra en el frame 0 con un golpe (sin intro).
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grano } from "../kit/fx";
import { EstiloCtx, FondoEstilo, Transicion, resolverEstilo } from "./estilos";
import { EscenaFabrica, Sfx, TemaCtx } from "./escenas";
import { TEMAS } from "./temas";
import { temaCliente } from "./cliente";
import type { Anuncio as TAnuncio } from "./tipos";

export const duracionDe = (a: TAnuncio) => a.escenas.reduce((s, e) => s + e.dur, 0);

/** ¿El fondo de la marca es claro? (hex #rrggbb) — para suavizar la viñeta. */
const fondoClaro = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) >= 384;
};

/** Toma de video a pantalla completa con velo de la marca (para que el texto se lea encima). */
const Toma: React.FC<{ archivo: string; dur: number; velo: number; fondo: string; brillo: string }> = ({ archivo, dur, velo, fondo, brillo }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, dur - 8, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const escala = interpolate(f, [0, dur], [1.08, 1]);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <OffthreadVideo src={staticFile(archivo)} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${escala})` }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${fondo}${Math.round(velo * 200).toString(16).padStart(2, "0")} 0%, ${fondo}${Math.round(velo * 255).toString(16).padStart(2, "0")} 55%, ${fondo} 100%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 50% 45%, ${brillo}33, transparent 70%)`, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

export const Anuncio: React.FC<{ anuncio: TAnuncio }> = ({ anuncio }) => {
  const tema = React.useMemo(() => (anuncio.cliente ? temaCliente(anuncio.cliente) : TEMAS[anuncio.marca]), [anuncio]);
  const estilo = React.useMemo(() => resolverEstilo(anuncio.estilo, anuncio.id), [anuncio.estilo, anuncio.id]);
  const { durationInFrames } = useVideoConfig();
  let t = 0;
  const cortes: number[] = [];
  const escenas = anuncio.escenas.map((e, i) => {
    const desde = t;
    t += e.dur;
    if (i > 0) cortes.push(desde);
    return (
      <Sequence key={i} from={desde} durationInFrames={e.dur}>
        <EscenaFabrica escena={e} />
      </Sequence>
    );
  });
  return (
    <TemaCtx.Provider value={tema}>
    <EstiloCtx.Provider value={estilo}>
      <AbsoluteFill style={{ background: tema.fondo }}>
        <FondoEstilo tema={tema} estilo={estilo} />
        {tema.Motivo && <tema.Motivo />}
        {(anuncio.tomas ?? []).map((t, i) => (
          <Sequence key={`toma${i}`} from={t.desde} durationInFrames={t.dur}>
            <Toma archivo={t.archivo} dur={t.dur} velo={t.velo ?? 0.55} fondo={tema.fondo} brillo={tema.acento} />
          </Sequence>
        ))}
        {escenas}
        {cortes.map((c, i) => <Transicion key={c} c={c} i={i} tema={tema} estilo={estilo} barridoSiempre={anuncio.barridoSiempre} />)}
        <Grano vineta={fondoClaro(tema.fondo) ? 0.1 : 0.55} />
        <Audio src={staticFile(anuncio.musica ?? tema.musica)} volume={(f) => interpolate(f, [0, 2, durationInFrames - 14, durationInFrames], [0.9, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        <Sfx src="boom.mp3" en={0} vol={0.55} />
        {cortes.map((c) => <Sfx key={c} src="whoosh.mp3" en={c - 5} vol={0.4} />)}
      </AbsoluteFill>
    </EstiloCtx.Provider>
    </TemaCtx.Provider>
  );
};
