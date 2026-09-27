import React from "react";
import { Composition } from "remotion";
import { AibRecepcionista, DURACION as DUR_AIB } from "./videos/AibRecepcionista";
import { Anuncio, duracionDe } from "./fabrica/Anuncio";
import { ANUNCIOS } from "./fabrica/anuncios";

// Un <Composition> por video. id = nombre para `npm run render -- <id> out/<archivo>.mp4`.
export const Root: React.FC = () => (
  <>
    {/* Anuncio (de usted) y orgánico (tuteo) */}
    <Composition id="AibRecepcionista" component={AibRecepcionista} defaultProps={{ registro: "usted" as const }} durationInFrames={DUR_AIB} fps={30} width={1920} height={1080} />
    <Composition id="AibRecepcionistaTu" component={AibRecepcionista} defaultProps={{ registro: "tu" as const }} durationInFrames={DUR_AIB} fps={30} width={1920} height={1080} />
    {/* Fábrica de anuncios: una composición por guion (id = nombre del archivo) */}
    {ANUNCIOS.map((a) => (
      <Composition key={a.id} id={a.id} component={Anuncio} defaultProps={{ anuncio: a }} durationInFrames={duracionDe(a)} fps={30}
        width={a.formato === "16:9" ? 1920 : 1080} height={a.formato === "9:16" ? 1920 : 1080} />
    ))}
  </>
);
