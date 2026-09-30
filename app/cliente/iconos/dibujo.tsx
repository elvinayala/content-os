import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

// Ícono de la app de clientes: el cohete de Level Up (public/marcas/level-up-icon-dark.png) sobre negro.
// `lleno` = sin esquinas (iPhone y Android recortan solos). `escala` = cuánto ocupa el cohete (los maskable necesitan margen).
export async function iconoLevelUp({ px, lleno = false, escala = 0.7, monocromo = false }: { px: number; lleno?: boolean; escala?: number; monocromo?: boolean }) {
  const png = await readFile(path.join(process.cwd(), "public/marcas/level-up-icon-dark.png"));
  const src = `data:image/png;base64,${png.toString("base64")}`;
  const ancho = Math.round(px * escala);
  const alto = Math.round((ancho * 208) / 240);
  return new ImageResponse(
    (
      <div style={{ width: px, height: px, display: "flex", alignItems: "center", justifyContent: "center", background: monocromo ? "transparent" : "radial-gradient(circle at 70% 20%, #2a2410 0%, #0b0b0b 62%)", borderRadius: lleno || monocromo ? 0 : Math.round(px * 0.22) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={ancho} height={alto} alt="" style={monocromo ? { filter: "brightness(0) invert(1)" } : {}} />
      </div>
    ),
    { width: px, height: px },
  );
}
