/**
 * App del cotizador (tablet). Rutas bajo /api/cotizador y la vista /cotizar.
 * Flujo: visita → fotos + notas → (IA sugiere scope) → partidas del Cost Book → motor de precio
 * (recomendado / mínimo / aprobación) → propuesta con marca → cierre: contrato + depósito →
 * al recibir el depósito, el proyecto se cierra y sale la OFERTA a contratistas.
 */
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { RAIZ, almacen, type Proyecto } from "./almacen.js";
import { config } from "./config.js";
import { cotizar, type Cotizacion, type Partida } from "./cotizador.js";
import { firmar, verificarFirma } from "./proveedores.js";
import { propuestaHTML, contratoClienteHTML } from "./propuestas.js";
import { crearLinkPago } from "./integraciones/cobros.js";
import { crearOportunidad, actualizarOportunidad } from "./integraciones/crm.js";
import { enviarTexto, avisarCoordinador } from "./canales/whatsapp.js";
import { crearOferta } from "./despacho.js";
import { comision } from "./encuestas.js";

const leerJSON = (f: string) => JSON.parse(fs.readFileSync(path.join(RAIZ, "data", f), "utf8"));
const COSTBOOK = path.join(RAIZ, "data", "costbook.json");
const cotizadores = () => leerJSON("cotizadores.json").cotizadores as { id: string; nombre: string; territorios: string[]; whatsapp: string; estado: string }[];
const categorias = () => leerJSON("categorias-proyectos.json").categorias as { id: string; nombre: string; tiempo_tipico_dias: [number, number] }[];

function auth(req: any) {
  const c = String(req.query.c ?? req.body?.c ?? ""), k = String(req.query.k ?? req.body?.k ?? "");
  if (!c || !k || !verificarFirma(c, k)) return null;
  return cotizadores().find((x) => x.id === c) ?? null;
}
export const linkCotizador = (id: string) => `${config.urlPublica}/cotizar?c=${encodeURIComponent(id)}&k=${firmar(id)}`;
const firmaDoc = (id: string) => firmar("doc:" + id);

export const router = Router();

/** Contexto: quién soy, categorías, Cost Book y mis proyectos en visita/propuesta. */
router.get("/api/cotizador/contexto", (req: any, res) => {
  const cot = auth(req); if (!cot) return res.status(401).json({ error: "Enlace inválido." });
  const cb = JSON.parse(fs.readFileSync(COSTBOOK, "utf8"));
  const mios = almacen.proyectos().filter((p) => ["visita-agendada", "visita-realizada", "propuesta", "aprobacion-pendiente", "pendiente-deposito"].includes(p.estado) && (!p.cotizadorId || p.cotizadorId === cot.id || (p.territorio && cot.territorios.includes(p.territorio))));
  res.json({ cotizador: { id: cot.id, nombre: cot.nombre }, categorias: categorias(), costbook: cb.categorias, proyectos: mios.sort((a, b) => (a.visita?.inicio ?? "").localeCompare(b.visita?.inicio ?? "")) });
});

/** Calcula precio con el motor (nunca lo hace el cotizador a mano). */
router.post("/api/cotizador/calcular", (req: any, res) => {
  if (!auth(req)) return res.status(401).json({ error: "Enlace inválido." });
  try { res.json(cotizar({ categoriaId: req.body.categoriaId, partidas: req.body.partidas as Partida[], precioPropuesto: req.body.precioPropuesto ? Number(req.body.precioPropuesto) : undefined })); }
  catch (e) { res.status(400).json({ error: String((e as Error).message) }); }
});

/** IA: a partir de fotos y notas de la visita, sugiere partidas del Cost Book con cantidades. */
router.post("/api/cotizador/sugerir-scope", async (req: any, res) => {
  if (!auth(req)) return res.status(401).json({ error: "Enlace inválido." });
  if (!process.env.ANTHROPIC_API_KEY) return res.json({ partidas: [], nota: "IA no configurada (ANTHROPIC_API_KEY)." });
  const { categoriaId, notas, fotos } = req.body as { categoriaId: string; notas?: string; fotos?: { mime: string; base64: string }[] };
  const cb = JSON.parse(fs.readFileSync(COSTBOOK, "utf8")).categorias[categoriaId];
  if (!cb) return res.status(400).json({ error: "categoría inválida" });
  const items = cb.items.map((i: any) => `${i.id} · ${i.nombre} · unidad: ${i.unidad}`).join("\n");
  const client = new Anthropic();
  const contenido: Anthropic.MessageParam["content"] = [
    ...(fotos ?? []).slice(0, 8).map((f) => ({ type: "image" as const, source: { type: "base64" as const, media_type: f.mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: f.base64 } })),
    { type: "text", text: `Eres el asistente del cotizador de Resuelto (remodelaciones en Puerto Rico). Con las fotos y las notas de la visita, propone el alcance como partidas del Cost Book con cantidades estimadas. Sé conservador y marca lo que no puedas ver.\n\nCategoría: ${categoriaId}\nNotas del cotizador: ${notas || "(sin notas)"}\n\nPartidas disponibles (usa SOLO estos ids):\n${items}\n\nResponde únicamente con JSON: {"partidas":[{"id":"...","cantidad":number,"porque":"..."}],"alertas":["..."],"preguntas_al_cliente":["..."]}` },
  ];
  try {
    const r = await client.messages.create({ model: config.modelo, max_tokens: 2000, output_config: { effort: "medium" }, messages: [{ role: "user", content: contenido }] } as any);
    const texto = (r.content as any[]).filter((b) => b.type === "text").map((b) => b.text).join("");
    const m = texto.match(/\{[\s\S]*\}/);
    res.json(m ? JSON.parse(m[0]) : { partidas: [], alertas: ["No pude estructurar la sugerencia"], bruto: texto });
  } catch (e) { res.status(502).json({ error: String((e as Error).message) }); }
});

/** Guarda una muestra real de costo en el Cost Book (así se construye con cada visita). */
router.post("/api/cotizador/muestra", (req: any, res) => {
  const cot = auth(req); if (!cot) return res.status(401).json({ error: "Enlace inválido." });
  const { categoriaId, itemId, costo, contratistaId, supuestos } = req.body;
  const cb = JSON.parse(fs.readFileSync(COSTBOOK, "utf8"));
  const item = cb.categorias?.[categoriaId]?.items?.find((i: any) => i.id === itemId);
  if (!item || !(Number(costo) > 0)) return res.status(400).json({ error: "partida o costo inválido" });
  item.muestras.push({ contratista_id: contratistaId || "cotizador:" + cot.id, fecha: new Date().toISOString().slice(0, 10), costo: Number(costo), unidad: item.unidad, supuestos: supuestos || "", origen: "cotizado" });
  if (item.muestras.length >= 3) { const cs = item.muestras.map((m: any) => m.costo).sort((a: number, b: number) => a - b); const med = cs[Math.floor(cs.length / 2)]; const desv = (cs[cs.length - 1] - cs[0]) / med; if (desv <= 0.25) { item.costo = med; item.validado = true; } }
  fs.writeFileSync(COSTBOOK, JSON.stringify(cb, null, 2));
  res.json({ ok: true, muestras: item.muestras.length, costo: item.costo, validado: item.validado });
});

/** Guarda la propuesta: fotos, partidas, precio final → documento con marca + link para el cliente. */
router.post("/api/cotizador/propuesta", async (req: any, res) => {
  const cot = auth(req); if (!cot) return res.status(401).json({ error: "Enlace inválido." });
  const { proyectoId, categoriaId, partidas, precioFinal, incluye, noIncluye, duracionDias, notas, fotos } = req.body as { proyectoId: string; categoriaId: string; partidas: (Partida & { unidad: string })[]; precioFinal: number; incluye?: string; noIncluye?: string; duracionDias?: [number, number]; notas?: string; fotos?: { mime: string; base64: string }[] };
  const p = almacen.proyectos().find((x) => x.id === proyectoId); if (!p) return res.status(404).json({ error: "proyecto no existe" });
  let cot_: Cotizacion;
  try { cot_ = cotizar({ categoriaId, partidas, precioPropuesto: Number(precioFinal) }); } catch (e) { return res.status(400).json({ error: String((e as Error).message) }); }
  if (cot_.bloqueado) return res.status(400).json({ error: cot_.motivo, cotizacion: cot_ });

  // Fotos de la visita
  const dir = path.join(RAIZ, "data", "estado", "fotos", p.id); fs.mkdirSync(dir, { recursive: true });
  let nFotos = p.fotos;
  for (const f of (fotos ?? []).slice(0, 20)) { const ext = f.mime.includes("png") ? "png" : "jpg"; fs.writeFileSync(path.join(dir, `${Date.now()}-${nFotos++}.${ext}`), Buffer.from(f.base64, "base64")); }

  const cat = categorias().find((c) => c.id === categoriaId);
  const datos = { proyecto: p, cot: cot_, categoriaNombre: cat?.nombre ?? categoriaId, partidas: partidas.map((x) => ({ nombre: x.nombre, cantidad: x.cantidad, unidad: x.unidad })), incluye, noIncluye, duracionDias: duracionDias ?? cat?.tiempo_tipico_dias, cotizadorNombre: cot.nombre, waLink: `https://wa.me/${process.env.WA_NUMERO_PUBLICO ?? ""}?text=${encodeURIComponent(`Acepto la propuesta ${p.id}`)}` };
  const docs = path.join(RAIZ, "data", "estado", "propuestas"); fs.mkdirSync(docs, { recursive: true });
  fs.writeFileSync(path.join(docs, `${p.id}.html`), propuestaHTML(datos));
  fs.writeFileSync(path.join(docs, `${p.id}-contrato.html`), contratoClienteHTML({ ...datos, registroDaco: process.env.RESUELTO_DACO }));
  const propuestaUrl = `${config.urlPublica}/propuesta/${p.id}?k=${firmaDoc(p.id)}`;

  const estado: Proyecto["estado"] = cot_.requiereAprobacion ? "aprobacion-pendiente" : "propuesta";
  const actualizado: Proyecto = { ...p, estado, categoriaId, cotizadorId: cot.id, fotos: nFotos, precio: cot_.precioFinal, costoTotal: cot_.costoEjecucion, margenPct: cot_.margenFinal, cotizacion: { partidas, precioFinal: cot_.precioFinal, costoEjecucion: cot_.costoEjecucion, margenFinal: cot_.margenFinal, requiereAprobacion: cot_.requiereAprobacion, hitos: cot_.hitos, propuestaUrl, notas, actualizado: new Date().toISOString() } };
  almacen.guardarProyecto(actualizado);

  if (p.ghlOpportunityId) actualizarOportunidad(p.ghlOpportunityId, { monetaryValue: cot_.precioFinal, stageId: process.env.GHL_STAGE_PROPUESTA }).catch(() => undefined);
  else if (p.ghlContactId) crearOportunidad({ contactId: p.ghlContactId, nombre: p.nombre, valor: cot_.precioFinal, trabajoId: p.id, pipelineId: process.env.GHL_PIPELINE_PROYECTOS_ID, stageId: process.env.GHL_STAGE_PROPUESTA }).then((id) => { if (id) almacen.guardarProyecto({ ...actualizado, ghlOpportunityId: id }); }).catch(() => undefined);

  if (cot_.requiereAprobacion) await avisarCoordinador(`⚠️ Aprobación de precio · ${p.id} (${cat?.nombre})\nCotizador: ${cot.nombre}\nPrecio propuesto $${cot_.precioFinal} · margen ${Math.round(cot_.margenFinal * 1000) / 10}% · mínimo sin aprobación $${cot_.precioMinimoSinAprobacion}\nAprobar: ${config.urlPublica}/admin/proyectos/${p.id}/aprobar?k=${firmaDoc(p.id)}`);
  else await enviarTexto(p.telefono, `Hola ${p.nombre.split(" ")[0]}, aquí está tu propuesta de Resuelto para ${cat?.nombre?.toLowerCase()}: precio fijo $${cot_.precioFinal.toLocaleString("en-US")}, con garantía de 12 meses.\n${propuestaUrl}\nCuando quieras avanzar, responde "Acepto" y te mando el contrato y el depósito.`);

  res.json({ ok: true, proyecto: actualizado, cotizacion: cot_, propuestaUrl });
});

/** Cierre: el cliente aceptó → contrato + link de depósito. Cerrado de verdad = depósito recibido (webhook o confirmación manual). */
router.post("/api/cotizador/cerrar", async (req: any, res) => {
  const cot = auth(req); if (!cot) return res.status(401).json({ error: "Enlace inválido." });
  const { proyectoId, depositoRecibido, metodo } = req.body as { proyectoId: string; depositoRecibido?: boolean; metodo?: string };
  const p = almacen.proyectos().find((x) => x.id === proyectoId); if (!p?.cotizacion) return res.status(400).json({ error: "primero guarda la propuesta" });
  if (p.estado === "aprobacion-pendiente" && !p.cotizacion.aprobado) return res.status(400).json({ error: "precio pendiente de aprobación" });
  const deposito = p.cotizacion.hitos[0];
  const link = await crearLinkPago({ trabajoId: p.id, concepto: `Depósito ${p.id}`, montoCentavos: Math.round(deposito.monto * 100), telefono: p.telefono, proyectoId: p.id });
  const contratoUrl = `${config.urlPublica}/propuesta/${p.id}/contrato?k=${firmaDoc(p.id)}`;
  const act: Proyecto = { ...p, estado: "pendiente-deposito", deposito: deposito.monto, cotizacion: { ...p.cotizacion, depositoLink: link.url, contratoUrl } };
  almacen.guardarProyecto(act);
  await enviarTexto(p.telefono, `${p.nombre.split(" ")[0]}, para reservar tu fecha:\n1) Contrato: ${contratoUrl}\n2) Depósito de $${deposito.monto.toLocaleString("en-US")}: ${link.url ?? link.athMovil}\nEn cuanto entre el depósito, te confirmamos el contratista y la fecha de inicio.`);
  if (depositoRecibido) return res.json(await cerrarConDeposito(p.id, metodo ?? "manual"));
  res.json({ ok: true, proyecto: act, depositoLink: link.url ?? null, athMovil: link.athMovil, contratoUrl });
});

/** Depósito confirmado → CERRADO → oferta a contratistas. Lo llama el webhook de Stripe o la confirmación manual. */
export async function cerrarConDeposito(proyectoId: string, metodo: string) {
  const p = almacen.proyectos().find((x) => x.id === proyectoId); if (!p?.cotizacion) return { ok: false, error: "sin propuesta" };
  if (p.estado === "cerrado" || p.estado === "asignado") return { ok: true, proyecto: p, nota: "ya estaba cerrado" };
  const cat = categorias().find((c) => c.id === p.categoriaId);
  const cerrado: Proyecto = { ...p, estado: "cerrado", cotizacion: { ...p.cotizacion, depositoRecibidoEn: new Date().toISOString(), depositoMetodo: metodo } };
  almacen.guardarProyecto(cerrado);
  if (p.ghlOpportunityId) actualizarOportunidad(p.ghlOpportunityId, { stageId: process.env.GHL_STAGE_CERRADO, status: "won" }).catch(() => undefined);
  const pago = p.cotizacion.costoEjecucion;
  const hitosProv = [{ nombre: "Arranque (cliente depositó)", monto: Math.round(pago * 0.4 * 100) / 100 }, { nombre: "Avance con fotos", monto: Math.round(pago * 0.5 * 100) / 100 }, { nombre: "Aceptación final", monto: Math.round(pago * 0.1 * 100) / 100 }];
  const oferta = await crearOferta({ tipo: "proyecto", referencia: p.id, categoria: p.categoriaId, categoriaNombre: cat?.nombre ?? p.categoriaId, territorio: p.territorio, municipio: p.municipio, resumen: p.cotizacion.partidas.map((x) => `${x.nombre} (${x.cantidad} ${(x as any).unidad ?? ""})`).join(" · "), pagoProveedor: pago, hitos: hitosProv, inicio: undefined });
  const com = comision(cerrado);
  await avisarCoordinador(`🎉 CERRADO ${p.id} · ${cat?.nombre} · $${p.cotizacion.precioFinal.toLocaleString("en-US")} (depósito ${metodo})\nCotizador ${p.cotizadorId}: $${com.cotizador}${com.conRecovery ? ` (2%) · Recovery $${com.recovery} (0.5%)` : " (2.5%)"}\nOferta ${oferta.id} enviada a ${oferta.avisados.length} contratista(s).`);
  return { ok: true, proyecto: cerrado, oferta };
}

/** Aprobación de un descuento por el Coordinador/Elvin (enlace firmado que va en el aviso). */
router.get("/admin/proyectos/:id/aprobar", async (req, res) => {
  const p = almacen.proyectos().find((x) => x.id === req.params.id); if (!p?.cotizacion) return res.status(404).send("no existe");
  if (!verificarFirma("doc:" + p.id, String(req.query.k ?? ""))) return res.status(403).send("enlace inválido");
  almacen.guardarProyecto({ ...p, estado: "propuesta", cotizacion: { ...p.cotizacion, aprobado: true, aprobadoEn: new Date().toISOString() } });
  await enviarTexto(p.telefono, `Hola ${p.nombre.split(" ")[0]}, aquí está tu propuesta de Resuelto: precio fijo $${p.cotizacion.precioFinal.toLocaleString("en-US")}, con garantía de 12 meses.\n${p.cotizacion.propuestaUrl}`);
  res.send(`Precio de ${p.id} aprobado ($${p.cotizacion.precioFinal}). Propuesta enviada al cliente.`);
});

/** Confirmación manual de depósito (ATH Móvil / transferencia) por el Coordinador. */
router.post("/admin/proyectos/:id/deposito", async (req, res) => { res.json(await cerrarConDeposito(req.params.id, String(req.body?.metodo ?? "manual"))); });

/** Documentos del cliente: propuesta y contrato (enlace firmado, sin login). */
router.get("/propuesta/:id", (req, res) => {
  if (!verificarFirma("doc:" + req.params.id, String(req.query.k ?? ""))) return res.status(403).send("Enlace inválido.");
  const f = path.join(RAIZ, "data", "estado", "propuestas", `${req.params.id}.html`);
  if (!fs.existsSync(f)) return res.status(404).send("Propuesta no encontrada.");
  res.type("html").send(fs.readFileSync(f));
});
router.get("/propuesta/:id/contrato", (req, res) => {
  if (!verificarFirma("doc:" + req.params.id, String(req.query.k ?? ""))) return res.status(403).send("Enlace inválido.");
  const f = path.join(RAIZ, "data", "estado", "propuestas", `${req.params.id}-contrato.html`);
  if (!fs.existsSync(f)) return res.status(404).send("Contrato no encontrado.");
  res.type("html").send(fs.readFileSync(f));
});

/** La app (tablet). */
router.get("/cotizar", (_req, res) => { res.type("html").send(fs.readFileSync(path.join(RAIZ, "portal", "cotizador.html"), "utf8")); });
