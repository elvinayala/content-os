---
fecha: 2026-09-19
fuente: manual
unidad: ecosistema
tags: [telegram, sofi, comunicacion, setup]
estado: código listo · faltan 3 valores de Elvin (mañana)
---

# Conectar a Sofi por Telegram (10 minutos, mañana)

Decisión de Elvin (18/sep): **todas las comunicaciones de sus agentes van por su Telegram
directo.** Slack queda como espejo/bitácora. Ya está todo por código; faltan 3 valores.

## Lo que hace Elvin (5 pasos)
1. En Telegram abre **@BotFather** → `/newbot` → nombre "Sofi · Command Center" → usuario
   p. ej. `sofi_iamarket_bot`. BotFather devuelve el **token**. (Solo tú creas el bot.)
2. Pega el token en `.env.local`: `TELEGRAM_BOT_TOKEN=...` y un secreto:
   `TELEGRAM_WEBHOOK_SECRET=` (cualquier texto largo).
3. Abre tu bot en Telegram y dale **/start**. Luego en la terminal:
   `node scripts/telegram-bot.mjs quien` → te muestra tu chat id → pégalo en
   `.env.local`: `TELEGRAM_CEO_CHAT_ID=...`
4. Las mismas 3 variables en **Vercel → content-os → Settings → Environment Variables
   (Production)** y redeploy (`npx vercel --prod --yes`).
5. `node scripts/telegram-bot.mjs setup` (registra el webhook) y
   `node scripts/telegram-bot.mjs test` (te llega "Prueba: si lees esto…").

## Paso 6 · el puente de control remoto ("pedirles cualquier cosa desde el celular")
`scripts/telegram-puente.mjs` corre en la Mac y convierte cada mensaje tuyo en trabajo real de
Claude Code en este repo (skills, comandos, memoria, vault, deploy) y te devuelve el resultado.
- Probar a mano: `node scripts/telegram-puente.mjs` (queda corriendo; Ctrl+C para parar).
- Dejarlo siempre encendido (arranca solo al prender la Mac):
  `cp scripts/launchd/com.iamarket.telegram-puente.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.iamarket.telegram-puente.plist`
  Logs: `~/Library/Logs/telegram-puente.log`. Parar: `launchctl unload ~/Library/LaunchAgents/com.iamarket.telegram-puente.plist`.
- Comandos en Telegram: texto normal = Claude en el repo · `/sofi …` · `/jarvis …` · `/estado` · `/nuevo` · `/ayuda`.
- **Modo de permisos** (`PUENTE_MODO` en `.env.local`): `seguro` (default: edita el repo y corre solo
  sus scripts y el deploy) o `total` (sin límites: cualquier comando; solo si tú lo decides).
- Con el puente corriendo, el webhook de Vercel se apaga solo (Telegram permite uno u otro): no
  corras `setup`. Si la Mac está apagada, los mensajes esperan hasta 24 h y se procesan al volver.
  Cada mensaje y respuesta queda espejado en tu DM de Slack como `[Telegram] …`.
- El CLI de Claude Code ya quedó instalado en `~/.npm-global/bin/claude` (usa tu ANTHROPIC_API_KEY).

## Qué pasa después
- **Sofi te escribe por Telegram** (ronda de las 7:30, check-ins, locaciones) y **tú le
  contestas ahí**: el bot responde con el cerebro de Sofi y lo espeja en el DM de Slack con
  el prefijo `[Telegram]`, así la ronda diaria lo lee como bitácora.
- El board meeting de las 5 AM también te llega por Telegram (misma función `notificarCEO`).
- Slack sigue recibiendo copia de todo hasta que digas lo contrario.
- Comandos del bot: `/start` (conectar), `/estado` (qué falta hoy).

## Piezas de código
`lib/telegram.ts` (enviar, formato) · `lib/notificar-ceo.ts` (Telegram + espejo Slack) ·
`app/api/telegram/route.ts` (webhook, valida el secreto, solo tu chat) · `proxy.ts` (ruta
pública) · `scripts/telegram-bot.mjs` (quien/setup/test/enviar) · tareas: la ronda de Sofi y el
board meeting usan `notificarCEO`.
