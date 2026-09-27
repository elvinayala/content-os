import React from "react";
import { Composition } from "remotion";
import { AibRecepcionista, DURACION as DUR_AIB } from "./videos/AibRecepcionista";

// Un <Composition> por video. id = nombre para `npm run render -- <id> out/<archivo>.mp4`.
export const Root: React.FC = () => (
  <>
    {/* Anuncio (de usted) y orgánico (tuteo) */}
    <Composition id="AibRecepcionista" component={AibRecepcionista} defaultProps={{ registro: "usted" as const }} durationInFrames={DUR_AIB} fps={30} width={1920} height={1080} />
    <Composition id="AibRecepcionistaTu" component={AibRecepcionista} defaultProps={{ registro: "tu" as const }} durationInFrames={DUR_AIB} fps={30} width={1920} height={1080} />
  </>
);
