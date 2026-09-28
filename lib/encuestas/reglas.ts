// Reportes del agente de encuestas de Level Up en #office-6-problemas-onboarding-clientes (Carilin, 28/sep/2026):
// "6 reportes en 3 minutos… uno dice que aceptó la llamada y los otros que la declinó… ++193973216800…
// RUT/ID… algunos me etiquetan y otros no". El agente (n8n) avisa cada vez que se le ocurre; aquí se juntan
// los avisos de UNA conversación, se espera a que termine y sale UN reporte con plantilla fija armada por
// código (teléfono, mención y prioridad nunca las escribe la IA). Lo nuevo va al hilo del reporte.
// Puro: lo usan lib/encuestas/reportes.ts y tests/encuestas.test.mjs.

export const SLACK_IDS = { jessica: "U08SN35L2UX", carilin: "U07V7MVJ18B" } as const;
export type Responsable = keyof typeof SLACK_IDS;

/** Minutos sin avisos nuevos para dar la conversación por terminada. */
export const ESPERA_MIN = 5;
/** Tras "finalizar-encuesta", basta con 1 minuto (pueden llegar avisos pegados). */
export const ESPERA_FINAL_MIN = 1;
/** Un aviso nuevo del mismo teléfono dentro de esta ventana va al mismo reporte (y a su hilo si ya salió). */
export const VENTANA_HORAS = 24;

export type TipoEvento = "alerta" | "asesor" | "finalizar";
export interface Evento {
  tipo: TipoEvento;
  destinatario?: string | null;
  mensaje?: string | null;
  at: string; // ISO
}

/** Solo los dígitos de un teléfono de PR/EE.UU. → 11 dígitos con el 1 delante; null si no cuadra. */
export function digitosTelefono(t: string | null | undefined): string | null {
  const d = String(t ?? "").replace(/\D/g, "");
  if (d.length === 10) return "1" + d;
  if (d.length === 11 && d.startsWith("1")) return d;
  // "++193973216800": 12+ dígitos que empiezan con 1 + 10 buenos → quedarse con los 11 primeros solo si
  // el sobrante es basura al final (pasó con un 0 de más). Si no, no se adivina.
  if (d.length > 11 && d.startsWith("1")) return d.slice(0, 11);
  return null;
}

/** "+1 939-732-1680" */
export function telefonoBonito(t: string | null | undefined): string | null {
  const d = digitosTelefono(t);
  if (!d) return null;
  return `+1 ${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
}

/** Link de Slack que marca: <tel:+19397321680|+1 939-732-1680> */
export function telefonoSlack(t: string | null | undefined): string {
  const d = digitosTelefono(t);
  return d ? `<tel:+${d}|${telefonoBonito(d)}>` : "—";
}

/** A quién va: por lo que puso el agente en "Destinatario"; el escalado a asesor va a las dos. */
export function responsables(eventos: Evento[]): Responsable[] {
  const r = new Set<Responsable>();
  for (const e of eventos) {
    if (e.tipo === "asesor") {
      r.add("jessica");
      r.add("carilin");
    }
    const d = (e.destinatario ?? "").toLowerCase();
    if (/jessica/.test(d)) r.add("jessica");
    if (/carilin/.test(d)) r.add("carilin");
  }
  if (!r.size) r.add("carilin");
  return (["jessica", "carilin"] as const).filter((x) => r.has(x));
}

/** ¿Ya se puede publicar? (sin avisos nuevos en ESPERA_MIN, o la encuesta terminó hace ESPERA_FINAL_MIN). */
export function listoParaPublicar(eventos: Evento[], ahora: Date): boolean {
  const conMensaje = eventos.filter((e) => e.tipo !== "finalizar");
  if (!conMensaje.length) return false; // solo "finalizar": no hay nada que reportar
  const ultimo = Math.max(...eventos.map((e) => Date.parse(e.at)));
  const finalizo = eventos.some((e) => e.tipo === "finalizar" && Date.parse(e.at) >= Math.max(...conMensaje.map((x) => Date.parse(x.at))));
  const espera = (finalizo ? ESPERA_FINAL_MIN : ESPERA_MIN) * 60_000;
  return ahora.getTime() - ultimo >= espera;
}

/** Quita oraciones repetidas seguidas ("Espero el proceso. Espero el proceso."). */
export function sinRepetir(texto: string): string {
  const partes = texto.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  for (const p of partes) {
    const k = p.trim().toLowerCase().replace(/[.!?\s]+$/g, "");
    if (k && out.some((o) => o.trim().toLowerCase().replace(/[.!?\s]+$/g, "") === k)) continue;
    out.push(p);
  }
  return out.join(" ").trim();
}

export const TIPOS = ["Encuesta 10 días", "Encuesta 30 días", "Queja", "Reembolso", "Contacto urgente", "Referido", "Otro"] as const;
export type TipoReporte = (typeof TIPOS)[number];
export type Prioridad = "alta" | "media" | "baja";

/** Lo que la IA saca de la conversación (solo datos; el formato es de código). */
export interface Extraccion {
  cliente: string | null;
  negocio: string | null;
  tipo: TipoReporte;
  calificacion: string | null; // "Regular", "4/10", "NPS 4"…
  comentario: string | null; // TEXTUAL del cliente
  quiereLlamada: boolean | null; // decisión FINAL
  accion: string | null;
  prioridad: Prioridad;
  noContactarIA: boolean; // pidió que le hable una persona / audio, no la IA
  preferencia: string | null; // cómo quiere que lo contacten, textual
}

/** Normaliza lo que devuelve la IA (tolerante: JSON suelto, campos raros). */
export function leerExtraccion(texto: string): Extraccion | null {
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(m[0]);
  } catch {
    return null;
  }
  const str = (v: unknown) => (typeof v === "string" && v.trim() && !/^(null|n\/a|—|-)$/i.test(v.trim()) ? v.trim() : null);
  const tipo = TIPOS.find((t) => t.toLowerCase() === String(j.tipo ?? "").toLowerCase()) ?? "Otro";
  const pr = String(j.prioridad ?? "").toLowerCase();
  const prioridad: Prioridad = pr === "alta" || pr === "baja" ? pr : "media";
  const ql = j.quiereLlamada;
  const noIA = j.noContactarIA === true;
  return {
    cliente: str(j.cliente),
    negocio: str(j.negocio),
    tipo,
    calificacion: str(j.calificacion),
    comentario: str(j.comentario) ? sinRepetir(str(j.comentario)!) : null,
    quiereLlamada: typeof ql === "boolean" ? ql : null,
    accion: str(j.accion),
    // Si pidió que no le escriba la IA, siempre alta: hay que escalarlo a una persona.
    prioridad: noIA ? "alta" : prioridad,
    noContactarIA: noIA,
    preferencia: str(j.preferencia),
  };
}

const PUNTO: Record<Prioridad, string> = { alta: "🔴 Alta", media: "🟡 Media", baja: "🟢 Baja" };

/** La plantilla fija de Carilin. `actualizacion` = va en el hilo del reporte original. */
export function plantilla(p: { x: Extraccion; telefono: string | null; nombreChatwoot?: string | null; responsables: Responsable[]; actualizacion?: boolean; iaApagada?: boolean }): string {
  const { x } = p;
  const cliente = x.cliente || p.nombreChatwoot || "—";
  const lineas = [
    p.actualizacion ? "🔄 *Actualización (queda esto como decisión final)*" : "📋 *Reporte de cliente*",
    `• *Cliente / Negocio:* ${cliente}${x.negocio ? ` · ${x.negocio}` : ""}`,
    `• *Teléfono:* ${telefonoSlack(p.telefono)}`,
    `• *Tipo:* ${x.tipo}`,
    `• *Calificación / NPS:* ${x.calificacion ?? "—"}`,
    `• *Comentario del cliente:* ${x.comentario ? `"${x.comentario.replace(/^"|"$/g, "")}"` : "—"}`,
    `• *¿Quiere llamada?:* ${x.quiereLlamada === true ? "Sí" : x.quiereLlamada === false ? "No" : "No lo dijo"}`,
  ];
  if (x.noContactarIA)
    lineas.push(
      `• ⚠️ *No contactar por IA:* ${x.preferencia ?? "pidió que le hable una persona"}. ${p.iaApagada ? "El agente ya no le contesta" : "OJO: no se pudo apagar el agente para este cliente"}; que lo atienda alguien del equipo.`,
    );
  else if (x.preferencia) lineas.push(`• *Cómo prefiere que lo contacten:* ${x.preferencia}`);
  lineas.push(`• *Acción requerida:* ${x.accion ?? "Revisar"} — prioridad ${PUNTO[x.prioridad]}`);
  lineas.push(`• *Responsable:* ${p.responsables.map((r) => `<@${SLACK_IDS[r]}>`).join(" ")}`);
  return lineas.join("\n");
}

/** Firma del contenido: si no cambió nada relevante, no se repite en el hilo. */
export function huella(x: Extraccion): string {
  return JSON.stringify([x.tipo, x.calificacion, x.comentario, x.quiereLlamada, x.accion, x.prioridad, x.noContactarIA]);
}
