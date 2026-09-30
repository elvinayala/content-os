"use client";

import { useSyncExternalStore } from "react";

// Horas en la zona de quien mira (29/sep: Daisy, en Colombia, vio "9:02" y creyó que se le borró su entrada de las 8).
// Ritmo calcula todo en hora de PR; aquí solo se MUESTRA: si tu zona es otra, sale tu hora y al lado la de PR.
// En el servidor (y en el primer render) se usa PR para que la hidratación cuadre; luego cambia a la del navegador.

export const PR = "America/Puerto_Rico";

const zonaNavegador = () => Intl.DateTimeFormat().resolvedOptions().timeZone || PR;
const nada = () => () => {};

export function useZona(): string {
  return useSyncExternalStore(nada, zonaNavegador, () => PR);
}

const fmt = (d: Date, tz: string) => d.toLocaleTimeString("es-PR", { timeZone: tz, hour: "numeric", minute: "2-digit" });

/** "8:02 a. m. (9:02 a. m. PR)" si tu zona difiere de PR ese día; si no, solo la hora. */
export function textoHora(iso: string, tz: string): string {
  const d = new Date(iso);
  const pr = fmt(d, PR);
  const mia = fmt(d, tz);
  return mia === pr ? pr : `${mia} (${pr} PR)`;
}

export function Hora({ iso }: { iso: string | null }) {
  const tz = useZona();
  if (!iso) return <>—</>;
  const d = new Date(iso);
  const pr = fmt(d, PR);
  const mia = fmt(d, tz);
  if (mia === pr) return <>{pr}</>;
  return (
    <>
      {mia} <span className="opacity-60">({pr} PR)</span>
    </>
  );
}

/** Nombre corto de la zona si no es la de PR ("hora de Colombia"), o null. */
export function useOtraZona(): string | null {
  const tz = useZona();
  const ahora = new Date();
  if (fmt(ahora, tz) === fmt(ahora, PR)) return null;
  const nombre = { "America/Bogota": "Colombia", "America/Mexico_City": "México", "America/Lima": "Perú", "America/Caracas": "Venezuela", "America/Santo_Domingo": "República Dominicana", "America/New_York": "Nueva York", "America/Argentina/Buenos_Aires": "Argentina", "America/Chicago": "Chicago" }[tz];
  return nombre ?? tz.split("/").pop()!.replace(/_/g, " ");
}
