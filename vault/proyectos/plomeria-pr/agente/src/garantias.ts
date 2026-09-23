/**
 * Garantías: 12 meses en mano de obra desde que se terminó el trabajo. El gerente la abre desde el portal →
 * se crea un re-trabajo ($0 al cliente) y se le ofrece SOLO al plomero original con 48 h para aceptar
 * (contrato: re-trabajo sin costo en 48 h). Si no acepta, cae al coordinador para reasignar.
 */
import { almacen, type Trabajo } from "./almacen.js";
import * as despacho from "./despacho.js";
import { enviarTexto, avisarCoordinador } from "./canales/whatsapp.js";
import { menu } from "./prompt.js";
import { archivar } from "./historial.js";

export function vigenciaGarantia(t: Trabajo): { vigente: boolean; vence?: string } {
  if (!t.terminadoEn || t.garantiaDe) return { vigente: false };
  const vence = new Date(t.terminadoEn); vence.setMonth(vence.getMonth() + menu.garantia_meses);
  return { vigente: vence.getTime() > Date.now(), vence: vence.toISOString() };
}

export async function abrirGarantia(trabajoId: string, d: { motivo: string; inicio: string; fin: string; autor: string }) {
  const t = almacen.trabajos().find((x) => x.id === trabajoId);
  if (!t) return { ok: false, motivo: "No existe ese trabajo." };
  const v = vigenciaGarantia(t);
  if (!v.vigente) return { ok: false, motivo: t.garantiaDe ? "Ese ya es un trabajo de garantía." : `La garantía no está vigente${v.vence ? ` (venció ${v.vence.slice(0, 10)})` : ""}.` };
  if (almacen.trabajos().some((x) => x.garantiaDe === t.id && !["completado", "cobrado", "cancelado"].includes(x.estado))) return { ok: false, motivo: "Ya hay una garantía abierta para ese trabajo." };
  const id = almacen.nuevoIdTrabajo();
  const g: Trabajo = { ...t, id, servicio: `Garantía · ${t.servicio}`, manoObra: 0, rango: undefined, fee: 0, emergencia: false, inicio: d.inicio, fin: d.fin, estado: "agendado", plomeroId: "", garantiaDe: t.id, ghlOpportunityId: undefined, linkPago: undefined, fotos: [], fotosAntes: [], fotosDespues: [], enCaminoEn: undefined, llegadaEn: undefined, terminadoEn: undefined, manoObraFinal: undefined, materialesCosto: undefined, totalCliente: undefined, pagoPlomero: undefined, pagadoAlPlomero: undefined, notaCierre: undefined, notasInternas: [{ fecha: new Date().toISOString(), autor: `staff:${d.autor}`, texto: `Garantía abierta: ${d.motivo}` }], creado: new Date().toISOString() };
  almacen.guardarTrabajo(g);
  const o = await despacho.crearOferta({ tipo: "trabajo", referencia: id, categoria: "plomeria", categoriaNombre: g.servicio, territorio: t.territorio, municipio: t.municipio, resumen: `GARANTÍA de ${t.id} (sin costo, contrato: 48 h). ${d.motivo}`, pagoProveedor: 0, inicio: d.inicio, fin: d.fin }, { soloProveedor: t.plomeroId || undefined, minutos: 48 * 60 });
  archivar(t.contactoId, "staff", `${d.autor} abrió garantía ${id} sobre ${t.id}: ${d.motivo}`, id);
  await enviarTexto(t.telefono, `Hola ${t.nombre.split(" ")[0]}, abrimos tu garantía del trabajo ${t.id} (${t.servicio.toLowerCase()}). No tiene costo. Te confirmamos por aquí quién va y cuándo.`).catch(() => undefined);
  await avisarCoordinador(`🛡️ Garantía abierta ${id} sobre ${t.id} (${t.nombre}) por ${d.autor}. Ofrecida a ${t.plomeroId || "nadie (sin plomero original)"} · 48 h.\nMotivo: ${d.motivo}`).catch(() => undefined);
  return { ok: true, trabajo: g, oferta: o.id };
}
