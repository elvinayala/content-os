// node --test tests/zernio.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.ZERNIO_WEBHOOK_SECRET = "secreto-de-prueba";
process.env.ZERNIO_ACCOUNT_ID = "acc1";
process.env.ZERNIO_FB_ACCOUNT_ID = "fb1";
process.env.ZERNIO_IG_ACCOUNT_ID = "ig1";
const z = await import("../dist/canales/zernio.js");

const recibido = {
  id: "evt-1", event: "message.received",
  message: { id: "m1", conversationId: "conv1", platform: "whatsapp", platformMessageId: "wamid.1", direction: "incoming", text: "Hola, fregadero tapado en Caguas",
    attachments: [{ type: "image", url: "https://zernio.com/api/v1/whatsapp/media/abc" }],
    sender: { id: "19395550000", name: "Ana", phoneNumber: "+19395550000" }, sentAt: "2026-09-21T12:00:00Z", isRead: false },
  conversation: { id: "conv1", participantId: "19395550000" }, account: { accountId: "acc1", profileId: "p1" },
  metadata: { location: { latitude: 18.2, longitude: -66.0, name: "Casa" } }, timestamp: "2026-09-21T12:00:01Z",
};

test("parsea message.received", () => {
  const [m] = z.parsearWebhook(recibido);
  assert.equal(m.de, "19395550000"); assert.equal(m.nombre, "Ana"); assert.equal(m.id, "wamid.1"); assert.equal(m.conversationId, "conv1");
  assert.equal(m.texto, "Hola, fregadero tapado en Caguas"); assert.deepEqual(m.mediaIds, ["https://zernio.com/api/v1/whatsapp/media/abc"]);
  assert.equal(m.ubicacion.lat, 18.2); assert.equal(m.standby, false);
});
test("ignora otra cuenta, salientes y otros eventos", () => {
  assert.equal(z.parsearWebhook({ ...recibido, account: { accountId: "otra" } }).length, 0);
  assert.equal(z.parsearWebhook({ ...recibido, message: { ...recibido.message, direction: "outgoing" } }).length, 0);
  assert.equal(z.parsearWebhook({ ...recibido, event: "message.delivered" }).length, 0);
  assert.equal(z.parsearWebhook({ ...recibido, metadata: { standby: true } })[0].standby, true);
});
test("detecta cuando un humano contesta desde el inbox o la app", () => {
  const enviado = { event: "message.sent", message: { conversationId: "conv1", sentVia: "human", source: "cloud_api" }, conversation: { participantId: "19395550000" } };
  assert.deepEqual(z.tomaHumana(enviado), { telefono: "19395550000", conversationId: "conv1", canal: "whatsapp" });
  assert.deepEqual(z.tomaHumana({ ...enviado, message: { conversationId: "conv1", sentVia: null, source: "whatsapp_business_app" } }), { telefono: "19395550000", conversationId: "conv1", canal: "whatsapp" });
  assert.equal(z.tomaHumana({ ...enviado, message: { conversationId: "conv1", sentVia: "api", source: "cloud_api" } }), null);
  assert.equal(z.tomaHumana(recibido), null);
  assert.equal(z.tomaHumana({ ...enviado, account: { accountId: "bori" } }), null, "evento de otra cuenta del equipo (Bori)");
  assert.deepEqual(z.tomaHumana({ ...enviado, account: { accountId: "acc1" } }), { telefono: "19395550000", conversationId: "conv1", canal: "whatsapp" });
});
test("firma HMAC-SHA256 hex del cuerpo crudo", () => {
  const raw = Buffer.from(JSON.stringify(recibido));
  const firma = crypto.createHmac("sha256", "secreto-de-prueba").update(raw).digest("hex");
  assert.equal(z.firmaValida(raw, firma), true);
  assert.equal(z.firmaValida(raw, firma.toUpperCase()), true);
  assert.equal(z.firmaValida(raw, "0".repeat(64)), false);
  assert.equal(z.firmaValida(raw, undefined), false);
});

test("partesDeAviso arma los 3 parámetros sin saltos de línea ni vacíos", () => {
  const [t, q, d] = z.partesDeAviso("🔧 Candidato P-001: Benito Rivera (oficial 8842) · Bayamón\n12 años de experiencia\n\nEntrevista: miércoles 1:00pm");
  assert.equal(t, "🔧 Candidato P-001"); assert.equal(q, "Benito Rivera (oficial 8842) · Bayamón");
  assert.equal(d, "12 años de experiencia · Entrevista: miércoles 1:00pm");
  for (const p of [t, q, d]) assert.ok(!/\n/.test(p) && p.trim() && p.length <= 300);
  assert.deepEqual(z.partesDeAviso("Aviso suelto"), ["Aviso suelto", "—", "—"]);
  assert.deepEqual(z.partesDeAviso(""), ["Aviso", "—", "—"]);
  assert.ok(z.partesDeAviso("x: " + "y".repeat(900))[1].length <= 300);
});

test("DMs de Messenger e Instagram de Resuelto entran con su canal; los de otras cuentas no", () => {
  const dm = (accountId) => ({ event: "message.received", account: { accountId }, message: { direction: "incoming", conversationId: "c9", platformMessageId: "m9", text: "Hola, soy plomero", sender: { id: "28082631238105179", name: "Santos" } } });
  const [fb] = z.parsearWebhook(dm("fb1"));
  assert.equal(fb.canal, "messenger"); assert.equal(fb.accountId, "fb1"); assert.equal(fb.de, "28082631238105179"); assert.equal(fb.conversationId, "c9");
  assert.equal(z.parsearWebhook(dm("ig1"))[0].canal, "instagram");
  assert.equal(z.parsearWebhook(dm("acc1"))[0].canal, "whatsapp");
  assert.deepEqual(z.parsearWebhook(dm("bori")), []);
});
