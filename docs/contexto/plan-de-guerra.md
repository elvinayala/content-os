## El plan de guerra Q4 2026 (portafolio + Fábrica de Demos)

El 18/sep/2026 Elvin aprobó el **plan de guerra** (`vault/ceo/plan-de-guerra-2026Q4.md`, memoria
`plan-de-guerra-q4`): EA Market LLC como holding (Elvin, 28/sep: el nombre es EA Market LLC, no "IA Market") con 2 motores (Level Up, AIB), 3 productos (Bori,
Cortex, Shadow), 1 piloto (Resuelto, compuerta 15/nov) y 5 congelados con trigger (Quilla,
Contigo PR, Staff Agency, 1000X, Ventaja). **Regla: ninguna empresa nueva hasta el 12/dic**; las
ideas van a `vault/ideas/`.

- **Portafolio** (`/ceo/portafolio`): lee `data/portafolio.json` (tipos `Portafolio` /
  `UnidadPortafolio` en `lib/types.ts`, lector `lib/portafolio.ts`). Se edita a mano cuando
  una compuerta cambia.
- **Fábrica de MVPs** (jugada 3: "vendemos sistemas con MVP, no con slides genéricas"): comando
  `/demo-cliente` → `scripts/demo-cliente/demo.mjs` (`nuevo|generar|voz|deck|construir|
  desplegar|nota|todo|listar`). Por prospecto, Claude (tool_use, `claude-sonnet-5`) lee su
  web/IG y genera TODO el contenido; el script arma el paquete que el cliente puede tocar:
  **propuesta** (hub) · **presentación .pptx** de 9 slides (pptxgenjs) · **landing** del negocio
  (rediseño o nueva) · **chat** WhatsApp · **voz** real (agente Retell `Demo AutoFlow · <negocio>`)
  · **recorrido "por dentro"** del CRM (embudo → conversaciones → agenda → agentes, datos de
  ejemplo). Plantillas en `demos/_plantilla-autoflow/` (`propuesta|landing|chat|voz|sistema.html`);
  sube a Netlify por zip (`NETLIFY_AUTH_TOKEN`); nota en Pipedrive AIB. Registro en `data/demos/`.
  La voz real pasa por el endpoint central **`/api/demo-webcall`** (público en `proxy.ts`):
  solo emite tokens para agentes cuyo nombre empieza con "Demo AutoFlow"; la key de Retell
  nunca sale de Vercel. Override local: `DEMO_WEBCALL_URL=http://localhost:3000/api/demo-webcall`.
  No se construye la plataforma multi-tenant: el "por dentro" es una simulación con su flujo.
- **Estudio** (jugada 2): la coordinación de producción la hace **Sofi como agente**, no una
  persona (decisión de Elvin, 18/sep). `/coordinar-produccion` (tarea `sofi-coordinacion-produccion`,
  7:30 AM lun–sáb; lunes con "semana") lee `data/calendario.json` (56 piezas de octubre, `origen:
  "estudio"`, campos `marca/pilar/cara/formato/keyword/semana`), `data/estudio.json` (día de
  grabación, caras, pipeline de micro-influencers, contrataciones, compuertas, `pendientesElvin`,
  `bitacora`) y el DM de Elvin en Slack, actualiza estados y le deja a Elvin UN DM con lo que
  falta. Regla dura: Sofi solo le escribe a Elvin; nada a caras/creadores/equipo sin su OK.
  Elvin escribe los guiones y decide el marketing. Docs: `vault/proyectos/estudio/`
  (caras-y-angulos, micro-influencers/{propuesta,brief,acuerdo}, calendario .xlsx).
  Caras: Elvin (Shadow), Daren (ads LU), Frankie Jay (orgánico LU — una persona), Yulianna
  (AIB), Bryan Vega (caso), Bori el coquí. Valentina ya no crea contenido (`lote-valentina-semanal`
  pausada).
- **Telegram = canal directo de Elvin con los agentes** (decisión 18/sep): `lib/telegram.ts`,
  `lib/notificar-ceo.ts` (`notificarCEO` = Telegram si hay `TELEGRAM_BOT_TOKEN` +
  `TELEGRAM_CEO_CHAT_ID`, y SIEMPRE espejo en el DM de Slack), webhook `app/api/telegram/route.ts`
  (valida `TELEGRAM_WEBHOOK_SECRET`, solo el chat del CEO, responde con `responderSofi` y espeja
  `[Telegram] …` a Slack para que la ronda de Sofi lo lea), `scripts/telegram-bot.mjs
  quien|setup|test|enviar`. **Control remoto**: `scripts/telegram-puente.mjs` (long polling en la Mac;
  cada mensaje de Elvin → `claude -p` en este repo con sesión por día; `/sofi`, `/jarvis`, `/estado`,
  `/nuevo`; `PUENTE_MODO=seguro|total`; espejo a Slack). **Corre en Railway** (proyecto
  `puente-telegram`, servicio `puente`, volumen `/estado`, `Dockerfile.puente` vía
  `RAILWAY_DOCKERFILE_PATH`, `.railwayignore` excluye medios y node_modules anidados; deploy con
  `npx @railway/cli up --detach`; variables con `railway variables --set`). Sync de `data/` entre Mac,
  Railway y prod: `app/api/snapshot` (GET con `CRON_SECRET`) + `scripts/sync-data.mjs pull|push`; el
  puente hace pull antes de cada comando y deploy-snapshots si Claude tocó data/vault; las tareas de
  Sofi hacen pull primero. El plist de la Mac (`scripts/launchd/`) queda como respaldo, descargado.
  Pasos de BotFather: `vault/proyectos/estudio/telegram-botfather-pasos.md`.
