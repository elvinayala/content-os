import "server-only";

import { clienteDeReunion, markdownASlack, type ReunionConTranscripcion, transcripcionCorta } from "@/lib/fathom";

import { notaEnAprobaciones } from "./flujo";
import { encabezadoBuzon, slugCliente } from "./operador";
import { alBuzonMax, buscarCliente, cliente, guardarCliente } from "./repo";

// Cómo arranca Max con un cliente nuevo de Level Up (Elvin, 24/sep/2026):
//  1. El cliente llena el formulario de onboarding → se abre el expediente con sus respuestas (sin
//     despertar a Max: no gasta; MAX_ONBOARDING=on lo despertaría ya).
//  2. Jessica termina la reunión de onboarding → Fathom manda el resumen (/api/fathom) → Max arranca
//     AL INSTANTE y en #max-aprobaciones se le pide a Jessica su propio resumen. Con los dos, Max arma
//     el plan y lo sube a aprobación (Jessica, Carilin o Elvin).

export async function iniciarClienteMax(r: { nombre: string; negocio: string; resumen: string; itemId: string; estado: string; email?: string }): Promise<void> {
  const nombre = r.negocio ? `${r.negocio} (${r.nombre})` : r.nombre;
  const slug = slugCliente(r.negocio || r.nombre);
  const previo = await cliente(slug);
  await guardarCliente({ slug, nombre, etapa: previo ? undefined : "onboarding", ficha: { onboarding: r.resumen.slice(0, 8000), ...(r.email ? { email: r.email } : {}) }, pulseItem: r.itemId });
  if (process.env.MAX_ONBOARDING !== "on" || !process.env.SLACK_MAX_CHANNEL_ID) return;
  await alBuzonMax(`${encabezadoBuzon("onboarding", { cliente: slug, pulse: r.itemId, estado: r.estado })}\nCliente: ${nombre}\n\n${r.resumen.slice(0, 6000)}`);
}

const JESSICA = () => process.env.MAX_PM_SLACK_ID || "U08SN35L2UX";

// prueba = true: lo mismo pero marcado 🧪, sin etiquetar a Jessica y sin despertar a Max (no gasta).
export async function onboardingDesdeFathom(r: ReunionConTranscripcion, opciones: { prueba?: boolean } = {}): Promise<{ slug: string; pedidoEnviado: boolean } | null> {
  const prueba = Boolean(opciones.prueba);
  if (process.env.MAX_FATHOM === "off" || !process.env.SLACK_MAX_CHANNEL_ID) return null;
  const { nombre, emails } = clienteDeReunion(r);
  const existente = await buscarCliente(emails, slugCliente(nombre));
  const slug = existente?.slug ?? (prueba ? "prueba-fathom" : slugCliente(nombre));
  const resumen = r.default_summary?.markdown_formatted?.trim() || "(Fathom no generó resumen)";
  const tareas = (r.action_items ?? []).filter((t) => t.description?.trim()).map((t) => `- ${t.description!.trim()}${t.assignee?.name ? ` (${t.assignee.name})` : ""}`).join("\n");
  const link = r.share_url || r.url || "";
  await guardarCliente({
    slug,
    nombre: existente ? undefined : nombre,
    etapa: existente && existente.etapa !== "onboarding" ? undefined : "onboarding",
    ficha: {
      fathom_onboarding: resumen.slice(0, 8000),
      fathom_tareas: tareas.slice(0, 3000),
      fathom_link: link,
      fathom_transcripcion: transcripcionCorta(r),
      ...(emails[0] && !existente?.ficha?.email ? { email: emails[0] } : {}),
    },
  });

  // El pedido a Jessica: su hilo es donde contesta, y esa respuesta le llega a Max.
  const pedido = [
    `${prueba ? "🧪 PRUEBA (ignoren) · " : ""}📞 *Terminó el onboarding de ${existente?.nombre || nombre}* (${r.recorded_by?.name || "Jessica"})${link ? ` · <${link}|Fathom>` : ""}`,
    "",
    markdownASlack(resumen).slice(0, 1500),
    "",
    `${prueba ? "@Jessica" : `<@${JESSICA()}>`} déjame *tu resumen aquí en este hilo*: lo que viste del negocio, qué le prometimos, qué falta (accesos, material, videos) y cualquier alerta. Con eso armo el plan y lo subo a aprobación. Ya empecé a investigar. — Max`,
    `_(cliente: ${slug})_`,
  ].join("\n");
  const ok = await notaEnAprobaciones(pedido);

  if (prueba) return { slug, pedidoEnviado: ok };
  await alBuzonMax(
    `${encabezadoBuzon("onboarding", { cliente: slug, fuente: "fathom", recording: r.recording_id })}\n` +
      `Jessica terminó el onboarding de ${existente?.nombre || nombre}. ARRANCA YA: lee el expediente (max.mjs cliente ${slug}: formulario, Fathom y transcripción), la llamada de venta (max.mjs llamada '${(existente?.nombre || nombre).split(" (")[0]}'), espía la competencia y haz la matemática comercial. ` +
      `${ok ? "Ya le pedí a Jessica su resumen en #max-aprobaciones; su respuesta te llega como [Max canal · de Jessica …]." : "No pude pedirle el resumen a Jessica en #max-aprobaciones: pídeselo tú con una nota."} ` +
      `Cuando tengas su resumen, arma el plan (cerebro §14) y súbelo con max.mjs proponer ${slug} plan. Si su resumen no llega, NO inventes lo que falta: deja el borrador listo y recuérdaselo con una nota en el mismo hilo.\n\nResumen de Fathom:\n${resumen.slice(0, 5000)}\n\nTareas:\n${tareas || "(ninguna)"}`,
  );
  return { slug, pedidoEnviado: ok };
}
