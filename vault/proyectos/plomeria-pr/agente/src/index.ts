/**
 * Servidor del agente de Resuelto.
 *  GET  /health
 *  POST /webhook/zernio          WhatsApp vía Zernio (default): message.received / message.sent
 *  GET  /webhook/meta            verificación de Meta (WhatsApp directo, Instagram, Messenger)
 *  POST /webhook/meta            mensajes entrantes de los tres canales
 *  POST /api/chat                widget web de las landings  { sessionId, texto, adjuntos?[] }
 *  POST /webhook/stripe          pago recibido → trabajo cobrado
 *  GET  /admin/liberar/:id       devuelve una conversación escalada al agente
 *  GET  /admin/estado            resumen (trabajos, candidatos, lista de espera)
 *  GET  /widget.js               script embebible
 */
import express from "express";
import fs from "node:fs";
import crypto from "node:crypto";
import sharp from "sharp";
import path from "node:path";
import { config } from "./config.js";
import { almacen, RAIZ } from "./almacen.js";
import { upsertContacto } from "./integraciones/crm.js";
import * as nina from "./community/nina.js";
import { DIR_MEDIA } from "./community/render.js";
import { BIBLIOTECA } from "./community/biblioteca.js";
import { responder } from "./agente.js";
import { humanizar } from "./humanizar.js";
import { esSoloAcuse, ultimoPregunto } from "./cierre.js";
import * as wa from "./canales/whatsapp.js";
import * as waMeta from "./canales/whatsapp-meta.js";
import * as zernio from "./canales/zernio.js";
import * as meta from "./canales/meta.js";
import { verificarEventoStripe } from "./integraciones/cobros.js";
import type { Adjunto } from "./integraciones/media.js";
import { clasificarMime } from "./integraciones/media.js";
import * as despacho from "./despacho.js";
import { porId as proveedorPorId, porWhatsapp as proveedorPorWhatsapp, verificarFirma, listar as listarProveedores, plomeros as registroPlomeros, altaPlomero, cambiarEstadoPlomero, linkPortal } from "./proveedores.js";
import * as ciclo from "./ciclo-trabajo.js";
import { panelPlomerosHTML, pagarHTML } from "./paginas-operacion.js";
import { leerWebhook as leerWebhookDocusign } from "./integraciones/docusign.js";
import * as push from "./push.js";
import { router as cotizadorRouter, cerrarConDeposito, linkCotizador } from "./cotizador-app.js";
import * as encuestas from "./encuestas.js";
import { dashboardHTML } from "./dashboard.js";

const LINK_WA = `https://wa.me/${config.wa.numeroPublico}?text=${encodeURIComponent("Hola, quiero cotizar un trabajo")}`;
const app = express();
app.set("trust proxy", true);

// Guardamos el cuerpo crudo para validar firmas (Meta y Stripe).
app.use(express.json({ limit: "25mb", verify: (req: any, _res, buf) => { req.rawBody = buf; } }));

app.use((req, res, next) => {
  const origen = req.headers.origin ?? "";
  if (config.corsOrigenes.includes("*") || config.corsOrigenes.includes(origen)) {
    res.setHeader("Access-Control-Allow-Origin", origen || "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
// ── /admin protegido: ?t=<ADMIN_TOKEN> (deja cookie 12 h), header x-admin-token o cookie. Excepción: aprobaciones firmadas (?k=). ──
app.use("/admin", (req: any, res, next) => {
  const tok = config.adminToken;
  if (!tok) return res.status(503).send("ADMIN_TOKEN no configurado");
  if (/^\/proyectos\/[^/]+\/aprobar$/.test(req.path) && req.query.k) return next();
  const cookie = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
  const dado = String(req.query.t ?? req.headers["x-admin-token"] ?? cookie ?? "");
  if (dado.length !== tok.length || !crypto.timingSafeEqual(Buffer.from(dado), Buffer.from(tok))) return res.status(401).send("No autorizado");
  if (req.query.t) res.setHeader("Set-Cookie", `adm=${tok}; Path=/admin; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`);
  next();
});

// Evita procesar dos veces el mismo mensaje si Meta reintenta el webhook.
const vistos = new Set<string>();
function yaVisto(id: string) { if (vistos.has(id)) return true; vistos.add(id); if (vistos.size > 5000) vistos.clear(); return false; }

app.get("/health", (_req, res) => res.json({ ok: true, modelo: config.modelo, whatsapp: config.wa.proveedor, integraciones: { whatsapp: config.tiene.whatsapp(), meta: config.tiene.meta(), calendario: config.tiene.calendario(), stripe: config.tiene.stripe(), ghl: config.tiene.ghl(), whisper: config.tiene.whisper() } }));

// ── WhatsApp: un mensaje entrante, venga de Zernio o de Meta directo ──
const ultimoNuestroPregunto = (contactoId: string) => ultimoPregunto(almacen.conversacion(contactoId).mensajes);
async function atenderWhatsApp(m: wa.MensajeWA) {
  // Proveedor aceptando una oferta por WhatsApp: "ACEPTO OF-0001"
  const acepto = m.texto?.match(/acepto\s+(OF-\d{4})/i);
  if (acepto) {
    const prov = proveedorPorWhatsapp(m.de);
    if (prov) { const r = await despacho.aceptar(acepto[1].toUpperCase(), prov.id); if (!r.ok) await wa.enviarTexto(m.de, r.motivo); return; }
  }
  const contacto = almacen.obtenerOCrearContacto("whatsapp", m.de);
  if (m.nombre && !contacto.nombre) { contacto.nombre = m.nombre; almacen.guardarContacto(contacto); }
  // Todo el que escribe queda en GHL desde el primer mensaje (aunque abandone a mitad). El agente lo clasifica después.
  if (!contacto.ghlContactId) {
    const ghlId = await upsertContacto({ nombre: contacto.nombre, telefono: m.de, tags: ["whatsapp-entrante"], fuente: "whatsapp" }).catch(() => undefined);
    if (ghlId) { contacto.ghlContactId = ghlId; contacto.telefono = contacto.telefono ?? m.de; almacen.guardarContacto(contacto); }
  }
  // Un humano tomó el chat (escalación o contestó desde el inbox); pasadas HUMANO_HORAS sin actividad humana, el agente retoma.
  if (contacto.humano && contacto.humanoDesde && Date.now() - new Date(contacto.humanoDesde).getTime() > config.humanoHoras * 3600_000) {
    contacto.humano = false; almacen.guardarContacto(contacto);
  }
  // Un "ok"/"gracias"/👍 después de que ya cerramos (nuestro último mensaje no preguntó nada) no se contesta:
  // responderlo con otro "Wepa! Cuídate" es lo que delata al bot (caso David, 22/sep).
  if (esSoloAcuse(m.texto) && !m.mediaIds.length && !ultimoNuestroPregunto(contacto.id)) return;
  const adjuntos = (await Promise.all(m.mediaIds.map((ref) => wa.descargarMedia(ref)))).filter((a): a is Adjunto => !!a);
  const texto = [m.texto, m.ubicacion ? `[Ubicación compartida: ${m.ubicacion.direccion ?? ""} (${m.ubicacion.lat}, ${m.ubicacion.lng})]` : ""].filter(Boolean).join("\n");
  const respuestas = await responder(contacto, { texto, adjuntos });
  // Se envía humanizado (minúsculas, sin "¡", un error leve de tilde en el 3º-4º mensaje);
  // el historial de la conversación guarda la versión limpia del modelo.
  let n = contacto.enviadosWa ?? 0;
  for (const r of respuestas) { n++; await wa.enviarTexto(m.de, humanizar(r, n, contacto.id)); }
  if (respuestas.length) { const fresco = almacen.contacto(contacto.id) ?? contacto; almacen.guardarContacto({ ...fresco, enviadosWa: n }); }
}

// ── Zernio: WhatsApp (message.received) + detección de que un humano contestó (message.sent) ──
app.post("/webhook/zernio", async (req: any, res) => {
  if (!zernio.firmaValida(req.rawBody, req.headers["x-zernio-signature"])) return res.sendStatus(401);
  res.sendStatus(200); // Zernio exige 2xx en 5 s; procesamos después
  try {
    const evento = String(req.body?.event ?? "");
    if (evento === "webhook.test") return console.log("Zernio: webhook de prueba recibido");
    if (req.body?.id && yaVisto(`zernio:${req.body.id}`)) return; // entrega at-least-once
    const toma = zernio.tomaHumana(req.body);
    if (toma) {
      zernio.recordarConversacion(toma.telefono, toma.conversationId);
      const c = almacen.obtenerOCrearContacto("whatsapp", toma.telefono);
      almacen.guardarContacto({ ...c, humano: true, humanoDesde: new Date().toISOString() });
      return console.log(`WA: humano contestó a ${toma.telefono}; el agente calla ${config.humanoHoras} h`);
    }
    for (const m of zernio.parsearWebhook(req.body)) {
      if (m.standby) continue; // Meta Business Agent está contestando; no le quitamos el chat
      if (yaVisto(m.id)) continue;
      zernio.recordarConversacion(m.de, m.conversationId);
      await zernio.marcarLeido(m.conversationId);
      await atenderWhatsApp(m);
    }
  } catch (e) { console.error("webhook/zernio", e); }
});

// ── Meta: verificación del webhook ──
app.get("/webhook/meta", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === config.wa.verifyToken) return res.status(200).send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

// ── Meta: mensajes de WhatsApp, Instagram y Messenger ──
app.post("/webhook/meta", async (req: any, res) => {
  res.sendStatus(200); // Meta exige respuesta rápida; procesamos después
  try {
    if (req.body?.object === "whatsapp_business_account") {
      if (config.wa.proveedor !== "meta") return console.warn("WA: llegó webhook de Meta pero WA_PROVEEDOR=zernio");
      if (!waMeta.firmaValida(req.rawBody, req.headers["x-hub-signature-256"])) return console.warn("WA firma inválida");
      for (const m of waMeta.parsearWebhook(req.body)) {
        if (yaVisto(m.id)) continue;
        await waMeta.marcarLeido(m.id);
        await atenderWhatsApp(m);
      }
    } else if (req.body?.object === "instagram" || req.body?.object === "page") {
      // Decisión de Elvin (6/sep): toda la atención es por WhatsApp. En IG y Messenger
      // contestamos UNA vez con el link y no abrimos conversación.
      for (const m of meta.parsearWebhook(req.body)) {
        if (yaVisto(m.id)) continue;
        const contacto = almacen.obtenerOCrearContacto(m.canal, m.de);
        const hace = Date.now() - new Date(contacto.actualizado).getTime();
        if (contacto.notas.includes("redirigido-whatsapp") && hace < 6 * 3600_000) continue; // ya se lo dijimos hace poco
        await meta.enviarTexto(m.de, `¡Hola! Te atendemos por WhatsApp para darte el precio fijo y agendarte en 2 minutos: ${LINK_WA}`);
        almacen.guardarContacto({ ...contacto, notas: [...contacto.notas.filter((n) => n !== "redirigido-whatsapp"), "redirigido-whatsapp"] });
      }
    }
  } catch (e) { console.error("webhook/meta", e); }
});

// ── Widget web (landings) ──
app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, texto, adjuntos } = req.body as { sessionId?: string; texto?: string; adjuntos?: { mime: string; base64: string; nombre?: string }[] };
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 80) return res.status(400).json({ error: "sessionId requerido" });
    const contacto = almacen.obtenerOCrearContacto("web", sessionId);
    const adj: Adjunto[] = (adjuntos ?? []).slice(0, 4).map((a) => ({ tipo: clasificarMime(a.mime), mime: a.mime, datos: Buffer.from(a.base64, "base64"), nombre: a.nombre }));
    const respuestas = await responder(contacto, { texto, adjuntos: adj });
    res.json({ respuestas, humano: contacto.humano, whatsapp: LINK_WA });
  } catch (e) { console.error("api/chat", e); res.status(500).json({ error: "Se me fue la señal un segundo. Escríbeme otra vez o sigue por WhatsApp." }); }
});

// ── Stripe: pago recibido ──
app.post("/webhook/stripe", (req: any, res) => {
  const ev = verificarEventoStripe(req.rawBody, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET ?? "");
  if (!ev) return res.sendStatus(400);
  if (ev.type === "checkout.session.completed") {
    const s = ev.data.object as any;
    if (s.metadata?.proyectoId) { cerrarConDeposito(s.metadata.proyectoId, "stripe").catch(console.error); }
    const t = almacen.trabajos().find((x) => x.id === s.metadata?.trabajoId);
    if (t && !s.metadata?.proyectoId) { almacen.guardarTrabajo({ ...t, estado: "cobrado" }); wa.avisarCoordinador(`💳 Cobrado ${t.id} · $${(s.amount_total / 100).toFixed(2)} · ${t.nombre}`).catch(() => undefined); if (t.telefono) wa.enviarTexto(t.telefono, `Recibido, ${t.nombre.split(" ")[0]}. Pago de $${(s.amount_total / 100).toFixed(2)} por ${t.servicio} confirmado. Tienes 12 meses de garantía en la mano de obra. Si todo quedó bien, nos ayudas muchísimo con una reseña en Google. ¡Gracias por confiar en Resuelto!`).catch(() => undefined); }
  }
  res.sendStatus(200);
});

// ── Admin mínimo ──
app.get("/admin/liberar/:id", (req, res) => {
  const c = almacen.contacto(req.params.id);
  if (!c) return res.status(404).send("no existe");
  almacen.guardarContacto({ ...c, humano: false });
  res.send(`Conversación de ${c.nombre ?? c.identificador} devuelta al agente.`);
});
// ── QA + Recovery ──
app.get("/admin/recovery", (_req, res) => res.json({ cola: encuestas.colaRecovery().map((p) => ({ id: p.id, nombre: p.nombre, telefono: p.telefono, categoria: p.categoriaId, precio: p.cotizacion?.precioFinal, cotizador: p.cotizadorId, motivo: p.encuesta?.motivoNoContrato, comparando: p.encuesta?.estaComparando, financiamiento: p.encuesta?.interesFinanciamiento, comentario: p.encuesta?.comentario, llamadas: p.encuesta?.recovery?.llamadas, notas: p.encuesta?.recovery?.notas })) }));
app.post("/admin/recovery/:id/llamada", (req, res) => res.json({ ok: true, recovery: encuestas.registrarLlamada(req.params.id, { resultado: req.body?.resultado, nota: req.body?.nota }) }));
app.post("/admin/encuestas/revisar", async (_req, res) => { await encuestas.revisarPendientes(); res.json({ ok: true }); });
app.get("/admin/dashboard", (_req, res) => res.type("html").send(dashboardHTML()));

app.get("/admin/estado", (_req, res) => res.json({ trabajos: almacen.trabajos().slice(-50), candidatos: almacen.candidatos(), listaEspera: almacen.listaEspera() }));

// ── App del cotizador (tablet) + documentos del cliente ──
app.use(cotizadorRouter);

// ── Portal de proveedores (plomeros y contratistas) ──
function proveedorAutenticado(req: any) {
  const p = String(req.query.p ?? req.body?.p ?? ""), k = String(req.query.k ?? req.body?.k ?? "");
  if (!p || !k || !verificarFirma(p, k)) return null;
  return proveedorPorId(p) ?? null;
}
app.get("/proveedores", (_req, res) => { res.type("html").send(fs.readFileSync(path.join(RAIZ, "portal", "proveedores.html"), "utf8")); });
// PWA: manifest, service worker e íconos
app.get("/manifest.webmanifest", (_req, res) => { res.type("application/manifest+json").send(fs.readFileSync(path.join(RAIZ, "portal", "manifest.webmanifest"))); });
app.get("/sw.js", (_req, res) => { res.type("application/javascript").set("Service-Worker-Allowed", "/").send(fs.readFileSync(path.join(RAIZ, "portal", "sw.js"))); });
// Material interno del equipo (decks de entrevista). Ruta no enlazada, noindex; el nombre del archivo hace de llave.
// Los binarios se guardan en base64 (.b64) porque el CLI de Railway no sube archivos binarios.
app.get("/equipo/:archivo", (req, res) => {
  const nombre = path.basename(req.params.archivo);
  const f = path.join(RAIZ, "portal", "equipo", nombre + ".b64");
  if (!fs.existsSync(f)) return res.status(404).end();
  const buf = Buffer.from(fs.readFileSync(f, "utf8").replace(/\s+/g, ""), "base64");
  res.set("X-Robots-Tag", "noindex, nofollow").attachment(nombre.replace(/-k7m2p9/, "")).type("application/vnd.openxmlformats-officedocument.presenninaonml.presenninaon").send(buf);
});
// ── Nina · Community Manager (Zernio + Telegram) ──
app.get("/community/media/:archivo", (req, res) => {
  const f = path.join(DIR_MEDIA, path.basename(req.params.archivo));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.type("png").set("Cache-Control", "public, max-age=31536000").send(fs.readFileSync(f));
});
app.get("/admin/nina/plan", (_req, res) => res.json({ hoy: nina.planDeHoy(), historial: nina.historial().publicaciones.slice(-10) }));
app.post("/admin/nina/ejecutar", async (req: any, res) => {
  const modo = (req.query.modo ?? req.body?.modo ?? "borrador") as "publicar" | "programar" | "borrador";
  // Overrides opcionales: ?creativo=f01 (id de biblioteca) y ?fecha=YYYY-MM-DD (para programar otro día)
  let plan = nina.planDeHoy(undefined, req.query.fecha ? String(req.query.fecha) : undefined);
  if (req.query.creativo) {
    const c = BIBLIOTECA.find((x) => x.id === String(req.query.creativo));
    if (!c) return res.status(400).json({ error: "creativo no existe" });
    plan = { ...plan, pilar: c.pilar, formato: c.formato, creativo: c, generar: false, angulo: c.tema };
  }
  try { res.json(await nina.ejecutar(modo, plan)); } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});
app.post("/admin/nina/preaviso", async (_req, res) => { await nina.preaviso(); res.json({ ok: true }); });
// Íconos de la PWA: se generan del logo (SVG) con sharp — el CLI de Railway no sube binarios.
const iconos = new Map<number, Buffer>();
app.get(["/icon-192.png", "/icon-512.png"], async (req, res) => {
  const n = req.path.includes("512") ? 512 : 192;
  if (!iconos.has(n)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F2621F"/><path d="M32 12 L53 30 V52 A2 2 0 0 1 51 54 H13 A2 2 0 0 1 11 52 V30 Z" fill="#fff"/><path d="M22 36 L29 43 L43 28" stroke="#F2621F" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    iconos.set(n, await sharp(Buffer.from(svg)).resize(n, n).png().toBuffer());
  }
  res.type("png").set("Cache-Control", "public, max-age=604800").send(iconos.get(n));
});
// Push
app.get("/api/proveedores/push/clave", (_req, res) => res.json({ clave: push.clavePublica() || null }));
app.post("/api/proveedores/push/suscribir", (req: any, res) => {
  const prov = proveedorAutenticado(req); if (!prov) return res.status(401).json({ error: "Enlace inválido." });
  if (!req.body?.sub?.endpoint) return res.status(400).json({ error: "suscripción inválida" });
  res.json({ ok: true, dispositivos: push.suscribir(prov.id, req.body.sub, req.body.dispositivo) });
});
app.get("/api/proveedores/ofertas", (req: any, res) => {
  const prov = proveedorAutenticado(req); if (!prov) return res.status(401).json({ error: "Enlace inválido. Pide uno nuevo por WhatsApp." });
  const ofertas = despacho.ofertasPara(prov).map((o) => {
    if (o.aceptadoPor !== prov.id || o.tipo !== "trabajo") return o;
    const t = almacen.trabajos().find((x) => x.id === o.referencia);
    return t ? { ...o, trabajo: ciclo.resumenParaPlomero(t) } : o;
  });
  res.json({ proveedor: { id: prov.id, nombre: prov.nombre, tipo: prov.tipo }, ofertas });
});
// Ciclo del trabajo desde la app: voy en camino → llegué → fotos → terminé (cobro al cliente)
app.post("/api/proveedores/trabajo/paso", async (req: any, res) => {
  const prov = proveedorAutenticado(req); if (!prov) return res.status(401).json({ ok: false, motivo: "Enlace inválido." });
  const paso = String(req.body?.paso ?? "") as "en-camino" | "llegue" | "terminado";
  if (!["en-camino", "llegue", "terminado"].includes(paso)) return res.status(400).json({ ok: false, motivo: "Paso inválido." });
  res.json(await ciclo.avanzar(String(req.body?.oferta ?? ""), prov, paso, { mano_obra: req.body?.mano_obra, materiales: req.body?.materiales, nota: req.body?.nota }));
});
app.post("/api/proveedores/trabajo/foto", async (req: any, res) => {
  const prov = proveedorAutenticado(req); if (!prov) return res.status(401).json({ ok: false, motivo: "Enlace inválido." });
  const tipo = req.body?.tipo === "antes" ? "antes" : "despues";
  try { res.json(await ciclo.guardarFoto(String(req.body?.oferta ?? ""), prov, tipo, String(req.body?.imagen ?? ""))); } catch (e) { res.json({ ok: false, motivo: "No pude guardar la foto." }); }
});
app.get("/api/proveedores/cuenta", (req: any, res) => {
  const prov = proveedorAutenticado(req); if (!prov) return res.status(401).json({ error: "Enlace inválido." });
  res.json(ciclo.cuentaSemanal(prov));
});
// Página de pago del cliente (mientras no haya Stripe: ATH Móvil + total)
app.get("/pagar/:id", (req, res) => {
  const t = almacen.trabajos().find((x) => x.id === req.params.id);
  if (!t || t.totalCliente == null) return res.status(404).type("html").send("<p style='font-family:sans-serif;padding:24px'>No encuentro ese trabajo. Escríbenos por WhatsApp al 939-247-9234.</p>");
  res.type("html").send(pagarHTML(t, config.cobros.athMovil));
});
app.post("/api/proveedores/aceptar", async (req: any, res) => {
  const prov = proveedorAutenticado(req); if (!prov) return res.status(401).json({ ok: false, motivo: "Enlace inválido." });
  res.json(await despacho.aceptar(String(req.body?.oferta ?? ""), prov.id));
});
// DocuSign Connect → contrato firmado
app.post("/webhook/docusign", (req, res) => { const w = leerWebhookDocusign(req.body); if (w.envelopeId && w.completado) despacho.marcarFirmado(w.envelopeId); res.sendStatus(200); });

// ── Admin de despacho ──
// ── Panel de plomeros (alta, links, estado) ──
app.get("/admin/plomeros", (_req, res) => res.type("html").send(panelPlomerosHTML(registroPlomeros().map((p) => ({ ...p, link: linkPortal(p.id, config.urlPublica) })), despacho.ofertas().slice(-40).reverse(), almacen.trabajos().slice(-40).reverse())));
app.post("/admin/plomeros", async (req: any, res) => {
  const b = req.body ?? {};
  if (!b.nombre || !b.whatsapp || !b.municipio) return res.status(400).json({ ok: false, motivo: "Faltan nombre, WhatsApp o municipio." });
  const p = altaPlomero({ nombre: String(b.nombre).trim(), whatsapp: String(b.whatsapp), municipio: String(b.municipio).trim(), licencia: b.licencia ? String(b.licencia).trim() : undefined, email: b.email ? String(b.email).trim() : undefined });
  const link = linkPortal(p.id, config.urlPublica);
  if (!p.territorios.length) await wa.avisarCoordinador(`⚠️ ${p.nombre} dado de alta pero "${p.municipio}" no cae en ningún territorio: no recibirá trabajos hasta asignarle uno.`).catch(() => undefined);
  const enviado = await wa.enviarTexto(p.whatsapp, bienvenidaPlomero(p.nombre, link)).then(() => true).catch(() => false);
  await wa.avisarCoordinador(`🔧 Alta de plomero: ${p.nombre} · ${p.municipio} (${p.territorios.join(", ") || "sin territorio"})${p.licencia ? " · " + p.licencia : ""}
Link de su app: ${link}
Bienvenida por WhatsApp: ${enviado ? "enviada" : "NO se pudo (mándale el link a mano)"}`).catch(() => undefined);
  res.json({ ok: true, plomero: p, link, bienvenidaEnviada: enviado });
});
app.post("/admin/plomeros/:id/estado", (req: any, res) => {
  const e = String(req.body?.estado ?? "") as any; if (!["activo", "pausado", "pendiente"].includes(e)) return res.status(400).json({ ok: false });
  res.json({ ok: !!cambiarEstadoPlomero(req.params.id, e) });
});
app.post("/admin/plomeros/:id/reenviar", async (req: any, res) => {
  const p = registroPlomeros().find((x) => x.id === req.params.id); if (!p) return res.status(404).json({ ok: false });
  const link = linkPortal(p.id, config.urlPublica);
  const ok = await wa.enviarTexto(p.whatsapp, bienvenidaPlomero(p.nombre, link)).then(() => true).catch(() => false);
  res.json({ ok, link });
});
app.get("/admin/fotos/:archivo", (req, res) => { const f = path.join(ciclo.DIR_FOTOS, path.basename(req.params.archivo)); if (!fs.existsSync(f)) return res.status(404).end(); res.type("jpg").send(fs.readFileSync(f)); });
app.post("/admin/trabajos/:id/marcar", (req: any, res) => {
  const t = almacen.trabajos().find((x) => x.id === req.params.id); if (!t) return res.status(404).json({ ok: false });
  const que = String(req.body?.que ?? "");
  if (que === "cobrado") almacen.guardarTrabajo({ ...t, estado: "cobrado" });
  else if (que === "pagado-plomero") almacen.guardarTrabajo({ ...t, pagadoAlPlomero: new Date().toISOString().slice(0, 10) });
  else return res.status(400).json({ ok: false });
  res.json({ ok: true });
});
function bienvenidaPlomero(nombre: string, link: string) {
  return `¡Bienvenido a Resuelto, ${nombre.split(" ")[0]}! 🔧\n\nEsta es tu app para recibir trabajos:\n${link}\n\n1️⃣ Ábrela y añádela a tu pantalla de inicio.\n2️⃣ Toca "Activar alertas" para que te avise al celular.\n3️⃣ Cuando salga un trabajo en tu zona te llega la alerta: el primero que acepta se lo lleva.\n4️⃣ En cada trabajo: "Voy en camino" → "Llegué" → fotos del antes y el después → "Terminé". Resuelto le cobra al cliente y tú cobras el viernes (65 % de la mano de obra + materiales con 10 %).\n\nGuarda este mensaje: ese link es tu llave. Cualquier duda, escríbenos por aquí.`;
}
app.get("/admin/ofertas", (_req, res) => res.json({ ofertas: despacho.ofertas().slice(-100).reverse(), proveedores: listarProveedores() }));
app.get("/admin/cotizadores", (_req, res) => res.json({ cotizadores: (JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "cotizadores.json"), "utf8")) as any).cotizadores.map((c: any) => ({ ...c, link: linkCotizador(c.id) })) }));
app.post("/admin/ofertas/:id/asignar", async (req, res) => { res.json(await despacho.aceptar(req.params.id, String(req.body?.proveedorId ?? ""), true)); });
// Cierre de un PROYECTO (contrato del cliente firmado + depósito) → oferta a contratistas. Lo llamará la app del cotizador.
app.post("/admin/proyectos/:id/cerrar", async (req, res) => {
  const p = almacen.proyectos().find((x) => x.id === req.params.id); if (!p) return res.status(404).json({ error: "no existe" });
  const { precio, pagoContratista, hitos, resumen, inicio } = req.body ?? {};
  if (!(pagoContratista > 0)) return res.status(400).json({ error: "pagoContratista requerido" });
  const cat = categoriasProyectos().find((c) => c.id === p.categoriaId);
  almacen.guardarProyecto({ ...p, estado: "cerrado", precio: Number(precio) || p.precio, costoTotal: Number(pagoContratista) });
  const o = await despacho.crearOferta({ tipo: "proyecto", referencia: p.id, categoria: p.categoriaId, categoriaNombre: cat?.nombre ?? p.categoriaId, territorio: p.territorio, municipio: p.municipio, resumen: resumen || p.descripcion, pagoProveedor: Number(pagoContratista), hitos, inicio });
  res.json({ ok: true, oferta: o });
});
function categoriasProyectos(): { id: string; nombre: string }[] { return (JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "categorias-proyectos.json"), "utf8")) as any).categorias; }

// ── Widget ──
app.get("/widget.js", (_req, res) => { res.type("application/javascript"); res.send(fs.readFileSync(path.join(RAIZ, "widget", "resuelto-chat.js"), "utf8").replace("__API__", config.urlPublica)); });

despacho.reanudarTimers();
setInterval(() => encuestas.revisarPendientes().catch(console.error), 30 * 60_000);
nina.arrancarReloj(); // encuestas post-visita cada 30 min
app.listen(config.port, () => console.log(`Resuelto agente escuchando en :${config.port} · modelo ${config.modelo}`));
