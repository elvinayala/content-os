---
name: tablero-contenido
description: Qué es el proyecto AGENTE CONTENIDO y los gotchas de su stack/setup
metadata: 
  node_type: memory
  type: project
  originSessionId: f2933ee7-c7a4-4f57-aa98-449e896b1064
---

`/Users/elvinayala/AGENTE CONTENIDO` es un **tablero de contenido para creador
(@tenfoldmarc)**: Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui,
modo oscuro forzado con acento **terracota** (definido en el bloque `.dark` de
`app/globals.css`, una sola variable `--primary`). Seis secciones: Baúl de Ganchos,
Métricas, Rastreador de Competencia, Community Manager, Calendario, Tendencias.
PASO 01 = UI con **datos mock** en `lib/mock/*.ts` (tipos en `lib/types.ts`).

**Why:** decisiones tomadas con el usuario (alcance mock, /guion como slash command).

El tablero se modela como un **equipo de 5 agentes en cadena** (`lib/equipo.ts`):
Mateo (datos) → Santi (estrategia) → Cami (ideas) → Lauti (guiones) → Facu (publicación).
Página `/equipo` muestra el pipeline. La **personalización** ("Mi negocio") vive en
`data/negocio.json` y se edita en `/configuracion` (form + server action
`guardarNegocioAction`). Conectar cuentas reales = OAuth que autoriza el usuario.

**How to apply:**
- Para datos reales, reemplazar cada `lib/mock/<seccion>.ts` manteniendo los tipos.
  Mapa de integraciones en `CLAUDE.md` → "Conectar datos reales".
- El comando `.claude/commands/guion.md` (`/guion`) agrega entradas a
  `data/calendario.json`; la page `/calendario` es `dynamic = "force-dynamic"` y lo
  lee en cada request.
- **Gotcha de scaffold:** el nombre de carpeta tiene mayúsculas y espacio, así que
  `create-next-app` falla con el nombre. Se scaffoldeó en `/tmp` con nombre válido y
  se movió. El `package.json` quedó con `name: "tablero-contenido"`.
- Next.js 16 tiene cambios; ver `AGENTS.md` y `node_modules/next/dist/docs/`.
- Dev/preview: `.claude/launch.json` corre `npm run dev -p 3007`.
- **Gotcha Turbopack (2026-07-03):** el caché persistente puede servir CSS viejo
  después de editar `app/globals.css` — ni reiniciar el dev server lo invalida.
  Fix: `rm -rf .next` y reiniciar.
- Existe la sección **`/ceo` (CEO Command Center)** con tema navy/neón scoped por
  la clase `.ceo` y shell propio; el shell del tablero vive en el route group
  `app/(tablero)/`. Roster ejecutivo en `lib/ceo.ts`, mocks en `lib/mock/ceo.ts`.
- **PASO 02-03 (2026-07-04)**: `/` redirige a /ceo; tablero en /tablero. Slack
  Level Up + Google Calendar alimentan snapshots data/*.json vía /brief-ceo
  (tarea 6:30 AM). **`/hud`** = Content OS (tema .hud negro+naranja): Jarvis
  (api/jarvis, Anthropic API, requiere ANTHROPIC_API_KEY en .env.local), skills
  del repo (.claude/skills/), vault/ (memoria markdown, /sync-vault con
  Granola+Slack), encargos (worker cada 30 min con Apify). Login del portal:
  CEO_PORTAL_PASSWORD en .env.local. Ver CLAUDE.md para el detalle.
- **En producción (2026-07-04)**: proyecto Vercel `content-os` (cuenta
  elvin-7614, login autorizado en CLI). URL: content-os-chi-seven.vercel.app.
  Envs en Vercel: CEO_PORTAL_PASSWORD + ANTHROPIC_API_KEY. `.vercelignore`
  permite subir data/ y vault/ (gitignoreados) pero nunca .env*. Redeploy:
  `npx vercel --prod --yes`. La ANTHROPIC_API_KEY también está en .env.local.
- Pendientes que dependen de Elvin: tokens de Pipedrive x2 (F3), accesos de
  portales (F5), handle IG de Shadow (F6), Slack de Borinquen (F7). Falta
  también: voz en el HUD (P3.6) y clonación por cliente (P3.7).
- **Memoria + resiliencia (2026-07-04b)**: Jarvis tiene tool `buscar_memoria`
  (lib/vault.ts `buscarNotas`) para bucear todo el vault; system prompt le
  enseña que la historia vive en vault/ (24h en leer_ops) + regla señal-vs-ruido.
  Backfill de 200 días de Granola hecho: 44 notas en vault/reuniones/ +
  vault/reuniones/_indice-historico.md (menores). Slack: 3 corridas/día (cron
  `30 6,12,17`), canal CSM `#office-5-fullfilment-csm` (C08T8BWTH1P) + barrido
  adaptativo con `data/.slack-estado.json`. Error boundaries en app/ceo/error.tsx,
  app/hud/error.tsx, app/global-error.tsx (anti pantalla-blanca).
- **Métricas IG reales por marca (2026-07-04c)**: /metricas ahora lee data/ig-
  <marca>.json (Apify instagram-profile-scraper). Handles en fuentes.json:
  ai_borinquen, level_upmediapr, shadowoperator.elvin. Componente
  components/sections/metricas-marca.tsx (selector de marca). Guardados/DMs
  marcados "Meta" (no vienen de scraping público). `frescura()`+`Frescura` se
  movieron a lib/frescura.ts (client-safe; lib/ops re-exporta). Comando
  /sync-metricas + paso 3 de la tarea diaria (solo corrida matutina).
- **Fábrica de contenido / Entregas (2026-07-04d)**: el CEO orquestador produce
  la cuota de contenido por marca. `data/produccion.json` = cuota mensual;
  `/fabrica-contenido` (tarea semanal lunes 7 AM) genera ¼ usando vault/estilo +
  vault/ceo + inputs reales (competencia, tendencias, ig-*) y APPENDea a
  `data/entregas.json` (tipo EntregasSnapshot/Entrega en lib/types.ts).
  Bandeja revisable en **/ceo/entregas** (components/ceo/entregas-inbox.tsx,
  filtros marca/tipo, progreso vs cuota) + widget en el Command Center. lib/
  entregas.ts. También /sync-metricas, /sync-competencia, /sync-tendencias
  scrapean IG (Apify) para /metricas, /competencia, /tendencias reales.
- **El local muere con la sesión** — la URL estable es la de Vercel
  (content-os-chi-seven.vercel.app), NO localhost. Cada corrida diaria hace
  `npx vercel --prod --yes` para publicar snapshots+vault frescos.
