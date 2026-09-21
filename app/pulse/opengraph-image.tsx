import { ImageResponse } from "next/og";

// Imagen de vista previa (Slack, WhatsApp, iMessage) para los links de Pulse.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pulse · CRM de clientes";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #fbf4ef 0%, #f6f7fb 50%, #eef2fb 100%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ width: 200, height: 200, borderRadius: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #e07a4a 0%, #c8562d 55%, #8f3a1e 100%)", boxShadow: "0 30px 60px -20px rgba(200,86,45,0.5)" }}>
            <svg viewBox="0 0 64 64" width="160" height="160">
              <path d="M10 34 H54" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 34 H21 L26 23 L32 45 L38 19 L43 34 H54" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="54" cy="34" r="3" fill="#fff" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 112, fontWeight: 700, color: "#323338", letterSpacing: -4, lineHeight: 1 }}>Pulse</div>
            <div style={{ marginTop: 18, fontSize: 30, color: "#7b7e8c", letterSpacing: 6, textTransform: "uppercase" }}>CRM de clientes</div>
            <div style={{ marginTop: 10, fontSize: 22, color: "#9699a6", letterSpacing: 2 }}>EA Market LLC</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
