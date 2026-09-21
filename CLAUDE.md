@AGENTS.md

# Tablero de Contenido · @tenfoldmarc

Tablero de contenido para un negocio de creador. Seis secciones: Baúl de Ganchos,
Métricas, Rastreador de Competencia, Community Manager, Calendario de Contenido y
Tendencias. Este es el **PASO 01**: UI completa con **datos mock**, lista para
conectar integraciones reales.

> ⚠️ Next.js 16 tiene cambios de convención respecto a versiones previas. Ver
> `@AGENTS.md` y `node_modules/next/dist/docs/` antes de tocar APIs del framework.

## Herramientas / Stack

| Herramienta | Versión | Por qué |
|---|---|---|
| **Next.js** (App Router) | 16.x | Framework React full-stack; routing por carpetas. |
| **React** | 19.x | Server Components por defecto, `"use client"` donde hay estado. |
| **TypeScript** | 5.x | Tipado de toda la capa de datos (`lib/types.ts`). |
| **Tailwind CSS** | v4 | Estilos utilitarios. Config vía `@theme` en `app/globals.css` (sin `tailwind.config`). |
| **shadcn/ui** (Radix) | preset Nova | Componentes accesibles. Viven en `components/ui/`. |
| **lucide-react** | — | Íconos. |
| **recharts** | v3 | Gráfico de Métricas (vía wrapper `components/ui/chart`). |
| **sonner** | — | Toasts (`<Toaster />` en el layout). |

## Cómo correr

```bash
npm run dev     # http://localhost:3000
npm run build   # build de producción (verifica tipos)
npm start       # sirve el build
```

## Decisiones de diseño

- **Modo oscuro forzado**: `className="dark"` en `<html>` (no hay toggle; el prompt
  pide modo oscuro). Si más adelante querés toggle, ya está `next-themes` instalado.
- **Acento terracota**: definido en el bloque `.dark` de `app/globals.css` como
  `--primary`/`--ring`/`--sidebar-primary` ≈ `oklch(0.63 0.135 42)`. Toda la UI usa
  los tokens de shadcn (`primary`, `muted`, `chart-1..5`), así que cambiar el acento
  es editar **una** variable. La paleta de fondo es un negro cálido (tinte 40°).
- **Sidebar**: componente `sidebar` de shadcn. `@tenfoldmarc` va en el `SidebarHeader`
  (`components/app-sidebar.tsx`); la navegación a las 6 secciones sale de `lib/nav.ts`
  (única fuente de verdad: la usan también la home y la sidebar).
- **Datos mock en archivos**: cada sección lee de `lib/mock/*.ts` (tipados con
  `lib/types.ts`). Cero setup, todo renderiza al instante.
- **Server vs Client**: las páginas son Server Components; solo se marca `"use client"`
  lo interactivo (copiar gancho, gráfico, composer, filtro de tendencias).

## Estructura

```
app/
  layout.tsx            Root mínimo: html + fuentes + TooltipProvider + Toaster (dark)
  globals.css           Tailwind v4 + tokens terracota (.dark) + tema navy/neón (.ceo)
  (tablero)/            Route group con el shell del tablero (no cambia URLs)
    layout.tsx          Shell: SidebarProvider + AppSidebar
    page.tsx            Inicio (resumen + accesos a las secciones)
    dashboard/          Dashboard de Agencias (Google Sheets)
    equipo/             Equipo de agentes (pipeline) — lee data/negocio.json
    ganchos/            1. Baúl de Ganchos
    metricas/           2. Métricas
    competencia/        3. Rastreador de Competencia
    community/          4. Community Manager
    calendario/         5. Calendario de Contenido (lee data/calendario.json)
    tendencias/         6. Tendencias (fuentes desde data/negocio.json)
    configuracion/      Mi negocio (form + server action) — escribe data/negocio.json
  ceo/                  CEO Command Center (shell y tema propios, ver abajo)
    layout.tsx          <div class="ceo"> + SidebarProvider + CeoSidebar
    page.tsx            Command Center (debrief + unidades + widgets)
    agents/ tasks/ schedule/ pipeline/ content/ vault/
components/
  app-sidebar.tsx       @tenfoldmarc + nav
  ceo/                  Piezas del Command Center (sidebar, cards, board, tabla)
  page-header.tsx       Header común (con SidebarTrigger)
  platform-badge.tsx    Badge de plataforma con color
  sections/             Piezas client por sección
  ui/                   Componentes shadcn
lib/
  types.ts              Tipos de todas las secciones (incluye Negocio y CEO)
  nav.ts                Definición de las secciones de la sidebar
  format.ts             Formato de números/fechas (es-AR) + hoyISO()
  calendario.ts         Lectura de data/calendario.json (server)
  negocio.ts            Lectura/escritura de data/negocio.json (server)
  equipo.ts             Definición de los 5 agentes (pipeline)
  ceo.ts                Roster ejecutivo, tabs del /ceo y unidades de negocio
  plataforma.ts         Abreviatura/color por plataforma
  mock/                 Datos seed por sección (incluye ceo.ts)
data/
  calendario.json       Entradas del calendario (las agrega /guion)
  negocio.json          Configuración del negocio (la edita /configuracion)
demos/auditorias/       Quiz funnels (Level Up + AI Borinquen) para ClickFunnels 2.0 — ver su README
.claude/commands/
  guion.md              Slash command /guion
```

## El comando `/guion`

`.claude/commands/guion.md` toma un guión (o tema) como argumento, extrae 1-3 piezas
(título, gancho, ángulo, plataforma, fecha) y las **agrega** a `data/calendario.json`
con `origen: "guion"`. La página `/calendario` es `dynamic = "force-dynamic"` y lee el
archivo en cada request, así que las entradas nuevas aparecen al recargar.

Uso: `/guion <pegá tu guión acá>`

## El equipo de agentes y "Mi negocio"

El tablero se opera como un **equipo de agentes** (`lib/equipo.ts`), inspirado en el
modelo del creador. **`Sofi` (Head de Contenido, `head` en el módulo)** coordina por
encima: maneja el pipeline semanal, **junta todos los reportes en un solo informe** y
persigue lo que falta para que salga a tiempo. Debajo, el pipeline de 5:

`Mateo` (datos: Métricas + Competencia) → `Santi` (estrategia: reglas/mix) →
`Cami` (ideas: Tendencias) → `Lauti` (guiones: Baúl + /guion) →
`Facu` (publicación: Community + Calendario).

La página **`/equipo`** muestra la command center de Sofi (informe consolidado armado
con los mocks + `data/calendario.json`: bombazos, ideas con potencial, guiones, cola,
y los pendientes por estado), el pipeline y un resumen de personalización.

La **personalización** vive en `data/negocio.json` (tipo `Negocio` en `lib/types.ts`):
marca (nicho, tono, audiencia, oferta, CTA), cuentas, competidores, fuentes y las
`reglas` de los agentes (mix semanal, horarios, umbral de bombazo, hora del resumen
de Slack, ideas/semana). Se edita en **`/configuracion`** (form client +
**server action** `guardarNegocioAction` que escribe el JSON y hace `revalidatePath`).

- **Conectar cuentas reales** = OAuth por plataforma; lo autoriza el usuario (no se
  guardan contraseñas/tokens en el repo). El botón "Conectar" hoy es un stub.
- Las secciones leen de `negocio.json` a medida que se conectan las APIs. Ya andan:
  **Tendencias** usa `negocio.fuentes`; **Equipo** usa todo el resumen.

## El CEO Command Center (`/ceo`)

Sección aparte con **shell y tema propios** para monitorear todo el ecosistema
(las 2 agencias + Shadow Operator), inspirada en el look "Agentic OS" (navy +
neón cyan/violeta). PASO 01: todo mock salvo las ventas de Level Up (Sheets).

- **Tema scoped**: la clase `.ceo` (bloque en `app/globals.css`) redefine las CSS
  vars de shadcn solo dentro de `app/ceo/layout.tsx`. El resto del sitio queda
  terracota. Ojo: componentes que portalean a `<body>` (Sheet/Dialog/Select/
  Tooltip) salen del scope — pasarles `className="ceo"` en el `*Content`.
- **Roster** (`lib/ceo.ts`): `orquestador` (CEO/Orchestrator, command layer) +
  5 `especialistas` (Researcher, CMO, Sales Rep, Dev, Data Analyst). El CMO
  `supervisaA` a Sofi y su pipeline (`lib/equipo.ts`) — el squad de contenido
  no se reemplaza, se muestra debajo del CMO.
- **Tabs** (`ceoNavItems`): Command Center, Agents, Tasks, Schedule, Lead
  Pipeline, Content, Knowledge Vault. La `CeoSidebar` además lista los agentes
  con dot de estado (working/waiting/idle).
- **Command Center** (`/ceo`): hero del orquestador con el **operator debrief**
  (mock) + cards por unidad — Level Up con **KPIs reales** de
  `armarDashboardAgencia` (badge LIVE), AI Borinquen en STANDBY (refleja
  `activa: false` en `lib/agencias.ts`), Shadow Operator con mocks de métricas.
- **Mocks** en `lib/mock/ceo.ts` (debrief, tareas, leads, agenda, vault) con
  fechas relativas a hoy vía `hoyISO()` de `lib/format.ts` (hora local, no UTC).

## El Content OS (PASO 03): Jarvis + Skills + Vault + HUD

- **HUD** (`/hud`): la ventana única — métricas/pulso (izq), chat Jarvis con
  orbe (centro), skills + cola del worker (der). Tema `.hud` (negro + naranja
  neón) scoped en globals.css. Header linkea a /ceo y /ceo/vault.
- **Jarvis** (`app/api/jarvis/route.ts`): SSE + tool loop con la Anthropic API
  (claude-sonnet-5, thinking disabled, effort medium, cache_control en el
  system estable). Tools: leer_metricas/ops/vault/ganchos, listar/usar_skill,
  encargar_trabajo. Requiere `ANTHROPIC_API_KEY` (sin key → 503 y chat
  deshabilitado). Auth compartida en `lib/auth.ts` (proxy + login + api).
- **Skills** (`.claude/skills/*/SKILL.md`): guionar-reel, armar-carrusel,
  redactar-historias, analizar-competidor, ideas-ganadoras, transcribir-perfil
  (worker). Doble uso: skills nativas de Claude Code Y fragmentos que Jarvis
  inyecta vía `lib/jarvis/skills.ts`. El estilo vive en `vault/estilo/*.md`
  (volcado del plugin contenido-organico — el repo es autosuficiente).
- **Vault** (`vault/`): memoria en markdown con [[wikilinks]] (compatible
  Obsidian). `/sync-vault` trae reuniones de Granola y resume Slack;
  `lib/vault.ts` lo lee; se navega en /ceo/vault (render con marked +
  @tailwindcss/typography). Cursores en `vault/.sync.json`.
- **Cerebro del CEO** (`vault/ceo/`): perfil de Elvin destilado de Granola —
  `perfil-ceo.md` (prioridades/dolores/a-mejorar/fortalezas), `mentores.md`
  (Ramiro, Oscar, Joe, Laura…) y `estrategias-contenido.md` (frases/frameworks →
  ángulos). `/sync-vault` lo **mantiene al día** (merge, no overwrite) con cada
  reunión nueva; su versión condensada vive en la memoria `elvin-ceo-perfil.md`.
  `/brief-ceo` guarda a memoria lo relevante que Elvin dice en Slack.
- **Encargos** (`data/encargos.json` + `lib/encargos.ts`): Jarvis encola
  trabajos pesados; `/worker-encargos` (tarea programada cada 30 min) los
  ejecuta con Apify y deposita en vault/ + `data/ganchos.json` (que /ganchos
  ya lee vía `lib/ganchos.ts` con fallback al mock).
- **Login**: `proxy.ts` (Next 16 renombró middleware→proxy) + `/login`;
  password en `CEO_PORTAL_PASSWORD`. `/` redirige a /ceo; el tablero vive en
  /tablero.
- **Prospección fuera de Meta** (`/prospectar`, `.claude/commands/prospectar.md`):
  `buscar` scrapea Google Maps por categoría × municipio (Apify `compass/crawler-google-places`)
  y puntúa señales digitales → `data/prospeccion/prospectos.json`; `auditar` arma el lote
  de la "auditoría de respuesta" (llamadas del agente de voz + DM de prueba); `cargar`
  sube los que fallaron a Pipedrive con nota + email 1 del diagnóstico en
  `data/prospeccion/emails/`. Plan: `vault/proyectos/captacion-no-meta/plan-maestro.md`.
- **Calendly → Pipedrive CLOSERS** (`app/api/calendly/route.ts`): webhook de Calendly
  (Level Up, scope organización, `invitee.created` + `invitee.canceled`) que crea
  persona + deal en el pipeline **CLOSERS (15)** → stage "Llamada agendada" (145),
  asignado al closer dueño del evento (cruce por email con usuarios de Pipedrive;
  override con `CALENDLY_OWNER_MAP`), con actividad `call` a la hora PR y nota con
  respuestas/UTM. Reagenda → mismo deal a 146 + contador; cancelación → 147.
  Campos custom del deal: evento URI, fecha, tipo de evento, origen UTM, reagendas,
  **Closer (Calendly)** (nombre del host aunque no sea usuario de Pipedrive: Juan David,
  Roger…) y **Agendó (utm_source)** (setter/canal). Ignora tipos de evento que matcheen
  `CALENDLY_IGNORAR_REGEX` (default `onboarding`). Nota breve de 3-4 líneas.
  Idempotente por URI del evento. Firma HMAC con `CALENDLY_WEBHOOK_SIGNING_KEY`.
  Registro/listado: `CALENDLY_TOKEN=… node scripts/calendly-webhook.mjs crear|listar|info`.
  ⚠️ Prod es `https://content-os-chi-seven.vercel.app` (content-os.vercel.app es de otro).
- Tareas programadas activas: `brief-ceo-diario` (6:30 AM) y `worker-encargos`
  (cada 30 min). Corren mientras la app de Claude esté abierta.

## El plan de guerra Q4 2026 (portafolio + Fábrica de Demos)

El 18/sep/2026 Elvin aprobó el **plan de guerra** (`vault/ceo/plan-de-guerra-2026Q4.md`, memoria
`plan-de-guerra-q4`): IA Market como holding con 2 motores (Level Up, AIB), 3 productos (Bori,
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

## Lola — la Creadora de Contenido con IA (20/sep/2026)

El puesto que faltaba: Sofi coordina, Cami idea, Lauti escribe, Facu publica, **Lola produce**
(flyers/artes, videos con Higgsfield, guiones a pedido). Cerebro: `vault/ceo/cerebro-lola.md`
(modelos por defecto, tope de créditos 3 img / 2 videos por pedido, reglas de marca, cómo
entrega). Comando `/crear-contenido <pedido>` (usa el MCP de Higgsfield de la app) y
`/crear-contenido atender` (vacía `data/pedidos-lola.json`; tarea `lola-atender-pedidos` cada
30 min). Entregas: `tipo: "arte"` (nuevo en `TipoEntrega`, con `imagenUrl`; la bandeja lo
muestra) o `anuncio`/`guion`, `agente: "Lola"`. Bot de Telegram `PUENTE_BOT=lola`
(`TELEGRAM_BOT_TOKEN_LOLA`, modo seguro: Read/Edit/Write + `scripts/higgsfield.mjs` +
`validar-voz`); renderiza directo si hay sesión (`node scripts/higgsfield.mjs login` una vez en la
Mac), si no encola. **Lola vive en Railway** (servicio `lola` del proyecto `puente-telegram`, `Dockerfile.puente`, volumen
`/estado`, variables por referencia `${{max.VAR}}` incl. `HIGGSFIELD_OAUTH_JSON`, así que renderiza
directo sin la Mac; deploy `npx @railway/cli up --service lola --detach`). El plist de la Mac queda
como respaldo, descargado. Lola nunca le manda nada a nadie que no sea Elvin. Está en el roster de
`lib/equipo.ts`.

## El ecosistema de email (ActiveCampaign)

`lib/activecampaign.ts` (`upsertContacto` v3: contacto + lista de la marca + tags; `crearCampana`
v1: newsletter como borrador o programado). No-op sin `ACTIVECAMPAIGN_URL` + `ACTIVECAMPAIGN_KEY`;
listas por marca en `AC_LISTA_LU|AIB|SO` (las crea `scripts/activecampaign.mjs setup`). Cables:
quiz (`/api/auditoria` → `origen:quiz`, `quiz:*`, `avatar:*`), Calendly (`/api/calendly` →
`origen:calendly`, `etapa:agendo|reagendo|cancelo`, marca por `CALENDLY_MARCA_AIB_REGEX`) y
aprobar newsletter (`/api/aprobar-entrega` → campaña programada jueves 8 AM PR; `NEWSLETTER_AUTO=draft`
para borrador). Blueprint en `data/email-ecosistema/blueprint.json`; copy de las secuencias en
`vault/proyectos/ecosistema/emails/<marca>/` (+ `data/email-ecosistema/<marca>.json` y la bandeja);
tarea `newsletter-semanal` (miércoles 9 AM, `/newsletter-semanal`). Las automatizaciones (secuencias)
se montan en la UI de AC: pasos en `vault/proyectos/ecosistema/emails/README.md`.

## El agente de Meta Ads (`/meta-ads`)

Media buyer del portafolio (Level Up, AI Borinquen, Shadow Operator, Resuelto) sobre la
**Marketing API v25** con los patrones de producción de Bori (todo `PAUSED`, ABO,
`instagram_user_id`, `promoted_object` con pixel). Cerebro: `.claude/commands/meta-ads.md`;
manos: `scripts/meta-ads.mjs <marca> cuentas|publicos|videos|intereses|pixel|crear|
crear-publicos|subir-lista|arbol|resultados|campanas|pausar`; builders puros en
`scripts/meta-ads/core.mjs` (tests: `npm test`). Config por marca en
`data/meta-ads/portafolio.json` (cuenta, página, IG, pixel, compuertas, `publicosClave`);
planes de campaña en `data/meta-ads/campanas/*.json` (idempotentes: guardan los ids de Meta).
Token = el largo del dueño conectado en Bori, copiado con `scripts/meta-ads/token-desde-bori.mjs`
(lo corre Elvin; ~60 días; ve las 72 cuentas) → `META_ADS_TOKEN` en `.env.local` y en Railway
(`puente`, `nico`). **Plantillas** (`scripts/meta-ads/plantillas.mjs`): `plantilla <marca>
follow-me|trafico-url|dm-instagram|quiz --reels a,b --videos a,b --presupuesto N --edad 18-35 --url …`
→ plan JSON + campaña EN PAUSA en ~10 s (reels existentes por `source_instagram_media_id`; perfil
IG = PROFILE_VISIT/INSTAGRAM_PROFILE; DM = CONVERSATIONS/INSTAGRAM_DIRECT). Por Telegram:
**Max**, el media buyer con bot propio (`PUENTE_BOT=max`, servicio `max` en Railway, token
`TELEGRAM_BOT_TOKEN_MAX`, cerebro `vault/ceo/cerebro-max.md`, guía `vault/proyectos/estudio/
telegram-max-pasos.md`): lenguaje natural → plantilla; solo puede Read/Grep + `node scripts/meta-ads.mjs`.
Rutinas de Max (tareas programadas): `max-reporte-semanal` (lunes 8 AM, `/reporte-max semanal`),
`max-alertas-escalar` (mar/jue/sáb 8:30, `/reporte-max alertas`), `max-trazabilidad-aure` (vie/lun 9 AM,
`/trazabilidad-aure`: le pide a Aure por Slack ventas↔anuncio de LU/AIB y registra en
`data/meta-ads/trazabilidad.json`). Meta del método: $100K→$300K con ROAS 6-8x, renovar creativos cada
10 días, analizar cada 3-7, escalar ganadores 10-20 %; `resultados` marca ESCALAR/pausar/CTR<2 %.
Atajo sin tokens en cualquier bot: `/ads plantilla|resultados|campanas|arbol|pausar <marca> …`. Reglas:
nunca activar ni subir presupuesto por API, 1 creativo por conjunto ≥ mínimo de la marca ($10; Mauro $5),
tope diario por campaña, tuteo PR, sin "gratis", sin promesas de ingreso. Traffickers de Level Up
usan **Bori** (rol `trafficker`, `POST /api/admin/crear-trafficker` como dueño).

## Pulse — el CRM que reemplaza a Monday (`/pulse`)

Clon simplificado de Monday.com (ahorra ~$800/mes) para lo único que Level Up usaba ahí:
la ficha de cada cliente que paga. Lo usan Jessica (onboarding) y Carilin (operaciones);
Pipedrive sigue siendo el CRM de leads. Modelo **genérico tipo Monday**: tableros → columnas
(13 tipos: text, long_text, number, status, dropdown, date, people, checkbox, link, email,
phone, file, relation) → grupos → items con `values jsonb {[columnId]: valor}`. Jessica y
Carilin agregan columnas/etiquetas/grupos desde la UI sin código.

- **Stack**: Postgres (Supabase; sin `DATABASE_URL` cae a **PGlite** embebido en `./.pulse-db`,
  solo dev) + Drizzle (`lib/pulse/schema.ts`, migraciones en `drizzle/`, `npm run db:generate|
  db:migrate|db:studio`). Archivos en Supabase Storage (bucket privado `pulse`; en local van a
  `.pulse-db/archivos/` y se sirven por `/api/pulse/archivo/[id]`).
- **Auth propia**: tabla `pulse_users` (email + clave scrypt, rol admin|miembro), cookie
  `pulse-session` firmada HMAC (`lib/pulse/session.ts`, verificable en `proxy.ts` sin DB). La
  cookie CEO también entra como `PULSE_ADMIN_EMAIL`. Login en `/pulse/login`; usuarios en
  `/pulse/configuracion` (solo admin). Los usuarios importados de Monday llegan inactivos hasta
  que un admin les pone clave.
- **UI** (`components/pulse/`): tema claro `.pulse` (globals.css; ¡`className="pulse"` en todo
  `*Content` que portalea!), `board-provider.tsx` = store cliente con edición **optimista +
  rollback** (sin `revalidatePath` por celda; `refresh()` solo en cambios estructurales),
  `board-table.tsx` virtualizada (`@tanstack/react-virtual`, OFFBOARDED arranca colapsado),
  `cell.tsx` (un editor por tipo), kanban con `@dnd-kit`, tarjetas, panel del item por `?item=`
  con actividad + comentarios (`pulse_activity`), filtros/orden/agrupar client-side.
- **Server actions**: `app/pulse/(app)/[board]/actions.ts` (verifican `usuarioActual()`, validan
  con `lib/pulse/valores.ts`, devuelven `{ ok, ... }`); data access en `lib/pulse/repo.ts`.
- **Migración**: `npm run pulse:migrar -- [--dry-run] [--board <id>] [--sin-archivos]` con
  `MONDAY_TOKEN` (GraphQL 2025-01, `items_page` paginado, colores por `var_name`, personas por
  email, relaciones en 2ª pasada, PDFs a Storage; idempotente por `monday_id`). Tableros:
  LEVEL UP MEDIA 7784685790 → `/pulse/level-up-media`, AI BORINQUEN 18399101258, Asignación de
  Estrategas 9506323087. Mapeo puro y testeado en `scripts/pulse/monday-mapeo.mjs`
  (`tests/pulse-valores.test.mjs`). Reporte en `data/pulse-migracion.json`.
- **Puente a n8n/NocoDB** (`lib/pulse/puente-n8n.ts`): los agentes de n8n de Level Up leen la tabla
  `clientes` de NocoDB, que antes alimentaba Monday. Pulse avisa cada cambio de LEVEL UP MEDIA /
  Asignación de Estrategas al webhook `pulse-cliente` (after(), `PULSE_N8N_SECRET`, `N8N_URL`) y
  expone `GET /api/pulse/n8n/clientes` para la corrida nocturna. El workflow lo genera
  `scripts/n8n-sync-pulse.mjs`. `PULSE_N8N_MODO=real` para escribir; si no, simulación.
- **Seed** de prueba: `npm run db:seed` (admin + Jessica + Carilin, clave `pulse-dev` sin env,
  tablero Demo). Env: ver bloque Pulse en `.env.example`.

## n8n de Level Up (`scripts/n8n.mjs`)

El back office de la agencia (98 workflows, Chatwoot, Evolution, NocoDB) vive en un VPS Contabo con
Easypanel montado por un proveedor externo. Nico lo toma: `node scripts/n8n.mjs inventario|exportar|
ejecuciones|salud|subir <id>|todo` (solo `N8N_API_KEY`, nunca la clave de la UI). Respaldo en
`data/n8n/workflows/` (re-exportar tras cada cambio); la ronda de Nico reporta workflows con error.
Plan y diagnóstico en `vault/proyectos/n8n/`. Regla: sin OK de Elvin no se activa/desactiva nada ni
se tocan credenciales o webhooks.

## Conectar datos reales (próximos pasos)

Cada sección está aislada detrás de su mock. Para pasar a datos reales, reemplazá el
contenido de `lib/mock/<seccion>.ts` (o convertilo en una función async que llame a la
API) manteniendo los tipos de `lib/types.ts`; la UI no cambia.

- **Ganchos** → store propio (DB) + transcripción (Whisper/etc.) + IA para generar la
  `plantilla` a partir del `transcripto`. La UI ya filtra por **nicho / tipo / vistas**
  (`GanchosExplorer`) y el botón **"Usar este"** copia la plantilla para pegarla en
  `/guion`.
- **Métricas** → Instagram Graph API (insights de cuenta y media). Cada stat card tiene
  un **sparkline** (`components/sparkline.tsx`) con series a **7/30/90 días**; reemplazá
  `series` por datos reales. "Bombazo" = vistas ≥ 2× `MEDIANA_30D` (en `lib/types.ts`).
- **Competencia** → scraping de los **domingos a la mañana** de las 8 cuentas seguidas
  (p. ej. un Actor de **Apify**) + transcripción del audio (gancho + texto en pantalla).
  El botón **"Guardar en Baúl"** debe crear un `Gancho`. Actualizá `actualizadoEl`.
- **Community Manager** → la descripción se arma con **gancho + ángulo + CTA**
  (`generarDescripcion`, reemplazable por la API de Claude). La **publicación real se
  delega al Zernio MCP** (botón PUBLICAR); hoy es un stub con toast.
- **Calendario** → **vista mensual** (`CalendarMonth`); al tocar un día se abre un panel
  lateral (`Sheet`) con el guion completo. Persiste en `data/calendario.json` (incluye
  `hora` y `descripcion`); para multiusuario, mover a DB.
- **Tendencias** → revisar las **12 fuentes 1 vez por día** (RSS/APIs: blog de Anthropic,
  blog de OpenAI, listas de X, fuentes del nicho) + un filtro con IA que asigne la
  `etiqueta` (`potencial` / `explicativo` / `ignorar`) y proponga `angulosContenido`.
  El **resumen de las 5 con más potencial** se envía por **Slack a las 7 AM**: el botón
  "Enviar ahora" es un stub; en real va por el **Slack MCP** disparado por una **tarea
  programada** (cron 7 AM).

## Registro de decisiones

- Scaffold con `create-next-app` en carpeta temporal y movido al working dir porque el
  nombre `AGENTE CONTENIDO` (mayúsculas + espacio) no es válido como nombre de paquete npm.
- shadcn init con preset **Nova** (Lucide + Geist) y base **Radix**.
- Calendario lee de JSON (no de DB) para que `/guion` pueda escribir sin más setup.
- El shell del tablero se movió de `app/layout.tsx` al route group `app/(tablero)/`
  para que `/ceo` tenga sidebar y tema propios sin anidar dos sidebars. Las URLs
  no cambiaron.
- ⚠️ El caché persistente de Turbopack puede servir CSS viejo tras editar
  `globals.css` (ni el restart del dev server lo invalida). Si un cambio de CSS
  no aparece: `rm -rf .next` y reiniciar.
