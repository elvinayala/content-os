// Librería de escenas de la fábrica. Cada escena lee el tema de la marca (contexto) y el lienzo
// (vertical 1080×1920 u horizontal 1920×1080) y se acomoda sola. Los tiempos son frames locales.
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { evolvePath } from "@remotion/paths";
import { noise2D } from "@remotion/noise";
import { golpe, rebote, suave, tw } from "../kit/fx";
import { Chat, IconoTelefono, Llamada, Notificacion, Telefono } from "../kit/ui";
import type { TemaMarca } from "./temas";
import type { Escena } from "./tipos";
import { frauncesItalica, useEstilo } from "./estilos";

export const TemaCtx = createContext<TemaMarca | null>(null);
const useTema = () => useContext(TemaCtx)!;
const useLienzo = () => {
  const { width, height } = useVideoConfig();
  const cuad = width === height; // 1:1 (feed): se apila como vertical, con márgenes de feed
  const v = height > width || cuad;
  // Zona segura: en 9:16 la UI de Reels tapa ~250 px arriba y ~380 abajo.
  return { w: width, h: height, v, cuad, pad: v ? (cuad ? 70 : 80) : 120, top: cuad ? 80 : v ? 250 : 90, bottom: cuad ? 100 : v ? 380 : 90 };
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
}> = ({ texto, entra, tam: tamBase, stagger = 2.5, alinear, color, acento, peso, sale }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const es = useEstilo();
  const al = alinear ?? es.alinear;
  // El cuerpo (peso < 700, p. ej. subtítulos) va en la letra de la marca; los titulares en la del estilo.
  const esTitulo = peso === undefined || peso >= 700;
  const tam = esTitulo ? tamBase * es.escala : tamBase;
  const familia = esTitulo ? es.familia ?? t.fuente : t.fuente;
  const grosor = esTitulo ? (es.familia ? es.peso : peso ?? 800) : peso;
  const ac = acento ?? t.acento;
  // *frase de varias palabras* también se resalta: se lleva el estado entre palabras.
  let dentro = false;
  const palabras = texto.split(" ").filter(Boolean).map((p) => {
    const abre = p.startsWith("*");
    const cierra = /\*[.,!?:;…»]*$/.test(p);
    const marcada = dentro || abre;
    if (abre && !cierra) dentro = true;
    if (cierra) dentro = false;
    return { limpio: p.replace(/\*/g, ""), marcada };
  });
  /** Una palabra con la entrada y el resaltado del estilo. */
  const Palabra = ({ txt, marcada, i, ml = 0 }: { txt: string; marcada: boolean; i: number; ml?: number }) => {
    const ini = entra + i * stagger;
    const e = es.entrada === "corte" ? tw(f, ini, ini + 5, 0, 1, (x) => x) : tw(f, ini, ini + 12);
    const s2 = sale !== undefined ? tw(f, sale + i, sale + i + 8, 0, 1, golpe) : 0;
    const mov =
      es.entrada === "subir" ? { transform: `translateY(${(1 - e) * 110 - s2 * 110}%) rotate(${(1 - e) * 5}deg)`, transformOrigin: "left bottom" }
      : es.entrada === "desenfoque" ? { opacity: e * (1 - s2), filter: `blur(${(1 - e) * 14}px)`, transform: `translateY(${(1 - e) * 18}%)` }
      : es.entrada === "escala" ? { opacity: Math.min(1, e * 2) * (1 - s2), transform: `scale(${0.3 + 0.7 * rebote(f, ini, 16)}) rotate(${(1 - e) * -8}deg)` }
      : { opacity: e > 0 ? 1 - s2 : 0, transform: `translateX(${(1 - e) * -40}%)` };
    const base: React.CSSProperties = { display: "inline-block", marginLeft: ml, color: color ?? t.texto, ...mov };
    let look: React.CSSProperties = {};
    if (marcada) {
      if (es.resaltado === "color") look = { color: ac, textShadow: es.brillo ? `0 0 ${tam * 0.35}px ${ac}55` : undefined };
      else if (es.resaltado === "italica") look = { color: ac, fontFamily: frauncesItalica(), fontStyle: "italic", fontWeight: 500 };
      else if (es.resaltado === "bloque") look = { color: t.textoCta, background: ac, padding: "0 0.1em", boxDecorationBreak: "clone" };
      else if (es.resaltado === "sticker") look = { color: t.textoCta, background: ac, padding: "0.02em 0.12em", borderRadius: tam * 0.18, rotate: `${i % 2 ? 2 : -2}deg` };
      else if (es.resaltado === "subrayado") look = { color: color ?? t.texto, position: "relative" };
    }
    const raya = marcada && es.resaltado === "subrayado" ? tw(f, ini + 8, ini + 22) : 0;
    const hueco = es.entrada === "subir"; // la máscara solo hace falta cuando la palabra sube desde abajo
    return (
      <span style={hueco ? { display: "inline-block", overflow: "hidden", paddingBottom: tam * 0.14, marginBottom: -tam * 0.14 } : { display: "inline-block" }}>
        <span style={{ ...base, ...look }}>
          {txt}
          {raya > 0 && <span style={{ position: "absolute", left: 0, bottom: -tam * 0.04, height: Math.max(4, tam * 0.07), width: `${raya * 100}%`, background: ac, borderRadius: 99 }} />}
        </span>
      </span>
    );
  };
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", justifyContent: al === "center" ? "center" : "flex-start", textAlign: al,
      gap: `0 ${tam * 0.24}px`, fontFamily: familia, fontWeight: grosor, fontSize: tam, lineHeight: esTitulo ? es.interlinea : 1.05,
      letterSpacing: esTitulo ? es.tracking : "-0.02em", textTransform: esTitulo && es.mayus ? "uppercase" : undefined,
    }}>
      {/* Sin viudas: las dos últimas palabras viajan juntas (nunca una sola palabra en la última línea). */}
      {palabras.map(({ limpio, marcada }, i) => {
        // Solo se pega si la última es corta: pegar dos palabras largas rompe la línea peor que la viuda.
        const pegar = palabras.length >= 3 && palabras[palabras.length - 1].limpio.replace(/[.,!?:;…»]/g, "").length <= 5;
        if (pegar && i === palabras.length - 1) return null;
        const pegada = pegar && i === palabras.length - 2 ? palabras[i + 1] : null;
        return (
          <span key={i} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
            {Palabra({ txt: limpio, marcada, i })}
            {pegada && Palabra({ txt: pegada.limpio, marcada: pegada.marcada, i: i + 1, ml: tam * 0.24 })}
          </span>
        );
      })}
    </div>
  );
};

const Etiqueta: React.FC<{ texto: string; entra?: number; color?: string }> = ({ texto, entra = 0, color }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const es = useEstilo();
  const { v } = useLienzo();
  const e = tw(f, entra, entra + 10);
  if (es.etiqueta === "regla") return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: e }}>
      <div style={{ width: 64 * tw(f, entra, entra + 14), height: 2, background: color ?? t.acento }} />
      <div style={{ fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 30 : 26, letterSpacing: "0.14em", color: color ?? t.acento, textTransform: "uppercase" }}>{texto}</div>
    </div>
  );
  if (es.etiqueta === "pastilla") return (
    <div style={{
      fontFamily: es.familia ?? t.fuente, fontWeight: es.mayus ? 400 : 700, fontSize: v ? 32 : 28, letterSpacing: es.mayus ? "0.06em" : "0.02em",
      textTransform: "uppercase", color: t.textoCta, background: color ?? t.acento, padding: "8px 20px", borderRadius: es.radio / 2,
      transform: `scale(${0.6 + 0.4 * rebote(f, entra, 14)}) rotate(${es.id === "pop" ? -3 : 0}deg)`, opacity: e,
    }}>{texto}</div>
  );
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
  const { v, bottom, pad } = useLienzo();
  if (!texto) return null;
  return (
    <div style={{ position: "absolute", left: pad, right: pad, bottom: Math.max(24, bottom - (v ? 60 : 40)), textAlign: "center", fontFamily: t.fuente, fontSize: v ? 24 : 20, color: t.gris, opacity: 0.8 * tw(f, entra, entra + 10) }}>
      <span style={{ background: `${t.fondo}d9`, padding: "4px 14px", borderRadius: 99 }}>{texto}</span>
    </div>
  );
};

/** Contenedor que respeta la zona segura y trae la deriva de cámara. */
const Marco: React.FC<{ children: React.ReactNode; dur: number; centrado?: boolean; gap?: number }> = ({ children, dur, centrado = true, gap = 40 }) => {
  const f = useCurrentFrame();
  const es = useEstilo();
  const { pad, top, bottom } = useLienzo();
  const escala = interpolate(f, [0, dur], [1.035, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{
      padding: `${top}px ${pad}px ${bottom}px`, display: "flex", flexDirection: "column", alignItems: es.alinear === "left" ? "flex-start" : "center",
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
  // 0.64 ≈ ancho medio de un carácter en negrita extra (Sora/Outfit/Onest 800): con menos, la línea "cabe" en
  // el cálculo pero no en pantalla y se parte donde no debe ("¿Ya" solo arriba).
  const enUna = ancho / (largo * 0.64);
  // Una sola frase larga puede partirse hasta en 3 líneas en vez de achicarse hasta ser ilegible.
  // Partir una línea solo si en una sola quedaría chica (< 75 % del tamaño base); las cortas van enteras.
  const envuelta = envolver > 1 && enUna < base * 0.75 ? Math.min((ancho * envolver * 0.8) / (largo * 0.64), ancho / (palabra * 0.62)) : 0;
  return Math.min(base, Math.max(enUna, envuelta));
};

/* ═════════════════ Escenas ═════════════════ */

const Gancho: React.FC<Extract<Escena, { tipo: "gancho" }>> = ({ lineas, sub, alarma, etiqueta, logo, dur }) => {
  const f = useCurrentFrame();
  const es = useEstilo();
  const t = useTema();
  const { w, pad, v } = useLienzo();
  const { cuad } = useLienzo();
  const tam = ajustar(lineas, w - pad * 2, cuad ? 118 : 150, v ? 3 : lineas.length === 1 ? 3 : 1); // en vertical una línea larga puede partirse hasta en tres
  const golpeCam = 1 + 0.06 * Math.exp(-f / 4);
  const acento = alarma ? t.alarma : undefined;
  return (
    <Marco dur={dur} gap={v ? 34 : 28}>
      <div style={{ transform: `scale(${golpeCam})`, transformOrigin: es.alinear === "left" ? "left center" : "center", display: "flex", flexDirection: "column", alignItems: es.alinear === "left" ? "flex-start" : "center", gap: v ? 34 : 26 }}>
        {logo && <t.Logo size={v ? 300 : 230} entrada={f} vivo={f > 50} />}
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
            <Notificacion key={i} titulo={n.titulo} detalle={n.detalle} hora={n.hora} entra={6 + i * 10} tema={t} color={n.color ?? t.alarma} icono={n.icono} ancho={ancho * 0.9} />
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

/** Un bullet (lista, pasos, puntos del retrato) con el look del ESTILO: píldora · línea · bloque · numeral · sticker · consola. */
const Item: React.FC<{
  i: number; en: number; texto: string; marca: string; color: string; activo: number; tam: number; ancho?: number;
  tachar?: boolean; monto?: string;
}> = ({ i, en, texto, marca, color, activo, tam, ancho, tachar, monto }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const es = useEstilo();
  const { v } = useLienzo();
  const e = rebote(f, en, 14);
  const op = Math.min(1, e * 1.5);
  const txtColor = tachar && activo > 0 ? t.gris : t.texto;
  const lineal = (q: number) => q;
  const Texto = (extra: React.CSSProperties = {}) => (
    <div style={{ position: "relative", flex: 1, fontSize: tam, fontWeight: 600, color: txtColor, lineHeight: 1.18, fontFamily: t.fuente, ...extra }}>
      {texto}
      {tachar && <div style={{ position: "absolute", left: 0, top: "52%", height: Math.max(4, tam * 0.1), borderRadius: 3, width: `${activo * 100}%`, background: t.alarma }} />}
    </div>
  );
  const Monto = monto ? <div style={{ fontFamily: t.mono, fontSize: tam * 0.78, color: t.alarma, fontWeight: 600 }}>{monto}</div> : null;
  const circ = tam * 1.12;
  switch (es.tarjeta) {
    case "linea": {
      const a = tw(f, en, en + 12);
      return (
        <div style={{ width: ancho, display: "flex", alignItems: "center", gap: tam * 0.5, padding: `${tam * 0.42}px 0`, borderBottom: `1px solid ${t.borde}`, opacity: a, filter: `blur(${(1 - a) * 8}px)` }}>
          <div style={{ width: tam * 0.28, height: tam * 0.28, borderRadius: 99, flex: "none", background: activo > 0 ? color : "transparent", border: `2px solid ${color}` }} />
          {Texto({ fontWeight: 500 })}{Monto}
        </div>
      );
    }
    case "numeral": {
      const a = tw(f, en, en + 12);
      return (
        <div style={{ width: ancho, display: "flex", alignItems: "baseline", gap: tam * 0.6, padding: `${tam * 0.35}px 0`, borderTop: `1px solid ${t.borde}`, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>
          <div style={{ fontFamily: es.resaltado === "italica" ? frauncesItalica() : es.familia ?? t.fuente, fontStyle: es.resaltado === "italica" ? "italic" : undefined, fontWeight: 500, fontSize: tam * 1.5, color, lineHeight: 1, minWidth: tam * 1.9, fontVariantNumeric: "tabular-nums" }}>
            {String(i + 1).padStart(2, "0")}
          </div>
          {Texto()}{Monto}
        </div>
      );
    }
    case "bloque": {
      const x = tw(f, en, en + 6, 0, 1, lineal);
      const on = activo > 0;
      return (
        <div style={{ width: ancho, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: tam * 0.5, padding: `${tam * 0.42}px ${tam * 0.6}px`, background: on ? color : t.superficie, transform: `translateX(${(1 - x) * -105}%)` }}>
            <div style={{ fontFamily: es.familia ?? t.fuente, fontSize: tam * 1.1, color: on ? t.textoCta : color, lineHeight: 1, minWidth: tam * 0.9 }}>{marca}</div>
            {Texto({ fontFamily: es.familia ?? t.fuente, fontWeight: es.peso, textTransform: es.mayus ? "uppercase" : undefined, letterSpacing: es.mayus ? "0.02em" : undefined, fontSize: tam * 1.04, color: on ? t.textoCta : txtColor })}
            {Monto}
          </div>
        </div>
      );
    }
    case "sticker": {
      const rot = i % 2 ? 2 : -2;
      return (
        <div style={{ width: ancho, display: "flex", alignItems: "center", gap: tam * 0.5, padding: `${tam * 0.42}px ${tam * 0.6}px`, borderRadius: es.radio, background: t.superficie, border: `3px solid ${t.texto}`, boxShadow: `${tam * 0.18}px ${tam * 0.18}px 0 ${color}`, transform: `rotate(${rot * e}deg) scale(${0.5 + 0.5 * e})`, opacity: op }}>
          <div style={{ width: circ, height: circ, borderRadius: 99, flex: "none", display: "grid", placeItems: "center", background: color, color: t.textoCta, fontFamily: es.familia ?? t.fuente, fontWeight: 800, fontSize: tam * 0.6, transform: `scale(${0.6 + 0.4 * activo})` }}>{marca}</div>
          {Texto()}{Monto}
        </div>
      );
    }
    case "terminal": {
      const x = tw(f, en, en + 5, 0, 1, lineal);
      return (
        <div style={{ width: ancho, display: "flex", alignItems: "center", gap: tam * 0.45, padding: `${tam * 0.3}px ${tam * 0.5}px`, borderLeft: `4px solid ${activo > 0 ? color : t.borde}`, background: `${t.superficie}cc`, opacity: x > 0 ? 1 : 0, transform: `translateX(${(1 - x) * -40}px)` }}>
          <div style={{ fontFamily: t.mono, fontSize: tam * 0.85, color: activo > 0 ? color : t.gris, whiteSpace: "pre" }}>{`[${activo > 0 ? marca : " "}]`}</div>
          {Texto({ fontFamily: t.mono, fontWeight: 500, fontSize: tam * 0.86 })}{Monto}
        </div>
      );
    }
    case "pildora":
    default:
      return (
        <div style={{ width: ancho, display: "flex", alignItems: "center", gap: 22, padding: v ? "22px 28px" : "16px 26px", borderRadius: 22, background: t.superficie, border: `2px solid ${activo > 0 ? color : t.borde}`, transform: `translateX(${(1 - e) * -80}px)`, opacity: op }}>
          <div style={{ width: circ, height: circ, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: activo > 0 ? color : "transparent", border: `3px solid ${color}`, color: t.textoCta, fontFamily: t.fuente, fontWeight: 800, fontSize: tam * 0.62, transform: `scale(${0.6 + 0.4 * activo})` }}>
            {activo > 0 ? marca : ""}
          </div>
          {Texto()}{Monto}
        </div>
      );
  }
};

const Pasos: React.FC<Extract<Escena, { tipo: "pasos" }>> = ({ titulo, pasos, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const es = useEstilo();
  const { v, w, pad } = useLienzo();
  // En 16:9 las tarjetas (píldora, bloque, sticker) van en columnas; los estilos de línea van en lista.
  const enColumnas = !v && ["pildora", "bloque", "sticker"].includes(es.tarjeta);
  const cols = enColumnas ? Math.min(3, pasos.length) : 1;
  const paso = Math.min(9, (dur * 0.6) / pasos.length);
  const ancho = Math.min(w - pad * 2, enColumnas ? 1500 : 1250);
  return (
    <Marco dur={dur} gap={v ? 50 : 46}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], w - pad * 2, v ? 100 : 86)} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: ["linea", "numeral"].includes(es.tarjeta) ? 0 : v ? 22 : 26, width: ancho }}>
        {pasos.map((p, i) => {
          const en = 8 + i * paso;
          return <Item key={i} i={i} en={en} texto={p} marca={String(i + 1)} color={t.acento} activo={f >= en ? 1 : 0} tam={v ? 48 : enColumnas ? 36 : 42} />;
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
  // "+10", "85%", "$3K": prefijo + número + sufijo (antes "+10" salía "10+10").
  const partes = grande.match(/^([^\d]*)([\d.,]+)(.*)$/);
  const prefijo = partes?.[1] ?? "";
  const num = partes ? parseFloat(partes[2].replace(/,/g, "")) : NaN;
  const sufijo = partes?.[3] ?? "";
  // El anillo marca la proporción solo si es un porcentaje; si no, se cierra completo.
  const fraccion = sufijo.includes("%") ? Math.min(1, num / 100) : 1;
  const p = tw(f, 2, 26);
  const r = v ? 250 : 220;
  const circ = 2 * Math.PI * r;
  return (
    <Marco dur={dur} gap={v ? 44 : 30}>
      <div style={{ position: "relative", width: r * 2 + 40, height: r * 2 + 40, display: "grid", placeItems: "center" }}>
        <svg width={r * 2 + 40} height={r * 2 + 40} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx={r + 20} cy={r + 20} r={r} fill="none" stroke={t.borde} strokeWidth={18} />
          <circle cx={r + 20} cy={r + 20} r={r} fill="none" stroke={t.acento} strokeWidth={18} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - (isNaN(num) ? 1 : fraccion) * p)} style={{ filter: `drop-shadow(0 0 16px ${t.acento})` }} />
        </svg>
        <div style={{ fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 190 : 170, color: t.texto, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums" }}>
          {isNaN(num) ? grande : `${prefijo}${Math.round(num * p)}${sufijo}`}
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
  const es = useEstilo();
  const { v, cuad } = useLienzo();
  const Firma = t.Firma;
  const ctaE = rebote(f, 26, 18);
  const brillo = tw(f, 40, 62, -40, 140);
  const partido = es.cierre === "partido" && !v;
  const Boton = (
    <div style={{
      position: "relative", overflow: "hidden", padding: v ? "30px 64px" : "24px 60px", borderRadius: es.radio === 0 ? 0 : es.radio < 20 ? es.radio : 999,
      background: es.id === "minimal" || es.id === "editorial" ? t.acento : t.gradiente,
      fontFamily: es.familia ?? t.fuente, fontWeight: es.familia ? es.peso : 800, fontSize: (v ? 54 : 46) * (es.mayus ? 1.1 : es.id === "pop" ? (v ? 0.66 : 0.8) : 1), whiteSpace: "nowrap",
      textTransform: es.mayus ? "uppercase" : undefined, letterSpacing: es.mayus ? "0.02em" : "-0.01em", color: t.textoCta,
      transform: `scale(${ctaE}) rotate(${es.id === "pop" ? -2 : 0}deg)`,
      boxShadow: es.id === "pop" ? `10px 10px 0 ${t.texto}` : es.brillo ? `0 20px 70px ${t.acento}55` : `0 12px 40px ${t.fondo}`,
      border: es.id === "pop" ? `3px solid ${t.texto}` : undefined,
    }}>
      {cta}
      {es.brillo && <div style={{ position: "absolute", top: 0, bottom: 0, left: `${brillo}%`, width: "25%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)", transform: "skewX(-20deg)" }} />}
    </div>
  );
  const Sub = sub && <div style={{ fontFamily: t.fuente, fontWeight: 600, fontSize: v ? 44 : 38, color: t.gris, textAlign: partido ? "left" : "center", opacity: tw(f, 18, 28), maxWidth: v ? 900 : partido ? 900 : 1300 }}>{sub}</div>;
  const Url = url && <div style={{ fontFamily: t.mono, fontSize: v ? 34 : 30, color: t.texto, letterSpacing: "0.06em", opacity: tw(f, 34, 44) }}>{url}</div>;
  const sonido = (<><Sfx src="impacto.mp3" en={0} vol={0.6} /><Sfx src="brillo.mp3" en={40} vol={0.45} /></>);
  if (partido) {
    return (
      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90, padding: "90px 140px" }}>
        <div style={{ flex: "none" }}><Firma size={360} entrada={f} /></div>
        <div style={{ width: 2, height: 420 * tw(f, 6, 24), background: t.borde }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 34 }}>
          {Sub}{Boton}{Url}
        </div>
        <Nota texto={nota} entra={30} />
        {sonido}
      </AbsoluteFill>
    );
  }
  return (
    <Marco dur={dur} gap={v ? 50 : 34}>
      <div style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: v ? 50 : 34 }}>
        <Firma size={cuad ? 280 : v ? 420 : 330} entrada={f} />
        {Sub}{Boton}{Url}
      </div>
      <Nota texto={nota} entra={30} />
      {sonido}
    </Marco>
  );
};

const Lista: React.FC<Extract<Escena, { tipo: "lista" }>> = ({ titulo, items, modo, total, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const es = useEstilo();
  const { v, w, pad } = useLienzo();
  const ancho = Math.min(w - pad * 2, v ? 920 : 1100);
  const cada = Math.max(6, Math.floor((dur * 0.62) / items.length));
  const color = modo === "marcar" ? t.acento : t.alarma;
  const hechos = Math.max(0, Math.min(items.length, Math.floor((f - 8) / cada) + 1));
  return (
    <Marco dur={dur} gap={v ? 36 : 28}>
      <Titular texto={titulo} entra={0} tam={ajustar([titulo], ancho, v ? 88 : 80)} acento={modo === "tachar" ? t.alarma : undefined} />
      <div style={{ width: ancho, display: "flex", flexDirection: "column", gap: ["linea", "numeral"].includes(es.tarjeta) ? 0 : es.tarjeta === "sticker" ? (v ? 30 : 24) : v ? 18 : 14 }}>
        {items.map((it, i) => {
          const en = 8 + i * cada;
          return (
            <Item key={i} i={i} en={en} texto={it.texto} monto={it.monto} marca={modo === "tachar" ? "✕" : modo === "sumar" ? "$" : "✓"}
              color={color} activo={tw(f, en + 5, en + 12)} tam={v ? 44 : 36} tachar={modo === "tachar"} />
          );
        })}
      </div>
      {total && (
        <div style={{ fontFamily: es.familia ?? t.fuente, fontWeight: es.familia ? es.peso : 800, fontSize: v ? 60 : 52, color: t.alarma, opacity: tw(f, 10, 18), fontVariantNumeric: "tabular-nums", textAlign: "center" }}>
          {total.etiqueta} {total.prefijo ?? ""}{Math.round(total.hasta * (hechos / items.length))}{total.sufijo ?? ""}
        </div>
      )}
      {items.map((_, i) => <Sfx key={i} src={modo === "tachar" ? "error.mp3" : "pop.mp3"} en={8 + i * cada + 5} vol={0.22} />)}
    </Marco>
  );
};

const Voz: React.FC<Extract<Escena, { tipo: "voz" }>> = ({ orden, respuesta, evento, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const ancho = Math.min(w - pad * 2, v ? 920 : 1000);
  const habla = Math.round(dur * 0.4); // hasta aquí el dueño habla
  const letras = Math.floor(tw(f, 6, habla, 0, orden.length, (x) => x));
  const responde = habla + 8;
  const barras = 40;
  const hablando = f < habla;
  return (
    <Marco dur={dur} gap={v ? 36 : 26}>
      <Etiqueta texto={hablando ? "● Usted le habla" : "Su asistente responde"} color={hablando ? t.alarma : t.acento} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: v ? 130 : 100 }}>
        {new Array(barras).fill(0).map((_, i) => {
          const n = (noise2D("vz", i / 4, f / 5) + 1) / 2;
          const env = Math.sin((i / (barras - 1)) * Math.PI);
          const activo = f < habla || (f >= responde && f < responde + 30);
          return <div key={i} style={{ width: v ? 10 : 8, height: activo ? 10 + n * (v ? 120 : 90) * env : 8, borderRadius: 5, background: f < habla ? t.texto : t.acento, opacity: 0.9 }} />;
        })}
      </div>
      <div style={{ width: ancho, alignSelf: "center", padding: v ? "26px 32px" : "20px 28px", borderRadius: 28, background: "rgba(255,255,255,0.08)", border: `1px solid ${t.borde}`, fontFamily: t.fuente, fontSize: v ? 44 : 38, fontWeight: 600, color: t.texto, lineHeight: 1.25 }}>
        “{orden.slice(0, letras)}{letras < orden.length ? <span style={{ color: t.acento }}>|</span> : "”"}
      </div>
      {f >= responde && (
        <div style={{ width: ancho, padding: v ? "26px 32px" : "20px 28px", borderRadius: 28, background: t.superficie, border: `2px solid ${t.acento}`, fontFamily: t.fuente, fontSize: v ? 40 : 34, color: t.texto, lineHeight: 1.3, transform: `scale(${rebote(f, responde, 14)})`, transformOrigin: "left top", boxShadow: `0 0 50px ${t.acento}33` }}>
          {respuesta}
        </div>
      )}
      {evento && f >= responde + 14 && (
        <div style={{ display: "flex", alignItems: "center", gap: 22, padding: v ? "22px 30px" : "16px 26px", borderRadius: 24, background: t.gradiente, color: t.textoCta, fontFamily: t.fuente, transform: `translateY(${(1 - rebote(f, responde + 14, 16)) * 120}px)` }}>
          <div style={{ fontFamily: t.mono, fontSize: v ? 26 : 22, fontWeight: 600 }}>📅 CALENDARIO</div>
          <div style={{ fontSize: v ? 40 : 34, fontWeight: 800 }}>{evento.titulo}</div>
          <div style={{ fontSize: v ? 34 : 28, fontWeight: 600 }}>{evento.cuando}</div>
        </div>
      )}
      <Sfx src="contesta.mp3" en={responde} vol={0.4} />
      <Sfx src="brillo.mp3" en={responde + 14} vol={0.4} />
    </Marco>
  );
};

const Agenda: React.FC<Extract<Escena, { tipo: "agenda" }>> = ({ pregunta, dia, items, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, pad } = useLienzo();
  const ancho = Math.min(w - pad * 2, v ? 900 : 1000);
  const cada = Math.max(6, Math.floor((dur * 0.55) / items.length));
  return (
    <Marco dur={dur} gap={v ? 34 : 24}>
      <div style={{ padding: v ? "20px 34px" : "16px 30px", borderRadius: 99, background: "rgba(255,255,255,0.08)", border: `1px solid ${t.borde}`, fontFamily: t.fuente, fontSize: v ? 44 : 38, fontWeight: 600, color: t.texto, display: "flex", alignItems: "center", gap: 16, opacity: tw(f, 0, 8) }}>
        <IconoTelefono size={v ? 34 : 28} color={t.acento} /> “{pregunta}”
      </div>
      <div style={{ width: ancho, borderRadius: 32, background: t.superficie, border: `2px solid ${t.borde}`, overflow: "hidden", opacity: tw(f, 6, 14) }}>
        <div style={{ padding: v ? "22px 30px" : "16px 26px", background: t.gradiente, color: t.textoCta, fontFamily: t.fuente, fontWeight: 800, fontSize: v ? 40 : 34 }}>{dia}</div>
        {items.map((it, i) => {
          const en = 12 + i * cada;
          const e = tw(f, en, en + 10);
          return (
            <div key={i} style={{ display: "flex", gap: 26, alignItems: "center", padding: v ? "22px 30px" : "16px 26px", borderTop: `1px solid ${t.borde}`, opacity: e, transform: `translateX(${(1 - e) * 60}px)`, fontFamily: t.fuente }}>
              <div style={{ fontFamily: t.mono, fontSize: v ? 32 : 26, color: t.acento, width: v ? 150 : 130 }}>{it.hora}</div>
              <div style={{ fontSize: v ? 40 : 34, fontWeight: 600, color: t.texto }}>{it.texto}</div>
            </div>
          );
        })}
      </div>
      {items.map((_, i) => <Sfx key={i} src="pop.mp3" en={12 + i * cada} vol={0.25} />)}
    </Marco>
  );
};

/** Captura real de una app dentro de un laptop o teléfono, con zoom a la zona importante y viñetas. */
const Pantalla: React.FC<Extract<Escena, { tipo: "pantalla" }>> = ({ titulo, sub, imagen, dispositivo, puntos = [], foco, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w, h } = useLienzo();
  const tel = dispositivo === "telefono";
  // tamaño del aparato según el lienzo
  const anchoPant = tel ? (v ? 560 : 420) : v ? 960 : 1040;
  const altoPant = tel ? anchoPant * (844 / 390) : anchoPant * (900 / 1440);
  const entra = rebote(f, 0, 22);
  // cámara: empieza viendo toda la pantalla y se acerca al foco
  const z = foco ? tw(f, Math.round(dur * 0.35), Math.round(dur * 0.62), 0, 1, suave) : 0;
  const escala = foco ? 1 + z * (Math.min(1 / foco.w, 1 / foco.h) * 0.8 - 1) : 1;
  const cx = foco ? (foco.x + foco.w / 2 - 0.5) * anchoPant * escala * z : 0;
  const cy = foco ? (foco.y + foco.h / 2 - 0.5) * altoPant * escala * z : 0;
  const scrollY = 0;
  const aparato = (
    <div style={{
      position: "relative", transform: `translateY(${(1 - entra) * 140}px) rotateX(${(1 - entra) * 18}deg)`, opacity: Math.min(1, entra * 1.4),
      padding: tel ? 14 : "18px 18px 22px", borderRadius: tel ? 64 : 22, background: "linear-gradient(145deg, #2a2f45, #0b0d16)",
      boxShadow: `0 50px 140px rgba(0,0,0,0.6), 0 0 0 2px ${t.borde}, 0 0 90px ${t.acento}22`,
    }}>
      <div style={{ width: anchoPant, height: altoPant, borderRadius: tel ? 50 : 10, overflow: "hidden", position: "relative", background: t.fondo }}>
        <Img src={staticFile(imagen)} style={{
          width: "100%", position: "absolute", top: 0, left: 0,
          transform: `translate(${-cx}px, ${-cy - scrollY}px) scale(${escala})`, transformOrigin: "center center",
        }} />
        {tel && <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 120, height: 34, borderRadius: 20, background: "#000" }} />}
      </div>
      {!tel && <div style={{ position: "absolute", left: -60, right: -60, bottom: -26, height: 26, borderRadius: "0 0 26px 26px", background: "linear-gradient(180deg, #3a3f55, #151826)" }} />}
    </div>
  );
  const textos = (
    <div style={{ display: "flex", flexDirection: "column", gap: v ? 18 : 22, alignItems: v ? "center" : "flex-start", maxWidth: v ? w - 160 : 600, width: v ? undefined : 600, flexShrink: 0 }}>
      <Titular texto={titulo} entra={4} tam={ajustar([titulo], v ? w - 160 : 600, v ? 84 : 80)} alinear={v ? "center" : "left"} />
      {sub && <div style={{ fontFamily: t.fuente, fontSize: v ? 36 : 30, color: t.gris, fontWeight: 500, opacity: tw(f, 14, 24), textAlign: v ? "center" : "left", lineHeight: 1.3 }}>{sub}</div>}
      {puntos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
          {puntos.map((p, i) => {
            const e = tw(f, 20 + i * 7, 30 + i * 7);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: t.fuente, fontSize: v ? 34 : 30, fontWeight: 600, color: t.texto, opacity: e, transform: `translateX(${(1 - e) * -30}px)` }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: t.gradiente, flexShrink: 0 }} />{p}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  const escalaAparato = v ? Math.min(1, (h - 250 - 380 - 330) / altoPant) : Math.min(1, (h - 180) / (altoPant + 40));
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", justifyContent: "center", gap: v ? 40 : 70, padding: v ? "230px 60px 330px" : "60px 90px", perspective: 1600 }}>
      {textos}
      <div style={{ transform: `scale(${escalaAparato})`, transformOrigin: v ? "top center" : "center", height: v ? altoPant * escalaAparato + 40 : undefined }}>{aparato}</div>
      <Sfx src="whoosh.mp3" en={0} vol={0.3} />
      {foco && <Sfx src="riser.mp3" en={Math.round(dur * 0.35)} vol={0.2} />}
    </AbsoluteFill>
  );
};

/** Gráfico de velas que se forma en vivo; el radar detecta la señal y marca entrada, SL y TP. SIMULACIÓN. */
const Grafico: React.FC<Extract<Escena, { tipo: "grafico" }>> = ({ titulo, sub, par, modo, puntos = [], dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w } = useLienzo();
  const ancho = v ? w - 120 : 1060;
  const { cuad } = useLienzo();
  const alto = cuad ? 440 : v ? 700 : 640;
  const N = 46;
  const senal = 26; // vela de la señal
  // serie: baja/lateral y luego impulso alcista tras la señal (determinista)
  const velas: { o: number; c: number; h: number; l: number }[] = [];
  let precio = 50;
  for (let i = 0; i < N; i++) {
    const tend = i < senal - 6 ? -0.25 : i < senal ? 0.05 : 0.95;
    const o = precio;
    const c = o + tend + (random(`c${i}`) - 0.5) * 2.2;
    velas.push({ o, c, h: Math.max(o, c) + random(`h${i}`) * 1.2, l: Math.min(o, c) - random(`l${i}`) * 1.2 });
    precio = c;
  }
  const min = Math.min(...velas.map((x) => x.l)) - 2;
  const max = Math.max(...velas.map((x) => x.h)) + 2;
  const Y = (p: number) => alto - ((p - min) / (max - min)) * alto;
  const cw = ancho / N;
  const visibles = Math.min(N, Math.floor(f / 1.7) + 8);
  const entrada = velas[senal].c;
  const sl = entrada - 4;
  const tp = entrada + 8;
  const trasSenal = visibles > senal;
  const tpHit = velas.slice(senal + 1, visibles).some((x) => x.h >= tp);
  const fSenal = (senal - 8) * 1.7;
  const ping = ((f - fSenal) % 24) / 24;
  const grafico = (
    <div style={{ position: "relative", width: ancho, height: alto + 60, borderRadius: 18, background: t.superficie, border: `1px solid ${t.borde}`, overflow: "hidden", padding: "40px 0 20px" }}>
      <div style={{ position: "absolute", top: 12, left: 18, fontFamily: t.mono, fontSize: 20, color: t.gris, letterSpacing: "0.12em" }}>{par} · M5</div>
      <div style={{ position: "absolute", top: 12, right: 18, fontFamily: t.mono, fontSize: 16, color: t.gris, letterSpacing: "0.2em", border: `1px solid ${t.borde}`, padding: "2px 8px", borderRadius: 6 }}>SIMULACIÓN</div>
      <svg width={ancho} height={alto} style={{ overflow: "visible" }}>
        {[0.2, 0.4, 0.6, 0.8].map((g) => <line key={g} x1={0} x2={ancho} y1={alto * g} y2={alto * g} stroke={t.borde} strokeDasharray="4 10" />)}
        {velas.slice(0, visibles).map((x, i) => {
          const sube = x.c >= x.o;
          const col = sube ? t.acento : t.alarma;
          const nueva = i === visibles - 1 ? tw(f % 1.7, 0, 1.7) : 1;
          return (
            <g key={i} opacity={i === visibles - 1 ? 0.6 + 0.4 * nueva : 1}>
              <line x1={i * cw + cw / 2} x2={i * cw + cw / 2} y1={Y(x.h)} y2={Y(x.l)} stroke={col} strokeWidth={2} />
              <rect x={i * cw + cw * 0.18} width={cw * 0.64} y={Y(Math.max(x.o, x.c))} height={Math.max(2, Math.abs(Y(x.o) - Y(x.c)))} fill={col} opacity={0.9} />
            </g>
          );
        })}
        {trasSenal && (
          <g>
            <line x1={senal * cw} x2={ancho} y1={Y(entrada)} y2={Y(entrada)} stroke={t.texto} strokeDasharray="8 6" strokeWidth={1.5} />
            <line x1={senal * cw} x2={ancho} y1={Y(tp)} y2={Y(tp)} stroke={t.acento} strokeDasharray="8 6" strokeWidth={2} />
            <line x1={senal * cw} x2={ancho} y1={Y(sl)} y2={Y(sl)} stroke={t.alarma} strokeDasharray="8 6" strokeWidth={2} />
            <text x={ancho - 12} y={Y(tp) - 8} textAnchor="end" fill={t.acento} fontFamily={t.mono} fontSize={18}>TP</text>
            <text x={ancho - 12} y={Y(sl) + 22} textAnchor="end" fill={t.alarma} fontFamily={t.mono} fontSize={18}>SL</text>
            <text x={ancho - 12} y={Y(entrada) - 8} textAnchor="end" fill={t.texto} fontFamily={t.mono} fontSize={18}>ENTRADA</text>
            {/* radar */}
            {!tpHit && [0, 1].map((k) => {
              const q = (ping + k / 2) % 1;
              return <circle key={k} cx={senal * cw + cw / 2} cy={Y(entrada)} r={10 + q * 70} fill="none" stroke={t.acento} strokeWidth={3 * (1 - q)} opacity={1 - q} />;
            })}
            <circle cx={senal * cw + cw / 2} cy={Y(entrada)} r={8} fill={t.acento} />
          </g>
        )}
      </svg>
      {trasSenal && (
        <div style={{ position: "absolute", left: Math.min(ancho - 360, senal * cw - 40), top: Y(entrada) - 30, padding: "10px 16px", borderRadius: 10, background: t.fondo, border: `2px solid ${t.acento}`, fontFamily: t.mono, fontSize: 22, color: t.acento, transform: `scale(${rebote(f, fSenal, 12)})`, boxShadow: `0 0 30px ${t.acento}55` }}>
          {modo === "autopilot" ? "AUTOPILOT · BUY ejecutado" : "RADAR · Señal BUY"}
        </div>
      )}
      {tpHit && (
        <div style={{ position: "absolute", right: 40, top: Y(tp) + 20, padding: "12px 20px", borderRadius: 10, background: t.acento, color: t.textoCta, fontFamily: t.mono, fontWeight: 700, fontSize: 26 }}>TP ALCANZADO ✓</div>
      )}
    </div>
  );
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: v ? "column" : "row", alignItems: "center", justifyContent: "center", gap: cuad ? 24 : v ? 40 : 70, padding: cuad ? "60px 60px 80px" : v ? "230px 60px 330px" : "60px 90px" }}>
      <div style={{ width: v ? undefined : 560, flexShrink: 0, display: "flex", flexDirection: "column", gap: 20, alignItems: v ? "center" : "flex-start" }}>
        <Titular texto={titulo} entra={2} tam={ajustar([titulo], v ? w - 160 : 560, v ? 84 : 74)} alinear={v ? "center" : "left"} />
        {sub && <div style={{ fontFamily: t.fuente, fontSize: v ? 34 : 28, color: t.gris, lineHeight: 1.35, opacity: tw(f, 12, 22), textAlign: v ? "center" : "left" }}>{sub}</div>}
        {puntos.map((p, i) => {
          const e = tw(f, 20 + i * 8, 30 + i * 8);
          return <div key={i} style={{ fontFamily: t.fuente, fontSize: v ? 32 : 28, fontWeight: 600, color: t.texto, opacity: e, transform: `translateX(${(1 - e) * -30}px)` }}><span style={{ color: t.acento }}>&gt;</span> {p}</div>;
        })}
      </div>
      {grafico}
      <Sfx src="teclado.mp3" en={0} vol={0.15} />
      <Sfx src="ding.mp3" en={Math.round(fSenal)} vol={0.45} />
      <Sfx src="caching.mp3" en={Math.round((senal + 9) * 1.7)} vol={0.3} />
    </AbsoluteFill>
  );
};

/** Terminal que escribe el log del sistema, línea por línea. */
const Terminal: React.FC<Extract<Escena, { tipo: "terminal" }>> = ({ titulo, ventana, lineas, dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { v, w } = useLienzo();
  const ancho = Math.min(w - 160, v ? 960 : 1500);
  const porLinea = Math.max(8, Math.floor((dur - 30) / lineas.length));
  const colores = { ok: t.acento, alerta: t.alarma, dim: t.gris, info: t.texto };
  return (
    <Marco dur={dur} gap={v ? 40 : 30}>
      {titulo && <Titular texto={titulo} entra={0} tam={ajustar([titulo], ancho, v ? 80 : 72)} />}
      <div style={{ width: ancho, borderRadius: 16, background: "#030504", border: `1px solid ${t.borde}`, boxShadow: `0 0 60px ${t.acento}18`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${t.borde}`, fontFamily: t.mono, fontSize: v ? 18 : 22, color: t.gris, letterSpacing: "0.12em" }}>
          {["#FF4D5E", "#F5CE1A", t.acento].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.7 }} />)}
          <span style={{ marginLeft: 10 }}>{ventana}</span>
        </div>
        <div style={{ padding: v ? "26px 28px" : "28px 34px", fontFamily: t.mono, fontSize: v ? 30 : 36, lineHeight: 1.65, minHeight: lineas.length * (v ? 51 : 60) + 20 }}>
          {lineas.map((l, i) => {
            const inicio = 10 + i * porLinea;
            if (f < inicio) return null;
            const n = Math.floor(tw(f, inicio, inicio + Math.min(porLinea - 2, l.t.length * 0.5), 0, l.t.length, (x) => x));
            const ultima = i === Math.min(lineas.length - 1, Math.floor((f - 10) / porLinea));
            return (
              <div key={i} style={{ color: colores[l.tipo ?? "info"] }}>
                <span style={{ color: t.gris }}>&gt; </span>{l.t.slice(0, n)}
                {ultima && <span style={{ color: t.acento, opacity: f % 16 < 8 ? 1 : 0 }}>▋</span>}
              </div>
            );
          })}
        </div>
      </div>
      {lineas.map((l, i) => <Sfx key={i} src={l.tipo === "ok" ? "ding.mp3" : "teclado.mp3"} en={10 + i * porLinea} vol={l.tipo === "ok" ? 0.3 : 0.12} />)}
    </Marco>
  );
};


/** Foto REAL de la persona o su negocio (con su OK): entra de abajo con marco de su marca, Ken Burns lento,
 *  sello con su logo, y al lado (16:9) o debajo (9:16) el titular con puntos que se marcan. */
const Retrato: React.FC<Extract<Escena, { tipo: "retrato" }>> = ({ foto, titulo, etiqueta, puntos = [], lado = "izq", enfoque = "50% 25%", dur }) => {
  const f = useCurrentFrame();
  const t = useTema();
  const { w, h, v, cuad, pad, top, bottom } = useLienzo();
  const src = /^https?:\/\//.test(foto) ? foto : staticFile(foto.replace(/^\//, ""));
  const e = tw(f, 0, 18);
  const kb = interpolate(f, [0, dur], [1.14, 1.0]);
  const pan = interpolate(f, [0, dur], [lado === "izq" ? -2 : 2, 0]);
  // Caja de la foto: columna en 16:9; bloque arriba en 9:16 / 1:1.
  const fw = v ? w - pad * 2 : Math.round(w * 0.4);
  const fh = v ? Math.round((h - top - bottom) * (cuad ? 0.5 : 0.56)) : h - top - bottom - 40;
  const fx = v ? pad : lado === "izq" ? pad : w - pad - fw;
  const fy = v ? top : (h - fh) / 2;
  const radio = v ? 40 : 36;
  const colX = v ? pad : lado === "izq" ? fx + fw + 90 : pad;
  const colW = v ? w - pad * 2 : w - pad * 2 - fw - 90;
  const tam = ajustar([titulo], colW, v ? (cuad ? 76 : 92) : 88, 3);
  const Logo = t.Logo;
  return (
    <AbsoluteFill>
      {/* Marco con el degradado de la marca + halo */}
      <div style={{
        position: "absolute", left: fx - 5, top: fy - 5, width: fw + 10, height: fh + 10, borderRadius: radio + 5,
        background: `linear-gradient(${120 + f * 0.6}deg, ${t.acento}, ${t.acento2}, ${t.acento})`,
        boxShadow: `0 30px 90px ${t.acento}44`, opacity: e,
        clipPath: `inset(${(1 - e) * 100}% 0 0 0 round ${radio + 5}px)`,
      }} />
      <div style={{
        position: "absolute", left: fx, top: fy, width: fw, height: fh, borderRadius: radio, overflow: "hidden",
        clipPath: `inset(${(1 - e) * 100}% 0 0 0 round ${radio}px)`, background: t.superficie,
      }}>
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: enfoque, transform: `scale(${kb}) translateX(${pan}%)` }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 55%, ${t.fondo}cc 100%)` }} />
        {/* Sello: su logo + nombre, como cristal */}
        <div style={{
          position: "absolute", left: 24, bottom: 24, display: "flex", alignItems: "center", gap: 14, padding: "10px 22px 10px 12px",
          borderRadius: 999, background: "rgba(10,16,28,0.55)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
          opacity: tw(f, 16, 26), transform: `translateY(${(1 - tw(f, 16, 28)) * 20}px)`,
        }}>
          <Logo size={v ? 64 : 56} entrada={f - 16} vivo={f > 60} />
          <div style={{ fontFamily: t.fuente, fontWeight: 700, fontSize: v ? 28 : 24, color: "#fff" }}>{t.nombre}</div>
        </div>
      </div>
      {/* Texto */}
      <div style={{
        position: "absolute", left: colX, width: colW, top: v ? fy + fh + 48 : 0, bottom: v ? bottom : 0,
        display: "flex", flexDirection: "column", justifyContent: v ? "flex-start" : "center", gap: v ? 26 : 30,
        alignItems: v ? "center" : "flex-start",
      }}>
        {etiqueta && <Etiqueta texto={etiqueta} entra={8} />}
        <Titular texto={titulo} entra={10} tam={tam} alinear={v ? "center" : "left"} />
        <div style={{ display: "flex", flexDirection: "column", gap: ["linea", "numeral"].includes(useEstilo().tarjeta) ? 0 : 16, width: v ? undefined : colW }}>
          {puntos.map((pt, i) => {
            const en = 26 + i * 12;
            return <Item key={i} i={i} en={en} texto={pt} marca="✓" color={t.acento} activo={tw(f, en + 4, en + 10)} tam={v ? 40 : 36} />;
          })}
        </div>
      </div>
      <Sfx src="whoosh.mp3" en={0} vol={0.3} />
      {puntos.map((_, i) => <Sfx key={i} src="pop.mp3" en={26 + i * 12} vol={0.3} />)}
    </AbsoluteFill>
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
    case "lista": return <Lista {...escena} />;
    case "voz": return <Voz {...escena} />;
    case "agenda": return <Agenda {...escena} />;
    case "pantalla": return <Pantalla {...escena} />;
    case "grafico": return <Grafico {...escena} />;
    case "terminal": return <Terminal {...escena} />;
    case "retrato": return <Retrato {...escena} />;
    case "cierre": return <Cierre {...escena} />;
  }
};
