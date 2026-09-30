/**
 * Adicionales y recomendaciones en sitio (30/sep/2026). Santos y Rafael, en sus entrevistas: "¿qué pasa si al llegar el
 * trabajo es más grande de lo que parecía?" y "¿quién pone el precio del adicional?". La regla es la misma de siempre
 * (nada se hace sin que el cliente apruebe el precio antes), pero ahora tiene un camino de un toque:
 *
 * 1. El plomero, ya en el sitio, toca "Encontré algo más" y escoge el servicio del MISMO menú (el precio sale solo). Si
 *    el servicio es por rango, pone el precio dentro del rango. Si no está en el menú, describe el trabajo y propone
 *    precio: ese va primero a Resuelto (grupo de Ventas / Elvin), que lo aprueba o lo cambia.
 * 2. Al cliente le llega un enlace: ve qué es, cuánto cuesta de mano de obra y toca Aprobar o No. Queda la hora y la IP.
 * 3. Al plomero le suena la app con la respuesta. Lo aprobado se suma solo al cobro cuando toca "Terminé".
 *
 * Recomendación (p. ej. pasar cámara después de un destape): el plomero la deja por escrito y el cliente la acepta o la
 * rechaza con el mismo enlace. Si la rechaza, queda la evidencia de que se le recomendó.
 */
import crypto from "node:crypto";
import { almacen, type Trabajo } from "./almacen.js";
import { CATALOGO, servicioPorId, type ServicioCat } from "./catalogo.js";
import { config } from "./config.js";
import { avisarCliente } from "./aviso-cliente.js";
import { archivar } from "./historial.js";
import * as push from "./push.js";
import type { Proveedor } from "./proveedores.js";

export type EstadoAdicional = "por-precio" | "esperando-cliente" | "aprobado" | "rechazado";
export interface Adicional {
  id: string;
  tipo: "adicional" | "recomendacion";
  servicioId?: string;
  descripcion: string;
  /** Mano de obra. null en una recomendación sin precio. */
  precio: number | null;
  /** Lo que propuso el plomero cuando no estaba en el menú (Resuelto puede cambiarlo). */
  precioPropuesto?: number;
  estado: EstadoAdicional;
  creado: string;
  decidido?: { en: string; ip?: string; por: "cliente" | "resuelto" };
  plomeroId: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const secreto = () => process.env.PORTAL_SECRETO || config.zernio.apiKey || "resuelto";
export const firma = (trabajoId: string, adicionalId: string, rol: "cliente" | "equipo") =>
  crypto.createHmac("sha256", secreto()).update(`adicional:${rol}:${trabajoId}:${adicionalId}`).digest("base64url").slice(0, 20);
export function firmaOk(trabajoId: string, adicionalId: string, rol: "cliente" | "equipo", k: unknown) {
  const ok = firma(trabajoId, adicionalId, rol), v = String(k ?? "");
  return v.length === ok.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(ok));
}
export const linkCliente = (t: string, a: string) => `${config.urlPublica}/ok/${t}/${a}/${firma(t, a, "cliente")}`;
export const linkEquipo = (t: string, a: string) => `${config.urlPublica}/ok/${t}/${a}/${firma(t, a, "equipo")}?equipo=1`;

/** Mano de obra aprobada de los adicionales (se suma al cerrar). Pura (tests). */
export function manoObraAdicional(t: Pick<Trabajo, "adicionales">): number {
  return r2((t.adicionales ?? []).filter((a) => a.estado === "aprobado" && a.precio != null).reduce((s, a) => s + (a.precio ?? 0), 0));
}

/** Valida lo que manda el plomero y decide el estado inicial. Pura (tests). */
export function armarAdicional(d: { tipo?: string; servicioId?: string; descripcion?: string; precio?: unknown }, servicio: ServicioCat | undefined):
  { ok: true; adicional: Pick<Adicional, "tipo" | "servicioId" | "descripcion" | "precio" | "precioPropuesto" | "estado"> } | { ok: false; motivo: string } {
  const tipo = d.tipo === "recomendacion" ? "recomendacion" : "adicional";
  const desc = String(d.descripcion ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  const precio = d.precio == null || d.precio === "" ? NaN : Number(d.precio);
  if (tipo === "recomendacion") {
    if (desc.length < 8) return { ok: false, motivo: "Explica qué le recomiendas al cliente y por qué." };
    return { ok: true, adicional: { tipo, descripcion: desc, precio: Number.isFinite(precio) && precio > 0 ? r2(precio) : null, estado: "esperando-cliente" } };
  }
  if (servicio) {
    const nombre = desc ? `${servicio.nombre}: ${desc}` : servicio.nombre;
    if (servicio.precio != null) return { ok: true, adicional: { tipo, servicioId: servicio.id, descripcion: nombre, precio: servicio.precio, estado: "esperando-cliente" } };
    if (servicio.rango) {
      if (!Number.isFinite(precio)) return { ok: false, motivo: `Pon el precio de mano de obra ($${servicio.rango[0]} a $${servicio.rango[1]}).` };
      if (precio < servicio.rango[0] || precio > servicio.rango[1]) return { ok: false, motivo: `Tiene que estar entre $${servicio.rango[0]} y $${servicio.rango[1]}. Si es más, escoge "No está en la lista" y explícalo.` };
      return { ok: true, adicional: { tipo, servicioId: servicio.id, descripcion: nombre, precio: r2(precio), estado: "esperando-cliente" } };
    }
  }
  // Fuera del menú (o servicio "a cotizar"): Resuelto aprueba el precio antes de mandárselo al cliente.
  const descF = servicio ? (desc ? `${servicio.nombre}: ${desc}` : servicio.nombre) : desc;
  if (descF.length < 8) return { ok: false, motivo: "Describe el trabajo adicional (qué encontraste y qué hay que hacer)." };
  if (!Number.isFinite(precio) || precio <= 0) return { ok: false, motivo: "Propón un precio de mano de obra. Resuelto lo revisa antes de mandárselo al cliente." };
  return { ok: true, adicional: { tipo, servicioId: servicio?.id, descripcion: descF, precio: null, precioPropuesto: r2(precio), estado: "por-precio" } };
}

/** Servicios del menú que el plomero puede ofrecer como adicional (su mismo oficio). */
export function menuPara(t: Trabajo) {
  const cat = servicioPorId(t.servicioId)?.categoria ?? "plomeria";
  return CATALOGO.filter((s) => s.categoria === cat && s.id !== "diagnostico" && s.id !== "comercial").map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio ?? null, rango: s.rango ?? null, nota: s.nota ?? null }));
}

const pesos = (n: number | null | undefined) => (n == null ? "" : `$${Number(n).toFixed(2).replace(/\.00$/, "")}`);

async function mandarAlCliente(t: Trabajo, a: Adicional, p?: Proveedor) {
  const quien = p?.nombre.split(" ")[0] ?? "Tu técnico";
  const txt = a.tipo === "recomendacion"
    ? `${quien}, de Resuelto, te deja una recomendación sobre tu ${t.servicio.toLowerCase()}:\n\n"${a.descripcion}"${a.precio ? `\nCosto: ${pesos(a.precio)} de mano de obra.` : ""}\n\nDinos si la aceptas o no aquí (queda en tu récord): ${linkCliente(t.id, a.id)}`
    : `${quien}, de Resuelto, encontró algo más en tu ${t.servicio.toLowerCase()}:\n\n"${a.descripcion}"\n*${pesos(a.precio)}* de mano de obra (los materiales van aparte, al costo con recibo).\n\nNo se hace nada sin tu aprobación. Aprueba o dinos que no aquí: ${linkCliente(t.id, a.id)}`;
  await avisarCliente(t, txt).catch(() => undefined);
  // Que el agente sepa qué está pasando si el cliente pregunta por el chat.
  const conv = almacen.conversacion(t.contactoId);
  conv.mensajes.push({ role: "user", content: [{ type: "text", text: `[Contexto interno] En el trabajo ${t.id} hay ${a.tipo === "recomendacion" ? "una recomendación" : "un adicional"} esperando que el cliente decida: "${a.descripcion}" ${pesos(a.precio)}. Si pregunta, explícale y pásale este enlace para aprobar o no: ${linkCliente(t.id, a.id)}. No lo apruebes tú.` }] } as any, { role: "assistant", content: [{ type: "text", text: txt }] } as any);
  almacen.guardarConversacion(conv);
}

/** El plomero propone un adicional o una recomendación desde la app. */
export async function proponer(t: Trabajo, p: Proveedor, d: { tipo?: string; servicioId?: string; descripcion?: string; precio?: unknown }, avisarEquipo: (texto: string) => Promise<unknown>) {
  if (t.estado !== "en-sitio") return { ok: false, motivo: "Primero marca que llegaste." };
  if ((t.adicionales ?? []).length >= 8) return { ok: false, motivo: "Ya hay muchos adicionales en este trabajo. Llama a Resuelto." };
  const servicio = d.servicioId ? servicioPorId(d.servicioId) : undefined;
  const r = armarAdicional(d, servicio); if (!r.ok) return r;
  const a: Adicional = { ...r.adicional, id: `A${(t.adicionales ?? []).length + 1}`, creado: new Date().toISOString(), plomeroId: p.id };
  almacen.guardarTrabajo({ ...t, adicionales: [...(t.adicionales ?? []), a] });
  archivar(t.contactoId, "sistema", `${t.id}: ${p.nombre} propuso ${a.tipo === "recomendacion" ? "una recomendación" : "un adicional"}: "${a.descripcion}" ${pesos(a.precio ?? a.precioPropuesto)}${a.estado === "por-precio" ? " (fuera del menú: Resuelto aprueba el precio)" : ""}.`, t.id);
  if (a.estado === "por-precio") {
    await avisarEquipo(`🧰 ADICIONAL FUERA DEL MENÚ · ${t.id} · ${t.municipio}\n${p.nombre}: "${a.descripcion}"\nPropone ${pesos(a.precioPropuesto)} de mano de obra. El plomero está esperando en la casa.\nAprueba o cambia el precio: ${linkEquipo(t.id, a.id)}`).catch(() => undefined);
    return { ok: true, estado: a.estado, mensaje: "Se lo mandamos a Resuelto para aprobar el precio. En cuanto lo aprueben le llega al cliente y te suena la app." };
  }
  await mandarAlCliente(almacen.trabajos().find((x) => x.id === t.id) ?? t, a, p);
  return { ok: true, estado: a.estado, mensaje: "Le llegó al cliente para aprobar. No lo hagas hasta que apruebe; te suena la app cuando conteste." };
}

/** Decisión desde el enlace: el cliente aprueba/rechaza, o Resuelto pone el precio de uno fuera del menú. */
export async function decidir(trabajoId: string, adicionalId: string, rol: "cliente" | "equipo", accion: "aprobar" | "rechazar", d: { precio?: unknown; ip?: string }, avisarEquipo: (texto: string) => Promise<unknown>) {
  const t = almacen.trabajos().find((x) => x.id === trabajoId); if (!t) return { ok: false, motivo: "No encontramos ese trabajo." };
  const a = (t.adicionales ?? []).find((x) => x.id === adicionalId); if (!a) return { ok: false, motivo: "No encontramos esa propuesta." };
  if (t.estado === "completado" || t.estado === "cobrado") return { ok: false, motivo: "Ese trabajo ya se cerró." };
  const ahora = new Date().toISOString();
  const guardar = (cambio: Partial<Adicional>) => almacen.guardarTrabajo({ ...t, adicionales: (t.adicionales ?? []).map((x) => (x.id === a.id ? { ...x, ...cambio } : x)) });
  if (rol === "equipo") {
    if (a.estado !== "por-precio") return { ok: false, motivo: "Ya se decidió." };
    if (accion === "rechazar") {
      guardar({ estado: "rechazado", decidido: { en: ahora, ip: d.ip, por: "resuelto" } });
      await push.notificar(a.plomeroId, { titulo: "Adicional no aprobado", cuerpo: `Resuelto no aprobó "${a.descripcion.slice(0, 60)}". Haz solo el trabajo original.`, url: "/pro" }).catch(() => 0);
      return { ok: true, estado: "rechazado" };
    }
    const precio = Number(d.precio ?? a.precioPropuesto);
    if (!Number.isFinite(precio) || precio <= 0) return { ok: false, motivo: "Pon un precio válido." };
    guardar({ estado: "esperando-cliente", precio: r2(precio) });
    const nuevo = almacen.trabajos().find((x) => x.id === t.id)!;
    await mandarAlCliente(nuevo, { ...a, precio: r2(precio), estado: "esperando-cliente" });
    await push.notificar(a.plomeroId, { titulo: "Precio aprobado", cuerpo: `Resuelto aprobó ${pesos(precio)}. Ya le llegó al cliente para que lo apruebe.`, url: "/pro" }).catch(() => 0);
    return { ok: true, estado: "esperando-cliente" };
  }
  if (a.estado !== "esperando-cliente") return { ok: false, motivo: a.estado === "aprobado" ? "Ya lo aprobaste. ¡Gracias!" : a.estado === "rechazado" ? "Ya nos dijiste que no." : "Todavía lo está revisando Resuelto." };
  const estado = accion === "aprobar" ? "aprobado" : "rechazado";
  guardar({ estado, decidido: { en: ahora, ip: d.ip, por: "cliente" } });
  const txt = a.tipo === "recomendacion"
    ? (estado === "aprobado" ? `El cliente ACEPTÓ tu recomendación: "${a.descripcion.slice(0, 80)}".` : `El cliente NO aceptó tu recomendación. Quedó por escrito.`)
    : (estado === "aprobado" ? `El cliente APROBÓ ${pesos(a.precio)}: "${a.descripcion.slice(0, 70)}". Ya puedes hacerlo; se suma al cobro.` : `El cliente NO aprobó el adicional. Haz solo el trabajo original.`);
  archivar(t.contactoId, "cliente", `[${t.id}] ${estado === "aprobado" ? "Aprobó" : "No aprobó"} ${a.tipo === "recomendacion" ? "la recomendación" : "el adicional"}: "${a.descripcion}" ${pesos(a.precio)}`, t.id);
  await push.notificar(a.plomeroId, { titulo: estado === "aprobado" ? "✅ El cliente aprobó" : "El cliente dijo que no", cuerpo: txt, url: "/pro" }).catch(() => 0);
  await avisarEquipo(`${estado === "aprobado" ? "✅" : "✖️"} ${t.id} · ${t.nombre} ${estado === "aprobado" ? "aprobó" : "no aprobó"} ${a.tipo === "recomendacion" ? "la recomendación" : "el adicional"}: "${a.descripcion}" ${pesos(a.precio)}`).catch(() => undefined);
  return { ok: true, estado };
}

/** Página del enlace (cliente o equipo). */
export function paginaDecision(t: Trabajo, a: Adicional, rol: "cliente" | "equipo", k: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const titulo = rol === "equipo" ? "Aprobar precio del adicional" : a.tipo === "recomendacion" ? "Recomendación de tu técnico" : "Trabajo adicional";
  const decidido = rol === "equipo" ? a.estado !== "por-precio" : a.estado !== "esperando-cliente";
  const cuerpo = decidido
    ? `<p class="ok">${a.estado === "aprobado" ? "✅ Aprobado." : a.estado === "rechazado" ? "Anotado: no se hace." : "Recibido. Lo está revisando Resuelto."}</p>`
    : rol === "equipo"
      ? `<form method="post"><label>Mano de obra que se le cobra al cliente</label><input name="precio" type="number" step="1" min="1" value="${a.precioPropuesto ?? ""}"><button name="accion" value="aprobar" class="si">Aprobar y mandárselo al cliente</button><button name="accion" value="rechazar" class="no">No aprobar</button><input type="hidden" name="k" value="${esc(k)}"></form>`
      : `<form method="post"><button name="accion" value="aprobar" class="si">${a.tipo === "recomendacion" ? "Sí, la acepto" : "Aprobar"}</button><button name="accion" value="rechazar" class="no">${a.tipo === "recomendacion" ? "No, gracias" : "No lo apruebo"}</button><input type="hidden" name="k" value="${esc(k)}"></form><p class="pie">${a.tipo === "recomendacion" ? "Si no la aceptas, queda anotado que se te recomendó. Eso no cambia el trabajo que ya pediste." : "Si no lo apruebas, el técnico hace solo lo que pediste. Los materiales van aparte, al costo con recibo."}</p>`;
  return `<!doctype html><html lang="es-PR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo} · Resuelto</title><style>
body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#FBF7F0;color:#0F3D5E}main{max-width:480px;margin:0 auto;padding:28px 18px}
h1{font-size:24px;margin:.2em 0}.card{background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 12px #0f3d5e14;margin-top:14px;font-size:18px;line-height:1.45}
.precio{font-size:30px;font-weight:800;color:#F2621F;margin:8px 0}label{display:block;font-size:15px;margin-top:10px}input[type=number]{width:100%;font-size:22px;padding:10px;border:1.5px solid #cfd8df;border-radius:10px;box-sizing:border-box}
button{display:block;width:100%;font-size:19px;font-weight:700;padding:15px;border:0;border-radius:14px;margin-top:12px}.si{background:#1f9d55;color:#fff}.no{background:#eef1f4;color:#0F3D5E}.ok{font-size:20px;font-weight:700}.pie{font-size:14px;color:#5b7385}</style></head>
<body><main><div style="font-weight:800;font-size:20px">✔ resuelto</div><h1>${titulo}</h1><div class="card"><div style="font-size:15px;color:#5b7385">${esc(t.servicio)} · ${esc(t.municipio)}</div>
<p>“${esc(a.descripcion)}”</p>${a.precio != null || a.precioPropuesto != null ? `<div class="precio">${pesos(a.precio ?? a.precioPropuesto)}</div><div style="font-size:15px;color:#5b7385">de mano de obra${rol === "equipo" ? " (propuesto por el plomero)" : ""}</div>` : ""}
${cuerpo}</div></main></body></html>`;
}
