/**
 * QA + Recovery. 24 h después de una propuesta que no cerró, el agente abre por WhatsApp la
 * encuesta post-visita (las 13 preguntas de Elvin, agrupadas en 3–4 mensajes). Las respuestas
 * auditan al cotizador y, si hay señal de recuperación (precio, comparando, financiamiento,
 * fecha), el proyecto entra a la cola de Recovery para que un humano lo llame.
 * Comisión si Recovery recupera: 2% cotizador + 0.5% Recovery (en vez de 2.5%).
 */
import { almacen, type Proyecto } from "./almacen.js";
import { config } from "./config.js";
import { enviarTexto, avisarCoordinador } from "./canales/whatsapp.js";

export const HORAS_ESPERA = Number(process.env.ENCUESTA_HORAS ?? 24);
export const MOTIVOS = ["precio", "comparando", "financiamiento", "fecha", "confianza", "scope", "representante", "aun_decidiendo", "ya_contrato_otro", "otro"] as const;
export type Motivo = (typeof MOTIVOS)[number];
const SENAL_RECOVERY: Motivo[] = ["precio", "comparando", "financiamiento", "fecha", "aun_decidiendo"];

export interface Encuesta {
  enviadaEn: string; completadaEn?: string;
  llegoATiempo?: boolean; profesional?: number; explicoBien?: number; cotizacionClara?: number;   // 1–5
  precioRecibido?: number; contrato?: boolean; motivoNoContrato?: Motivo; estaComparando?: boolean;
  interesFinanciamiento?: boolean; fechaDeseada?: string; problemaRepresentante?: string; comentario?: string;
  senalRecovery?: boolean; recovery?: { asignadoEn: string; llamadas: number; resultado?: "recuperado" | "perdido" | "en-proceso"; notas?: string[] };
}

const horas = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

/** Corre cada 30 min: abre encuestas a propuestas de hace 24 h+ que no cerraron. */
export async function revisarPendientes() {
  for (const p of almacen.proyectos()) {
    if (p.estado !== "propuesta" || !p.cotizacion || p.encuesta) continue;
    if (horas(p.cotizacion.actualizado) < HORAS_ESPERA) continue;
    const nombre = p.nombre.split(" ")[0];
    await enviarTexto(p.telefono, `Hola ${nombre}, soy de Resuelto (no soy el cotizador que te visitó). Quiero saber cómo te fue con la visita; son 4 preguntas cortas y nos ayuda a mejorar. ¿El representante llegó a tiempo y fue profesional?`);
    almacen.guardarProyecto({ ...p, encuesta: { enviadaEn: new Date().toISOString() } });
  }
}

/** La herramienta del agente guarda las respuestas y decide si entra a Recovery. */
export async function registrar(proyectoId: string, r: Partial<Encuesta>): Promise<{ ok: boolean; senalRecovery: boolean; alertaRepresentante: boolean }> {
  const p = almacen.proyectos().find((x) => x.id === proyectoId);
  if (!p) return { ok: false, senalRecovery: false, alertaRepresentante: false };
  const e: Encuesta = { ...(p.encuesta ?? { enviadaEn: new Date().toISOString() }), ...r, completadaEn: new Date().toISOString() };
  e.senalRecovery = !e.contrato && (!!e.motivoNoContrato && SENAL_RECOVERY.includes(e.motivoNoContrato) || !!e.estaComparando || !!e.interesFinanciamiento);
  if (e.senalRecovery && !e.recovery) e.recovery = { asignadoEn: new Date().toISOString(), llamadas: 0, resultado: "en-proceso" };
  const alertaRepresentante = !!e.problemaRepresentante || e.llegoATiempo === false || (e.profesional ?? 5) <= 2;
  almacen.guardarProyecto({ ...p, encuesta: e });

  const res = [`📋 Encuesta ${p.id} · ${p.nombre} · cotizador ${p.cotizadorId ?? "?"}`,
    `A tiempo: ${e.llegoATiempo === undefined ? "?" : e.llegoATiempo ? "sí" : "NO"} · profesional ${e.profesional ?? "?"}/5 · explicó ${e.explicoBien ?? "?"}/5 · claridad ${e.cotizacionClara ?? "?"}/5`,
    `Contrató: ${e.contrato ? "sí" : "no"}${e.motivoNoContrato ? ` · motivo: ${e.motivoNoContrato}` : ""}${e.precioRecibido ? ` · precio que recuerda: $${e.precioRecibido}` : ""}${e.estaComparando ? " · está comparando" : ""}${e.interesFinanciamiento ? " · quiere financiamiento" : ""}`,
    e.comentario ? `"${e.comentario}"` : ""].filter(Boolean).join("\n");
  if (e.senalRecovery) await avisarCoordinador(`🔁 RECOVERY · ${res}\nLlamar en 24 h: ${config.urlPublica}/admin/recovery?t=${config.adminToken}`);
  else if (alertaRepresentante) await avisarCoordinador(`🚩 Alerta de representante · ${res}${e.problemaRepresentante ? `\nProblema: ${e.problemaRepresentante}` : ""}`);
  else await avisarCoordinador(res);
  return { ok: true, senalRecovery: !!e.senalRecovery, alertaRepresentante };
}

/** Cola de Recovery: proyectos con señal, no cerrados, ordenados por precio (los grandes primero). */
export function colaRecovery(): Proyecto[] {
  return almacen.proyectos().filter((p) => p.encuesta?.senalRecovery && p.encuesta.recovery?.resultado === "en-proceso" && !["cerrado", "asignado", "en-ejecucion", "completado", "cancelado"].includes(p.estado)).sort((a, b) => (b.precio ?? 0) - (a.precio ?? 0));
}

export function registrarLlamada(proyectoId: string, o: { resultado?: "recuperado" | "perdido" | "en-proceso"; nota?: string }) {
  const p = almacen.proyectos().find((x) => x.id === proyectoId); if (!p?.encuesta?.recovery) return null;
  const r = p.encuesta.recovery; r.llamadas++; if (o.nota) r.notas = [...(r.notas ?? []), `${new Date().toISOString().slice(0, 16)}: ${o.nota}`]; if (o.resultado) r.resultado = o.resultado;
  almacen.guardarProyecto(p); return r;
}

/** Comisión al cerrar: 2.5% al cotizador, o 2% + 0.5% si Recovery lo recuperó. */
export function comision(p: Proyecto) {
  const precio = p.cotizacion?.precioFinal ?? p.precio ?? 0;
  const conRecovery = p.encuesta?.recovery?.resultado === "recuperado";
  return conRecovery ? { cotizador: +(precio * 0.02).toFixed(2), recovery: +(precio * 0.005).toFixed(2), conRecovery } : { cotizador: +(precio * 0.025).toFixed(2), recovery: 0, conRecovery };
}
