// Versiones de la película de Level Up (2/oct/2026), horizontal y vertical con la misma línea de tiempo:
//  · "datos"  — Los números hablan (~56 s, música de suspenso: silencio en 8 s, explota en 20 s → el total).
//  · "voces"  — En sus palabras (~1:45, hip hop): Antes → Después → "¿Qué le dirías a un dueño de negocio?".
// Solo hablan los clientes (clips cortados en public/lu-peli/). Cifras: las de la presentación de Canva.
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LEVEL_UP as T } from "../fabrica/temas";
import { Barrido, Destello, Grano, rebote, sacudida, tw } from "../kit/fx";
import { Ambiente, CASOS, Resaltar } from "./LuPelicula";

const ORO = T.acento;
const NEGRO = T.fondo;
const F = T.fuente;
const MONO = T.mono;
const s = (seg: number) => Math.round(seg * 30);

type Dato = { grande: string; chico: string };
type Bloque =
  | { t: "texto"; dur: number; lineas: string[]; susurro?: boolean }
  | { t: "capitulo"; dur: number; texto: string; sub?: string }
  | { t: "casos"; dur: number; idx: number[] }
  | { t: "total"; dur: number }
  | { t: "clip"; video: string; desde: number; hasta: number; nombre: string; negocio: string; frase: string; dato?: Dato }
  | { t: "titulo"; dur: number; lineas: string[] }
  | { t: "cierre"; dur: number };

const durDe = (b: Bloque) => (b.t === "clip" ? s(b.hasta - b.desde) : s(b.dur));

// +24,700 = suma de las conversaciones de los 7 casos que las reportan (1,400 + 6,200 + 2,900 + 4,600 + 3,500 + 2,800 + 3,300).
const TOTAL = 24700;

const BRYAN = { nombre: "Dr. Bryan Vega", negocio: "Quiropráctico · Aguada" };
const ROBERT = { nombre: "Robert", negocio: "RK Automatic Transmission · Caguas" };
const GRISSEL = { nombre: "Dra. Grissel Villanueva", negocio: "Medicina estética · Aguadilla" };
const OLIVER = { nombre: "Oliver Santiago", negocio: "Tinos · Cabo Rojo" };
const MAGDALYS = { nombre: "Magdalys", negocio: "Beauty Salon · Bayamón" };
const REINA = { nombre: "Reina", negocio: "Mr. iPhone · Mayagüez" };
const ERNEST = { nombre: "Lcdo. Ernest Crisson Cancel", negocio: "Abogado" };

export const VERSIONES: Record<string, { musica: string; bloques: Bloque[] }> = {
  datos: {
    musica: "audio/lu-suspenso.mp3",
    bloques: [
      { t: "texto", dur: 2.7, lineas: ["No te vamos a decir", "que somos *los mejores*."] },
      { t: "texto", dur: 2.7, lineas: ["No te vamos a", "*hablar bonito*."] },
      { t: "texto", dur: 2.6, lineas: ["Te vamos a enseñar", "*los números*."] },
      { t: "texto", dur: 1.6, lineas: ["Mira."], susurro: true },
      { t: "casos", dur: 10.7, idx: [2, 4, 5, 7, 3, 6, 1, 0] },
      { t: "total", dur: 3.7 },
      { t: "clip", video: "lu-peli/robert.mp4", desde: 11.74, hasta: 15.57, ...ROBERT, frase: "«Me has *triplicado* los números. Esto sí funciona.»", dato: { grande: "×3", chico: "en sus palabras" } },
      { t: "clip", video: "lu-peli/magdalys-80.mp4", desde: 0, hasta: 6.5, ...MAGDALYS, frase: "«Mis ingresos han subido *sobre un 80 %*.»", dato: { grande: "+80 %", chico: "en sus palabras" } },
      { t: "clip", video: "lu-peli/reina-50.mp4", desde: 4.3, hasta: 10.9, ...REINA, frase: "«Ha incrementado mi negocio *un 50 %*.»", dato: { grande: "+50 %", chico: "en sus palabras" } },
      { t: "clip", video: "lu-peli/ernest-5mil.mp4", desde: 0, hasta: 5.4, ...ERNEST, frase: "«Cerca de *cinco mil dólares más* mensuales.»", dato: { grande: "+$5K/mes", chico: "en sus palabras" } },
      { t: "clip", video: "lu-peli/bryan-numeros.mp4", desde: 4.9, hasta: 13.4, ...BRYAN, frase: "«*25* pacientes nuevos en una semana… luego *30*… y ahora *entre 50 y 60*.»", dato: { grande: "25 → 60", chico: "pacientes nuevos por semana" } },
      { t: "titulo", dur: 2.6, lineas: ["Los resultados", "*hablan.*"] },
      { t: "cierre", dur: 4.2 },
    ],
  },
  voces: {
    musica: "audio/lu-hiphop.mp3",
    bloques: [
      { t: "clip", video: "lu-peli/oliver.mp4", desde: 2.2, hasta: 5.2, ...OLIVER, frase: "«Yo no me esperaba *estos resultados*.»" },
      { t: "titulo", dur: 3.4, lineas: ["Level Up Media", "*en sus palabras.*"] },
      { t: "capitulo", dur: 1.6, texto: "Antes", sub: "01" },
      { t: "clip", video: "lu-peli/magdalys-rojos.mp4", desde: 0, hasta: 4.4, ...MAGDALYS, frase: "«Yo venía en *números rojos*.»" },
      { t: "clip", video: "lu-peli/bryan-miedo.mp4", desde: 0, hasta: 5.4, ...BRYAN, frase: "«Yo tenía *miedo*. No sabía si iba a tener pacientes.»" },
      { t: "clip", video: "lu-peli/reina-antes.mp4", desde: 0, hasta: 4.9, ...REINA, frase: "«Como todo pequeño negocio que está comenzando, *sin clientela fija*.»" },
      { t: "clip", video: "lu-peli/robert-antes.mp4", desde: 0, hasta: 5.1, ...ROBERT, frase: "«Antes siempre era *por recomendaciones*…»" },
      { t: "capitulo", dur: 1.6, texto: "Después", sub: "02" },
      { t: "clip", video: "lu-peli/ernest-numeros.mp4", desde: 2.4, hasta: 10.0, ...ERNEST, frase: "«Los números están. Realmente *no doy abasto* con las llamadas y las citas.»" },
      { t: "clip", video: "lu-peli/reina-50.mp4", desde: 4.3, hasta: 10.9, ...REINA, frase: "«Ha incrementado mi negocio *un 50 %*.»", dato: { grande: "+50 %", chico: "en sus palabras" } },
      { t: "clip", video: "lu-peli/magdalys-80.mp4", desde: 0, hasta: 6.5, ...MAGDALYS, frase: "«Mis ingresos han subido *sobre un 80 %*.»", dato: { grande: "+80 %", chico: "en sus palabras" } },
      { t: "clip", video: "lu-peli/bryan-numeros.mp4", desde: 4.9, hasta: 15.95, ...BRYAN, frase: "«*25*… luego *30*… esta semana *entre 50 y 60*. Y apenas van *ocho semanas*.»", dato: { grande: "25 → 60", chico: "pacientes nuevos por semana" } },
      { t: "clip", video: "lu-peli/robert.mp4", desde: 11.74, hasta: 15.57, ...ROBERT, frase: "«Me has *triplicado* los números. Esto sí funciona.»", dato: { grande: "×3", chico: "en sus palabras" } },
      { t: "casos", dur: 5.2, idx: [2, 4, 5, 7] },
      { t: "total", dur: 2.8 },
      { t: "capitulo", dur: 2.2, texto: "¿Y qué le dirías a un dueño de negocio?", sub: "03" },
      { t: "clip", video: "lu-peli/oliver-cuenten.mp4", desde: 0, hasta: 11.3, ...OLIVER, frase: "«Cuenten con esta compañía… te van a dar *resultados que yo no creía*.»" },
      { t: "clip", video: "lu-peli/reina-invierte.mp4", desde: 0, hasta: 10.0, ...REINA, frase: "«Que inviertan en el marketing, porque es lo que *les va a dar el resultado*.»" },
      { t: "clip", video: "lu-peli/robert-redes.mp4", desde: 0, hasta: 3.8, ...ROBERT, frase: "«Si no estás en las redes, *no vas a ver crecimiento*.»" },
      { t: "clip", video: "lu-peli/bryan-accion.mp4", desde: 0, hasta: 3.45, ...BRYAN, frase: "«No lo pienses. *Toma acción.*»" },
      { t: "clip", video: "lu-peli/robert-llama.mp4", desde: 0, hasta: 2.33, ...ROBERT, frase: "«Llama a Level Up, que *de verdad funciona*.»" },
      { t: "cierre", dur: 4.5 },
    ],
  },
};

export const duracionVersion = (v: string) => VERSIONES[v].bloques.reduce((a, b) => a + durDe(b), 0);

/* ─────────────── Piezas ─────────────── */
const useLienzo = () => {
  const { width, height } = useVideoConfig();
  return { W: width, H: height, v: height > width };
};

const LogoMini: React.FC<{ op?: number }> = ({ op = 1 }) => {
  const { v } = useLienzo();
  return <Img src={staticFile("marcas/level-up-logo-dark.png")} style={{ position: "absolute", right: v ? 60 : 70, top: v ? 70 : 56, width: v ? 170 : 150, opacity: 0.92 * op }} />;
};
const Legal: React.FC<{ op?: number }> = ({ op = 1 }) => {
  const { v } = useLienzo();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: v ? 70 : 32, textAlign: "center", fontFamily: MONO, fontSize: v ? 20 : 16, letterSpacing: ".14em", color: "rgba(245,241,232,.5)", opacity: op }}>
      RESULTADOS DE CLIENTES REALES · CADA NEGOCIO ES DISTINTO
    </div>
  );
};

const Texto: React.FC<{ b: Extract<Bloque, { t: "texto" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v } = useLienzo();
  const fin = s(b.dur);
  const sale = 1 - tw(f, fin - 6, fin);
  return (
    <AbsoluteFill style={{ background: NEGRO, alignItems: "center", justifyContent: "center", padding: v ? 70 : 140 }}>
      <AbsoluteFill style={{ background: "radial-gradient(45% 40% at 50% 50%, rgba(245,206,26,.07), transparent 70%)" }} />
      {b.lineas.map((l, i) => {
        const e = f - i * 12;
        return (
          <div key={i} style={{ fontFamily: F, fontWeight: b.susurro ? 500 : 800, fontSize: b.susurro ? (v ? 70 : 64) : v ? 104 : 118, letterSpacing: b.susurro ? ".3em" : "-0.03em",
            color: T.texto, textAlign: "center", lineHeight: 1.06, opacity: tw(e, 0, 10) * sale, filter: `blur(${tw(e, 0, 12, 14, 0)}px)`, transform: `translateY(${tw(e, 0, 14, 20, 0)}px)` }}>
            <Resaltar texto={l} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Capitulo: React.FC<{ b: Extract<Bloque, { t: "capitulo" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v } = useLienzo();
  const sh = sacudida(f, 2, 14, 10);
  return (
    <AbsoluteFill style={{ background: ORO, alignItems: "center", justifyContent: "center", padding: v ? 80 : 160, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      {b.sub && <div style={{ fontFamily: MONO, fontSize: v ? 34 : 30, letterSpacing: ".3em", color: NEGRO, opacity: tw(f, 0, 6) }}>{b.sub}</div>}
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: b.texto.length > 12 ? (v ? 96 : 104) : v ? 190 : 220, color: NEGRO, letterSpacing: "-0.04em", textAlign: "center", lineHeight: 1.02,
        transform: `scale(${0.85 + 0.15 * rebote(f, 0, 16)})` }}>{b.texto}</div>
    </AbsoluteFill>
  );
};

const Casos: React.FC<{ b: Extract<Bloque, { t: "casos" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v, W } = useLienzo();
  const cada = s(b.dur) / b.idx.length;
  const k = Math.min(b.idx.length - 1, Math.floor(f / cada));
  const c = CASOS[b.idx[k]];
  const e = f - k * cada;
  const n = c.num ? Math.round(tw(e, 2, cada * 0.75, 0, c.num)) : 0;
  const dato = c.num ? `${c.pre}${n.toLocaleString("en-US")}` : c.dato;
  const anchoP = v ? 1000 : 1240;
  return (
    <AbsoluteFill>
      <Ambiente />
      <div style={{ position: "absolute", left: (W - anchoP) / 2, top: v ? 360 : 70, width: anchoP, transform: `scale(${tw(e, 0, cada, 1.08, 1)}) rotate(${(k % 2 ? 1 : -1) * tw(e, 0, 8, 2, 0)}deg)`, opacity: tw(e, 0, 4) }}>
        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(245,206,26,.3)" }}>
          <div style={{ height: 32, background: "#1c1c1e", display: "flex", alignItems: "center", gap: 7, padding: "0 14px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((col) => <div key={col} style={{ width: 11, height: 11, borderRadius: 6, background: col }} />)}
            <div style={{ marginLeft: 12, fontFamily: MONO, fontSize: 14, color: "#9a9a9a" }}>Administrador de anuncios · Meta</div>
          </div>
          <Img src={staticFile(`lu-peli/casos/${c.img}.jpg`)} style={{ width: "100%", display: "block", height: v ? 470 : 520, objectFit: "cover", objectPosition: "top left" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? 900 : 650, textAlign: "center", padding: "0 60px" }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: v ? 150 : 150, color: ORO, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
          transform: `scale(${0.8 + 0.2 * rebote(e, 0, 14)})` }}>{dato}</div>
        <div style={{ fontFamily: MONO, fontSize: v ? 28 : 24, letterSpacing: ".24em", color: T.gris, marginTop: 10 }}>{c.num ? "CONVERSACIONES" : "RESULTADO"}</div>
        <div style={{ fontFamily: F, fontWeight: 700, fontSize: v ? 50 : 44, color: T.texto, marginTop: v ? 30 : 18 }}>{c.nombre}</div>
      </div>
      <Destello en={Math.round(k * cada)} color={ORO} max={0.14} dur={5} />
      <LogoMini />
      <Legal />
    </AbsoluteFill>
  );
};

const Total: React.FC<{ b: Extract<Bloque, { t: "total" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v } = useLienzo();
  const n = Math.round(tw(f, 0, s(b.dur) * 0.6, 0, TOTAL));
  const sh = sacudida(f, 0, 24, 14);
  return (
    <AbsoluteFill>
      <Ambiente intensidad={1.4} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: v ? 230 : 300, color: ORO, letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums", textShadow: "0 0 80px rgba(245,206,26,.35)" }}>
          +{n.toLocaleString("en-US")}
        </div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: v ? 80 : 84, color: T.texto, letterSpacing: "-0.02em", marginTop: 6 }}>conversaciones</div>
        <div style={{ fontFamily: MONO, fontSize: v ? 28 : 26, letterSpacing: ".2em", color: T.gris, marginTop: 20, opacity: tw(f, 30, 44), textAlign: "center", padding: "0 60px" }}>
          PARA 7 DE NUESTROS CLIENTES · Y CONTANDO
        </div>
      </AbsoluteFill>
      <Destello en={0} color="#FFF6CC" max={0.6} dur={14} />
      <LogoMini />
    </AbsoluteFill>
  );
};

const Clip: React.FC<{ b: Extract<Bloque, { t: "clip" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v, H } = useLienzo();
  const fin = s(b.hasta - b.desde);
  const sale = 1 - tw(f, fin - 5, fin);
  const datoE = f - 18;
  const video = <OffthreadVideo src={staticFile(b.video)} trimBefore={s(b.desde)} trimAfter={s(b.hasta)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  if (v) {
    return (
      <AbsoluteFill style={{ background: NEGRO }}>
        <AbsoluteFill style={{ transform: `scale(${tw(f, 0, fin, 1.08, 1.0)})` }}>{video}</AbsoluteFill>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,11,11,.7) 0%, rgba(11,11,11,0) 14%, rgba(11,11,11,0) 52%, rgba(11,11,11,.82) 66%, rgba(11,11,11,.96) 100%)" }} />
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 400, opacity: sale }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 64, lineHeight: 1.12, color: T.texto, letterSpacing: "-0.02em", textWrap: "balance", opacity: tw(f, 2, 10), transform: `translateY(${tw(f, 2, 12, 24, 0)}px)` } as React.CSSProperties}>
            <Resaltar texto={b.frase} />
          </div>
          {b.dato && (
            <div style={{ marginTop: 20, opacity: tw(datoE, 0, 8) }}>
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: b.dato.grande.length > 6 ? 110 : 150, color: ORO, letterSpacing: "-0.04em", lineHeight: 1, transform: `scale(${0.7 + 0.3 * rebote(datoE, 0, 16)})`, transformOrigin: "left center", whiteSpace: "nowrap" }}>{b.dato.grande}</div>
              <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: ".18em", color: T.gris, textTransform: "uppercase", marginTop: 6 }}>{b.dato.chico}</div>
            </div>
          )}
        </div>
        <div style={{ position: "absolute", left: 60, right: 60, top: H - 330, opacity: tw(f, 6, 14) * sale }}>
          <div style={{ width: 80, height: 6, borderRadius: 3, background: ORO, marginBottom: 16 }} />
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 52, color: T.texto }}>{b.nombre}</div>
          <div style={{ fontFamily: F, fontSize: 32, color: T.gris, marginTop: 4 }}>{b.negocio}</div>
        </div>
        <LogoMini op={sale} />
        <Legal op={sale} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: NEGRO }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 860, height: 1080, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${tw(f, 0, fin, 1.08, 1.0)})` }}>{video}</div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,11,11,0) 60%, rgba(11,11,11,1) 100%)" }} />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(40% 50% at 75% 50%, rgba(245,206,26,.08), transparent 70%)" }} />
      <div style={{ position: "absolute", left: 900, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, opacity: sale }}>
        <div style={{ opacity: tw(f, 4, 14), transform: `translateX(${tw(f, 4, 14, -24, 0)}px)` }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 52, color: T.texto }}>{b.nombre}</div>
          <div style={{ fontFamily: F, fontSize: 28, color: T.gris, marginTop: 6 }}>{b.negocio}</div>
        </div>
        <div style={{ width: tw(f, 8, 24, 0, 110), height: 5, borderRadius: 3, background: ORO }} />
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 64, lineHeight: 1.14, color: T.texto, letterSpacing: "-0.02em", textWrap: "balance", opacity: tw(f, 2, 10), transform: `translateY(${tw(f, 2, 12, 22, 0)}px)` } as React.CSSProperties}>
          <Resaltar texto={b.frase} />
        </div>
        {b.dato && (
          <div style={{ opacity: tw(datoE, 0, 8) }}>
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: b.dato.grande.length > 6 ? 104 : 140, color: ORO, letterSpacing: "-0.04em", lineHeight: 1, transform: `scale(${0.7 + 0.3 * rebote(datoE, 0, 16)})`, transformOrigin: "left center", whiteSpace: "nowrap" }}>{b.dato.grande}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: ".18em", color: T.gris, textTransform: "uppercase", marginTop: 6 }}>{b.dato.chico}</div>
          </div>
        )}
      </div>
      <LogoMini op={sale} />
      <Legal op={sale} />
    </AbsoluteFill>
  );
};

const Titulo: React.FC<{ b: Extract<Bloque, { t: "titulo" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v } = useLienzo();
  return (
    <AbsoluteFill>
      <Ambiente />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: v ? 70 : 140 }}>
        {b.lineas.map((l, i) => {
          const e = f - i * 10;
          return <div key={i} style={{ fontFamily: F, fontWeight: 800, fontSize: v ? 120 : 140, color: T.texto, letterSpacing: "-0.03em", lineHeight: 1.04, textAlign: "center",
            opacity: tw(e, 0, 8), transform: `scale(${1.12 - 0.12 * tw(e, 0, 14)})` }}><Resaltar texto={l} /></div>;
        })}
      </AbsoluteFill>
      <Destello en={0} color={ORO} max={0.2} dur={8} />
    </AbsoluteFill>
  );
};

const Cierre: React.FC<{ b: Extract<Bloque, { t: "cierre" }> }> = ({ b }) => {
  const f = useCurrentFrame();
  const { v } = useLienzo();
  const sh = sacudida(f, 2, 16, 12);
  const fin = s(b.dur);
  return (
    <AbsoluteFill style={{ opacity: 1 - tw(f, fin - 10, fin) }}>
      <Ambiente />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: v ? 60 : 40, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: v ? 150 : 200, color: ORO, letterSpacing: "-0.04em", transform: `scale(${0.7 + 0.3 * rebote(f, 2, 20)})`, opacity: tw(f, 0, 6), textShadow: "0 0 60px rgba(245,206,26,.35)" }}>
          Comencemos.
        </div>
        <div style={{ opacity: tw(f, 24, 40) }}><T.Firma size={v ? 420 : 300} entrada={f - 24} /></div>
        <div style={{ fontFamily: MONO, fontSize: v ? 28 : 24, letterSpacing: ".3em", color: T.gris, opacity: tw(f, 50, 66), textAlign: "center" }}>+100 NEGOCIOS EN PUERTO RICO</div>
      </AbsoluteFill>
      <Destello en={2} color="#FFF6CC" max={0.5} dur={12} />
    </AbsoluteFill>
  );
};

const Pieza: React.FC<{ b: Bloque }> = ({ b }) => {
  switch (b.t) {
    case "texto": return <Texto b={b} />;
    case "capitulo": return <Capitulo b={b} />;
    case "casos": return <Casos b={b} />;
    case "total": return <Total b={b} />;
    case "clip": return <Clip b={b} />;
    case "titulo": return <Titulo b={b} />;
    case "cierre": return <Cierre b={b} />;
  }
};

export const LuVersion: React.FC<{ version: string }> = ({ version }) => {
  const { musica, bloques } = VERSIONES[version];
  const inicios = bloques.reduce<number[]>((a, b, i) => [...a, i === 0 ? 0 : a[i - 1] + durDe(bloques[i - 1])], []);
  const total = inicios[inicios.length - 1] + durDe(bloques[bloques.length - 1]);
  const volumen = (fr: number) => {
    const i = inicios.findIndex((ini, k) => fr >= ini && fr < ini + durDe(bloques[k]));
    const hablan = bloques[Math.max(0, i)]?.t === "clip";
    const fin = interpolate(fr, [total - 40, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (hablan ? 0.12 : 0.8) * fin;
  };
  return (
    <AbsoluteFill style={{ background: NEGRO }}>
      {bloques.map((b, i) => (
        <Sequence key={i} from={inicios[i]} durationInFrames={durDe(b)}>
          <Pieza b={b} />
        </Sequence>
      ))}
      {inicios.slice(1).map((c, i) => {
        const b = bloques[i + 1];
        if (b.t === "texto" || bloques[i].t === "texto") return null; // el inicio con texto va por corte seco (suspenso)
        return <Barrido key={c} centro={c} dur={10} colores={[ORO, "#FFE27A", NEGRO]} angulo={i % 2 ? 12 : -12} />;
      })}
      <Grano />
      <Audio src={staticFile(musica)} volume={(fr) => volumen(fr)} />
      {inicios.slice(1).map((c, i) => (bloques[i + 1].t === "texto" ? null : <Sequence key={`w${c}`} from={Math.max(0, c - 5)} durationInFrames={30}><Audio src={staticFile("audio/whoosh.mp3")} volume={0.3} /></Sequence>))}
      {inicios.map((c, i) => (bloques[i].t === "total" || bloques[i].t === "capitulo" || bloques[i].t === "cierre" ? <Sequence key={`i${c}`} from={c} durationInFrames={60}><Audio src={staticFile("audio/impacto.mp3")} volume={0.55} /></Sequence> : null))}
    </AbsoluteFill>
  );
};
