import "server-only";

import { altaOnboarding, type ResultadoAlta } from "@/lib/pulse/alta-typeform";
import { formatearTelefono } from "@/lib/pulse/typeform";

import { PREGUNTAS, type Respuestas, texto, visible } from "./level-up";

// Formulario propio de Level Up → ficha del cliente en Pulse.
export async function altaDesdeFormulario(token: string, r: Respuestas, opciones: { tablero?: string } = {}): Promise<ResultadoAlta> {
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
  return altaOnboarding(
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
}
