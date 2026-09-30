import { ImageResponse } from "next/og";

// Ícono de Ritmo para la pantalla de inicio (PNG): el pulso verde → coral del logo sobre azul tinta.
// Mismo trazo que app/ritmo/icon.svg. `lleno` = sin esquinas (iPhone y Android recortan solos).
// `escala` = qué parte ocupa el pulso (los maskable necesitan margen: Android los recorta en círculo).
export function iconoRitmo({ px, lleno = false, escala = 0.78, monocromo = false }: { px: number; lleno?: boolean; escala?: number; monocromo?: boolean }) {
  const trazo = Math.round(px * escala);
  return new ImageResponse(
    (
      <div style={{ width: px, height: px, display: "flex", alignItems: "center", justifyContent: "center", background: monocromo ? "transparent" : "radial-gradient(circle at 30% 20%, #262b40 0%, #191c2b 60%, #12141f 100%)", borderRadius: lleno || monocromo ? 0 : Math.round(px * 0.22) }}>
        <svg viewBox="4 8 24 16" width={trazo} height={Math.round((trazo * 16) / 24)}>
          <defs>
            <linearGradient id="g" x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={monocromo ? "#fff" : "#5cf09a"} />
              <stop offset="1" stopColor={monocromo ? "#fff" : "#f59e7a"} />
            </linearGradient>
          </defs>
          <path d="M5 17h5l2.5-6 4 11 3-8 1.5 3H27" fill="none" stroke="url(#g)" strokeWidth={monocromo ? 2.8 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
