import { notFound } from "next/navigation";

import { iconoRitmo } from "../dibujo";

// Íconos PNG de la app de Ritmo (manifest, notificaciones). Se generan en el build; los .png no pasan por el proxy.
//  192.png / 512.png    → Android (purpose any)
//  maskable-512.png     → Android con forma adaptable (círculo, gota…): pulso con margen de seguridad
//  badge.png            → ícono blanco de la barra de estado de Android en las notificaciones
const ICONOS: Record<string, Parameters<typeof iconoRitmo>[0]> = {
  "192.png": { px: 192 },
  "512.png": { px: 512 },
  "maskable-512.png": { px: 512, lleno: true, escala: 0.56 },
  "badge.png": { px: 96, monocromo: true, escala: 0.9 },
};

export const dynamic = "force-static";
export function generateStaticParams() {
  return Object.keys(ICONOS).map((archivo) => ({ archivo }));
}

export async function GET(_: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  const icono = ICONOS[archivo];
  if (!icono) notFound();
  return iconoRitmo(icono);
}
