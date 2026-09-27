// Un anuncio de la fábrica: fondo vivo continuo + escenas en secuencia + transiciones que tapan
// los cortes + grano + música de la marca. El gancho entra en el frame 0 con un golpe (sin intro).
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Barrido, Destello, Fondo, Grano } from "../kit/fx";
import { EscenaFabrica, Sfx, TemaCtx } from "./escenas";
import { TEMAS } from "./temas";
import type { Anuncio as TAnuncio } from "./tipos";

export const duracionDe = (a: TAnuncio) => a.escenas.reduce((s, e) => s + e.dur, 0);

export const Anuncio: React.FC<{ anuncio: TAnuncio }> = ({ anuncio }) => {
  const tema = TEMAS[anuncio.marca];
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
      <AbsoluteFill style={{ background: tema.fondo }}>
        <Fondo color={tema.fondo} brillo={tema.brillo} brillo2={tema.brillo2} grid={tema.borde} intensidad={0.9} />
        {escenas}
        {cortes.map((c, i) =>
          i % 2 === 0 ? (
            <Barrido key={c} centro={c} dur={12} colores={[tema.acento2, tema.acento, tema.fondo]} angulo={i % 4 === 0 ? -12 : 12} />
          ) : (
            <Destello key={c} en={c} color={tema.acento} max={0.22} dur={6} />
          ),
        )}
        <Grano />
        <Audio src={staticFile(tema.musica)} volume={(f) => interpolate(f, [0, 2, durationInFrames - 14, durationInFrames], [0.9, 0.55, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        <Sfx src="boom.mp3" en={0} vol={0.55} />
        {cortes.map((c) => <Sfx key={c} src="whoosh.mp3" en={c - 5} vol={0.4} />)}
      </AbsoluteFill>
    </TemaCtx.Provider>
  );
};
