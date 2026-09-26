/**
 * Página de reserva (26/sep/2026, Elvin: "tres puertas de entrada, una sola salida"). El cliente que llega por un
 * anuncio, por el enlace que le manda el agente de Messenger o por SMS del setter reserva solo: escoge el servicio del
 * menú (o la visita de diagnóstico), su pueblo, el día y la ventana, deja sus datos y fotos del área. Crea el trabajo
 * por el mismo camino que el agente (herramienta agendar_cita: CRM, oferta a los plomeros de la zona) y la
 * confirmación le llega por texto cuando un plomero acepta.
 * Cobro: hoy "pagas al terminar" (link al cerrar el trabajo). Cuando haya Stripe (STRIPE_SECRET_KEY) aquí se agrega el
 * pago de la reserva ($19 de coordinación / $69 del diagnóstico) antes de despachar.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { RAIZ, almacen, type Contacto } from "./almacen.js";
import { ejecutar } from "./herramientas.js";
import { territorioDe, plomeroActivoDe } from "./proveedores.js";
import { ventanasLibres } from "./integraciones/calendario.js";
import { contactoPorTelefono } from "./canales/sms.js";
import { DIR_FOTOS } from "./ciclo-trabajo.js";
import { archivar } from "./historial.js";

const MENU = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "menu.json"), "utf8"));
const TERR = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "territorios.json"), "utf8")).territorios as { id: string; municipios: string[] }[];

/** Lo que la página necesita para pintarse: servicios del menú, pueblos con plomero activo y el cargo de coordinación. */
export function datosReserva() {
  const servicios = MENU.servicios.filter((s: any) => !s.cotizacion).map((s: any) => ({ id: s.id, nombre: s.nombre, nivel: s.nivel, precio: s.precio ?? null, desde: s.rango?.[0] ?? null, hasta: s.rango?.[1] ?? null, nota: s.nota ?? null }));
  const pueblos = TERR.filter((t) => plomeroActivoDe(t.id)).flatMap((t) => t.municipios).sort((a, b) => a.localeCompare(b, "es"));
  return { servicios, pueblos, coordinacion: MENU.cargo_coordinacion, garantiaMeses: MENU.garantia_meses, pagoAlTerminar: true };
}

export async function ventanas(pueblo: string, fecha: string) {
  const t = territorioDe(pueblo);
  if (!t || !plomeroActivoDe(t) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return [];
  return ventanasLibres(t, fecha, false);
}

const limpio = (v: unknown, n = 160) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const intentos = new Map<string, number[]>();

export async function reservar(b: any, ip: string): Promise<{ ok: true; trabajoId: string } | { ok: false; error: string }> {
  if (b?.web) return { ok: false, error: "No se pudo enviar." }; // campo trampa para bots
  const ahora = Date.now(); const lista = (intentos.get(ip) ?? []).filter((t) => ahora - t < 3600_000);
  if (lista.length >= 5) return { ok: false, error: "Demasiadas reservas desde esta conexión. Escríbenos por mensaje y te ayudamos." };
  intentos.set(ip, [...lista, ahora]);

  const servicio = MENU.servicios.find((s: any) => s.id === b?.servicio_id && !s.cotizacion);
  if (!servicio) return { ok: false, error: "Escoge el servicio." };
  const pueblo = limpio(b?.pueblo, 60); const t = territorioDe(pueblo);
  if (!t || !plomeroActivoDe(t)) return { ok: false, error: "Todavía no damos servicio en ese pueblo. Escríbenos por mensaje y te avisamos cuando lleguemos." };
  const tel = String(b?.telefono ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (tel.length !== 10) return { ok: false, error: "El teléfono debe tener 10 dígitos." };
  const nombre = limpio(b?.nombre, 80), direccion = limpio(b?.direccion, 200);
  if (nombre.length < 3) return { ok: false, error: "Falta tu nombre." };
  if (direccion.length < 6) return { ok: false, error: "Falta la dirección (urbanización, calle y número)." };
  const inicio = String(b?.inicio ?? ""), fin = String(b?.fin ?? "");
  const libres = await ventanas(pueblo, inicio.slice(0, 10));
  if (!libres.some((v) => new Date(v.inicio).getTime() === new Date(inicio).getTime())) return { ok: false, error: "Ese horario ya no está disponible. Escoge otro." };

  // El mismo contacto si ya nos escribió (Messenger/IG/SMS con ese teléfono); si no, uno nuevo de la web.
  const c: Contacto = contactoPorTelefono(tel) ?? almacen.obtenerOCrearContacto("web", "tel-" + tel);
  almacen.guardarContacto({ ...c, nombre, telefono: tel, municipio: pueblo, direccion, tipo: "cliente" });
  const contacto = almacen.contacto(c.id) ?? c;
  const notas = limpio(b?.notas, 600);
  archivar(contacto.id, "cliente", `[Reserva por la página] ${servicio.nombre} · ${pueblo} · ${new Date(inicio).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" })}${notas ? " · " + notas : ""}`);
  const r: any = await ejecutar("agendar_cita", { nombre, telefono: "1" + tel, municipio: pueblo, territorio_id: t, servicio_id: servicio.id, emergencia: false, direccion, referencia: limpio(b?.referencia, 200), inicio, fin: fin || new Date(new Date(inicio).getTime() + 2 * 3600_000).toISOString(), notas: `Reservó en la página.${notas ? " " + notas : ""}` }, { contacto } as any);
  if (!r?.ok) return { ok: false, error: "No pudimos crear la reserva. Escríbenos por mensaje y te la cuadramos." };

  // Fotos del área (hasta 4): récord y para que el plomero llegue preparado.
  const fotos: string[] = [];
  for (const [i, d] of (Array.isArray(b?.fotos) ? b.fotos : []).slice(0, 4).entries()) {
    const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(String(d)); if (!m) continue;
    const archivo = `${r.trabajo_id}-cliente-${i + 1}-${Date.now().toString(36)}.jpg`;
    try { await sharp(Buffer.from(m[1], "base64")).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(path.join(DIR_FOTOS, archivo)); fotos.push(archivo); } catch { /* foto dañada: se ignora */ }
  }
  const tr = almacen.trabajos().find((x) => x.id === r.trabajo_id);
  if (tr && fotos.length) almacen.guardarTrabajo({ ...tr, fotosCliente: fotos });
  return { ok: true, trabajoId: r.trabajo_id };
}
