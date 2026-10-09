import assert from "node:assert/strict";
import { test } from "node:test";

import { extensionAdjunto, fechaTimelines, leerTimelines, seGuardaAdjunto, tipoAdjunto } from "../lib/leads/reglas.ts";

// Aviso real de Timelines (9/oct): un audio sin texto. Antes se descartaba como "vacío".
const audio = {
  chat: { phone: "19392322256", chat_id: 47199028, is_group: false, full_name: "Jesús Nieves" },
  message: {
    text: "",
    sender: { phone: "+19392322256", full_name: "Jesús Nieves" },
    direction: "received",
    recipient: { phone: "+17874092812", full_name: "Level Up Media" },
    timestamp: "2026-10-09 05:46:04 -0400",
    attachments: [{ size: 39581, filename: "attachment.ogg", mimetype: "audio/ogg", temporary_download_url: "https://tl-prod-data.s3.amazonaws.com/att/x/attachment.ogg?X-Amz-Expires=900" }],
    message_uid: "bf3d114e-1b13-42b5-9545-c71d312cf35b",
  },
  event_type: "message:received:new",
  whatsapp_account: { phone: "+17874092812" },
};

test("un audio sin texto ya no es un mensaje vacío", () => {
  const ev = leerTimelines(audio);
  assert.equal(ev.texto, "🎤 Audio");
  assert.equal(ev.adjuntos.length, 1);
  assert.equal(ev.adjuntos[0].mime, "audio/ogg");
  assert.equal(ev.adjuntos[0].bytes, 39581);
  assert.match(ev.adjuntos[0].url, /^https:\/\/tl-prod-data/);
  assert.equal(ev.fecha, "2026-10-09T09:46:04.000Z");
});

test("si el mensaje trae texto, se respeta", () => {
  const ev = leerTimelines({ ...audio, message: { ...audio.message, text: "Mira esto", attachments: [{ mimetype: "image/jpeg", filename: "a.jpg", size: 10 }] } });
  assert.equal(ev.texto, "Mira esto");
  assert.equal(tipoAdjunto(ev.adjuntos[0].mime), "imagen");
});

test("qué se guarda en Storage: audio, foto y documento; video no", () => {
  assert.equal(seGuardaAdjunto({ mime: "audio/ogg", bytes: 400_000 }), true);
  assert.equal(seGuardaAdjunto({ mime: "image/jpeg", bytes: 700_000 }), true);
  assert.equal(seGuardaAdjunto({ mime: "application/pdf", bytes: 2_000_000 }), true);
  assert.equal(seGuardaAdjunto({ mime: "video/mp4", bytes: 7_000_000 }), false);
  assert.equal(seGuardaAdjunto({ mime: "audio/mpeg", bytes: 40_000_000 }), false);
});

test("extensión y fecha", () => {
  assert.equal(extensionAdjunto({ mime: "audio/ogg; codecs=opus", nombre: "attachment.ogg" }), "ogg");
  assert.equal(extensionAdjunto({ mime: "application/x-raro", nombre: "Contrato.DOCX" }), "docx");
  assert.equal(fechaTimelines("basura"), null);
});

test("formato de la API: un solo attachment_url", () => {
  const ev = leerTimelines({ message: { uid: "u1", text: "", from_me: true, attachment_url: "https://x/a.jpg", attachment_filename: "attachment.jpg" }, chat: { phone: "17875550000" } });
  assert.equal(ev.adjuntos[0].mime, "image/jpeg");
  assert.equal(ev.texto, "📷 Foto");
});

import { decisionVigia, problemaTimelines } from "../lib/leads/reglas.ts";

const sano = {
  apiStatus: 200,
  cuentas: [{ phone: "+19393040491", status: "active" }],
  webhooks: [
    { event_type: "message:received:new", enabled: true, url: "https://x/api/leads/timelines?marca=ai-borinquen&s=1" },
    { event_type: "message:sent:new", enabled: true, url: "https://x/api/leads/timelines?marca=ai-borinquen&s=1" },
  ],
  slug: "ai-borinquen",
  horasSilencio: 0.5,
};

test("vigía: lo del 6/oct (plan sin API) es alerta; todo bien no", () => {
  assert.equal(problemaTimelines(sano), null);
  assert.equal(problemaTimelines({ ...sano, apiStatus: 403 }).clave, "plan");
  assert.equal(problemaTimelines({ ...sano, apiStatus: 401 }).clave, "token");
  assert.equal(problemaTimelines({ ...sano, cuentas: [{ phone: "+1939", status: "disconnected" }] }).clave, "desconectado:+1939");
  assert.equal(problemaTimelines({ ...sano, webhooks: sano.webhooks.slice(0, 1) }).clave, "webhooks");
  assert.equal(problemaTimelines({ ...sano, horasSilencio: 3.5 }).clave, "silencio");
  // Si Timelines no contesta (red), no se inventa un problema: solo cuenta el silencio.
  assert.equal(problemaTimelines({ ...sano, apiStatus: 0 }), null);
});

test("vigía: avisa una vez, no repite, y avisa cuando vuelve", () => {
  const plan = { clave: "plan" };
  assert.equal(decisionVigia(null, plan, true), "alertar");
  assert.equal(decisionVigia("alerta:plan", plan, true), null);
  assert.equal(decisionVigia("alerta:plan", null, true), "recuperado");
  assert.equal(decisionVigia("ok", null, true), null);
  // El silencio de noche no alarma; si ya había alarmado, tampoco se repite.
  assert.equal(decisionVigia("ok", { clave: "silencio" }, false), null);
  assert.equal(decisionVigia("ok", { clave: "silencio" }, true), "alertar");
  assert.equal(decisionVigia("alerta:silencio", { clave: "plan" }, false), "alertar");
});
