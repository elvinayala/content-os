## Nico — el vibecoder (socio técnico de Sofi, 19/sep/2026)

Agente de guardia de **todas** las plataformas de Elvin (Bori/heybori.ai, Plagas, Cortex,
Resuelto, voz Retell, quiz funnels, Content OS…). Inventario en `data/plataformas.json`
(repo, prod, salud, deploy, logs, trampas) — un proyecto nuevo se agrega ahí y Nico ya lo ve.
Cerebro: `vault/ceo/cerebro-nico.md` (criterio + lo prohibido sin OK: datos, cobros, prompts
de voz en prod, secretos, escribirle a terceros). **Ronda diaria** `/ronda-nico` (tarea
`nico-ronda-diaria`, 7:00 AM): `scripts/nico-ronda.mjs --guardar` junta salud HTTP, logs de
Railway, fallos de Bori, soporte de Plagas, `git log` 24 h y `data/nico-bitacora.json`; el
reporte (~12 líneas) sale con `nico-ronda.mjs enviar` → Telegram + espejo Slack, y queda en
`data/nico-reporte.json`. **Telegram propio**: `PUENTE_BOT=nico node scripts/telegram-puente.mjs`
(token `TELEGRAM_BOT_TOKEN_NICO`, modo total, `--add-dir` con todos los repos). Comandos:
`/ronda`, `/plataformas`, `/nuevo`. Tokens opcionales para leer casos: `BORI_OPERADOR_TOKEN`,
`PLAGAS_OPERADOR_TOKEN`.

**Nico vive en Railway (desde el 20/sep/2026)** — servicio `nico` del proyecto `puente-telegram`,
`Dockerfile.nico` + `scripts/nico-nube.sh`, volumen `/estado`. **GitHub es la fuente de verdad**:
cada plataforma con campo `github` en `data/plataformas.json` (content-os, bori, plagas, cortex) se
clona en `/estado/repos/<id>`; el puente corre desde el clon de content-os, hace `git pull` antes de
cada pedido y `commit + push` después (`gitBajar`/`gitSubir` en el puente). Auth por `GH_TOKEN`
(fine-grained, Contents RW) o `GIT_SSH_KEY_B64`. Sin el clon de content-os el contenedor espera
(no pollea) para no competir con la Mac. **La Mac es una copia**: `git pull` antes de trabajar en
cualquiera de esos 4 repos (`deploy-snapshots.sh` ya lo hace); commitear y subir al terminar.
Variables compartidas con `puente` por referencia `${{puente.VAR}}`. Deploy:
`npx @railway/cli up --service nico --detach`. El plist de la Mac queda como respaldo, descargado.

**Enlace directo Carilin/Aure → Nico, con OK de Elvin (23/sep/2026)**: canal privado
**#nico-desarrollo** (`SLACK_NICO_CHANNEL_ID`, Elvin + Carilin + Aure + bot; desde el 15/oct también **María del Carmen y
Lis**: Elvin, "que todos le pidan a Nico por un solo lugar"; desde el 24/oct **Yaileen** (RR.HH., U08Q51UFLSH), que Aure pidió dos veces): todo lo que ellas
escriben ahí va a Nico sin prefijo y Nico responde en el hilo; Elvin aprueba ahí con `ok <id>`.
También por DM al bot empezando con "Nico…" (DM o mención): `app/api/slack-eventos` lo manda al
buzón de Nico (`de: carilin|aure`, no pasa por Sofi) y les da acuse con el #id. El puente de Nico
lo diagnostica en **solo lectura** (`SOLO_LECTURA`, sin Edit/Write/deploy), lo deja `esperando-ok`
con el plan y se lo manda a Elvin; **solo ejecuta** con `ok <id>` / `no <id> [nota]` en su
Telegram, `nico ok <id>` en Slack o `node scripts/agentes.mjs aprobar|rechazar <id>`. Al terminar le
avisa a quien lo pidió. `/solicitudes` lista las abiertas; la ronda las pone en "Te toca a ti".
Lista de quién puede pedir: `NICO_EQUIPO` (Vercel) + `EQUIPO_NICO` (puente). Detalle en
`vault/ceo/cerebro-nico.md` §3b. Inventario ampliado (Pulse, GoHighLevel, Ángelo/Quality Care,
voz/SaaS/Core de AIB, dashboard de ventas, Hora Fija, 1000X) en `data/plataformas.json`.
**Canales de AutoFlow (Elvin, 5/oct/2026): Zernio SIEMPRE** — una sola API para número (compra/porta, PR ~$3/mes),
WhatsApp (número de Zernio registrado por API), DMs/comentarios de IG/FB, SMS y llamadas (número → Retell por SIP
trunk; el cerebro de voz sigue en Retell); llave `AIB_ZERNIO_API_KEY` (cuenta de AIB, nunca la de Resuelto).
**Excepto clientes médicos** (HIPAA: Zernio no ofrece BAA) → Meta oficial dentro de GHL (o GoGHL) + número/voz en
Retell. Detalle en `.claude/commands/autoflow.md` §4.
**Canales por plataforma (3/oct/2026)**, Elvin: "un canal de Slack para los cambios de Bori… cuando yo no esté, que se
ejecute con una aprobación mía, como funciona Nico": `SLACK_NICO_CANALES="C…=bori"` (Vercel) hace que ese canal funcione
igual que #nico-desarrollo (Carilin/Aure piden sin prefijo → Nico diagnostica en solo lectura → Elvin `ok <id>` por
Telegram o en el hilo), pero el pedido llega con `· plataforma bori` y Nico lee esa entrada del inventario y su repo
antes del plan (`plataformaDe`/`lineaPlataforma` en el puente). **Bori = #bori-clientes** (`C0C2YN5199B=bori`): ahí
piden Aure, Carilin, **Lis y Ángela** (`EQUIPO_PLATAFORMA` en slack-eventos; solo en ese canal). Como el canal también es
conversación, las cortesías ("gracias", "ok") no pasan y Nico contesta `NO_ES_PEDIDO` a lo que no es pedido → se cierra
sin avisar a nadie; si es pedido, el acuse en el hilo lo da el puente tras diagnosticar. Las alertas automáticas de
fallos siguen en #bori-clientes-y-bugs-archived.
