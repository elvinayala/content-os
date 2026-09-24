import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

// Vista previa del link del onboarding (WhatsApp, Slack, iMessage) con la marca de Level Up.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Bienvenido a Level Up Media";

export default async function OgImage() {
  const logo = await readFile(path.join(process.cwd(), "public/marcas/level-up-logo-dark.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 90px",
          background: "radial-gradient(60% 70% at 90% 0%, rgba(245,206,26,0.22), transparent 70%), #0b0b0b",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={330} height={239} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: "#f5ce1a", textTransform: "uppercase", fontWeight: 700 }}>Onboarding · 5 minutos</div>
          <div style={{ marginTop: 18, fontSize: 64, fontWeight: 800, color: "#f5f1e8", lineHeight: 1.05, letterSpacing: -2 }}>Bienvenido a</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: "#f5ce1a", lineHeight: 1.05, letterSpacing: -2 }}>Level Up Media</div>
          <div style={{ marginTop: 22, fontSize: 30, color: "#bdbab2" }}>Vamos a preparar tu estrategia.</div>
        </div>
      </div>
    ),
    size,
  );
}
