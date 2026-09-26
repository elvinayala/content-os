/**
 * Vista de prueba de la app del plomero (26/sep/2026, Elvin: "necesito ver cómo ellos pueden coger los trabajos").
 * Un plomero ficticio ("vista-demo") que NO está en el registro: nunca es elegible para ofertas reales ni cuenta como
 * cobertura. La app es la misma (portal/proveedores.html); para este id las APIs responden con trabajos de ejemplo en
 * memoria: aceptar, "No puedo", voy en camino → llegué → fotos → terminé, y la cuenta de la semana. Nada toca clientes,
 * ofertas ni plomeros reales. Se reinicia sola tras 30 min sin uso (o con ?reiniciar=1).
 */
import type { Proveedor } from "./proveedores.js";

export const DEMO_ID = "vista-demo";
export const proveedorDemo: Proveedor = { id: DEMO_ID, tipo: "plomero", nombre: "Vista de prueba", whatsapp: "", categorias: ["plomeria"], territorios: ["T3"], estado: "activo", municipio: "Caguas" };

const FEE = 19, MAT_CLIENTE = 1.2, MAT_PLOMERO = 1.1, PARTE = 0.65;
type T = { id: string; estado: string; cliente: string; telefono: string; direccion: string; municipio: string; referencia: string; servicio: string; precioFijo: number | null; rango: number[] | null; emergencia: boolean; inicio: string; fin: string; fotosAntes: number; fotosDespues: number; totalCliente: number | null; pagoPlomero: number | null; manejoMaterialesPct: number };
type O = { id: string; tipo: "trabajo"; referencia: string; categoria: string; categoriaNombre: string; municipio: string; resumen: string; pagoProveedor: number; inicio: string; fin: string; estado: string; elegibles: string[]; avisados: string[]; rechazados: string[]; aceptadoPor?: string; expiraEn: string; creado: string; trabajo?: T; terminadoEn?: string };

function manana(h: number) { const d = new Date(Date.now() + 86400_000); if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(h + 4, 0, 0, 0); return d.toISOString(); } // próximo día de trabajo (L–S), hora de PR (UTC-4)
function nuevo(): O[] {
  const ahora = new Date().toISOString(), expira = new Date(Date.now() + 2 * 3600_000).toISOString();
  const base = (id: string, municipio: string, resumen: string, mano: number, h: number, servicio: string, rango: number[] | null = null): O => ({
    id, tipo: "trabajo", referencia: id.replace("OF", "R"), categoria: "plomeria", categoriaNombre: "Plomería", municipio, resumen, pagoProveedor: Math.round(mano * PARTE * 100) / 100,
    inicio: manana(h), fin: manana(h + 2), estado: "abierta", elegibles: [DEMO_ID], avisados: [DEMO_ID], rechazados: [], expiraEn: expira, creado: ahora,
    trabajo: { id: id.replace("OF", "R"), estado: "agendado", cliente: "Cliente de ejemplo", telefono: "787-555-0100", direccion: "Calle Ejemplo 123, Urb. Muestra", municipio, referencia: "Casa de ejemplo, portón negro", servicio, precioFijo: rango ? null : mano, rango, emergencia: false, inicio: manana(h), fin: manana(h + 2), fotosAntes: 0, fotosDespues: 0, totalCliente: null, pagoPlomero: null, manejoMaterialesPct: 20 },
  });
  return [
    base("OF-DEMO1", "Caguas", "Destape simple · fregadero de cocina (EJEMPLO)", 149, 10, "Destape simple"),
    base("OF-DEMO2", "Gurabo", "Instalación de calentador de tanque · el cliente ya tiene el calentador (EJEMPLO)", 279, 13, "Instalación de calentador de tanque"),
    base("OF-DEMO3", "Juncos", "Filtración debajo del lavamanos · se cotiza en sitio dentro del rango (EJEMPLO)", 250, 15, "Reparación de filtración", [200, 349]),
  ];
}
let ofertas = nuevo(), tocado = Date.now();
function estado(reiniciar = false) { if (reiniciar || Date.now() - tocado > 30 * 60_000) ofertas = nuevo(); tocado = Date.now(); return ofertas; }
const buscar = (id: string) => estado().find((o) => o.id === id);
const vista = (o: O) => (o.aceptadoPor === DEMO_ID ? o : { ...o, trabajo: undefined });

export function listar(reiniciar = false) {
  return { proveedor: { id: DEMO_ID, nombre: "Vista de prueba (trabajos de ejemplo)", tipo: "plomero" }, ofertas: estado(reiniciar).filter((o) => o.estado === "abierta" || o.aceptadoPor === DEMO_ID).map(vista) };
}
export function aceptar(id: string) {
  const o = buscar(id); if (!o) return { ok: false, motivo: "La oferta no existe." };
  if (o.aceptadoPor) return { ok: false, motivo: "Ya es tuyo." };
  o.estado = "aceptada"; o.aceptadoPor = DEMO_ID;
  return { ok: true, oferta: vista(o) };
}
export function rechazar(id: string) { const o = buscar(id); if (o) o.rechazados = [...o.rechazados, DEMO_ID]; return { ok: true }; }
export function paso(id: string, p: string, d: { mano_obra?: number; materiales?: number }) {
  const o = buscar(id), t = o?.trabajo; if (!o || !t || o.aceptadoPor !== DEMO_ID) return { ok: false, motivo: "Ese trabajo no es tuyo." };
  if (p === "en-camino") { t.estado = "en-camino"; return { ok: true, recordatorio: "🚗 (Prueba) Al cliente de verdad le avisamos que vas en camino." }; }
  if (p === "llegue") { t.estado = "en-sitio"; return { ok: true, recordatorio: "📍 (Prueba) Toma fotos del antes y del después y cierra con \"Terminé\"." }; }
  const mano = t.precioFijo ?? Number(d.mano_obra);
  if (!mano || (t.rango && (mano < t.rango[0] || mano > t.rango[1]))) return { ok: false, motivo: t.rango ? `La mano de obra tiene que estar entre $${t.rango[0]} y $${t.rango[1]}.` : "Falta la mano de obra." };
  const mat = Math.max(0, Number(d.materiales) || 0);
  t.totalCliente = Math.round((mano + FEE + mat * MAT_CLIENTE) * 100) / 100; t.pagoPlomero = Math.round((mano * PARTE + mat * MAT_PLOMERO) * 100) / 100;
  t.estado = "completado"; o.terminadoEn = new Date().toISOString();
  return { ok: true, estado: "completado", total: t.totalCliente, pago: t.pagoPlomero };
}
export function foto(id: string, tipo: string) { const t = buscar(id)?.trabajo; if (!t) return { ok: false, motivo: "No encuentro el trabajo." }; if (tipo === "antes") t.fotosAntes++; else t.fotosDespues++; return { ok: true }; }
export function cuenta() {
  const hechos = estado().filter((o) => o.trabajo?.estado === "completado");
  const hoy = new Date(), viernes = new Date(hoy); viernes.setDate(hoy.getDate() + ((5 - hoy.getDay() + 7) % 7 || 7));
  const trabajos = hechos.map((o) => ({ id: o.trabajo!.id, servicio: o.trabajo!.servicio, municipio: o.municipio, fecha: o.terminadoEn, manoObra: null, materiales: null, pago: o.trabajo!.pagoPlomero, cobrado: false, pagado: false }));
  const total = Math.round(trabajos.reduce((a, t) => a + (t.pago ?? 0), 0) * 100) / 100;
  return { estaSemana: { desde: hoy.toISOString(), pagoViernes: viernes.toISOString().slice(0, 10), trabajos, total }, anterior: { total: 0, trabajos: [] }, acumulado: total, trabajosTotales: trabajos.length };
}
