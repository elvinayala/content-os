// Librería de escenas de la fábrica. Cada escena lee el tema de la marca (contexto) y el lienzo
// (vertical 1080×1920 u horizontal 1920×1080) y se acomoda sola. Los tiempos son frames locales.
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { noise2D } from "@remotion/noise";
import { golpe, rebote, suave, tw } from "../kit/fx";
import { Chat, Llamada, Notificacion, Telefono } from "../kit/ui";
import type { TemaMarca } from "./temas";
import type { Escena } from "./tipos";

export const TemaCtx = createContext<TemaMarca | null>(null);
const useTema = () => useContext(TemaCtx)!;
const useLienzo = () => {
  const { width, height } = useVideoConfig();
  const v = height > width;
  // Zona segura: en 9:16 la UI de Reels tapa ~250 px arriba y ~380 abajo.
  return { w: width, h: height, v, pad: v ? 80 : 120, top: v ? 250 : 90, bottom: v ? 380 : 90 };
};

export const Sfx: React.FC<{ src: string; en?: number; vol?: number }> = ({ src, en = 0, vol = 0.5 }) => (
  <Sequence from={en} durationInFrames={60} layout="none">
    <Audio src={staticFile(`audio/${src}`)} volume={vol} />
  </Sequence>
);

/* ───────── Titular: palabras que suben por máscara; *palabra* = resaltada ───────── */
export const Titular: React.FC<{
  texto: string; entra: number; tam: number; stagger?: number; alinear?: "center" | "left";
  color?: string; acento?: string; peso?: number; sale?: number;
}> = ({ texto, entra, tam, stagger = 2.5, alinear = "center", color, acento, peso = 800, sale }) => {
  const f = useCurrentFrame();
  const t = useTema();
  // *frase de varias palabras* también se resalta: se lleva el estado entre palabras.
  let dentro = false;
  const palabras = texto.split(" ").filter(Boolean).map((p) => {
    const abre = p.startsWith("*");
    const cierra = /\*[.,!?:;…]*$/.test(p);
    const marcada = dentro || abre;
    if (abre && !cierra) dentro = true;
    if (cierra) dentro = false;
    return { limpio: p.replace(/\*/g, ""), marcada };
  });
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", justifyContent: alinear === "center" ? "center" : "flex-start",
      gap: `0 ${tam * 0.24}px`, fontFamily: t.fuente, fontWeight: peso, fontSize: tam, lineHeight: 1.05, letterSpacing: "-0.035em",
    }}>
      {/* Sin viudas: las dos últimas palabras viajan juntas (nunca una sola palabra en la última línea). */}
      {palabras.map(({ limpio, marcada }, i) => {
        if (palabras.length >= 3 && i === palabras.length - 1) return null;
        const pegada = palabras.length >= 3 && i === palabras.length - 2 ? palabras[i + 1] : null;
        const e = tw(f, entra + i * stagger, entra + i * stagger + 12);
        const s = sale !== undefined ? tw(f, sale + i, sale + i + 8, 0, 1, golpe) : 0;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: tam * 0.14, marginBottom: -tam * 0.14 }}>
            <span style={{
              display: "inline-block", transform: `translateY(${(1 - e) * 110 - s * 110}%) rotate(${(1 - e) * 5}deg)`, transformOrigin: "left bottom",
              color: marcada ? acento ?? t.acento : color ?? t.texto,
              textShadow: marcada ? `0 0 ${tam * 0.35}px ${(acento ?? t.acento)}55` : undefined,
            }}>{limpio}</span>
            {pegada && (
              <span style={{
                display: "inline-block", marginLeft: tam * 0.24, transform: `translateY(${(1 - tw(f, entra + (i + 1) * stagger, entra + (i + 1) * stagger + 12)) * 110 - s * 110}%)`,
                color: pegada.marcada ? acento ?? t.acento : color ?? t.texto,
                textShadow: pegada.marcada ? `0 0 ${tam * 0.35}px ${(acento ?? t.acento)}55` : undefined,
              }}>{pegada.limpio}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

const Etiqueta: React.FC<{ texto: string; entra?: number; color?: string }> = ({ texto, entra = 0, color }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v } = useLienzo();
  const e = tw(f, entra, entra + 10);
  return (
    <div style={{ fontFamily: t.mono, fontSize: v ? 30 : 26, letterSpacing: "0.22em", color: color ?? t.acento, opacity: e, transform: `translateY(${(1 - e) * 16}px)`, textTransform: "uppercase" }}>
      {texto}
    </div>
  );
};

/** Nota legal/aclaración chiquita abajo (p. ej. "Resultados de clientes reales; cada negocio es distinto."). */
const Nota: React.FC<{ texto?: string; entra?: number }> = ({ texto, entra = 10 }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, bottom } = useLienzo();
  if (!texto) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: bottom - (v ? 60 : 40), textAlign: "center", fontFamily: t.fuente, fontSize: v ? 24 : 20, color: t.gris, opacity: 0.8 * tw(f, entra, entra + 10) }}>
      {texto}
    </div>
  );
};

/** Contenedor que respeta la zona segura y trae la deriva de cámara. */
const Marco: React.FC<{ children: React.ReactNode; dur: number; centrado?: boolean; gap?: number }> = ({ children, dur, centrado = true, gap = 40 }) => {
  const f = useCurrentFrame();
  const { pad, top, bottom } = useLienzo();
  const escala = interpolate(f, [0, dur], [1.035, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{
      padding: `${top}px ${pad}px ${bottom}px`, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: centrado ? "center" : "flex-start", gap, transform: `scale(${escala})`,
    }}>
      {children}
    </AbsoluteFill>
  );
};

/** Tamaño de letra que entra en el ancho disponible según el largo de la línea más larga. */
const ajustar = (lineas: string[], ancho: number, base: number, envolver = lineas.length === 1 ? 3 : 1) => {
  const limpias = lineas.map((l) => l.replace(/\*/g, ""));
  const largo = Math.max(...limpias.map((l) => l.length));
  const palabra = Math.max(...limpias.flatMap((l) => l.split(" ").map((p) => p.length)));
  const enUna = ancho / (largo * 0.52);
  // Una sola frase larga puede partirse hasta en 3 líneas en vez de achicarse hasta ser ilegible.
  const envuelta = envolver > 1 ? Math.min((ancho * envolver * 0.8) / (largo * 0.52), ancho / (palabra * 0.62)) : 0;
  return Math.min(base, Math.max(enUna, envuelta));
};

/* ═════════════════ Escenas ═════════════════ */

const Gancho: React.FC<Extract<Escena, { tipo: "gancho" }>> = ({ lineas, sub, alarma, etiqueta, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { w, pad, v } = useLienzo();
  const tam = ajustar(lineas, w - pad * 2, v ? 150 : 150, v ? 2 : lineas.length === 1 ? 3 : 1); // en vertical cada línea puede partirse en dos
  const golpeCam = 1 + 0.06 * Math.exp(-f / 4);
  const acento = alarma ? t.alarma : undefined;
  return (
    <Marco dur={dur} gap={v ? 34 : 28}>
      <div style={{ transform: `scale(${golpeCam})`, display: "flex", flexDirection: "column", alignItems: "center", gap: v ? 34 : 26 }}>
        {etiqueta && <Etiqueta texto={etiqueta} color={acento} />}
        {lineas.map((l, i) => (
          <Titular key={i} texto={l} entra={i * 7} tam={tam} acento={acento} />
        ))}
        {sub && (
          <div style={{ marginTop: 10, maxWidth: w - pad * 2 }}>
            <Titular texto={sub} entra={lineas.length * 7 + 8} tam={tam * 0.36} peso={500} color={t.gris} stagger={1.2} />
          </div>
        )}
      </div>
    </Marco>
  );
};

const Numero: React.FC<Extract<Escena, { tipo: "numero" }>> = ({ etiqueta, desde, hasta, prefijo = "", sufijo = "", antes, quien, nota, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { w, v, pad } = useLienzo();
  const fin = Math.round(dur * 0.62);
  const p = tw(f, 8, fin, 0, 1, suave);
  const valor = Math.round(desde + (hasta - desde) * p);
  const llego = f >= fin;
  const pop = llego ? 1 + (1 - rebote(f, fin, 14)) * 0.18 : 1;
  const ancho = w - pad * 2;
  const alto = v ? 420 : 300;
  const curva = `M0 ${alto} C${ancho * 0.25} ${alto * 0.92}, ${ancho * 0.45} ${alto * 0.75}, ${ancho * 0.6} ${alto * 0.55} S${ancho * 0.85} ${alto * 0.12}, ${ancho} 0`;
  const trazo = evolvePath(p, curva);
  return (
    <Marco dur={dur} gap={v ? 30 : 18}>
      <Etiqueta texto={etiqueta} />
      {quien && <div style={{ fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 44 : 38, color: t.texto, opacity: tw(f, 2, 12) }}>{quien}</div>}
      {antes && <div style={{ fontFamily: t.mono, fontSize: v ? 34 : 28, color: t.gris, opacity: tw(f, 4, 14), textDecoration: llego ? "line-through" : "none" }}>{antes}</div>}
      <div style={{
        fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 230 : 220, lineHeight: 1, letterSpacing: "-0.05em", color: llego ? t.acento : t.texto,
        transform: `scale(${pop})`, textShadow: llego ? `0 0 80px ${t.acento}66` : "none", fontVariantNumeric: "tabular-nums",
      }}>
        {prefijo}{valor}{sufijo && <span style={{ fontSize: "0.34em", letterSpacing: "-0.02em", marginLeft: 12 }}>{sufijo}</span>}
      </div>
      <svg width={ancho} height={alto} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.acento} stopOpacity={0.35} />
            <stop offset="1" stopColor={t.acento} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((y) => <line key={y} x1={0} x2={ancho} y1={alto * y} y2={alto * y} stroke={t.borde} strokeDasharray="6 10" />)}
        <path d={`${curva} L${ancho} ${alto} L0 ${alto} Z`} fill="url(#area)" opacity={p} />
        <path d={curva} fill="none" stroke={t.acento} strokeWidth={8} strokeLinecap="round" strokeDasharray={trazo.strokeDasharray} strokeDashoffset={trazo.strokeDashoffset} style={{ filter: `drop-shadow(0 0 14px ${t.acento})` }} />
      </svg>
      <Nota texto={nota} />
      <Sfx src="riser.mp3" en={Math.max(0, fin - 26)} vol={0.4} />
      <Sfx src="caching.mp3" en={fin} vol={0.55} />
    </Marco>
  );
};

const Notificaciones: React.FC<Extract<Escena, { tipo: "notificaciones" }>> = ({ lineas, hora, items, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const vibra = f < dur - 10 ? Math.sin(f * 2.2) * (f % 18 < 10 ? 6 : 0) : 0;
  const ancho = v ? 480 : 400;
  const texto = (
    <div style={{ flex: v ? "none" : 1, display: "flex", flexDirection: "column", gap: 18, alignItems: v ? "center" : "flex-start" }}>
      {lineas.map((l, i) => <Titular key={i} texto={l} entra={i * 6} tam={ajustar(lineas, v ? w - pad * 2 : 900, v ? 104 : 116)} alinear={v ? "center" : "left"} acento={t.alarma} />)}
    </div>
  );
  const tel = (
    <div style={{ transform: `translateX(${vibra}px) rotate(${vibra * 0.3}deg) translateY(${(1 - tw(f, 0, 14)) * 80}px)`, opacity: tw(f, 0, 10) }}>
      <Telefono ancho={ancho} tema={t}>
        <div style={{ padding: `${ancho * 0.26}px ${ancho * 0.05}px 0`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: t.fuente, color: t.texto, fontSize: ancho * 0.27, fontWeight: 600, letterSpacing: "-0.04em" }}>{hora}</div>
          <div style={{ height: 20 }} />
          {items.map((n, i) => (
            <Notificacion key={i} titulo={n.titulo} detalle={n.detalle} hora={n.hora} entra={6 + i * 10} tema={t} color={t.alarma} ancho={ancho * 0.9} />
          )).reverse()}
        </div>
      </Telefono>
    </div>
  );
  return (
    <AbsoluteFill style={{ padding: v ? "230px 80px 300px" : "90px 140px", display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", justifyContent: "center", gap: v ? 50 : 100 }}>
      {texto}
      <div style={{ transform: v ? "scale(0.82)" : "none", transformOrigin: "top center", height: v ? ancho * 2.05 * 0.82 : undefined }}>{tel}</div>
      {items.map((_, i) => <Sfx key={i} src="ding.mp3" en={6 + i * 10} vol={0.4} />)}
      <Sfx src="vibra.mp3" en={0} vol={0.35} />
    </AbsoluteFill>
  );
};

const Comparativa: React.FC<Extract<Escena, { tipo: "comparativa" }>> = ({ titulo, filas, nota, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const ancho = Math.min(w - pad * 2, 1400);
  return (
    <Marco dur={dur} gap={v ? 60 : 44}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], ancho, v ? 88 : 84)} />
      <div style={{ width: ancho, display: "flex", flexDirection: "column", gap: v ? 34 : 24 }}>
        {filas.map((r, i) => {
          const en = 10 + i * 9;
          const e = tw(f, en, en + 18);
          const tuyo = !!r.tuyo;
          const color = tuyo ? t.acento : t.gris;
          return (
            <div key={i} style={{ opacity: tw(f, en, en + 8), transform: `translateX(${(1 - tw(f, en, en + 12)) * -60}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: t.fuente, marginBottom: 10 }}>
                <span style={{ fontSize: v ? 44 : 38, fontWeight: tuyo ? 800 : 600, color: tuyo ? t.texto : t.gris }}>{r.nombre}</span>
                <span style={{ fontSize: v ? 50 : 44, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{r.precio}</span>
              </div>
              <div style={{ height: v ? 34 : 28, borderRadius: 99, background: t.superficie, border: `1px solid ${t.borde}`, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(4, r.barra * 100 * e)}%`, height: "100%", borderRadius: 99,
                  background: tuyo ? t.gradiente : `linear-gradient(90deg, ${t.alarma}aa, ${t.alarma})`, boxShadow: tuyo ? `0 0 30px ${t.acento}88` : "none",
                }} />
              </div>
              {r.detalle && <div style={{ fontFamily: t.fuente, fontSize: v ? 28 : 24, color: t.gris, marginTop: 8 }}>{r.detalle}</div>}
            </div>
          );
        })}
      </div>
      {nota && <div style={{ fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 40 : 36, color: t.acento, opacity: tw(f, 10 + filas.length * 9 + 10, 10 + filas.length * 9 + 20) }}>{nota}</div>}
      {filas.map((_, i) => <Sfx key={i} src="pop.mp3" en={10 + i * 9} vol={0.35} />)}
    </Marco>
  );
};

const Pasos: React.FC<Extract<Escena, { tipo: "pasos" }>> = ({ titulo, pasos, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const cols = v ? 1 : pasos.length <= 3 ? pasos.length : 3;
  const paso = Math.min(9, (dur * 0.6) / pasos.length);
  return (
    <Marco dur={dur} gap={v ? 50 : 50}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], w - pad * 2, v ? 100 : 86)} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: v ? 22 : 26, width: Math.min(w - pad * 2, 1500) }}>
        {pasos.map((p, i) => {
          const en = 8 + i * paso;
          const e = rebote(f, en, 16);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 24, padding: v ? "22px 28px" : "26px 30px", borderRadius: 26,
              background: t.superficie, border: `2px solid ${t.borde}`, transform: `scale(${0.7 + 0.3 * e})`, opacity: Math.min(1, e * 1.4),
            }}>
              <div style={{
                width: v ? 70 : 64, height: v ? 70 : 64, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center",
                background: t.gradiente, color: t.textoCta, fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 36 : 32,
              }}>{i + 1}</div>
              <div style={{ fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 50 : 36, color: t.texto, lineHeight: 1.15 }}>{p}</div>
            </div>
          );
        })}
      </div>
      {pasos.map((_, i) => <Sfx key={i} src="pop.mp3" en={Math.round(8 + i * paso)} vol={0.3} />)}
    </Marco>
  );
};

const ChatEsc: React.FC<Extract<Escena, { tipo: "chat" }>> = ({ titulo, nombre, burbujas, hora, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const ancho = v ? 560 : 520;
  const Logo = t.Logo;
  return (
    <AbsoluteFill style={{ padding: v ? "240px 80px 320px" : "90px 140px", display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", justifyContent: "center", gap: v ? 44 : 110 }}>
      <div style={{ flex: v ? "none" : 1, display: "flex", flexDirection: "column", gap: 18, alignItems: v ? "center" : "flex-start" }}>
        {hora && <Etiqueta texto={hora} />}
        <Titular texto={titulo} entra={0} tam={ajustar([titulo], v ? w - pad * 2 : 760, v ? 84 : 96) * (v ? 1 : 1)} alinear={v ? "center" : "left"} />
      </div>
      <div style={{
        width: ancho, height: v ? 860 : 820, borderRadius: 44, zoom: v ? 1.3 : 1.1, background: t.fondo, border: `2px solid ${t.borde}`, overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.5)", transform: `translateY(${(1 - tw(f, 0, 14)) * 120}px)`, opacity: tw(f, 0, 10),
      }}>
        <Chat tema={t} ancho={ancho} nombre={nombre} avatar={<Logo size={40} />} burbujas={burbujas} />
      </div>
      {burbujas.map((b, i) => <Sfx key={i} src="pop.mp3" en={b.en} vol={0.35} />)}
      <div style={{ display: "none" }}>{dur}</div>
    </AbsoluteFill>
  );
};

const LlamadaEsc: React.FC<Extract<Escena, { tipo: "llamada" }>> = ({ titulo, quien, etiqueta, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const ancho = v ? 620 : 560;
  return (
    <AbsoluteFill style={{ padding: v ? "240px 80px 320px" : "90px 140px", display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", justifyContent: "center", gap: v ? 50 : 110 }}>
      <div style={{ flex: v ? "none" : 1 }}>
        <Titular texto={titulo} entra={0} tam={ajustar([titulo], v ? w - pad * 2 : 760, v ? 84 : 96)} alinear={v ? "center" : "left"} />
      </div>
      <div style={{
        width: ancho, padding: "40px 0 50px", borderRadius: 44, zoom: v ? 1.25 : 1.1, background: `linear-gradient(180deg, ${t.superficie}, ${t.fondo})`, border: `2px solid ${t.borde}`,
        transform: `translateY(${(1 - tw(f, 0, 14)) * 120}px)`, opacity: tw(f, 0, 10), display: "flex", justifyContent: "center",
      }}>
        <Llamada tema={t} contesta={22} quien={quien} ancho={ancho} etiqueta={etiqueta} />
      </div>
      <Sfx src="vibra.mp3" en={0} vol={0.35} />
      <Sfx src="contesta.mp3" en={22} vol={0.5} />
      <div style={{ display: "none" }}>{dur}</div>
    </AbsoluteFill>
  );
};

const Flyers: React.FC<Extract<Escena, { tipo: "flyers" }>> = ({ titulo, prompt, piezas, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const escrito = Math.floor(tw(f, 4, 4 + prompt.length * 0.9, 0, prompt.length, (x) => x));
  const click = Math.round(8 + prompt.length * 0.9);
  const cols = v ? 2 : 3;
  const ancho = Math.min(w - pad * 2, v ? 920 : 1300);
  const card = (ancho - (cols - 1) * 22) / cols;
  const fondos = [t.gradiente, `linear-gradient(160deg, ${t.superficie}, ${t.borde})`, `linear-gradient(200deg, ${t.acento2}, ${t.fondo})`, `linear-gradient(135deg, ${t.fondo}, ${t.acento})`];
  return (
    <Marco dur={dur} gap={v ? 40 : 30}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], ancho, v ? 80 : 76)} />
      <div style={{
        width: ancho, padding: v ? "26px 30px" : "20px 26px", borderRadius: 24, background: t.superficie, border: `2px solid ${f >= click ? t.acento : t.borde}`,
        display: "flex", alignItems: "center", gap: 18, fontFamily: t.fuente, fontSize: v ? 36 : 32, color: t.texto,
      }}>
        <span style={{ flex: 1 }}>{prompt.slice(0, escrito)}<span style={{ opacity: f % 16 < 8 && f < click ? 1 : 0, color: t.acento }}>|</span></span>
        <span style={{ padding: "10px 22px", borderRadius: 99, background: t.gradiente, color: t.textoCta, fontWeight: 800, fontSize: v ? 30 : 26, transform: `scale(${f >= click && f < click + 6 ? 0.9 : 1})` }}>Crear</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${card}px)`, gap: 22 }}>
        {piezas.slice(0, v ? 4 : 6).map((p, i) => {
          const e = rebote(f, click + 6 + i * 5, 16);
          return (
            <div key={i} style={{
              height: card * (v ? 1.05 : 0.62), borderRadius: 22, background: fondos[i % fondos.length], border: `1px solid ${t.borde}`,
              padding: v ? 26 : 22, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden",
              transform: `scale(${e}) rotate(${(1 - e) * (i % 2 ? 8 : -8)}deg)`, opacity: Math.min(1, e * 1.5), boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}>
              <div style={{ position: "absolute", top: 16, right: 16, fontFamily: t.mono, fontSize: 18, padding: "4px 10px", borderRadius: 99, background: "rgba(0,0,0,0.35)", color: "#fff" }}>✓ listo</div>
              <div style={{ fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 50 : 40, lineHeight: 1, color: "#fff", letterSpacing: "-0.03em", textShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>{p.titulo}</div>
              <div style={{ fontFamily: t.fuente, fontWeight: 500, fontSize: v ? 26 : 22, color: "rgba(255,255,255,0.85)", marginTop: 8 }}>{p.sub}</div>
            </div>
          );
        })}
      </div>
      <Sfx src="teclado.mp3" en={4} vol={0.35} />
      {piezas.slice(0, v ? 4 : 6).map((_, i) => <Sfx key={i} src="pop.mp3" en={click + 6 + i * 5} vol={0.3} />)}
    </Marco>
  );
};

const Aprobacion: React.FC<Extract<Escena, { tipo: "aprobacion" }>> = ({ titulo, campana, detalle, presupuesto, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const click = Math.round(dur * 0.5);
  const activa = f >= click;
  const ancho = Math.min(w - pad * 2, v ? 900 : 900);
  // cursor: entra desde abajo a la derecha hasta el botón Aprobar
  const cx = interpolate(f, [8, click - 2], [ancho * 0.9, ancho * 0.28], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const cy = interpolate(f, [8, click - 2], [v ? 700 : 520, v ? 520 : 400], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  const e = rebote(f, 2, 18);
  return (
    <Marco dur={dur} gap={v ? 50 : 40}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], ancho, v ? 84 : 80)} />
      <div style={{ position: "relative", width: ancho, transform: `scale(${0.8 + 0.2 * e})`, opacity: Math.min(1, e * 1.5) }}>
        <div style={{ padding: v ? 44 : 38, borderRadius: 34, background: t.superficie, border: `2px solid ${activa ? t.acento : t.borde}`, fontFamily: t.fuente, boxShadow: activa ? `0 0 60px ${t.acento}55` : "0 30px 80px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: t.mono, fontSize: v ? 24 : 20, color: t.gris, letterSpacing: "0.12em" }}>CAMPAÑA DE META</span>
            <span style={{ fontFamily: t.mono, fontSize: v ? 24 : 20, padding: "6px 14px", borderRadius: 99, background: activa ? `${t.acento}22` : "rgba(255,255,255,0.06)", color: activa ? t.acento : t.gris }}>
              {activa ? "● ACTIVA" : "❚❚ EN PAUSA"}
            </span>
          </div>
          <div style={{ fontSize: v ? 50 : 44, fontWeight: 800, color: t.texto, marginTop: 20, letterSpacing: "-0.02em" }}>{campana}</div>
          <div style={{ fontSize: v ? 32 : 28, color: t.gris, marginTop: 8 }}>{detalle}</div>
          <div style={{ fontSize: v ? 36 : 30, color: t.texto, marginTop: 18, fontWeight: 600 }}>{presupuesto}</div>
          <div style={{ display: "flex", gap: 18, marginTop: 30 }}>
            <div style={{ flex: 1, textAlign: "center", padding: "20px 0", borderRadius: 99, background: t.gradiente, color: t.textoCta, fontWeight: 800, fontSize: v ? 38 : 32, transform: `scale(${f >= click && f < click + 6 ? 0.92 : 1})` }}>Aprobar</div>
            <div style={{ flex: 1, textAlign: "center", padding: "20px 0", borderRadius: 99, border: `2px solid ${t.borde}`, color: t.gris, fontWeight: 600, fontSize: v ? 38 : 32 }}>No</div>
          </div>
        </div>
        <svg width={56} height={56} viewBox="0 0 24 24" style={{ position: "absolute", left: cx, top: cy, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))", opacity: tw(f, 6, 12) }}>
          <path d="M4 2 L4 20 L9 15 L12 22 L15 21 L12 14 L19 14 Z" fill="#fff" stroke="#000" strokeWidth={1.2} />
        </svg>
        {activa && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const p = tw(f, click, click + 20);
          const ang = (i / 8) * Math.PI * 2;
          return <div key={i} style={{ position: "absolute", left: ancho * 0.28 + Math.cos(ang) * p * 160, top: (v ? 540 : 420) + Math.sin(ang) * p * 160, width: 12, height: 12, borderRadius: 6, background: i % 2 ? t.acento : t.acento2, opacity: 1 - p }} />;
        })}
      </div>
      <Sfx src="pop.mp3" en={click} vol={0.5} />
      <Sfx src="brillo.mp3" en={click + 2} vol={0.4} />
    </Marco>
  );
};

const Embudo: React.FC<Extract<Escena, { tipo: "embudo" }>> = ({ titulo, etapas, fuga, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const ancho = Math.min(w - pad * 2, v ? 880 : 900);
  const alto = v ? 820 : 600;
  const n = etapas.length;
  const hEt = alto / n;
  return (
    <Marco dur={dur} gap={v ? 40 : 30}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], w - pad * 2, v ? 84 : 84)} />
      <div style={{ position: "relative", width: ancho, height: alto }}>
        {etapas.map((et, i) => {
          const arriba = ancho * (1 - i * 0.18);
          const abajo = ancho * (1 - (i + 1) * 0.18);
          const e = tw(f, 4 + i * 5, 16 + i * 5);
          return (
            <div key={i} style={{
              position: "absolute", top: i * hEt, left: (ancho - arriba) / 2, width: arriba, height: hEt - 10,
              clipPath: `polygon(0 0, 100% 0, ${50 + (abajo / arriba) * 50}% 100%, ${50 - (abajo / arriba) * 50}% 100%)`,
              background: i === 1 ? `linear-gradient(180deg, ${t.alarma}55, ${t.superficie})` : t.superficie, border: `1px solid ${t.borde}`,
              display: "grid", placeItems: "center", opacity: e, fontFamily: t.fuente, fontWeight: 700, fontSize: v ? 40 : 34, color: t.texto,
            }}>{et}</div>
          );
        })}
        {/* leads que caen: la mayoría se escapa por la etapa 2 */}
        {new Array(26).fill(0).map((_, i) => {
          const inicio = 10 + i * 2.2;
          const p = (f - inicio) / 24;
          if (p <= 0 || p > 1.4) return null;
          const escapa = random(`es${i}`) < 0.72;
          const x0 = ancho / 2 + (random(`x${i}`) - 0.5) * ancho * 0.5;
          const y = Math.min(p, escapa ? 0.4 : 1) * alto;
          const dx = escapa && p > 0.4 ? (p - 0.4) * (random(`d${i}`) > 0.5 ? 1 : -1) * ancho * 0.9 : 0;
          const dy = escapa && p > 0.4 ? (p - 0.4) * alto * 0.4 : 0;
          return <div key={i} style={{ position: "absolute", left: x0 + dx, top: y + dy, width: 20, height: 20, borderRadius: 10, background: escapa && p > 0.4 ? t.alarma : t.acento, opacity: escapa && p > 0.4 ? 1.4 - p : 1, boxShadow: `0 0 12px ${escapa && p > 0.4 ? t.alarma : t.acento}` }} />;
        })}
        <div style={{
          position: "absolute", top: hEt * 1.62, right: v ? -30 : -270, padding: "12px 22px", borderRadius: 16, background: `${t.alarma}22`,
          border: `2px solid ${t.alarma}`, color: t.alarma, fontFamily: t.fuente, fontWeight: 700, fontSize: v ? 32 : 30,
          opacity: tw(f, 30, 40), transform: `rotate(${v ? -4 : 0}deg)`,
        }}>{fuga}</div>
      </div>
      <Sfx src="error.mp3" en={32} vol={0.35} />
    </Marco>
  );
};

const Casos: React.FC<Extract<Escena, { tipo: "casos" }>> = ({ titulo, casos, nota, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const cols = v ? 1 : Math.min(4, casos.length);
  const ancho = Math.min(w - pad * 2, 1680);
  return (
    <Marco dur={dur} gap={v ? 40 : 44}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], ancho, v ? 84 : 84)} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: v ? 20 : 24, width: ancho }}>
        {casos.map((c, i) => {
          const en = 8 + i * 8;
          const e = rebote(f, en, 16);
          const p = tw(f, en + 4, en + 30);
          const val = Math.round(c.desde + (c.hasta - c.desde) * p);
          return (
            <div key={i} style={{
              padding: v ? "22px 30px" : "30px 28px", borderRadius: 28, background: t.superficie, border: `2px solid ${p >= 1 ? t.acento : t.borde}`,
              transform: `scale(${0.7 + 0.3 * e})`, opacity: Math.min(1, e * 1.5), fontFamily: t.fuente,
              display: v ? "flex" : "block", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: v ? 38 : 34, fontWeight: 700, color: t.texto }}>{c.nombre}</div>
                <div style={{ fontFamily: t.mono, fontSize: v ? 24 : 22, color: t.gris, marginTop: 6 }}>${c.desde}K/mes →</div>
              </div>
              <div style={{ fontSize: v ? 84 : 92, fontWeight: 800, color: p >= 1 ? t.acento : t.texto, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", marginTop: v ? 0 : 10 }}>
                ${val}K
              </div>
            </div>
          );
        })}
      </div>
      <Nota texto={nota} />
      {casos.map((_, i) => <Sfx key={i} src="caching.mp3" en={8 + i * 8 + 30} vol={0.3} />)}
    </Marco>
  );
};

const Roles: React.FC<Extract<Escena, { tipo: "roles" }>> = ({ titulo, roles, sub, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const cada = Math.max(10, Math.floor((dur - 24) / roles.length));
  const idx = Math.min(roles.length - 1, Math.max(0, Math.floor((f - 10) / cada)));
  const local = (f - 10) % cada;
  const tamRol = ajustar(roles, w - pad * 2, v ? 130 : 150);
  return (
    <Marco dur={dur} gap={v ? 40 : 30}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], w - pad * 2, v ? 70 : 72)} peso={700} color={t.gris} />
      <div style={{ height: tamRol * 1.25, overflow: "hidden", display: "flex", alignItems: "center" }}>
        {f >= 10 && (
          <div key={idx} style={{
            fontFamily: t.fuente, fontWeight: 800, fontSize: tamRol, letterSpacing: "-0.04em", lineHeight: 1.1,
            backgroundImage: t.gradiente, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            transform: `translateY(${(1 - tw(local, 0, 7)) * 100}%)`,
          }}>{roles[idx]}</div>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: w - pad * 2 }}>
        {roles.map((r, i) => (
          <div key={r} style={{
            padding: "10px 22px", borderRadius: 99, fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 30 : 26,
            background: i <= idx && f >= 10 ? `${t.acento}22` : t.superficie, border: `2px solid ${i === idx && f >= 10 ? t.acento : t.borde}`,
            color: i <= idx && f >= 10 ? t.texto : t.gris,
          }}>{r}</div>
        ))}
      </div>
      {sub && <div style={{ maxWidth: w - pad * 2, marginTop: 10 }}><Titular texto={sub} entra={dur - 30} tam={v ? 46 : 44} peso={600} stagger={1.5} /></div>}
      {roles.map((_, i) => <Sfx key={i} src="whoosh.mp3" en={10 + i * cada} vol={0.18} />)}
    </Marco>
  );
};

const Cita: React.FC<Extract<Escena, { tipo: "cita" }>> = ({ texto, autor, rol, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  return (
    <Marco dur={dur} gap={30}>
      <div style={{ fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 220 : 200, lineHeight: 0.6, color: t.acento, opacity: tw(f, 0, 10), transform: `scale(${rebote(f, 0, 16)})` }}>“</div>
      <div style={{ maxWidth: Math.min(w - pad * 2, 1400) }}>
        <Titular texto={texto} entra={4} tam={v ? 66 : 64} peso={600} stagger={1.3} />
      </div>
      <div style={{ width: 80, height: 5, borderRadius: 3, background: t.acento, opacity: tw(f, 20, 28) }} />
      <div style={{ fontFamily: t.fuente, fontWeight: 700, fontSize: v ? 40 : 36, color: t.texto, opacity: tw(f, 22, 32) }}>{autor}</div>
      <div style={{ fontFamily: t.mono, fontSize: v ? 26 : 22, color: t.gris, letterSpacing: "0.1em", opacity: tw(f, 26, 36) }}>{rol}</div>
    </Marco>
  );
};

const Rompecabezas: React.FC<Extract<Escena, { tipo: "rompecabezas" }>> = ({ antes, despues, piezas, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const junta = Math.round(dur * 0.45);
  const p = tw(f, junta - 12, junta, 0, 1, golpe);
  const lado = v ? 300 : 260;
  const Logo = t.Logo;
  return (
    <Marco dur={dur} gap={v ? 50 : 36}>
      <div style={{ minHeight: v ? 260 : 150, display: "flex", alignItems: "center" }}>
        {f < junta ? <Titular texto={antes} entra={0} tam={ajustar([antes], w - pad * 2, v ? 76 : 76)} /> : <Titular texto={despues} entra={junta + 4} tam={ajustar([despues], w - pad * 2, v ? 84 : 84)} />}
      </div>
      <div style={{ position: "relative", width: lado * 2 + 12, height: lado * 2 + 12 }}>
        {piezas.slice(0, 4).map((nom, i) => {
          const gx = (i % 2) * (lado + 12);
          const gy = Math.floor(i / 2) * (lado + 12);
          const sx = (random(`rx${i}`) - 0.5) * (v ? 700 : 1300) + noise2D(`rn${i}`, f / 40, 0) * 40;
          const sy = (random(`ry${i}`) - 0.5) * (v ? 600 : 500) + noise2D(`rm${i}`, 0, f / 40) * 40;
          const rot = (random(`rr${i}`) - 0.5) * 50 + Math.sin(f / 12 + i) * 6;
          const x = interpolate(p, [0, 1], [sx, gx]);
          const y = interpolate(p, [0, 1], [sy, gy]);
          return (
            <div key={i} style={{
              position: "absolute", left: x, top: y, width: lado, height: lado, borderRadius: 30, transform: `rotate(${rot * (1 - p)}deg)`,
              background: p >= 1 ? t.superficie : `${t.superficie}`, border: `3px solid ${p >= 1 ? t.acento : t.borde}`,
              display: "flex", alignItems: p >= 1 ? (i < 2 ? "flex-start" : "flex-end") : "center", justifyContent: p >= 1 ? (i % 2 ? "flex-end" : "flex-start") : "center",
              fontFamily: t.fuente, fontWeight: 700, fontSize: v ? 38 : 32, color: p >= 1 ? t.texto : t.texto,
              textAlign: "center", padding: 24, boxShadow: p >= 1 ? `0 0 40px ${t.acento}33` : "0 20px 50px rgba(0,0,0,0.5)", opacity: tw(f, i * 3, i * 3 + 8),
            }}>{nom}</div>
          );
        })}
        {f >= junta && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <div style={{ transform: `scale(${rebote(f, junta, 18)})`, padding: 30, borderRadius: "50%", background: t.fondo, boxShadow: `0 0 80px ${t.acento}66` }}>
              <Logo size={v ? 210 : 180} vivo />
            </div>
          </div>
        )}
      </div>
      <Sfx src="whoosh.mp3" en={junta - 12} vol={0.5} />
      <Sfx src="impacto.mp3" en={junta} vol={0.55} />
    </Marco>
  );
};

const Dato: React.FC<Extract<Escena, { tipo: "dato" }>> = ({ grande, texto, fuente, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const num = parseFloat(grande);
  const sufijo = grande.replace(/^[\d.,]+/, "");
  const p = tw(f, 2, 26);
  const r = v ? 250 : 220;
  const circ = 2 * Math.PI * r;
  return (
    <Marco dur={dur} gap={v ? 44 : 30}>
      <div style={{ position: "relative", width: r * 2 + 40, height: r * 2 + 40, display: "grid", placeItems: "center" }}>
        <svg width={r * 2 + 40} height={r * 2 + 40} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx={r + 20} cy={r + 20} r={r} fill="none" stroke={t.borde} strokeWidth={18} />
          <circle cx={r + 20} cy={r + 20} r={r} fill="none" stroke={t.acento} strokeWidth={18} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - (isNaN(num) ? 1 : Math.min(1, num / 100)) * p)} style={{ filter: `drop-shadow(0 0 16px ${t.acento})` }} />
        </svg>
        <div style={{ fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 190 : 170, color: t.texto, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
          {isNaN(num) ? grande : `${Math.round(num * p)}${sufijo}`}
        </div>
      </div>
      <div style={{ maxWidth: Math.min(w - pad * 2, 1300) }}><Titular texto={texto} entra={14} tam={v ? 62 : 60} peso={700} stagger={1.5} /></div>
      {fuente && <div style={{ fontFamily: t.mono, fontSize: v ? 22 : 20, color: t.gris, opacity: tw(f, 30, 40) }}>{fuente}</div>}
      <Sfx src="riser.mp3" en={0} vol={0.35} />
    </Marco>
  );
};

const Semanas: React.FC<Extract<Escena, { tipo: "semanas" }>> = ({ titulo, semanas, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const cols = v ? 4 : semanas;
  const cada = Math.max(5, Math.floor((dur * 0.6) / semanas));
  const perdidos = Math.max(0, Math.min(semanas, Math.floor((f - 10) / cada) + 1));
  return (
    <Marco dur={dur} gap={v ? 50 : 40}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], w - pad * 2, v ? 80 : 80)} acento={t.alarma} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18, width: Math.min(w - pad * 2, 1500) }}>
        {new Array(semanas).fill(0).map((_, i) => {
          const en = 10 + i * cada;
          const x = tw(f, en, en + 6);
          return (
            <div key={i} style={{
              height: v ? 170 : 170, borderRadius: 22, background: t.superficie, border: `2px solid ${x > 0 ? t.alarma : t.borde}`, position: "relative",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: t.fuente, gap: 6,
            }}>
              <div style={{ fontFamily: t.mono, color: t.gris, fontSize: 22 }}>SEMANA {i + 1}</div>
              <svg width={80} height={80} viewBox="0 0 80 80">
                <path d="M16 16 L64 64" stroke={t.alarma} strokeWidth={10} strokeLinecap="round" strokeDasharray={70} strokeDashoffset={70 * (1 - x)} />
                <path d="M64 16 L16 64" stroke={t.alarma} strokeWidth={10} strokeLinecap="round" strokeDasharray={70} strokeDashoffset={70 * (1 - tw(f, en + 3, en + 9))} />
              </svg>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 64 : 56, color: t.alarma, fontVariantNumeric: "tabular-nums", opacity: tw(f, 10, 16) }}>
        {perdidos} {perdidos === 1 ? "semana" : "semanas"} regalándole clientes a la competencia
      </div>
      {new Array(semanas).fill(0).map((_, i) => <Sfx key={i} src="error.mp3" en={10 + i * cada} vol={0.18} />)}
    </Marco>
  );
};

const Cierre: React.FC<Extract<Escena, { tipo: "cierre" }>> = ({ cta, sub, url, nota, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v } = useLienzo();
  const Firma = t.Firma;
  const ctaE = rebote(f, 26, 18);
  const brillo = tw(f, 40, 62, -40, 140);
  return (
    <Marco dur={dur} gap={v ? 50 : 34}>
      <Firma size={v ? 420 : 330} entrada={f} />
      {sub && <div style={{ fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 44 : 38, color: t.gris, textAlign: "center", opacity: tw(f, 18, 28), maxWidth: v ? 900 : 1300 }}>{sub}</div>}
      <div style={{
        position: "relative", overflow: "hidden", padding: v ? "30px 64px" : "24px 60px", borderRadius: 999, background: t.gradiente,
        fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 54 : 46, color: t.textoCta, letterSpacing: "-0.01em",
        transform: `scale(${ctaE})`, boxShadow: `0 20px 70px ${t.acento}55`,
      }}>
        {cta}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${brillo}%`, width: "25%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)", transform: "skewX(-20deg)" }} />
      </div>
      {url && <div style={{ fontFamily: t.mono, fontSize: v ? 34 : 30, color: t.texto, letterSpacing: "0.06em", opacity: tw(f, 34, 44) }}>{url}</div>}
      <Nota texto={nota} entra={30} />
      <Sfx src="impacto.mp3" en={0} vol={0.6} />
      <Sfx src="brillo.mp3" en={40} vol={0.45} />
    </Marco>
  );
};

export const EscenaFabrica: React.FC<{ escena: Escena }> = ({ escena }) => {
  switch (escena.tipo) {
    case "gancho": return <Gancho {...escena} />;
    case "numero": return <Numero {...escena} />;
    case "notificaciones": return <Notificaciones {...escena} />;
    case "comparativa": return <Comparativa {...escena} />;
    case "pasos": return <Pasos {...escena} />;
    case "chat": return <ChatEsc {...escena} />;
    case "llamada": return <LlamadaEsc {...escena} />;
    case "flyers": return <Flyers {...escena} />;
    case "aprobacion": return <Aprobacion {...escena} />;
    case "embudo": return <Embudo {...escena} />;
    case "casos": return <Casos {...escena} />;
    case "roles": return <Roles {...escena} />;
    case "cita": return <Cita {...escena} />;
    case "rompecabezas": return <Rompecabezas {...escena} />;
    case "dato": return <Dato {...escena} />;
    case "semanas": return <Semanas {...escena} />;
    case "cierre": return <Cierre {...escena} />;
  }
};
