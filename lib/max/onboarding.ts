import "server-only";

import { encabezadoBuzon, slugCliente } from "./operador";
import { alBuzonMax, cliente, guardarCliente } from "./repo";

// Formulario de onboarding de Level Up → Max abre el expediente del cliente y arranca el proceso
// (ficha → llamada de venta → competencia → plan de marketing a #max-aprobaciones).
export async function iniciarClienteMax(r: { nombre: string; negocio: string; resumen: string; itemId: string; estado: string }): Promise<void> {
  // Apagado por defecto (24/sep): Elvin todavía no habilitó canales de clientes y cada arranque
  // gasta (~$20-30 la primera semana). Se prende con MAX_ONBOARDING=on.
  if (process.env.MAX_ONBOARDING !== "on") return;
  const nombre = r.negocio ? `${r.negocio} (${r.nombre})` : r.nombre;
  const slug = slugCliente(r.negocio || r.nombre);
  const previo = await cliente(slug);
  await guardarCliente({ slug, nombre, etapa: previo ? undefined : "onboarding", ficha: { onboarding: r.resumen.slice(0, 8000) }, pulseItem: r.itemId });
  // Sin #max-aprobaciones todavía, Max no tendría dónde pedir aprobación: el expediente queda
  // abierto y arranca cuando exista el canal (Max revisa los expedientes en onboarding).
  if (!process.env.SLACK_MAX_CHANNEL_ID) return;
  await alBuzonMax(`${encabezadoBuzon("onboarding", { cliente: slug, pulse: r.itemId, estado: r.estado })}\nCliente: ${nombre}\n\n${r.resumen.slice(0, 6000)}`);
}
