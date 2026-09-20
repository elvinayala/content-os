# Handoff — Content OS / CEO Command Center

_Última actualización: 2026-07-11. Escrito para una sesión que arranca SIN contexto._

## 0. Lo primero que tienes que leer
1. `CLAUDE.md` y `AGENTS.md` (raíz) — el proyecto es **Next.js 16** (¡APIs cambiadas!: `middleware`→`proxy.ts`). Antes de tocar APIs del framework, leé `node_modules/next/dist/docs/`.
2. La **memoria del proyecto** en `/Users/elvinayala/.claude/projects/-Users-elvinayala-AGENTE-CONTENIDO/memory/` (índice en `MEMORY.md`). Ahí está quién es Elvin, sus marcas, la voz PR, el avatar de Valentina, etc.
3. Los **archivos de estilo** en `vault/estilo/*.md` — son la FUENTE DE VERDAD del contenido. `estrategia.md` = reglas transversales; `level-up.md`, `ai-borinquen.md`, `shadow-operator.md` = por marca.

## 1. Qué es esto
Panel web (Next.js 16 + React 19 + Tailwind v4 + shadcn) para operar el ecosistema de **Elvin Ayala**: **Level Up Media** (agencia Meta Ads), **AI Borinquen** (agencia de IA, producto **AutoFlow**), **Shadow Operator** (marca personal). Deployado en **Vercel** → https://content-os-chi-seven.vercel.app. La cara operativa es `/ceo` (CEO Command Center). Hay una **fábrica de contenido**: agentes producen guiones/anuncios/emails → caen en la bandeja `/ceo/entregas` → Elvin aprueba → se envían por Slack al creador.

## 2. Tarea general de la sesión
Convertir el Command Center en un **sistema operativo autónomo**: que produzca contenido, celebre wins, arme el plan del día y permita a Elvin accionar — **sin depender de que él (o la app de Claude) esté abierto**. El mantra de Elvin: _"no puede depender de mí, debe ser automático"_ y _"simple para mí, arreglado por buen tiempo"_.

## 3. Qué está COMPLETADO y funcionando (verificado en prod)

### Contenido / equipo
- **Portal del equipo** (`/pedir` + login): Valentina/Juan Diego entran con `CONTENIDO_PORTAL_PASSWORD` (=`contenido-tenfold-26`), chatean con **Sofi** (`lib/sofi.ts`, claude-sonnet-5). Roles en `lib/auth.ts` (COOKIE_CONTENIDO), ruteo en `proxy.ts`.
- **Slack bidireccional con Sofi** (`app/api/slack-eventos/route.ts`): el equipo le escribe por DM al bot **Command Center** y responde. Verifica firma, ackea rápido con `after()` (Slack exige <3s). Ruta pública en proxy.
- **Circuito de Valentina** (creadora UGC de Level Up): comando `/guiones-valentina` + tarea `lote-valentina-semanal` (lunes 7 AM). Al **aprobar** un guion en la bandeja → `app/api/aprobar-entrega/route.ts` lo DM-ea al creador con el **USER token de Elvin** (`SLACK_LEVELUP_TOKEN`) para que caiga en el DM que Elvin YA tiene con esa persona (D08TBNYKQ1H para Valentina). `lib/creadores.ts` mapea nombre→Slack ID.
- **Emails por lista** (`/emails-listas` + tarea `emails-listas-semanal` martes 7 AM): 4 listas (clientes/inactivos/agendados-no-compraron/newsletter). Al aprobar → van al canal **#correos-aprobados-email-campaign** (C0B0WC500EN) posteando con el user token de Elvin.
- **Botón "Pedir contenido"** en la bandeja: Elvin describe qué necesita → se encola en el DM bot↔Elvin → tarea `atender-pedidos-contenido` (cada 30 min, `/atender-pedidos`) lo produce y responde en el hilo con "✅ Listo". Panel **"Mis pedidos"** en `/ceo/entregas` (`lib/pedidos.ts`) muestra estatus en-cola/listo leyendo Slack en vivo.
- **Botón feedback "Mejorar"** por pieza (`/api/pedir-contenido`) → el equipo aprende y guarda en `vault/estilo`.

### Automatizaciones 100% NUBE (Vercel Cron — NO dependen de la Mac de Elvin)
Definidas en `vercel.json`. Todas protegidas por `CRON_SECRET`. Proxy deja pasar `/api/cron/*`.
- **Celebrador de wins** (`lib/celebrar-wins.ts` + `app/api/cron/wins-levelup` y `wins-borinquen`): reacciona a wins nuevos en #clientes-wins con cohetes 🚀. **Level Up cada 3h** (`0 0,3,12,15,18,21 * * *` UTC = 8am-11pm PR, sin madrugada). **AI Borinquen cada 8h** (`0 4,12,20 * * *`). Idempotente por hilo (no usa cursor — serverless no puede escribir archivos).
- **Board meeting 5 AM** (`lib/board-meeting.ts` + `app/api/cron/board-meeting`, cron `0 9 * * *` UTC = 5 AM PR): junta 7 fuentes en vivo (Slack LU/AIB, Pipedrive, Zoom, EA Market, Entregas, Granola), sintetiza el plan del día con la Anthropic API y lo **publica en el DM de Elvin**. VERIFICADO funcionando (llegó 5:01 AM).

### Command Center accionable (lo ÚLTIMO que se hizo)
- **Botón ⚡ Accionar** (`components/ceo/accionar.tsx` + `app/api/accionar/route.ts` + `lib/equipo-slack.ts`): cada punto del Operator Debrief y cada Prioridad del CEO tiene un botón que abre un mensaje pre-redactado al responsable (auto-sugerido según el texto), editable, y lo **envía por Slack como Elvin** (user token) a su DM. Directorio de 13 personas del equipo en `lib/equipo-slack.ts`. VERIFICADO en prod.

### Reglas de contenido fijadas permanentes (en `vault/estilo/`)
- **Idioma: tuteo PR** (tú/tienes), NUNCA voseo argentino. Regla dura en `estrategia.md`.
- **Nunca "gratis" en CTAs** (`estrategia.md`).
- **Valentina = creadora UGC de Level Up** con avatar FIJO: coaches/mentores/**infoproductores**/agencias $3-10K→$20-50K/mes. Posicionamiento **CONSULTORÍA** (NUNCA "somos una agencia"; "te instalamos todo contigo 1:1"; paquete: auditoría 1:1 + sesiones grupales semanales + sesión 1:1 con Elvin). Ángulo permanente: "no saben estructurar su contenido orgánico" + frases literales "tus ángulos ganadores" / "estrategia de comunicación". Siempre "potenciamos con anuncios y estrategia probada ($100K/mes)". Sección "## VALENTINA" en `level-up.md`.
- **Testimonios reales** (level-up.md): Tinos $30K→$100K, **Coralis (La Garita) $25K→$70K**, **RK Automatic $30K→$100K**, Dr. Marvin, Dr. Bryan. Formato "testimonio de producto": "[Cliente] pasó de X a Y — ¿cómo?".
- **Aprendizajes de Elvin** (level-up.md): APRUEBA concreto+números+casos+confrontación; DESCARTA abstracto/meta/mindset genérico (botón azul, IA 10x, mina de oro, "dinero en la mesa" suelto).
- **AI Borinquen: 8 ángulos núcleo** (ai-borinquen.md), incluidos los 2 nuevos: #7 **"Danos 7 días"** (instalamos 2 sistemas: generación de citas + atención automática) y #8 **"digitalizarse/optimizar procesos"** (dar VARIOS por lote). Caso: "el terapista" (masculino).

## 4. Dónde estamos parados AHORA (no atascado, sesión terminando limpia)
Todo lo de arriba está deployado y verificado. Última cosa entregada: el botón ⚡ Accionar. **No hay nada roto ni a medias.** Contenido esperando aprobación de Elvin en la bandeja: ~10 guiones nuevos de Valentina, 10 ads de Valentina (5 solución), 10 ads AI Borinquen para Juan, 12 ganchos "mortales" de digitalización, 40 emails, testimonios.

## 5. Siguiente paso sugerido (propuesto, NO confirmado por Elvin)
Que el **board meeting de las 5 AM** incluya en cada acción del plan el **responsable ya clickeable** (integrar el patrón del botón ⚡ Accionar en el mensaje/plan diario), para accionar directo desde el plan. Fuera de eso: esperar el próximo pedido de Elvin. Pendientes viejos no bloqueantes: F4 (Calendar con creación de eventos), P3.7 (clonación por cliente).

## 6. TRAMPAS QUE YA PISAMOS — NO REPETIR JAMÁS

1. **Serverless (Vercel) NO puede escribir `data/*.json` ni archivos** (filesystem read-only). Los crons NO usan cursor en archivo: idempotencia por estado en Slack (hilo/reacción). Los snapshots del dashboard los escriben las tareas LOCALES de Claude (`/brief-ceo`, etc.) + `bash scripts/deploy-snapshots.sh`.

2. **Voseo argentino en el contenido.** Los subagentes tienden a escribir "vos/tenés/querés/mirá". SIEMPRE validar con node antes de mergear. OJO: el chequeo de voseo debe usar **lookarounds Unicode con clase de letras** `(?<![a-záéíóúüñ])(vos|sos|tenés|...)(?![a-záéíóúüñ])` con flag `u` — si no, da falsos positivos ("proce**sos**"→"sos", "re**spondes**"→match). "tuyo", "estás", "vas" son válidos en tuteo, NO tocar.

3. **El DM del bot ≠ el DM personal de Elvin.** Mandar guiones vía el BOT token cae en un hilo aparte (bot↔persona) que la gente no abre. Para que Valentina/creadores los VEAN, hay que postear con el **USER token de Elvin** (`SLACK_LEVELUP_TOKEN`) → cae en el DM que Elvin ya tiene con ellos. Ver `app/api/aprobar-entrega/route.ts` (rama `creador`).

4. **El bot Command Center NO tiene scope `reactions:write` ni `channels:join` ni `im:write`.** No usar `reactions.add` (falla `missing_scope`) — para marcar "hecho" usar respuesta en el hilo que empiece con "✅". No intentar que el bot se una solo a canales — hay que invitarlo (`/invite`) o postear con el user token (que sí puede si Elvin es miembro).

5. **claude-sonnet-5 con `max_tokens` bajo + sin config = respuesta vacía** ("No pude armar el plan"). Usar `thinking: {type:"disabled"}` + `output_config: {effort:"medium"}` y `max_tokens` holgado (1200-1600). Ver `lib/board-meeting.ts` y `app/api/jarvis/route.ts`.

6. **El worker de pedidos duplicó contenido**: corrió en paralelo con una generación manual y produjo 2 tandas. Si generás manual algo que también está en la cola de pedidos, cerrá el pedido en Slack (respuesta "✅") para que el worker no lo repita.

7. **Cron en Vercel = UTC.** Elvin está en PR (UTC-4, sin DST). Para las 5 AM PR → `0 9 * * *`. Convertir siempre PR+4=UTC.

8. **`vercel.json` con query strings en cron paths es dudoso** — usamos rutas separadas por marca (`/api/cron/wins-levelup`, `/api/cron/wins-borinquen`) en vez de `?marca=`. Si agregás crons, ruta dedicada.

9. **Dos Valentinas en Slack.** La correcta (Contreras, closer/creadora UGC) es **U08CZV7EL2C** (@valentina, "Sales Team Leader"). La otra (Valentina Rodriguez, U091RRM62GH) NO. Elvin = **U08U9777PUY** (su DM personal con el bot = D0BGHLQVABA; su DM con Valentina = D08TBNYKQ1H).

## 7. Datos de referencia (IDs, envs, canales)
- **Slack IDs clave:** Elvin U08U9777PUY · bot Command Center U0BFPB0SSP4 · Valentina U08CZV7EL2C · Juan (creador nuevo) — pedidos usan `para:"Juan"`. Directorio completo en `lib/equipo-slack.ts`.
- **Canales Slack:** #clientes-wins LU = C0B4K58DUSD · #clientes-wins AIB = C0BFLDQ8ME1 · #correos-aprobados-email-campaign = C0B0WC500EN · DM bot↔Elvin (cola de pedidos + briefs) = D0BGHLQVABA.
- **Envs (en `.env.local` local + Vercel prod, NUNCA en el repo):** ANTHROPIC_API_KEY, CEO_PORTAL_PASSWORD (=GyWmD4sOkVcJ405a), CONTENIDO_PORTAL_PASSWORD, SLACK_BOT_TOKEN (xoxb, bot), SLACK_LEVELUP_TOKEN (xoxp, user token de Elvin — el que postea "como Elvin"), SLACK_BORINQUEN_TOKEN (xoxp AIB), SLACK_SIGNING_SECRET, SLACK_APROBADOS_WEBHOOK, SLACK_EMAILS_CHANNEL, CRON_SECRET, PIPEDRIVE_LEVELUP_TOKEN, PIPEDRIVE_AIB_TOKEN, ZOOM_INTEL_*.
- **Cookie CEO:** `ceo-session` = `sha256(CEO_PORTAL_PASSWORD + "::ceo-portal-v1")`. Para probar endpoints con curl: computar ese hash y mandarlo como cookie.
- **Deploy:** `npx vercel --prod --yes`. Snapshots + deploy: `bash scripts/deploy-snapshots.sh`.

## 8. Cómo trabajar en esta sesión (patrón que funcionó)
- **Generar contenido → subagente** (`Agent` tool, general-purpose) que escribe un JSON a `scratchpad/`, luego mergear con un `node -e` que VALIDA (voseo, "gratis", campos, "haz click"/CTA) antes de `push` a `data/entregas.json`, luego `deploy-snapshots.sh`. Nunca dejar el JSON inválido.
- **Reglas nuevas de Elvin → guardar SIEMPRE en `vault/estilo/`** (permanente) + actualizar el comando (`.claude/commands/*.md`) + la tarea programada (`update_scheduled_task`) + a veces la memoria. Elvin quiere que el equipo "aprenda y no vuelva a hacerlo mal".
- **Cambios de flujo automático → Vercel Cron** (no tarea de Claude) porque Elvin no quiere depender de su Mac.
- Todo el contenido/copy en **tuteo PR**. Cada deploy: `tsc --noEmit` + `npm run build` antes de `vercel --prod`.
