import React from "react";
import { Composition } from "remotion";
import { AibRecepcionista, DURACION as DUR_AIB } from "./videos/AibRecepcionista";
import { Testimonio, type PropsTestimonio } from "./videos/Testimonio";
import { Anuncio, duracionDe } from "./fabrica/Anuncio";
import { ANUNCIOS } from "./fabrica/anuncios";

// Un <Composition> por video. id = nombre para `npm run render -- <id> out/<archivo>.mp4`.
export const Root: React.FC = () => (
  <>
    {/* Anuncio (de usted) y orgánico (tuteo) */}
    <Composition id="AibRecepcionista" component={AibRecepcionista} defaultProps={{ registro: "usted" as const }} durationInFrames={DUR_AIB} fps={30} width={1920} height={1080} />
    <Composition id="AibRecepcionistaTu" component={AibRecepcionista} defaultProps={{ registro: "tu" as const }} durationInFrames={DUR_AIB} fps={30} width={1920} height={1080} />
    {/* Testimonio con subtítulos: todo por --props (video, dur, nombre, rol, subtitulos, pregunta) */}
    <Composition id="Testimonio" component={Testimonio} fps={30} width={1920} height={1080} durationInFrames={300}
      defaultProps={{ video: "testimonios/ernest-corte.mp4", dur: 10, nombre: "Nombre", rol: "Cliente", subtitulos: [] } as PropsTestimonio}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.dur * 30) })} />
    <Composition id="TestimonioVertical" component={Testimonio} fps={30} width={1080} height={1920} durationInFrames={300}
      defaultProps={{ video: "testimonios/ernest-corte.mp4", dur: 10, nombre: "Nombre", rol: "Cliente", subtitulos: [], vertical: true } as PropsTestimonio}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.round(props.dur * 30) })} />
    {/* Fábrica de anuncios: una composición por guion (id = nombre del archivo) */}
    {ANUNCIOS.map((a) => (
      <Composition key={a.id} id={a.id} component={Anuncio} defaultProps={{ anuncio: a }} durationInFrames={duracionDe(a)} fps={30}
        width={a.formato === "16:9" ? 1920 : 1080} height={a.formato === "9:16" ? 1920 : 1080} />
    ))}
    {/* Composición universal: cualquier guion en JSON (inputProps.anuncio) — la usa Remi en la nube para Max y clientes. */}
    <Composition id="Motion" component={Anuncio} defaultProps={{ anuncio: ANUNCIOS[0] }} durationInFrames={duracionDe(ANUNCIOS[0])} fps={30} width={1920} height={1080}
      calculateMetadata={({ props }) => ({
        durationInFrames: duracionDe(props.anuncio),
        width: props.anuncio.formato === "16:9" ? 1920 : 1080,
        height: props.anuncio.formato === "9:16" ? 1920 : 1080,
      })} />
  </>
);
