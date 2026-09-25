import "server-only";

import { altaOnboarding, type ResultadoAlta } from "@/lib/pulse/alta-typeform";
import { formatearTelefono } from "@/lib/pulse/typeform";

import { PREGUNTAS, type Respuestas, texto, visible } from "./level-up";

// Formulario propio de Level Up → ficha del cliente en Pulse.
export async function altaDesdeFormulario(token: string, r: Respuestas, opciones: { tablero?: string } = {}): Promise<ResultadoAlta & { resumen: string; negocio: string; email: string }> {
  const columnas: Record<string, string> = {};
  for (const p of PREGUNTAS) {
    if (!p.columna || !visible(p, r)) continue;
    const v = texto(r[p.id]);
    if (!v || v === "No recuerdo") continue;
    columnas[p.columna] = p.tipo === "numero" ? v.replace(/[$,\s]/g, "") : v;
  }
  const lineas = PREGUNTAS.filter((p) => visible(p, r) && texto(r[p.id])).map((p) => `• ${p.titulo.replace(/^¿|\?$/g, "")}: ${texto(r[p.id])}`);
  const resumen = `📝 Formulario de onboarding de Level Up (${new Date().toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico" })})\n${lineas.join("\n")}`;
  const tel = texto(r.telefono);
  const alta = await altaOnboarding(
    {
      token,
      nombreCompleto: texto(r.nombre).slice(0, 300) || texto(r.negocio) || "Cliente nuevo",
      email: texto(r.email).toLowerCase() || null,
      telefono: tel ? formatearTelefono(tel) : null,
      columnas,
      resumen,
    },
    { tablero: opciones.tablero, origen: "formulario" },
  );
  // Max (24/sep) arranca el proceso del cliente con estas mismas respuestas.
  return { ...alta, resumen, negocio: texto(r.negocio), email: texto(r.email).toLowerCase() };
}
