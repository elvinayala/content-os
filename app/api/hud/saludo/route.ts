import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";
import { leerOnboardings } from "@/lib/onboardings";
import { UNIDADES } from "@/lib/ceo";
import type { UnidadNegocio } from "@/lib/types";

export const runtime = "nodejs";

// Saludo de arranque de Jarvis (manos libres). Si hay clientes nuevos de ayer/hoy,
// felicita al boss por marca. Si no, saludo futurista neutro. Lo habla el HUD.

function ayerISO(): string {
  const d = new Date(Date.now() - 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_SESION)?.value;
  if (!(await sesionValida(cookie))) {
    // el HUD puede estar abierto sin login en dev; devolvemos saludo neutro
    return NextResponse.json({ saludo: saludoNeutro(), clientesNuevos: [] });
  }

  const desde = ayerISO();
  let nuevos: { cliente: string; marca: string }[] = [];
  try {
    const { onboardings } = await leerOnboardings();
    nuevos = onboardings
      .filter((o) => (o.ganadoEl ?? "").slice(0, 10) >= desde)
      .map((o) => ({
        cliente: o.cliente,
        marca: UNIDADES[o.unidad as UnidadNegocio]?.nombre ?? o.unidad,
      }));
  } catch {
    /* fuente caída → saludo neutro */
  }

  if (nuevos.length === 0) {
    return NextResponse.json({ saludo: saludoNeutro(), clientesNuevos: [] });
  }

  const hora = new Date().toLocaleString("es-PR", {
    timeZone: "America/Puerto_Rico",
    hour: "numeric",
    hour12: true,
  });
  const franja =
    new Date().getHours() < 12
      ? "Buenos días"
      : new Date().getHours() < 19
        ? "Buenas tardes"
        : "Buenas noches";

  let felicitacion: string;
  if (nuevos.length === 1) {
    felicitacion = `Felicidades por el nuevo cliente ${nuevos[0].cliente} de ${nuevos[0].marca}.`;
  } else {
    const marcas = [...new Set(nuevos.map((n) => n.marca))].join(" y ");
    felicitacion = `Felicidades: cerramos ${nuevos.length} clientes nuevos (${marcas}). Van ${nuevos
      .map((n) => n.cliente)
      .join(", ")}.`;
  }

  return NextResponse.json({
    saludo: `${franja}, boss. ${felicitacion} Sistemas en línea, ¿arrancamos?`,
    clientesNuevos: nuevos,
    hora,
  });
}

function saludoNeutro(): string {
  const h = new Date().getHours();
  const franja = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  return `${franja}, boss. Jarvis en línea. ¿En qué te ayudo?`;
}
