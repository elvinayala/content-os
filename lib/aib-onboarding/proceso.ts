import "server-only";

import { enviarPlantilla, enviarTexto } from "@/lib/zernio";

import { responder } from "./agente";
import { canalListo, cuentaAib, DIAS_HISTORICO, HUMANO_HORAS, modoReal, VENTANAS } from "./config";
import { PLANTILLAS, textoPlantilla, type PasoAib } from "./plantillas";
import { clientesAibDePulse } from "./pulse";
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
  nuevos: string[];
  historicos: string[];
  enviados: { cliente: string; paso: PasoAib; ok: boolean }[];
  sinTelefono: string[];
  tieneColumnaTelefono: boolean;
}

/** Corrida diaria: trae los clientes de Pulse, registra los nuevos y manda lo que toca hoy. */
export async function corridaDiaria(): Promise<ResumenDia> {
  const { clientes, sinTelefono, tieneColumnaTelefono } = await clientesAibDePulse();
  const real = modoReal() && canalListo();
  const resumen: ResumenDia = { modo: real ? "real" : "simulacion", canal: canalListo(), nuevos: [], historicos: [], enviados: [], sinTelefono, tieneColumnaTelefono };

  const existentes = new Map((await todosLosClientes()).map((c) => [c.telefono, c]));
  for (const p of clientes) {
    let c = existentes.get(p.telefono!);
    if (!c) {
      // Quien entra al sistema con más de DIAS_HISTORICO desde el pago no recibe nada (no se le escribe
      // "bienvenido" a un cliente de hace meses).
      const historico = diasDesde(p.fechaPago) > DIAS_HISTORICO;
      c = await crearCliente({ ...p, telefono: p.telefono!, estado: historico ? "historico" : "activo" });
      (historico ? resumen.historicos : resumen.nuevos).push(p.nombre);
      existentes.set(c.telefono, c);
    } else if (c.pulseItemId !== p.pulseItemId || c.fechaPago !== p.fechaPago || c.servicio !== p.servicio) {
      await actualizarCliente(c.id, { pulseItemId: p.pulseItemId, nombre: p.nombre, empresa: p.empresa, email: p.email, servicio: p.servicio, fechaPago: p.fechaPago });
      Object.assign(c, { pulseItemId: p.pulseItemId, fechaPago: p.fechaPago, servicio: p.servicio });
    }
    if (c.estado !== "activo" || !c.fechaPago) continue;

    const dias = diasDesde(c.fechaPago);
    const paso = (Object.keys(VENTANAS) as PasoAib[]).find((k) => !c![CAMPO[k]] && dias >= VENTANAS[k].desde && dias <= VENTANAS[k].hasta);
    if (!paso) continue;
    if (!real) {
      resumen.enviados.push({ cliente: c.nombre, paso, ok: false });
      continue;
    }
    const conv = await enviarPlantilla(cuentaAib(), c.telefono, PLANTILLAS[paso].nombre, [primerNombre(c.nombre)]);
    const ok = conv !== null;
    resumen.enviados.push({ cliente: c.nombre, paso, ok });
    if (!ok) continue;
    await actualizarCliente(c.id, {
      [CAMPO[paso]]: new Date(),
      ...(conv ? { conversacionId: conv } : {}),
      ...(paso === "encuesta10" ? { encuestaActiva: "10" } : paso === "encuesta30" ? { encuestaActiva: "30" } : {}),
    });
    await agregarTurnos(c, [{ role: "assistant", content: textoPlantilla(paso, primerNombre(c.nombre)) }]);
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
