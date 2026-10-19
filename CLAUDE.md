@AGENTS.md

# Content OS · EA Market LLC

Un solo repo (Next.js) con el sistema operativo de EA Market LLC y sus marcas (Level Up Media, AI Borinquen, Bori,
Shadow Operator, Resuelto…): el tablero de contenido original, el CEO Command Center, los agentes (Sofi, Nico, Max,
Lola, Remi, Iris, Leo, Gabo), Pulse (CRM que reemplaza a Monday), Leads (reemplaza a Pipedrive), Ritmo (asistencia y
desempeño), Formularios (reemplaza a Typeform), la app de clientes de LU y la fábrica de demos.

## Cómo usar este archivo (contexto con carga diferida)

Este archivo lo carga **cada llamada** de cada sesión, subagente, tarea programada y agente en Railway. Por eso es
solo un índice: el detalle de cada área vive en `docs/contexto/<área>.md` (movido tal cual el 19/oct/2026; no se
perdió nada, solo se carga cuando hace falta).

- **Antes de tocar un área, lee su archivo completo** (tabla de abajo); si la tarea cruza varias, léelas todas.
- **Al documentar algo nuevo**, escríbelo en el archivo de su área (o crea `docs/contexto/<área-nueva>.md`) y agrega
  UNA línea a la tabla. **No agregues detalle aquí**: cada línea de este archivo se paga en todas las llamadas.
- ¿No sabes dónde está algo? `grep -ril "<palabra>" docs/contexto vault/ceo vault/proyectos` antes de decir que no existe.

## Stack y comandos

Next.js 16 App Router (⚠️ cambió convenciones: `proxy.ts` reemplaza a middleware; lee `node_modules/next/dist/docs/`
antes de tocar APIs del framework) · React 19 · TypeScript 5 · Tailwind v4 (`@theme` en `app/globals.css`, sin
`tailwind.config`) · shadcn/ui (Radix, `components/ui/`) · Postgres de Pulse en Supabase + Drizzle (PGlite local sin
`DATABASE_URL`).

- `npm run dev` (http://localhost:3000) · `npm run build` (verifica tipos) · `npm test` (tests puros en `tests/`).
- Prod: `https://content-os-chi-seven.vercel.app` (⚠️ content-os.vercel.app es de otro).
- Si un cambio de CSS no aparece: `rm -rf .next` y reinicia (caché persistente de Turbopack).
- Temas con scope por clase en `app/globals.css` (`.ceo`, `.hud`, `.pulse`, `.ritmo`, `.lu-app`…): los `*Content` que
  portalean a `<body>` (Sheet/Dialog/Select/Tooltip) necesitan la clase del tema.

## ⚠️ Qué es AI Borinquen (regla dura de Elvin, 1/oct/2026)

AI Borinquen **NO es solo atención al cliente ni "contestar el teléfono"**. Son cuatro líneas:
**agentes personalizados** (un empleado digital por puesto: ventas, cotizaciones, inventario, cobros,
seguimiento, recepción…) · **capacitar dueños de negocio con IA** (Academia AIB y 1:1) ·
**digitalizar negocios** · y **AutoFlow/atención al cliente, que es SOLO una parte**. Todo copy de AIB
(guiones, anuncios, carruseles, decks, emails, textos para empleados) arranca de las cuatro; en un lote,
máximo 1 de cada 4 piezas sobre atención. Fuente: `vault/estilo/ai-borinquen.md` (arriba de todo).

## Índice

| Archivo (`docs/contexto/`) | Código principal | Léelo cuando toques… |
|---|---|---|
| `tablero-base.md` | `app/(tablero)/`, `lib/mock/`, `data/negocio.json` | stack completo, estructura de carpetas, decisiones de diseño, /guion, equipo de contenido (Sofi y su pipeline), Mi negocio, conectar datos reales, registro de decisiones |
| `ceo-command-center.md` | `app/ceo/`, `lib/ceo.ts` | /ceo: tema, roster ejecutivo, tabs, unidades de negocio |
| `content-os.md` | `app/api/jarvis/`, `lib/vault.ts`, `lib/encargos.ts`, `proxy.ts` | HUD, Jarvis, skills, vault y /sync-vault, cerebro del CEO, encargos, login, /prospectar, Calendly → CLOSERS, aviso de llamadas en Slack |
| `plan-de-guerra.md` | `data/portafolio.json`, `scripts/demo-cliente/`, `scripts/telegram-puente.mjs` | plan de guerra Q4, portafolio, fábrica de demos, Estudio (Sofi coordina producción), Telegram y el puente en Railway, sync de `data/` |
| `sistema-operador.md` | `vault/proyectos/sistema-operador/` | high ticket de $15K, deck, página de venta, /f/aplicar-sistema |
| `isla-run.md` | `vault/proyectos/isla-run/` | ISLA Run Series (la plataforma vive en otro repo) |
| `aib-portal-autoflow.md` | `app/portal/`, `lib/portal/` | ventas de AIB, Portal AutoFlow, llamadas reales de Retell, deck AIB, pre-call |
| `contratos-aib.md` | `lib/aib-contratos/`, `app/contrato/` | contratos de AIB con firma electrónica |
| `iris.md` | `.claude/commands/iris.md` | Iris, vigía de Cortex |
| `nico.md` | `data/plataformas.json`, `scripts/nico-ronda.mjs` | Nico: guardia de plataformas, Railway + GitHub, #nico-desarrollo y `ok <id>`, canales por plataforma, Zernio |
| `gasto-ia.md` | `scripts/nico-gasto.mjs`, `scripts/max-gasto.mjs` | qué modelo usa cada agente o ruta y sus topes de gasto |
| `agentes-comunicacion.md` | `app/api/agentes/`, `scripts/agentes.mjs` | buzón entre agentes, ⟳ SEGUIR, clones de GitHub de Sofi/Lola/Max |
| `lola.md` | `scripts/fal.mjs`, `scripts/higgsfield.mjs` | Lola: flyers, videos, pedidos, kits de marca |
| `remi.md` | `motion/`, `scripts/remi.mjs` | Remi/Remotion: fábrica de anuncios, estilos, nube, motion de clientes, lotes, Hyperframes, Brag |
| `director-creativo.md` | `lib/director-creativo.ts` | Leo, revisión de flyers y guiones en Slack |
| `resumen-dia.md` | `lib/resumen-dia.ts` | resumen de las 8:30 PM por Telegram |
| `creadores.md` | `scripts/creadores.mjs` | pipeline de micro-influencers |
| `ritmo.md` | `app/ritmo/`, `lib/desempeno/`, `lib/ventas/` | Ritmo completo: ponche y su seguridad, KPIs por puesto, RR.HH./Personas, solicitudes y tiempo libre, 2FA, Carreras, Equipo digital, Noticias, Bienestar, Empresa, Arena de ventas, calendario de ausencias, cambios con aprobación, ranking y reportes, Google Calendar, PWA/push, canal ético |
| `app-clientes-lu.md` | `lib/clientes-app/` | app de clientes de LU (app.levelupmediapr.net) |
| `leads.md` | `app/pulse/(app)/leads/`, `lib/leads/` | Leads: embudos, WhatsApp/Timelines, grupos, exportar, equipo de ventas, reparto, adjuntos, vigía |
| `formularios.md` | `app/f/`, `lib/formularios/` | formularios propios, onboarding y encuesta de LU, agenda de closers en 2 pasos |
| `pulse.md` | `app/pulse/`, `lib/pulse/`, `drizzle/` | Pulse: modelo tipo Monday, auth y seguridad, migración, puente n8n, cuentas Meta del onboarding, automatizaciones, Mi día, ⌘K, Preguntar, tesorería, acuerdo firmado, SOPs, papelera y respaldos, accesos y 2FA |
| `email-activecampaign.md` | `lib/activecampaign.ts` | ActiveCampaign por marca, cables, newsletter |
| `meta-ads.md` | `scripts/meta-ads.mjs`, `data/meta-ads/` | Meta Ads, Método 5 Fases, plantillas, Max por Telegram |
| `max-slack.md` | `lib/max/`, `scripts/max.mjs` | Max en Slack (#max-aprobaciones), expedientes, Drive, identidad, motion a pedido |
| `revision-cuentas-max.md` | `scripts/revision-clientes.mjs`, `lib/desempeno/optimizaciones.ts` | revisión de cuentas de los lunes y su seguimiento en Ritmo |
| `plan-listo.md` | `lib/estrategia/plan-listo.ts` | "PLAN LISTO" → alerta a Elvin |
| `n8n.md` | `scripts/n8n.mjs`, `data/n8n/` | n8n de LU, reportes de encuestas |
| `gabo-licitaciones.md` | `scripts/licitaciones.mjs`, `data/licitaciones/` | Gabo, licitaciones de Digital Seed Ventures |
