/**
 * Ciclo de un trabajo desde la app del plomero: voy en camino → llegué → fotos → terminé → cobro al cliente.
 * Y el estado de cuenta semanal (lo que se le paga el viernes).
 * Reglas de negocio: el precio del menú no se cambia; si el servicio es por rango, la mano de obra final va dentro del
 * rango (si se pasa, exige nota y avisa al coordinador). Materiales: el cliente paga costo + 20 %; el plomero recibe costo + 10 %.
 * Sin al menos 1 foto del "después" no se puede cerrar.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { RAIZ, almacen, type Trabajo } from "./almacen.js";
import * as despacho from "./despacho.js";
import { enviarTexto, avisarCoordinador } from "./canales/whatsapp.js";
import { avisarCliente } from "./aviso-cliente.js";
import { crearLinkPago } from "./integraciones/cobros.js";
import { actualizarOportunidad } from "./integraciones/crm.js";
import { menu } from "./prompt.js";
import { config } from "./config.js";
import type { Proveedor } from "./proveedores.js";
import { archivar } from "./historial.js";

export const DIR_FOTOS = path.join(RAIZ, "data", "estado", "fotos-trabajos");
fs.mkdirSync(DIR_FOTOS, { recursive: true });
const r2 = (n: number) => Math.round(n * 100) / 100;
const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-PR", { timeZone: config.zonaHoraria, hour: "numeric", minute: "2-digit" });

function trabajoDe(ofertaId: string, p: Proveedor): { t: Trabajo } | { error: string } {
  const o = despacho.oferta(ofertaId);
  if (!o || o.tipo !== "trabajo") return { error: "Ese trabajo no existe." };
  if (o.aceptadoPor !== p.id) return { error: "Ese trabajo no es tuyo." };
  const t = almacen.trabajos().find((x) => x.id === o.referencia);
  if (!t) return { error: "No encuentro el trabajo." };
  if (t.estado === "cancelado") return { error: "El cliente canceló este trabajo." };
  return { t };
}

/** Lo que la app necesita mostrar del trabajo (datos del cliente solo para el plomero asignado). */
export function resumenParaPlomero(t: Trabajo) {
  const s = menu.servicios.find((x: any) => x.id === t.servicioId) as any;
  return {
    id: t.id, estado: t.estado, cliente: t.nombre, telefono: t.telefono, direccion: t.direccion, municipio: t.municipio, referencia: t.referencia,
    servicio: t.servicio, precioFijo: t.manoObra, rango: t.rango ?? s?.rango ?? null, emergencia: t.emergencia,
    inicio: t.inicio, fin: t.fin, fotosAntes: (t.fotosAntes ?? []).length, fotosDespues: (t.fotosDespues ?? []).length,
    totalCliente: t.totalCliente ?? null, pagoPlomero: t.pagoPlomero ?? null, manejoMaterialesPct: menu.manejo_materiales_pct,
  };
}

export async function avanzar(ofertaId: string, p: Proveedor, paso: "en-camino" | "llegue" | "terminado", d: { mano_obra?: number; materiales?: number; nota?: string } = {}) {
  const r = trabajoDe(ofertaId, p); if ("error" in r) return { ok: false, motivo: r.error };
  const t = r.t; const ahora = new Date().toISOString(); const primer = p.nombre.split(" ")[0];

  if (paso === "en-camino") {
    if (t.estado !== "agendado") return { ok: false, motivo: "Ya marcaste este paso." };
    almacen.guardarTrabajo({ ...t, estado: "en-camino", enCaminoEn: ahora });
    archivar(t.contactoId, "sistema", `${t.id}: ${p.nombre} marcó "voy en camino".`, t.id);
    await avisarCliente(t, `Hola ${t.nombre.split(" ")[0]} 👋 Te escribe Resuelto.\n\n${primer}, tu plomero licenciado, va en camino para tu ${t.servicio.toLowerCase()}. Llega dentro de tu ventana (${hora(t.inicio)}–${hora(t.fin)}).\n\nRecuerda: al final le pagas a Resuelto por link o ATH Móvil, nunca en efectivo al plomero. Cualquier cosa, escríbenos por aquí.`).catch(() => undefined);
    return { ok: true, estado: "en-camino" };
  }
  if (paso === "llegue") {
    if (t.estado !== "en-camino" && t.estado !== "agendado") return { ok: false, motivo: "Ya marcaste este paso." };
    almacen.guardarTrabajo({ ...t, estado: "en-sitio", llegadaEn: ahora, enCaminoEn: t.enCaminoEn ?? ahora });
    archivar(t.contactoId, "sistema", `${t.id}: ${p.nombre} llegó.`, t.id);
    return { ok: true, estado: "en-sitio", recordatorio: "Toma fotos del ANTES antes de tocar nada." };
  }

  // terminado
  if (t.estado === "completado" || t.estado === "cobrado") return { ok: false, motivo: "Este trabajo ya está cerrado." };
  if (!(t.fotosDespues ?? []).length) return { ok: false, motivo: "Sube al menos una foto del DESPUÉS antes de cerrar." };
  const rango = t.rango;
  let mano = t.manoObra ?? Number(d.mano_obra);
  if (t.manoObra == null) {
    if (!Number.isFinite(mano) || mano <= 0) return { ok: false, motivo: "Escribe la mano de obra final (este servicio es por rango)." };
    if (rango && mano < rango[0]) return { ok: false, motivo: `La mano de obra no puede ser menor que $${rango[0]} para este servicio.` };
    if (rango && mano > rango[1] && !d.nota?.trim()) return { ok: false, motivo: `Pasa del rango publicado ($${rango[0]}–$${rango[1]}). Explica por qué en la nota; el coordinador lo revisa.` };
  }
  const mat = Math.max(0, Number(d.materiales) || 0);
  if (t.garantiaDe) {
    // Re-trabajo de garantía: $0 al cliente; Resuelto reembolsa materiales (hasta $150, contrato del plomero).
    const reembolso = r2(Math.min(mat, 150));
    almacen.guardarTrabajo({ ...t, estado: "cobrado", terminadoEn: ahora, manoObraFinal: 0, materialesCosto: mat, totalCliente: 0, pagoPlomero: reembolso, notaCierre: d.nota?.trim() || undefined });
    archivar(t.contactoId, "sistema", `${t.id} (garantía de ${t.garantiaDe}) resuelto por ${p.nombre}. ${d.nota ?? ""}`.trim(), t.id);
    await avisarCliente(t, `✅ ${t.nombre.split(" ")[0]}, ${primer} resolvió tu garantía (${t.garantiaDe}). No tienes que pagar nada. Si algo no quedó bien, escríbenos por aquí.`).catch(() => undefined);
    await avisarCoordinador(`🛡️ Garantía cerrada ${t.id} (de ${t.garantiaDe}) por ${p.nombre}${mat ? ` · materiales $${mat} (reembolso $${reembolso})` : ""}${d.nota ? `\nNota: ${d.nota}` : ""}`).catch(() => undefined);
    return { ok: true, estado: "completado", total: 0, pago: reembolso, garantia: true };
  }
  const recargo = t.emergencia ? menu.recargo_emergencia : 0;
  const matCliente = r2(mat * (1 + menu.manejo_materiales_pct / 100));
  const total = r2(mano + t.fee + recargo + matCliente);
  const pago = r2(mano * 0.65 + recargo * 0.65 + mat * 1.1);
  const link = await crearLinkPago({ trabajoId: t.id, concepto: t.servicio, montoCentavos: Math.round(total * 100), telefono: t.telefono });
  almacen.guardarTrabajo({ ...t, estado: "completado", terminadoEn: ahora, manoObraFinal: mano, materialesCosto: mat, totalCliente: total, pagoPlomero: pago, linkPago: link.url, notaCierre: d.nota?.trim() || undefined });
  archivar(t.contactoId, "sistema", `${t.id} terminado por ${p.nombre}. Cliente $${total.toFixed(2)} (mano de obra $${mano}${mat ? `, materiales $${matCliente}` : ""}). Pago plomero $${pago.toFixed(2)}.${d.nota ? " Nota: " + d.nota : ""}`, t.id);
  const desglose = [`Mano de obra: $${mano.toFixed(2)}`, recargo ? `Emergencia: $${recargo.toFixed(2)}` : "", mat ? `Materiales: $${matCliente.toFixed(2)}` : "", `Coordinación: $${t.fee.toFixed(2)}`].filter(Boolean).join("\n");
  await avisarCliente(t, `✅ ¡Listo, ${t.nombre.split(" ")[0]}! ${primer} terminó tu ${t.servicio.toLowerCase()}.\n\n${desglose}\n*Total: $${total.toFixed(2)}*\n\nPaga aquí: ${link.url ?? ""}\nO por ATH Móvil: ${link.athMovil}\n\nTu trabajo tiene garantía de ${menu.garantia_meses} meses en mano de obra. Mañana te escribimos para saber cómo te fue.`).catch(() => undefined);
  if (t.ghlOpportunityId && process.env.GHL_STAGE_COMPLETADO) await actualizarOportunidad(t.ghlOpportunityId, { stageId: process.env.GHL_STAGE_COMPLETADO, monetaryValue: total }).catch(() => undefined);
  const fueraDeRango = rango && t.manoObra == null && mano > rango[1];
  await avisarCoordinador(`${fueraDeRango ? "⚠️ FUERA DE RANGO · " : "🧾 "}${t.id} terminado por ${p.nombre}\n${t.servicio} · ${t.municipio}\nTotal cliente $${total.toFixed(2)} · pago plomero $${pago.toFixed(2)}${d.nota ? `\nNota: ${d.nota}` : ""}`).catch(() => undefined);
  return { ok: true, estado: "completado", total, pago, link: link.url, simulado: link.simulado };
}

/** Guarda una foto (data URL) del antes/después, redimensionada a 1600 px. */
export async function guardarFoto(ofertaId: string, p: Proveedor, tipo: "antes" | "despues", dataUrl: string) {
  const r = trabajoDe(ofertaId, p); if ("error" in r) return { ok: false, motivo: r.error };
  const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(dataUrl ?? ""); if (!m) return { ok: false, motivo: "Foto inválida." };
  const t = r.t; const lista = [...((tipo === "antes" ? t.fotosAntes : t.fotosDespues) ?? [])];
  if (lista.length >= 6) return { ok: false, motivo: "Máximo 6 fotos por etapa." };
  const archivo = `${t.id}-${tipo}-${lista.length + 1}-${Date.now().toString(36)}.jpg`;
  await sharp(Buffer.from(m[1], "base64")).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(path.join(DIR_FOTOS, archivo));
  lista.push(archivo);
  almacen.guardarTrabajo({ ...t, ...(tipo === "antes" ? { fotosAntes: lista } : { fotosDespues: lista }), fotos: [...(t.fotos ?? []), archivo] });
  return { ok: true, total: lista.length };
}

/** Lunes 00:00 (hora PR) de la semana de una fecha, como Date UTC. */
function lunesPR(d: Date) {
  const pr = new Date(d.getTime() - 4 * 3600_000); const dow = (pr.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(pr.getUTCFullYear(), pr.getUTCMonth(), pr.getUTCDate() - dow, 4));
}
/** Estado de cuenta: semana actual (se paga el viernes siguiente) y la anterior. */
export function cuentaSemanal(p: Proveedor) {
  const mios = almacen.trabajos().filter((t) => t.plomeroId === p.id && t.terminadoEn && t.pagoPlomero != null);
  const semana = (inicio: Date) => {
    const fin = new Date(inicio.getTime() + 7 * 86400_000);
    const ts = mios.filter((t) => { const x = new Date(t.terminadoEn!); return x >= inicio && x < fin; });
    const viernes = new Date(fin.getTime() + 4 * 86400_000);
    return {
      desde: inicio.toISOString(), pagoViernes: viernes.toISOString().slice(0, 10),
      trabajos: ts.map((t) => ({ id: t.id, servicio: t.servicio, municipio: t.municipio, fecha: t.terminadoEn, manoObra: t.manoObraFinal, materiales: t.materialesCosto, pago: t.pagoPlomero, cobrado: t.estado === "cobrado", pagado: !!t.pagadoAlPlomero })),
      total: r2(ts.reduce((a, t) => a + (t.pagoPlomero ?? 0), 0)),
    };
  };
  const esta = lunesPR(new Date());
  return { estaSemana: semana(esta), anterior: semana(new Date(esta.getTime() - 7 * 86400_000)), acumulado: r2(mios.reduce((a, t) => a + (t.pagoPlomero ?? 0), 0)), trabajosTotales: mios.length };
}

/** Comentario del plomero sobre un trabajo suyo (lo ve el gerente en el portal y llega por Telegram). */
export async function agregarNotaPlomero(ofertaId: string, p: Proveedor, texto: string) {
  const r = trabajoDe(ofertaId, p); if ("error" in r) return { ok: false, motivo: r.error };
  const limpio = String(texto ?? "").trim().slice(0, 1000); if (!limpio) return { ok: false, motivo: "Escribe el comentario." };
  const t = r.t; const nota = { fecha: new Date().toISOString(), autor: `plomero:${p.nombre}`, texto: limpio };
  almacen.guardarTrabajo({ ...t, notasInternas: [...(t.notasInternas ?? []), nota] });
  archivar(t.contactoId, "plomero", `${p.nombre} sobre ${t.id}: ${limpio}`, t.id);
  await avisarCoordinador(`💬 ${p.nombre} sobre ${t.id} (${t.nombre}): ${limpio}`).catch(() => undefined);
  return { ok: true };
}
