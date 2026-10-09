/**
 * Alta automática al firmar (1/oct/2026, Elvin: "una vez la persona firme, que automáticamente se active en la app o le
 * llegue a Yaileen el mensaje… tiene que haber cosas más automáticas"). Antes: firmaba Luis Saez, a Yaileen le llegaba
 * "contrato firmado" y alguien tenía que darlo de alta a mano, mandarle la app y ofrecerle los trabajos que esperaban.
 *
 * Ahora, al firmar un acuerdo de plomero o de técnico:
 *  1. Queda ACTIVO en Resuelto Pro con su zona (sale del municipio que puso al firmar).
 *  2. Le llega por texto la bienvenida con el link de su app.
 *  3. Se le ofrecen los trabajos de su zona que están agendados SIN plomero (el primero que acepta se lo lleva).
 *  4. Yaileen recibe por Slack el link y los pasos (llamarlo, instalar la app, activar alertas, aceptar los trabajos).
 *  5. El grupo de Ventas (Telegram) sabe que ya hay plomero en esa zona; a Elvin le llega si la zona es NUEVA (sin
 *     anuncios todavía: prenderlos gasta dinero y espera su OK).
 * Aprendiz, cotizador y anexo no se activan solos (el aprendiz trabaja con un plomero; el cotizador va por proyectos).
 * Si el pueblo no está en ninguna zona, NO se activa y Yaileen/Elvin reciben qué zona hay que abrir.
 */
import type { Firma } from "./firmas/firmas.js";
import type { Trabajo } from "./almacen.js";
import type { Oferta } from "./despacho.js";
import type { OficioCampo } from "./proveedores.js";

export type PlanAlta =
  | { activar: true; oficio: OficioCampo; licencia: string; municipio: string; territorio: string }
  | { activar: false; motivo: string };

const OFICIO_TECNICO: Record<string, OficioCampo> = { aire: "aire", electricista: "electricista", handyman: "handyman" };
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Qué hacer con un contrato recién firmado. Pura (tests). `zonaDe` = territorioDe del registro de proveedores. */
export function planAlta(f: Pick<Firma, "tipo" | "municipio" | "firmado">, zonaDe: (m: string) => string | undefined): PlanAlta {
  const d = (f.firmado?.datos ?? {}) as Record<string, string | undefined>;
  if (f.tipo === "aprendiz") return { activar: false, motivo: "es aprendiz: trabaja con un plomero licenciado, se asigna a mano" };
  if (f.tipo === "cotizador") return { activar: false, motivo: "es cotizador de proyectos: se da de alta en la app del cotizador" };
  if (f.tipo === "anexo-nombre") return { activar: false, motivo: "es un anexo: el plomero ya estaba activo" };
  if (f.tipo === "deposito") return { activar: false, motivo: "es la autorización de depósito directo: el plomero ya estaba activo" };
  const oficio: OficioCampo | undefined = f.tipo === "plomero" ? "plomero" : OFICIO_TECNICO[String(d.oficio ?? "")];
  if (!oficio) return { activar: false, motivo: `oficio desconocido (${d.oficio ?? "vacío"})` };
  const municipio = String(d.municipio ?? f.municipio ?? "").trim();
  const territorio = municipio ? zonaDe(municipio) : undefined;
  if (!territorio) return { activar: false, motivo: `su pueblo (${municipio || "sin pueblo"}) no está en ninguna zona: hay que agregarlo a territorios.json` };
  const licencia = [d.licencia ? mayus(String(d.licencia)) : "", d.lic_num ?? ""].filter(Boolean).join(" ").trim();
  return { activar: true, oficio, licencia, municipio, territorio };
}

/** Trabajos de la zona agendados sin plomero, que todavía se pueden coger (empiezan en más de 2 h) y sin oferta abierta. Pura. */
export function trabajosSinPlomero(trabajos: Trabajo[], ofertas: Pick<Oferta, "referencia" | "estado">[], territorio: string, ahora = Date.now()): Trabajo[] {
  return trabajos.filter((t) => t.territorio === territorio && !t.plomeroId && t.estado === "agendado"
    && new Date(t.inicio).getTime() - ahora > 2 * 3600_000
    && !ofertas.some((o) => o.referencia === t.id && o.estado === "abierta"));
}

/** Cuánto tiempo darle para aceptar: hasta 2 h antes de la cita, máximo 12 h. Pura. */
export const minutosParaAceptar = (inicio: string, ahora = Date.now()) => Math.max(30, Math.min(12 * 60, Math.floor((new Date(inicio).getTime() - ahora - 2 * 3600_000) / 60_000)));

export function bienvenida(nombre: string, link: string, trabajos: number) {
  return `¡Bienvenido a Resuelto, ${nombre.split(" ")[0]}! 🔧\n\nEsta es tu app para recibir trabajos:\n${link}\n\n1️⃣ Ábrela y añádela a tu pantalla de inicio.\n2️⃣ Toca "Activar alertas" para que te avise al celular.\n3️⃣ Cuando salga un trabajo en tu zona te llega la alerta: el primero que acepta se lo lleva.\n4️⃣ En cada trabajo: "Voy en camino" → "Llegué" → fotos del antes y el después → "Terminé". Si encuentras algo más, "Encontré algo más": el cliente lo aprueba por un enlace. Resuelto le cobra al cliente y tú cobras el viernes el 65 % de la mano de obra. Las piezas que compres (pon el costo del recibo al terminar) te las devolvemos con 10 % extra en 48 horas.\n\nGuarda este mensaje: ese link es tu llave.${trabajos ? ` Ya tienes ${trabajos === 1 ? "1 trabajo esperando" : `${trabajos} trabajos esperando`} en tu zona (te llegan ahora).` : ""}`;
}

const fecha = (iso: string, zona: string) => new Date(iso).toLocaleString("es-PR", { timeZone: zona, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Lo corre firmas.ts después de firmar. Nunca tira: un fallo aquí no puede dañar la firma. */
export async function altaAlFirmar(f: Firma): Promise<void> {
  const [{ config }, prov, { almacen }, despacho, { avisarAlTelefono }, { dmSlack }, { avisarVentas }, { avisarCoordinador }] = await Promise.all([
    import("./config.js"), import("./proveedores.js"), import("./almacen.js"), import("./despacho.js"),
    import("./canales/telefono.js"), import("./integraciones/slack.js"), import("./ventas.js"), import("./canales/whatsapp.js"),
  ]);
  const plan = planAlta(f, prov.territorioDe);
  const d = f.firmado!.datos as Record<string, string | undefined>;
  const nombre = d.nombre ?? f.nombre;
  const tel = d.telefono || f.telefono;
  if (!plan.activar) {
    if (f.tipo === "anexo-nombre" || f.tipo === "deposito") return;
    const msg = `✍️ ${nombre} firmó (${f.tipo}), pero NO lo activé solo: ${plan.motivo}.`;
    await dmSlack(config.slack.reclutamiento, msg + " Avísale a Elvin o a Claude para darlo de alta.").catch(() => false);
    await avisarCoordinador(msg).catch(() => undefined);
    return;
  }
  const zonaNueva = !prov.activoDe(plan.territorio, prov.CATEGORIA_DE[plan.oficio]);
  const p = prov.altaPlomero({ nombre, whatsapp: tel, municipio: plan.municipio, licencia: plan.licencia || undefined, oficio: plan.oficio });
  const link = prov.linkPortal(p.id, config.urlPublica);
  const pendientes = plan.oficio === "plomero" ? trabajosSinPlomero(almacen.trabajos(), despacho.ofertas(), plan.territorio) : [];
  const llego = await avisarAlTelefono(p.whatsapp, bienvenida(nombre, link, pendientes.length)).catch(() => false);
  const ofrecidos: string[] = [];
  for (const t of pendientes) {
    const v = despacho.ofertas().filter((o) => o.referencia === t.id).at(-1);
    try {
      const o = await despacho.crearOferta({ tipo: "trabajo", referencia: t.id, categoria: v?.categoria ?? "plomeria", categoriaNombre: v?.categoriaNombre ?? t.servicio, territorio: t.territorio, municipio: t.municipio, resumen: v?.resumen ?? t.servicio, pagoProveedor: v?.pagoProveedor ?? Math.round((t.manoObra ?? 0) * 0.65 * 100) / 100, inicio: t.inicio, fin: t.fin }, { soloProveedor: p.id, minutos: minutosParaAceptar(t.inicio) });
      ofrecidos.push(`• ${t.id} · ${t.servicio} · ${t.municipio} · ${fecha(t.inicio, config.zonaHoraria)} · le pagan $${o.pagoProveedor} (vence ${fecha(o.expiraEn, config.zonaHoraria)})`);
    } catch (e) { console.error("alta: oferta", t.id, e); }
  }
  const pasos = [
    `✅ ${nombre} firmó y YA está activo en Resuelto Pro (${plan.municipio}, zona ${plan.territorio}${plan.licencia ? `, licencia ${plan.licencia}` : ""}).`,
    `Su app (es su llave, que la guarde): ${link}`,
    llego ? "Ya le llegó por texto con la bienvenida." : "⚠️ El texto no le llegó: mándale tú el link.",
    "",
    "Lo que toca ahora:",
    "1. Llámalo y que abra el link → \"Añadir a pantalla de inicio\" → \"Activar alertas\".",
    ofrecidos.length ? `2. Tiene ${ofrecidos.length} trabajo(s) esperándolo en la app. Que los acepte antes de que venzan:\n${ofrecidos.join("\n")}` : "2. No hay trabajos esperando en su zona: le llegan por alerta cuando salgan.",
    "3. Que entienda el paso a paso: \"Voy en camino\" → \"Llegué\" → fotos → \"Terminé\". Si encuentra algo más: \"Encontré algo más\" (el cliente aprueba por un enlace).",
    "4. Cobra los viernes el 65 % de la mano de obra. Las piezas que compre: pone el costo del recibo al tocar \"Terminé\" y se le devuelven con 10 % extra en 48 horas.",
  ].join("\n");
  await dmSlack(config.slack.reclutamiento, pasos).catch(() => false);
  await avisarVentas(`🆕 Nuevo ${prov.NOMBRE_OFICIO[plan.oficio].toLowerCase()} en ${plan.municipio} (zona ${plan.territorio}): ${nombre.split(" ")[0]}. Ya se pueden agendar clientes ahí.${ofrecidos.length ? ` Se le ofrecieron ${ofrecidos.length} cita(s) que estaban sin plomero.` : ""}`).catch(() => undefined);
  if (zonaNueva) await avisarCoordinador(`📣 ${nombre} abrió una zona NUEVA (${plan.territorio}, ${plan.municipio}) y no hay anuncios ahí todavía. Dile a Claude "dale" para prenderlos ($15–20/día).`).catch(() => undefined);
}
