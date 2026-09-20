import "server-only";

import type { AgenteVoz, ProveedorVoz } from "@/lib/types";
import * as retell from "@/lib/voz/retell";

// Punto de entrada agnóstico del proveedor de voz. Hoy: Retell (real cuando hay
// key) y Vapi (placeholder, misma interfaz para cablear después). El resto de la
// app crea agentes por acá sin saber de proveedores.

export interface EstadoProveedor {
  proveedor: ProveedorVoz;
  disponible: boolean; // hay API key configurada
  nota: string;
}

export function estadoProveedores(): EstadoProveedor[] {
  return [
    {
      proveedor: "retell",
      disponible: retell.disponible(),
      nota: retell.disponible()
        ? "Conectado — los agentes se crean en Retell."
        : "Sin RETELL_API_KEY — los agentes se crean en modo local (mock).",
    },
    {
      proveedor: "vapi",
      disponible: !!process.env.VAPI_API_KEY,
      nota: process.env.VAPI_API_KEY
        ? "Key detectada — integración pendiente de cablear."
        : "Sin VAPI_API_KEY — modo local (mock).",
    },
  ];
}

export function proveedorDisponible(proveedor: ProveedorVoz): boolean {
  return estadoProveedores().find((p) => p.proveedor === proveedor)?.disponible ?? false;
}

// Crea el agente en el proveedor si hay key; si no (o si falla), lo deja local.
// Devuelve los campos a persistir: externalId, fuente y numero (si vino).
export async function provisionarAgente(agente: AgenteVoz): Promise<{
  externalId?: string;
  numero?: string;
  fuente: ProveedorVoz | "mock";
  nota?: string;
}> {
  if (agente.proveedor === "retell" && retell.disponible()) {
    try {
      const r = await retell.crearAgenteRemoto(agente);
      return { externalId: r.externalId, numero: r.numero, fuente: "retell" };
    } catch (e) {
      return {
        externalId: `local_${agente.id}`,
        fuente: "mock",
        nota: `No se pudo crear en Retell (${
          e instanceof Error ? e.message : "error"
        }). Quedó en modo local.`,
      };
    }
  }
  // Vapi u otros sin cablear, o sin key → local.
  return {
    externalId: `local_${agente.id}`,
    fuente: "mock",
    nota: "Creado en modo local (sin proveedor conectado).",
  };
}
