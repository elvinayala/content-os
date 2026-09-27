// Piezas de interfaz animadas: teléfono, notificaciones, chat, llamada con onda de voz,
// calendario que se llena y contador. Todo recibe un `tema` para servir a cualquier marca.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { tw, rebote } from "./fx";

export type Tema = {
  fuente: string;
  mono: string;
  fondo: string;
  superficie: string;
  borde: string;
  texto: string;
  gris: string;
  acento: string;
  acento2: string;
  alarma: string;
};

/* ───────────── Teléfono ───────────── */
export const Telefono: React.FC<{ ancho: number; tema: Tema; children: React.ReactNode; style?: React.CSSProperties }> = ({ ancho, tema, children, style }) => {
  const alto = ancho * 2.05;
  return (
    <div style={{
      width: ancho, height: alto, borderRadius: ancho * 0.14, padding: ancho * 0.03,
      background: "linear-gradient(145deg, #1c2a23, #050b08)", boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 2px ${tema.borde}`,
      position: "relative", ...style,
    }}>
      <div style={{ width: "100%", height: "100%", borderRadius: ancho * 0.115, overflow: "hidden", background: tema.fondo, position: "relative" }}>
        <div style={{ position: "absolute", top: ancho * 0.03, left: "50%", transform: "translateX(-50%)", width: ancho * 0.3, height: ancho * 0.085, borderRadius: 99, background: "#000", zIndex: 5 }} />
        {children}
      </div>
    </div>
  );
};

export const Notificacion: React.FC<{ titulo: string; detalle: string; hora: string; entra: number; tema: Tema; color: string; ancho: number; icono?: "llamada" | "mensaje" }> = ({
  titulo, detalle, hora, entra, tema, color, ancho, icono = "llamada",
}) => {
  const f = useCurrentFrame();
  const e = rebote(f, entra, 16);
  return (
    <div style={{
      width: ancho, padding: "16px 16px", borderRadius: 22, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 14, alignItems: "center",
      transform: `translateY(${(1 - e) * -60}px) scale(${0.9 + 0.1 * e})`, opacity: Math.min(1, e * 1.4),
      fontFamily: tema.fuente,
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: color, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icono === "llamada" ? <IconoTelefono size={26} color="#fff" cortado /> : <IconoMensaje size={26} color="#fff" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, color: tema.texto, fontWeight: 600, fontSize: 19, whiteSpace: "nowrap" }}>
          <span>{titulo}</span><span style={{ color: tema.gris, fontWeight: 400, fontSize: 13 }}>{hora}</span>
        </div>
        <div style={{ color: tema.gris, fontSize: 18, marginTop: 2 }}>{detalle}</div>
      </div>
    </div>
  );
};

export const IconoTelefono: React.FC<{ size: number; color: string; cortado?: boolean }> = ({ size, color, cortado }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" fill={color} />
    {cortado && <path d="M4 20 L20 4" stroke={color} strokeWidth={2.4} strokeLinecap="round" />}
  </svg>
);

export const IconoMensaje: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill={color} />
  </svg>
);

/* ───────────── Chat tipo WhatsApp ───────────── */
export type Burbuja = { de: "cliente" | "agente"; texto: string; en: number };

export const Chat: React.FC<{ burbujas: Burbuja[]; tema: Tema; ancho: number; nombre: string; avatar: React.ReactNode }> = ({ burbujas, tema, ancho, nombre, avatar }) => {
  const f = useCurrentFrame();
  const visibles = burbujas.filter((b) => f >= b.en);
  const escribiendo = burbujas.find((b) => b.de === "agente" && f >= b.en - 14 && f < b.en);
  return (
    <div style={{ width: ancho, fontFamily: tema.fuente, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: `1px solid ${tema.borde}` }}>
        <div style={{ width: 48, height: 48, borderRadius: 24, background: tema.superficie, display: "grid", placeItems: "center", overflow: "hidden" }}>{avatar}</div>
        <div>
          <div style={{ color: tema.texto, fontWeight: 600, fontSize: 22 }}>{nombre}</div>
          <div style={{ color: tema.acento, fontSize: 16, fontFamily: tema.mono }}>{escribiendo ? "escribiendo…" : "en línea"}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12, padding: 18 }}>
        {visibles.map((b, i) => {
          const e = rebote(f, b.en, 14);
          const agente = b.de === "agente";
          return (
            <div key={i} style={{
              alignSelf: agente ? "flex-start" : "flex-end", maxWidth: "82%", padding: "12px 16px", borderRadius: 18,
              borderBottomLeftRadius: agente ? 4 : 18, borderBottomRightRadius: agente ? 18 : 4,
              background: agente ? tema.superficie : tema.acento, color: agente ? tema.texto : "#04130B",
              border: agente ? `1px solid ${tema.borde}` : "none",
              fontSize: 20, lineHeight: 1.3, fontWeight: agente ? 400 : 600,
              transform: `scale(${0.6 + 0.4 * e})`, transformOrigin: agente ? "left bottom" : "right bottom", opacity: Math.min(1, e * 1.5),
            }}>{b.texto}</div>
          );
        })}
        {escribiendo && (
          <div style={{ alignSelf: "flex-start", padding: "14px 18px", borderRadius: 18, background: tema.superficie, border: `1px solid ${tema.borde}`, display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: 5, background: tema.gris, transform: `translateY(${Math.sin((f + i * 4) / 3) * 4}px)` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────────── Llamada contestada con onda de voz ───────────── */
export const Llamada: React.FC<{ tema: Tema; contesta: number; quien: string; ancho: number; etiqueta: string }> = ({ tema, contesta, quien, ancho, etiqueta }) => {
  const f = useCurrentFrame();
  const contestada = f >= contesta;
  const seg = Math.max(0, Math.floor((f - contesta) / 30));
  const timbre = !contestada ? Math.sin(f / 1.6) * 6 : 0;
  const e = tw(f, contesta, contesta + 12);
  const barras = 34;
  return (
    <div style={{ width: ancho, fontFamily: tema.fuente, display: "flex", flexDirection: "column", alignItems: "center", gap: 26, paddingTop: 20 }}>
      <div style={{ color: tema.gris, fontFamily: tema.mono, fontSize: 18, letterSpacing: "0.12em" }}>
        {contestada ? `EN LLAMADA · 00:0${Math.min(9, seg + 1)}` : "LLAMADA ENTRANTE"}
      </div>
      <div style={{ color: tema.texto, fontSize: 30, fontWeight: 600 }}>{quien}</div>
      <div style={{ position: "relative", width: 150, height: 150, display: "grid", placeItems: "center" }}>
        {[0, 1, 2].map((i) => {
          const p = ((f + i * 10) % 30) / 30;
          return <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px solid ${contestada ? tema.acento : tema.gris}`, transform: `scale(${0.7 + p * 0.9})`, opacity: 1 - p }} />;
        })}
        <div style={{
          width: 110, height: 110, borderRadius: "50%", display: "grid", placeItems: "center",
          background: contestada ? `linear-gradient(135deg, ${tema.acento2}, ${tema.acento})` : tema.superficie,
          transform: `rotate(${timbre}deg) scale(${1 + e * 0.06})`, boxShadow: contestada ? `0 0 60px ${tema.acento}88` : "none",
        }}>
          <IconoTelefono size={52} color={contestada ? "#04130B" : tema.texto} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 90 }}>
        {new Array(barras).fill(0).map((_, i) => {
          const n = (noise2D("voz", i / 5, f / 6) + 1) / 2;
          const env = Math.sin((i / (barras - 1)) * Math.PI);
          const h = contestada ? 8 + n * 80 * env * e : 6;
          return <div key={i} style={{ width: 7, height: h, borderRadius: 4, background: contestada ? tema.acento : tema.borde }} />;
        })}
      </div>
      <div style={{
        opacity: e, transform: `translateY(${(1 - e) * 20}px)`, padding: "10px 20px", borderRadius: 99,
        background: `${tema.acento}22`, border: `1px solid ${tema.acento}`, color: tema.acento, fontSize: 20, fontWeight: 600,
      }}>
        {etiqueta}
      </div>
    </div>
  );
};

/* ───────────── Calendario que se llena ───────────── */
export const Calendario: React.FC<{ tema: Tema; entra: number; ancho: number; citas: { dia: number; fila: number; hora: string }[] }> = ({ tema, entra, ancho, citas }) => {
  const f = useCurrentFrame();
  const dias = ["LUN", "MAR", "MIÉ", "JUE", "VIE"];
  const filas = 5;
  const celda = (ancho - 40) / dias.length;
  return (
    <div style={{ width: ancho, fontFamily: tema.fuente, padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${dias.length}, 1fr)`, gap: 8, marginBottom: 10 }}>
        {dias.map((d) => <div key={d} style={{ color: tema.gris, fontFamily: tema.mono, fontSize: 16, textAlign: "center" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${dias.length}, 1fr)`, gridTemplateRows: `repeat(${filas}, ${celda * 0.52}px)`, gap: 8 }}>
        {new Array(dias.length * filas).fill(0).map((_, i) => {
          const dia = i % dias.length;
          const fila = Math.floor(i / dias.length);
          const k = citas.findIndex((c) => c.dia === dia && c.fila === fila);
          const cita = k >= 0 ? citas[k] : null;
          const e = cita ? rebote(f, entra + k * 3, 14) : 0;
          return (
            <div key={i} style={{ borderRadius: 10, background: tema.superficie, border: `1px solid ${tema.borde}`, position: "relative", overflow: "hidden" }}>
              {cita && (
                <div style={{
                  position: "absolute", inset: 3, borderRadius: 7, background: `linear-gradient(135deg, ${tema.acento2}, ${tema.acento})`,
                  transform: `scale(${e})`, opacity: Math.min(1, e * 1.3), display: "grid", placeItems: "center",
                  color: "#04130B", fontWeight: 600, fontSize: 15, fontFamily: tema.mono,
                }}>{cita.hora}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────── Contador ───────────── */
export const Contador: React.FC<{ desde: number; hasta: number; entra: number; dur: number; tema: Tema; etiqueta: string; tam?: number }> = ({
  desde, hasta, entra, dur, tema, etiqueta, tam = 150,
}) => {
  const f = useCurrentFrame();
  const v = Math.round(interpolate(f, [entra, entra + dur], [desde, hasta], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const listo = f >= entra + dur;
  const pop = listo ? 1 + (1 - rebote(f, entra + dur, 14)) * 0.35 : 1;
  const color = listo ? tema.acento : tema.alarma;
  return (
    <div style={{ fontFamily: tema.fuente, textAlign: "center" }}>
      <div style={{ fontFamily: tema.mono, color: tema.gris, fontSize: 20, letterSpacing: "0.14em" }}>{etiqueta}</div>
      <div style={{ fontSize: tam, fontWeight: 800, color, lineHeight: 1, transform: `scale(${pop})`, textShadow: `0 0 50px ${color}66`, fontVariantNumeric: "tabular-nums" }}>{v}</div>
    </div>
  );
};
