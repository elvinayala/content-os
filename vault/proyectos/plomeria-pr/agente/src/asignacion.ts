/**
 * Asignación manual de un trabajo a un plomero desde el portal (10/oct/2026, Aure: "necesito poder asignarle un trabajo
 * directamente a un plomero cuando ninguno haya aceptado la notificación inicial… que quede registrada y le aparezca en su
 * aplicación"). La app del plomero muestra solo trabajos con una oferta aceptada por él, así que asignar = dejar una oferta
 * "asignada-manual" a su nombre (sin alertas de oferta nueva), con el mismo aviso de "es tuyo" que recibe quien acepta.
 */
import { almacen, type Trabajo } from "./almacen.js";
import * as despacho from "./despacho.js";
import { porId } from "./proveedores.js";

const r2 = (n: number) => Math.round(n * 100) / 100;
const CERRADOS = ["completado", "cobrado", "cancelado"];

export type EstadoAsignacion = { clave: "sin-plomero" | "en-su-app" | "no-le-aparece"; plomeroId: string; ofertaId?: string };
/** ¿Tiene plomero y le aparece en su app? Pura (tests): `ofertas` = las de ese trabajo. */
export function estadoAsignacion(t: Pick<Trabajo, "plomeroId">, ofertas: Pick<despacho.Oferta, "id" | "estado" | "aceptadoPor">[]): EstadoAsignacion {
  const tomada = ofertas.find((o) => o.aceptadoPor && (o.estado === "aceptada" || o.estado === "asignada-manual"));
  if (tomada) return { clave: "en-su-app", plomeroId: tomada.aceptadoPor!, ofertaId: tomada.id };
  if (t.plomeroId) return { clave: "no-le-aparece", plomeroId: t.plomeroId };
  return { clave: "sin-plomero", plomeroId: "" };
}

export async function asignarManual(trabajoId: string, proveedorId: string, por: string, opc: { reasignar?: boolean } = {}): Promise<{ ok: true; oferta: string; nombre: string } | { ok: false; motivo: string }> {
  const t = almacen.trabajos().find((x) => x.id === trabajoId); if (!t) return { ok: false, motivo: "No existe ese trabajo." };
  const p = porId(proveedorId); if (!p) return { ok: false, motivo: "Ese plomero no está registrado." };
  if (p.estado !== "activo") return { ok: false, motivo: `${p.nombre} está pausado: actívalo primero.` };
  if (CERRADOS.includes(t.estado)) return { ok: false, motivo: "Ese trabajo ya está terminado o cancelado." };
  const ofs = despacho.ofertas().filter((o) => o.tipo === "trabajo" && o.referencia === t.id);
  const est = estadoAsignacion(t, ofs);
  if (est.clave === "en-su-app" && est.plomeroId === p.id) return { ok: false, motivo: `Ya lo tiene ${p.nombre} y le aparece en su app.` };
  if (est.clave === "en-su-app") {
    if (!opc.reasignar) return { ok: false, motivo: `Ya lo tiene ${porId(est.plomeroId)?.nombre ?? est.plomeroId}. Confirma el cambio para pasárselo a ${p.nombre}.` };
    await despacho.liberar(est.ofertaId!, `Resuelto lo pasó a otro plomero`);
  }
  const previa = ofs.at(-1);
  const mano = t.manoObraFinal ?? t.manoObra ?? 0;
  const o = await despacho.crearOferta({
    tipo: "trabajo", referencia: t.id, categoria: previa?.categoria ?? "plomeria", categoriaNombre: previa?.categoriaNombre ?? t.servicio, territorio: t.territorio, municipio: t.municipio,
    resumen: previa?.resumen ?? t.servicio, pagoProveedor: previa?.pagoProveedor ?? r2(mano * 0.65), inicio: t.inicio, fin: t.fin,
  }, { soloProveedor: p.id, silenciosa: true });
  // Al cliente solo se le confirma si la cita está por venir (no se le escribe por una que ya pasó).
  const futura = new Date(t.inicio).getTime() - Date.now() > 3600_000;
  const r = await despacho.aceptar(o.id, p.id, true, { avisarAlCliente: futura });
  if (!r.ok) return { ok: false, motivo: r.motivo };
  const t2 = almacen.trabajos().find((x) => x.id === t.id)!;
  almacen.guardarTrabajo({ ...t2, notasInternas: [...(t2.notasInternas ?? []), { fecha: new Date().toISOString(), autor: `staff:${por}`, texto: `Asignado a mano a ${p.nombre} (${o.id}). Le aparece en su app y se le avisó.` }] });
  return { ok: true, oferta: o.id, nombre: p.nombre };
}
