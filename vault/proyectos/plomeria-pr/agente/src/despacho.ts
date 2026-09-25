/**
 * Despacho en tiempo real. Cuando un trabajo o proyecto se cierra, se crea una OFERTA y se
 * anuncia por WhatsApp a todos los proveedores elegibles (misma categoría y territorio).
 * El PRIMERO que acepta se lo lleva; se le genera el contrato de ese trabajo y se le manda a
 * firmar (DocuSign). Si nadie acepta en el tiempo límite, se avisa al Coordinador para
 * asignarlo a mano.
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ, almacen } from "./almacen.js";
import { config } from "./config.js";
import { elegibles, porId, linkPortal, listar as listarProv, TIEMPO_ACEPTAR_MIN, type Proveedor } from "./proveedores.js";
import { enviarTexto, avisarCoordinador } from "./canales/whatsapp.js";
import { avisarCliente } from "./aviso-cliente.js";
import { contratoHTML } from "./contratos.js";
import { enviarContrato } from "./integraciones/docusign.js";
import { crearEvento } from "./integraciones/calendario.js";
import { notificar } from "./push.js";

export interface Oferta {
  id: string;                          // OF-0001
  tipo: "trabajo" | "proyecto";
  referencia: string;                  // R-0001 o PR-0001
  categoria: string;                   // "plomeria" o id de categoría de proyectos
  categoriaNombre: string;
  territorio?: string;
  municipio: string;
  resumen: string;                     // scope SIN datos del cliente
  pagoProveedor: number;
  hitos?: { nombre: string; monto: number }[];
  inicio?: string; fin?: string;
  estado: "abierta" | "aceptada" | "expirada" | "asignada-manual" | "cancelada";
  elegibles: string[];
  avisados: string[];
  /** Plomeros que dijeron "No puedo": están en su derecho (nadie está obligado a coger trabajos). */
  rechazados?: string[];
  aceptadoPor?: string; aceptadoEn?: string;
  expiraEn: string;
  contrato?: { envelopeId: string; estado: "simulado" | "enviado" | "firmado"; urlFirma?: string; firmadoEn?: string };
  creado: string;
}

const ARCH = "ofertas.json";
const DIR = path.join(RAIZ, "data", "estado");
function leer(): Oferta[] { const p = path.join(DIR, ARCH); return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as Oferta[]) : []; }
function guardar(list: Oferta[]) { const p = path.join(DIR, ARCH); fs.writeFileSync(p + ".tmp", JSON.stringify(list, null, 2)); fs.renameSync(p + ".tmp", p); }
export function ofertas() { return leer(); }
export function oferta(id: string) { return leer().find((o) => o.id === id); }
function actualizar(o: Oferta) { const l = leer().filter((x) => x.id !== o.id); l.push(o); guardar(l); }

const $ = (n: number) => "$" + n.toLocaleString("en-US");
const cuando = (iso?: string) => iso ? new Date(iso).toLocaleString("es-PR", { timeZone: config.zonaHoraria, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "por coordinar";

function mensajeOferta(o: Oferta, p: Proveedor): string {
  const link = linkPortal(p.id, config.urlPublica);
  const minutos = TIEMPO_ACEPTAR_MIN[o.tipo];
  return [
    `🔔 *Nuevo ${o.tipo === "trabajo" ? "trabajo" : "proyecto"} disponible* · ${o.id}`,
    `${o.categoriaNombre} · ${o.municipio}`,
    o.resumen,
    o.inicio ? `📅 ${cuando(o.inicio)}` : "",
    `💵 Tu pago: *${$(o.pagoProveedor)}*${o.hitos?.length ? " (por hitos)" : ""}`,
    "",
    `El primero que acepte se lo lleva. Responde *ACEPTO ${o.id}* o entra al portal: ${link}`,
    `⏳ Disponible ${minutos >= 60 ? Math.round(minutos / 60) + " h" : minutos + " min"}.`,
  ].filter((l) => l !== "").join("\n");
}

/** Crea la oferta y la anuncia a los elegibles. Si no hay elegibles, avisa al Coordinador de inmediato. */
export async function crearOferta(d: Omit<Oferta, "id" | "estado" | "elegibles" | "avisados" | "expiraEn" | "creado">, opc: { soloProveedor?: string; minutos?: number } = {}): Promise<Oferta> {
  const lista = leer();
  const el = opc.soloProveedor ? listarProv().filter((p) => p.id === opc.soloProveedor) : elegibles({ categoria: d.categoria, territorio: d.territorio });
  const o: Oferta = { ...d, id: "OF-" + String(lista.length + 1).padStart(4, "0"), estado: "abierta", elegibles: el.map((p) => p.id), avisados: [], expiraEn: new Date(Date.now() + (opc.minutos ?? TIEMPO_ACEPTAR_MIN[d.tipo]) * 60_000).toISOString(), creado: new Date().toISOString() };
  lista.push(o); guardar(lista);
  if (!el.length) { await avisarCoordinador(`⚠️ ${o.id} (${o.categoriaNombre}, ${o.municipio}) sin proveedores elegibles. Busca quién lo quiera coger (nadie está obligado) y asígnalo a mano: ${config.urlPublica}/admin/plomeros?t=${config.adminToken}`); return o; }
  for (const p of el) {
    try { await enviarTexto(p.whatsapp, mensajeOferta(o, p)); o.avisados.push(p.id); } catch (e) { console.error("aviso oferta", p.id, e); }
    notificar(p.id, { titulo: `Nuevo ${o.tipo === "trabajo" ? "trabajo" : "proyecto"} · ${$(o.pagoProveedor)}`, cuerpo: `${o.categoriaNombre} · ${o.municipio} · ${cuando(o.inicio)}. El primero que acepta se lo lleva.`, url: linkPortal(p.id, config.urlPublica), tag: o.id, ofertaId: o.id, urgente: true }).catch(() => undefined);
  }
  actualizar(o);
  programarExpiracion(o.id, (opc.minutos ?? TIEMPO_ACEPTAR_MIN[d.tipo]) * 60_000);
  return o;
}

const timers = new Map<string, NodeJS.Timeout>();
function programarExpiracion(id: string, ms: number) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => { expirarSiSigueAbierta(id).catch(console.error); }, ms));
}
export async function expirarSiSigueAbierta(id: string) {
  const o = oferta(id); if (!o || o.estado !== "abierta") return;
  o.estado = "expirada"; actualizar(o);
  await avisarCoordinador(`⏰ Nadie aceptó ${o.id} (${o.categoriaNombre}, ${o.municipio}, ${$(o.pagoProveedor)})${o.rechazados?.length ? ` · dijeron que no: ${o.rechazados.join(", ")}` : ""}. Los plomeros deciden qué trabajos cogen: llama y pregunta quién puede, o muévele la hora al cliente. Asignar a mano solo con su sí: ${config.urlPublica}/admin/plomeros?t=${config.adminToken}`);
  if (o.tipo === "trabajo") {
    const t = almacen.trabajos().find((x) => x.id === o.referencia);
    if (t) await avisarCliente(t, `Hola ${t.nombre.split(" ")[0]}, todavía estamos confirmando el plomero para tu ${t.servicio.toLowerCase()}. Te escribimos por aquí en cuanto lo tengamos, o con otra hora si esa no se puede.`);
  }
}
/** Al arrancar el servidor, re-programa las ofertas abiertas (los timers viven en memoria). */
export function reanudarTimers() { for (const o of leer()) if (o.estado === "abierta") programarExpiracion(o.id, Math.max(0, new Date(o.expiraEn).getTime() - Date.now())); }

/** El plomero dice "No puedo" (25/sep, Elvin: "ellos deciden qué trabajos cogen, no se pueden obligar"). No es falta.
 *  Si ya dijeron que no todos los elegibles, no se espera al vencimiento: pasa al Coordinador y se le avisa al cliente. */
export async function rechazar(ofertaId: string, proveedorId: string): Promise<{ ok: true } | { ok: false; motivo: string }> {
  const o = oferta(ofertaId); if (!o) return { ok: false, motivo: "La oferta no existe." };
  if (o.estado !== "abierta") return { ok: true };
  if (!o.elegibles.includes(proveedorId)) return { ok: false, motivo: "Esta oferta no es de tu zona." };
  o.rechazados = [...new Set([...(o.rechazados ?? []), proveedorId])]; actualizar(o);
  if (o.elegibles.every((id) => o.rechazados!.includes(id))) { clearTimeout(timers.get(o.id)); await expirarSiSigueAbierta(o.id); }
  return { ok: true };
}

/** El primero que llega gana. Proceso único + escritura sincrónica = sin carrera. */
export async function aceptar(ofertaId: string, proveedorId: string, manual = false): Promise<{ ok: true; oferta: Oferta } | { ok: false; motivo: string }> {
  const o = oferta(ofertaId); if (!o) return { ok: false, motivo: "La oferta no existe." };
  const p = porId(proveedorId); if (!p) return { ok: false, motivo: "Proveedor no registrado." };
  if (o.estado === "aceptada" || o.estado === "asignada-manual") return { ok: false, motivo: o.aceptadoPor === proveedorId ? "Ya es tuyo." : "Ya lo tomó otro proveedor. Te avisamos del próximo." };
  if (o.estado === "cancelada") return { ok: false, motivo: "La oferta se canceló." };
  if (!manual) {
    if (o.estado === "expirada") return { ok: false, motivo: "Se venció el tiempo; el Coordinador lo está asignando." };
    if (!o.elegibles.includes(proveedorId)) return { ok: false, motivo: "Esta oferta no es de tu categoría o zona." };
  }
  o.estado = manual ? "asignada-manual" : "aceptada"; o.aceptadoPor = proveedorId; o.aceptadoEn = new Date().toISOString();
  actualizar(o); clearTimeout(timers.get(o.id));

  // Contrato del trabajo → firma
  try {
    const html = contratoHTML(o, p);
    const env = await enviarContrato({ proveedorId: p.id, ofertaId: o.id, nombre: p.nombre, email: p.email, telefono: p.whatsapp, html });
    o.contrato = { envelopeId: env.envelopeId, estado: env.estado, urlFirma: env.urlFirma }; actualizar(o);
  } catch (e) { console.error("contrato", e); }

  // Actualiza el trabajo/proyecto de origen y el calendario del proveedor
  if (o.tipo === "trabajo") {
    const t = almacen.trabajos().find((x) => x.id === o.referencia);
    if (t) {
      let eventoId: string | undefined;
      if (p.calendar_id && !p.calendar_id.startsWith("CAMBIAR") && t.territorio) eventoId = await crearEvento(t.territorio, { titulo: `${t.id} · ${t.servicio} · ${t.nombre}`, descripcion: `Tel: ${t.telefono}\n${t.direccion}\n${t.referencia ?? ""}`, inicio: t.inicio, fin: t.fin, direccion: `${t.direccion}, ${t.municipio}, PR` }).catch(() => undefined);
      almacen.guardarTrabajo({ ...t, plomeroId: p.id, eventoCalendarId: eventoId ?? t.eventoCalendarId });
    }
  } else {
    const pr = almacen.proyectos().find((x) => x.id === o.referencia);
    if (pr) almacen.guardarProyecto({ ...pr, contratistaId: p.id, estado: "asignado" });
  }

  // Avisos: al proveedor (con los datos del cliente ya) y al resto (se cerró)
  const t = o.tipo === "trabajo" ? almacen.trabajos().find((x) => x.id === o.referencia) : undefined;
  const pr = o.tipo === "proyecto" ? almacen.proyectos().find((x) => x.id === o.referencia) : undefined;
  const cliente = t ? `${t.nombre} · ${t.telefono}\n📍 ${t.direccion}, ${t.municipio}${t.referencia ? " (" + t.referencia + ")" : ""}` : pr ? `${pr.nombre} · ${pr.telefono}\n📍 ${pr.municipio}` : "";
  const firma = o.contrato?.urlFirma ? `\n✍️ Firma tu orden de trabajo aquí: ${o.contrato.urlFirma}` : o.contrato?.estado === "simulado" ? `\n✍️ Tu orden de trabajo está en el portal para firmar: ${linkPortal(p.id, config.urlPublica)}` : "";
  await enviarTexto(p.whatsapp, `✅ *${o.id} es tuyo*, ${p.nombre.split(" ")[0]}.\n${o.categoriaNombre} · ${cuando(o.inicio)}\n${cliente}${firma}\n\nRecuerda: fotos de antes y después, y el cliente le paga a Resuelto.`);
  notificar(p.id, { titulo: `✅ ${o.id} es tuyo`, cuerpo: `${o.categoriaNombre} · ${cuando(o.inicio)}. Abre la app para ver el cliente y firmar tu orden.`, url: linkPortal(p.id, config.urlPublica), tag: o.id }).catch(() => undefined);
  for (const id of o.avisados) if (id !== p.id) { const q = porId(id); if (q) { enviarTexto(q.whatsapp, `${o.id} ya lo tomó otro proveedor. Te avisamos del próximo.`).catch(() => undefined); notificar(q.id, { titulo: `${o.id} ya se asignó`, cuerpo: "Otro proveedor lo tomó primero. Te avisamos del próximo.", url: linkPortal(q.id, config.urlPublica), tag: o.id }).catch(() => undefined); } }
  if (t) await avisarCliente(t, `Listo, ${t.nombre.split(" ")[0]}: tu cita de ${t.servicio.toLowerCase()} quedó confirmada (${cuando(o.inicio)}). Te atiende ${p.nombre.split(" ")[0]}, plomero licenciado de Resuelto. Te escribimos cuando vaya en camino.`);
  await avisarCoordinador(`${manual ? "🛠️ Asignado a mano" : "✅ Aceptado"} ${o.id} → ${p.nombre} (${p.tipo}) · contrato ${o.contrato?.estado ?? "no enviado"}`);
  return { ok: true, oferta: o };
}

export function marcarFirmado(envelopeId: string) {
  const o = leer().find((x) => x.contrato?.envelopeId === envelopeId); if (!o?.contrato) return;
  o.contrato.estado = "firmado"; o.contrato.firmadoEn = new Date().toISOString(); actualizar(o);
  avisarCoordinador(`✍️ Contrato firmado: ${o.id} por ${o.aceptadoPor}`).catch(() => undefined);
}

/** Ofertas que un proveedor puede ver: abiertas de su categoría/zona + las suyas. */
export function ofertasPara(p: Proveedor) {
  const ahora = Date.now();
  return leer().filter((o) => (o.estado === "abierta" && new Date(o.expiraEn).getTime() > ahora && o.elegibles.includes(p.id)) || o.aceptadoPor === p.id).sort((a, b) => b.creado.localeCompare(a.creado));
}
