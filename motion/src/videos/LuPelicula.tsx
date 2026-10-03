// "La película" de Level Up (2/oct/2026): la presentación de Canva de Level Up convertida en motion.
// Testimonios REALES recortados (solo habla el cliente), los 8 casos con sus capturas del Administrador de Anuncios,
// el método (motor de crecimiento) animado y el cierre "Comencemos.". Textos y cifras: tal cual la presentación.
// Medios en public/lu-peli/ (clips cortados de los reels del Canva + capturas). Render:
//   npx remotion render src/index.ts LuPelicula out/fabrica/lu-pelicula.mp4
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { LEVEL_UP as T } from "../fabrica/temas";
import { Barrido, Destello, Grano, inOut, rebote, sacudida, tw } from "../kit/fx";

const ORO = T.acento; // #F5CE1A
const NEGRO = T.fondo;
const F = T.fuente; // Sora
const MONO = T.mono;

/* ─────────────── Datos (de la presentación de Canva) ─────────────── */
export type Caso = { img: string; nombre: string; desc: string; dato: string; num?: number; pre?: string; suf?: string };
export const CASOS: Caso[] = [
  { img: "magdalys", nombre: "Magdalys — Beauty Salon", desc: "Pasó de operar en números rojos a generar más de $15K mensuales.", dato: "Más de $15K mensuales" },
  { img: "claro", nombre: "Edgard Cortés — Franquicias Claro", desc: "Campañas desde $1.02 por conversación, impulsando sus operaciones de Claro en Puerto Rico.", dato: "+1,400 conversaciones", num: 1400, pre: "+", suf: " conversaciones" },
  { img: "interior", nombre: "Home Interior Design", desc: "Clientes interesados en muebles y diseño de interiores, con campañas desde $0.58 por conversación.", dato: "+6,200 conversaciones", num: 6200, pre: "+", suf: " conversaciones" },
  { img: "grissel", nombre: "Dra. Grissel Villanueva", desc: "Estética, bótox, lifting y pérdida de peso, con campañas desde $1.03 por conversación.", dato: "+2,900 conversaciones", num: 2900, pre: "+", suf: " conversaciones" },
  { img: "rk", nombre: "RK Transmission", desc: "Más de +4,600 conversaciones para diagnóstico y reparación.", dato: "Triplicó sus ventas" },
  { img: "lorelys", nombre: "Dra. Lorelys Mojica", desc: "Campañas desde $0.95 y alcance de +398K personas.", dato: "+3,500 conversaciones", num: 3500, pre: "+", suf: " conversaciones" },
  { img: "universidad", nombre: "Universidad Teológica Vida Abundante", desc: "También +3,900 visitas a la plataforma, desde $0.36 por conversación.", dato: "+2,800 conversaciones", num: 2800, pre: "+", suf: " conversaciones" },
  { img: "pepino", nombre: "Pepino Gun Gallery", desc: "Crecimiento de membresía y promoción en 3 localidades, desde $2.35 por conversación.", dato: "+3,300 conversaciones", num: 3300, pre: "+", suf: " conversaciones" },
];

export const FASES = [
  { n: "01", t: "Enganchar", d: "Captar la atención del cliente ideal." },
  { n: "02", t: "Solucionar", d: "Mostrar que resuelves su problema." },
  { n: "03", t: "Envolver", d: "Conectar emocionalmente con la marca." },
  { n: "04", t: "Fidelizar", d: "Retener y cuidar al cliente." },
  { n: "05", t: "Reproducir", d: "Escalar lo que ya funciona." },
];

type Frase = { desde: number; texto: string }; // segundos dentro del clip; *palabra* = resaltado
type Testi = { video: string; dur: number; forma: "vertical" | "cuadrado" | "mini"; nombre: string; negocio: string; frases: Frase[]; dato?: { desde: number; grande: string; chico: string } };
const TESTI: Record<string, Testi> = {
  bryanMiedo: { video: "lu-peli/bryan-miedo.mp4", dur: 21.75, forma: "vertical", nombre: "Dr. Bryan Vega", negocio: "Quiropráctico · Aguada",
    frases: [{ desde: 0, texto: "«Yo tenía *miedo*. No sabía si iba a tener pacientes.»" }, { desde: 8.8, texto: "«Te voy a *llenar la agenda*.»" },
      { desde: 12.5, texto: "«Y así mismo fue.»" }, { desde: 17.5, texto: "«Van dos meses de *agenda llena*.»" }, { desde: 20.2, texto: "«Pasé de *no tener nada*…»" }] },
  robert: { video: "lu-peli/robert.mp4", dur: 15.57, forma: "cuadrado", nombre: "Robert", negocio: "RK Automatic Transmission · Caguas",
    frases: [{ desde: 0, texto: "«El flujo de *llamadas y mensajes* diarios… bastante grande.»" }, { desde: 4, texto: "«Antes era por recomendaciones. Ahora, *todo por las redes*.»" },
      { desde: 11.7, texto: "«Me has *triplicado* los números. Esto sí funciona.»" }],
    dato: { desde: 13.5, grande: "×3", chico: "vs. la misma fecha del año pasado" } },
  clienta: { video: "lu-peli/clienta-30k.mp4", dur: 9.1, forma: "mini", nombre: "Clienta de Level Up", negocio: "Por videollamada",
    frases: [{ desde: 0, texto: "«Cuando comenzamos con ustedes estábamos en los *30 mil*…»" }, { desde: 4.6, texto: "«…y ya tocamos los *100*.»" }],
    dato: { desde: 4.8, grande: "$30K → $100K", chico: "en sus palabras" } },
  grissel: { video: "lu-peli/grissel.mp4", dur: 9.9, forma: "vertical", nombre: "Dra. Grissel Villanueva", negocio: "Medicina estética · Aguadilla",
    frases: [{ desde: 0, texto: "«El resultado ha sido *bien notable*.»" }, { desde: 3.4, texto: "«Un *alza increíble* en los leads para los tratamientos.»" }] },
  oliver: { video: "lu-peli/oliver.mp4", dur: 13.57, forma: "vertical", nombre: "Oliver Santiago", negocio: "Tinos · Cabo Rojo",
    frases: [{ desde: 0, texto: "«Ha sido una *experiencia única*.»" }, { desde: 2.3, texto: "«Yo no me esperaba *estos resultados*.»" },
      { desde: 7.6, texto: "«Números que *nunca pensaba* imaginarme hacer.»" }] },
  magdalys: { video: "lu-peli/magdalys-80.mp4", dur: 6.5, forma: "vertical", nombre: "Magdalys", negocio: "Beauty Salon · Bayamón",
    frases: [{ desde: 0, texto: "«Mis ingresos y todo el negocio han subido *sobre un 80 %* desde que comencé con ustedes.»" }],
    dato: { desde: 3.2, grande: "+80 %", chico: "en sus palabras" } },
  reina: { video: "lu-peli/reina-50.mp4", dur: 10.9, forma: "vertical", nombre: "Reina", negocio: "Mr. iPhone · Mayagüez",
    frases: [{ desde: 0, texto: "«Mayor clientela, *mayor flujo de llamadas* y de mensajes.»" }, { desde: 4.4, texto: "«Ha incrementado mi negocio *un 50 %*.»" }],
    dato: { desde: 6.6, grande: "+50 %", chico: "en sus palabras" } },
  ernest: { video: "lu-peli/ernest-5mil.mp4", dur: 5.4, forma: "cuadrado", nombre: "Lcdo. Ernest Crisson Cancel", negocio: "Abogado",
    frases: [{ desde: 0, texto: "«Puede estar representando cerca de *cinco mil dólares más* mensuales.»" }],
    dato: { desde: 2.6, grande: "+$5K/mes", chico: "en sus palabras" } },
  bryanNumeros: { video: "lu-peli/bryan-numeros.mp4", dur: 16.23, forma: "vertical", nombre: "Dr. Bryan Vega", negocio: "Quiropráctico · Aguada",
    frases: [{ desde: 0, texto: "«Empezamos con *25 pacientes nuevos* en una semana…»" }, { desde: 8.6, texto: "«…luego *30*…»" },
      { desde: 10.6, texto: "«…y esta última semana, *entre 50 y 60*.»" }, { desde: 14.2, texto: "«Y apenas van *ocho semanas*.»" }] },
  robertLlama: { video: "lu-peli/robert-llama.mp4", dur: 2.33, forma: "cuadrado", nombre: "Robert", negocio: "RK Automatic Transmission",
    frases: [{ desde: 0, texto: "«Llama a Level Up, que *de verdad funciona*.»" }] },
  bryanAccion: { video: "lu-peli/bryan-accion.mp4", dur: 3.45, forma: "vertical", nombre: "Dr. Bryan Vega", negocio: "Quiropráctico · Aguada",
    frases: [{ desde: 0, texto: "«No lo pienses. *Toma acción.*»" }] },
};

/* ─────────────── Línea de tiempo ─────────────── */
const s = (seg: number) => Math.round(seg * 30);
const BLOQUES: { id: string; dur: number; testi?: keyof typeof TESTI }[] = [
  { id: "apertura", dur: 270 },
  { id: "t", dur: s(TESTI.bryanMiedo.dur), testi: "bryanMiedo" },
  { id: "casos", dur: 60 + CASOS.length * 66 },
  { id: "t", dur: s(TESTI.robert.dur), testi: "robert" },
  { id: "t", dur: s(TESTI.magdalys.dur), testi: "magdalys" },
  { id: "t", dur: s(TESTI.reina.dur), testi: "reina" },
  { id: "t", dur: s(TESTI.ernest.dur), testi: "ernest" },
  { id: "t", dur: s(TESTI.oliver.dur), testi: "oliver" },
  { id: "t", dur: s(TESTI.bryanNumeros.dur), testi: "bryanNumeros" },
  { id: "tecnologia", dur: 165 },
  { id: "metodo", dur: 390 },
  { id: "t", dur: s(TESTI.robertLlama.dur), testi: "robertLlama" },
  { id: "t", dur: s(TESTI.bryanAccion.dur), testi: "bryanAccion" },
  { id: "cierre", dur: 255 },
];
const INICIOS = BLOQUES.reduce<number[]>((a, b, i) => [...a, i === 0 ? 0 : a[i - 1] + BLOQUES[i - 1].dur], []);
export const DURACION_LU_PELICULA = INICIOS[INICIOS.length - 1] + BLOQUES[BLOQUES.length - 1].dur;

/* ─────────────── Piezas comunes ─────────────── */
export const Resaltar: React.FC<{ texto: string; color?: string }> = ({ texto, color = ORO }) => (
  <>{texto.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith("*") ? <span key={i} style={{ color }}>{p.slice(1, -1)}</span> : <React.Fragment key={i}>{p}</React.Fragment>))}</>
);

export const Ambiente: React.FC<{ intensidad?: number }> = ({ intensidad = 1 }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const x = 50 + noise2D("lx", f / 140, 0) * 20;
  const y = 40 + noise2D("ly", 0, f / 140) * 15;
  return (
    <AbsoluteFill style={{ background: NEGRO }}>
      <AbsoluteFill style={{ background: `radial-gradient(55% 65% at ${x}% ${y}%, rgba(245,206,26,${0.13 * intensidad}) 0%, transparent 70%)` }} />
      <AbsoluteFill style={{
        backgroundImage: "linear-gradient(rgba(245,206,26,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(245,206,26,.07) 1px, transparent 1px)",
        backgroundSize: "90px 90px", backgroundPosition: `${(f * 0.5) % 90}px ${(f * 0.25) % 90}px`,
        maskImage: "radial-gradient(65% 65% at 50% 50%, black 0%, transparent 100%)", opacity: 0.7 * intensidad,
      }} />
      {new Array(30).fill(0).map((_, i) => {
        const vel = 0.25 + random(`v${i}`) * 0.8;
        const py = (random(`y${i}`) * H - f * vel * 1.3 + H * 10) % H;
        const px = random(`x${i}`) * W + noise2D(`n${i}`, f / 100, i) * 26;
        const r = 1 + random(`r${i}`) * 2.2;
        return <div key={i} style={{ position: "absolute", left: px, top: py, width: r * 2, height: r * 2, borderRadius: r, background: ORO, opacity: (0.1 + random(`o${i}`) * 0.3) * intensidad }} />;
      })}
    </AbsoluteFill>
  );
};

const LogoMini: React.FC<{ op?: number }> = ({ op = 1 }) => (
  <Img src={staticFile("marcas/level-up-logo-dark.png")} style={{ position: "absolute", right: 70, top: 56, width: 150, opacity: 0.9 * op }} />
);

const Legal: React.FC<{ op?: number }> = ({ op = 1 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: MONO, fontSize: 17, letterSpacing: ".14em", color: "rgba(245,241,232,.45)", opacity: op }}>
    RESULTADOS DE CLIENTES REALES · CADA NEGOCIO ES DISTINTO
  </div>
);

/* ─────────────── 1 · Apertura: las cifras golpean y despega el logo ─────────────── */
const GOLPES = ["+6,200", "+4,600", "+3,500", "+3,300", "+2,900", "×3", "$15K/mes"];
const Apertura: React.FC = () => {
  const f = useCurrentFrame();
  const paso = 11;
  const i = Math.min(GOLPES.length - 1, Math.floor(f / paso));
  const enCifras = f < GOLPES.length * paso;
  const sh = sacudida(f, i * paso, 14, 8);
  const logoE = f - GOLPES.length * paso;
  return (
    <AbsoluteFill>
      <Ambiente intensidad={enCifras ? 0.4 : 1} />
      {enCifras && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${sh.x}px, ${sh.y}px)` }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 300, letterSpacing: "-0.04em", color: i % 2 ? T.texto : ORO, transform: `scale(${1.25 - 0.25 * tw(f - i * paso, 0, 6)})`, opacity: tw(f - i * paso, 0, 3) }}>
            {GOLPES[i]}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: ".3em", color: "rgba(245,241,232,.6)", marginTop: 6 }}>RESULTADOS DE NUESTROS CLIENTES</div>
        </AbsoluteFill>
      )}
      {!enCifras && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 34 }}>
          <T.Firma size={560} entrada={logoE} />
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: ".34em", color: ORO, opacity: tw(logoE, 22, 36) }}>MARKETING DIGITAL Y PUBLICIDAD · PUERTO RICO + USA</div>
          <div style={{ fontFamily: F, fontWeight: 700, fontSize: 64, color: T.texto, letterSpacing: "-0.02em", opacity: tw(logoE, 34, 50), transform: `translateY(${tw(logoE, 34, 50, 24, 0)}px)` }}>
            La agencia <span style={{ color: ORO }}>#1</span> de marketing en Puerto Rico.
          </div>
          <div style={{ fontFamily: F, fontSize: 34, color: T.gris, opacity: tw(logoE, 56, 72) }}>Marketing de crecimiento con datos que despegan.</div>
        </AbsoluteFill>
      )}
      {GOLPES.map((_, k) => <Destello key={k} en={k * paso} color={ORO} max={0.18} dur={6} />)}
      <Destello en={GOLPES.length * paso} color="#FFF6CC" max={0.55} dur={14} />
    </AbsoluteFill>
  );
};

/* ─────────────── Testimonio: el cliente al lado de sus palabras ─────────────── */
const Testimonio: React.FC<{ t: Testi }> = ({ t }) => {
  const f = useCurrentFrame();
  const seg = f / 30;
  const frase = [...t.frases].reverse().find((x) => seg >= x.desde) ?? t.frases[0];
  const ef = f - s(frase.desde);
  const entra = tw(f, 0, 18);
  const dims = t.forma === "cuadrado" ? { w: 780, h: 780 } : t.forma === "mini" ? { w: 470, h: 840 } : { w: 506, h: 900 };
  const sale = 1 - tw(f, s(t.dur) - 8, s(t.dur));
  const dato = t.dato && seg >= t.dato.desde ? f - s(t.dato.desde) : -1;
  return (
    <AbsoluteFill style={{ background: NEGRO }}>
      <OffthreadVideo src={staticFile(t.video)} muted style={{ position: "absolute", inset: -60, width: "calc(100% + 120px)", height: "calc(100% + 120px)", objectFit: "cover", filter: "blur(40px) brightness(.28) saturate(1.1)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,11,11,.2) 0%, rgba(11,11,11,.75) 55%, rgba(11,11,11,.92) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(40% 50% at 22% 50%, rgba(245,206,26,.10), transparent 70%)" }} />
      <div style={{
        position: "absolute", left: 200 - (dims.w - 506) / 2 + (t.forma === "cuadrado" ? 90 : 0), top: (1080 - dims.h) / 2, width: dims.w, height: dims.h, borderRadius: 30, overflow: "hidden",
        border: "2px solid rgba(245,206,26,.45)", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 80px rgba(245,206,26,.12)",
        transform: `scale(${0.9 + 0.1 * entra}) translateY(${(1 - entra) * 40}px)`, opacity: entra * sale,
      }}>
        <OffthreadVideo src={staticFile(t.video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: t.forma === "cuadrado" ? 1010 : 830, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, opacity: sale }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: ".3em", color: ORO, opacity: tw(f, 6, 20) }}>LO DICEN ELLOS</div>
        <div style={{ opacity: tw(f, 10, 26), transform: `translateX(${tw(f, 10, 26, -30, 0)}px)` }}>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 60, color: T.texto, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{t.nombre}</div>
          <div style={{ fontFamily: F, fontSize: 30, color: T.gris, marginTop: 10 }}>{t.negocio}</div>
        </div>
        <div style={{ width: tw(f, 14, 34, 0, 120), height: 5, borderRadius: 3, background: ORO }} />
        <div key={frase.desde} style={{ fontFamily: F, fontWeight: 700, fontSize: t.forma === "cuadrado" ? 58 : 66, lineHeight: 1.16, color: T.texto, letterSpacing: "-0.015em", textWrap: "balance",
          opacity: tw(ef, 0, 8), transform: `translateY(${tw(ef, 0, 10, 22, 0)}px)` } as React.CSSProperties}>
          <Resaltar texto={frase.texto} />
        </div>
        {t.dato && dato >= 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: t.dato.grande.length > 4 ? "column" : "row", alignItems: t.dato.grande.length > 4 ? "flex-start" : "baseline", gap: t.dato.grande.length > 4 ? 6 : 20, opacity: tw(dato, 0, 8) }}>
            <div style={{ fontFamily: F, fontWeight: 800, fontSize: t.dato.grande.length > 4 ? 100 : 120, whiteSpace: "nowrap", color: ORO, letterSpacing: "-0.04em", lineHeight: 1, transform: `scale(${0.6 + 0.4 * rebote(dato, 0, 18)})`, transformOrigin: "left center" }}>{t.dato.grande}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: ".14em", color: T.gris, textTransform: "uppercase", maxWidth: 260 }}>{t.dato.chico}</div>
          </div>
        )}
      </div>
      <LogoMini op={sale} />
      <Legal op={tw(f, 20, 40) * sale} />
    </AbsoluteFill>
  );
};

/* ─────────────── Casos: las capturas reales del Administrador de Anuncios ─────────────── */
const Casos: React.FC = () => {
  const f = useCurrentFrame();
  const intro = 60, cada = 66;
  if (f < intro) {
    const sh = sacudida(f, 26, 12, 10);
    return (
      <AbsoluteFill>
        <Ambiente />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translate(${sh.x}px, ${sh.y}px)` }}>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: ".34em", color: ORO, opacity: tw(f, 0, 10) }}>RESULTADOS DE NUESTROS CLIENTES</div>
          <div style={{ fontFamily: F, fontWeight: 800, fontSize: 130, color: T.texto, letterSpacing: "-0.03em", marginTop: 18, transform: `scale(${1.15 - 0.15 * tw(f, 4, 20)})`, opacity: tw(f, 4, 14) }}>
            Los números <span style={{ color: ORO }}>no mienten.</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const k = Math.min(CASOS.length - 1, Math.floor((f - intro) / cada));
  const c = CASOS[k];
  const e = f - intro - k * cada;
  const n = c.num ? Math.round(tw(e, 8, 40, 0, c.num)) : 0;
  const dato = c.num ? `${c.pre}${n.toLocaleString("en-US")}${c.suf}` : c.dato;
  const empuje = tw(e, 0, cada, 1.0, 1.06, inOut);
  const lado = k % 2 === 0;
  return (
    <AbsoluteFill>
      <Ambiente />
      <div style={{ position: "absolute", top: 140, [lado ? "right" : "left"]: 90, width: 1120, perspective: 1600 } as React.CSSProperties}>
        <div style={{
          borderRadius: 18, overflow: "hidden", background: "#fff", border: "1px solid #2C2A24",
          boxShadow: "0 50px 140px rgba(0,0,0,.65), 0 0 0 1px rgba(245,206,26,.25)",
          transform: `rotateY(${lado ? -9 : 9}deg) rotateX(3deg) translateX(${tw(e, 0, 14, lado ? 160 : -160, 0)}px) scale(${empuje})`, opacity: tw(e, 0, 8),
        }}>
          <div style={{ height: 38, background: "#1c1c1e", display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((col) => <div key={col} style={{ width: 12, height: 12, borderRadius: 6, background: col }} />)}
            <div style={{ marginLeft: 16, fontFamily: MONO, fontSize: 15, color: "#9a9a9a" }}>Administrador de anuncios · Meta</div>
          </div>
          <Img src={staticFile(`lu-peli/casos/${c.img}.jpg`)} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
      <div style={{ position: "absolute", top: 700, [lado ? "left" : "right"]: 110, width: 1300, textAlign: lado ? "left" : "right" } as React.CSSProperties}>
        <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: ".3em", color: ORO, opacity: tw(e, 6, 14) }}>CASO DE ÉXITO · {String(k + 1).padStart(2, "0")}/{String(CASOS.length).padStart(2, "0")}</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 56, color: T.texto, letterSpacing: "-0.02em", marginTop: 8, opacity: tw(e, 8, 18), transform: `translateY(${tw(e, 8, 18, 18, 0)}px)` }}>{c.nombre}</div>
        <div style={{ fontFamily: F, fontSize: 27, color: T.gris, marginTop: 8, opacity: tw(e, 12, 22) }}>{c.desc}</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 84, color: ORO, letterSpacing: "-0.03em", marginTop: 6, fontVariantNumeric: "tabular-nums", opacity: tw(e, 8, 14), transform: `scale(${0.8 + 0.2 * rebote(e, 8, 18)})`, transformOrigin: lado ? "left center" : "right center" }}>{dato}</div>
      </div>
      <Destello en={0} color={ORO} max={0.12} dur={6} />
      <LogoMini />
      <Legal />
    </AbsoluteFill>
  );
};

/* ─────────────── No somos una agencia más ─────────────── */
const Tecnologia: React.FC = () => {
  const f = useCurrentFrame();
  const palabras = ["Datos.", "Inteligencia artificial.", "Automatización."];
  return (
    <AbsoluteFill>
      <Ambiente />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 30 }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 112, color: T.texto, letterSpacing: "-0.03em", opacity: tw(f, 0, 12), transform: `scale(${1.1 - 0.1 * tw(f, 0, 18)})` }}>
          No somos <span style={{ color: ORO }}>una agencia más.</span>
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 10 }}>
          {palabras.map((p, i) => {
            const e = f - 45 - i * 22;
            return <div key={p} style={{ fontFamily: F, fontWeight: 700, fontSize: 54, color: i === 1 ? ORO : T.texto, opacity: tw(e, 0, 10), transform: `translateY(${tw(e, 0, 12, 30, 0)}px)` }}>{p}</div>;
          })}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: ".24em", color: T.gris, opacity: tw(f, 115, 130), marginTop: 18 }}>
          CINCO FASES · UN MOTOR DE CRECIMIENTO
        </div>
      </AbsoluteFill>
      {[45, 67, 89].map((en) => <Destello key={en} en={en} color={ORO} max={0.1} dur={6} />)}
    </AbsoluteFill>
  );
};

/* ─────────────── El método: motor de crecimiento (como en la presentación, animado) ─────────────── */
const Metodo: React.FC = () => {
  const f = useCurrentFrame();
  const cx = 1290, cy = 550, R = 300;
  const pos = FASES.map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a };
  });
  const giro = (f * 1.4) % 360;
  const pulso = (f / 90) * 2 * Math.PI;
  return (
    <AbsoluteFill>
      <Ambiente intensidad={0.8} />
      <div style={{ position: "absolute", left: 110, top: 330, width: 560 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: ".3em", color: ORO, opacity: tw(f, 0, 12) }}>LA METODOLOGÍA</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 82, color: T.texto, letterSpacing: "-0.03em", lineHeight: 1.02, marginTop: 14, opacity: tw(f, 4, 18), transform: `translateY(${tw(f, 4, 18, 24, 0)}px)` }}>
          Nuestro motor de crecimiento
        </div>
        <div style={{ fontFamily: F, fontSize: 30, color: T.gris, lineHeight: 1.45, marginTop: 24, opacity: tw(f, 16, 30) }}>
          Cinco fases que convierten a un desconocido en cliente que vuelve — y luego lo automatizan para escalar.
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <circle cx={cx} cy={cy} r={R + 70} fill="none" stroke="rgba(245,206,26,.10)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(245,206,26,.28)" strokeWidth={2} strokeDasharray="4 12" transform={`rotate(${giro} ${cx} ${cy})`} opacity={tw(f, 10, 30)} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={ORO} strokeWidth={3} strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * (1 - tw(f, 30, 210))} transform={`rotate(-90 ${cx} ${cy})`} />
        {pos.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(245,206,26,.35)" strokeWidth={1.5} strokeDasharray={R} strokeDashoffset={R * (1 - tw(f, 40 + i * 30, 70 + i * 30))} />)}
        {f > 210 && <circle cx={cx + R * Math.cos(pulso - Math.PI / 2)} cy={cy + R * Math.sin(pulso - Math.PI / 2)} r={11} fill="#FFF6CC" style={{ filter: "drop-shadow(0 0 14px #F5CE1A)" }} />}
      </svg>
      <div style={{
        position: "absolute", left: cx - 120, top: cy - 120, width: 240, height: 240, borderRadius: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle, rgba(245,206,26,.22), rgba(11,11,11,.9) 70%)", border: `2px solid ${ORO}`,
        boxShadow: `0 0 ${40 + 20 * Math.sin(f / 10)}px rgba(245,206,26,.35)`, transform: `scale(${rebote(f, 20, 22)})`,
      }}>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: ".3em", color: T.gris }}>NÚCLEO</div>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 40, color: ORO, marginTop: 6 }}>Automatizar</div>
      </div>
      {FASES.map((x, i) => {
        const p = pos[i];
        const e = f - (55 + i * 30);
        const izq = Math.cos(p.a) < -0.2;
        const der = Math.cos(p.a) > 0.2;
        return (
          <div key={x.n} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%, -50%)", width: 0, height: 0, opacity: tw(e, 0, 10) }}>
            <div style={{ position: "absolute", left: -12, top: -12, width: 24, height: 24, borderRadius: 12, background: ORO, boxShadow: "0 0 24px rgba(245,206,26,.8)", transform: `scale(${rebote(e, 0, 16)})` }} />
            <div style={{
              position: "absolute", width: izq || der ? 250 : 300, top: p.y < cy - 100 ? -150 : p.y > cy + 100 ? 26 : -60,
              left: izq ? -280 : der ? 30 : -150, textAlign: izq ? "right" : der ? "left" : "center",
              transform: `translateY(${tw(e, 0, 12, 14, 0)}px)`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: ".2em", color: ORO }}>{x.n}</div>
              <div style={{ fontFamily: F, fontWeight: 800, fontSize: 38, color: T.texto }}>{x.t}</div>
              <div style={{ fontFamily: F, fontSize: 22, color: T.gris, lineHeight: 1.35 }}>{x.d}</div>
            </div>
          </div>
        );
      })}
      <LogoMini />
    </AbsoluteFill>
  );
};

/* ─────────────── Cierre: Comencemos. ─────────────── */
const Cierre: React.FC = () => {
  const f = useCurrentFrame();
  const sh = sacudida(f, 4, 16, 12);
  return (
    <AbsoluteFill>
      <Ambiente />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ fontFamily: F, fontWeight: 800, fontSize: 210, color: ORO, letterSpacing: "-0.04em", transform: `scale(${0.7 + 0.3 * rebote(f, 2, 20)})`, opacity: tw(f, 0, 6), textShadow: "0 0 60px rgba(245,206,26,.35)" }}>
          Comencemos.
        </div>
        <div style={{ opacity: tw(f, 40, 56) }}><T.Firma size={300} entrada={f - 40} /></div>
        <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: ".3em", color: T.gris, opacity: tw(f, 70, 86) }}>+100 NEGOCIOS EN PUERTO RICO</div>
      </AbsoluteFill>
      <Destello en={2} color="#FFF6CC" max={0.5} dur={12} />
      <Legal op={tw(f, 80, 100)} />
    </AbsoluteFill>
  );
};

/* ─────────────── Montaje ─────────────── */
const Bloque: React.FC<{ id: string; testi?: keyof typeof TESTI }> = ({ id, testi }) => {
  if (testi) return <Testimonio t={TESTI[testi]} />;
  if (id === "apertura") return <Apertura />;
  if (id === "casos") return <Casos />;
  if (id === "tecnologia") return <Tecnologia />;
  if (id === "metodo") return <Metodo />;
  return <Cierre />;
};

export const LuPelicula: React.FC = () => {
  const f = useCurrentFrame();
  // Música: arriba en lo animado, abajo (sin desaparecer) mientras habla un cliente.
  const volumen = (fr: number) => {
    const i = INICIOS.findIndex((ini, k) => fr >= ini && fr < ini + BLOQUES[k].dur);
    const b = BLOQUES[Math.max(0, i)];
    const hablan = !!b?.testi;
    const base = hablan ? 0.13 : 0.75;
    const fin = interpolate(fr, [DURACION_LU_PELICULA - 45, DURACION_LU_PELICULA], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return base * fin;
  };
  return (
    <AbsoluteFill style={{ background: NEGRO }}>
      {BLOQUES.map((b, i) => (
        <Sequence key={i} from={INICIOS[i]} durationInFrames={b.dur}>
          <Bloque id={b.id} testi={b.testi} />
        </Sequence>
      ))}
      {INICIOS.slice(1).map((c, i) => <Barrido key={c} centro={c} dur={14} colores={[ORO, "#FFE27A", NEGRO]} angulo={i % 2 ? 12 : -12} />)}
      <Grano />
      <Audio src={staticFile("audio/lu-pelicula.mp3")} volume={(fr) => volumen(fr)} />
      {INICIOS.slice(1).map((c) => <Sequence key={`w${c}`} from={c - 6} durationInFrames={30}><Audio src={staticFile("audio/whoosh.mp3")} volume={0.35} /></Sequence>)}
      <Sequence from={0} durationInFrames={90}><Audio src={staticFile("audio/boom.mp3")} volume={0.6} /></Sequence>
      <Sequence from={77} durationInFrames={90}><Audio src={staticFile("audio/impacto.mp3")} volume={0.55} /></Sequence>
      <Sequence from={INICIOS[INICIOS.length - 1]} durationInFrames={90}><Audio src={staticFile("audio/impacto.mp3")} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
