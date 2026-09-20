# Handoff — Content OS / CEO Command Center

_Última actualización: 2026-07-12. Escrito para una sesión que arranca SIN contexto._

## 0. Lo primero que tienes que leer
1. `CLAUDE.md` y `AGENTS.md` (raíz) — el proyecto es **Next.js 16** (¡APIs cambiadas!: `middleware`→`proxy.ts`). Antes de tocar APIs del framework, leé `node_modules/next/dist/docs/`.
2. La **memoria del proyecto** en `/Users/elvinayala/.claude/projects/-Users-elvinayala-AGENTE-CONTENIDO/memory/` (índice en `MEMORY.md`). Quién es Elvin, marcas, voz PR, avatar de Valentina, memoria compuesta, etc.
3. Los **archivos de estilo** en `vault/estilo/*.md` — FUENTE DE VERDAD del contenido. `estrategia.md` = reglas transversales; `level-up.md`/`ai-borinquen.md`/`shadow-operator.md` = por marca; `angulos-ganadores.md`/`objeciones-reales.md`/`ideas-de-data.md`/`decisiones-negocio.md` = **síntesis destilada de la memoria (data, no intuición)**.

## 1. Qué es esto
Panel web (Next.js 16 + React 19 + Tailwind v4 + shadcn) para operar el ecosistema de **Elvin Ayala**: **Level Up Media** (agencia Meta Ads), **AI Borinquen** (agencia de IA, producto **AutoFlow**), **Shadow Operator** (marca personal). Deployado en **Vercel** → https://content-os-chi-seven.vercel.app. Cara operativa: `/ceo`. Hay una **fábrica de contenido**: agentes producen → bandeja `/ceo/entregas` → Elvin aprueba → se envía por Slack al creador.

## 2. Tarea general
Sistema operativo autónomo que produce contenido, celebra wins, arma el plan del día, recuerda todo y permite accionar — **sin depender de que Elvin (o la app de Claude) esté abierto**. Mantra: _"no puede depender de mí, debe ser automático"_.

## 3. Qué está COMPLETADO y verificado en prod

### Memoria Compuesta (jul 12 — lo más reciente)
Convierte reuniones/llamadas/chats en data accionable sobre el vault (Obsidian-style).
- `lib/memoria.ts`: `construirGrafo`, `leerEntidad`, `entidadesMasConectadas`, `leerSintesis`. Grafo por [[wikilinks]] de las ~55 reuniones.
- **16 notas de entidad** en `vault/entidades/` (clientes/temas/objeciones/personas) con Resumen acumulado + Línea de tiempo + Conexiones (MERGE, nunca overwrite).
- **4 docs de síntesis** en `vault/estilo/`: angulos-ganadores, objeciones-reales, ideas-de-data, decisiones-negocio — con DATA real (78% de Laura, Tinos/RK/Coralis, el terapista…).
- **Jarvis** (`app/api/jarvis/route.ts`): tools nuevas `leer_entidad` + `sintesis` (además de `buscar_memoria`). Verificado: responde con data real.
- **Fábrica wired**: guiones-valentina / fabrica-contenido / atender-pedidos leen la síntesis.
- **UI**: sección "Memoria compuesta" en `/ceo/vault` + página `/ceo/memoria/[entidad]`.
- **Se mantiene**: tareas `sync-memoria-diario` (6:54 AM, MCP: enriquece entidades) y `destilar-memoria-diario` (7:10 AM, sin MCP: regenera síntesis). Comandos `/sync-memoria` y `/destilar-memoria`. Detalle en memoria `memoria-compuesta.md`.

### Contenido / equipo
- **Portal del equipo** (`/pedir` + login): Valentina/Juan Diego con `CONTENIDO_PORTAL_PASSWORD` (=`contenido-tenfold-26`), chatean con **Sofi** (`lib/sofi.ts`). Roles en `lib/auth.ts`, ruteo en `proxy.ts`.
- **Slack bidireccional con Sofi** (`app/api/slack-eventos/route.ts`): el equipo le escribe por DM al bot Command Center; responde. Firma + `after()` (<3s). Ruta pública en proxy.
- **Circuito de Valentina** (creadora UGC de Level Up): `/guiones-valentina` + tarea `lote-valentina-semanal` (lunes 7 AM). Al aprobar en la bandeja → `app/api/aprobar-entrega/route.ts` DM-ea al creador con el **USER token de Elvin** (`SLACK_LEVELUP_TOKEN`) → cae en su DM personal con Elvin (D08TBNYKQ1H). `lib/creadores.ts` mapea nombre→Slack ID.
- **Emails por lista** (`/emails-listas`, tarea martes 7 AM): al aprobar → canal #correos-aprobados-email-campaign (C0B0WC500EN) con el user token.
- **Botón "Pedir contenido"** (bandeja): Elvin describe → se encola en el DM bot↔Elvin → tarea `atender-pedidos-contenido` (cada 30 min) produce y responde en hilo "✅ Listo". Panel **"Mis pedidos"** en `/ceo/entregas` (`lib/pedidos.ts`) con estatus en-cola/listo.

### Automatizaciones 100% NUBE (Vercel Cron — `vercel.json`, protegidas con `CRON_SECRET`, proxy deja pasar `/api/cron/*`)
- **Celebrador de wins** (`lib/celebrar-wins.ts` + rutas `wins-levelup`/`wins-borinquen`): 🚀 a wins nuevos en #clientes-wins. LU cada 3h (`0 0,3,12,15,18,21 * * *` = 8am-11pm PR), AIB cada 8h (`0 4,12,20 * * *`). Idempotente por hilo.
- **Board meeting 5 AM** (`lib/board-meeting.ts` + `board-meeting`, `0 9 * * *` UTC = 5 AM PR): junta 7 fuentes en vivo, sintetiza el plan del día con Anthropic API, lo publica en el DM de Elvin. VERIFICADO.

### Command Center accionable
- **Botón ⚡ Accionar** (`components/ceo/accionar.tsx` + `app/api/accionar/route.ts` + `lib/equipo-slack.ts`): cada punto del debrief y cada Prioridad → mensaje pre-redactado al responsable (auto-sugerido), editable, enviado por Slack como Elvin (user token). Directorio de 13 en `lib/equipo-slack.ts`.

### Reglas de contenido fijadas (en `vault/estilo/`)
- **Tuteo PR** siempre, NUNCA voseo (`estrategia.md`). **Nunca "gratis" en CTAs**.
- **Valentina = creadora UGC de Level Up**, avatar FIJO: coaches/mentores/infoproductores/agencias $3-10K→$20-50K/mes. Posicionamiento **CONSULTORÍA** (NUNCA "agencia"; paquete: auditoría 1:1 + grupales semanales + sesión 1:1 con Elvin). Ángulo permanente: "no saben estructurar su contenido orgánico" + frases literales "tus ángulos ganadores"/"estrategia de comunicación". Siempre "potenciamos con anuncios y estrategia probada ($100K/mes)". Sección "## VALENTINA" en `level-up.md`.
- **Testimonios**: Tinos $30K→$100K, Coralis (La Garita) $25K→$70K, RK Automatic $30K→$100K, Dr. Marvin, Dr. Bryan.
- **Aprendizajes de Elvin** (level-up.md): APRUEBA concreto+números+casos; DESCARTA abstracto/meta.
- **AI Borinquen: 8 ángulos** (ai-borinquen.md), incl. #7 "Danos 7 días" (2 sistemas: generación de citas + atención automática) y #8 "digitalizarse/optimizar procesos" (dar varios/lote). Caso "el terapista" (masculino).

## 4. Dónde estamos (sesión terminando limpia)
Todo deployado y verificado. Nada roto ni a medias. Contenido esperando aprobación en la bandeja: guiones de Valentina, ads de Valentina, ads AI Borinquen para Juan, ganchos de digitalización, emails, testimonios.

## 5. Siguiente paso sugerido (NO confirmado)
Integrar el botón ⚡ Accionar / responsables en el plan del board meeting 5 AM. Pendientes viejos no bloqueantes: F4 (Calendar crear eventos), P3.7 (clonación por cliente).

## 6. TRAMPAS QUE NO REPETIR JAMÁS
1. **Serverless (Vercel) NO escribe archivos** (FS read-only). Los snapshots/vault los escriben las tareas LOCALES + `bash scripts/deploy-snapshots.sh`. Jarvis/UI solo LEEN el vault bundleado.
2. **Voseo argentino en el contenido.** Validar con node antes de mergear, con **lookaround Unicode**: `(?<![a-záéíóúüñ])(vos|sos|tenés|...)(?![a-záéíóúüñ])` flag `u` (si no, "proce**sos**"/"re**spondes**" dan falsos positivos). "tuyo/estás/vas" son válidos.
3. **El DM del bot ≠ el DM personal de Elvin.** Para que la gente VEA los mensajes, postear con el USER token de Elvin (`SLACK_LEVELUP_TOKEN`), no con el bot.
4. **El bot NO tiene `reactions:write`/`channels:join`/`im:write`.** Marcar "hecho" = respuesta en hilo que empiece con "✅", no reacción. Invitar el bot a canales a mano (o postear con user token).
5. **claude-sonnet-5 sin config = respuesta vacía.** Usar `thinking:{type:"disabled"}` + `output_config:{effort:"medium"}` + max_tokens holgado. Ver `lib/board-meeting.ts`.
6. **El worker de pedidos puede duplicar** si generás manual algo que también está en la cola. Cerrá el pedido en Slack (respuesta "✅") para que no lo repita.
7. **Cron en Vercel = UTC.** PR = UTC-4 sin DST. 5 AM PR → `0 9 * * *`.
8. **Rutas de cron dedicadas** (no query strings): `/api/cron/wins-levelup`, etc.
9. **Dos Valentinas.** Contreras (correcta) = **U08CZV7EL2C** (@valentina, Sales Team Leader). Rodriguez (U091RRM62GH) NO. Elvin = **U08U9777PUY**; DM bot↔Elvin = D0BGHLQVABA; DM Elvin↔Valentina = D08TBNYKQ1H.
10. **Los comandos de la fábrica leen `vault/estilo/*` por NOMBRE EXACTO** (no glob). Un archivo nuevo (ej. angulos-ganadores.md) NO se consume solo — hay que agregar la línea de lectura al comando. `lib/vault.ts` sí hace glob (el portal/Jarvis lo ven auto).
11. **handoff.md y archivos untracked pueden desaparecer** si algún proceso limpia el working tree. Si no está, recrealo desde este contenido (está en la memoria del proyecto lo esencial).

## 7. Referencia (IDs, envs, canales)
- **Slack IDs:** Elvin U08U9777PUY · bot Command Center U0BFPB0SSP4 · Valentina U08CZV7EL2C. Directorio en `lib/equipo-slack.ts`.
- **Canales:** #clientes-wins LU C0B4K58DUSD · #clientes-wins AIB C0BFLDQ8ME1 · #correos-aprobados-email-campaign C0B0WC500EN · DM bot↔Elvin (cola pedidos + briefs) D0BGHLQVABA.
- **Envs** (`.env.local` local + Vercel prod, NUNCA en repo): ANTHROPIC_API_KEY, CEO_PORTAL_PASSWORD (=GyWmD4sOkVcJ405a), CONTENIDO_PORTAL_PASSWORD, SLACK_BOT_TOKEN (xoxb), SLACK_LEVELUP_TOKEN (xoxp user de Elvin — postea "como Elvin"), SLACK_BORINQUEN_TOKEN (xoxp), SLACK_SIGNING_SECRET, SLACK_APROBADOS_WEBHOOK, SLACK_EMAILS_CHANNEL, CRON_SECRET, PIPEDRIVE_*, ZOOM_INTEL_*.
- **Cookie CEO:** `ceo-session` = `sha256(CEO_PORTAL_PASSWORD + "::ceo-portal-v1")`.
- **Deploy:** `npx vercel --prod --yes` o `bash scripts/deploy-snapshots.sh`.

## 8. Patrón de trabajo que funcionó
- **Generar contenido → subagente/Workflow** que escribe JSON a `scratchpad/`, luego mergear con `node -e` que VALIDA (voseo, "gratis", campos, CTA) antes de `push` a `data/entregas.json`, luego `deploy-snapshots.sh`.
- **Mapear/destilar → Workflow** con lectores paralelos (schema estructurado). OJO: el `journal.jsonl` guarda el output del SCHEMA del agente, no los campos que agregás en el `.then()` — para esos, leé el `.output` file del workflow (tiene el `return` completo).
- **Reglas nuevas de Elvin → SIEMPRE a `vault/estilo/`** (permanente) + comando + tarea programada + memoria. El equipo "aprende".
- **Flujo automático → Vercel Cron** (no tarea de Claude) para no depender de la Mac.
- Cada deploy: `tsc --noEmit` + `npm run build` antes de `vercel --prod`.
