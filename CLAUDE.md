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
  ritmo/                Ritmo: ponche + desempeño del equipo (app aparte, cuentas de Pulse)
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
  **Laura** (closer medio tiempo, sin asiento) toma el calendario Level Up Media:
  `CALENDLY_CLOSER_ALIAS` (default `levelupmediapr@gmail.com=Laura`) pone Closer = Laura;
  el deal queda de Level Up Media. Filtro guardado "CLOSERS · Laura" (id 106037).
  Idempotente por URI del evento. Firma HMAC con `CALENDLY_WEBHOOK_SIGNING_KEY`.
  Registro/listado: `CALENDLY_TOKEN=… node scripts/calendly-webhook.mjs crear|listar|info`.
  ⚠️ Prod es `https://content-os-chi-seven.vercel.app` (content-os.vercel.app es de otro).
  **Aviso en Slack (24/sep):** cada cita sale en el Slack DE SU MARCA — Level Up (`/api/calendly`) en
  **#office-10-lum-calls** (`SLACK_CALLS_CHANNEL_ID`, bot Command Center) y AI Borinquen
  (`/api/aib/calendly`) en **#borinquenia-calls** del Slack de AIB (`SLACK_AIB_CALLS_WEBHOOK`, webhook
  entrante; sin él, no se avisa — nunca va al Slack de LU). Campos: cliente, negocio, fecha/hora PR, closer (alias incluido), contacto y quién
  agendó (utm_source); reagendas 🔁 y onboardings 🎉 marcados. `lib/aviso-llamadas.ts`. El bot
  Command Center tiene que estar en el canal.
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

## ISLA Run Series (piloto, 23/sep/2026)

Marca premium de carreras por municipio, con socios; 1.ª edición **ISLA Cabo Rojo 5K** (dom 13/dic/2026,
6 AM). Entró como **excepción con operador** a la regla del 12/dic: los socios la operan, Elvin aprueba
y Claude/agentes ponen plataforma, contenido y pauta. Unidad `isla-run` en `data/portafolio.json`
(compuerta 1/nov: ≥900 inscritos). Docs en `vault/proyectos/isla-run/` (`plan-maestro.md`, `marca.md`,
PDF de gestiones y permisos generado por `scripts/isla-run/gestiones-pdf.py`). La plataforma
(landing + inscripción + Stripe + admin, multi-ciudad; ATH Móvil en fase 1b) vive en un **repo propio**
`/Users/elvinayala/isla-run`, no en Content OS (preview `isla-run` en `.claude/launch.json`, puerto
3130, pagos demo). Su README tiene el checklist antes de abrir inscripciones.

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

## Iris — la vigía de Cortex (21/sep/2026)

Primera responsora del canal de edición (`#cortex-bori-edit-videos`, C0C3QNXLD32): nació
después de que María del Carmen pidió b-roll 4 veces sin que Cortex lo ejecutara (un
`disable_broll` de una revisión vieja quedó pegado — ver el bug real más abajo en "Reglas" y en
`ave/brain/revise.py`). Cada ~20 min (tarea `iris-vigilancia-cortex`) lee lo nuevo del canal
(cursor en `data/iris-cursor.json`), y si alguien no fue escuchado (pedido repetido, bug, error):
responde en el hilo, diagnostica en `~/ai-video-editor` (overrides/revisions/timeline/reglas),
lo arregla ella misma si es seguro, o se lo deja servido a Nico (`data/nico-bitacora.json` con
prefijo `[Iris → Nico]`) si excede lo que puede decidir sola. Solo le avisa a Elvin cuando hay
un bug de código real, algo pendiente de su decisión, o es crítico — nunca por cada ticket.
Cerebro: `vault/ceo/cerebro-iris.md` · ronda: `.claude/commands/iris.md` · bitácora:
`data/iris-bitacora.json`. **Telegram**: comparte el bot de Sofi (`/iris` en
`scripts/telegram-puente.mjs`); no tiene bot propio todavía (si se quiere uno separado, el
patrón es el mismo que Nico: `@BotFather` → `TELEGRAM_BOT_TOKEN_IRIS` → `PUENTE_BOT=iris`).

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
**#nico-desarrollo** (`SLACK_NICO_CHANNEL_ID`, Elvin + Carilin + Aure + bot): todo lo que ellas
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

## Los agentes se hablan entre sí y con el equipo (20/sep/2026)

Elvin: "Sofi le pide algo a Nico, Max le pide algo a Nico, y con mi equipo personal también".
**Buzón compartido** `app/api/agentes/route.ts` (tabla `agentes_mensajes` en la base de Pulse,
auth `CRON_SECRET`, público en `proxy.ts`) — el único punto común entre los contenedores de
Railway y la Mac. **Herramienta** `scripts/agentes.mjs` (identidad = `PUENTE_BOT`, sin él = Sofi):
`mensaje <sofi|nico|max|lola> "…"` · `buzon` · `atendido <id> "respuesta"` (la respuesta vuelve al
buzón del que preguntó) · `historial` · `equipo` (directorio Slack) · `slack <nombre> "…"` (DM por
Slack con el bot Command Center, firmado; el bot SÍ puede escribirle directo a cualquiera del
equipo) · `elvin "…"` (Telegram del bot + espejo Slack). El puente (`buzonLoop`, cada 20 s) atiende
lo que le llega como un mensaje de Telegram — en serie con Telegram (`enSerie`, una sola sesión de
Claude por agente) — y cierra/responde solo si Claude no lo hizo. Todo se espeja al DM de Slack de
Elvin como `[Agentes] X → Y`. Reglas de comunicación en el sufijo `COMUNICACION` de todas las
personas: libre entre agentes y con Elvin; al equipo humano solo lo que el cerebro de cada uno
permite; nunca a clientes; nunca secretos.

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

## Pipeline de creadores para colaboraciones (`/creadores`, 21/sep/2026)

Elvin identifica creadores a ojo (10–15K seguidores con engagement orgánico real) y quiere un flujo
constante sin depender de él. `scripts/creadores.mjs` (`agregar @h --por --marca --nota` ·
`puntuar <raw.json>` · `lista [estado]` · `estado @h <estado> [--precio --formato --nota]` ·
`tabla-viernes`) mantiene el tablero `data/creadores.json` (`por-vetar → vetado → contactado →
cotizado → aprobado → publicado | descartado`); `puntuar` es el criterio de Elvin en 100 puntos sobre
la mediana de los últimos 12 posts (engagement, alcance de reels, conversación, actividad, tamaño
8–100K, PR; Tier A ≥ 70 / B ≥ 50 / C ≥ 35). `/creadores vetar|tabla|buscar` usa el MCP de Apify
(`apify/instagram-profile-scraper`, raw en `data/creadores/raw/`). Atajo en cualquier bot de Telegram:
`creador @a @b nota` → entra a por-vetar sin Claude. Tarea `creadores-vetar-diario` 8 AM lun–sáb
(viernes + tabla). Lis es la coordinadora (contacta, negocia, cotiza); Elvin aprueba la tabla del viernes.
Doc: `vault/proyectos/bori-crecimiento/pipeline-creadores.md`.

## Director Creativo de Level Up en Slack (22/sep/2026)

Elvin: "algo que me quita mucho tiempo: revisión de flyers, scripts y guiones". El equipo sube la
pieza (flyer en imagen/PDF, guion, hooks, CTA) al canal `SLACK_DIRECTOR_CHANNEL_ID` y el bot de
Slack de siempre (mismo `/api/slack-eventos` que Sofi) responde en el hilo con el criterio de Elvin.
Cerebro: `vault/ceo/cerebro-director-creativo.md` — arriba el prompt de Elvin TAL CUAL (método de 5
fases, afinar ≠ reescribir, formatos FLYER/GUION, recomendaciones 0-2), abajo cómo opera en Slack,
la "💡 Nota del director" (máx. 1, criterio propio: políticas de Meta, zonas seguras, legibilidad…)
y **REGLAS APRENDIDAS** (vacía: solo entra lo que Elvin aprueba). Si Elvin corrige en el hilo
(su id = `CEO_SLACK_ID`), el agente aplica la corrección y cierra con `📌 FEEDBACK CANDIDATE`.
Lógica en `lib/director-creativo.ts` (`claude-opus-5`, adaptive thinking, effort high, cerebro
cacheado, fallback de servidor ante rechazos; override `DIRECTOR_MODEL`). Regla dura: cero datos
nuevos — lo que falte va como `[FALTA: …]`. Setup: scope `files:read` en la app de Slack
(para abrir los adjuntos), invitar el bot al canal, `message.channels` (o `message.groups` si es
privado). Video no lo ve: pide guion o frame.

## Ritmo — asistencia y desempeño del equipo (`/ritmo`, 25/sep/2026)

Elvin: medir **asistencia, cumplimiento y resultados por puesto sin vigilar** (nada de capturas/GPS/
teclado). App **aparte de Pulse** (su nombre, su link, tema `.ritmo` en globals.css: azul tinta + verde (pulso) + coral (calor), el logo va de verde a coral,
PWA propia `app/ritmo/manifest.webmanifest`), pero por dentro usa **las mismas cuentas, cookie
`pulse-session` y base de Pulse** (tablas `desempeno_*`, migración `0008_desempeno.sql`, schema en
`lib/desempeno/schema.ts`). Entrada propia en `/ritmo/entrar` (reusa `loginPulseAction`, que ahora
acepta `desde=/ritmo…`); dominio `ritmo-*` → `/ritmo` en `proxy.ts`.

- **Hoy** (`/ritmo`): círculo grande = ponche (hora del servidor + IP). Horario flexible (varios
  tramos al día; un tramo < 16 h se cierra normal aunque pase la medianoche). Al salir: bloqueos
  (opcional) + lo que el sistema no ve (`manual` del puesto, p. ej. reuniones con clientes). Salida
  olvidada → la persona pone la hora y su líder la confirma (`correccion: pendiente`).
- **Equipo** (`/ritmo/equipo`, `/ritmo/equipo/[persona]`): por departamento — presentes, sin marcar,
  terminadas/vencidas, 🟢🟡🔴 de la semana; ficha con KPIs vs meta, 7 días y bloqueos. Permisos:
  admin/editoras todo, el líder su gente, cada quien a sí mismo (`puedeVer` en `lib/desempeno/reglas.ts`).
- **Ajustes** (`/ritmo/ajustes`, admin/editoras): perfiles (puesto, líder, horario PR, días, contrato,
  ingreso; `desde` = día de activación, antes no cuenta), metas/pesos por puesto (`desempeno_metas`) y
  botón que crea el tablero **Producción** en Pulse (`/pulse/produccion`).
- **Reglas** (puras, `tests/desempeno.test.mjs`): puestos y KPIs en `PUESTOS`; asistencia (tolerancia
  15 min, tarde 85/70/50, salida temprana solo si no completó horas); KPIs de Producción en ventana
  móvil de 7 días desde `pulse_activity` del Estado (responsable → "En revisión"; quien pidió →
  "Listo" o "Cambios" = revisión); score = 20 % asistencia + 80 % KPIs **conectados**; 🟢 ≥ 90, 🟡 ≥ 75.
  Fuentes conectadas hoy: `produccion` y `manual`. Fase 2: Meta (registro de actividad), n8n (alertas
  y "Revisado"), NocoDB (reportes), Chatwoot, Slack → `desempeno_metricas` (una fila por persona/día/KPI).
- **Calibración**: el score solo lo ve admin (vista previa) hasta `DESEMPENO_SCORE=on`.
- **Avisos** `app/api/cron/ritmo` (`?tarea=digest` L-V 9:30 AM PR a Carilin/`RITMO_AVISO_A` y a cada
  líder; `?tarea=semanal` lunes 8 AM a Elvin): en simulación hasta `DESEMPENO_AVISOS=real`; `?dry=1`
  nunca manda. El monitor viejo de Slack (`/ceo/equipo-actividad`) redirige a Ritmo.

### Ritmo · Personas (RR.HH.) y canal ético (25/sep/2026)

- **Vista maestra** = admin/editoras (Elvin, Carilin, Aure) **+ RR.HH.** por `RITMO_RRHH` (emails; Yaileen).
  `lib/desempeno/sesion.ts` → `usuarioRitmo()` / `requiereMaestro()`. Los líderes NO ven la maestra.
- **Personas** (`/ritmo/personas`, `/ritmo/personas/[id]`): ficha SOLO de operaciones con sueldo fijo
  (`desempeno_fichas`; "Crear ficha" desde la lista): foto, teléfono y alterno, ciudad/país, documento,
  salario mensual USD; documentos por categoría (identificación, contrato, certificaciones, entrenamiento
  con videos, nómina, otros) en el bucket privado `pulse/ritmo/<userId>/…`, subidos DIRECTO del navegador
  con URL firmada (`prepararSubida` → PUT → `confirmarSubidaAction`; en local pasa por el servidor);
  se abren por `/ritmo/archivo/[id]` y `/ritmo/foto/[userId]` (maestra o la propia persona, con bitácora).
  El empleado ve su ficha ("Mi ficha") y puede subir sus documentos (no nómina).
- **Tiempo libre** (`lib/desempeno/rrhh.ts`, tests `tests/rrhh.test.mjs`): 7 días/año acumulados por mes
  desde el ingreso, se solicitan a los 12 meses; enfermedad 3/año con certificado (si no → vacaciones);
  maternidad 15 por evento; lo que no alcance = sin paga. RR.HH. registra las ausencias. Aviso de 12 meses:
  banner en Hoy/ficha + cron `?tarea=aniversarios` (diario 9 AM PR, a la persona y a RR.HH./Carilin).
- **Nómina estimada** del mes siguiente: salario + ajustes (`desempeno_ajustes`) − días sin paga.
- **Canal ético** (`/ritmo/etica`, `desempeno_etica`): cualquiera reporta, anónimo por defecto; la bandeja
  y el aviso por Telegram (sin el contenido) son SOLO para Elvin (admin).

## El ecosistema de email (ActiveCampaign)

**Cada marca tiene SU cuenta de AC y nunca se mezclan (Elvin, 23/sep):** Level Up =
`ACTIVECAMPAIGN_URL/KEY` (levelupmediapr17748); AI Borinquen = `ACTIVECAMPAIGN_URL_AIB/KEY_AIB`
(sin eso, todo lo de AIB es no-op). Igual con Calendly: el de LU va a `/api/calendly`, el de AIB a
`/api/aib/calendly`. `lib/activecampaign.ts` (`upsertContacto` v3: contacto + tags de contexto →
lista → tags `etapa:*`; `crearCampana` v1: newsletter como borrador o programado);
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
Atajo sin tokens en cualquier bot: `/ads plantilla|resultados|campanas|arbol|pausar <marca> …`. **23/sep/2026 — Max completo:** `estrategia` = el **Método 5 Fases** de Elvin (públicos primero → F1 tráfico ~10 % · F2 ventas ≥70 % · F3 remarketing ventas caliente/tibio · F4 ThruPlay 365 · F5 escalar), todo EN PAUSA en ~1 min (`plantillas.mjs` → `planEstrategia5Fases`, tests en `tests/meta-ads.test.mjs`); `escalar <adsetId> [--pct] [--ok]` (propone; `--ok` solo tras el sí de Elvin, ≤ 20 %); `competencia "<términos>"` + skill `espiar-competencia` (Biblioteca de Anuncios vía Apify `apify/facebook-ads-scraper`, ranking por días activos + variantes en código, `scripts/meta-ads/competencia.mjs`, necesita `APIFY_TOKEN`). **Max es el trafficker de los clientes de AI Borinquen en Bori** (heybori.ai → Estratega → modo "Max · trafficker": Sonnet 5, ficha de onboarding por espacio de cliente, mismo método, flyers Nano Banana, pedido de videos a la PM); cerebro §1b/§10/§11. **24/sep/2026 — Max = Marketing Strategy & Creative Operator** (spec de Elvin): CMO + media buyer + estratega creativo/de embudos; cadena entender → investigar → diagnosticar → embudo → estrategia → producir → medir → optimizar/escalar; 3 embudos (WhatsApp · Landing con calidad de data del pixel · Crecimiento IG ≤ $1/seguidor, hasta 10 conjuntos) con criterio de selección; matemática comercial (meta − actual ÷ ticket); optimiza desde el creativo, más allá del ROAS (CTR único < 2 % malo); MANTENER/APAGAR/ITERAR/ESCALAR/NUEVO TEST; pepitas de Carilin/traffickers/estrategas (cerebro §0, §1a, §2b, §12-§16; en Bori, ficha ampliada con ticket, facturación actual/meta, capacidad y resúmenes de onboarding/llamada de venta). Reglas:
nunca activar ni subir presupuesto por API, 1 creativo por conjunto ≥ mínimo de la marca ($10; Mauro $5),
tope diario por campaña, tuteo PR, sin "gratis", sin promesas de ingreso. Traffickers de Level Up
usan **Bori** (rol `trafficker`, `POST /api/admin/crear-trafficker` como dueño).

## Max vive en Slack (24/sep/2026)

Elvin: "Max debe de vivir en Slack… todo el proceso (onboarding, estrategia, contenido) lo crea
independiente, envía aprobación al canal, se aprueba y se lo envía al cliente; luego crea la estructura
en borrador y, si lo autoriza, lo publica". **#max-aprobaciones** (`SLACK_MAX_CHANNEL_ID`, Elvin + Carilin
+ bot): Max propone con un #id; deciden **Elvin o Carilin** con `ok <id>` · `ok <id> pero …` (lo ajusta y
vuelve a subir) · `no <id> <corrección>` · `publica <id>`. **Max nunca le escribe al cliente**: el
servidor (`lib/max/flujo.ts`) publica en el canal del cliente EXACTAMENTE lo aprobado. Clientes = los
invitados de Slack (single-channel guests) en un canal vinculado → su mensaje va al buzón de Max, que
prepara la respuesta y la manda a aprobación. Arranca con cada cliente nuevo del formulario de onboarding
de LU: el formulario abre el expediente y **el Fathom de la reunión de onboarding de Jessica** (webhook de
la cuenta de equipo, `fathom.mjs crear --equipo`; solo llamadas etiquetadas "Onboarding · <Negocio>", lo
demás se descarta y no sale en ningún canal) despierta a Max y le pide a Jessica su resumen en el hilo
(`lib/max/onboarding.ts`). Aprueban Elvin, Carilin o Jessica; publicar solo Elvin o Carilin. Hoy ningún
canal de cliente habilitado (`MAX_CANALES_CLIENTES`) y límites de conversación en `revisarParaCliente`. Datos: tablas `max_clientes` (expediente: canal,
etapa, ficha, ids de Meta) y `max_items` (propuestas) en la base de Pulse, `lib/max/repo.ts`; lógica pura
testeada en `lib/max/operador.ts` (`tests/max-operador.test.mjs`); API `/api/max` (CRON_SECRET, pública
en proxy). Manos de Max: `scripts/max.mjs` (clientes|alta|canales|vincular|etapa|ficha|meta|leer|hilo|
llamada|proponer|pendientes|nota|cerrar|enviar) y `meta-ads.mjs cliente:<slug> …` (cuenta del expediente)
+ `proponer-publicar <campaignIds> --cliente <slug>` + `activar --item <id>` (ÚNICO camino para prender
por API: exige un 🚀 aprobado por Elvin/Carilin y prende solo sus ids). Puente de Max (Railway): lo que
llega `de: slack` se trabaja con `MAX_SLACK` y el cerebro §17. Bori queda para los clientes de AIB.
**Modelo y gasto:** Opus 5.5 para planear/investigar/producir y Haiku 4.5 para mensajes y trámites, con topes
de $10/día y $25/semana para lo automático (`scripts/max-gasto.mjs`, `MAX_TOPE_DIA/SEMANA` en Railway; al
llegar, lo de Slack queda en cola y se avisa a Elvin). **Carpeta de Drive por cliente** (`lib/max/drive.ts`):
Google Apps Script en la cuenta de LU (`scripts/drive/max-drive.gs`, `DRIVE_SCRIPT_URL` + `DRIVE_SCRIPT_SECRETO`)
crea `Clientes Level Up · Max/<Negocio · Persona>` con 6 subcarpetas, la comparte con el dominio, la enlaza en
la columna "Carpeta del cliente (Drive)" de LEVEL UP MEDIA en Pulse y avisa en #max-aprobaciones; guarda el
onboarding y todo lo aprobado; Max sube lo demás con `max.mjs carpeta|drive-doc|drive-archivo|drive-listar`.
**Identidad** (`vault/ceo/identidad-max.md`): Max · Estratega Digital 5.0, muñequito 3D con las raíces de Elvin (su
creador: pelo, barba, blazer de lino crema) + pin de brújula y brillo amarillo LU, en `public/marcas/max/` (oficial max-v3, la de la ceja); publica en Slack con su nombre y foto (`chat:write.customize`), sus mensajes
programados salen con identidad por `max_programados` + cron `/api/cron/max-programados` (cada 5 min); su propia
app de Slack está lista en `scripts/slack/max-app-manifest.json` (falta instalarla y el cambio de token).

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
- **Seguridad** (`lib/pulse/seguridad.ts`, 21/sep): cookie `userId.exp.iat.hmac` (14 días) y
  `pulse_users.sesiones_desde` — cambiar clave/rol o desactivar cierra las sesiones; bloqueo 15 min
  tras 5 intentos fallidos (`intentos_fallidos`/`bloqueado_hasta`) + límite 10/min por IP; scrypt
  de sacrificio anti-enumeración; clave ≥ 8; `pulse_security_log` (se ve en /pulse/configuracion,
  solo admin); `secretoValido()` (timing-safe) para n8n/cron; cabeceras HSTS/CSP/X-Frame en
  `next.config.ts` (CSP solo en /pulse; si se agrega un CDN hay que sumarlo a `img-src`/`connect-src`);
  respaldo diario `api/cron/pulse-respaldo` (8:30 UTC) → Storage `pulse/respaldos/YYYY-MM-DD.json`,
  conserva 30, sin password_hash.
- **Typeform de onboarding → Pulse** (24/sep): el cliente paga, llena el "ONBOARDING TYPEFORM"
  (`vlfCgUUP`) y el webhook `POST /api/pulse/typeform` (firma `Typeform-Signature` con
  `TYPEFORM_WEBHOOK_SECRET`, público en `proxy.ts`) crea la ficha en LEVEL UP MEDIA → ONBOARDING & SETUP
  (nombre del contacto, Empresa, Teléfono, E-mail, Pueblo) y deja TODAS las respuestas como comentario,
  firmado por el usuario de sistema "Typeform (automático)". Si ya existe por e-mail/teléfono completa
  solo lo vacío; idempotente por token. Mapeo puro en `lib/pulse/typeform.ts` (tests), alta en
  `lib/pulse/alta-typeform.ts`. `scripts/typeform.mjs webhook|webhooks|importar --desde … [--real]|probar`
  (necesita `TYPEFORM_TOKEN`; `?prueba=1` / sin `--real` escribe en el tablero Demo).
- **Onboarding propio de Level Up** (24/sep, reemplaza al Typeform): **`https://levelupmedia.vercel.app`**
  (raíz = formulario por rewrite; en ese dominio y en `bienvenida-levelup` cualquier otra ruta vuelve al
  formulario, nunca a un login) → `/onboarding/level-up` (público en `proxy.ts`). Lo manda el CLOSER al cerrar. Una pregunta por pantalla, marca LU (negro +
  `#f5ce1a`, Sora/Inter, estilos `.onboarding-lu` en globals.css), borrador en localStorage. Preguntas y
  validación compartidas en `lib/onboarding/level-up.ts` (`columna` = título de la columna en Pulse;
  `ETIQUETA_VISIBLE` muestra bien escritas las etiquetas del CRM). `POST /api/onboarding/level-up`
  (límite por IP, campo trampa, `?prueba=1` + `x-prueba: CRON_SECRET` → Demo) → `altaOnboarding`
  (`lib/pulse/alta-typeform.ts`, compartida con el Typeform): convierte cada respuesta al tipo de su
  columna (status/dropdown por etiqueta, número, link), crea en ONBOARDING & SETUP o completa lo vacío.
- **Próximo nivel** (24/sep, sin cambios bruscos):
  - **Ocultar** columnas y etiquetas (`settings.oculta`, `columnaVisible`/`etiquetaElegible` en
    `lib/pulse/types.ts`): no se borran, salen del tablero/pickers; "Ocultas (n)" en la barra las
    muestra; en la ficha van en "Columnas ocultas". En LU se ocultaron STATUS REVISIÓN, Encuesta,
    Tipo, 6 etapas de Progreso sin uso y "Otro" en Razón de Baja.
  - **Automatizaciones** tipo Monday (tabla `pulse_reglas`, menú ⚡ del tablero; solo admin/editor):
    cuando valor/grupo (con excepciones) → mover, fecha +N días, poner valor/persona, **exigir**
    un campo (p. ej. razón de baja al pasar a OFFBOARDED: el cliente abre `RequisitoDialog` y
    reintenta) o avisar por Slack. Lógica pura en `lib/pulse/automatizaciones.ts` (tests),
    ejecutor en `lib/pulse/motor-reglas.ts`; sin cascadas entre reglas.
  - **Mi día** (`/pulse/mi-dia`, `lib/pulse/mi-dia.ts` puro + `mi-dia-datos.ts`): clientes nuevos
    del formulario, onboardings detenidos +48 h, seguimientos de 10 días y reportes de la semana;
    "✓ Hecho" queda en `pulse_activity.after.hecho` y "Reporte enviado" recalcula el próximo.
    Cron `api/cron/pulse-mi-dia` lun–vie 8 AM PR → DM **desde el bot Command Center** (nunca
    desde la cuenta de Elvin) a `PULSE_MI_DIA_DESTINOS` (default jessica, carilin); `?prueba=1`
    solo a Elvin. IDs de Slack conocidos en `lib/pulse/slack-dm.ts` (el bot no tiene
    `users:read.email`; override `PULSE_SLACK_IDS`).
  - **⌘K** (`components/pulse/buscador-global.tsx`): clientes de los tableros visibles por nombre,
    empresa, e-mail o teléfono (también dígitos pegados) + navegación. **Vistas guardadas** por
    persona (`pulse_vistas`, popover "Vistas"). **Celular**: arranca en tarjetas, barra con "Más".
  - **Preguntarle al CRM** (`/pulse/preguntar`, también desde ⌘K con `?q=`): agente con tools
    (`buscar` → `consultar()` puro en `lib/pulse/preguntar.ts`, tests; `responder` con ids + nota)
    en `lib/pulse/preguntar-ia.ts` (`claude-opus-5`, effort low, fallbacks del servidor; override
    `PULSE_PREGUNTAR_MODEL`/`_EFFORT`). Solo aplana los tableros que la persona puede ver y solo
    devuelve ids de esos tableros; tope 8 preguntas/min por persona. ~15 s por pregunta.
  - Dev local usa `DATABASE_URL_DIRECT` (pooler de sesión): el de transacciones dejaba consultas
    trabadas en "ClientRead" desde la Mac. Prod sigue con `DATABASE_URL` (6543).
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
