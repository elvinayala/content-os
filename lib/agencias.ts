import type { Agencia } from "@/lib/types";

// Config de las agencias del dashboard. Única fuente de verdad.
// Para sumar/activar una agencia: agregá o editá una entrada acá.
//
// Nota: los nombres de columna difieren entre hojas (mayúsculas/acentos),
// por eso cada agencia declara los suyos en `columnas`.
export const AGENCIAS: Agencia[] = [
  {
    id: "level-up",
    nombre: "Level Up Media",
    activa: true,
    locale: "US", // $1,000.00
    columnas: {
      cliente: "Nombre del cliente",
      neto: "Valor Neto de la venta",
      transaccion: "Tipo de Transacción",
    },
    ventas: {
      sheetId: "1zKa1NBwE9TLQ8_PDFwAR_JneMHBDW8kVwEVtQboRLTU",
      gid: "487085089",
    },
    // metricas: aún no publicada por la tesorera → usa fallback del snapshot.
    // Cuando esté: descomentar y poner sheetId + gid de cada pestaña.
    // metricas: { sheetId: "...", gid: "0", gidCac, gidLtv, gidChurn },
  },
  {
    id: "ai-borinquen",
    nombre: "AI Borinquen",
    activa: false, // se prende cuando tenga su data/métricas lista
    locale: "EU", // $1.000,00
    columnas: {
      cliente: "Nombre del Cliente",
      neto: "Valor Neto de la venta",
      transaccion: "Tipo de Transacción",
    },
    ventas: {
      sheetId: "1A99WUgPFouujA-26K90VCA7PuuEWQAL5PHFMjKIQkQ8",
      gid: "1860900505",
    },
  },
];

export function agenciasActivas(): Agencia[] {
  return AGENCIAS.filter((a) => a.activa);
}
