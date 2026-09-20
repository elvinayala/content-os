---
fecha: 2026-09-19
fuente: manual
unidad: ecosistema
tags: [telegram, botfather, setup, railway, puente]
estado: guía para Elvin · el puente ya corre en Railway (proyecto puente-telegram, servicio puente)
---

# Crear el bot en BotFather y conectarlo (5 minutos, desde el celular)

## A. Crear el bot (en Telegram)
1. Abre Telegram y busca **@BotFather** (el oficial tiene la palomita azul).
2. Escríbele `/newbot`.
3. Te pide el **nombre** (lo que ves en la lista de chats): escribe `Sofi · Command Center`.
4. Te pide el **usuario** (termina en `bot`, sin espacios): escribe `iamarket_sofi_bot`
   (si dice que está tomado, prueba `sofi_iamarket_bot` o `elvin_agentes_bot`).
5. BotFather responde "Done!" y te da el **token**: una línea como
   `8123456789:AAH...` — **cópialo** (Telegram tiene botón de copiar al tocarlo).
6. Opcional, para que se vea bien: `/setuserpic` (sube el ícono del coquí o tu logo) y
   `/setdescription` → "Tu equipo de agentes: Sofi, Jarvis y el Content OS."

## B. Pegar el token en Railway (desde el celular o la Mac)
1. Entra a railway.com → proyecto **puente-telegram** → servicio **puente** → pestaña
   **Variables**.
2. `TELEGRAM_BOT_TOKEN` = el token que copiaste. Guarda. Railway reinicia el servicio solo
   (~1 minuto).
   *(Si prefieres desde la Mac: `npx @railway/cli variables --set TELEGRAM_BOT_TOKEN=<token>`)*

## C. Conectar tu chat
1. En Telegram, abre tu bot (búscalo por el usuario que le pusiste) y escríbele **/start**.
2. Te contesta: "Tu chat id es 123456789. Ponlo en TELEGRAM_CEO_CHAT_ID…".
3. En Railway → Variables: `TELEGRAM_CEO_CHAT_ID` = ese número. Guarda.
4. Vuelve a escribirle **/estado**. Si te responde con tus pendientes, ya tienes el control
   desde el celular.

## D. Dos variables más que solo tú tienes
- `VERCEL_TOKEN` (para que lo que cambies desde el celular se suba a producción y lo vea la
  Mac): vercel.com → Settings → Tokens → Create → pégalo en Railway como `VERCEL_TOKEN`.
- `ACTIVECAMPAIGN_URL` / `ACTIVECAMPAIGN_KEY` cuando enciendas el email (ver el README del
  ecosistema).

## E. Cómo se usa
- Texto normal = le pides cualquier cosa al Content OS ("genera los MVPs de las citas de
  mañana", "dame el estado de Bori", "agrega a la Dra. Kasey como confirmada").
- `/sofi …` = hablar con Sofi (producción). `/jarvis …` = métricas y operaciones.
- `/estado` = qué te toca hoy. `/nuevo` = empezar de cero. `/ayuda` = la lista.
- Todo queda espejado en tu DM de Slack como `[Telegram] …`.
- Modo de permisos: `PUENTE_MODO=seguro` (edita el repo y corre sus scripts). Si quieres
  darle todo: `PUENTE_MODO=total` en Railway.

## F. Qué NO puede hacer desde Railway (y sí desde la Mac)
Lo que dependa de las herramientas de la app de escritorio (leer Slack con el MCP, Granola,
el navegador). Todo lo que va por tokens y scripts del repo (Slack por bot, Pipedrive,
Retell, Netlify, Vercel, ActiveCampaign, la Fábrica de MVPs) sí funciona.

## Si algo falla
- Railway → servicio puente → **Logs**: debe decir "Puente Telegram arrancó. En Railway."
- Si dice "Esperando TELEGRAM_BOT_TOKEN", falta el paso B.
- Si el bot no contesta, revisa que el chat id sea el tuyo (paso C).
- El puente de la Mac (`launchctl`) hay que apagarlo para que no compitan por los mensajes:
  `launchctl unload ~/Library/LaunchAgents/com.iamarket.telegram-puente.plist`
