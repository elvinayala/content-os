import { notFound } from "next/navigation";

import { iconoLevelUp } from "../dibujo";

// Íconos PNG de la app de clientes (manifest, notificaciones). Se generan en el build; los .png no pasan por el proxy.
const ICONOS: Record<string, Parameters<typeof iconoLevelUp>[0]> = {
  "192.png": { px: 192 },
  "512.png": { px: 512 },
  "maskable-512.png": { px: 512, lleno: true, escala: 0.52 },
  "badge.png": { px: 96, monocromo: true, escala: 0.86 },
};

export const dynamic = "force-static";
export function generateStaticParams() {
  return Object.keys(ICONOS).map((archivo) => ({ archivo }));
}

export async function GET(_: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  const icono = ICONOS[archivo];
  if (!icono) notFound();
  return iconoLevelUp(icono);
}
