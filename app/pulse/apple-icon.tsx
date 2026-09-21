import { ImageResponse } from "next/og";

// Ícono para iOS/Android (pantalla de inicio): el isotipo de Pulse a 180px.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e07a4a 0%, #c8562d 55%, #8f3a1e 100%)", borderRadius: 40 }}>
        <svg viewBox="0 0 64 64" width="150" height="150">
          <path d="M10 34 H54" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 34 H21 L26 23 L32 45 L38 19 L43 34 H54" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="54" cy="34" r="3" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
