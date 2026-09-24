---
name: nico-vibecoder
description: "Nico = el agente vibecoder de Elvin (socio técnico de Sofi) con control total de todas sus plataformas, reporte diario 7 AM por Telegram, bot propio en la Mac"
metadata: 
  node_type: memory
  type: project
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
  modified: 2026-09-23T21:14:00.259Z
---

Creado el 19/sep/2026 por pedido de Elvin: "un agente socio de Sofi pero que sea mi
vibecoder, para cuando esté afuera y necesite ajustes… control total de mis plataformas…
reporte diario muy sencillo de bugs, casos abiertos y ajustes… conectado a mi Telegram".

- Reparto: **Sofi = contenido/producción · Nico = código/plataformas.** Los dos le reportan
  solo a Elvin. Nico nunca le escribe a clientes, equipo ni Heidy.
- Inventario `data/plataformas.json` · cerebro `vault/ceo/cerebro-nico.md` · ronda
  `/ronda-nico` (tarea `nico-ronda-diaria`, 7:00 AM) · `scripts/nico-ronda.mjs` ·
  bitácora `data/nico-bitacora.json` · reporte `data/nico-reporte.json`.
- Telegram: bot APARTE (`TELEGRAM_BOT_TOKEN_NICO`), `PUENTE_BOT=nico` en
  `scripts/telegram-puente.mjs`, corre en la Mac (launchd `com.iamarket.nico-puente`)
  porque los repos de Bori/Plagas/Cortex están en la Mac, no en Railway.
- ⚠️ `TELEGRAM_BOT_TOKEN` está VACÍO en `.env.local` de la Mac (solo vive en Railway): desde la
  Mac nada llega a Telegram hasta que Elvin ponga el token de Nico. El espejo a Slack sí llega.
- Pendientes de Elvin para que quede 100%: crear el bot en @BotFather → `TELEGRAM_BOT_TOKEN_NICO`;
  `launchctl load ~/Library/LaunchAgents/com.iamarket.nico-puente.plist` (copiar el plist);
  opcional `BORI_OPERADOR_TOKEN` y `PLAGAS_OPERADOR_TOKEN` para leer fallos/soporte.

**20/sep/2026 — ya montado:** el bot de Telegram existe (@Nico_VibeCoder_AIBOT, `TELEGRAM_BOT_TOKEN_NICO`
en .env.local) y el puente corre en la Mac (`com.iamarket.nico-puente` cargado en launchd).
Los fallos de Bori se leen por `GET /api/fallos-abiertos` con `BORI_METRICS_TOKEN` (el panel
Equipo → Fallos necesita sesión de dueño); el soporte de Plagas con `PLAGAS_OPERADOR_TOKEN`
(= `OPERADOR_TOKEN` del servicio app en Railway). El Slack del bot NO puede leer el DM de
Elvin (falta el scope `im:history`): los `[para Nico]` de Sofi hay que verlos de otra forma.

**How to apply:** si Elvin pide un ajuste técnico "para Nico", seguir el cerebro (leer
CLAUDE.md del repo → cambio chico → test → deploy → verificar → anotar en la bitácora).
Relacionado: [[sofi-coordinadora]], [[bori-backend-real]], [[plagas-puerto-rico]], [[ai-video-editor]].

**Nube (20/sep/2026):** Nico corre en Railway (servicio `nico`, proyecto `puente-telegram`,
`Dockerfile.nico` + `scripts/nico-nube.sh`, volumen `/estado`), independiente de la Mac. GitHub es la
fuente de verdad: `elvinayala/{content-os,bori,plagas-puerto-rico,cortex}` (campo `github` en
`data/plataformas.json`), clonados en `/estado/repos/<id>`; pull antes de cada pedido, commit+push
después. **La Mac es una copia: `git pull` antes de tocar esos repos.** Falta de Elvin (pedido 20/sep):
`GH_TOKEN` (fine-grained, Contents RW en los 4 repos) → `railway variables --service nico --set`;
hasta entonces el contenedor espera sin pollear y el plist de la Mac sigue activo. El `VERCEL_TOKEN`
de Railway (`vcp_…`) devuelve "User not found": los deploys de data desde Railway (Sofi y Nico)
fallan hasta que Elvin genere uno nuevo en vercel.com/account/tokens. Puente con vigía: 6 fallos de
red seguidos → sale y launchd/Railway lo reinician; node con `--dns-result-order=ipv4first`.

**23/sep/2026 — enlace con Carilin y Aure (con OK de Elvin):** ellas le escriben al bot de Slack
empezando con "Nico…" → buzón de Nico → diagnóstico en SOLO LECTURA → Elvin recibe el plan por el
Telegram de Nico → `ok <id>` / `no <id>` (o `nico ok <id>` en Slack) → recién ahí ejecuta y les
avisa. Regla dura de Elvin: nada de lo que pida el equipo se toca sin su OK. Inventario ampliado a
21 plataformas (Pulse, GoHighLevel, Ángelo/Quality Care, voz/SaaS/Core AIB, dashboard de ventas,
Hora Fija = dinero real → solo diagnóstico, 1000X). Ver [[agentes-se-hablan]].

**23/sep/2026 (tarde) — Nico YA NO depende de la Mac:** corre en Railway con llave SSH propia
(`~/.ssh/nico_railway`, pública agregada a la cuenta GitHub elvinayala; privada en `GIT_SSH_KEY_B64`).
Cortex → `elvinayala/cortex` y Plagas → `elvinayala/plagas-puerto-rico` ya en GitHub (la Mac ahora
tiene remote: `git pull` antes de tocarlos). Bug que impedía clonar: ssh ignora `$HOME` y buscaba
la llave en /root/.ssh → `GIT_SSH_COMMAND` en `scripts/nico-nube.sh`. launchd de la Mac DESCARGADO
(dos puentes con el mismo bot = "Conflict" en getUpdates). Railway también tiene DATABASE_URL/Supabase,
N8N_*, PLAGAS_OPERADOR_TOKEN, BORI_METRICS_TOKEN, RAILWAY_API_TOKEN y un VERCEL_TOKEN (dudoso: Elvin
pudo pegar otro valor). Sin GitHub todavía: Ángelo, voz, SaaS, Victory, Hora Fija, 1000X, Ventaja.
Deploy de Content OS desde la Mac: `npx vercel --prod --yes --scope elvin-7614s-projects`.

**23/sep/2026 (noche) — super vibecoder:** corre como usuario `nico` (no root: Claude Code rechaza
el modo total como root), modelo **Opus 5.5** por defecto (`/fable /sonnet /opus /haiku` lo fuerzan),
trabajos de hasta 4 h con aviso a Elvin cada ~12 min y `para` para detenerlo; autoridad total en lo
que pide Elvin, consulta antes de gastar dinero. Fábrica `/autoflow` (plantilla Ángelo + SOP v2).
Canal propio **#nico-desarrollo** (C0C43J731AQ) con Carilin y Aure; Carilin ya lo usó (#13 Pulse
automatizaciones). VERCEL_TOKEN nuevo sin vencimiento en nico/puente/lola/max (Nico verificó 200);
deploy-snapshots.sh ahora lleva `--scope`. 1000X en GitHub (`elvinayala/1000x-fuente`). Falta de
Elvin: repo `autoflow-quality-care`, GHL_AGENCY_TOKEN, CLOUDFLARE_API_TOKEN + ACCOUNT_ID.
