#!/usr/bin/env node
// Telegram = canal directo de Elvin con Sofi. Este script lo conecta en 3 comandos.
//
//   node scripts/telegram-bot.mjs quien     # muestra el chat id de quien le escribió al bot
//   node scripts/telegram-bot.mjs setup     # registra el webhook en Vercel con el secreto
//   node scripts/telegram-bot.mjs test      # le manda un mensaje de prueba a Elvin
//   node scripts/telegram-bot.mjs info      # estado del webhook
//   node scripts/telegram-bot.mjs enviar "<texto>"   # lo usan las tareas (Sofi, board meeting)
//
// Lee TELEGRAM_BOT_TOKEN / TELEGRAM_CEO_CHAT_ID / TELEGRAM_WEBHOOK_SECRET de .env.local.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PROD = process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app";
function env(n) {
  if (process.env[n]) return process.env[n].trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").match(new RegExp(`^${n}[ \t]*=[ \t]*([^\n]+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
// PUENTE_BOT=max → manda como Max (TELEGRAM_BOT_TOKEN_MAX); lo usan los reportes del media buyer.
const BOT_ENVIA = (process.env.PUENTE_BOT || "").toLowerCase();
const TOKEN = BOT_ENVIA === "max" ? env("TELEGRAM_BOT_TOKEN_MAX") || env("TELEGRAM_BOT_TOKEN") : BOT_ENVIA === "lola" ? env("TELEGRAM_BOT_TOKEN_LOLA") || env("TELEGRAM_BOT_TOKEN") : env("TELEGRAM_BOT_TOKEN");
if (!TOKEN) { console.error("❌ Falta TELEGRAM_BOT_TOKEN en .env.local (créalo con @BotFather → /newbot)"); process.exit(1); }
const api = async (m, body) => {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const j = await r.json(); if (!j.ok) throw new Error(`${m}: ${j.description}`); return j.result;
};
const html = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/:([a-z0-9_+-]+):/g, "").replace(/\*([^*\n]+)\*/g, "<b>$1</b>").trim();

const cmd = process.argv[2];
try {
  if (cmd === "quien") {
    // Solo funciona ANTES de registrar el webhook (getUpdates y webhook son excluyentes).
    await api("deleteWebhook", { drop_pending_updates: false }).catch(() => {});
    const ups = await api("getUpdates", { limit: 20 });
    const chats = new Map();
    for (const u of ups) { const c = u.message?.chat; if (c) chats.set(c.id, c); }
    if (!chats.size) { console.log("Nadie le ha escrito al bot todavía. Ábrelo en Telegram, dale /start y vuelve a correr esto."); }
    for (const c of chats.values()) console.log(`chat id: ${c.id}  (${c.first_name || ""} @${c.username || ""} · ${c.type})  → TELEGRAM_CEO_CHAT_ID=${c.id}`);
    console.log("\nDespués corre: node scripts/telegram-bot.mjs setup");
  } else if (cmd === "setup") {
    const secret = env("TELEGRAM_WEBHOOK_SECRET");
    if (!secret) { console.error("❌ Falta TELEGRAM_WEBHOOK_SECRET en .env.local (cualquier string largo, p. ej. `openssl rand -hex 24`)"); process.exit(1); }
    const url = `${PROD}/api/telegram`;
    await api("setWebhook", { url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
    await api("setMyCommands", { commands: [{ command: "start", description: "Conectar con Sofi" }, { command: "estado", description: "Qué falta hoy" }] });
    console.log(`✓ Webhook registrado: ${url}\n  Recuerda poner TELEGRAM_BOT_TOKEN, TELEGRAM_CEO_CHAT_ID y TELEGRAM_WEBHOOK_SECRET también en Vercel (Production) y redeployar.`);
  } else if (cmd === "info") {
    console.log(JSON.stringify(await api("getWebhookInfo"), null, 2));
  } else if (cmd === "test" || cmd === "enviar") {
    const chat = env("TELEGRAM_CEO_CHAT_ID");
    if (!chat) { console.error("❌ Falta TELEGRAM_CEO_CHAT_ID (corre `quien` primero)"); process.exit(1); }
    const texto = cmd === "test" ? "Prueba: si lees esto, Sofi ya te puede escribir por Telegram. — Sofi" : (process.argv.slice(3).join(" ") || "");
    if (!texto) { console.error("❌ Falta el texto"); process.exit(1); }
    for (const parte of texto.match(/[\s\S]{1,3900}(?=\n\n|$)/g) || [texto]) {
      await api("sendMessage", { chat_id: chat, text: html(parte), parse_mode: "HTML", disable_web_page_preview: true });
    }
    console.log("✓ enviado");
  } else {
    console.log("Uso: node scripts/telegram-bot.mjs quien | setup | test | info | enviar \"<texto>\"");
  }
} catch (e) { console.error("❌", e.message); process.exit(1); }
