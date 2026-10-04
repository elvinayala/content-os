// Resuelto · anuncios de ticket alto (3/oct/2026, Elvin: "de los últimos flyers de servicios caros, 2–3 videos motion
// para anuncios"). Salen de los flyers de vault/proyectos/plomeria-pr/kit/flyers-ticket-alto (mismo copy, precio del menú
// del agente, "aparte" siempre visible, sin teléfono ni WhatsApp). 9:16, 15 s: gancho → servicio animado → precio →
// garantías → logo + "Escríbenos". Marca: crema #FBF7F0 / navy #08243A / naranja #F2621F, Sora + DM Sans.
import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as cargarSora } from "@remotion/google-fonts/Sora";
import { loadFont as cargarDM } from "@remotion/google-fonts/DMSans";

const { fontFamily: SORA } = cargarSora("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
const { fontFamily: DM } = cargarDM("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });

const C = { navy: "#08243A", azul: "#0F3D5E", surf: "#0C2A42", crema: "#FBF7F0", naranja: "#F2621F", verde: "#1F9D6B", verdeClaro: "#3DD598", gris: "#5C6670", gris2: "#9FB8CA", linea: "#E6E1D8", agua: "#3BA7E0" };

export type Servicio = {
  id: string;
  eyebrow: string;
  gancho: string;      // *naranja*
  titular: string;     // el h1 del flyer
  que: string;
  precio: number;
  desde: boolean;
  aparte: string;
  checks: string[];
  oscuro: boolean;
  dibujo: "cisterna" | "solar" | "tuberia";
};

const BASE = ["Precio por escrito antes de empezar", "Plomero licenciado de tu zona", "12 meses de garantía"];
export const SERVICIOS: Record<string, Servicio> = {
  cisterna: { id: "cisterna", eyebrow: "Cisterna", gancho: "¿Se fue el agua *otra vez?*", titular: "Que el corte de agua *no te toque.*",
    que: "Cisterna con bomba, instalada", precio: 899, desde: true, aparte: "cisterna y bomba aparte", checks: BASE, oscuro: true, dibujo: "cisterna" },
  solar: { id: "solar", eyebrow: "Calentador solar", gancho: "¿Pagando luz para *calentar agua?*", titular: "Agua caliente *sin pagar luz.*",
    que: "Instalación de calentador solar", precio: 699, desde: true, aparte: "equipo aparte", checks: BASE, oscuro: false, dibujo: "solar" },
  retuberia: { id: "retuberia", eyebrow: "Re-tubería", gancho: "¿Tubería vieja *en tu baño?*", titular: "Tubería nueva *en tu baño.*",
    que: "Re-tubería completa de un baño", precio: 1200, desde: true, aparte: "materiales aparte", checks: BASE, oscuro: true, dibujo: "tuberia" },
};
export const PUEBLOS_CAGUAS = "Caguas · Cidra · Gurabo · Cayey · Aguas Buenas · San Lorenzo · Juncos";

// Escenas (frames a 30 fps). Total 15 s.
const T = { gancho: 0, servicio: 66, precio: 160, checks: 282, cierre: 372, fin: 450 };
export const DURACION_RESUELTO = T.fin;

const miles = (n: number) => n.toLocaleString("en-US");
const resaltar = (t: string, base: string) =>
  t.split(/(\*[^*]+\*)/).filter(Boolean).map((p, i) => (p.startsWith("*") ? <span key={i} style={{ color: C.naranja }}>{p.slice(1, -1)}</span> : <span key={i} style={{ color: base }}>{p}</span>));

/* ───────── piezas ───────── */
const LogoCasa: React.FC<{ size: number; dibujar?: number }> = ({ size, dibujar = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill={C.naranja} style={{ transformOrigin: "32px 60px", transform: `scale(${interpolate(dibujar, [0, 0.5], [0.4, 1], { extrapolateRight: "clamp" })})`, opacity: interpolate(dibujar, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }) }} />
    <path d="M20 35 L29 44 L46 26" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray={40} strokeDashoffset={interpolate(dibujar, [0.45, 1], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
  </svg>
);

const Logo: React.FC<{ claro: boolean; escala?: number; dibujar?: number }> = ({ claro, escala = 1, dibujar = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 * escala, fontFamily: SORA, fontWeight: 800, fontSize: 46 * escala, letterSpacing: -1.6 * escala, color: claro ? "#fff" : C.navy }}>
    <LogoCasa size={60 * escala} dibujar={dibujar} />
    <span style={{ opacity: interpolate(dibujar, [0.3, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>resuelto</span>
  </div>
);

const Fondo: React.FC<{ oscuro: boolean }> = ({ oscuro }) => {
  const f = useCurrentFrame();
  const r = 1 + 0.04 * Math.sin(f / 40);
  return (
    <AbsoluteFill style={{ background: oscuro ? C.navy : C.crema, overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -300, top: -300, width: 900, height: 900, borderRadius: "50%", background: oscuro ? "#123A57" : "#F4E3D4", opacity: oscuro ? 0.6 : 0.6, transform: `scale(${r})` }} />
      <div style={{ position: "absolute", left: -380, bottom: -420, width: 900, height: 900, borderRadius: "50%", background: oscuro ? "radial-gradient(circle, rgba(242,98,31,.22), rgba(242,98,31,0) 65%)" : "radial-gradient(circle, rgba(242,98,31,.14), rgba(242,98,31,0) 65%)" }} />
    </AbsoluteFill>
  );
};

// Palabras que entran una por una con resorte
const Titulo: React.FC<{ texto: string; base: string; size: number; desde?: number }> = ({ texto, base, size, desde = 0 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const trozos: { t: string; o: boolean }[] = [];
  texto.split(/(\*[^*]+\*)/).filter(Boolean).forEach((p) => { const o = p.startsWith("*"); (o ? p.slice(1, -1) : p).split(/\s+/).filter(Boolean).forEach((w) => trozos.push({ t: w, o })); });
  return (
    <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: size, lineHeight: 1.03, letterSpacing: -size * 0.035, display: "flex", flexWrap: "wrap", columnGap: size * 0.26 }}>
      {trozos.map((w, i) => {
        const s = spring({ frame: f - desde - i * 3, fps, config: { damping: 14, stiffness: 160 } });
        return <span key={i} style={{ color: w.o ? C.naranja : base, display: "inline-block", transform: `translateY(${(1 - s) * 60}px) scale(${0.9 + 0.1 * s})`, opacity: s }}>{w.t}</span>;
      })}
    </div>
  );
};

/* ───────── dibujos del servicio ───────── */
const Cisterna: React.FC<{ p: number; seco?: boolean }> = ({ p, seco }) => {
  const f = useCurrentFrame();
  const nivel = seco ? 0.06 : interpolate(p, [0, 1], [0.08, 0.86], { easing: Easing.out(Easing.cubic) });
  const yAgua = 120 + 520 * (1 - nivel);
  const ola = (o: number) => `M 70 ${yAgua} ${Array.from({ length: 9 }, (_, i) => `Q ${95 + i * 50} ${yAgua + (i % 2 ? 14 : -14) * Math.sin((f + o) / 9)} ${120 + i * 50} ${yAgua}`).join(" ")} V 650 H 70 Z`;
  return (
    <svg viewBox="0 0 760 760" width="100%" height="100%">
      <defs><clipPath id="tanque"><rect x="70" y="110" width="440" height="540" rx="60" /></clipPath></defs>
      <rect x="70" y="110" width="440" height="540" rx="60" fill="rgba(255,255,255,.06)" stroke="#fff" strokeOpacity={0.85} strokeWidth={10} />
      <g clipPath="url(#tanque)">
        <path d={ola(0)} fill={C.agua} opacity={0.9} />
        <path d={ola(20)} fill="#6CC4F0" opacity={0.45} />
      </g>
      {[200, 320, 440].map((y) => <line key={y} x1="86" x2="120" y1={y + 60} y2={y + 60} stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />)}
      <rect x="230" y="78" width="120" height="40" rx="12" fill="#fff" opacity={0.9} />
      {/* bomba */}
      <rect x="560" y="470" width="150" height="180" rx="26" fill={C.naranja} />
      <circle cx="635" cy="545" r="44" fill="#fff" />
      <g transform={`rotate(${seco ? 0 : f * 14} 635 545)`}>{[0, 72, 144, 216, 288].map((a) => <rect key={a} x="631" y="508" width="8" height="34" rx="4" fill={C.naranja} transform={`rotate(${a} 635 545)`} />)}</g>
      <path d="M 510 600 H 560" stroke="#fff" strokeWidth={16} strokeLinecap="round" />
      <path d="M 635 470 V 330 H 700" stroke="#fff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {!seco && [0, 1, 2].map((i) => { const t = ((f + i * 10) % 30) / 30; return <circle key={i} cx={700 + t * 40} cy={330 + t * t * 120} r={9 - t * 4} fill={C.agua} opacity={1 - t} />; })}
    </svg>
  );
};

const Solar: React.FC<{ p: number; claro: boolean }> = ({ p, claro }) => {
  const f = useCurrentFrame();
  const tinta = claro ? C.navy : "#fff";
  const calor = interpolate(p, [0.2, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <svg viewBox="0 0 760 760" width="100%" height="100%">
      <g transform={`translate(560 150) rotate(${f * 1.2})`}>
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x="-7" y="-150" width="14" height="46" rx="7" fill="#F7B32B" transform={`rotate(${i * 30})`} opacity={0.9} />)}
      </g>
      <circle cx="560" cy="150" r="82" fill="#F7B32B" />
      {/* techo + panel */}
      <path d="M 40 520 L 330 330 L 620 520" stroke={tinta} strokeWidth={14} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <g transform="translate(150 360) skewY(-33)">
        <rect x="0" y="0" width="300" height="150" rx="10" fill={C.azul} stroke={tinta} strokeWidth={8} />
        {[1, 2, 3].map((i) => <line key={`v${i}`} x1={i * 75} x2={i * 75} y1="0" y2="150" stroke="#6CC4F0" strokeWidth={4} />)}
        <line x1="0" x2="300" y1="75" y2="75" stroke="#6CC4F0" strokeWidth={4} />
        <rect x="0" y="0" width="300" height="150" rx="10" fill="#fff" opacity={0.25 * (0.5 + 0.5 * Math.sin(f / 6))} />
      </g>
      {/* tanque de agua caliente */}
      <rect x="470" y="350" width="120" height="70" rx="35" fill={tinta} />
      {/* termómetro */}
      <rect x="640" y="380" width="44" height="300" rx="22" fill="none" stroke={tinta} strokeWidth={8} />
      <rect x="652" y={392 + 276 * (1 - calor)} width="20" height={276 * calor} rx="10" fill={C.naranja} />
      <circle cx="662" cy="690" r="36" fill={C.naranja} />
      {/* vapor */}
      {[0, 1, 2].map((i) => { const t = ((f + i * 12) % 36) / 36; return <path key={i} d={`M ${500 + i * 30} ${330 - t * 120} q 14 -20 0 -40 q -14 -20 0 -40`} stroke={C.naranja} strokeWidth={8} strokeLinecap="round" fill="none" opacity={(1 - t) * calor} />; })}
      {/* rayo tachado = sin luz */}
      <g transform="translate(160 590)" opacity={calor}>
        <circle cx="0" cy="0" r="62" fill="none" stroke={C.naranja} strokeWidth={10} />
        <path d="M 8 -40 L -22 6 H 4 L -8 42 L 24 -6 H -2 Z" fill={tinta} />
        <line x1="-44" y1="44" x2="44" y2="-44" stroke={C.naranja} strokeWidth={10} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const Tuberia: React.FC<{ p: number }> = ({ p }) => {
  const f = useCurrentFrame();
  const camino = "M 60 640 H 230 V 420 H 420 V 220 H 600 V 120";
  const largo = 1080;
  const d = interpolate(p, [0, 0.75], [largo, 0], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <svg viewBox="0 0 760 760" width="100%" height="100%">
      {/* tubo viejo, oxidado, que se va */}
      <path d="M 60 560 H 300 V 330 H 560" stroke="#8B5A3C" strokeWidth={30} fill="none" strokeLinejoin="round" opacity={interpolate(p, [0, 0.3], [0.55, 0], { extrapolateRight: "clamp" })} strokeDasharray="18 10" />
      <path d={camino} stroke="rgba(255,255,255,.12)" strokeWidth={38} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={camino} stroke={C.naranja} strokeWidth={38} fill="none" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={largo} strokeDashoffset={d} />
      {[[230, 640], [230, 420], [420, 420], [420, 220], [600, 220]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={30} fill="#fff" opacity={interpolate(p, [0.15 + i * 0.12, 0.3 + i * 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      ))}
      {/* ducha */}
      <g opacity={interpolate(p, [0.7, 0.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
        <path d="M 600 120 H 680 V 160" stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 630 160 H 730 L 700 200 H 660 Z" fill="#fff" />
        {Array.from({ length: 6 }, (_, i) => { const t = ((f + i * 5) % 24) / 24; return <line key={i} x1={665 + i * 7} x2={660 + i * 9} y1={210 + t * 140} y2={235 + t * 140} stroke={C.agua} strokeWidth={6} strokeLinecap="round" opacity={1 - t} />; })}
      </g>
      {/* llave de paso que gira */}
      <g transform={`translate(420 320) rotate(${interpolate(p, [0.4, 0.8], [0, 90], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`}>
        <rect x="-60" y="-12" width="120" height="24" rx="12" fill="#fff" />
      </g>
    </svg>
  );
};

const Dibujo: React.FC<{ s: Servicio; p: number; gancho?: boolean }> = ({ s, p, gancho }) => {
  if (s.dibujo === "cisterna") return <Cisterna p={p} seco={gancho} />;
  if (s.dibujo === "solar") return <Solar p={gancho ? 0 : p} claro={!s.oscuro} />;
  return <Tuberia p={gancho ? 0 : p} />;
};

/* ───────── escenas ───────── */
const Ceja: React.FC<{ texto: string; desde?: number }> = ({ texto, desde = 0 }) => {
  const f = useCurrentFrame();
  return <div style={{ fontFamily: DM, fontWeight: 700, fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: C.naranja, opacity: interpolate(f - desde, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{texto}</div>;
};

const Gancho: React.FC<{ s: Servicio; zona: string }> = ({ s, zona }) => {
  const f = useCurrentFrame();
  const tinta = s.oscuro ? "#fff" : C.navy;
  // la ilustración "vacía/vieja" tiembla un poco: el problema
  const temblor = Math.sin(f * 1.7) * 3;
  return (
    <AbsoluteFill style={{ padding: "230px 84px 0" }}>
      <Ceja texto={`${s.eyebrow} · ${zona}`} />
      <div style={{ marginTop: 26 }}><Titulo texto={s.gancho} base={tinta} size={128} /></div>
      <div style={{ position: "absolute", left: 160, right: 160, top: 860, height: 760, transform: `translateX(${temblor}px)`, opacity: interpolate(f, [8, 22], [0, 1], { extrapolateRight: "clamp" }) }}>
        <Dibujo s={s} p={0} gancho />
      </div>
    </AbsoluteFill>
  );
};

const Solucion: React.FC<{ s: Servicio }> = ({ s }) => {
  const f = useCurrentFrame();
  const tinta = s.oscuro ? "#fff" : C.navy;
  const p = interpolate(f, [6, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "230px 84px 0" }}>
      <Titulo texto={s.titular} base={tinta} size={118} />
      <div style={{ position: "absolute", left: 110, right: 110, top: 760, height: 860 }}>
        <Dibujo s={s} p={p} />
      </div>
    </AbsoluteFill>
  );
};

const Precio: React.FC<{ s: Servicio }> = ({ s }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tinta = s.oscuro ? "#fff" : C.navy; const sub = s.oscuro ? C.gris2 : C.gris;
  const cuenta = Math.round(interpolate(f, [10, 38], [0, s.precio], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) / (s.precio >= 1000 ? 10 : 1)) * (s.precio >= 1000 ? 10 : 1);
  const golpe = spring({ frame: f - 38, fps, config: { damping: 9, stiffness: 220 } });
  const entra = spring({ frame: f - 4, fps, config: { damping: 16 } });
  const brillo = interpolate(f, [38, 46, 70], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ padding: "0 84px", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1 - entra) * 40}px)`, opacity: entra, marginTop: -40 }}>
        <Ceja texto={s.eyebrow} />
        <div style={{ fontFamily: DM, fontWeight: 600, fontSize: 46, color: tinta, marginTop: 30 }}>{s.que}</div>
        {s.desde && <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 64, color: tinta, marginTop: 26 }}>desde</div>}
        <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: -10 }}>
          <span style={{ fontFamily: SORA, fontWeight: 800, fontSize: s.precio >= 1000 ? 280 : 330, letterSpacing: -12, lineHeight: 1, color: C.naranja, display: "inline-block",
            transform: `scale(${1 + 0.08 * (1 - golpe) * (f > 38 ? 1 : 0)})`, textShadow: `0 0 ${60 * brillo}px rgba(242,98,31,${0.6 * brillo})`, fontVariantNumeric: "tabular-nums" }}>${miles(cuenta)}</span>
        </div>
        <div style={{ fontFamily: DM, fontWeight: 500, fontSize: 34, color: sub, marginTop: 18, opacity: interpolate(f, [44, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          Mano de obra · {s.aparte} · + $19 de coordinación
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Checks: React.FC<{ s: Servicio }> = ({ s }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tinta = s.oscuro ? "#fff" : C.navy;
  return (
    <AbsoluteFill style={{ padding: "0 84px", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 54, marginTop: -40 }}>
        {s.checks.map((c, i) => {
          const a = spring({ frame: f - 6 - i * 16, fps, config: { damping: 14 } });
          const trazo = interpolate(f - 10 - i * 16, [0, 12], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 34, opacity: a, transform: `translateX(${(1 - a) * -80}px)` }}>
              <div style={{ flex: "none", width: 104, height: 104, borderRadius: "50%", background: s.oscuro ? "#153F33" : "#E3F3EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="58" height="58" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={s.oscuro ? C.verdeClaro : C.verde} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={trazo} /></svg>
              </div>
              <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 60, lineHeight: 1.1, letterSpacing: -1.5, color: tinta }}>{c}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Cierre: React.FC<{ s: Servicio; zona: string }> = ({ s, zona }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tinta = s.oscuro ? "#fff" : C.navy; const sub = s.oscuro ? C.gris2 : C.gris;
  const dib = interpolate(f, [0, 26], [0, 1], { extrapolateRight: "clamp" });
  const boton = spring({ frame: f - 22, fps, config: { damping: 12 } });
  const pulso = 1 + 0.04 * Math.max(0, Math.sin((f - 40) / 4)) * (f > 40 ? 1 : 0);
  const toque = interpolate(f, [44, 52, 58], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 84px", textAlign: "center" }}>
      <div style={{ marginTop: -60, display: "flex", flexDirection: "column", alignItems: "center", gap: 52 }}>
        <Logo claro={s.oscuro} escala={2.1} dibujar={dib} />
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 62, lineHeight: 1.12, letterSpacing: -1.5, color: tinta, opacity: interpolate(f, [14, 26], [0, 1], { extrapolateRight: "clamp" }) }}>
          Escríbenos y te damos<br /><span style={{ color: C.naranja }}>tu precio en minutos.</span>
        </div>
        <div style={{ position: "relative", transform: `scale(${boton * pulso})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, background: C.naranja, color: "#fff", fontFamily: SORA, fontWeight: 700, fontSize: 52, padding: "30px 52px", borderRadius: 28, boxShadow: `0 20px 60px rgba(242,98,31,${0.35 + 0.3 * toque})` }}>
            <svg width="56" height="56" viewBox="0 0 24 24"><path d="M3.5 6A3 3 0 0 1 6.5 3h11a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H10.2l-4.6 3.7c-.6.5-1.6.1-1.6-.7V17a3 3 0 0 1-.5-1.7z" fill="#fff" /><circle cx="8.3" cy="10" r="1.35" fill={C.naranja} /><circle cx="12" cy="10" r="1.35" fill={C.naranja} /><circle cx="15.7" cy="10" r="1.35" fill={C.naranja} /></svg>
            Escríbenos
          </div>
          <div style={{ position: "absolute", right: -30, bottom: -40, width: 70, height: 70, borderRadius: "50%", border: `5px solid ${tinta}`, opacity: toque, transform: `scale(${0.6 + toque * 0.6})` }} />
        </div>
        <div style={{ fontFamily: DM, fontWeight: 500, fontSize: 30, lineHeight: 1.45, color: sub, maxWidth: 820, opacity: interpolate(f, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{zona}</div>
      </div>
    </AbsoluteFill>
  );
};

// Barrido naranja entre escenas (tapa el corte)
const Barrido: React.FC<{ en: number }> = ({ en }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [en - 8, en, en + 8], [-110, 0, 110], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  if (f < en - 8 || f > en + 8) return null;
  return <AbsoluteFill style={{ background: C.naranja, transform: `translateX(${x}%) skewX(-8deg) scale(1.3)` }} />;
};

export const ResueltoTicket: React.FC<{ servicio: string; zona?: string; ciudad?: string }> = ({ servicio, zona = PUEBLOS_CAGUAS, ciudad = "Caguas" }) => {
  const s = SERVICIOS[servicio] ?? SERVICIOS.cisterna;
  const f = useCurrentFrame();
  const cortes = [T.servicio, T.precio, T.checks, T.cierre];
  const musica = (fr: number) => interpolate(fr, [0, 6, T.fin - 20, T.fin], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Fondo oscuro={s.oscuro} />
      {/* logo fijo arriba desde la escena 2 */}
      <div style={{ position: "absolute", left: 84, top: 110, opacity: interpolate(f, [T.servicio, T.servicio + 10, T.cierre - 4, T.cierre], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Logo claro={s.oscuro} escala={1} />
      </div>
      <Sequence from={T.gancho} durationInFrames={T.servicio - T.gancho}><Gancho s={s} zona={ciudad} /></Sequence>
      <Sequence from={T.servicio} durationInFrames={T.precio - T.servicio}><Solucion s={s} /></Sequence>
      <Sequence from={T.precio} durationInFrames={T.checks - T.precio}><Precio s={s} /></Sequence>
      <Sequence from={T.checks} durationInFrames={T.cierre - T.checks}><Checks s={s} /></Sequence>
      <Sequence from={T.cierre} durationInFrames={T.fin - T.cierre}><Cierre s={s} zona={zona} /></Sequence>
      {cortes.map((c) => <Barrido key={c} en={c} />)}
      <Audio src={staticFile("audio/resuelto-ticket.mp3")} volume={musica} />
      {cortes.map((c) => <Sequence key={`w${c}`} from={c - 8} durationInFrames={30}><Audio src={staticFile("audio/whoosh.mp3")} volume={0.35} /></Sequence>)}
      <Sequence from={T.precio + 38} durationInFrames={60}><Audio src={staticFile("audio/impacto.mp3")} volume={0.6} /></Sequence>
      {[0, 1, 2].map((i) => <Sequence key={`p${i}`} from={T.checks + 10 + i * 16} durationInFrames={20}><Audio src={staticFile("audio/pop.mp3")} volume={0.45} /></Sequence>)}
      <Sequence from={T.cierre + 22} durationInFrames={40}><Audio src={staticFile("audio/ding.mp3")} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
