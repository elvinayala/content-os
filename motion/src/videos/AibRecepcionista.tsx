// AI Borinquen · Recepcionista AI — showreel de 15 s (1920×1080, 30 fps).
// Escenas (frames globales):
//   1  0–66    El problema: teléfono sonando de madrugada, llamadas perdidas.
//   2  60–140  El coquí: la hoja se dibuja, aterriza, infla el saco y canta.
//   3  136–245 "Tu nueva recepcionista" + lo que hace.
//   4  240–365 La prueba: llamada contestada · WhatsApp agendando · calendario lleno · 0 perdidas.
//   5  358–450 Lockup AI Borinquen · Recepcionista AI + CTA a la demo.
import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, Audio } from "remotion";
import { C, FUENTE, FUENTE_MONO, GRADIENTE } from "../marcas/bori";
import { Coqui } from "../marcas/Coqui";
import { Barrido, Destello, Fondo, Grano, glitch, golpe, rebote, sacudida, tw } from "../kit/fx";
import { Chip, Palabras } from "../kit/texto";
import { Calendario, Chat, Contador, Llamada, Notificacion, Telefono, type Tema } from "../kit/ui";
import { PISTA, SFX } from "./AibRecepcionista.audio";

export const DURACION = 450;

// Registro: los ANUNCIOS de AI Borinquen van DE USTED (vault/estilo/ai-borinquen.md); tuteo = orgánico.
export type Registro = "usted" | "tu";
const TEXTOS = {
  usted: {
    presenta: "Su nueva", duerme: "Mientras usted duerme, ella trabaja.", contesto: "Contestó su recepcionista AI",
    agenda: "03 · LLENA SU AGENDA", opciones: "¡Claro! Tengo 10:00 AM o 2:30 PM. ¿Cuál le funciona?", listo: "Listo ✅ Le separé mañana, 10:00 AM.",
    cta: "Agende su demo →",
  },
  tu: {
    presenta: "Tu nueva", duerme: "Mientras tú duermes, ella trabaja.", contesto: "Contestó tu recepcionista AI",
    agenda: "03 · LLENA TU AGENDA", opciones: "¡Claro! Tengo 10:00 AM o 2:30 PM. ¿Cuál te funciona?", listo: "Listo ✅ Te separé mañana, 10:00 AM.",
    cta: "Agenda tu demo →",
  },
};
type Textos = (typeof TEXTOS)["usted"];

const TEMA: Tema = {
  fuente: FUENTE, mono: FUENTE_MONO, fondo: C.fondo, superficie: C.superficie, borde: C.borde,
  texto: C.texto, gris: C.gris, acento: C.verde, acento2: C.teal, alarma: C.alarma,
};

/* ───────────── 1 · El problema ───────────── */
const Problema: React.FC = () => {
  const f = useCurrentFrame();
  const vibra = f < 50 ? Math.sin(f * 2.2) * (f % 18 < 10 ? 7 : 0) : 0;
  // Al final la cámara "se mete" en el teléfono (zoom-through hacia la escena 2).
  const zoom = interpolate(f, [48, 66], [1, 9], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: golpe });
  const aparece = tw(f, 0, 14);
  return (
    <AbsoluteFill>
      <Fondo color="#060D0A" brillo="#3a0d0d" brillo2={C.superficie} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "1320px 540px" }}>
        {/* Texto a la izquierda */}
        <div style={{ position: "absolute", left: 150, top: 330, width: 820 }}>
          <div style={{ fontFamily: FUENTE_MONO, color: C.alarma, fontSize: 26, letterSpacing: "0.2em", opacity: tw(f, 2, 12), marginBottom: 18 }}>
            ● 11:47 PM · CERRADO
          </div>
          <Palabras texto="Otra llamada" entra={4} tam={118} fuente={FUENTE} color={C.texto} alinear="left" />
          <Palabras texto="sin contestar." entra={10} tam={118} fuente={FUENTE} color={C.alarma} alinear="left" sombra={glitch(f, 30, 36, 14)} />
          <div style={{ fontFamily: FUENTE, color: C.gris, fontSize: 34, marginTop: 26, opacity: tw(f, 22, 34) }}>
            Y ese cliente ya está llamando a otro.
          </div>
        </div>
        {/* Teléfono */}
        <div style={{ position: "absolute", left: 1150, top: 120, transform: `translateX(${vibra}px) rotate(${vibra * 0.3}deg) translateY(${(1 - aparece) * 80}px)`, opacity: aparece }}>
          <Telefono ancho={340} tema={TEMA}>
            <div style={{ padding: "90px 18px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ fontFamily: FUENTE, color: C.texto, fontSize: 92, fontWeight: 600, letterSpacing: "-0.04em" }}>11:47</div>
              <div style={{ fontFamily: FUENTE, color: C.gris, fontSize: 20, marginTop: -10, marginBottom: 20 }}>martes, 14 de octubre</div>
              {[
                { en: 8, hora: "11:41 PM" },
                { en: 20, hora: "11:44 PM" },
                { en: 32, hora: "11:47 PM" },
              ].reverse().map((n, i) => (
                <Notificacion key={i} titulo="Llamada perdida" detalle="Cliente nuevo · 787" hora={n.hora} entra={n.en} tema={TEMA} color={C.alarma} ancho={304} />
              ))}
            </div>
          </Telefono>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 2 · Entra el coquí ───────────── */
const EntraCoqui: React.FC = () => {
  const f = useCurrentFrame();
  const hoja = tw(f, 4, 26);
  const cae = 28; // frame en que aterriza
  const caidaY = f < cae ? interpolate(f, [12, cae], [-260, 0], { extrapolateLeft: "clamp", easing: golpe }) : 0;
  const squash = f < cae ? 1.18 : 1 - 0.28 * Math.exp(-(f - cae) / 3) * Math.cos((f - cae) / 2.2);
  const parpadeo = f >= 40 && f < 46 ? Math.sin(((f - 40) / 6) * Math.PI) : 0;
  const saco = f < 50 ? 1 : 1 + 0.35 * Math.max(0, Math.sin(((f - 50) / 9) * Math.PI));
  const ondas = tw(f, 52, 66);
  const canto = f >= 54 ? ((f - 54) / 16) % 1 : null;
  const { x, y } = sacudida(f, cae, 22, 12);
  const escala = interpolate(f, [0, 80], [1.08, 1], { extrapolateRight: "clamp" });
  // Anillos que barren la pantalla cuando canta (y abren la escena 3)
  const anillos = [56, 64, 72];
  return (
    <AbsoluteFill>
      <Fondo color={C.fondo} brillo={C.superficie} brillo2="#0f3d2a" grid={C.borde} />
      {anillos.map((a, i) => {
        const p = tw(f, a, a + 22, 0, 1);
        if (p <= 0 || p >= 1) return null;
        return (
          <div key={i} style={{
            position: "absolute", left: 960 + 170, top: 540 - 230, width: p * 3400, height: p * 3400, borderRadius: "50%",
            border: `${14 - i * 4}px solid ${i === 1 ? C.teal : C.verdeClaro}`, transform: "translate(-50%,-50%)", opacity: 1 - p,
          }} />
        );
      })}
      <AbsoluteFill style={{ display: "grid", placeItems: "center", transform: `translate(${x}px, ${y}px) scale(${escala})` }}>
        <div style={{ filter: `drop-shadow(0 30px 60px rgba(0,0,0,0.5)) drop-shadow(0 0 ${30 + (saco - 1) * 120}px ${C.verde}55)` }}>
          <Coqui size={640} hoja={hoja} cuerpo={f >= 12 ? 1 : 0} caidaY={caidaY} squash={squash} parpadeo={parpadeo} saco={saco} ondas={ondas} canto={canto} />
        </div>
      </AbsoluteFill>
      <Destello en={cae} color={C.verdeClaro} max={0.35} />
    </AbsoluteFill>
  );
};

/* ───────────── 3 · Tu nueva recepcionista ───────────── */
const Presenta: React.FC<{ t: Textos }> = ({ t }) => {
  const f = useCurrentFrame();
  const salida = tw(f, 94, 106, 0, 1, golpe);
  const deriva = interpolate(f, [0, 110], [1.04, 1]);
  const coquiE = rebote(f, 18, 20);
  return (
    <AbsoluteFill>
      <Fondo color={C.fondo} brillo="#114a31" brillo2={C.teal} grid={C.borde} />
      <AbsoluteFill style={{ transform: `scale(${deriva}) translateY(${salida * -80}px)`, opacity: 1 - salida }}>
        <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center" }}>
          <div style={{ fontFamily: FUENTE_MONO, color: C.verdeClaro, fontSize: 28, letterSpacing: "0.3em", opacity: tw(f, 0, 10) }}>
            PRESENTAMOS
          </div>
        </div>
        <div style={{ position: "absolute", top: 280, left: 0, right: 0, padding: "0 120px" }}>
          <Palabras texto={t.presenta} entra={4} tam={170} fuente={FUENTE} color={C.texto} />
          <Palabras texto="recepcionista AI" entra={10} tam={170} fuente={FUENTE} gradiente={GRADIENTE} />
        </div>
        <div style={{ position: "absolute", top: 760, width: "100%", display: "flex", justifyContent: "center", gap: 28 }}>
          <Chip texto="Contesta 24/7" entra={34} fuente={FUENTE} fondo={C.superficie} borde={C.borde} color={C.texto} />
          <Chip texto="Agenda citas" entra={44} fuente={FUENTE} fondo={C.superficie} borde={C.borde} color={C.texto} />
          <Chip texto="Nunca se enferma" entra={54} fuente={FUENTE} fondo={C.superficie} borde={C.verde} color={C.verdeClaro} />
        </div>
        {/* El coquí se asoma en la esquina y canta */}
        <div style={{ position: "absolute", right: 70, bottom: 30, transform: `translateY(${(1 - coquiE) * 260}px) rotate(${(1 - coquiE) * 12}deg)` }}>
          <Coqui size={250} saco={1 + 0.3 * Math.max(0, Math.sin(f / 5))} canto={(f / 16) % 1} />
        </div>
      </AbsoluteFill>
      <Destello en={0} color={C.verdeClaro} max={0.5} dur={10} />
    </AbsoluteFill>
  );
};

/* ───────────── 4 · La prueba ───────────── */
const Panel: React.FC<{ x: number; entra: number; titulo: string; children: React.ReactNode; ancho?: number }> = ({ x, entra, titulo, children, ancho = 520 }) => {
  const f = useCurrentFrame();
  const e = rebote(f, entra, 20);
  return (
    <div style={{
      position: "absolute", left: x, top: 190, width: ancho, height: 700, borderRadius: 36,
      background: `linear-gradient(180deg, ${C.superficie}, #0a2016)`, border: `2px solid ${C.borde}`,
      boxShadow: "0 40px 100px rgba(0,0,0,0.45)", overflow: "hidden",
      transform: `translateY(${(1 - e) * 500}px) rotate(${(1 - e) * 6}deg)`, opacity: Math.min(1, e * 2),
    }}>
      <div style={{ padding: "22px 26px 0", fontFamily: FUENTE_MONO, color: C.verdeClaro, fontSize: 18, letterSpacing: "0.2em" }}>{titulo}</div>
      <div style={{ height: 640 }}>{children}</div>
    </div>
  );
};

const Prueba: React.FC<{ t: Textos }> = ({ t }) => {
  const f = useCurrentFrame();
  const deriva = interpolate(f, [0, 125], [1, 1.05]);
  const salida = tw(f, 112, 124, 0, 1, golpe);
  const contadorE = tw(f, 52, 64);
  return (
    <AbsoluteFill>
      <Fondo color={C.fondo} brillo="#0f3d2a" brillo2={C.teal} grid={C.borde} intensidad={0.8} />
      <AbsoluteFill style={{ transform: `scale(${deriva - salida * 0.15})`, opacity: 1 - salida }}>
        <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center" }}>
          <Palabras texto={t.duerme} entra={2} tam={64} fuente={FUENTE} color={C.texto} stagger={2} />
        </div>
        <Panel x={120} entra={6} titulo="01 · CONTESTA">
          <Llamada tema={TEMA} contesta={22} quien="Cliente nuevo" ancho={520} etiqueta={t.contesto} />
        </Panel>
        <Panel x={700} entra={12} titulo="02 · AGENDA">
          <Chat tema={TEMA} ancho={520} nombre="Recepcionista AI" avatar={<Coqui size={46} hoja={0} ondas={0} />}
            burbujas={[
              { de: "cliente", texto: "Hola, ¿tienen cita para mañana?", en: 22 },
              { de: "agente", texto: t.opciones, en: 44 },
              { de: "cliente", texto: "10 AM, perfecto", en: 60 },
              { de: "agente", texto: t.listo, en: 80 },
            ]} />
        </Panel>
        <Panel x={1280} entra={18} titulo={t.agenda}>
          <Calendario tema={TEMA} entra={30} ancho={520}
            citas={[
              { dia: 0, fila: 0, hora: "9:00" }, { dia: 2, fila: 1, hora: "10:30" }, { dia: 1, fila: 0, hora: "9:30" },
              { dia: 3, fila: 2, hora: "1:00" }, { dia: 4, fila: 0, hora: "8:30" }, { dia: 0, fila: 3, hora: "3:00" },
              { dia: 2, fila: 4, hora: "4:30" }, { dia: 1, fila: 2, hora: "12:00" }, { dia: 4, fila: 3, hora: "3:30" },
              { dia: 3, fila: 0, hora: "9:00" }, { dia: 0, fila: 1, hora: "10:00" }, { dia: 4, fila: 1, hora: "10:00" },
              { dia: 1, fila: 4, hora: "4:00" }, { dia: 3, fila: 3, hora: "2:30" },
            ]} />
          <div style={{ opacity: contadorE, transform: `translateY(${(1 - contadorE) * 30}px)`, marginTop: 6 }}>
            <Contador desde={37} hasta={0} entra={60} dur={36} tema={TEMA} etiqueta="LLAMADAS PERDIDAS" tam={120} />
          </div>
        </Panel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 5 · Lockup + CTA ───────────── */
const Cierre: React.FC<{ t: Textos }> = ({ t }) => {
  const f = useCurrentFrame();
  const coquiE = rebote(f, 2, 22);
  const saco = 1 + 0.32 * Math.max(0, Math.sin(((f - 24) / 8) * Math.PI)) * (f > 24 && f < 56 ? 1 : 0);
  const cta = rebote(f, 40, 18);
  const brillo = tw(f, 52, 76, -40, 140);
  const pulso = tw(f, 70, 92, 0, 1);
  const salida = tw(f, 84, 92, 0, 1);
  return (
    <AbsoluteFill>
      <Fondo color={C.fondo} brillo="#145a3a" brillo2={C.teal} grid={C.borde} />
      {/* pulso final */}
      <div style={{ position: "absolute", left: 960, top: 330, width: pulso * 2600, height: pulso * 2600, borderRadius: "50%", border: `6px solid ${C.verdeClaro}`, transform: "translate(-50%,-50%)", opacity: pulso > 0 ? 1 - pulso : 0 }} />
      <AbsoluteFill style={{ opacity: 1 - salida * 0.0 }}>
        <div style={{ position: "absolute", left: 960, top: 330, transform: `translate(-50%,-50%) scale(${0.3 + 0.7 * coquiE}) rotate(${(1 - coquiE) * -20}deg)` }}>
          <div style={{ filter: `drop-shadow(0 0 ${40 + (saco - 1) * 160}px ${C.verde}66)` }}>
            <Coqui size={380} saco={saco} canto={f > 24 ? ((f - 24) / 16) % 1 : null} />
          </div>
        </div>
        <div style={{ position: "absolute", top: 560, width: "100%" }}>
          <Palabras texto="AI Borinquen" entra={10} tam={120} fuente={FUENTE} color={C.texto} />
          <div style={{ marginTop: 8 }}>
            <Palabras texto="Recepcionista AI" entra={18} tam={64} fuente={FUENTE} peso={600} gradiente={GRADIENTE} espaciado={-0.01} />
          </div>
        </div>
        <div style={{ position: "absolute", top: 870, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{
            position: "relative", overflow: "hidden", padding: "22px 54px", borderRadius: 999, background: GRADIENTE,
            fontFamily: FUENTE, fontWeight: 800, fontSize: 44, color: "#04130B", letterSpacing: "-0.02em",
            transform: `scale(${cta})`, boxShadow: `0 20px 60px ${C.verde}55`,
          }}>
            {t.cta}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${brillo}%`, width: "25%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)", transform: "skewX(-20deg)" }} />
          </div>
        </div>
      </AbsoluteFill>
      <Destello en={0} color={C.verdeClaro} max={0.6} dur={10} />
    </AbsoluteFill>
  );
};

const Pista: React.FC<{ archivo: string; volumen: number }> = ({ archivo, volumen }) => (
  <Audio src={staticFile(archivo)} volume={(f) => interpolate(f, [0, 8, 420, 450], [0, volumen, volumen, 0], { extrapolateRight: "clamp" })} />
);

export const AibRecepcionista: React.FC<{ registro: Registro }> = ({ registro }) => {
  const t = TEXTOS[registro];
  return (
    <AbsoluteFill style={{ background: C.fondo }}>
      <Sequence durationInFrames={66}><Problema /></Sequence>
      <Sequence from={62} durationInFrames={80}><EntraCoqui /></Sequence>
      <Sequence from={138} durationInFrames={108}><Presenta t={t} /></Sequence>
      <Sequence from={242} durationInFrames={124}><Prueba t={t} /></Sequence>
      <Sequence from={358} durationInFrames={92}><Cierre t={t} /></Sequence>

      {/* Transiciones que tapan los cortes */}
      <Barrido centro={138} dur={14} colores={[C.teal, C.verde, C.fondo]} />
      <Barrido centro={242} dur={14} colores={[C.verdeClaro, C.verde, C.fondo]} angulo={12} />
      <Destello en={62} color={C.verdeClaro} max={0.5} dur={7} />
      <Destello en={358} color={C.verdeClaro} max={0.7} dur={8} />

      <Grano />

      {PISTA && <Sequence from={PISTA.desde}><Pista archivo={PISTA.archivo} volumen={PISTA.volumen} /></Sequence>}
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.en} durationInFrames={s.dur ?? 45}>
          <Audio src={staticFile(s.archivo)} volume={s.volumen} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
