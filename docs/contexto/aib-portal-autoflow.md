## El Portal AutoFlow y la reestructuración de ventas de AIB (21/sep/2026)

Diagnóstico aprobado por Elvin (ventas $15-20K → $4K/mes): no es producto, es demostración +
confianza + fugas antes del closer (no-show 50 %, 2,444 chats sin leer, pre-call sin montar, cero
medición). Plan completo en `~/.claude/plans/ahora-mismo-necesito-una-breezy-gadget.md`. Decisiones:
"Alexis Pérez" = nombre de Elvin para AIB (firma textos, no da la cara; caras = creadores UGC
Yulianna/Ed/Luisa) · Juan David sigue de closer y abre con video PR + testimonios · pauta a ~$75/día ·
WhatsApp del pre-call por **Dragon Chat** (Liz) · precios: ver `PRECIOS` en `demo.mjs` y
`vault/estilo/decisiones-negocio.md` (chat $1,500+$147 · voz $2,500+$297 · completo $3,500+$497 ·
Academia AIB $2,500 · 1:1 $4,000/4 meses).

- **Portal AutoFlow** (`app/portal/[slug]`, `app/borinquen/portales`, `lib/portal/`): el dashboard vivo
  que el closer abre en la llamada y el prospecto/cliente toca. Tabs: Tus agentes (chat/voz, llamada
  embebida con el SDK de Retell) · Llamadas (REALES, transcritas, con grabación) · CRM del negocio del
  cliente (5 etapas fijas, ejemplos marcados + leads reales de chat/voz) · Solicitudes de cambio
  (recibida → en progreso → lista; avisa por `notificarCEO`) · Métricas (solo lo real, "—" si no hay).
  Postgres de Pulse, tablas `autoflow_*` (`lib/portal/schema.ts`, migración `drizzle/0004_autoflow_portal.sql`).
- **Acceso**: `/portal/<slug>?k=<token>`, token = HMAC(`AUTOFLOW_PORTAL_SECRET`, "portal:"+slug) que
  `proxy.ts` valida sin DB y convierte en cookie `autoflow-portal` (30 días). La fábrica calcula el mismo
  token (`tokenPortal` en `demo.mjs`) para ponerlo en propuesta/deck/nota. Si cambia el secreto, se
  reenvían los links. Closer entra con cookie CEO. Revocar = "Desactivar" en `/borinquen/portales/<slug>`.
- **Llamadas reales**: `/api/demo-webcall` acepta `slug`, manda `metadata.slug` y registra la llamada
  (`iniciada`); `/api/retell-webhook?s=RETELL_WEBHOOK_SECRET` (call_started/ended/analyzed) re-lee
  `GET /v2/get-call` y guarda transcripción + lead (`post_call_analysis_data`: nombre, teléfono, interés,
  quiere_cita); cron `/api/cron/autoflow-llamadas` cada 15 min como red. `demo.mjs portal <slug>` (y `todo`)
  registran el portal por `/api/autoflow/portales` (CRON_SECRET) y dejan el agente con webhook (PATCH
  update-agent). Mapeo puro y testeado: `lib/portal/mapear-llamada.ts` (`tests/portal.test.mjs`).
- **Chat de demo** (`chat.html`) avisa cada mensaje/lead a `/api/demo-lead` (público, rate limit) →
  leads reales en el CRM del portal. `sistema.html` ya no inventa "10 s" ni "0 sin responder".
- **Deck** (`demo.mjs deck <slug> [--via capacitacion]`): 12 slides con apertura PR (quiénes somos ·
  visión · a quién hemos ayudado: solo Teo/Mano Santa y Milton/Caribe Paint, los únicos verificados) y
  precios de `PRECIOS`; la vía B arma el deck de la Academia AIB.
- **Pre-call**: secuencia WhatsApp para Dragon Chat en `vault/proyectos/ecosistema/pre-llamada-whatsapp-aib.md`
  (T0 · video del creador · Conócenos · portal a las 24 h · casos · 1 h antes · no-show · post); página
  **Conócenos** en `demos/ai-borinquen-conocenos/` (subir a Netlify; reemplazar el div `.video` por el iframe
  del video de 90 s cuando exista). Los emails hermanos siguen en `emails/ai-borinquen/` (ActiveCampaign).
- Env nuevos: `AUTOFLOW_PORTAL_SECRET`, `RETELL_WEBHOOK_SECRET`, `CONTENT_OS_URL` (ver `.env.example`);
  los mismos valores en Vercel. Sin `AUTOFLOW_PORTAL_SECRET` la página de portales lo avisa.
