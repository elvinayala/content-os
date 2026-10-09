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

## Sistema Operador — el high ticket de pago único (28/sep/2026)

Elvin: "quiero vender mi sistema como si fuera una franquicia… que algún consejo de cualquiera de esos
sistemas le pueda cambiar el negocio". Los 6 sistemas de EA Market (marketing, IA, operaciones, ventas,
reclutamiento, entrenamiento) sobre los 4 Fundamentos, instalados done-with-you en 90 días, para dueños
digitales que ya facturan $10K+/mes. **Borrador pendiente del OK de Elvin**: $15,000 pago único, 10
fundadores a $9,997 con caso documentado, garantía de implementación (no de ingresos), solo por
aplicación. Es el escalón de arriba de Shadow (no es empresa nueva; preventa nov–dic, cohorte en ene).
Todo en `vault/proyectos/sistema-operador/`: `oferta.md`, `curriculo.md` (cada sistema con su palanca,
diagnóstico, módulos y fuente interna, que **nunca se entrega tal cual**), `diagnostico-6-sistemas.md`
(30 preguntas, también lead magnet) y `kit-venta/guion-closer.md`. Presentación de 12 slides:
`node scripts/sistema-operador/deck.mjs` → `kit-venta/sistema-operador.pptx` (paleta de Shadow; slide 7
se llena en vivo). Página de venta estática `demos/sistema-operador/index.html` (sin precio; preview
`sistema-operador`, puerto 8796; subir a Netlify solo con OK). Aplicación `/f/aplicar-sistema`: semilla
en `lib/formularios/semillas.ts`, **nace cerrada**, guarda parciales, acción "ninguna".

## ISLA Run Series (piloto, 23/sep/2026)

Marca premium de carreras por municipio, con socios; 1.ª edición **ISLA Cabo Rojo 5K** (dom 13/dic/2026,
6 AM). Entró como **excepción con operador** a la regla del 12/dic: los socios la operan, Elvin aprueba
y Claude/agentes ponen plataforma, contenido y pauta. Unidad `isla-run` en `data/portafolio.json`
(compuerta 1/nov: ≥900 inscritos). Docs en `vault/proyectos/isla-run/` (`plan-maestro.md`, `marca.md`,
PDF de gestiones y permisos generado por `scripts/isla-run/gestiones-pdf.py`). La plataforma
(landing + inscripción + Stripe + admin, multi-ciudad; ATH Móvil en fase 1b) vive en un **repo propio**
`/Users/elvinayala/isla-run`, no en Content OS (preview `isla-run` en `.claude/launch.json`, puerto
3130, pagos demo). Su README tiene el checklist antes de abrir inscripciones.

## ⚠️ Qué es AI Borinquen (regla dura de Elvin, 1/oct/2026)

AI Borinquen **NO es solo atención al cliente ni "contestar el teléfono"**. Son cuatro líneas:
**agentes personalizados** (un empleado digital por puesto: ventas, cotizaciones, inventario, cobros,
seguimiento, recepción…) · **capacitar dueños de negocio con IA** (Academia AIB y 1:1) ·
**digitalizar negocios** · y **AutoFlow/atención al cliente, que es SOLO una parte**. Todo copy de AIB
(guiones, anuncios, carruseles, decks, emails, textos para empleados) arranca de las cuatro; en un lote,
máximo 1 de cada 4 piezas sobre atención. Fuente: `vault/estilo/ai-borinquen.md` (arriba de todo).

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

## Gasto de IA: el modelo lo escoge la tarea (28/sep/2026)

Elvin: "mira a ver si necesita Opus 5.5 para todo… diseño, desarrollo, planeación no lo vamos a escatimar,
pero hay cosas breves que se pueden automatizar para Sonnet". Real del 28/sep: **Nico $22.25 en un día** (26
corridas, todo Opus 5.5) vs. **Max $1.00** (ya elegía por tarea). Ahora los dos eligen:
- **Nico** → `scripts/nico-gasto.mjs` (`modeloParaNico(texto, origen)`, tests `tests/nico-gasto.test.mjs`):
  Opus 5.5 para construir/diseñar/planear/arreglar producción/briefs largos · Sonnet para diagnosticar,
  consultar y la ronda diaria y el diagnóstico de solicitudes del equipo (solo lectura) · Haiku para trámites
  y el cierre del día. Al aprobar una solicitud (`ok <id>`) la ejecución se reclasifica. `/opus …` fuerza;
  `NICO_MODELO` fija uno. Aviso a Elvin al pasar `NICO_TOPE_DIA` ($15) y al doble; no se bloquea.
- **Max** → `scripts/max-gasto.mjs` (igual, con topes que sí frenan: $10/día, $25/semana).
- **En el servidor** (corren en cada evento, no necesitan criterio): nicho de un lead → Haiku; reportes de
  encuestas, Preguntarle al CRM y el onboarding de AIB → Sonnet. **Siguen en Opus** el Director Creativo
  (`DIRECTOR_MODEL`, es criterio de Elvin sobre piezas) y Max planeando.
- El modelo usado sale en el log de cada corrida (`claude ‹ fin … opus|sonnet|haiku`) y el costo real por
  agente y día está en `/ritmo/agentes`.

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

**Terminan lo que empiezan (26/sep/2026).** Elvin: "Nico le pide diseño a Lola… no se entienden… después que las
hace no las termina". Cada `agentes.mjs mensaje` lleva **⟳ SEGUIR [origen·n]** (el origen real del trabajo lo pone el
puente en `AGENTE_ORIGEN`: `telegram` · `buzon:<id>:<de>` · `solicitud:<id>:<de>` · `aprobada:<id>:<de>` · `slack`);
la **respuesta despierta al que pidió** (`continuarTrabajo` en el puente), que termina y entrega al origen: Elvin por
Telegram, el agente que lo pidió (cierra su pedido), o el diagnóstico actualizado de una solicitud de Carilin/Aure
(solo lectura hasta el OK; `PARA AURE: …` se le manda en su hilo). Un pedido que delegó queda abierto hasta esa
respuesta. Topes: profundidad 3 y `AGENTES_CONTINUAR_MAX_DIA` (20). `--sin-seguir` = aviso sin respuesta. Si una
corrida se queda sin pasos (`error_max_turns`) sigue una vez sola (`correrYTerminar`). Lógica pura en
`scripts/agentes-seguir.mjs` (tests). `atendido` ya no falla con "agente-desconocido" al cerrar solicitudes del equipo.
**Sofi, Lola y Max corren desde un clon de GitHub** (`scripts/agente-nube.sh`, `Dockerfile.puente`, llave
`GIT_SSH_KEY_B64` por referencia a nico): bajan content-os antes de cada pedido y suben solo `data/` y `vault/`
(antes su copia era la de su último deploy: "el kit de marca no existe") y deploy-snapshots ya no sube código viejo.

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
`lib/equipo.ts`. **Guía de flyers de Elvin (26/sep)**: "flyers de calidad, de pocas palabras: un título, bullets de
beneficio, CTA claro, que resalte el producto; minimalista, elegante, Nano Banana Pro" → `node scripts/fal.mjs flyer
--marca <m> --titulo … --bullets 'a|b|c' --cta … --producto … [--foto url] [--logo url]` (valida el copy antes de
gastar: ≤ 8 / 3×6 / 4 palabras, sin "gratis", voseo ni promesas de ingreso; el logo REAL va como última referencia;
prompt puro en `scripts/fal/flyer.mjs`, tests `tests/fal-flyer.test.mjs`, base = el prompt de flyers de Bori). Kits
con logo público en `public/marcas/` (level-up, ai-borinquen, bori, resuelto; isla-run sin logo aprobado): marca sin
kit = sin logo, nunca inventado. Cerebro §3b. Tope por pedido 8 imágenes / 3 videos; lo que viene de otro agente de
parte de Elvin se entrega completo en una vuelta.

## Remi — el Motion Designer (`/motion`, 27/sep/2026)

Elvin: "videos de motion por prompt… como un showreel, a tope". Lola hace IA generativa (deforma
logos y textos); **Remi anima por código** con **Remotion** (React → MP4) y los logos/colores
reales. Taller en **`motion/`** (proyecto aparte con su `package.json`; excluido del `tsconfig` de
Next, de `.vercelignore` y `.railwayignore`): `src/marcas/` (paleta + fuentes; `Coqui.tsx` = el
coquí de Bori por capas con las formas exactas de `logo-color.svg`; `aib.ts` + `CoquiAibVector.tsx` = el **logo v2 de AI Borinquen** (rebranding aprobado 27/sep, vector recreado del PNG viejo) animado por piezas desde `aib-logo.json`, que emite `vault/proyectos/ai-borinquen/marca/logo-generador.py` — ver su `LEEME.md`). **Bori ≠ AI Borinquen**: Bori = agencia de marketing en una plataforma (coquí cobre); AIB = agentes de IA de voz y chat a la medida (coquí de circuitos) — nunca mezclar, `src/kit/` (fx, texto cinético,
teléfono/chat/llamada/calendario/contador), `src/videos/<Video>.tsx` + `.audio.ts`, `src/Root.tsx`.
Audio por prompt: `node motion/scripts/audio.mjs musica|sfx "<prompt>"` (fal: stable-audio-25 /
ElevenLabs sfx v2). Revisión obligatoria con `remotion still` + hoja de contacto antes de entregar.
Entrega: `node motion/scripts/entregar.mjs <mp4> --marca --titulo` → Storage `pulse/motion/<fecha>/`
(link firmado 1 año) + `data/entregas.json` (`agente: "Remi"`, `modelo: "remotion"`). Render de 15 s
≈ 40 s en la Mac (`cd motion && npx remotion render src/index.ts <Id> out/<x>.mp4`; `npm run studio`
para previsualizar). Primer video: `AibRecepcionista` (anuncio, **de usted**) y `AibRecepcionistaTu`
(orgánico), 15 s 16:9. Cerebro `vault/ceo/cerebro-remi.md`. Fase 2: bot de Telegram/buzón.
**Fábrica de anuncios (27/sep):** `motion/src/fabrica/` — cada anuncio es un guion en datos (`anuncios.ts`: marca,
9:16|16:9, escenas tipadas en `tipos.ts`) que dibujan `escenas.tsx` + `temas.tsx` (Level Up / Bori / AI Borinquen,
cada uno con su logo, fuente, registro y música). 16 anuncios de lanzamiento (LU 6 · Bori 5 · AIB 5).
`motion/scripts/render-fabrica.sh [ids]` → `motion/out/fabrica/`; `node motion/scripts/hoja.mjs <id>` = hoja de
contacto para revisar. Audio de marca en `motion/public/audio/<marca>-musica.mp3` (fal, normalizado).
**Remi en la nube (27/sep):** servicio `remi` en Railway (`Dockerfile.remi` + `scripts/remi-nube.sh` +
`motion/servicio/servidor.mjs`, https://remi-production-6765.up.railway.app, `REMI_SECRETO`): baja GitHub, renderiza con
Chrome headless y sube a Storage. `node scripts/remi.mjs render <id>|--guion <json> [--entregar --marca …]`. Guiones en
JSON por la composición universal `Motion` (+ tema de cliente desde JSON: `src/fabrica/cliente.tsx`), así Max produce
motion sin editar código (Max tiene `remi.mjs` y `meta-ads/subir-videos.mjs` en su puente y `REMI_URL/REMI_SECRETO` en Railway). **Paquete (28/sep): clientes de
LU con acuerdo ≥ $3,500 PAGADO COMPLETO de una reciben 2 MOTION GRAPHICS** (en plazos: hasta que termine de pagar) — `remi.mjs render --guion … --cliente <slug>` (marca desde `ficha.marca`
del expediente) `--proponer` (a #max-aprobaciones → Drive + canal). Licencia Remotion: Company License (Automators $100/mes mín.). **Estilos (28/sep)**: `motion/src/fabrica/estilos.tsx` — neon · editorial · impacto · minimal · pop · tecno = plantilla (resaltado, bullets, transiciones, fondo, cierre) + ritmo; la marca fija letra (1 + acento opcional), colores y logo. Campo `estilo` del guion; sin él remi.mjs usa el menos usado entre los permitidos de esa marca (`ficha.marca.estilos` / `ESTILOS_MARCA`) sin repetir en el pedido (skill §1b). Motion de clientes: logo por capas (`logoCapas`), motivo `fibras` y escena `retrato` con sus fotos reales. Skill `.claude/skills/motion-graphics/SKILL.md`; ojo `railway.json` fija el
startCommand del puente para todo el proyecto → la imagen de Remi trae un atajo `scripts/telegram-puente.mjs`.

## Resumen del día por Telegram (27/sep/2026)

Elvin: "todos los días, como a las 8-9 de la noche: cuántas llamadas se agendaron, cuánto en ventas nuevas y
cuánto en renovaciones, Level Up y Borinquen por separado". Cron **`/api/cron/resumen-dia`** diario **8:30 PM PR**
(`30 0 * * *` UTC) → `notificarCEO` (Telegram + espejo en Slack); `?dry=1` devuelve el texto, `?dia=YYYY-MM-DD`
otro día. **Llamadas** = lo RESERVADO ese día en el Calendly de cada marca (`CALENDLY_TOKEN` /
`CALENDLY_TOKEN_AIB`; por `created_at`, onboardings y canceladas aparte; cuadró 9+3 con #office-10-lum-calls el
26/sep). **Ventas** = hojas de tesorería (privadas): LU "COPIA RESPALDO - VENTAS 2026 LEVEL UP" (pestaña "LUM
Sales <Mes> <Año>", de María) y AIB "VENTAS - IA BORINQUEN" (pestaña "<Mes>"); "Tipo de Transacción" = New Sale →
ventas nuevas, lo demás → renovaciones y cuotas; monto = "Valor Neto". Se leen con el Apps Script
`scripts/drive/ventas-hoy.gs` publicado por Elvin (`VENTAS_SCRIPT_URL` + `VENTAS_SCRIPT_SECRETO`); sin él el mensaje
dice "falta conectar la hoja". Lógica pura `lib/resumen-dia.ts` (montos $3.500,00 y $3,500.00, fechas d/m y m/d
autodetectadas; tests `tests/resumen-dia.test.mjs`), datos `lib/resumen-dia-datos.ts`. `TELEGRAM_BOT_TOKEN` se
copió de Railway a Vercel el 27/sep: desde entonces todo `notificarCEO` de Vercel también sale por Telegram.

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
acepta `desde=/ritmo…`). **Dominio oficial: `https://ritmo.levelupmediapr.net`** (26/sep; CNAME `ritmo` →
`cname.vercel-dns.com` + TXT `_vercel` en Network Solutions, verificado en Vercel); `ritmo-eamarket.vercel.app` sigue
funcionando. En `proxy.ts`, `ritmo.*`/`ritmo-*` → `/ritmo` y cualquier ruta ajena vuelve a Ritmo.

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
  Fuentes conectadas hoy: `produccion` y `manual`. **KPIs reportados (28/sep, Elvin; "lo demás quítalo por ahora")**: se anotan
  al marcar salida, número + detalle de texto (`desempeno_reportes.detalles`, migración 0036; ficha de la persona los muestra):
  **Estratega Digital** (así se llama el puesto desde el 30/sep) = reuniones con clientes (con quiénes) · campañas realizadas · planes/investigaciones/creativos APROBADOS listos
  para ejecutar; **Project Manager (Jessica y Ángela, 30/sep)** = onboardings · conversaciones con clientes que respondieron (llamada o
  chat) · casos solucionados · clientes contactados; **AI Engineer (Garrys, 30/sep)** = proyectos nuevos comenzados (AutoFlow,
  sistema nuevo, agente personalizado) · reuniones de onboarding · soporte a sistemas;
  **Diseñador** = flyers/creativos aprobados (cuántos por negocio) · otros diseños; **Coordinadora de Retención y Alianzas (Lis, 30/sep)** =
  referidos conseguidos · conversaciones de seguimiento con potenciales · clientes de churn contactados · de esos, con los que
  conversó · proyectos especiales de EA Market LLC · contactos para alianzas/colaboradores/creadores · reuniones agendadas de
  seguimiento de ventas · cash collected cerrado (US$) · ventas de Bori. **Lis no poncha** (puesto `soloReporte`): en Hoy, en lugar
  del círculo, tiene **"Mi reporte del día"** siempre a la vista (`components/ritmo/reporte-diario.tsx`, `guardarReporteDiaAction`,
  hoy o ayer, se corrige reemplazando; `errorReporteDia` exige todos con número); su "asistencia" = si reportó (hoy queda
  pendiente); si a las 6:45 PM no lo ha llenado, el cron `recordatorio` se lo pide. Nacen con peso 0 (se miden, no puntúan)
  hasta que les pongan meta y peso en Ajustes (`KPIS_REPORTADOS` en `lib/desempeno/reglas.ts`). Fase 2: Meta (registro de actividad), n8n (alertas
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
- **Tiempo libre** (`lib/desempeno/rrhh.ts`, tests `tests/rrhh.test.mjs`): **8** días/año acumulados por mes
  desde el ingreso, se solicitan a los 12 meses; enfermedad **5**/año con certificado (si no → vacaciones);
  maternidad **30** por evento (subidos el 27/sep, antes 7/3/15); lo que no alcance = sin paga. **Tope de 8 días acumulados** y se cuenta desde las **últimas vacaciones** (30/sep, Elvin: "lo más
  que han podido acumular son ocho días"; `desempeno_fichas.ultimas_vacaciones`, migración 0041, "Últimas vacaciones (día que volvió)"
  en la ficha; `saldos(…, ultimasVacaciones)`). RR.HH. registra las ausencias. Aviso de 12 meses:
  banner en Hoy/ficha + cron `?tarea=aniversarios` (diario 9 AM PR, a la persona y a RR.HH./Carilin).
- **Nómina estimada** del mes siguiente: salario + ajustes (`desempeno_ajustes`) − días sin paga.
- **Solicitudes** (`/ritmo/solicitudes`, `desempeno_solicitudes`, `lib/desempeno/solicitudes.ts`): día libre,
  vacaciones, permiso programado, carta/documento u otra petición → su **supervisor** (lider_id) aprueba (o
  Elvin) → **RR.HH.** firma (la maestra). RR.HH. NO se salta al supervisor (`puedeDecidir`). Al firmar un día
  libre/vacaciones/permiso con días se registra la ausencia sola. Numerito de pendientes en el menú; avisos
  por Slack (bot) solo con `DESEMPENO_AVISOS=real`.
- **Empresa** (`desempeno_perfiles.empresa`: `level_up` | `ai_borinquen`): misma plataforma, separado. La
  pone RR.HH. (Ajustes o alta); al empleado NUNCA se le pregunta ni ve la etiqueta. Filtro en Equipo y
  Personas; etiqueta coral "AI BORINQUEN" en la vista maestra.
- **Alta de empleado nuevo** (al firmar contrato; `lib/desempeno/alta.ts`): Personas → "Nuevo empleado"
  (nombre, correo, empresa, puesto, supervisor, ingreso, salario) → link de bienvenida (72 h). La persona
  crea su clave y llena su ficha en `/ritmo/bienvenida` (foto, teléfonos, ciudad/país, documento, contacto
  de emergencia, identificación obligatoria, contrato firmado). Mientras no la complete
  (`fichaPendiente`: sin `completada_at` ni teléfono), el layout la trae ahí.
- **Comunicación ENCENDIDA (26/sep, `DESEMPENO_AVISOS=real`)**, siempre desde el bot Command Center
  (`lib/desempeno/avisar.ts`): solicitudes (al supervisor, a RR.HH. y al empleado cuando se decide),
  digest L-V 9:30 AM a `RITMO_AVISO_A` (Carilin + Yaileen) con lo de ayer + solicitudes por firmar + fichas
  sin completar, recordatorio L-V 6:45 PM a quien sigue con la entrada abierta, aniversario de 12 meses
  y resumen semanal a Elvin. El bot no busca por correo: cada perfil tiene `slack_id` (se busca solo por
  nombre al guardar/alta; "sin Slack" en Ajustes = ponerlo a mano).
- **Ritmo reemplaza al agente de RR.HH. de n8n** ("SofIA" + "Procesar Vacaciones", APAGADOS el 26/sep
  con OK de Elvin: leían Monday y avisaban a Luis). `node scripts/n8n.mjs desactivar|activar <id>`.
- **Seguridad (revisión 26/sep)**:
  - **`solo_ritmo`** (`desempeno_perfiles`): quien entra por Ritmo (alta, o perfil creado a alguien sin clave)
    NO usa Pulse. `requiereUsuario()` de Pulse, `boardsVisibles`/`puedeVerBoard`, Leads (`accesoLeads`) y el
    layout de Pulse lo bloquean; Ritmo usa `requiereCuenta()`. Lo cambian la dirección y RR.HH. en Ajustes
    ("También puede entrar a Pulse"; desde el 28/sep RR.HH. también, y como es sensible espera el OK de Elvin). Yaileen (RR.HH.) = solo Ritmo (perfil inactivo, sin ponche).
  - **Links de acceso** (`lib/desempeno/acceso.ts`): exigen perfil activo en Ritmo; RR.HH. solo para quien
    NO tiene clave (resetear clave = admin/editoras); `estaBloqueado` (Juan David + `RITMO_BLOQUEADOS`) no
    recibe link, alta ni aparece en listas. El alta no reutiliza cuentas que ya tienen clave.
  - **Archivos**: tipos permitidos por categoría y por extensión (`tipoPermitido`; nada de html/svg/js), el
    tipo que se guarda y se sirve sale de la extensión, lo que no es foto/PDF/video se descarga, URL firmada de
    5 min, `nosniff` + CSP sandbox en el servido local.
  - **Cabeceras**: `/ritmo/*` con la misma CSP estricta, `X-Frame-Options: DENY` y Permissions-Policy de Pulse.
  - **Slack**: el texto de empleados va escapado (`esc` en `avisar.ts`/`avisos.ts`) — sin menciones ni links falsos.
- **Segundo paso de la vista maestra** (26/sep, `lib/desempeno/dos-pasos.ts` + `totp.ts` puro, tests `tests/totp.test.mjs`):
  Elvin, Carilin, Aure y RR.HH. entran con un código de Google/Microsoft Authenticator (`/ritmo/verificar`, QR la
  primera vez; secreto cifrado AES-GCM en `desempeno_dos_pasos`, migración 0016). Dispositivo recordado 30 días (cookie
  `ritmo-2fa`, se invalida si cambia la clave/sesiones), 5 fallos = 15 min. Sin el segundo paso no hay vista maestra ni
  se decide nada (`usuarioRitmo().falta2fa`). Teléfono perdido: "Reiniciar" en Ajustes (admin) o
  `node scripts/ritmo-2fa.mjs estado|reset <email>`.
- **Tope de archivos**: foto 10 MB, documentos 25 MB, videos de entrenamiento 50 MB (`limiteBytes` en `fichas.ts`), verificado
  con el tamaño REAL en Storage al confirmar (si se pasa, se borra). El bucket `pulse` está en 50 MB: es el tope del plan
  de Supabase; videos más grandes = plan Pro o comprimirlos.
- **Carreras** (`/ritmo/carreras`, 26/sep; tablas `desempeno_vacantes` y `desempeno_postulaciones`, migración 0018;
  reglas puras en `lib/desempeno/carreras-reglas.ts`, tests `tests/carreras.test.mjs`, datos en `lib/desempeno/carreras.ts`):
  RR.HH./maestra publica vacantes cuando surge una oportunidad (título, empresa —solo la ve la maestra—, departamento,
  modalidad, descripción, requisitos, salario opcional, bono por referido, abierta/pausada/cerrada). Cualquiera del
  equipo **aplica** (crecer o cambiar de puesto; una vez por vacante, solo RR.HH. lo ve) o **refiere** a alguien
  (nombre + correo o teléfono, por qué; sin auto-referirse ni duplicados). RR.HH. mueve cada caso (recibida → en revisión
  → entrevista → seleccionado → onboarding completo | no seleccionado | retirada). **Bono**: referido + onboarding
  completo → US$100 (o el de la vacante) entra solo como ajuste a la nómina del mes siguiente del que refirió, una sola
  vez (`bono_ajuste_id`). Avisos por Slack a RR.HH. (nuevo caso) y a la persona (cada cambio). Pestaña "Carreras" con
  punto verde si hay vacantes de los últimos 7 días (en el teléfono de la maestra se entra desde Hoy).
- **Equipo digital** (`/ritmo/agentes`, 26/sep; tabla `desempeno_agentes_reportes`, migración 0019; puro en
  `lib/desempeno/agentes-ia.ts` + tests `tests/agentes-ia.test.mjs`; datos `lib/desempeno/agentes-reportes.ts`):
  Elvin: "que mis agentes al final del día hagan un reporte… comparar cómo producen los empleados digitales contra
  los humanos". Solo **admin/editoras con 2 pasos** (Elvin, Carilin, Aure; RR.HH. no). Registro `AGENTES_IA`
  (Sofi, Nico, Max, Lola, Iris, Leo) con su puesto humano equivalente. Entra por `POST /api/ritmo/agentes`
  (CRON_SECRET; público en proxy) o `node scripts/agentes.mjs reporte --resumen … --tareas N --entregables "a|b"
  --bloqueos …`. El **puente** (`telegram-puente.mjs`: `sumarJornada` + `cierreLoop`) mide solo corridas,
  minutos y costo real de IA (delta por sesión) y a las 6:30 PM PR (`CIERRE_HORA`) le pide al agente su cierre y
  manda las métricas; día sin actividad = "Sin actividad hoy". Leo suma 1 tarea por pieza revisada
  (`/api/slack-eventos`); Iris hace su cierre en su ronda (`.claude/commands/iris.md` §6). Comparación 7 días por día
  activo: humanos = horas del ponche, tareas del tablero Producción, costo = salario ÷ 21.7; "—" si falta el dato.
  **Oficina virtual** (28/sep, Elvin: "una oficina: cada uno su cubículo, su computadora… un área con TV, una sala de ping
  pong"): arriba de `/ritmo/agentes`, a lo ancho (`components/ritmo/oficina.tsx`): open space con un cubículo por agente (la
  pantalla = 1.ª idea de su reporte, `pantalla()`; burbuja con lo último que dijo en el buzón, `ultimosMensajes` + `burbuja()`),
  sala con TV (tareas, minutos y costo de hoy) y sofá, y ping pong; `estadoOficina()`: trabajó hace < 15 min = en su computadora,
  trabajó hoy = en su escritorio, nada hoy = descansando (los 2 primeros al ping pong, el resto al sofá). Tocar = panel con el
  reporte completo. Se refresca cada minuto. **Ala ejecutiva** (Elvin: "Carilin y Aure le piden a los agentes, yo apruebo"): oficina
  del **CEO** (la más grande, aura dorada, pizarra con lo que espera su OK, monitor grande, sofá), la de **Aure** pequeña al lado y
  la de **Carilin** (Directora de Operaciones) lejos, junto a la sala; cada quien aparece (silueta) solo mientras mira la página
  (`desempeno_presencia`, migración 0035, < 2 min), si no la silla queda vacía. Debajo, "Hoy, uno por uno" y la tabla de 7 días
  van compactas (Elvin: "más pequeño, más friendly").
  **Ping pong con marcador** (a 11, "va ganando X") y **Rincón del café**: "☕ Invitar a un café" abre un chat con el agente
  (mensaje a su buzón `agentes_mensajes` con la marca `MARCA_CAFE`; su respuesta sale en la conversación al refrescar). Misma
  regla que el buzón: Elvin habla con Sofi, Nico, Max o Lola; Carilin y Aure solo con Nico (va por su flujo con el OK de Elvin).
  **Sofi y Leo medidos en Vercel** (28/sep): `sumarUsoIA` suma corrida, tiempo y costo real (`costoDeUso` × `PRECIOS_MTOK`) de
  cada respuesta de Sofi (Slack, Telegram, /pedir) y cada revisión de Leo. **La Mac ya no firma como Sofi** (28/sep):
  `agentes.mjs` sin `PUENTE_BOT`/`AGENTE` = "mac" ("Claude (Mac)"); en Railway el servicio de Sofi (sin PUENTE_BOT) sigue
  siendo Sofi por `RAILWAY_SERVICE_NAME`; una rutina de Sofi en la Mac pone `AGENTE=sofi`.
  **Trabajo de un agente hecho desde la Mac** (una sesión de Claude trabajando como Max, Lola, Remi…; Elvin 28/sep: "que Remi,
  Lola y cualquier agente reporte lo de la Mac"): no pasa por su bot → `node scripts/reportar-mac.mjs <agente> "qué hiciste"
  --tareas N --entregables "a|b"` al terminar (se AÑADE al reporte del día; dentro de un bot, `PUENTE_BOT`, no hace nada para no
  duplicar el cierre). Remi lo hace solo al entregar (`motion/scripts/entregar.mjs`, `remi.mjs --entregar|--proponer`); los
  comandos de Lola (`/crear-contenido`, `/atender-pedidos`) y Max (`/meta-ads`) lo piden al final. Remi está en `AGENTES_IA`
  (se compara con Editor de video).
- **Noticias** (`/ritmo/noticias` + las últimas 3 en Hoy, 26/sep; tabla `desempeno_noticias`, migración 0020;
  `lib/desempeno/noticias.ts`, categorías en `noticias-tipos.ts`): logros del equipo (con persona → le avisa por Slack),
  noticias, comunicados (se pueden fijar arriba) y causas benéficas. Publica/fija/borra la vista maestra; lo ve todo el
  equipo. Breve a propósito (sin comentarios ni reacciones). En Hoy la maestra tiene accesos directos (Equipo, Personas,
  Agentes, Carreras, Noticias, Solicitudes): en el celular no caben todas las pestañas.
- **Bienestar** (`/ritmo/bienestar` + tarjeta en Hoy, 26/sep; tabla `desempeno_bienestar`, migración 0021; puro en
  `lib/desempeno/bienestar-reglas.ts` + tests `tests/bienestar.test.mjs`): la parte wellness (~15 %), voluntaria, privada y
  **fuera del score**. Pausa activa de ~5 min guiada (7 rutinas de escritorio, una por día, temporizador; al terminar se
  marca sola), anotar ejercicio (meta OMS 150 min/semana; pausas cuentan; tope 600 min/día), energía del día (1-5) y reto
  del equipo (solo agregados; la energía la ve la maestra solo con ≥ 5 respuestas). **Comunidad** (migración 0022, tablas
  `desempeno_bienestar_social|posts|reacciones`): opcional — solo quien se une aparece y solo quien se une la ve (la
  maestra también, para moderar): tablero de la semana (minutos, activo hoy), actividad del grupo, mensajes ≤ 280 con
  reacciones 💪🔥👏 (una por persona). La energía nunca sale ahí. Salir = desaparece de inmediato. **Red social (27/sep, Elvin: "que sea como una red social… escribirle a los
  compañeros, interactuar los logros, comentarle")**: la Comunidad va PRIMERO en Bienestar; publicar al grupo o "Para"
  un compañero (saludo → DM del bot con el mensaje), **comentarios** (`desempeno_bienestar_comentarios`, ≤ 200, aviso al
  autor), reacciones 💪🔥👏❤️ y **logros automáticos** (`tipo: logro`, `clave` única por semana: meta de 150 min y 5 días
  de pausa seguidos, `logrosDeLaSemana` + `revisarLogros` tras anotar) que el equipo aplaude y comenta. Migración 0026.
  Chatbot: Elvin lo planteó el 26/sep;
  se dejó para después de ver 2-3 semanas de preguntas reales a RR.HH.
- **Viajes** (`/ritmo/viajes`, 27/sep; tablas `desempeno_viajes_plan` y `desempeno_viaje_anual`, migración 0025; puro en
  `lib/desempeno/viajes-reglas.ts` + tests `tests/viajes.test.mjs`; datos `lib/desempeno/viajes.ts`): **OCULTO al equipo —
  solo Elvin (admin con 2 pasos) lo ve** hasta que él decida abrirlo (página, acceso en Hoy y acciones). Planificar
  vacaciones (local · dentro del país · internacional, destino/fechas/presupuesto, cuenta regresiva) y "Pedir estas
  vacaciones" → solicitud normal. **Viaje del año por mérito** (pasajes + hospedaje hasta un tope): califica quien tiene
  ≥ 6 meses, ≥ 20 días marcados e índice ≥ 90 (40 % asistencia + 60 % desempeño; sin score, solo asistencia); la
  dirección escoge al ganador entre los que califican (validado en el servidor) → Noticia fijada + aviso. Para abrirlo al
  equipo: volver a poner la tarjeta en Hoy, la pestaña en `nav.tsx` y cambiar los gates `rol === "admin"`.
- **Ponche de la dirección** (27/sep): Elvin, Carilin y Aure (admin/editoras) ven en Hoy el mismo ponche que todos, con la
  nota "no tienes que marcar"; es opcional (`estadoPonche(id, opcional)` + `entrarAction` sin perfil). Sin perfil sus
  ponches no salen en Equipo, recordatorios ni reportes (todo eso sale de `desempeno_perfiles`).
- **Empresa** (`/ritmo/empresa`, 27/sep, Elvin: "van a entrar… una plataforma completamente vacía"): Quiénes somos · El
  equipo (directorio en vivo de los perfiles activos, cada empleado ve solo su empresa, iniciales sin foto) · Recursos ·
  Políticas · Preguntas. Tabla `desempeno_empresa` (migración 0027; `empresa` todas|level_up|ai_borinquen, `publicado`),
  editable por la dirección (Elvin, Carilin, Aure; lápiz / "Agregar", formato sencillo sin HTML: viñetas, **negrita**, [link](url)).
  **28/sep (Elvin):** la madre es **EA Market LLC**; cada empleado ve SOLO su empresa (el texto de LU no nombra a AIB ni al revés;
  test en `tests/empresa.test.mjs`) y solo admin/editoras ven las dos (RR.HH. no). LU nace en 2024 (Elvin en marketing y ventas
  desde 2021) y su visión es **AI first** (marketing digital 100 % con IA → empresa de tecnología); AIB nace en 2026 porque los
  dueños no contestaban sus mensajes y hoy digitaliza los negocios de PR con agentes personalizados.
  Semillas solo con datos confirmados (`SEMILLAS_EMPRESA` en `lib/desempeno/empresa-reglas.ts`, tests
  `tests/empresa.test.mjs` verifican que las políticas cuadren con `POLITICA`/`BONO_REFERIDO`); **Misión y Valores de LU
  son BORRADOR** hasta que Elvin los apruebe. Pestaña en escritorio + tarjeta "Conoce la empresa" en Hoy.
- **Seguridad del ponche** (27/sep, Elvin: "que no puedan evadir o engañar el sistema"): solo se poncha (entrada, salida,
  almuerzo) desde una **computadora registrada y aprobada** (`desempeno_dispositivos`, migración 0028; cookie httpOnly
  `ritmo-equipo` de 400 días con token → sha256 en la base; huella del navegador + red para reconocerla si borran cookies) y
  desde una **red aprobada** (IPv4 exacta, IPv6 por prefijo /64: `redDe`). La primera computadora queda aprobada al
  registrarla con su red; una segunda (laptop + desktop), un reemplazo o una red nueva → **RR.HH. (Yaileen) autoriza** en
  `/ritmo/seguridad` (aviso por Slack). Teléfonos/tablets no se registran ni ponchan. **Desde el 29/sep tampoco la app instalada ni el iPad** (Safari se presenta como Mac): `pistaEquipo()` en el navegador + `noEsComputadora()` en el servidor, para TODOS (también la dirección y aunque el modo sea "aviso"); en el teléfono/app, Hoy muestra `FueraDeComputadora` (con ponche manual) en vez del círculo. Fuera de su computadora: **ponche
  manual** (`desempeno_ponche_manual`, hasta 3 días atrás, con motivo) que RR.HH. autoriza (crea la entrada o cierra la
  abierta; `manual_por`). La dirección (admin/editoras) queda fuera. `RITMO_SEGURIDAD` = on (default) | aviso | off.
  Reglas puras `lib/desempeno/seguridad-reglas.ts` (tests `tests/seguridad-ponche.test.mjs`), servidor `seguridad.ts`,
  UI `components/ritmo/seguridad.tsx`. Solo bloquea el PONCHE: el resto de Ritmo se abre desde cualquier lado.
- **Almuerzo** (27/sep): 1 hora que escoge cada quien entre las **11:00 AM y las 2:00 PM PR**; "Salir a almorzar" cierra el
  tramo con `motivo_salida = almuerzo` y volver = entrar (el tiempo de almuerzo no cuenta como horas). Una vez al día;
  más de 65 min se pinta en ámbar (`duracionAlmuerzo`).
- **Arena · ventas** (`/ritmo/arena`, 27/sep; diseño `vault/proyectos/ritmo/arena-ventas.md`; puro en `lib/ventas/reglas.ts` +
  tests `tests/ventas.test.mjs`; datos `lib/ventas/datos.ts`; acciones `app/ritmo/arena-actions.ts`; migración 0030, tablas
  `desempeno_ventas_diario|goals|bonos|alias`): closers, setters y chatters de LU y AIB (puestos `closer|setter|chatter|
  director_ventas` en `PUESTOS`, `sinPonche`: no ponchan, no salen en Equipo; su Hoy = **Mi marcador**). Ventas = la pestaña del
  mes de la hoja de tesorería por el mismo Apps Script del resumen del día (`VENTAS_SCRIPT_URL`; sin él la Arena dice "no está
  conectada"), columnas buscadas por nombre (fecha, tipo, monto cobrado, método/pasarela, closer, setter, chatter, valor neto),
  caché 5 min. **Comisiones de Nahuel** (mes completo, sobre cobrado − pasarela: Stripe/PayPal/ATH 3.5 %, Klarna y FanBasis 4.5 %): closer
  7 %, con show-up ≥ 60 % → 8/9/10 % con cierre ≥ 25/30/35 % (show-up y citas del diario del closer; cierres = ventas nuevas de la
  hoja); setter 4 % de lo que agendó; chatter 4 %, 5 % con > 200 agendas propias (de Leads `agendo_por`, si no del diario).
  Carrera por rol (cash collected, sin comisiones), metas del equipo (`METAS`: LU $150K total / $100K nuevas / $35K semana; AIB
  $30K), alerta roja/ámbar del día, meta personal, diario (hoy o ayer). Comisión privada: cada quien la suya; el director de
  ventas y la dirección (Leads: AIB solo Elvin/Aure) ven la tabla de todos. **Bonos**: el director los crea → SOLO Elvin autoriza
  → el director marca ganador → Elvin aprueba el pago (ajuste de nómina si tiene ficha). Nombres de la hoja ≈ Pulse por
  `mismaPersona` (primer nombre + resto en orden); si no cuadra, fila en `desempeno_ventas_alias`. **28/sep (Nahuel):** la 2.ª
  cuota comisiona (para quien sale en su fila); el **show-up de los closers sale del CRM** (Leads → CLOSERS: etapa del lead tras
  cada cita; "Llamada agendada" ya pasada = sin marcar, se le recuerda; sin citas marcadas → diario; `resultadoCita` +
  `citasDelMes`); **Laura vende en las dos marcas** (`desempeno_perfiles.tambien_en`, migración 0031, "También vende en" en
  Ajustes); Joaquín es **setter** (Elvin, 28/sep; antes estaba como closer). Pendiente: la planilla de Excel de Nahuel para las agendas de los chatters.
  **KPIs del diario por puesto (Elvin, 28/sep; `KPIS_VENTAS`, `desempeno_ventas_diario.kpis`, migración 0037)**: setter =
  llamadas realizadas · conectadas · agendadas · show · no show; chatter (Ana Cecilio, Dilan) = conversaciones (personas que
  hablaron contigo) · pases (le sacaste el número y lo pasaste a llamada) · citas agendadas · show · no show; closer (Laura,
  Roger; Paola por dar de alta) = demos · cerradas · no cerradas + cash collected de la hoja. Cada quien los anota en
  Mi diario (con "Este mes"); el director y la dirección ven "KPIs del equipo · este mes" por puesto. Los campos viejos
  (conversaciones/agendas/presentaron) se llenan desde estos (`camposViejos`) para la comisión y el show-up de respaldo.
  **Planilla de chatters en Ritmo (6/oct, Elvin: "me gustaría que tenga todo esto Ritmo")**: el diario del chatter trae TODO lo de
  `planilla_chatters_levelup.xlsx` (Drive): conversaciones, calificaron, no califica, seguimiento, mitad de conversación, propuesta
  de agenda, link enviado, derivados (= `pases`), agendas, show, no show y **ventas/collections atribuidas (US$, `dinero`)**; los %
  (calificado, agenda, mitad, propuesta, link; conexión del setter; close rate) salen solos (`TASAS_VENTAS`/`tasasVentas`). Se cargó
  su historial (Ana 9/4–10/5, Dilan 9/21–10/3; cuadra con el Resumen: Ana 645 conv · $50,496 · $37,896) sin pisar lo ya anotado en
  Ritmo. **Rangos** en Mi diario, KPIs del equipo y Ranking: Hoy · Ayer · 7 días · 30 días · Este mes · Mes pasado (`?r=`,
  `rangoFechas`); comisiones y carrera siguen siendo del mes. La planilla de setters ("Producción Setters") no se ha pasado.
  **Pase entre dominios** (`/api/pase?a=ritmo|leads|pulse` → `/api/pase/recibir`, `lib/pulse/pase.ts`, tests `tests/pase.test.mjs`):
  Leads, Ritmo y Pulse son dominios distintos y la cookie no viaja; Roger y el equipo caían en el CRM al ir a Ritmo (el proxy de
  `leads.*` mandaba todo /ritmo a Leads). Ahora "Ir a Ritmo" (Pulse) y "Leads/Pulse" (Ritmo) firman un pase de 60 s y un solo uso
  (nonce en `pulse_security_log`) y la persona llega con su sesión; en `leads.*`, /ritmo → el pase. Solo con sesión real de Pulse.
  **Arena rediseñada (6/oct, Elvin: "muy simple, no se ve pro… más visual, animada, interactiva")**: piezas vivas en
  `components/ritmo/arena-vivo.tsx` (números que cuentan, anillos, avatares por nombre, mini-gráficas, barras con meta, podio,
  confeti; todo respeta prefers-reduced-motion; CSS `.arena-*` en globals.css): marcador del equipo con el selector de rango
  global arriba · Mi marcador (anillo de la meta personal + escalera de comisión) y Mi diario (−/+, % en vivo, confeti) primero
  para el vendedor · Pulso del diario por puesto (`pulso` en `armarArena`, suma por día) · Carrera con podio y pestañas ·
  Ranking con barras vs `METAS_DIARIAS` · KPIs del equipo como mapa de calor. Avisado el equipo por DM (Laura = Slack Connect:
  borrador para que Elvin lo mande).
  **Ranking de ventas** (30/sep, Elvin; sección `#ranking` de la Arena, solo director/dirección: Nahuel, Aure, Elvin): promedio por
  día con diario vs. `METAS_DIARIAS` — setter 125 llamadas (rojo < 100), 30 conectadas, 3–5 agendas; chatter 20–30 conversaciones
  (mín. 15), 5–10 pases, 3–5 agendas — y close rate de closers (`CLOSE_RATE`: < 20 % rojo, 20–30 amarillo, 30 súper, 40 élite =
  candidato a bono), con nivel y recomendaciones (`rankingVentas` en `lib/ventas/reglas.ts`, tests en `tests/ventas.test.mjs`).
  **Metas del director (30/sep, Elvin)**: Nahuel (LU) tiene escalones de **$50K / $75K / $100K en ventas NUEVAS cobradas en el mes**
  (solo New Sale; nada de renovaciones, upsells, mensualidades ni lo que cobra tesorería). Es referencia, no tarea: una línea
  pequeña al pie de "Meta del equipo" en la Arena (`ESCALONES_DIRECTOR` + `escalones` en `lib/ventas/reglas.ts`) con cuánto falta
  para la siguiente; sin la hoja conectada solo muestra las metas.
- **Calendario de ausencias** (`/ritmo/calendario`, 28/sep; puro en `lib/desempeno/calendario-reglas.ts` + tests
  `tests/calendario.test.mjs`, datos `lib/desempeno/calendario.ts`): mes en cuadrícula + lista de quién está fuera (ausencias
  aprobadas + solicitudes en curso con borde punteado). Elvin: "los estrategas no se pueden ir dos a la vez" → `TOPE_FUERA`
  (`estratega: 1`, por empresa): si ya hay uno APROBADO en esas fechas, no se puede pedir (el formulario lo avisa en vivo con
  `revisarFechasAction`) ni aprobar; si solo hay otro pedido en curso, se avisa. Días con choque en rojo. El motivo (vacaciones,
  enfermedad…) solo lo ve la vista maestra; el resto ve "Fuera"/"Pedido" de su empresa. Link en Solicitudes y en Hoy (maestra).
- **Cambios con aprobación de Elvin** (28/sep, Elvin: "editar manual con aprobación mía"; `lib/desempeno/cambios-reglas.ts` puro +
  tests `tests/cambios.test.mjs`, `cambios.ts`, tabla `desempeno_cambios`, migración 0032): cuando Carilin, Aure o RR.HH. guardan en
  Ajustes o en la ficha, lo **sensible** (puesto, empresa, también-vende-en, supervisor, activo, acceso a Pulse, contrato, salario)
  queda **pendiente** y a Elvin le llega `notificarCEO`; lo menor (horario, días, teléfono, notas) se aplica ya. Perfil nuevo = todo
  espera. Elvin aprueba/rechaza en Ajustes → **Por aprobar** (se aplica sobre cómo está HOY la persona) y quien lo pidió recibe
  el aviso por Slack. Elvin (admin) aplica directo. El alta de empleado nuevo sigue directa. Puesto nuevo **Tesorera**
  (`tesoreria`, Finanzas: María García); Ajustes ya no arranca en "estratega" (así quedó mal María).
- **Cambios menores sin Nico** (29/sep, Elvin: "que Yaileen pueda hacer cambios menores manualmente"): en Ajustes, la
  vista maestra **crea puestos** (pestaña Puestos → `crearPuestoAction`; tabla `desempeno_puestos_extra` creada en runtime
  por `lib/desempeno/puestos-extra.ts`, id `p_<slug>`, nacen sin KPIs; `usuarioRitmo()` los registra en `PUESTOS` con
  `registrarPuestosExtra`) y **corrige el nombre** de una persona directo (`datos.cambiarNombre`, evento "nombre"). Asignar
  el puesto sigue siendo sensible (espera a Elvin).
- **Alerta de las 10 AM y KPIs obligatorios** (29/sep, Elvin): cron `/api/cron/ritmo?tarea=sin-ponche` (L-V 10 AM PR, `0 14 * * 1-5`)
  → a RR.HH. (`avisarRrhh`, Yaileen) la lista de quien no ha marcado entrada (le tocaba, sin ausencia aprobada) para que les
  pregunte directo si están trabajando o necesitan ayuda para entrar. Y **no se marca la salida sin los KPIs del día**
  (`faltanEnSalida`, puro + test): cada KPI manual del puesto necesita un número (0 vale) y el detalle si es > 0; lo
  reportado en una salida anterior de hoy cuenta. El almuerzo no pide nada.
- **Claves sin depender de Elvin y ponche sin la red** (30/sep, Elvin: "Yaileen puede hacer ajustes… la app se está haciendo
  dependiente de mí"): **Cambiar mi clave** (`/ritmo/clave`, llave del encabezado, `cambiarMiClaveAction`: clave actual + nueva,
  cierra las otras sesiones) para todos; y en Ajustes, si la persona ya tiene clave, **"Olvidó su clave: link para una nueva"**
  (`linkAccesoAction(userId, true)`) — RR.HH. también, solo para miembros (nunca admins/editoras); el link limpia los intentos
  fallidos. **La red ya no bloquea el ponche** (`decisionPonche` → `redNueva`, evento `ponche-otra-red`): el 29-30/sep casi todos
  pidieron ponche manual porque la IP de la casa cambia (VPN, hotspot, apagón, el proveedor la rota); lo que manda es la
  computadora registrada y aprobada (teléfono, tablet y app siguen fuera). Pero (Elvin: "tienen CRM y datos; no se pueden
  conectar de cualquier wifi"): cada quien declara su **Wi-Fi principal** en Hoy (`desempeno_perfiles.wifi_principal`,
  migración 0040, `guardarWifiAction`), una red nueva **avisa a RR.HH.** (`avisarRedNueva` con `after()`: una vez por red y
  máx. 1 por persona al día; se aprueba en Seguridad y no vuelve a avisar) y la persona ve el recordatorio de proteger los
  datos (`AvisoRedNueva` + toast `TEXTO_RED_NUEVA`).
- **Ranking y reportes** (30/sep, Elvin: "por la mañana ver lo de ayer… y mensual un ranking hasta el 100 con lo bueno, lo malo y
  qué mejorar"): `/ritmo/ranking` (vista maestra; en "Más" y en Hoy) con **Ayer** (último día laborable: entrada · almuerzo · salida,
  TODOS los KPIs con su detalle y bloqueos, por departamento, sin hacer clic) y **Mes** (índice 0-100 = 30 % asistencia · 20 %
  constancia de KPIs · 50 % producción vs. el mejor de su mismo puesto; sin KPIs = solo asistencia; bueno/malo/mejorar). Puro en
  `lib/desempeno/ranking.ts` (tests `tests/ranking.test.mjs`), adaptador `ranking-datos.ts`. **Racha baja** = 3+ días laborables
  seguidos sin marcar, > 30 min tarde o sin KPIs → alerta en Ranking, en el "Reporte de hoy" de Equipo y en el reporte diario
  (`?tarea=reporte`, L-V 7:30 PM PR a RR.HH.; `lib/desempeno/reporte-dia.ts`). Mensual: `?tarea=ranking-mes` (día 1, 9 AM PR) →
  RR.HH. + Carilin. Equipo: gráfica de KPIs por persona (`components/ritmo/grafica-persona.tsx`) y **sin horas trabajadas** (solo
  entrada, almuerzo y salida; `DiaPersona.almuerzo`).
- **Alertas de rendimiento** (30/sep, Elvin: "no catalogues baja producción un día malo; busca rachas"): día malo = sin marcar,
  > 30 min tarde, sin KPIs/en 0, o **baja producción** (< 50 % de la mediana de SUS días con producción; necesita 5 días de historia).
  🟡 = 2+ días malos seguidos · 🔴 = 4+ días malos en el mes (`alertaRendimiento` en `lib/desempeno/ranking.ts`, tests). Salen en
  Ranking → Ayer y en el reporte de las 7:30 PM a RR.HH. (Yaileen, todas); a **Carilin** le llega un DM solo el día que nace la
  alerta: amarillas y rojas de Project Managers (Jessica, Ángela) y estrategas, rojas de cualquiera (`vaACarilin`).
- **Ficha completa de todos** (28/sep, Elvin: "todo el mundo debe tener todos los datos llenos, incluyendo fotos"):
  `faltantesFicha` (puro, `lib/desempeno/ficha-completa.ts` + tests) = foto, teléfono, ciudad y país, documento, contacto de
  emergencia, identificación y contrato. Aviso ámbar en Hoy con lo que falta → `/ritmo/bienvenida`, que ya no es solo para
  nuevos: sirve para "completa lo que falta" (pre-llenado con lo que había); ahora exige foto y contacto de emergencia. Se le
  creó ficha vacía a todo perfil activo que no tenía (12 personas, 28/sep) → al entrar, Ritmo los lleva a completarla.
- **Mi día · Google Calendar** (28/sep, Elvin: "que conecten el calendario de su correo corporativo… y lo anoten ahí mismo";
  puro en `lib/desempeno/google-cal-reglas.ts` + tests `tests/google-cal.test.mjs`, servidor `lib/desempeno/google-cal.ts`, tabla
  `desempeno_google`, migración 0034): cada persona toca "Conectar" en Hoy (`/ritmo/google/conectar` → Google → `/ritmo/google/volver`,
  state firmado + misma sesión), ve lo de hoy de su calendario principal (sin cancelados ni rechazados, con link de Meet) y **Anota**
  eventos o recordatorios de todo el día en SU calendario (`anotarCalendarioAction`). Solo se guarda el refresh token cifrado; se
  desconecta cuando quiera (revoca). **Necesita la app de Google** (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` en Vercel; Calendar
  API activada; redirect `https://ritmo.levelupmediapr.net/ritmo/google/volver`); sin ellas la tarjeta no sale.
- **App en el teléfono + push, sin App Store** (29/sep, Elvin: "apps sin App Store ni Play Store con push"): PWA + Web Push
  (VAPID, sin Firebase). Manifest `app/ritmo/manifest.webmanifest/route.ts` (íconos PNG de `app/ritmo/iconos/[archivo]` —
  192/512/maskable/badge, estáticos en el build— + `app/ritmo/apple-icon.tsx`, todo desde `iconos/dibujo.tsx`), service worker
  `public/ritmo/sw.js` (scope `/ritmo`, público en proxy, `Service-Worker-Allowed` en next.config; NO cachea páginas: datos
  sensibles), suscripciones en `desempeno_push` (migración 0038, columna `app` para reusar en la app de clientes de LU),
  envío en `lib/push/enviar.ts` (borra 404/410) y **todo aviso de `avisarPersona`/`avisarCorreo`/`avisarRrhh` sale además
  como push** (texto de Slack → título/cuerpo/ruta con `lib/push/texto.ts`, puro, tests `tests/push.test.mjs`). Pantalla
  **`/ritmo/app`** (ícono 📱 del encabezado): guía por plataforma (iPhone: Safari → Compartir → Agregar a inicio, iOS 16.4+;
  dentro de WhatsApp/IG → "ábrelo en Safari/Chrome"; Android: botón Instalar), Activar / Enviar prueba / Desactivar, y sus
  teléfonos; tarjeta en Hoy solo en el celular mientras falte algo (se esconde 7 días). Ruta `POST /ritmo/push`
  (suscribir|quitar|probar; también la usa el SW en `pushsubscriptionchange`). En Equipo, 📱 junto a quien ya la tiene.
  Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (si cambian, todos reactivan). Bori móvil
  (`~/bori-demo`) se instala pero aún NO tiene push: copiar este patrón.
- **Canal ético** (`/ritmo/etica`, `desempeno_etica`): cualquiera reporta, anónimo por defecto; la bandeja
  y el aviso por Telegram (sin el contenido) son SOLO para Elvin (admin).

## App de clientes de Level Up (`app.levelupmediapr.net`, 29/sep/2026)

Elvin: "apps sin App Store con push… una para mis clientes de Level Up". PWA instalable (mismo patrón que Ritmo) para los
clientes que pagan: **Inicio** (en qué va: Onboarding → Cuentas → Estrategia → Campañas, del grupo + Progreso de LEVEL UP
MEDIA; su semana en números; próximo reporte; su equipo) · **Resultados** (Meta Ads de SU cuenta, 7/30 días/este mes:
resultados = leads + conversaciones, costo por resultado, inversión, alcance, ROAS solo con ventas; día a día; los 3 mejores
anuncios con miniatura; caché 1 h) · **Archivos** (su carpeta de Drive + subir fotos/videos + acuerdo firmado) · **Mi cuenta**
(servicio, plan, equipo con "Agendar", instalar/activar avisos). **Solicitudes, reportes y soporte siguen en el canal de
Slack de su negocio** (Elvin: la app y Slack conviven; la app tiene "Escríbenos en Slack").
- **Acceso** (`lib/clientes-app/acceso.ts`, tests `tests/clientes-app.test.mjs`): link personal
  `/cliente/entrar?k=<itemId>.<version>.<hmac>` (`CLIENTES_APP_SECRET`) → el proxy deja la cookie `lu-cliente` (90 días);
  cada página confirma en `pulse_app_clientes` (migración 0039) que siga activo y en la misma versión (`visorActual`,
  `lib/clientes-app/sesion.ts`). **Cambiar link = versión + 1** (link y sesiones viejas mueren, candado dice "link vencido");
  desactivar = `activo=false`; reactivar siempre con versión nueva. El manifest lleva el link personal como `start_url`
  (iPhone: la app instalada puede no heredar la sesión de Safari) y el candado deja pegar el link. Clientes en OFFBOARDED o
  "Decidió no continuar" ven "tu cuenta no está activa".
- **Equipo**: en la ficha de LEVEL UP MEDIA en Pulse, pestaña **App** (`components/pulse/app-cliente.tsx`,
  `app-cliente-actions.ts`): crear/copiar/cambiar link, desactivar, **canal de Slack** del negocio (se pega a mano; no estaba
  guardado en ningún lado), "Ver como el cliente" (`/cliente/ver/<itemId>`, vista previa con sesión de Pulse), último acceso,
  teléfonos con avisos y "Enviar aviso". Cada cambio queda en el registro de seguridad (`app_cliente`).
- **Qué ve** (`lib/clientes-app/datos.ts`, lista cerrada): Empresa, Progreso/grupo, Tipo de servicio, Paquete, Pueblo, Fecha
  de Inicio, fechas de reporte, equipo (Personas = account manager; Estratega y Diseñador del tablero Asignación de
  Estrategas), Id cuenta publicitaria (solo para leer Meta) y el PDF de Acuerdo firmado. **Nunca** pagos, montos,
  comentarios, notas, vendedor ni datos de contacto del equipo. `CLIENTES_APP_AGENDA` = {correo: Calendly} para "Agendar".
- **Resultados** (`lib/clientes-app/resultados.ts` + `resultados-reglas.ts` puro): Marketing API con `META_ADS_TOKEN` (el de
  Max, en Vercel desde el 29/sep; ~60 días, se renueva desde Bori). Token vencido → la app dice "no disponible" y a Elvin
  le llega UN aviso por día (`notificarCEO`).
- **Archivos** (`lib/clientes-app/archivos.ts` + `archivos-reglas.ts` puro): carpeta = columna **Contenido** (link de Drive) o
  la carpeta de Max. Va por el Apps Script (`scripts/drive/max-drive.gs`, acciones `app-listar|app-bajar|app-subir`, que
  verifica que el archivo esté DENTRO de la carpeta del cliente). Bajar: Apps Script → servidor → copia en Storage
  `pulse/clientes-app/<item>/cache/` → link firmado 5 min (Vercel no devuelve > 4.5 MB); tope 20 MB (más grande: por Slack).
  Subir: teléfono → Storage (URL firmada) → Apps Script → "Material del cliente (app)" (tope 100 MB, fotos/videos/PDF).
  **Pendiente de Elvin: publicar el Apps Script** (no hay `DRIVE_SCRIPT_URL`); mientras tanto la pestaña dice "muy pronto".
- **Push** (`lib/clientes-app/push.ts`, tabla `pulse_app_push`, SW `public/cliente/sw.js`, ruta `POST /cliente/push`): la
  prueba que el cliente se manda sale siempre; los avisos del equipo/sistema solo con **`CLIENTES_APP_AVISOS=real`**
  (apagado hasta el OK de Elvin). La pantalla de instalar/activar es común con Ritmo (`components/app-movil.tsx`,
  `ConfigApp`; config en `lib/clientes-app/config.ts`).
- **Dominio**: `app.levelupmediapr.net` agregado al proyecto en Vercel (29/sep) → falta en Network Solutions: CNAME `app` →
  `cname.vercel-dns.com` + TXT `_vercel` = `vc-domain-verify=app.levelupmediapr.net,c0d41a934badca58b913`. En ese host todo
  lo que no sea `/cliente` vuelve a la app (proxy). Tema `.lu-app` (negro #0b0b0b + amarillo #f5ce1a, Sora/Inter), CSP de
  Pulse + `*.fbcdn.net` para las miniaturas.

## Leads — el CRM de clientes potenciales que reemplaza a Pipedrive (`/pulse/leads`, 26/sep/2026)

Pipedrive cuesta ~$900/mes (LU ~$600 + AIB ~$300). Decisión de Elvin: **Leads dentro de Pulse** (mismas
cuentas y base) pero en tablas propias `leads_*`, separadas de las fichas de clientes, con **la esencia de
Pipedrive**: embudos con etapas en columnas, arrastrar entre etapas, zonas **GANADO / PERDIDO** al arrastrar
(perdido pide motivo), puntito de seguimiento (rojo vencido · verde hoy · ámbar sin seguimiento), tarjeta
roja si está estancada (`diasEstancado` por embudo), vistas **Embudo · Lista · Actividades**, selector de
embudo, "+ Lead", buscador y filtro por dueño. Ficha (`/pulse/leads/<marca>/<id>`): barra de etapas
clickeable, Ganado/Perdido/Reabrir, resumen editable, **WhatsApp · Nota · Seguimiento** y el historial
(conversación de WhatsApp + notas + cambios). Cada marca aparte (`marca` level_up | ai_borinquen); Level Up
arranca con sus 6 embudos reales de Pipedrive (`SEMILLA` en `lib/leads/reglas.ts`), vacíos: **el historial NO
se carga** (Elvin: archivado en Excel). Acceso: admin/editor de Pulse todo; el resto por `leads_acceso`
(todos | solo sus leads).
- **Puente de WhatsApp = Timelines.ai** (sigue siendo el que tiene los números): `POST /api/leads/timelines
  ?marca=level-up&s=LEADS_WEBHOOK_SECRET` (público en proxy; Timelines no firma → secreto en la URL; contesta
  ya y procesa con after(); lector tolerante `leerTimelines` porque Timelines no publica el esquema; lo crudo
  queda 14 días en `leads_webhook_log`). Envío por su API (`lib/leads/timelines.ts`, token
  `TIMELINES_TOKEN_LU|AIB`; **LU conectado 26/sep**: número +1 787-409-2812, webhooks 30187/30188, token en
  .env.local y Vercel; probado con conversación real). **Clientes actuales NO entran como lead** (Elvin, 26/sep):
  `clienteActual()` busca el teléfono (últimos 10 dígitos) en el tablero de clientes de la marca en Pulse
  (level-up-media / ai-borinquen), cualquier grupo menos OFFBOARDED → `ignorado:cliente-actual`; ex-clientes sí entran. **Un solo lead abierto por teléfono y marca** (índice único parcial): dos
  mensajes seguidos no duplican. Conectar: `node scripts/leads-timelines.mjs cuentas|webhooks|conectar lu`.
  Tabla `leads_whatsapp` = qué número alimenta qué embudo y dueño (sin fila → embudo "WhatsApp").
- **Embudos = copia EXACTA de los 11 de Pipedrive LU** (27/sep, `SEMILLA.level_up`, mismos nombres/etapas, por
  uso): WHATSAPP (entra por Timelines), LUM CLASS DIEGO / FRANKIE / VALENTINA CONTRERAS / CF CLASS (entraban por
  **Zapier**), CLOSERS (Calendly), LUM DIAGNÓSTICO DE CRECIMIENTO (quiz), y sin uso: LUM DELIVERY, WHATSAPP NEW
  LUM, Bori · Seguimiento, SHADOW. Búsqueda de embudo/etapa por nombre tolerante (`clave()`).
- **Grupos de WhatsApp** (27/sep, Elvin): el grupo que se arma al agendar (closer + setter + administración) NO es lead.
  Timelines manda `chat.is_group` → `registrarGrupo`: una tarjeta por grupo (`origen: "grupo"`, llave `chat_id`, sin
  teléfono) en la etapa **"Grupos"** del embudo (era "Grupos de Whatsapp" de Pipedrive; se crea si falta), que el tablero
  dibuja angosta, al final y fuera de los totales (`esEtapaGrupos`). **Equipo ≠ lead**: teléfonos de las fichas de Ritmo +
  `LEADS_TELEFONOS_EQUIPO` + la tabla **`leads_numeros_equipo`** (migración 0043) → `ignorado:equipo`. Esa tabla se llena con el botón
  **"Es del equipo"** de la ficha del lead (dirección o director de ventas; `marcarDelEquipo`: guarda los últimos 10 dígitos y saca
  de Leads, a la papelera, los leads de WhatsApp con ese número en las dos marcas). El 1/oct se sacaron Aure, Laura, Ana Cecilio,
  Luis, Valentina (setter) y Roger: el equipo de ventas no tiene ficha en Ritmo, así que solo esta lista los reconoce.
- **Tarjeta** (27/sep): "Llegó hoy 9:46 AM" (`horaLlegada`, hora PR) + negocio o nicho. El nicho lo saca Claude
  (`lib/leads/nicho.ts`, `claude-opus-5` effort low, `LEADS_NICHO_MODEL`) de los primeros mensajes entrantes de WhatsApp
  (desde `/api/leads/timelines`, máx. 3 intentos, espera si solo dijo "hola"); queda en `datos.nicho` y `negocio` si lo
  nombra (nunca pisa lo escrito). Manito (cursor-pointer) en las tarjetas.
- **Exportar a Excel como Pipedrive** (28/sep): botón **Exportar** en la barra (Embudo · Lista · Actividades) → CSV con ; y BOM
  (`/pulse/leads/<marca>/exportar?embudo=<id|todos>&estado=abierto|ganado|perdido|todos&dueno=&q=`): este embudo (lo que ves o
  todo) o todos los embudos; respeta dueño y búsqueda; sin tope (hasta 50K); sin grupos de WhatsApp; 20 columnas (nombre, negocio,
  teléfono +1, e-mail, embudo, etapa, estado, valor, dueño, agendó, origen, nicho, etiquetas, motivo de pérdida, próxima actividad,
  último mensaje, días en la etapa, creado, cerrado, ID) en hora de PR; fórmulas neutralizadas. **Elvin exporta directo; Nahuel y
  Aure** (`EXPORTAR_CON_OK`, override `LEADS_EXPORTAR`) tienen el botón pero **cada exportación espera el OK de Elvin**
  (`pedirExportacionAction` → tabla `leads_exportaciones`, migración 0033 → `notificarCEO`; Elvin aprueba en
  `/pulse/leads/exportaciones`; al aprobar, DM del bot con el link; se baja UNA vez y en 24 h con `?solicitud=<id>`, solo quien la
  pidió). Nadie más exporta. Cada exportación queda en el registro de seguridad. Puro en `lib/leads/exportar.ts` (tests
  `tests/leads-exportar.test.mjs`), servidor `lib/leads/exportaciones.ts`, `tratosParaExportar` en repo.
- **Equipo de ventas** (`/pulse/leads/<marca>/equipo`, botón **Equipo** en la barra; 28/sep): el **director de ventas** de la marca
  (perfil de Ritmo `director_ventas`: Nahuel en Level Up), las editoras y Elvin dan/cambian/quitan el acceso a Leads (todos los
  leads | solo sus leads) a cuentas activas de Pulse; no a quien es "solo Ritmo" (eso lo abre Yaileen/RR.HH. en Ritmo → Ajustes) ni
  a bloqueados. Marca "todavía no creó su clave". Cada cambio → registro de seguridad + aviso a Elvin si no lo hizo él. Puro en
  `lib/leads/equipo.ts` (tests `tests/leads-equipo.test.mjs`), datos `lib/leads/equipo-datos.ts`, `accesoEquipoLeadsAction`.
- **Reparto por embudo** (30/sep, Elvin: "como el round robin de Pipedrive"): en **Editar embudo** → "¿Quién recibe los leads
  nuevos?" = Nadie · Una persona · **Rotación** (round robin, en el orden marcado) entre quien tiene `leads_acceso` de la marca
  (`equipoReparto`). Lo aplica `crearTrato` solo a leads que llegan SIN dueño (no manuales ni grupos; el setter del link o el
  número de WhatsApp con dueño mandan); `leads_embudos.reparto` + `reparto_turno` (migración 0042) sube atómico en el UPDATE.
  Puro en `lib/leads/reglas.ts` (`duenoPorReparto`, tests `tests/leads-reparto.test.mjs`); el tablero muestra "Rotación: A → B".
- **Mover columnas** (1/oct, Elvin: "arrastrarlas de lado a lado… sin fricción"): el encabezado de cada etapa se agarra y se suelta
  sobre otra columna (`useDraggable` id `col:<etapa>` en el mismo DndContext de las tarjetas; la de Grupos no se mueve); optimista y
  `reordenarEtapasAction` → `reordenarEtapas` (exige todas las etapas del embudo). Dirección y director de ventas (`puedeOrdenar`).
- **Filtro de fecha y búsqueda** (1/oct): "Hoy/Ayer/Semana/Mes" = llegó en ese rango **o** tiene cita/seguimiento en ese rango
  (`condFecha`, para que CLOSERS + Hoy enseñe las citas del día). La búsqueda filtra el embudo abierto y una franja enseña lo
  que coincide en los **otros** embudos de la marca (`buscarEnMarca`, `components/leads/otros-resultados.tsx`).
- **Audios, fotos y documentos de WhatsApp** (9/oct, Elvin: "vemos lo que se escribe pero no los audios"): Timelines los
  manda en `message.attachments` con un link que **vence a los 15 min**. `leerTimelines` los lee (`adjuntos`, `fecha` = hora
  real del mensaje); un audio solo ya no se descarta como "vacío" (antes se perdían ~20 al día y, si era el primer mensaje, ni
  se creaba el lead). Audio/foto/documento ≤ 16 MB se copian al llegar a Storage `pulse/leads/<marca>/<mes>/<uid>-<n>.<ext>`
  (`lib/leads/adjuntos.ts`, `meta.adjuntos[n].ruta`); los videos no. La ficha los reproduce por
  `/api/pulse/leads/adjunto/<historialId>/<n>` (permisos del lead; lo no guardado se pide fresco a Timelines por
  `GET /messages/<uid>`). Recuperación de 14 días: `/api/cron/leads-adjuntos-recuperar` (a mano, CRON_SECRET; 9/oct metió
  820 mensajes sin tocar no leídos). Tests `tests/leads-adjuntos.test.mjs`.
- **Vigía del WhatsApp** (9/oct, tras el 6/oct: el plan de Timelines de AIB perdió la API y no entró un lead en ~20 h):
  `/api/cron/leads-vigia` cada 30 min → API/plan (401/403), número conectado, webhooks a Leads y silencio ≥ 3 h de 9 AM a
  9 PM PR. Avisa por el **Telegram de Nico** (`notificarPorNico`, `TELEGRAM_BOT_TOKEN_NICO` en Vercel) una vez por problema
  y otra al recuperarse; estado en `leads_webhook_log` (fuente "vigia"). Reglas puras `problemaTimelines`/`decisionVigia`.
- **Exportaciones con Nico** (9/oct): el pedido de Nahuel/Aure le llega a Elvin por el bot de Nico con un código; aprueba con
  `ok exp <código>` / `no exp <código>` en ese Telegram (el puente llama `POST /api/leads/exportaciones/decidir`, CRON_SECRET)
  o `nico ok exp <código>` en Slack. `/solicitudes` de Nico también las lista.
- **Entrada para Zapier/formularios**: `POST /api/leads/entrada?marca=level-up&embudo=<id|nombre>&s=
  LEADS_WEBHOOK_SECRET[&etapa=…]` (JSON o form, campos tolerantes, sin duplicar, `moverSiExiste:false`).
- **Equipo con acceso a Leads LU** (cuentas miembro de Pulse, `leads_acceso` todos): Luis Fernández (setter),
  Roger Arteaga, Laura Bernal (closers), Joaquín La Valle (setter), Nahuel Tissera (director comercial), Ana Cecilio y
  Dilan Torres (chatters); Aure (editor). Santiago Villarreal ya no está. Se les da la clave con el link de
  acceso de Ritmo + `&d=leads` (`linkDeAcceso`, 72 h) → crean su clave y caen en /pulse/leads.
- **AI Borinquen (27/sep)**: copia exacta de sus 4 embudos de Pipedrive (`SEMILLA.ai_borinquen`: WHATSAPP, RECUPERACIÓN
  2026, DIAGNÓSTICO DE AUTOMATIZACIÓN, Bori · Seguimiento); Timelines AIB conectado (`TIMELINES_TOKEN_AIB` en .env.local
  y Vercel, número +1 939-304-0491, webhooks 30214/30215) y el quiz de AIB entra a "Diagnóstico de Automatización"
  (`leadQuiz({ marca })`). Acceso: Aure y Luis Fernández. Los leads abiertos de Pipedrive AIB NO se cargaron (pendiente
  de decisión de Elvin); Pipedrive AIB sigue en paralelo.
- **Semana 2 (en paralelo con Pipedrive)**, `lib/leads/cables.ts`: Calendly de LU → embudo Closers
  (agendó/reagendó/canceló; onboarding = GANADO; la cita queda como actividad "llamada" del closer a la hora de la
  cita vía `agendarLlamadaSistema`, se mueve si reagenda y se quita si cancela; el 26/sep se cargó la agenda futura: 10 citas) y quiz de LU → "Diagnóstico de Crecimiento" (el quiz nunca
  mueve a un lead que ya existe). AIB y el resto de escritores de Pipedrive (prospección, fábrica de demos,
  dashboards) siguen en Pipedrive hasta la semana 3.
- **Archivo de Pipedrive** (costo $0, por API): `node scripts/pipedrive-archivo.mjs lu|aib` → JSON + Excel en
  `~/Documents/Archivo Pipedrive/<fecha>/` (fuera del repo) y copia en Supabase Storage privado
  `pulse/archivo-pipedrive/2026-09-26/` (LU: 14,713 tratos, 14,837 personas, 26,538 notas, 31,630 actividades;
  AIB: 5,310 / 5,311 / 10,269 / 11,019).
- Código: `lib/leads/{schema,reglas,repo,pagina,cables,timelines}.ts`, `app/pulse/(app)/leads/`,
  `components/leads/`, migraciones 0013-0014, `tests/leads.test.mjs`. Probar local sin clave:
  config `content-os-abierto` (puerto 3011, CEO_PORTAL_PASSWORD vacío = modo abierto de dev).

## Formularios propios — el reemplazo de Typeform (`/pulse/formularios`, 26/sep/2026)

Elvin: "quiero hacer mi propio Typeform… para descartar esa suscripción", con el estilo del onboarding de LU.
**Plataforma**: formularios de una pregunta por pantalla (`/f/<slug>`, públicos en `proxy.ts`) que se crean y
editan en **Pulse → Formularios** (admin/editor): preguntas (texto, largo, e-mail, teléfono, número, opción,
varias, sí/no, escala 0-10, link, redes), condiciones ("mostrar solo si…"), bienvenida (con `*resaltado*`),
pantalla final (`{nombre}` + botón con link, p. ej. Calendly), temas (Level Up · AI Borinquen · Claro · Noche +
color de acento + logo), abrir/cerrar, duplicar, archivar, respuestas con búsqueda y **Excel (CSV)**, vista previa
(`?vista=previa`, no guarda). Tablas `form_formularios` / `form_respuestas` (migración 0017, token por navegador =
sin duplicados; guarda copia de las preguntas). La respuesta SIEMPRE se guarda primero; la **acción**
`pulse-onboarding-lu` después crea/completa la ficha en LEVEL UP MEDIA (`altaDesdeFormulario` con las preguntas del
formulario) y abre expediente a Max; si falla queda marcada "No creó la ficha". Código: `lib/formularios/
{reglas,semillas,schema,repo}.ts` (reglas puras, tests `tests/formularios.test.mjs`), `components/formularios/`,
`app/f/[slug]`, `app/api/f/[slug]`, `app/pulse/(app)/formularios/`. CSS `.formulario` con variables `--f-*`.
- **Duplicados de Typeform** (semillas, `SEMILLAS`): `onboarding-level-up` (= levelupmedia.vercel.app; la página
  `/onboarding/level-up` ahora lee este formulario y postea a `/api/f/onboarding-level-up`; se le sumó el botón del
  Typeform para **agendar el onboarding con Jessica** en Calendly) y `encuesta-level-up`
  (levelupmedia.vercel.app/f/encuesta-level-up, la encuesta `UDjwQkKP` que mandan los agentes de n8n; los 4
  workflows que la tenían ya apuntan al link nuevo). Links de LU salen por `levelupmedia.vercel.app/f/…`.
- **Archivo de Typeform** (antes de cancelar, $0): `node scripts/typeform-archivo.mjs` → JSON + Excel en
  `~/Documents/Archivo Typeform/<fecha>/` y Storage `pulse/archivo-typeform/2026-09-26/` (525 respuestas del
  onboarding). La encuesta `UDjwQkKP` vive en OTRA cuenta de Typeform (subdominio 6siljlqvh7z): sus respuestas
  no se pueden bajar con `TYPEFORM_TOKEN`. `/api/pulse/typeform` queda de respaldo hasta cancelar.

- **Agenda de closers en 2 pasos** (26/sep, Elvin: "aunque no se agende, los datos que lleve me los dé"; decidió NO
  clonar Calendly: 11 asientos ≈ $180-220/mes vs. el riesgo en 200+ citas/mes): `/f/agenda-roger` y
  `/f/agenda-level-up` (Laura) en `lib/formularios/semillas-agenda.ts`. Paso 1 = las 10 preguntas del evento
  "VIDEOLLAMADA POR ZOOM" (opciones EXACTAS de Calendly en `opciones`, cómo se ven en `etiquetas`) + nombre/WhatsApp/
  e-mail; `config.parciales` guarda en cada paso desde que hay e-mail o teléfono válido (`estado: parcial`, migración
  0023). Paso 2 = `config.calendly.url` embebido (widget.js) con pre-llenado por el link (`name`, `email`, `a1…a10` con
  `%20`; cada pregunta dice su `calendly: "aN"`) y "Agendó" al recibir `calendly.event_scheduled`. Acción
  `leads-closers-lu` (`leadFormularioAgenda` en `lib/leads/cables.ts`): lead en CLOSERS «Sin agendar» (etapa creada al
  principio), dueño = setter del `?utm_source=` (los setters mandan el link con su nombre), seguimiento "llenó y no
  agendó" a la hora; al agendar, el webhook de Calendly lo mueve a «Llamada agendada» y lo pasa al closer
  (`forzarDueno`). ⚠️ Calendly NO pre-marca opciones que en su configuración terminan en espacio ("En un mes ",
  "Punto equilibrio ", "5% de la facturacion total "…): hay que quitarles el espacio en Calendly.

## Contratos de AI Borinquen con firma electrónica (`/pulse/contratos-aib`, 9/oct/2026)

Elvin: "el contrato de Borinquen igual que el de Resuelto que llenan los plomeros cuando firman, pero con el branding
de AI Borinquen"; Aure: "estos datos se llenan manual: nombre, teléfono, qué se le ofreció, cuánto es el costo". El
equipo de AIB (quien ve el tablero AI BORINQUEN en Pulse: Elvin, Aure, Carilin…) llena en **Pulse → Contratos AIB**
nombre, teléfono, correo, negocio, **Incluye el servicio** y costos (total · pago de hoy · **cuotas con fecha**, que con el
pago de hoy tienen que dar el total · mensualidad · nota; en la hoja 1 salen bajo "Detalles del pago" y, debajo de la
autorización, la firma y la fecha del cliente, como en el papel) → link
`/contrato/<token>` (público en `proxy.ts`; copiar o mandar por WhatsApp). El cliente, en el teléfono: sus datos y
método de pago → firma e iniciales (dedo o escritas) → lee e inicia las 6 hojas → acepta y firma → PDF (pdf-lib, sin
Chromium: membrete AIB, iniciales y "Página X de Y" en cada pie, hoja de certificado con IP, dispositivo y SHA-256) en
Storage `pulse/aib-contratos/` y `/api/contrato/<token>/pdf`. Aviso a Elvin (`notificarCEO`) y DM del bot al que lo
emitió; un contrato con `emitido.prueba` no avisa. Texto = el "Acuerdo de pago AI" de Aure (14 cláusulas, EA Market LLC),
solo con errores de dedo corregidos. **PCI**: NO se piden número de tarjeta, CVV ni número de cuenta (solo titular,
tipo, últimos 4, banco/tipo de cuenta y dirección de facturación; 13+ dígitos seguidos se rechazan); el cobro va por un
medio seguro. Tabla `aib_contratos` (SQL directo, se crea sola, papelera). Código: `lib/aib-contratos/{documento,pdf,repo,
firmar}.ts`, `components/aib-contratos/{firmar,panel}.tsx`, `app/contrato/`, `app/api/contrato/`, tests
`tests/aib-contratos.test.mjs`.

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
**Motion a pedido en UN paso (9/oct/2026)**: Carilin y María del Carmen pidieron 2 motion con todo el material en el hilo y Max
les pidió "URLs públicas", hex y tipografías por dos días (no podía abrir adjuntos; sus respuestas cortas iban al modelo barato y se
quedaban en silencio). Ahora: el pedido = un mensaje en #max-aprobaciones (brief + guion + logo y fotos o Drive abierto, sin b-roll);
`max.mjs material <slug> --hilo <ts>` → `/api/max` accion `material` (`lib/max/material.ts`, reglas puras `material-reglas.ts` +
tests) baja adjuntos de Slack y carpetas públicas de Drive (embeddedfolderview, sin clave) a Storage `pulse/motion/clientes/<slug>/`
con URL de 1 año y `ficha.material`; Max los mira, fija `ficha.marca` y corre `remi.mjs … --cliente --proponer`. Mensajes cortos de
un pedido de producción → modelo bueno (`PRODUCCION` en max-gasto.mjs); si una persona le escribe y Max no contesta, el puente le
da otra vuelta y si no, nota honesta + aviso a Elvin (`respondioEnSlack`). Cerebro §22b, skill motion-graphics §7.0. **María del Carmen
pide cambios** (`MAX_EDITORES`, `editores`/`decisionDeEditor` en operador.ts: su `no <id> …` u `ok <id> pero …` = corrección; aprobar
sigue siendo de Elvin, Carilin o Jessica). La música del motion se repite hasta el final (`<Audio loop>` en Anuncio.tsx).

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
    empresa, e-mail o teléfono (también dígitos pegados) + navegación; desde el 1/oct también **leads** de las marcas con
    acceso (`buscarLeadsGlobalAction` → `buscarEnMarca`, respeta "solo mis leads"). **Vistas guardadas** por
    persona (`pulse_vistas`, popover "Vistas"). **Celular**: arranca en tarjetas, barra con "Más".
  - **Preguntarle al CRM** (`/pulse/preguntar`, también desde ⌘K con `?q=`): agente con tools
    (`buscar` → `consultar()` puro en `lib/pulse/preguntar.ts`, tests; `responder` con ids + nota)
    en `lib/pulse/preguntar-ia.ts` (`claude-opus-5`, effort low, fallbacks del servidor; override
    `PULSE_PREGUNTAR_MODEL`/`_EFFORT`). Solo aplana los tableros que la persona puede ver y solo
    devuelve ids de esos tableros; tope 8 preguntas/min por persona. ~15 s por pregunta.
  - Dev local usa `DATABASE_URL_DIRECT` (pooler de sesión): el de transacciones dejaba consultas
    trabadas en "ClientRead" desde la Mac. Prod sigue con `DATABASE_URL` (6543).
- **Tesorería LU · Métricas del mes** (`/pulse/tesoreria-mensual`, 26/sep): tablero PRIVADO para María García
  (tesorera, maria@) + Carilin y Aure, **solo Level Up** (una fila por mes): ventas nuevas/recurrentes,
  reembolsos, activos inicio/cierre, bajas, cobros pendientes, estado y reporte adjunto. **Se calculan solos**
  (columnas `number` con `settings.formula`, `lib/pulse/formulas.ts` puro + tests; `repo.recalcularItem` tras cada
  `actualizarValorAction`; la celda es de solo lectura con ƒ): ingresos totales = nuevas + recurrentes · netos =
  totales − reembolsos · churn = bajas ÷ activos al inicio × 100 · ticket = ingresos ÷ activos al cierre · LTV =
  ticket ÷ churn. Dato faltante = celda vacía (reembolsos sin nada → poner 0). Script
  `scripts/pulse/crear-tablero-tesoreria.mjs`. El tablero TESORERIA (cobros) sigue aparte.
- **Acuerdo firmado automático** (27/sep, `lib/pulse/contratos.ts` puro + tests `tests/pulse-contratos.test.mjs`,
  `lib/pulse/contratos-slack.ts`): al crearse una ficha en LEVEL UP MEDIA (`altaOnboarding` → after()), Pulse lee
  **#office-2-ventas-contrato** (`SLACK_CONTRATOS_CHANNEL_ID`, default C08SV6GJLPQ, privado: el bot Command Center
  tiene que estar invitado), empareja la venta por correo/teléfono (o nombre + apellido), baja el PDF del hilo y lo sube
  a la columna file **"Acuerdo firmado"** (usuario de sistema "Contratos (automático)", comentario con el link de la
  venta). Si no hay venta o PDF → comentario ⚠️ y DM del bot a Jessica (`PULSE_CONTRATOS_AVISAR`) UNA vez; si el PDF no
  menciona al cliente (pasó: el de Joel se llamaba "Edgar_Rosado") lo adjunta pero avisa "revísalo". Cron
  `/api/cron/pulse-contratos` cada hora 8 AM–8 PM PR: fichas de los últimos 14 días sin acuerdo; cuando llega, lo
  adjunta y le avisa a Jessica. Fichas anteriores a `PULSE_CONTRATOS_AVISOS_DESDE` (27/sep) no generan avisos.
  `?avisar=0` = pasada sin avisos, `?dias=N`. "Firmado" = hay PDF del contrato en el hilo (no se lee la firma).
- **Bloqueos por persona** (`pulse_board_bloqueos`, migración 0024): un tablero público que alguien NO ve
  (`boardsVisibles`/`puedeVerBoard`, afecta sidebar, ⌘K, Preguntarle al CRM y archivos; admins no se bloquean).
  María García tiene bloqueado AI BORINQUEN. Sin UI todavía: se agrega por SQL.
- **SOPs** (27/sep, pedido de Elvin, prioridad hasta el vie 2/oct): tableros **SOPs · Level Up** (público) y **SOPs · AI
  Borinquen** (privado), primeros en la barra; un grupo por departamento con su "SOP principal" (responsable Carilin o
  Aure), estados Por hacer → Rehaciendo → En revisión → Publicado; publicar EXIGE "Reunión con el departamento" y "Fecha de
  revisión" y pone "Próxima revisión" a 90 días (regla ⚡). Script `scripts/pulse/crear-tableros-sop.mjs`. Recordatorio
  `/api/cron/sop-recordatorio` 9 AM PR del 28/sep al 2/oct (`SOP_RECORDATORIO_DESDE/HASTA`): DM del bot a Carilin y Aure
  con su progreso real; si ya contestaron en el DM → solo estatus; si publicaron todo → nada (`lib/pulse/sop-mensajes.ts`
  puro + tests, `sop-recordatorio.ts`). `?dry=1` / `?prueba=1` (a Elvin).
- **AI Borinquen cerrado** (27/sep, Elvin: "lo de Borinquen lo maneja Aure; más nadie"): tableros AI BORINQUEN y SOPs AIB
  privados (Aure, Carilin, Ángela, Ana Milena, Adamay, Garrys, Luis, Yaileen); Leads AIB solo con fila en `leads_acceso` (las
  editoras no entran solas: `accesoLeads`/`marcasConAcceso`) = Aure, Carilin, Luis, Yaileen. Yaileen ya no es solo_ritmo.
  Jessica no ve AIB. **Carilin = mismo acceso que Aure** (28/sep, Elvin: "Carilin puede ver todo, incluso recursos humanos"):
  mismos tableros privados (también HR y Solicitudes HR) y Leads de las dos marcas; lo que se le dé a Aure, también a Carilin.
- **Rediseño nivel SaaS** (27/sep, Elvin: "una plataforma de San Francisco… que digan wow"): tema `.pulse`
  refinado (fondo #fcfcfd, texto #1b1c1f, bordes #e5e5ea, `.superficie`, `.esqueleto` + `(app)/loading.tsx`),
  pills de status suaves (tinte + punto, `status-pill.tsx`), ícono por tablero (`icono-tablero.tsx`, por nombre),
  sidebar Inicio · Buscar (⌘K) · Mi día · Preguntar + grupos Ventas/Tableros. **Inicio** (`/pulse`): saludo,
  KPIs vivos (`numerosInicio`: activos, onboarding, nuevos del mes, cartera), "Tu día", actividad reciente del
  equipo (`actividadReciente`, sin usuarios de sistema) y espacios de trabajo. Login en pantalla dividida con
  panel de marca ilustrativo (sin datos reales).
  **Últimos clientes** en el Inicio (`ultimosClientes` en repo, puro en `lib/pulse/ultimos-clientes.ts` + tests): los 6
  más recientes de LU/AIB visibles (sin bajas ni "(copy)"), cuánto pagó (Pago Inicial → venta de Slack → Acuerdo de
  Pago; cuotas se multiplican), nicho (Industria; si es "Otro", lo del formulario), cuándo pagó (Fecha del pago
  inicial → fecha de la venta en Slack, `ventaTs`) y onboarding (= ficha creada). ≥ $3,000 = "Alto valor" dorado.
- **Protección de datos** (27/sep, Elvin: "que nadie pueda eliminar data de un solo click, y copia de seguridad
  fuera y en varios lugares"):
  - **Papelera universal** (migración 0029, `pulse_papelera`): trigger `papelera_guardar` AFTER DELETE en TODAS las
    tablas de public (hoy 58; `pulse_papelera_proteger()` pone el trigger en tablas nuevas y la corre el respaldo diario)
    copia la fila borrada, venga de la app, un script, una cascada o un agente; TRUNCATE bloqueado. Lo borrado en una
    transacción = un **lote** (mismo `borrado_at`) que se restaura junto (`lib/pulse/papelera.ts`, puro en
    `papelera-reglas.ts` + tests). `borrarComo(userId, fn)` marca quién borró (`app.usuario`). Los archivos NO se borran:
    `borrarArchivos` los mueve a `papelera/<día>/<ruta>` en Storage y `restaurarLote` los trae de vuelta. 90 días y se purga
    (solo si ese día la base quedó copiada fuera).
  - **Pantalla**: toast **Deshacer** 15 min al borrar fichas/archivos (el que borró; `deshacerBorradoAction`); borrar un
    tablero exige escribir su nombre; ≥ 10 fichas exige escribir ELIMINAR; quitar un archivo pide confirmación; borrar una
    columna ya NO vacía sus valores (se quedan en `values` y vuelven al restaurarla). **Papelera y respaldos**
    (`/pulse/papelera`, solo admin: guarda también nómina y canal ético) con restaurar por lote y el estado de los 3 respaldos.
  - **Respaldo diario** (`/api/cron/pulse-respaldo`, 4:30 AM PR, `lib/respaldo/respaldo.ts`): TODA la base (60 tablas, menos
    `leads_webhook_log`) en JSON → gzip → AES-256-GCM con `RESPALDO_CLAVE` (`lib/respaldo/cifrado.ts`, tests) en
    **Supabase** `respaldos/base/<día>.json.gz.enc` (30 días) y **Vercel Blob privado** `respaldos-ea-market` (otro
    proveedor; `base/` 60 días + `archivos/<ruta>.enc` incremental, sin motion/). Verifica bajando la copia de Blob,
    descifrándola y contando filas; si algo falla → `notificarCEO` + evento `respaldo_fallido`. Estado en
    `respaldos/estado.json`. **La Mac** (`scripts/respaldo.mjs local`, launchd `com.iamarket.respaldo` 1 PM o al
    despertar) copia la base directo de Postgres (sin depender de Vercel) + archivos en `~/Respaldos EA Market/` (90 días;
    fuera de Documents porque launchd no tiene permiso ahí) y deja `respaldos/estado-mac.json`.
  - **Restaurar**: `node --env-file=.env.local scripts/respaldo.mjs listar | abrir <fuente> [--salida x.json] |
    restaurar <fuente> [--tabla a,b] [--real]` (fuente = ruta · `supabase:<día>` · `blob:<día>`); solo inserta lo que falta
    por la llave de cada tabla, nunca pisa. Probado de punta a punta el 27/sep. **Sin `RESPALDO_CLAVE` los respaldos no
    se abren**: está en `.env.local` y en Vercel (Production); Elvin debe guardarla también en su gestor de claves.
- **Doble capa y accesos separados** (28/sep, Elvin: "proteger Pulse… nunca mezclar datos, nunca mezclar accesos"; puro en
  `lib/pulse/acceso-reglas.ts` + tests `tests/pulse-acceso.test.mjs`): `tipoAcceso` = **completo** (dirección y operaciones: ven
  tableros) · **solo_leads** (perfil de Ritmo closer/setter/chatter/director_ventas: solo Leads y Formularios si los tiene; sin
  tableros en `boardsVisibles`/`puedeVerBoard`, Inicio → /pulse/leads, barra recortada) · **solo_ritmo**. Todo el que es
  *completo* confirma con el **código de su app autenticadora** (`/pulse/verificar`, la MISMA verificación de Ritmo:
  `desempeno_dos_pasos` + cookie `ritmo-2fa` 30 días): lo exige el layout, `requiereUsuario()` y `usuarioVerificado()` (route
  handlers de archivos/CSV/exportar y actions de Leads/Formularios). `PULSE_2FA=off` lo apaga (en dev viene apagado; en prod,
  encendido). Alertas a Elvin (`alertarElvin`): intento con correo sin cuenta, cuenta vetada o desactivada, bloqueo por 5 claves
  malas, y cuenta nueva con correo fuera de la empresa (`avisarCuentaFuera`, en Pulse y en el alta de Ritmo). **Entrada del equipo
  de ventas: `/ventas`** (pública en proxy; mismas cuentas, cae en /pulse/leads). Botón **Ir a Ritmo** en el Inicio y la barra de
  Pulse (misma sesión) y **Pulse/Leads** en el encabezado de Ritmo. **Dominio serio: `leads.levelupmediapr.net`** (29/sep:
  CNAME `leads` → `cname.vercel-dns.com` + TXT `_vercel` en Network Solutions, verificado en Vercel; `LEADS_URL` en Production). En ese host la raíz es /ventas y todo lo que no sea Leads
  vuelve a Leads (proxy); `LEADS_URL` apunta ahí los botones de Ritmo.
  **Puente Ritmo → Slack** (`components/ritmo/boton-slack.tsx`): botón en el encabezado de Ritmo que abre la app de Slack del
  espacio de su empresa (`slack://open?team=`; si no la tiene, app.slack.com). LU = T07V7MUDA9H (levelupmediaespacio), AIB =
  T09LARF90H3 (aiborinquen); la dirección ve los dos.
- **Seed** de prueba: `npm run db:seed` (admin + Jessica + Carilin, clave `pulse-dev` sin env,
  tablero Demo). Env: ver bloque Pulse en `.env.example`.

## n8n de Level Up (`scripts/n8n.mjs`)

El back office de la agencia (98 workflows, Chatwoot, Evolution, NocoDB) vive en un VPS Contabo con
Easypanel montado por un proveedor externo. Nico lo toma: `node scripts/n8n.mjs inventario|exportar|
ejecuciones|salud|subir <id>|todo` (solo `N8N_API_KEY`, nunca la clave de la UI). Respaldo en
`data/n8n/workflows/` (re-exportar tras cada cambio); la ronda de Nico reporta workflows con error.
Plan y diagnóstico en `vault/proyectos/n8n/`. **Reportes de encuestas** (28/sep, Carilin): "D-) Tools encuestador v1" ya no publica solo en
#office-6: manda cada aviso a `/api/pulse/n8n/encuestas` (credencial "Pulse ↔ n8n"), Content OS los junta por teléfono
(24 h), espera 5 min sin avisos (1 min tras finalizar) y arma UN reporte con la plantilla fija de Carilin
(`lib/encuestas/reglas.ts` puro + tests, `reportes.ts`: lee la conversación de Chatwoot con `CHATWOOT_LU_URL/TOKEN` y
Claude saca solo los datos, con la decisión FINAL); n8n lo publica cada 2 min y lo nuevo va al hilo. Si el cliente
pide persona/audio → etiqueta `no-contactar-ia` en Chatwoot y el filtro `is-inbound?` de "B-) Agente de onboarding v5"
deja de contestarle. Respaldos del antes en `data/n8n/respaldos/`. Regla: sin OK de Elvin no se activa/desactiva nada ni
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
