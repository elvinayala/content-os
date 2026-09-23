import "server-only";

import { enviarPlantilla, enviarTexto } from "@/lib/zernio";

import { responder } from "./agente";
import { onboardingsRecientes, type OnboardingAib } from "./calendly";
import { canalListo, cuentaAib, DIAS_HISTORICO, HUMANO_HORAS, modoReal, VENTANAS } from "./config";
import { PLANTILLAS, textoPlantilla, type PasoAib } from "./plantillas";
import { actualizarCliente, agregarTurnos, clientePorTelefono, crearCliente, todosLosClientes, type ClienteAib } from "./repo";

const hoyPR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
const diasDesde = (fecha: string) => Math.round((Date.parse(hoyPR()) - Date.parse(fecha)) / 86_400_000);
const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] || "hola";

const CAMPO: Record<PasoAib, "bienvenidaAt" | "encuesta10At" | "encuesta30At"> = {
  bienvenida: "bienvenidaAt",
  encuesta10: "encuesta10At",
  encuesta30: "encuesta30At",
};

export interface ResumenDia {
  modo: "real" | "simulacion";
  canal: boolean;
  calendly: boolean; // false = falta CALENDLY_TOKEN_AIB (solo corre con lo que entró por webhook)
  nuevos: string[];
  historicos: string[];
  enviados: { cliente: string; paso: PasoAib; ok: boolean }[];
  sinTelefono: string[];
}

const enReal = () => modoReal() && canalListo();

/**
 * Agendó el onboarding en el Calendly de AIB → es cliente (igual que en Level Up). Dedupe por teléfono:
 * una reagenda o una segunda cita no reinicia el conteo de días ni repite la bienvenida.
 */
export async function registrarOnboarding(o: OnboardingAib): Promise<{ cliente: ClienteAib | null; nuevo: boolean; historico: boolean }> {
  if (!o.telefono) return { cliente: null, nuevo: false, historico: false };
  const datos = { calendlyInvitee: o.calendlyInvitee, citaAt: o.citaAt, evento: o.evento };
  const existente = await clientePorTelefono(o.telefono);
  if (existente) {
    const promover = existente.estado === "desconocido"; // nos había escrito antes de agendar
    if (promover || existente.calendlyInvitee !== o.calendlyInvitee) {
      await actualizarCliente(existente.id, {
        ...datos,
        ...(promover ? { estado: "activo", nombre: o.nombre, fechaPago: o.fechaPago } : {}),
        ...(!existente.email && o.email ? { email: o.email } : {}),
        ...(!existente.empresa && o.empresa ? { empresa: o.empresa } : {}),
        ...(!existente.servicio && o.servicio ? { servicio: o.servicio } : {}),
      });
      Object.assign(existente, datos, promover ? { estado: "activo", nombre: o.nombre, fechaPago: o.fechaPago } : {});
    }
    return { cliente: existente, nuevo: promover, historico: false };
  }
  // Quien entra con más de DIAS_HISTORICO desde que agendó no recibe nada (no se le escribe
  // "bienvenido" a un cliente de hace meses).
  const historico = diasDesde(o.fechaPago) > DIAS_HISTORICO;
  const c = await crearCliente({
    telefono: o.telefono,
    nombre: o.nombre,
    email: o.email,
    empresa: o.empresa,
    servicio: o.servicio,
    fechaPago: o.fechaPago,
    ...datos,
    estado: historico ? "historico" : "activo",
  });
  return { cliente: c, nuevo: true, historico };
}

/** Manda la plantilla que le toca hoy (si alguna). En simulación solo la reporta. */
export async function enviarPendiente(c: ClienteAib): Promise<{ paso: PasoAib; ok: boolean } | null> {
  if (c.estado !== "activo" || !c.fechaPago) return null;
  const dias = diasDesde(c.fechaPago);
  const paso = (Object.keys(VENTANAS) as PasoAib[]).find((k) => !c[CAMPO[k]] && dias >= VENTANAS[k].desde && dias <= VENTANAS[k].hasta);
  if (!paso) return null;
  if (!enReal()) return { paso, ok: false };
  const conv = await enviarPlantilla(cuentaAib(), c.telefono, PLANTILLAS[paso].nombre, [primerNombre(c.nombre)]);
  if (conv === null) return { paso, ok: false };
  const patch = {
    [CAMPO[paso]]: new Date(),
    ...(conv ? { conversacionId: conv } : {}),
    ...(paso === "encuesta10" ? { encuestaActiva: "10" } : paso === "encuesta30" ? { encuestaActiva: "30" } : {}),
  };
  await actualizarCliente(c.id, patch);
  Object.assign(c, patch);
  await agregarTurnos(c, [{ role: "assistant", content: textoPlantilla(paso, primerNombre(c.nombre)) }]);
  return { paso, ok: true };
}

/**
 * Corrida diaria (10 AM PR): relee las citas de onboarding del Calendly de AIB (red por si se perdió
 * algún webhook), registra las nuevas y manda a cada cliente lo que le toca hoy (bienvenida si no
 * salió al agendar, encuesta de 10 y de 30 días).
 */
export async function corridaDiaria(): Promise<ResumenDia> {
  const citas = await onboardingsRecientes();
  const resumen: ResumenDia = { modo: enReal() ? "real" : "simulacion", canal: canalListo(), calendly: citas !== null, nuevos: [], historicos: [], enviados: [], sinTelefono: [] };

  for (const o of citas ?? []) {
    if (!o.telefono) {
      if (!resumen.sinTelefono.includes(o.nombre)) resumen.sinTelefono.push(o.nombre);
      continue;
    }
    const r = await registrarOnboarding(o);
    if (r.nuevo) (r.historico ? resumen.historicos : resumen.nuevos).push(o.nombre);
  }
  for (const c of await todosLosClientes()) {
    const r = await enviarPendiente(c);
    if (r) resumen.enviados.push({ cliente: c.nombre, ...r });
  }
  return resumen;
}

/** Mensaje entrante por WhatsApp: guarda, y si no hay un humano atendiendo, contesta el agente. */
export async function atenderEntrante(e: { telefono: string; nombre?: string; texto: string; conversationId: string; adjuntos: number }): Promise<string> {
  let c: ClienteAib | null = await clientePorTelefono(e.telefono);
  if (!c) c = await crearCliente({ telefono: e.telefono, nombre: e.nombre || `+${e.telefono}`, estado: "desconocido" });
  if (c.conversacionId !== e.conversationId) await actualizarCliente(c.id, { conversacionId: e.conversationId });

  const texto = e.texto || (e.adjuntos ? "[El cliente mandó un archivo/audio sin texto]" : "");
  if (!texto) return "vacio";
  await agregarTurnos(c, [{ role: "user", content: texto }]);

  if (c.humanoHasta && c.humanoHasta.getTime() > Date.now()) return "humano-atendiendo";
  const respuesta = await responder(c);
  if (!respuesta) return "sin-respuesta";
  const ok = canalListo() ? await enviarTexto(cuentaAib(), e.conversationId, respuesta) : (console.log(`[aib-onboarding simulado → ${e.telefono}] ${respuesta}`), false);
  await agregarTurnos(c, [{ role: "assistant", content: respuesta }]);
  return ok ? "respondido" : "no-enviado";
}

/** Una persona contestó desde el inbox de Zernio: el agente calla HUMANO_HORAS. */
export async function marcarTomaHumana(telefono: string): Promise<void> {
  const c = await clientePorTelefono(telefono);
  if (c) await actualizarCliente(c.id, { humanoHasta: new Date(Date.now() + HUMANO_HORAS * 3_600_000) });
}
