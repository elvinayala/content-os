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
